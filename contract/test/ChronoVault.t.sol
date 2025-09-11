// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/ChronoVault.sol";
import "@openzeppelin/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract ChronoVaultTest is Test {
    ChronoVault public chronoVault;
    MockERC20 public mockToken;
    
    address public owner = address(0x1);
    address public feeRecipient = address(0x2);
    address public creator = address(0x3);
    address public signer1 = address(0x4);
    address public signer2 = address(0x5);
    address public signer3 = address(0x6);
    address public recipient = address(0x7);
    address public nonSigner = address(0x8);

    uint256 public constant VAULT_AMOUNT = 1000 ether;
    uint256 public constant TOKEN_AMOUNT = 1000 * 10**18;

    event VaultCreated(
        uint256 indexed vaultId,
        address indexed creator,
        string name,
        address tokenAddress,
        uint256 amount,
        uint256 unlockTimestamp,
        bool useBlockNumber
    );
    
    event VaultSigned(uint256 indexed vaultId, address indexed signer, uint256 currentSignatures);
    event VaultUnlocked(uint256 indexed vaultId);
    event VaultWithdrawn(uint256 indexed vaultId, address indexed recipient, uint256 amount);
    event EmergencyWithdraw(uint256 indexed vaultId, address indexed creator, uint256 amount);

    function setUp() public {
        vm.prank(owner);
        chronoVault = new ChronoVault(feeRecipient);
        
        mockToken = new MockERC20("Test Token", "TEST");
        
        // Give tokens to creator for testing
        mockToken.mint(creator, TOKEN_AMOUNT * 10);
        
        // Give ETH to creator for testing
        vm.deal(creator, 10000 ether);
        vm.deal(signer1, 1 ether);
        vm.deal(signer2, 1 ether);
        vm.deal(signer3, 1 ether);
    }

    function testConstructor() public {
        assertEq(chronoVault.owner(), owner);
        assertEq(chronoVault.feeRecipient(), feeRecipient);
        assertEq(chronoVault.nextVaultId(), 1);
        assertEq(chronoVault.totalVaults(), 0);
        assertEq(chronoVault.platformFee(), 50); // 0.5%
        assertEq(chronoVault.penaltyFee(), 500); // 5%
    }

    function testCreateVaultWithETH() public {
        address[] memory signers = new address[](3);
        signers[0] = signer1;
        signers[1] = signer2;
        signers[2] = signer3;

        uint256 unlockTime = block.timestamp + 2 days;

        vm.prank(creator);
        vm.expectEmit(true, true, false, true);
        emit VaultCreated(1, creator, "Test Vault", address(0), VAULT_AMOUNT, unlockTime, false);
        
        uint256 vaultId = chronoVault.createVault{value: VAULT_AMOUNT}(
            "Test Vault",
            signers,
            2, // require 2 signatures
            false, // use timestamp
            address(0), // ETH
            VAULT_AMOUNT,
            unlockTime,
            0
        );

        assertEq(vaultId, 1);
        assertEq(chronoVault.totalVaults(), 1);
        assertEq(address(chronoVault).balance, VAULT_AMOUNT);

        ChronoVault.VaultInfo memory vaultInfo = chronoVault.getVault(vaultId);
        assertEq(vaultInfo.id, 1);
        assertEq(vaultInfo.name, "Test Vault");
        assertEq(vaultInfo.creator, creator);
        assertEq(vaultInfo.signers.length, 3);
        assertEq(vaultInfo.requiredSignatures, 2);
        assertEq(vaultInfo.tokenAddress, address(0));
        assertEq(vaultInfo.amount, VAULT_AMOUNT);
        assertEq(vaultInfo.unlockTimestamp, unlockTime);
        assertFalse(vaultInfo.useBlockNumber);
        assertFalse(vaultInfo.isUnlocked);
        assertFalse(vaultInfo.isWithdrawn);
        assertEq(vaultInfo.currentSignatures, 0);
    }

    function testCreateVaultWithERC20() public {
        address[] memory signers = new address[](2);
        signers[0] = signer1;
        signers[1] = signer2;

        uint256 unlockTime = block.timestamp + 1 days;

        vm.startPrank(creator);
        mockToken.approve(address(chronoVault), TOKEN_AMOUNT);
        
        uint256 vaultId = chronoVault.createVault(
            "Token Vault",
            signers,
            1, // require 1 signature
            false, // use timestamp
            address(mockToken),
            TOKEN_AMOUNT,
            unlockTime,
            0
        );
        vm.stopPrank();

        assertEq(vaultId, 1);
        assertEq(mockToken.balanceOf(address(chronoVault)), TOKEN_AMOUNT);

        ChronoVault.VaultInfo memory vaultInfo = chronoVault.getVault(vaultId);
        assertEq(vaultInfo.tokenAddress, address(mockToken));
        assertEq(vaultInfo.amount, TOKEN_AMOUNT);
    }

    function testCreateVaultWithBlockNumber() public {
        address[] memory signers = new address[](2);
        signers[0] = signer1;
        signers[1] = signer2;

        uint256 unlockBlock = block.number + 1000;

        vm.prank(creator);
        uint256 vaultId = chronoVault.createVault{value: VAULT_AMOUNT}(
            "Block Vault",
            signers,
            2,
            true, // use block number
            address(0),
            VAULT_AMOUNT,
            0,
            unlockBlock
        );

        ChronoVault.VaultInfo memory vaultInfo = chronoVault.getVault(vaultId);
        assertTrue(vaultInfo.useBlockNumber);
        assertEq(vaultInfo.unlockBlockHeight, unlockBlock);
    }

    function testCreateVaultFailures() public {
        address[] memory signers = new address[](2);
        signers[0] = signer1;
        signers[1] = signer2;

        uint256 unlockTime = block.timestamp + 1 days;

        // Empty name
        vm.prank(creator);
        vm.expectRevert("Name cannot be empty");
        chronoVault.createVault{value: VAULT_AMOUNT}(
            "",
            signers,
            2,
            false,
            address(0),
            VAULT_AMOUNT,
            unlockTime,
            0
        );

        // No signers
        address[] memory emptySigners = new address[](0);
        vm.prank(creator);
        vm.expectRevert("Invalid signers count");
        chronoVault.createVault{value: VAULT_AMOUNT}(
            "Test",
            emptySigners,
            1,
            false,
            address(0),
            VAULT_AMOUNT,
            unlockTime,
            0
        );

        // Required signatures too high
        vm.prank(creator);
        vm.expectRevert("Invalid required signatures");
        chronoVault.createVault{value: VAULT_AMOUNT}(
            "Test",
            signers,
            3, // more than signers length
            false,
            address(0),
            VAULT_AMOUNT,
            unlockTime,
            0
        );

        // Zero amount
        vm.prank(creator);
        vm.expectRevert("Amount must be greater than 0");
        chronoVault.createVault{value: VAULT_AMOUNT}(
            "Test",
            signers,
            2,
            false,
            address(0),
            0,
            unlockTime,
            0
        );

        // Past unlock time
        vm.prank(creator);
        vm.expectRevert("Lock time too short");
        chronoVault.createVault{value: VAULT_AMOUNT}(
            "Test",
            signers,
            2,
            false,
            address(0),
            VAULT_AMOUNT,
            block.timestamp - 1,
            0
        );

        // Incorrect ETH amount
        vm.prank(creator);
        vm.expectRevert("Incorrect native token amount");
        chronoVault.createVault{value: VAULT_AMOUNT + 1}(
            "Test",
            signers,
            2,
            false,
            address(0),
            VAULT_AMOUNT,
            unlockTime,
            0
        );
    }

    function testSignVault() public {
        uint256 vaultId = _createTestVault();

        // First signature
        vm.prank(signer1);
        vm.expectEmit(true, true, false, true);
        emit VaultSigned(vaultId, signer1, 1);
        chronoVault.signVault(vaultId);

        assertTrue(chronoVault.hasUserSigned(vaultId, signer1));
        assertFalse(chronoVault.hasUserSigned(vaultId, signer2));

        (uint256 current, uint256 required, bool canUnlockNow, bool isUnlocked) = 
            chronoVault.getVaultSigningStatus(vaultId);
        assertEq(current, 1);
        assertEq(required, 2);
        assertFalse(canUnlockNow); // time hasn't passed
        assertFalse(isUnlocked);
    }

    function testVaultUnlockWithSignatures() public {
        uint256 vaultId = _createTestVault();

        // Move time forward
        vm.warp(block.timestamp + 3 days);

        // First signature
        vm.prank(signer1);
        chronoVault.signVault(vaultId);

        // Second signature should unlock the vault
        vm.prank(signer2);
        vm.expectEmit(true, false, false, false);
        emit VaultUnlocked(vaultId);
        chronoVault.signVault(vaultId);

        ChronoVault.VaultInfo memory vaultInfo = chronoVault.getVault(vaultId);
        assertTrue(vaultInfo.isUnlocked);
        assertEq(vaultInfo.currentSignatures, 2);
    }

    function testSignVaultFailures() public {
        uint256 vaultId = _createTestVault();

        // Non-signer tries to sign
        vm.prank(nonSigner);
        vm.expectRevert("Not a signer");
        chronoVault.signVault(vaultId);

        // Sign twice
        vm.prank(signer1);
        chronoVault.signVault(vaultId);
        
        vm.prank(signer1);
        vm.expectRevert("Already signed");
        chronoVault.signVault(vaultId);

        // Invalid vault ID
        vm.prank(signer1);
        vm.expectRevert("Vault does not exist");
        chronoVault.signVault(999);
    }

    function testWithdrawVault() public {
        uint256 vaultId = _createAndUnlockVault();

        uint256 initialBalance = recipient.balance;
        uint256 feeAmount = (VAULT_AMOUNT * 50) / 10000; // 0.5% fee
        uint256 expectedWithdraw = VAULT_AMOUNT - feeAmount;

        vm.prank(signer1);
        vm.expectEmit(true, true, false, true);
        emit VaultWithdrawn(vaultId, recipient, expectedWithdraw);
        chronoVault.withdrawVault(vaultId, payable(recipient));

        assertEq(recipient.balance, initialBalance + expectedWithdraw);
        assertEq(feeRecipient.balance, feeAmount);

        ChronoVault.VaultInfo memory vaultInfo = chronoVault.getVault(vaultId);
        assertTrue(vaultInfo.isWithdrawn);
    }

    function testWithdrawVaultERC20() public {
        address[] memory signers = new address[](2);
        signers[0] = signer1;
        signers[1] = signer2;

        vm.startPrank(creator);
        mockToken.approve(address(chronoVault), TOKEN_AMOUNT);
        uint256 vaultId = chronoVault.createVault(
            "Token Vault",
            signers,
            1,
            false,
            address(mockToken),
            TOKEN_AMOUNT,
            block.timestamp + 1 days,
            0
        );
        vm.stopPrank();

        // Move time forward and sign
        vm.warp(block.timestamp + 2 days);
        vm.prank(signer1);
        chronoVault.signVault(vaultId);

        uint256 feeAmount = (TOKEN_AMOUNT * 50) / 10000;
        uint256 expectedWithdraw = TOKEN_AMOUNT - feeAmount;

        vm.prank(signer1);
        chronoVault.withdrawVault(vaultId, payable(recipient));

        assertEq(mockToken.balanceOf(recipient), expectedWithdraw);
        assertEq(mockToken.balanceOf(feeRecipient), feeAmount);
    }

    function testWithdrawVaultFailures() public {
        uint256 vaultId = _createTestVault();

        // Try to withdraw before unlocking
        vm.prank(signer1);
        vm.expectRevert("Vault not unlocked");
        chronoVault.withdrawVault(vaultId, payable(recipient));

        // Unlock the vault
        uint256 unlockedVaultId = _createAndUnlockVault();

        // Non-authorized person tries to withdraw
        vm.prank(nonSigner);
        vm.expectRevert("Not authorized to withdraw");
        chronoVault.withdrawVault(unlockedVaultId, payable(recipient));

        // Withdraw with zero address
        vm.prank(signer1);
        vm.expectRevert("Invalid recipient");
        chronoVault.withdrawVault(unlockedVaultId, payable(address(0)));

        // Successful withdrawal
        vm.prank(signer1);
        chronoVault.withdrawVault(unlockedVaultId, payable(recipient));

        // Try to withdraw again
        vm.prank(signer2);
        vm.expectRevert("Already withdrawn");
        chronoVault.withdrawVault(unlockedVaultId, payable(recipient));
    }

    function testCreatorEmergencyWithdraw() public {

        console.log("Contract Balance Before: ", address(chronoVault).balance);
        uint256 vaultId = _createTestVault();
        console.log("Contract Balance After Vault Creation: ", address(chronoVault).balance);

        uint256 initialBalance = creator.balance;
        uint256 penaltyAmount = (VAULT_AMOUNT * 500) / 10000; // 5% penalty
        uint256 expectedWithdraw = VAULT_AMOUNT - penaltyAmount;

        vm.prank(creator);
        vm.expectEmit(true, true, false, true);
        emit EmergencyWithdraw(vaultId, creator, expectedWithdraw);
        chronoVault.emergencyWithdraw(vaultId);
        console.log("Contract Balance After Emergency Withdraw: ", address(chronoVault).balance);
        


        assertEq(creator.balance, initialBalance + expectedWithdraw);
        assertEq(feeRecipient.balance, penaltyAmount);

        ChronoVault.VaultInfo memory vaultInfo = chronoVault.getVault(vaultId);
        assertTrue(vaultInfo.isWithdrawn);
    }

    function testEmergencyWithdrawFailures() public {
        uint256 vaultId = _createTestVault();

        // Non-creator tries emergency withdraw
        vm.prank(signer1);
        vm.expectRevert("Only creator can emergency withdraw");
        chronoVault.emergencyWithdraw(vaultId);

        // Emergency withdraw
        vm.prank(creator);
        chronoVault.emergencyWithdraw(vaultId);

        // Try again after already withdrawn
        vm.prank(creator);
        vm.expectRevert("Already withdrawn");
        chronoVault.emergencyWithdraw(vaultId);
    }

    function testCanUnlock() public {
        uint256 vaultId = _createTestVault();

        assertFalse(chronoVault.canUnlock(vaultId));

        vm.warp(block.timestamp + 3 days);
        assertTrue(chronoVault.canUnlock(vaultId));
    }

    function testCanUnlockWithBlockNumber() public {
        address[] memory signers = new address[](2);
        signers[0] = signer1;
        signers[1] = signer2;

        uint256 unlockBlock = block.number + 1000;

        vm.prank(creator);
        uint256 vaultId = chronoVault.createVault{value: VAULT_AMOUNT}(
            "Block Vault",
            signers,
            2,
            true,
            address(0),
            VAULT_AMOUNT,
            0,
            unlockBlock
        );

        assertFalse(chronoVault.canUnlock(vaultId));

        vm.roll(unlockBlock);
        assertTrue(chronoVault.canUnlock(vaultId));
    }

    function testIsVaultSigner() public {
        uint256 vaultId = _createTestVault();

        assertTrue(chronoVault.isVaultSigner(vaultId, signer1));
        assertTrue(chronoVault.isVaultSigner(vaultId, signer2));
        assertTrue(chronoVault.isVaultSigner(vaultId, signer3));
        assertFalse(chronoVault.isVaultSigner(vaultId, nonSigner));
        assertFalse(chronoVault.isVaultSigner(vaultId, creator));
    }

    function testGetUserVaults() public {
        uint256 vaultId1 = _createTestVault();
        
        address[] memory signers = new address[](1);
        signers[0] = signer1;
        
        vm.prank(creator);
        uint256 vaultId2 = chronoVault.createVault{value: VAULT_AMOUNT}(
            "Second Vault",
            signers,
            1,
            false,
            address(0),
            VAULT_AMOUNT,
            block.timestamp + 1 days,
            0
        );

        uint256[] memory userVaults = chronoVault.getUserVaults(creator);
        assertEq(userVaults.length, 2);
        assertEq(userVaults[0], vaultId1);
        assertEq(userVaults[1], vaultId2);
    }

    function testGetSignerVaults() public {
        uint256 vaultId = _createTestVault();

        uint256[] memory signerVaults = chronoVault.getSignerVaults(signer1);
        assertEq(signerVaults.length, 1);
        assertEq(signerVaults[0], vaultId);

        uint256[] memory nonSignerVaults = chronoVault.getSignerVaults(nonSigner);
        assertEq(nonSignerVaults.length, 0);
    }

    function testAdminFunctions() public {
        // Set platform fee
        vm.prank(owner);
        chronoVault.setPlatformFee(100); // 1%
        assertEq(chronoVault.platformFee(), 100);

        // Set penalty fee
        vm.prank(owner);
        chronoVault.setPenaltyFee(1000); // 10%
        assertEq(chronoVault.penaltyFee(), 1000);

        // Set fee recipient
        address newRecipient = address(0x999);
        vm.prank(owner);
        chronoVault.setFeeRecipient(newRecipient);
        assertEq(chronoVault.feeRecipient(), newRecipient);
    }

    function testAdminFunctionFailures() public {
        // Non-owner tries to set fees
        vm.prank(creator);
        vm.expectRevert("Ownable: caller is not the owner");
        chronoVault.setPlatformFee(100);

        // Fee too high
        vm.prank(owner);
        vm.expectRevert("Fee too high");
        chronoVault.setPlatformFee(1001); // > 10%

        // Penalty fee too high
        vm.prank(owner);
        vm.expectRevert("Penalty fee too high");
        chronoVault.setPenaltyFee(2001); // > 20%

        // Invalid fee recipient
        vm.prank(owner);
        vm.expectRevert("Invalid recipient");
        chronoVault.setFeeRecipient(address(0));
    }

    function testGetStats() public {
        _createTestVault();
        _createTestVault();

        (uint256 totalVaultsCount, uint256 totalValueLocked, uint256 activeVaults) = 
            chronoVault.getStats();

        assertEq(totalVaultsCount, 2);
        assertEq(totalValueLocked, VAULT_AMOUNT * 2);
        assertEq(activeVaults, 2);

        // Withdraw one vault
        uint256 vaultId = _createAndUnlockVault();
        vm.prank(signer1);
        chronoVault.withdrawVault(vaultId, payable(recipient));

        (totalVaultsCount, totalValueLocked, activeVaults) = chronoVault.getStats();
        assertEq(totalVaultsCount, 3);
        assertEq(activeVaults, 2); // One withdrawn
    }

    // Helper functions
    function _createTestVault() internal returns (uint256) {
        address[] memory signers = new address[](3);
        signers[0] = signer1;
        signers[1] = signer2;
        signers[2] = signer3;

        vm.prank(creator);
        return chronoVault.createVault{value: VAULT_AMOUNT}(
            "Test Vault",
            signers,
            2, // require 2 signatures
            false, // use timestamp
            address(0), // ETH
            VAULT_AMOUNT,
            block.timestamp + 2 days,
            0
        );
    }

    function _createAndUnlockVault() internal returns (uint256) {
        uint256 vaultId = _createTestVault();
        
        // Move time forward
        vm.warp(block.timestamp + 3 days);
        
        // Get required signatures
        vm.prank(signer1);
        chronoVault.signVault(vaultId);
        
        vm.prank(signer2);
        chronoVault.signVault(vaultId);
        
        return vaultId;
    }

    receive() external payable {}
}