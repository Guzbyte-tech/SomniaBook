import { ABI } from "@/ABI/ChronosVault";
import { useAppKitProvider, useAppKitAccount } from "@reown/appkit/react";
import { BrowserProvider, Contract } from "ethers";

export function useContract() {
  const { address, caipAddress, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const getContract = async () => {
    if (!walletProvider) throw new Error("No wallet provider");

    const ethersProvider = new BrowserProvider(walletProvider as any);
    const signer = await ethersProvider.getSigner();

    const ContractAddress = process.env
      .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x0B2212D68e983841C2296095f986B907cCCC2a6d`;
    if (!ContractAddress) throw new Error("Contract address not defined");

    return new Contract(ContractAddress, ABI, signer);
  };

  /* Read-only call (view/pure functions)
   * @param method - contract method name
   * @param args - arguments for the function
   */
  const read = async <T = unknown>(
    method: string,
    args: any[] = []
  ): Promise<T> => {
    const contract = await getContract();
    if (!contract[method]) throw new Error(`Method ${method} not found in ABI`);
    return contract[method](...args);
  };

  /**
   * Write transaction (state-changing)
   * @param method - contract method name
   * @param args - arguments for the function
   */
  const write = async (
    method: string,
    args: any[] = []
  ): Promise<{ hash: string }> => {
    const contract = await getContract();
    if (!contract[method]) throw new Error(`Method ${method} not found in ABI`);

    const tx = await contract[method](...args);
    await tx.wait();
    return { hash: tx.hash };
  };

  return { getContract, isConnected, address };
}
