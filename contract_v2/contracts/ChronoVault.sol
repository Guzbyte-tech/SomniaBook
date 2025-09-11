// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChronoVault
 * @dev Decentralized time-locked multisig vault system for Somnia network
 * @notice Allows users/DAOs to lock tokens that can only be unlocked by majority signatures after a time/block condition
 */
contract ChronoVault is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct Vault {
        uint256 id;
        string name;
        address creator;
        address[] signers;
        uint8 requiredSignatures;
        address tokenAddress; // address(0) for native tokens
        uint256 amount;
        uint256 unlockTimestamp;
        uint256 unlockBlockHeight;
        bool useBlockNumber;
        bool isUnlocked;
        bool isWithdrawn;
        mapping(address => bool) hasSigned;
        uint256 currentSignatures;
        uint256 createdAt;
    }

    struct VaultInfo {
        uint256 id;
        string name;
        address creator;
        address[] signers;
        uint8 requiredSignatures;
        address tokenAddress;
        uint256 amount;
        uint256 unlockTimestamp;
        uint256 unlockBlockHeight;
        bool useBlockNumber;
        bool isUnlocked;
        bool isWithdrawn;
        uint256 currentSignatures;
        uint256 createdAt;
    }

    mapping(uint256 => Vault) public vaults;
    mapping(address => uint256[]) public userVaults;
    mapping(address => uint256[]) public signerVaults;

    // vaultId => signer => approved
    mapping(uint256 => mapping(address => bool)) private _approvals;
    
    // fast access: vaultId => signer => isSigner
    mapping(uint256 => mapping(address => bool)) private _isSigner;

    
    uint256 public nextVaultId = 1;
    uint256 public totalVaults;
    uint256 public constant MAX_SIGNERS = 50;
    uint256 public constant MIN_LOCK_TIME = 1 hours;
    uint256 public constant MIN_BLOCK_LOCK_TIME = 1 hours;
    
    // Platform fee (in basis points, 100 = 1%)
    uint256 public platformFee = 50; // 0.5%
    uint256 public penaltyFee = 500; // 5% penalty for emergency withdrawal

    address public feeRecipient;
    
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
    
    modifier onlyVaultSigner(uint256 vaultId) {
        require(_isSigner[vaultId][msg.sender], "Not a signer");
        _;
    }
    
    modifier vaultExists(uint256 vaultId) {
        require(vaultId < nextVaultId && vaultId > 0, "Vault does not exist");
        _;
    }
    
    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient != address(0) ? _feeRecipient : msg.sender;
    }
    
    /**
     * @dev Create a new time-locked multisig vault
     * @param name Human-readable name for the vault
     * @param signers Array of authorized signer addresses
     * @param requiredSignatures Minimum signatures needed to unlock
     * @param tokenAddress Token contract address (address(0) for native tokens)
     * @param amount Amount of tokens to lock
     * @param unlockTimestamp Timestamp after which vault can be unlocked
     * @param unlockBlockHeight Block height after which vault can be unlocked
     * @param useBlockNumber If true, use block height for unlock condition; otherwise use timestamp
     */
    function createVault(
        string memory name,
        address[] memory signers,
        uint8 requiredSignatures,
        bool useBlockNumber,
        address tokenAddress,
        uint256 amount,
        uint256 unlockTimestamp,
        uint256 unlockBlockHeight
    ) external payable nonReentrant returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(signers.length > 0 && signers.length <= MAX_SIGNERS, "Invalid signers count");
        require(requiredSignatures > 0 && requiredSignatures <= signers.length, "Invalid required signatures");
        require(amount > 0, "Amount must be greater than 0");

        if (useBlockNumber) {
            require(
                unlockBlockHeight > block.number && 
                unlockBlockHeight > block.number + (MIN_BLOCK_LOCK_TIME / 13), // Approx. 13s per block
                "Lock block height too low"
            );
        } else {
            require(
                unlockTimestamp > block.timestamp, "Lock time too short"
            );
        }
        

        // Transfer tokens to contract
       _handleTokenTransfer(tokenAddress, amount);

        uint256 vaultId =nextVaultId++;
        Vault storage vault = vaults[vaultId];

        vault.id = vaultId;
        vault.name = name;
        vault.creator = msg.sender;
        vault.requiredSignatures = requiredSignatures;
        vault.tokenAddress = tokenAddress;
        vault.amount = amount;
        vault.unlockTimestamp = unlockTimestamp;
        vault.unlockBlockHeight = unlockBlockHeight;
        vault.useBlockNumber = useBlockNumber;
        vault.createdAt = block.timestamp;

        // Validate signers
        for (uint8 i = 0; i < signers.length; i++) {
            require(signers[i] != address(0), "Invalid signer address");
            require(!_isSigner[vaultId][signers[i]], "Duplicate signer");
            _isSigner[vaultId][signers[i]] = true;
            vault.signers.push(signers[i]);
            signerVaults[signers[i]].push(vaultId);
        }
        
        // Update tracking
        userVaults[msg.sender].push(vaultId);
        totalVaults++;
        
        emit VaultCreated(
            vaultId,
            msg.sender,
            name,
            tokenAddress,
            amount,
            unlockTimestamp,
            useBlockNumber
        );
        
        return vaultId;
    }

    function _handleTokenTransfer(address tokenAddress, uint256 amount) internal {
        if (tokenAddress == address(0)) {
            require(msg.value == amount, "Incorrect native token amount");
        } else {
            require(msg.value == 0, "No native tokens needed for ERC20");
            IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), amount);
        }
    }
    
    /**
     * @dev Sign a vault to approve unlocking
     * @param vaultId ID of the vault to sign
     */
    function signVault(uint256 vaultId) external vaultExists(vaultId) onlyVaultSigner(vaultId) {
        Vault storage vault = vaults[vaultId];
        require(vault.creator != address(0), "Vault not found");
        require(!vault.isWithdrawn, "Vault already withdrawn");
        require(!vault.hasSigned[msg.sender], "Already signed");
        
        vault.hasSigned[msg.sender] = true;
        vault.currentSignatures++;
        
        if (vault.currentSignatures >= vault.requiredSignatures && canUnlock(vaultId)) {
            vault.isUnlocked = true;
            emit VaultUnlocked(vaultId);
        }
        
        emit VaultSigned(vaultId, msg.sender, vault.currentSignatures);
    }
    
    /**
     * @dev Withdraw tokens from an unlocked vault
     * @param vaultId ID of the vault to withdraw from
     * @param recipient Address to receive the tokens
     */
    function withdrawVault(uint256 vaultId, address payable recipient) external vaultExists(vaultId) nonReentrant {
        Vault storage vault = vaults[vaultId];
        require(vault.isUnlocked, "Vault not unlocked");
        require(!vault.isWithdrawn, "Already withdrawn");
        require(recipient != address(0), "Invalid recipient");
        
        // Only signers or creator can withdraw
        require(
            isVaultSigner(vaultId, msg.sender) || msg.sender == vault.creator,
            "Not authorized to withdraw"
        );
        
        vault.isWithdrawn = true;
        
        uint256 feeAmount = (vault.amount * platformFee) / 10000;
        uint256 withdrawAmount = vault.amount - feeAmount;
        
        // Transfer tokens
        if (vault.tokenAddress == address(0)) {
            if (feeAmount > 0) {
                (bool success, ) = feeRecipient.call{value: feeAmount}("");
                require(success, "Fee transfer failed");
            }
            (bool ok, ) = recipient.call{value: withdrawAmount}("");
            require(ok, "Withdrawal Failed");
        } else {
            if (feeAmount > 0) {
                IERC20(vault.tokenAddress).safeTransfer(feeRecipient, feeAmount);
            }
            IERC20(vault.tokenAddress).safeTransfer(recipient, withdrawAmount);
        }
        
        emit VaultWithdrawn(vaultId, recipient, withdrawAmount);
    }
    
    /**
     * @dev Emergency withdraw for vault creator (with penalty)
     * @param vaultId ID of the vault
     */
    function emergencyWithdraw(uint256 vaultId) external vaultExists(vaultId) nonReentrant {
        Vault storage vault = vaults[vaultId];
        require(msg.sender == vault.creator, "Only creator can emergency withdraw");
        require(!vault.isWithdrawn, "Already withdrawn");
        
        vault.isWithdrawn = true;
        
        // Higher fee for emergency withdrawal (5%)
        uint256 penaltyAmount = (vault.amount * penaltyFee) / 10000;
        uint256 withdrawAmount = vault.amount - penaltyAmount;
        
        if (vault.tokenAddress == address(0)) {
            (bool ok, ) = feeRecipient.call{value: penaltyAmount}("");
            require(ok, "Penalty transfer failed");
            
            (bool success, ) = msg.sender.call{value: withdrawAmount}("");
            require(success, "Withdrawal Failed");

        } else {
            IERC20(vault.tokenAddress).safeTransfer(feeRecipient, penaltyAmount);
            IERC20(vault.tokenAddress).safeTransfer(msg.sender, withdrawAmount);
        }
        
        emit EmergencyWithdraw(vaultId, msg.sender, withdrawAmount);
    }

    
    /**
     * @dev Check if vault can be unlocked based on time/block conditions
     * @param vaultId ID of the vault
     */
    function canUnlock(uint256 vaultId) public view vaultExists(vaultId) returns (bool) {
        Vault storage vault = vaults[vaultId];
        
        if(vault.useBlockNumber) {
            return block.number >= vault.unlockBlockHeight;
        } else {
            return block.timestamp >= vault.unlockTimestamp;
        }
        
    }
    
    /**
     * @dev Check if address is a valid signer for vault
     */
    function isVaultSigner(uint256 vaultId, address signer) public view vaultExists(vaultId) returns (bool) {
        return _isSigner[vaultId][signer];
    }
    
    /**
     * @dev Get complete vault information
     */
    function getVault(uint256 vaultId) external view vaultExists(vaultId) returns (VaultInfo memory) {
        Vault storage vault = vaults[vaultId];
        
        return VaultInfo({
            id: vault.id,
            name: vault.name,
            creator: vault.creator,
            signers: vault.signers,
            requiredSignatures: vault.requiredSignatures,
            tokenAddress: vault.tokenAddress,
            amount: vault.amount,
            unlockTimestamp: vault.unlockTimestamp,
            unlockBlockHeight: vault.unlockBlockHeight,
            useBlockNumber: vault.useBlockNumber,
            isUnlocked: vault.isUnlocked,
            isWithdrawn: vault.isWithdrawn,
            currentSignatures: vault.currentSignatures,
            createdAt: vault.createdAt
        });
    }
    
    /**
     * @dev Get vaults created by user
     */
    function getUserVaults(address user) external view returns (uint256[] memory) {
        return userVaults[user];
    }
    
    /**
     * @dev Get vaults where user is a signer
     */
    function getSignerVaults(address signer) external view returns (uint256[] memory) {
        return signerVaults[signer];
    }
    
    /**
     * @dev Check if user has signed a specific vault
     */
    function hasUserSigned(uint256 vaultId, address user) external view vaultExists(vaultId) returns (bool) {
        return vaults[vaultId].hasSigned[user];
    }
    
    /**
     * @dev Get vault signing status
     */
    function getVaultSigningStatus(uint256 vaultId) external view vaultExists(vaultId) returns (
        uint256 currentSignatures,
        uint256 requiredSignatures,
        bool canUnlockNow,
        bool isUnlocked
    ) {
        Vault storage vault = vaults[vaultId];
        return (
            vault.currentSignatures,
            vault.requiredSignatures,
            canUnlock(vaultId),
            vault.isUnlocked
        );
    }
    
    // Admin functions
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = newFee;
    }

    function setPenaltyFee(uint256 newFee) external onlyOwner {
        require(newFee <= 2000, "Penalty fee too high"); // Max 20%
        penaltyFee = newFee;
    }
    
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        feeRecipient = newRecipient;
    }
    
    /**
     * @dev Get contract stats
     */
    function getStats() external view returns (
        uint256 totalVaultsCount,
        uint256 totalValueLocked,
        uint256 activeVaults
    ) {
        uint256 tvl = 0;
        uint256 active = 0;
        
        for (uint256 i = 1; i < nextVaultId; i++) {
            if (!vaults[i].isWithdrawn) {
                if (vaults[i].tokenAddress == address(0)) {
                    tvl += vaults[i].amount;
                }
                active++;
            }
        }
        
        return (totalVaults, tvl, active);
    }


    receive() external payable {}
}