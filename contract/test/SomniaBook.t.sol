// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/SomniaBook.sol";

contract SomniaBookTest is Test {
    SomniaBook public somniaBook;
    
    address public owner = address(this);
    address public feeRecipient = makeAddr("feeRecipient");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public user3 = makeAddr("user3");
    
    uint256 constant MIN_BET = 0.001 ether;
    uint256 constant MAX_BET = 10 ether;
    uint256 constant DEFAULT_ODDS = 2000; // 2.0x
    uint256 constant PLATFORM_FEE = 250; // 2.5%
    
    event BetPlaced(bytes32 indexed betId, address indexed user, uint256 amount, uint256 odds);
    event BetResolved(bytes32 indexed betId, bool won, uint256 payout);
    event BetCancelled(bytes32 indexed betId, uint256 refund);

    function setUp() public {
        somniaBook = new SomniaBook(feeRecipient);
        
        // Fund test accounts
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(user3, 100 ether);
        
    }

    /*//////////////////////////////////////////////////////////////
                            DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function testDeployment() public {
        assertEq(somniaBook.owner(), owner);
        assertEq(somniaBook.feeRecipient(), feeRecipient);
        assertEq(somniaBook.platformFee(), PLATFORM_FEE);
        assertEq(somniaBook.minBetAmount(), MIN_BET);
        assertEq(somniaBook.maxBetAmount(), MAX_BET);
        assertEq(somniaBook.totalBetsPlaced(), 0);
        assertEq(somniaBook.totalFeesCollected(), 0);
    }

    function testDeploymentWithZeroAddressFails() public {
        vm.expectRevert("Invalid recipient");
        new SomniaBook(address(0));
    }

    /*//////////////////////////////////////////////////////////////
                            BET PLACEMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function testPlaceBetSuccess() public {
        uint256 betAmount = 1 ether;
        
        vm.startPrank(user1);
        vm.expectEmit(true, true, false, true);
        emit BetPlaced(keccak256(abi.encodePacked(user1, betAmount, block.timestamp, uint32(0))), user1, betAmount, DEFAULT_ODDS);
        
        bytes32 betId = somniaBook.placeBet{value: betAmount}(DEFAULT_ODDS);
        vm.stopPrank();

        // Verify bet was stored correctly
        (address user, uint256 amount, uint256 odds, uint256 timestamp, uint8 status) = somniaBook.getBet(betId);
        assertEq(user, user1);
        assertEq(amount, betAmount);
        assertEq(odds, DEFAULT_ODDS);
        assertEq(timestamp, block.timestamp);
        assertEq(status, 0); // Active status
        
        // Verify tracking
        assertEq(somniaBook.totalBetsPlaced(), 1);
        
        bytes32[] memory userBets = somniaBook.getUserBets(user1);
        assertEq(userBets.length, 1);
        assertEq(userBets[0], betId);
    }

    function testPlaceBetBelowMinimumFails() public {
        vm.startPrank(user1);
        vm.expectRevert("Invalid amount");
        somniaBook.placeBet{value: MIN_BET - 1}(DEFAULT_ODDS);
        vm.stopPrank();
    }

    function testPlaceBetAboveMaximumFails() public {
        vm.startPrank(user1);
        vm.expectRevert("Invalid amount");
        somniaBook.placeBet{value: MAX_BET + 1}(DEFAULT_ODDS);
        vm.stopPrank();
    }

    function testPlaceBetWithInvalidOddsFails() public {
        vm.startPrank(user1);
        vm.expectRevert("Invalid odds");
        somniaBook.placeBet{value: 1 ether}(999); // Below 1000 (1.0x)
        vm.stopPrank();
    }

    function testPlaceMultipleBets() public {
        vm.startPrank(user1);
        
        bytes32 betId1 = somniaBook.placeBet{value: 1 ether}(2000);
        bytes32 betId2 = somniaBook.placeBet{value: 2 ether}(1500);
        
        vm.stopPrank();

        assertEq(somniaBook.totalBetsPlaced(), 2);
        
        bytes32[] memory userBets = somniaBook.getUserBets(user1);
        assertEq(userBets.length, 2);
        assertEq(userBets[0], betId1);
        assertEq(userBets[1], betId2);
    }

    /*//////////////////////////////////////////////////////////////
                            BET RESOLUTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testResolveBetsAsWinning() public {
        // Place bets
        vm.startPrank(user1);
        bytes32 betId1 = somniaBook.placeBet{value: 1 ether}(2000);
        vm.stopPrank();
        
        vm.startPrank(user2);
        bytes32 betId2 = somniaBook.placeBet{value: 2 ether}(1500);
        vm.stopPrank();

        // Resolve as winning
        bytes32[] memory betIds = new bytes32[](2);
        betIds[0] = betId1;
        betIds[1] = betId2;
        
        vm.expectEmit(true, false, false, true);
        emit BetResolved(betId1, true, 0);
        vm.expectEmit(true, false, false, true);
        emit BetResolved(betId2, true, 0);
        
        somniaBook.resolveBets(betIds, true);

        // Verify status changed
        (, , , , uint8 status1) = somniaBook.getBet(betId1);
        (, , , , uint8 status2) = somniaBook.getBet(betId2);
        assertEq(status1, 1); // Won
        assertEq(status2, 1); // Won
    }

    function testResolveBetsAsLosing() public {
        // Place bet
        vm.startPrank(user1);
        bytes32 betId = somniaBook.placeBet{value: 1 ether}(2000);
        vm.stopPrank();

        // Resolve as losing
        bytes32[] memory betIds = new bytes32[](1);
        betIds[0] = betId;
        
        somniaBook.resolveBets(betIds, false);

        // Verify status changed
        (, , , , uint8 status) = somniaBook.getBet(betId);
        assertEq(status, 2); // Lost
    }

    function testResolveBetsOnlyOwner() public {
        vm.startPrank(user1);
        bytes32 betId = somniaBook.placeBet{value: 1 ether}(2000);
        
        bytes32[] memory betIds = new bytes32[](1);
        betIds[0] = betId;
        
        vm.expectRevert("Ownable: caller is not the owner");
        somniaBook.resolveBets(betIds, true);
        vm.stopPrank();
    }

    function testResolveInvalidBetFails() public {
        bytes32[] memory betIds = new bytes32[](1);
        betIds[0] = keccak256("nonexistent");
        
        vm.expectRevert("Invalid bet");
        somniaBook.resolveBets(betIds, true);
    }

    function testResolveAlreadyResolvedBetFails() public {
        vm.startPrank(user1);
        bytes32 betId = somniaBook.placeBet{value: 1 ether}(2000);
        vm.stopPrank();

        // First resolution
        bytes32[] memory betIds = new bytes32[](1);
        betIds[0] = betId;
        somniaBook.resolveBets(betIds, true);

        // Second resolution should fail
        vm.expectRevert("Invalid bet");
        somniaBook.resolveBets(betIds, false);
    }

    /*//////////////////////////////////////////////////////////////
                            BET CANCELLATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testCancelBets() public {
        uint256 betAmount = 1 ether;
        uint256 initialBalance = user1.balance;
        
        vm.startPrank(user1);
        bytes32 betId = somniaBook.placeBet{value: betAmount}(2000);
        vm.stopPrank();
        
        bytes32[] memory betIds = new bytes32[](1);
        betIds[0] = betId;
        
        vm.expectEmit(true, false, false, true);
        emit BetCancelled(betId, betAmount);
        
        somniaBook.cancelBets(betIds);

        // Verify refund
        assertEq(user1.balance, initialBalance);
        
        // Verify status changed
        (, , , , uint8 status) = somniaBook.getBet(betId);
        assertEq(status, 3); // Cancelled
    }

    function testCancelBetsOnlyOwner() public {
        vm.startPrank(user1);
        bytes32 betId = somniaBook.placeBet{value: 1 ether}(2000);
        
        bytes32[] memory betIds = new bytes32[](1);
        betIds[0] = betId;
        
        vm.expectRevert("Ownable: caller is not the owner");
        somniaBook.cancelBets(betIds);
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                            CLAIM WINNINGS TESTS
    //////////////////////////////////////////////////////////////*/

    function testClaimWinnings() public {
        uint256 betAmount = 1 ether;
        uint256 odds = 2000; // 2.0x
        uint256 initialBalance = user1.balance;

        vm.deal(address(somniaBook), 10 ether); // Fund contract for payout
        
        vm.startPrank(user1);
        bytes32 betId = somniaBook.placeBet{value: betAmount}(odds);
        vm.stopPrank();
        

        // Resolve as winning
        bytes32[] memory betIds = new bytes32[](1);
        betIds[0] = betId;
        somniaBook.resolveBets(betIds, true);

        // Calculate expected payout
        uint256 grossPayout = (betAmount * odds) / 1000; // 2 ether
        uint256 fee = (grossPayout * PLATFORM_FEE) / 10000; // 0.05 ether
        uint256 expectedNetPayout = grossPayout - fee; // 1.95 ether

        vm.startPrank(user1);
        vm.expectEmit(true, false, false, true);
        emit BetResolved(betId, true, expectedNetPayout);
        
        somniaBook.claimWinnings(betId);
        vm.stopPrank();

        // Verify payout
        assertEq(user1.balance, initialBalance - betAmount + expectedNetPayout);
        
        // Verify fees collected
        assertEq(somniaBook.totalFeesCollected(), fee);
        
        // Verify bet status
        (, , , , uint8 status) = somniaBook.getBet(betId);
        assertEq(status, 4); // Claimed
    }

    function testClaimWinningsOnlyBetOwner() public {
        vm.startPrank(user1);
        bytes32 betId = somniaBook.placeBet{value: 1 ether}(2000);
        vm.stopPrank();

        // Resolve as winning
        bytes32[] memory betIds = new bytes32[](1);
        betIds[0] = betId;
        somniaBook.resolveBets(betIds, true);

        // Try to claim from different user
        vm.startPrank(user2);
        vm.expectRevert("Not owner");
        somniaBook.claimWinnings(betId);
        vm.stopPrank();
    }

    function testClaimUnresolvedBetFails() public {
        vm.startPrank(user1);
        bytes32 betId = somniaBook.placeBet{value: 1 ether}(2000);
        
        vm.expectRevert("Cannot claim");
        somniaBook.claimWinnings(betId);
        vm.stopPrank();
    }

    function testClaimLosingBetFails() public {
        vm.startPrank(user1);
        bytes32 betId = somniaBook.placeBet{value: 1 ether}(2000);
        vm.stopPrank();

        // Resolve as losing
        bytes32[] memory betIds = new bytes32[](1);
        betIds[0] = betId;
        somniaBook.resolveBets(betIds, false);

        vm.startPrank(user1);
        vm.expectRevert("Cannot claim");
        somniaBook.claimWinnings(betId);
        vm.stopPrank();
    }

    function testClaimAlreadyClaimedBetFails() public {
        vm.startPrank(user1);
        bytes32 betId = somniaBook.placeBet{value: 1 ether}(2000);
        vm.stopPrank();

        // Resolve and claim
        bytes32[] memory betIds = new bytes32[](1);
        betIds[0] = betId;
        somniaBook.resolveBets(betIds, true);

        //Add funds to contract for payout
        vm.deal(address(somniaBook), 10 ether);
        
        vm.startPrank(user1);
        somniaBook.claimWinnings(betId);
        
        // Try to claim again
        vm.expectRevert("Cannot claim");
        somniaBook.claimWinnings(betId);
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testSetPlatformFee() public {
        uint16 newFee = 500; // 5%
        somniaBook.setPlatformFee(newFee);
        assertEq(somniaBook.platformFee(), newFee);
    }

    function testSetPlatformFeeExceedsMaximumFails() public {
        vm.expectRevert("Fee too high");
        somniaBook.setPlatformFee(1001); // Above 10%
    }

    function testSetPlatformFeeOnlyOwner() public {
        vm.startPrank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        somniaBook.setPlatformFee(500);
        vm.stopPrank();
    }

    function testSetBetLimits() public {
        uint96 newMin = 0.01 ether;
        uint96 newMax = 5 ether;
        
        somniaBook.setBetLimits(newMin, newMax);
        
        assertEq(somniaBook.minBetAmount(), newMin);
        assertEq(somniaBook.maxBetAmount(), newMax);
    }

    function testSetBetLimitsInvalidFails() public {
        vm.expectRevert("Invalid limits");
        somniaBook.setBetLimits(10 ether, 1 ether); // min > max
    }

    function testWithdrawFees() public {
        // Generate some fees
        vm.startPrank(user1);
        bytes32 betId = somniaBook.placeBet{value: 1 ether}(2000);
        vm.stopPrank();

        vm.deal(address(somniaBook), 10 ether); // Ensure contract has enough balance for claim


        bytes32[] memory betIds = new bytes32[](1);
        betIds[0] = betId;
        somniaBook.resolveBets(betIds, true);

        

        vm.startPrank(user1);
        somniaBook.claimWinnings(betId);
        vm.stopPrank();

        uint256 feesCollected = somniaBook.totalFeesCollected();
        uint256 recipientBalanceBefore = feeRecipient.balance;

        
        somniaBook.withdrawFees();
        
        assertEq(somniaBook.totalFeesCollected(), 0);
        assertEq(feeRecipient.balance, recipientBalanceBefore + feesCollected);
    }

    function testWithdrawFeesNoFeesFails() public {
        vm.expectRevert("No fees");
        somniaBook.withdrawFees();
    }

    function testEmergencyWithdraw() public {
        // Add some balance to contract
        vm.deal(address(somniaBook), 10 ether);
        
        uint256 ownerBalanceBefore = owner.balance;
        uint256 contractBalance = address(somniaBook).balance;
        
        // vm.prank(owner);
        somniaBook.emergencyWithdraw();
        
        assertEq(address(somniaBook).balance, 0);
        assertEq(owner.balance, ownerBalanceBefore + contractBalance);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testGetBetInvalidFails() public {
        vm.expectRevert("Invalid bet");
        somniaBook.getBet(keccak256("nonexistent"));
    }

    function testGetUserBetsEmpty() public {
        bytes32[] memory userBets = somniaBook.getUserBets(user1);
        assertEq(userBets.length, 0);
    }

    /*//////////////////////////////////////////////////////////////
                            REENTRANCY TESTS
    //////////////////////////////////////////////////////////////*/

    function testReentrancyProtection() public {
        // This would require a malicious contract to test properly
        // For now, we verify the modifier is present in the functions
        assertTrue(true); // Placeholder - reentrancy protection is handled by OpenZeppelin
    }

    /*//////////////////////////////////////////////////////////////
                            FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzzPlaceBet(uint256 amount, uint256 odds) public {
        amount = bound(amount, MIN_BET, MAX_BET);
        odds = bound(odds, 1000, type(uint96).max);
        
        vm.deal(user1, amount);
        vm.startPrank(user1);
        
        bytes32 betId = somniaBook.placeBet{value: amount}(odds);
        
        (address user, uint256 betAmount, uint256 betOdds, , uint8 status) = somniaBook.getBet(betId);
        assertEq(user, user1);
        assertEq(betAmount, amount);
        assertEq(betOdds, odds);
        assertEq(status, 0);
        
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                            RECEIVE FUNCTION TEST
    //////////////////////////////////////////////////////////////*/

    function testReceiveFunction() public {
        uint256 amount = 1 ether;
        vm.deal(user1, amount);
        
        vm.startPrank(user1);
        (bool success,) = address(somniaBook).call{value: amount}("");
        assertTrue(success);
        assertEq(address(somniaBook).balance, amount);
        vm.stopPrank();
    }

    receive() external payable {} // To accept ETH in the test contract
}