import { BrowserProvider, Contract, parseUnits, type Eip1193Provider, type TransactionResponse } from "ethers";
import { useAppKitProvider, useAppKitAccount } from "@reown/appkit/react";
import { ERC20ABI } from "@/ABI/Erc20Abi";


export function useERC20(tokenAddress: string) {
  const { walletProvider } = useAppKitProvider("eip155");
    const { address, caipAddress, isConnected } = useAppKitAccount();


  const getERC20 = async () => {
    const provider = new BrowserProvider(walletProvider as Eip1193Provider);
    const signer = await provider.getSigner();

    return new Contract(tokenAddress, ERC20ABI, signer);
  };

  const allowance = async (owner: string, spender: string) => {
    const erc20 = await getERC20();
    return await erc20.allowance(owner, spender);
  };

  const approve = async (spender: string, amount: bigint): Promise<TransactionResponse> => {
    const erc20 = await getERC20();
    return await erc20.approve(spender, amount);
  };

  return { getERC20,allowance, approve };
}
