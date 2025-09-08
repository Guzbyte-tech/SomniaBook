// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SomniaBook is ReentrancyGuard, Ownable {
    
    // Events (simplified)
    event BetPlaced(bytes32 indexed betId, address indexed user, uint256 amount, uint256 odds);
    event BetResolved(bytes32 indexed betId, bool won, uint256 payout);
    event BetCancelled(bytes32 indexed betId, uint256 refund);

    // Optimized struct - removed strings, packed better
    struct Bet {
        address user;          // 20 bytes
        uint96 amount;         // 12 bytes (can handle up to ~79 billion ETH)
        uint96 odds;           // 12 bytes 
        uint32 timestamp;      // 4 bytes (good until 2106)
        uint8 status;          // 1 byte: 0=active, 1=won, 2=lost, 3=cancelled, 4=claimed
    }

    // State variables (minimized)
    mapping(bytes32 => Bet) public bets;
    mapping(address => bytes32[]) public userBets;
    
    uint16 public platformFee = 250;              // 2.5% (out of 10000)
    uint96 public minBetAmount = 0.001 ether;     
    uint96 public maxBetAmount = 10 ether;        
    
    address public feeRecipient;
    uint256 public totalFeesCollected;
    uint32 public totalBetsPlaced;

    // Simplified modifiers
    modifier validBet(bytes32 _betId) {
        require(bets[_betId].user != address(0), "Invalid bet");
        _;
    }

    modifier onlyBetOwner(bytes32 _betId) {
        require(bets[_betId].user == msg.sender, "Not owner");
        _;
    }

    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid recipient");
        feeRecipient = _feeRecipient;
    }

    // Simplified bet placement (no market/selection strings)
    function placeBet(uint256 _odds) 
        external payable nonReentrant returns (bytes32 betId) {
        
        require(msg.value >= minBetAmount && msg.value <= maxBetAmount, "Invalid amount");
        require(_odds >= 1000, "Invalid odds");

        betId = keccak256(abi.encodePacked(msg.sender, msg.value, block.timestamp, totalBetsPlaced));

        bets[betId] = Bet({
            user: msg.sender,
            amount: uint96(msg.value),
            odds: uint96(_odds),
            timestamp: uint32(block.timestamp),
            status: 0
        });

        userBets[msg.sender].push(betId);
        totalBetsPlaced++;

        emit BetPlaced(betId, msg.sender, msg.value, _odds);
    }

    // Simplified resolution
    function resolveBets(bytes32[] calldata _betIds, bool _won) external onlyOwner {
        uint256 len = _betIds.length;
        uint8 status = _won ? 1 : 2;
        
        for (uint256 i; i < len;) {
            Bet storage bet = bets[_betIds[i]];
            require(bet.user != address(0) && bet.status == 0, "Invalid bet");
            
            bet.status = status;
            emit BetResolved(_betIds[i], _won, 0);
            
            unchecked { ++i; }
        }
    }

    // Simplified cancellation
    function cancelBets(bytes32[] calldata _betIds) external onlyOwner {
        uint256 len = _betIds.length;
        
        for (uint256 i; i < len;) {
            bytes32 betId = _betIds[i];
            Bet storage bet = bets[betId];
            
            require(bet.user != address(0) && bet.status == 0, "Invalid bet");
            
            bet.status = 3;
            
            (bool success,) = payable(bet.user).call{value: bet.amount}("");
            require(success, "Refund failed");
            
            emit BetCancelled(betId, bet.amount);
            unchecked { ++i; }
        }
    }

    // Simplified claiming
    function claimWinnings(bytes32 _betId) external nonReentrant validBet(_betId) onlyBetOwner(_betId) {
        Bet storage bet = bets[_betId];
        require(bet.status == 1, "Cannot claim");
        
        bet.status = 4;
        
        uint256 gross = (uint256(bet.amount) * bet.odds) / 1000;
        uint256 fee = (gross * platformFee) / 10000;
        uint256 net = gross - fee;
        
        totalFeesCollected += fee;
        
        (bool success,) = payable(msg.sender).call{value: net}("");
        require(success, "Payout failed");
        
        emit BetResolved(_betId, true, net);
    }

    // View functions (simplified)
    function getBet(bytes32 _betId) external view validBet(_betId) 
        returns (address user, uint256 amount, uint256 odds, uint256 timestamp, uint8 status) {
        Bet storage bet = bets[_betId];
        return (bet.user, bet.amount, bet.odds, bet.timestamp, bet.status);
    }

    function getUserBets(address _user) external view returns (bytes32[] memory) {
        return userBets[_user];
    }

    // Admin functions (minimized)
    function setPlatformFee(uint16 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high");
        platformFee = _fee;
    }

    function setBetLimits(uint96 _minBet, uint96 _maxBet) external onlyOwner {
        require(_minBet < _maxBet, "Invalid limits");
        minBetAmount = _minBet;
        maxBetAmount = _maxBet;
    }

    function withdrawFees() external onlyOwner {
        require(totalFeesCollected > 0, "No fees");
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        
        (bool success,) = payable(feeRecipient).call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    function emergencyWithdraw() external onlyOwner {
        (bool success,) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Emergency failed");
    }

    receive() external payable {}
}