// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/security/ReentrancyGuard.sol";
import "@openzeppelin/access/Ownable.sol";
import "@openzeppelin/security/Pausable.sol";

contract SomniaBook is ReentrancyGuard, Ownable, Pausable {
    
    // Events
    event BetPlaced(bytes32 indexed betId, address indexed user, string marketId, string selection, uint256 amount, uint256 odds, uint256 timestamp);
    event BetResolved(bytes32 indexed betId, address indexed user, bool won, uint256 payout);
    event BetCancelled(bytes32 indexed betId, address indexed user, uint256 refundAmount);
    event FeesWithdrawn(uint256 amount);

    // Packed struct for gas optimization
    struct Bet {
        address user;          
        uint128 amount;        
        uint128 odds;          
        uint64 timestamp;      
        bool resolved;         
        bool won;              
        bool claimed;         
        string marketId;        
        string selection;      
    }

    // State variables
    mapping(bytes32 => Bet) public bets;
    mapping(address => bytes32[]) public userBets;
    mapping(string => bytes32[]) public marketBets;
    
    uint256 public platformFee = 250;              // 2.5% (out of 10000)
    uint256 public constant MAX_FEE = 1000;        // 10% maximum
    uint128 public minBetAmount = 0.001 ether;     
    uint128 public maxBetAmount = 10 ether;        
    
    address public feeRecipient;
    uint256 public totalFeesCollected;
    uint256 public totalBetsPlaced;
    uint256 public totalAmountWagered;

    // Modifiers
    modifier validBetId(bytes32 _betId) {
        require(bets[_betId].user != address(0), "Bet does not exist");
        _;
    }

    modifier onlyBetOwner(bytes32 _betId) {
        require(bets[_betId].user == msg.sender, "Not bet owner");
        _;
    }

    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    // Place a bet
    function placeBet(string calldata _marketId, string calldata _selection, uint256 _odds) 
        external payable nonReentrant whenNotPaused returns (bytes32 betId) {
        
        require(msg.value >= minBetAmount && msg.value <= maxBetAmount, "Invalid bet amount");
        // require(_odds >= 1000, "Odds must be at least 1.0x");
        require(bytes(_marketId).length > 0 && bytes(_selection).length > 0, "Invalid market or selection");

        // Generate unique bet ID
        betId = keccak256(abi.encodePacked(msg.sender, _marketId, _selection, msg.value, block.timestamp, totalBetsPlaced));

        // Store bet
        bets[betId] = Bet({
            user: msg.sender,
            marketId: _marketId,
            selection: _selection,
            amount: uint128(msg.value),
            odds: uint128(_odds),
            timestamp: uint64(block.timestamp),
            resolved: false,
            won: false,
            claimed: false
        });

        // Update tracking
        userBets[msg.sender].push(betId);
        marketBets[_marketId].push(betId);
        
        // unchecked {
            totalBetsPlaced++;
            totalAmountWagered += msg.value;
        // }

        emit BetPlaced(betId, msg.sender, _marketId, _selection, msg.value, _odds, block.timestamp);
    }

    // Resolve bets as win/loss
    function resolveBets(bytes32[] calldata _betIds, bool _won) external onlyOwner {
        uint256 length = _betIds.length;
        for (uint256 i; i < length;) {
            Bet storage bet = bets[_betIds[i]];
            require(bet.user != address(0) && !bet.resolved, "Invalid or resolved bet");
            
            bet.resolved = true;
            bet.won = _won;
            
            emit BetResolved(_betIds[i], bet.user, _won, 0);
            ++i;
            // unchecked { ++i; }
        }
    }

    // Cancel/refund bets
    function cancelBets(bytes32[] calldata _betIds) external onlyOwner {
        uint256 length = _betIds.length;
        for (uint256 i; i < length;) {
            bytes32 betId = _betIds[i];
            Bet storage bet = bets[betId];
            
            require(bet.user != address(0) && !bet.resolved && !bet.claimed, "Invalid bet state");
            
            bet.resolved = true;
            bet.claimed = true;
            
            // Send refund
            (bool success,) = payable(bet.user).call{value: bet.amount}("");
            require(success, "Refund failed");
            
            emit BetCancelled(betId, bet.user, bet.amount);
            ++i; 
            // unchecked { ++i; }
        }
    }

    // Claim single winning
    function claimWinnings(bytes32 _betId) external nonReentrant validBetId(_betId) onlyBetOwner(_betId) {
        Bet storage bet = bets[_betId];
        require(bet.resolved && bet.won && !bet.claimed, "Cannot claim");
        
        bet.claimed = true;
        
        uint256 grossPayout = (uint256(bet.amount) * bet.odds) / 1000;
        uint256 fee = (grossPayout * platformFee) / 10000;
        uint256 netPayout = grossPayout - fee;
        
        totalFeesCollected += fee;
        
        (bool success,) = payable(msg.sender).call{value: netPayout}("");
        require(success, "Payout failed");
        
        emit BetResolved(_betId, msg.sender, true, netPayout);
    }

    // Claim multiple winnings
    function claimMultipleWinnings(bytes32[] calldata _betIds) external nonReentrant {
        uint256 totalPayout;
        uint256 totalFees;
        uint256 length = _betIds.length;
        
        for (uint256 i = 0; i < length; i++) {
            Bet storage bet = bets[_betIds[i]];
            require(bet.user == msg.sender && bet.resolved && bet.won && !bet.claimed, "Cannot claim bet");
            
            bet.claimed = true;
            
            uint256 grossPayout = (uint256(bet.amount) * bet.odds) / 1000;
            uint256 fee = (grossPayout * platformFee) / 10000;
            
            totalPayout += grossPayout - fee;
            totalFees += fee;
            
            emit BetResolved(_betIds[i], msg.sender, true, grossPayout - fee);
        }
        
        require(totalPayout > 0, "No winnings");
        totalFeesCollected += totalFees;
        
        (bool success,) = payable(msg.sender).call{value: totalPayout}("");
        require(success, "Payout failed");
    }

    // View functions
    function getBet(bytes32 _betId) external view validBetId(_betId) 
        returns (address user, string memory marketId, string memory selection, uint256 amount, uint256 odds, uint256 timestamp, bool resolved, bool won, bool claimed) {
        Bet storage bet = bets[_betId];
        return (bet.user, bet.marketId, bet.selection, bet.amount, bet.odds, bet.timestamp, bet.resolved, bet.won, bet.claimed);
    }

    function getUserBets(address _user) external view returns (bytes32[] memory) {
        return userBets[_user];
    }

    function getMarketBets(string memory _marketId) external view returns (bytes32[] memory) {
        return marketBets[_marketId];
    }

    function calculatePayout(bytes32 _betId) external view validBetId(_betId) 
        returns (uint256 grossPayout, uint256 fee, uint256 netPayout) {
        Bet storage bet = bets[_betId];
        grossPayout = (uint256(bet.amount) * bet.odds) / 1000;
        fee = (grossPayout * platformFee) / 10000;
        netPayout = grossPayout - fee;
    }

    // Admin functions
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= MAX_FEE, "Fee too high");
        platformFee = _fee;
    }

    function setBetLimits(uint128 _minBet, uint128 _maxBet) external onlyOwner {
        require(_minBet < _maxBet, "Invalid limits");
        minBetAmount = _minBet;
        maxBetAmount = _maxBet;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid address");
        feeRecipient = _feeRecipient;
    }

    function withdrawFees() external onlyOwner {
        require(totalFeesCollected > 0, "No fees");
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        
        (bool success,) = payable(feeRecipient).call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit FeesWithdrawn(amount);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function emergencyWithdraw() external onlyOwner {
        (bool success,) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Emergency withdrawal failed");
    }

    function getContractStats() external view returns (uint256 totalBets, uint256 totalWagered, uint256 contractBalance, uint256 feesCollected) {
        return (totalBetsPlaced, totalAmountWagered, address(this).balance, totalFeesCollected);
    }

    receive() external payable {}
}
