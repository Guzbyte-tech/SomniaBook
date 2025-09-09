// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/SomniaBook.sol";

contract SomniaBookTest is Test {
    SomniaBook public betting;
    
    address owner = address(0x1);
    address feeRecipient = address(0x2);
    address user1 = address(0x3);
    address user2 = address(0x4);
    address user3 = address(0x5);
    
    // Test constants
    uint128 constant MIN_BET = 0.001 ether;
    uint128 constant MAX_BET = 10 ether;
    uint256 constant DEFAULT_ODDS = 2000; // 2.0x
    string constant MARKET_ID = "EPL-CHE-MUN-2025";
    string constant SELECTION_CHELSEA = "Chelsea";
    string constant SELECTION_MANCHESTER = "Manchester";
    
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

    function setUp() public {
        vm.prank(owner);
        betting = new SomniaBook(feeRecipient);
        
        // Fund test accounts
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(user3, 100 ether);
    }

    /*//////////////////////////////////////////////////////////////
                            DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function testDeployment() public view {
        assertEq(betting.owner(), owner);
        assertEq(betting.feeRecipient(), feeRecipient);
        assertEq(betting.platformFee(), 250); // 2.5%
        assertEq(betting.minBetAmount(), MIN_BET);
        assertEq(betting.maxBetAmount(), MAX_BET);
        assertEq(betting.totalBetsPlaced(), 0);
        assertEq(betting.totalAmountWagered(), 0);
        assertEq(betting.totalFeesCollected(), 0);
    }

    function testDeploymentWithZeroFeeRecipient() public {
        vm.expectRevert("Invalid fee recipient");
        vm.prank(owner);
        new SomniaBook(address(0));
    }

    /*//////////////////////////////////////////////////////////////
                             PLACE BET TESTS
    //////////////////////////////////////////////////////////////*/

    function testPlaceBetSuccess() public {
        uint256 betAmount = 1 ether;
        
        vm.expectEmit(false, true, false, true);
        emit BetPlaced(
            bytes32(0), // We'll check the actual betId separately
            user1,
            MARKET_ID,
            SELECTION_CHELSEA,
            betAmount,
            DEFAULT_ODDS,
            block.timestamp
        );
        
        vm.prank(user1);
        bytes32 betId = betting.placeBet{value: betAmount}(
            MARKET_ID,
            SELECTION_CHELSEA,
            DEFAULT_ODDS
        );
        
        // Verify bet was stored correctly
        (
            address user,
            string memory marketId,
            string memory selection,
            uint256 amount,
            uint256 odds,
            uint256 timestamp,
            bool resolved,
            bool won,
            bool claimed
        ) = betting.getBet(betId);
        
        assertEq(user, user1);
        assertEq(marketId, MARKET_ID);
        assertEq(selection, SELECTION_CHELSEA);
        assertEq(amount, betAmount);
        assertEq(odds, DEFAULT_ODDS);
        assertEq(timestamp, block.timestamp);
        assertFalse(resolved);
        assertFalse(won);
        assertFalse(claimed);
        
        // Verify contract state updates
        assertEq(betting.totalBetsPlaced(), 1);
        assertEq(betting.totalAmountWagered(), betAmount);
        assertEq(address(betting).balance, betAmount);
        
        // Verify user bets tracking
        bytes32[] memory userBets = betting.getUserBets(user1);
        assertEq(userBets.length, 1);
        assertEq(userBets[0], betId);
        
        // Verify market bets tracking
        bytes32[] memory marketBets = betting.getMarketBets(MARKET_ID);
        assertEq(marketBets.length, 1);
        assertEq(marketBets[0], betId);
    }

    function testPlaceBetTooSmall() public {
        uint256 betAmount = MIN_BET - 1;
        
        vm.expectRevert("Invalid bet amount");
        vm.prank(user1);
        betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, DEFAULT_ODDS);
    }

    function testPlaceBetTooLarge() public {
        uint256 betAmount = MAX_BET + 1;
        
        vm.expectRevert("Invalid bet amount");
        vm.prank(user1);
        betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, DEFAULT_ODDS);
    }

    // function testPlaceBetInvalidOdds() public {
    //     uint256 betAmount = 1 ether;
    //     uint256 invalidOdds = 999; // Less than 1.0x
        
    //     vm.expectRevert("Odds must be at least 1.0x");
    //     vm.prank(user1);
    //     betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, invalidOdds);
    // }

    function testPlaceBetEmptyMarketId() public {
        uint256 betAmount = 1 ether;
        
        vm.expectRevert("Invalid market or selection");
        vm.prank(user1);
        betting.placeBet{value: betAmount}("", SELECTION_CHELSEA, DEFAULT_ODDS);
    }

    function testPlaceBetEmptySelection() public {
        uint256 betAmount = 1 ether;
        
        vm.expectRevert("Invalid market or selection");
        vm.prank(user1);
        betting.placeBet{value: betAmount}(MARKET_ID, "", DEFAULT_ODDS);
    }

    function testPlaceBetWhenPaused() public {
        vm.prank(owner);
        betting.pause();
        
        uint256 betAmount = 1 ether;
        
        vm.expectRevert("Pausable: paused");
        vm.prank(user1);
        betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, DEFAULT_ODDS);
    }

    function testPlaceMultipleBets() public {
        uint256 betAmount1 = 1 ether;
        uint256 betAmount2 = 2 ether;
        
        vm.prank(user1);
        bytes32 betId1 = betting.placeBet{value: betAmount1}(
            MARKET_ID,
            SELECTION_CHELSEA,
            DEFAULT_ODDS
        );
        
        vm.prank(user2);
        bytes32 betId2 = betting.placeBet{value: betAmount2}(
            MARKET_ID,
            SELECTION_MANCHESTER,
            1500 // 1.5x odds
        );
        
        assertEq(betting.totalBetsPlaced(), 2);
        assertEq(betting.totalAmountWagered(), betAmount1 + betAmount2);
        assertEq(address(betting).balance, betAmount1 + betAmount2);
        
        // Verify different bet IDs
        assertTrue(betId1 != betId2);
    }

    /*//////////////////////////////////////////////////////////////
                           BET RESOLUTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testResolveBetsAsWin() public {
        // Place bets
        uint256 betAmount = 1 ether;
        vm.prank(user1);
        bytes32 betId1 = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, DEFAULT_ODDS);
        
        vm.prank(user2);
        bytes32 betId2 = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, 1500);
        
        // Resolve as wins using the new combined function
        bytes32[] memory winningBets = new bytes32[](2);
        winningBets[0] = betId1;
        winningBets[1] = betId2;
        
        vm.expectEmit(true, true, false, true);
        emit BetResolved(betId1, user1, true, 0);
        
        vm.expectEmit(true, true, false, true);
        emit BetResolved(betId2, user2, true, 0);
        
        vm.prank(owner);
        betting.resolveBets(winningBets, true); // true = winning bets
        
        // Check bet states
        (, , , , , , bool resolved1, bool won1, ) = betting.getBet(betId1);
        (, , , , , , bool resolved2, bool won2, ) = betting.getBet(betId2);
        
        assertTrue(resolved1);
        assertTrue(won1);
        assertTrue(resolved2);
        assertTrue(won2);
    }

    function testResolveBetsAsLoss() public {
        // Place bet
        uint256 betAmount = 1 ether;
        vm.prank(user1);
        bytes32 betId = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, DEFAULT_ODDS);
        
        // Resolve as loss using the new combined function
        bytes32[] memory losingBets = new bytes32[](1);
        losingBets[0] = betId;
        
        vm.expectEmit(true, true, false, true);
        emit BetResolved(betId, user1, false, 0);
        
        vm.prank(owner);
        betting.resolveBets(losingBets, false); // false = losing bets
        
        // Check bet state
        (, , , , , , bool resolved, bool won, ) = betting.getBet(betId);
        assertTrue(resolved);
        assertFalse(won);
    }

    function testResolveNonExistentBet() public {
        bytes32 fakeBetId = keccak256("fake");
        bytes32[] memory bets = new bytes32[](1);
        bets[0] = fakeBetId;
        
        vm.expectRevert("Invalid or resolved bet");
        vm.prank(owner);
        betting.resolveBets(bets, true);
    }

    function testResolveAlreadyResolvedBet() public {
        // Place and resolve bet
        uint256 betAmount = 1 ether;
        vm.prank(user1);
        bytes32 betId = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, DEFAULT_ODDS);
        
        bytes32[] memory bets = new bytes32[](1);
        bets[0] = betId;
        
        vm.prank(owner);
        betting.resolveBets(bets, true);
        
        // Try to resolve again
        vm.expectRevert("Invalid or resolved bet");
        vm.prank(owner);
        betting.resolveBets(bets, true);
    }

    function testResolveUnauthorized() public {
        uint256 betAmount = 1 ether;
        vm.prank(user1);
        bytes32 betId = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, DEFAULT_ODDS);
        
        bytes32[] memory bets = new bytes32[](1);
        bets[0] = betId;
        
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(user1);
        betting.resolveBets(bets, true);
    }

    /*//////////////////////////////////////////////////////////////
                           BET CANCELLATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testCancelBets() public {
        uint256 betAmount = 1 ether;
        uint256 initialBalance = user1.balance;
        
        vm.prank(user1);
        bytes32 betId = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, DEFAULT_ODDS);
        
        bytes32[] memory bets = new bytes32[](1);
        bets[0] = betId;
        
        vm.expectEmit(true, true, false, true);
        emit BetCancelled(betId, user1, betAmount);
        
        vm.prank(owner);
        betting.cancelBets(bets);
        
        // Check bet state
        (, , , , , , bool resolved, , bool claimed) = betting.getBet(betId);
        assertTrue(resolved);
        assertTrue(claimed);
        
        // Check refund
        assertEq(user1.balance, initialBalance);
        assertEq(address(betting).balance, 0);
    }

    function testCancelAlreadyResolvedBet() public {
        uint256 betAmount = 1 ether;
        vm.prank(user1);
        bytes32 betId = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, DEFAULT_ODDS);
        
        // Resolve first
        bytes32[] memory bets = new bytes32[](1);
        bets[0] = betId;
        vm.prank(owner);
        betting.resolveBets(bets, true);
        
        // Try to cancel
        vm.expectRevert("Invalid bet state");
        vm.prank(owner);
        betting.cancelBets(bets);
    }

    /*//////////////////////////////////////////////////////////////
                           CLAIM WINNINGS TESTS
    //////////////////////////////////////////////////////////////*/

    function testClaimWinnings() public {
        uint256 betAmount = 1 ether;
        uint256 odds = 2000; // 2.0x
        uint256 initialBalance = user1.balance;
        
        vm.prank(user1);
        bytes32 betId = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, odds);

        vm.deal(address(betting), 10 ether);
        
        // Resolve as win
        bytes32[] memory bets = new bytes32[](1);
        bets[0] = betId;
        vm.prank(owner);
        betting.resolveBets(bets, true);
        
        // Calculate expected payout
        uint256 grossPayout = (betAmount * odds) / 1000; // 2 ether
        uint256 fee = (grossPayout * 250) / 10000; // 2.5% of 2 ether = 0.05 ether
        uint256 netPayout = grossPayout - fee; // 1.95 ether
        
        vm.expectEmit(true, true, false, true);
        emit BetResolved(betId, user1, true, netPayout);
        
        vm.prank(user1);
        betting.claimWinnings(betId);
        
        // Check bet state
        (, , , , , , , , bool claimed) = betting.getBet(betId);
        assertTrue(claimed);
        
        // Check balances
        assertEq(user1.balance, initialBalance - betAmount + netPayout);
        assertEq(betting.totalFeesCollected(), fee);
    }

    function testClaimWinningsNotOwner() public {
        uint256 betAmount = 1 ether;
        vm.prank(user1);
        bytes32 betId = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, DEFAULT_ODDS);
        
        // Resolve as win
        bytes32[] memory bets = new bytes32[](1);
        bets[0] = betId;
        vm.prank(owner);
        betting.resolveBets(bets, true);
        
        vm.expectRevert("Not bet owner");
        vm.prank(user2);
        betting.claimWinnings(betId);
    }

    function testClaimWinningsNotResolved() public {
        uint256 betAmount = 1 ether;
        vm.prank(user1);
        bytes32 betId = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, DEFAULT_ODDS);
        
        vm.expectRevert("Cannot claim");
        vm.prank(user1);
        betting.claimWinnings(betId);
    }

    function testClaimWinningsLosingBet() public {
        uint256 betAmount = 1 ether;
        vm.prank(user1);
        bytes32 betId = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, DEFAULT_ODDS);
        
        // Resolve as loss
        bytes32[] memory bets = new bytes32[](1);
        bets[0] = betId;
        vm.prank(owner);
        betting.resolveBets(bets, false);
        
        vm.expectRevert("Cannot claim");
        vm.prank(user1);
        betting.claimWinnings(betId);
    }

    function testClaimWinningsAlreadyClaimed() public {
        uint256 betAmount = 1 ether;
        vm.prank(user1);
        bytes32 betId = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, DEFAULT_ODDS);

        vm.deal(address(betting), 10 ether);
        
        // Resolve and claim
        bytes32[] memory bets = new bytes32[](1);
        bets[0] = betId;
        vm.prank(owner);
        betting.resolveBets(bets, true);
        
        vm.prank(user1);
        betting.claimWinnings(betId);
        
        // Try to claim again
        vm.expectRevert("Cannot claim");
        vm.prank(user1);
        betting.claimWinnings(betId);
    }

    function testClaimMultipleWinnings() public {
        uint256 betAmount = 1 ether;
        
        // Place multiple bets
        vm.prank(user1);
        bytes32 betId1 = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, 2000);
        
        vm.prank(user1);
        bytes32 betId2 = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, 1500);
        
        // Resolve as wins
        bytes32[] memory bets = new bytes32[](2);
        bets[0] = betId1;
        bets[1] = betId2;
        vm.prank(owner);
        betting.resolveBets(bets, true);
        
        // Top up Contract funds to pay users
        vm.deal(address(betting), 10 ether);

        // Claim multiple
        uint256 initialBalance = user1.balance;
        vm.prank(user1);
        betting.claimMultipleWinnings(bets);
        
        // Calculate expected total payout
        uint256 grossPayout1 = (betAmount * 2000) / 1000; // 2 ether
        uint256 fee1 = (grossPayout1 * 250) / 10000;
        uint256 netPayout1 = grossPayout1 - fee1;
        
        uint256 grossPayout2 = (betAmount * 1500) / 1000; // 1.5 ether
        uint256 fee2 = (grossPayout2 * 250) / 10000;
        uint256 netPayout2 = grossPayout2 - fee2;
        
        uint256 totalNetPayout = netPayout1 + netPayout2;
        uint256 totalFees = fee1 + fee2;
        
        assertEq(user1.balance, initialBalance + totalNetPayout);
        assertEq(betting.totalFeesCollected(), totalFees);
    }

    function testClaimMultipleWinningsWithMixedResults() public {
        uint256 betAmount = 1 ether;
        
        vm.prank(user1);
        bytes32 betId1 = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, 2000);
        
        vm.prank(user1);
        bytes32 betId2 = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_MANCHESTER, 1500);
        
        // Resolve one as win, one as loss
        bytes32[] memory winningBets = new bytes32[](1);
        winningBets[0] = betId1;
        vm.prank(owner);
        betting.resolveBets(winningBets, true);
        
        bytes32[] memory losingBets = new bytes32[](1);
        losingBets[0] = betId2;
        vm.prank(owner);
        betting.resolveBets(losingBets, false);
        
        // Try to claim both - should revert on losing bet
        bytes32[] memory allBets = new bytes32[](2);
        allBets[0] = betId1;
        allBets[1] = betId2;
        
        vm.expectRevert("Cannot claim bet");
        vm.prank(user1);
        betting.claimMultipleWinnings(allBets);
    }

    /*//////////////////////////////////////////////////////////////
                             VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testCalculatePayout() public {
        uint256 betAmount = 1 ether;
        uint256 odds = 2500; // 2.5x
        
        vm.prank(user1);
        bytes32 betId = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, odds);
        
        (uint256 grossPayout, uint256 fee, uint256 netPayout) = betting.calculatePayout(betId);
        
        uint256 expectedGross = (betAmount * odds) / 1000; // 2.5 ether
        uint256 expectedFee = (expectedGross * 250) / 10000; // 2.5% of 2.5 ether
        uint256 expectedNet = expectedGross - expectedFee;
        
        assertEq(grossPayout, expectedGross);
        assertEq(fee, expectedFee);
        assertEq(netPayout, expectedNet);
    }

    /*//////////////////////////////////////////////////////////////
                           EDGE CASE TESTS
    //////////////////////////////////////////////////////////////*/

    function testMultipleUsersMultipleMarkets() public {
        string memory market1 = "CRYPTO-BTC-USD";
        string memory market2 = "NBA-LAL-GSW";
        
        // User1 bets on market1
        vm.prank(user1);
        bytes32 betId1 = betting.placeBet{value: 1 ether}(market1, "BTC Up", 1500);
        
        // User2 bets on market2
        vm.prank(user2);
        bytes32 betId2 = betting.placeBet{value: 2 ether}(market2, "Lakers", 2000);
        
        // User1 bets on market2
        vm.prank(user1);
        bytes32 betId3 = betting.placeBet{value: 0.5 ether}(market2, "Warriors", 1800);
        
        // Verify market tracking
        bytes32[] memory market1Bets = betting.getMarketBets(market1);
        bytes32[] memory market2Bets = betting.getMarketBets(market2);
        
        assertEq(market1Bets.length, 1);
        assertEq(market2Bets.length, 2);
        assertEq(market1Bets[0], betId1);
        assertTrue(market2Bets[0] == betId2 || market2Bets[1] == betId2);
        assertTrue(market2Bets[0] == betId3 || market2Bets[1] == betId3);
        
        // Verify user tracking
        bytes32[] memory user1Bets = betting.getUserBets(user1);
        bytes32[] memory user2Bets = betting.getUserBets(user2);
        
        assertEq(user1Bets.length, 2);
        assertEq(user2Bets.length, 1);
    }

    function testHighOddsPayout() public {
        uint256 betAmount = 1 ether;
        uint256 highOdds = 10000; // 10x odds
        
        vm.prank(user1);
        bytes32 betId = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, highOdds);

        vm.deal(address(betting), 1000 ether);
        
        // Resolve as win
        bytes32[] memory bets = new bytes32[](1);
        bets[0] = betId;
        vm.prank(owner);
        betting.resolveBets(bets, true);
        
        uint256 initialBalance = user1.balance;
        vm.prank(user1);
        betting.claimWinnings(betId);
        
        // Calculate expected payout
        uint256 grossPayout = (betAmount * highOdds) / 1000; // 10 ether
        uint256 fee = (grossPayout * 250) / 10000; // 2.5% of 10 ether = 0.25 ether
        uint256 netPayout = grossPayout - fee; // 9.75 ether
        
        assertEq(user1.balance, initialBalance + netPayout);
        assertEq(betting.totalFeesCollected(), fee);
    }

    function testMinimumOddsPayout() public {
        uint256 betAmount = 1 ether;
        uint256 minOdds = 1000; // 1x odds (break even)
        
        vm.prank(user1);
        bytes32 betId = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, minOdds);
        
        // Resolve as win
        bytes32[] memory bets = new bytes32[](1);
        bets[0] = betId;
        vm.prank(owner);
        betting.resolveBets(bets, true);
        
        uint256 initialBalance = user1.balance;
        vm.prank(user1);
        betting.claimWinnings(betId);
        
        // Calculate expected payout
        uint256 grossPayout = (betAmount * minOdds) / 1000; // 1 ether
        uint256 fee = (grossPayout * 250) / 10000; // 2.5% of 1 ether = 0.025 ether
        uint256 netPayout = grossPayout - fee; // 0.975 ether
        
        assertEq(user1.balance, initialBalance + netPayout);
        // User actually loses 0.025 ether due to fees on 1x odds
        assertTrue(netPayout < betAmount);
    }

    function testLargeBatchResolution() public {
        uint256 batchSize = 50;
        bytes32[] memory betIds = new bytes32[](batchSize);
        
        // Place many bets
        for (uint256 i = 0; i < batchSize; i++) {
            vm.prank(user1);
            betIds[i] = betting.placeBet{value: 0.1 ether}(
                string(abi.encodePacked("MARKET-", vm.toString(i))),
                "Selection",
                1500
            );
        }

        vm.deal(address(betting), 1000 ether);
        
        // Resolve all as wins
        vm.prank(owner);
        betting.resolveBets(betIds, true);
        
        // Verify all resolved
        for (uint256 i = 0; i < batchSize; i++) {
            (, , , , , , bool resolved, bool won, ) = betting.getBet(betIds[i]);
            assertTrue(resolved);
            assertTrue(won);
        }
        
        // Claim all at once
        vm.prank(user1);
        betting.claimMultipleWinnings(betIds);
        
        // Verify all claimed
        for (uint256 i = 0; i < batchSize; i++) {
            (, , , , , , , , bool claimed) = betting.getBet(betIds[i]);
            assertTrue(claimed);
        }
    }

    function testZeroValueOperations() public {
        // Test with minimum possible values
        uint256 minBet = betting.minBetAmount();
        uint256 minOdds = 1000;
        
        vm.prank(user1);
        bytes32 betId = betting.placeBet{value: minBet}(MARKET_ID, SELECTION_CHELSEA, minOdds);
        
        (uint256 grossPayout, uint256 fee, uint256 netPayout) = betting.calculatePayout(betId);
        
        // Even with minimum values, calculations should work
        assertEq(grossPayout, minBet); // 1x odds
        assertTrue(fee <= grossPayout); // Fee shouldn't exceed payout
        assertEq(netPayout, grossPayout - fee);
    }

    /*//////////////////////////////////////////////////////////////
                           PAUSE/UNPAUSE TESTS
    //////////////////////////////////////////////////////////////*/

    function testPauseUnpause() public {
        // Test pause
        vm.prank(owner);
        betting.pause();
        assertTrue(betting.paused());
        
        // Should not be able to place bets when paused
        vm.expectRevert("Pausable: paused");
        vm.prank(user1);
        betting.placeBet{value: 1 ether}(MARKET_ID, SELECTION_CHELSEA, DEFAULT_ODDS);
        
        // Test unpause
        vm.prank(owner);
        betting.unpause();
        assertFalse(betting.paused());
        
        // Should be able to place bets when unpaused
        vm.prank(user1);
        betting.placeBet{value: 1 ether}(MARKET_ID, SELECTION_CHELSEA, DEFAULT_ODDS);
    }

    function testPauseUnauthorized() public {
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(user1);
        betting.pause();
    }

    /*//////////////////////////////////////////////////////////////
                           EMERGENCY WITHDRAW TESTS
    //////////////////////////////////////////////////////////////*/

    function testEmergencyWithdraw() public {
        // Place some bets to fund the contract
        vm.prank(user1);
        betting.placeBet{value: 5 ether}(MARKET_ID, SELECTION_CHELSEA, DEFAULT_ODDS);
        
        vm.prank(user2);
        betting.placeBet{value: 3 ether}(MARKET_ID, SELECTION_MANCHESTER, 1500);
        
        uint256 contractBalance = address(betting).balance;
        uint256 ownerInitialBalance = owner.balance;
        
        vm.prank(owner);
        betting.emergencyWithdraw();
        
        assertEq(address(betting).balance, 0);
        assertEq(owner.balance, ownerInitialBalance + contractBalance);
    }

    function testEmergencyWithdrawUnauthorized() public {
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(user1);
        betting.emergencyWithdraw();
    }

    /*//////////////////////////////////////////////////////////////
                           CONTRACT SIZE TESTS
    //////////////////////////////////////////////////////////////*/

    function testContractSizeOptimization() public view {
        // This test verifies that the optimized contract compiles and deploys
        // The fact that setUp() succeeded means the contract is within size limits
        assertTrue(address(betting) != address(0));
        
        // Verify basic functionality works
        assertEq(betting.platformFee(), 250);
        assertEq(betting.MAX_FEE(), 1000);
        assertEq(betting.owner(), owner);
    }


    /*//////////////////////////////////////////////////////////////
                           ADMIN FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testSetBetLimits() public {
        uint128 newMinBet = 0.01 ether;
        uint128 newMaxBet = 100 ether;
        
        vm.prank(owner);
        betting.setBetLimits(newMinBet, newMaxBet);
        
        assertEq(betting.minBetAmount(), newMinBet);
        assertEq(betting.maxBetAmount(), newMaxBet);
    }

    function testSetBetLimitsInvalid() public {
        uint128 minBet = 1 ether;
        uint128 maxBet = 0.5 ether; // max < min
        
        vm.expectRevert("Invalid limits");
        vm.prank(owner);
        betting.setBetLimits(minBet, maxBet);
    }

    function testWithdrawFees() public {
        uint256 betAmount = 1 ether;
        uint256 initialRecipientBalance = feeRecipient.balance;
        
        // Place and resolve bet to generate fees
        vm.prank(user1);
        bytes32 betId = betting.placeBet{value: betAmount}(MARKET_ID, SELECTION_CHELSEA, 2000);
        
        vm.deal(address(betting), 10 ether);
        
        bytes32[] memory bets = new bytes32[](1);
        bets[0] = betId;
        vm.prank(owner);
        betting.resolveBets(bets, true);
        
        vm.prank(user1);
        betting.claimWinnings(betId);
        
        uint256 feesCollected = betting.totalFeesCollected();
        assertTrue(feesCollected > 0);
        
        vm.expectEmit(false, false, false, true);
        emit FeesWithdrawn(feesCollected);
        
        vm.prank(owner);
        betting.withdrawFees();
        
        assertEq(feeRecipient.balance, initialRecipientBalance + feesCollected);
        assertEq(betting.totalFeesCollected(), 0);
    }

    function testWithdrawFeesNoFees() public {
        vm.expectRevert("No fees");
        vm.prank(owner);
        betting.withdrawFees();
    }

    /*//////////////////////////////////////////////////////////////
                           INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testCompleteWorkflow() public {
        // Complete betting workflow test
        uint256 betAmount1 = 1 ether;
        uint256 betAmount2 = 2 ether;
        uint256 initialUser1Balance = user1.balance;
        uint256 initialUser2Balance = user2.balance;
        uint256 initialFeeRecipientBalance = feeRecipient.balance;
        
        // Step 1: Place bets
        vm.prank(user1);
        bytes32 betId1 = betting.placeBet{value: betAmount1}(MARKET_ID, SELECTION_CHELSEA, 2000);
        
        vm.prank(user2);
        bytes32 betId2 = betting.placeBet{value: betAmount2}(MARKET_ID, SELECTION_MANCHESTER, 1500);
        
        // Verify contract state
        assertEq(betting.totalBetsPlaced(), 2);
        assertEq(betting.totalAmountWagered(), betAmount1 + betAmount2);
        assertEq(address(betting).balance, betAmount1 + betAmount2);
        
        // Step 2: Resolve bets (user1 wins, user2 loses)
        bytes32[] memory winningBets = new bytes32[](1);
        winningBets[0] = betId1;
        vm.prank(owner);
        betting.resolveBets(winningBets, true);
        
        bytes32[] memory losingBets = new bytes32[](1);
        losingBets[0] = betId2;
        vm.prank(owner);
        betting.resolveBets(losingBets, false);
        
        // Step 3: User1 claims winnings
        vm.prank(user1);
        betting.claimWinnings(betId1);
        
        // Step 4: Verify final balances
        uint256 grossPayout = (betAmount1 * 2000) / 1000; // 2 ether
        uint256 fee = (grossPayout * 250) / 10000; // 0.05 ether
        uint256 netPayout = grossPayout - fee; // 1.95 ether
        
        assertEq(user1.balance, initialUser1Balance - betAmount1 + netPayout);
        assertEq(user2.balance, initialUser2Balance - betAmount2); // Lost bet
        assertEq(betting.totalFeesCollected(), fee);
        
        // Step 5: Owner withdraws fees
        vm.prank(owner);
        betting.withdrawFees();
        
        assertEq(feeRecipient.balance, initialFeeRecipientBalance + fee);
        assertEq(betting.totalFeesCollected(), 0);
        
        // Final contract balance should be the losing bet amount
        assertEq(address(betting).balance, 1 ether);
    }

    /*//////////////////////////////////////////////////////////////
                           GAS OPTIMIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testGasUsageBatchResolve() public {
        // Place 10 bets
        bytes32[] memory betIds = new bytes32[](10);
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(user1);
            betIds[i] = betting.placeBet{value: 1 ether}(
                string(abi.encodePacked("MARKET-", vm.toString(i))),
                "Selection",
                2000
            );
        }
        
        uint256 gasBefore = gasleft();
        vm.prank(owner);
        betting.resolveBets(betIds, true);
        uint256 gasUsed = gasBefore - gasleft();
        
        // Batch resolution should be efficient
        assertTrue(gasUsed < 500000, "Batch resolve uses too much gas");
    }

}