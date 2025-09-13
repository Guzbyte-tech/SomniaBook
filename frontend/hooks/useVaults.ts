import { useAppKitAccount } from "@reown/appkit/react";
import { useContract } from "./useContract";
import { VaultStruct } from "@/types/vault";
import { TransactionResponse } from "ethers";

export function useVaults() {
  const { address, isConnected } = useAppKitAccount();
  const { readContract, writeContract } = useContract();

  // Fetch vault IDs created by user
  const fetchUserVaults = async (): Promise<bigint[]> => {
    if (!address) return [];
    return await readContract("getUserVaults", [address]);
  };

  // Fetch vault IDs where user is signer
  const fetchSignerVaults = async (): Promise<bigint[]> => {
    if (!address) return [];
    return await readContract("getSignerVaults", [address]);
  };

  // Fetch full vault details by ID
  const fetchVault = async (vaultId: bigint) => {
    return await readContract("getVault", [vaultId]);
    // return await readContract<VaultStruct>("vaults", [vaultId]);
  };

  const getVaultInfo = async (vaultId: bigint) => {
    return await readContract("vaults", [vaultId]);
  };

  const signerInfo = async (vaultId: bigint) => {
    const {id, name, creator, signers, requiredSignatures, tokenAddress, amount, unlockTimestamp, unlockBlockHeight, useBlockNumber, isUnlocked, isWithdrawn, hasSigned,currentSignatures, createdAt} = await getVaultInfo(vaultId);
    return {
      requiredSignatures: Number(requiredSignatures),
      signers,
      totalApproved: currentSignatures,
      hasSigned
    };
  };

  const hasSignedVault = async (vaulId: bigint, address: string) => {
    const result = await readContract("isSigned", [vaulId, address]);
    return Boolean(result);
  }

  // Combined: all vaults where user is creator or signer
  const fetchAllVaults = async () => {
    if (!isConnected || !address) return [];

    const [userIds, signerIds] = await Promise.all([
      fetchUserVaults(),
      fetchSignerVaults(),
    ]);

    // Merge + deduplicate vault IDs
    const vaultIds = Array.from(new Set([...userIds, ...signerIds]));

    // Fetch all vault info
    const vaults = await Promise.all(vaultIds.map((id) => fetchVault(id)));

    return vaults;
  };

  //Function to Approve Vault
  const signVault = async (vaultId: bigint): Promise<TransactionResponse> => {
    if (!isConnected || !address) throw new Error("Wallet not connected");;
    return await writeContract("signVault", [vaultId]) as TransactionResponse;
  }

  const releaseVault = async (vaultId: bigint, recipient: string): Promise<TransactionResponse> => {
    if (!isConnected || !address) throw new Error("Wallet not connected");;
    return await writeContract("withdrawVault", [vaultId, recipient]) as TransactionResponse;

  }


  return {
    signerInfo,
    hasSignedVault,
    fetchUserVaults,
    fetchSignerVaults,
    fetchVault,
    fetchAllVaults,
    signVault,
    releaseVault
  };
}
