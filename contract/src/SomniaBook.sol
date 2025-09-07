// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/security/ReentrancyGuard.sol";
import "@openzeppelin/access/Ownable.sol";
import "@openzeppelin/security/Pausable.sol";

contract SomniaBook is ReentrancyGuard, Ownable, Pausable {
    
    // Events
    event BetPlaced(
        bytes32 indexed betId,
        address indexed user,
        string marketId,
        string selection,
        uint256 amount,
        uint256 odds,
        uint256 timestamp
    );
    
    event BetResolved(
        bytes32 indexed betId,
        address indexed user,
        bool won,
        uint256 payout
    );
    
    event BetCancelled(bytes32 indexed betId, address indexed user, uint256 refundAmount);
    event FeesWithdrawn(uint256 amount);

    // Structs
    struct Bet {
        address user;           // Who placed the bet
        string marketId;        // External market identifier (from API)
        string selection;       // What user bet on (e.g., "Chelsea", "Over 2.5", "BTC +2%")
        uint256 amount;         // Amount wagered
        uint256 odds;           // Odds when bet was placed (multiplied by 1000)
        uint256 timestamp;      // When bet was placed
        bool resolved;          // Whether outcome is determined
        bool won;              // Whether user won (only valid if resolved)
        bool claimed;          // Whether payout/refund has been claimed
    }

    // State variables
    mapping(bytes32 => Bet) public bets;           // betId => Bet details
    mapping(address => bytes32[]) public userBets; // user => list of bet IDs
    mapping(string => bytes32[]) public marketBets; // marketId => list of bet IDs

    struct MarketResolution {
        string winningSelection;
        bool isResolved;
        bool isCancelled;
        uint256 resolvedAt;
    }

    mapping(string => MarketResolution) public marketResolutions; // marketId => resolution
    
    uint256 public platformFee = 250;              // 2.5% (out of 10000)
    uint256 public constant MAX_FEE = 1000;        // 10% maximum
    uint256 public minBetAmount = 0.001 ether;
    uint256 public maxBetAmount = 10 ether;
    
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

    // Place a bet - anyone can call this
    function placeBet(
        string memory _marketId,
        string memory _selection,
        uint256 _odds
    ) external payable nonReentrant whenNotPaused returns (bytes32 betId) {
        require(msg.sender != address(0), "Invalid sender");
        require(msg.value >= minBetAmount, "Bet amount too small");
        require(msg.value <= maxBetAmount, "Bet amount too large");
        require(_odds >= 1000, "Odds must be at least 1.0x");
        require(bytes(_marketId).length > 0, "Market ID required");
        require(bytes(_selection).length > 0, "Selection required");

        // Generate unique bet ID
        betId = keccak256(abi.encodePacked(
            msg.sender,
            _marketId,
            _selection,
            msg.value,
            block.timestamp,
            totalBetsPlaced
        ));

        // Store bet
        bets[betId] = Bet({
            user: msg.sender,
            marketId: _marketId,
            selection: _selection,
            amount: msg.value,
            odds: _odds,
            timestamp: block.timestamp,
            resolved: false,
            won: false,
            claimed: false
        });

        // Update tracking arrays
        userBets[msg.sender].push(betId);
        marketBets[_marketId].push(betId);
        
        // Update stats
        totalBetsPlaced++;
        totalAmountWagered += msg.value;

        emit BetPlaced(betId, msg.sender, _marketId, _selection, msg.value, _odds, block.timestamp);
    }

    // Backend calls this to resolve winning bets
    function resolveBetsAsWin(bytes32[] calldata _betIds) external onlyOwner {
        for (uint256 i = 0; i < _betIds.length; i++) {
            bytes32 betId = _betIds[i];
            Bet storage bet = bets[betId];
            
            require(bet.user != address(0), "Bet does not exist");
            require(!bet.resolved, "Bet already resolved");
            
            bet.resolved = true;
            bet.won = true;
            
            emit BetResolved(betId, bet.user, true, 0); // Payout calculated during claim
        }
    }

    // Backend Or Oracles calls this to resolve losing bets
    function resolveBetsAsLoss(bytes32[] calldata _betIds) external onlyOwner {
        for (uint256 i = 0; i < _betIds.length; i++) {
            bytes32 betId = _betIds[i];
            Bet storage bet = bets[betId];
            
            require(bet.user != address(0), "Bet does not exist");
            require(!bet.resolved, "Bet already resolved");
            
            bet.resolved = true;
            bet.won = false;
            
            emit BetResolved(betId, bet.user, false, 0);
        }
    }

    // Backend calls this to cancel/refund bets (for cancelled events)
    function cancelBets(bytes32[] calldata _betIds) external onlyOwner {
        for (uint256 i = 0; i < _betIds.length; i++) {
            bytes32 betId = _betIds[i];
            Bet storage bet = bets[betId];
            
            require(bet.user != address(0), "Bet does not exist");
            require(!bet.resolved, "Bet already resolved");
            require(!bet.claimed, "Bet already claimed");
            
            bet.resolved = true;
            bet.claimed = true; // Auto-mark as claimed for refunds
            
            // Send refund immediately
            (bool success, ) = payable(bet.user).call{value: bet.amount}("");
            require(success, "Refund failed");
            
            emit BetCancelled(betId, bet.user, bet.amount);
        }
    }

    // Users call this to claim their winnings
    function claimWinnings(bytes32 _betId) external nonReentrant 
        validBetId(_betId) onlyBetOwner(_betId) {
        
        Bet storage bet = bets[_betId];
        require(bet.resolved, "Bet not resolved yet");
        require(bet.won, "Bet did not win");
        require(!bet.claimed, "Already claimed");
        
        bet.claimed = true;
        
        // Calculate payout: (betAmount * odds) / 1000
        uint256 grossPayout = (bet.amount * bet.odds) / 1000;
        uint256 fee = (grossPayout * platformFee) / 10000;
        uint256 netPayout = grossPayout - fee;
        
        totalFeesCollected += fee;
        
        // Send payout
        (bool success, ) = payable(msg.sender).call{value: netPayout}("");
        require(success, "Payout failed");
        
        emit BetResolved(_betId, msg.sender, true, netPayout);
    }

    // Users can claim multiple winning bets at once
    function claimMultipleWinnings(bytes32[] calldata _betIds) external nonReentrant {
        uint256 totalPayout = 0;
        uint256 totalFees = 0;
        
        for (uint256 i = 0; i < _betIds.length; i++) {
            bytes32 betId = _betIds[i];
            Bet storage bet = bets[betId];
            
            require(bet.user == msg.sender, "Not bet owner");
            require(bet.resolved, "Bet not resolved");
            require(bet.won, "Bet did not win");
            require(!bet.claimed, "Already claimed");
            
            bet.claimed = true;
            
            uint256 grossPayout = (bet.amount * bet.odds) / 1000;
            uint256 fee = (grossPayout * platformFee) / 10000;
            uint256 netPayout = grossPayout - fee;
            
            totalPayout += netPayout;
            totalFees += fee;
            
            emit BetResolved(betId, msg.sender, true, netPayout);
        }
        
        require(totalPayout > 0, "No winnings to claim");
        
        totalFeesCollected += totalFees;
        
        (bool success, ) = payable(msg.sender).call{value: totalPayout}("");
        require(success, "Payout failed");
    }

    // View functions
    function getBet(bytes32 _betId) external view validBetId(_betId) 
        returns (
            address user,
            string memory marketId,
            string memory selection,
            uint256 amount,
            uint256 odds,
            uint256 timestamp,
            bool resolved,
            bool won,
            bool claimed
        ) {
        Bet storage bet = bets[_betId];
        return (
            bet.user,
            bet.marketId,
            bet.selection,
            bet.amount,
            bet.odds,
            bet.timestamp,
            bet.resolved,
            bet.won,
            bet.claimed
        );
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
        grossPayout = (bet.amount * bet.odds) / 1000;
        fee = (grossPayout * platformFee) / 10000;
        netPayout = grossPayout - fee;
    }

    function getUserPendingWinnings(address _user) external view returns (uint256 totalWinnings) {
        bytes32[] memory userBetIds = userBets[_user];
        
        for (uint256 i = 0; i < userBetIds.length; i++) {
            Bet storage bet = bets[userBetIds[i]];
            MarketResolution storage resolution = marketResolutions[bet.marketId];
            
            if (resolution.isResolved && !resolution.isCancelled && !bet.claimed) {
                // Check if bet won
                bool won = keccak256(bytes(bet.selection)) == keccak256(bytes(resolution.winningSelection));
                if (won) {
                    uint256 grossPayout = (bet.amount * bet.odds) / 1000;
                    uint256 fee = (grossPayout * platformFee) / 10000;
                    totalWinnings += grossPayout - fee;
                }
            }
        }
    }

    function getUserPendingRefunds(address _user) external view returns (uint256 totalRefunds) {
        bytes32[] memory userBetIds = userBets[_user];
        
        for (uint256 i = 0; i < userBetIds.length; i++) {
            Bet storage bet = bets[userBetIds[i]];
            MarketResolution storage resolution = marketResolutions[bet.marketId];
            
            if (resolution.isCancelled && !bet.claimed) {
                totalRefunds += bet.amount;
            }
        }
    }

    function isMarketResolved(string memory _marketId) external view returns (bool) {
        return marketResolutions[_marketId].isResolved || marketResolutions[_marketId].isCancelled;
    }

    function getMarketResolution(string memory _marketId) external view 
        returns (
            string memory winningSelection,
            bool isResolved,
            bool isCancelled,
            uint256 resolvedAt
        ) {
        MarketResolution storage resolution = marketResolutions[_marketId];
        return (
            resolution.winningSelection,
            resolution.isResolved,
            resolution.isCancelled,
            resolution.resolvedAt
        );
    }

    // Admin functions
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= MAX_FEE, "Fee too high");
        platformFee = _fee;
    }

    function setBetLimits(uint256 _minBet, uint256 _maxBet) external onlyOwner {
        require(_minBet < _maxBet, "Invalid limits");
        minBetAmount = _minBet;
        maxBetAmount = _maxBet;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid address");
        feeRecipient = _feeRecipient;
    }

    function withdrawFees() external onlyOwner {
        require(totalFeesCollected > 0, "No fees to withdraw");
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        
        (bool success, ) = payable(feeRecipient).call{value: amount}("");
        require(success, "Fee withdrawal failed");
        
        emit FeesWithdrawn(amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency function (use with caution)
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Emergency withdrawal failed");
    }

    // Contract stats
    function getContractStats() external view returns (
        uint256 totalBets,
        uint256 totalWagered,
        uint256 contractBalance,
        uint256 feesCollected
    ) {
        return (
            totalBetsPlaced,
            totalAmountWagered,
            address(this).balance,
            totalFeesCollected
        );
    }

    receive() external payable {
        revert("Direct payments not allowed");
    }
}
