'use client'

import { somniaTestnet } from '@/config/appKit'
import { 
  useAppKit, 
  useAppKitAccount, 
  useAppKitNetwork, 
  useAppKitProvider 
} from '@reown/appkit/react'
import { BrowserProvider, formatEther, JsonRpcSigner } from 'ethers'
import { useEffect, useState } from 'react'



export function useWallet() {
  const { open, close } = useAppKit()
  const { address, isConnected, caipAddress, status } = useAppKitAccount()
  const { chainId, caipNetwork, caipNetworkId } = useAppKitNetwork()
  const { walletProvider } = useAppKitProvider('eip155')
  
  const [balance, setBalance] = useState<string>('0')
  const [isLoading, setIsLoading] = useState(false)
  

  const isCorrectNetwork = chainId === somniaTestnet.id

  // Get ethers provider
  const getProvider = (): BrowserProvider | null => {
    if (
      !walletProvider ||
      typeof walletProvider !== 'object' ||
      typeof (walletProvider as { request?: unknown }).request !== 'function'
    ) {
      return null
    }
    return new BrowserProvider(walletProvider as any)
  }

  // Get ethers signer
  const getSigner = async (): Promise<JsonRpcSigner | null> => {
    const provider = getProvider()
    if (!provider) return null
    return await provider.getSigner()
  }

  //Disconnect wallet 
const disconnect = async () => {
  try {
    if (
      walletProvider &&
      typeof (walletProvider as any).disconnect === 'function'
    ) {
      await (walletProvider as any).disconnect()
      console.log("Wallet disconnected ✅")
    } else {
      console.warn("Wallet provider not ready, forcing modal reset")
      // Fallback: close modal (clears session for WC2)
       await close() 
    }
  } catch (err) {
    console.error("Error while disconnecting:", err)
  }
}

  // Fetch balance
  const fetchBalance = async () => {
    if (!address || !walletProvider) return

    setIsLoading(true)
    try {
      if (
        walletProvider &&
        typeof walletProvider === 'object' &&
        typeof (walletProvider as { request?: unknown }).request === 'function'
      ) {
        const provider = new BrowserProvider(walletProvider as any)
        const balance = await provider.getBalance(address)
        setBalance(formatEther(balance))
      } else {
        throw new Error('Invalid walletProvider: missing request method')
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
      setBalance('0')
    } finally {
      setIsLoading(false)
    }
  }

  // Switch to Somnia network
  const switchToSomnia = async () => {
    try {
      if (
        walletProvider &&
        typeof walletProvider === 'object' &&
        typeof (walletProvider as { request?: unknown }).request === 'function'
      ) {
        await (walletProvider as { request: (...args: any[]) => Promise<any> }).request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${somniaTestnet.id.toString(16)}` }]
        })
      } else {
        throw new Error('Invalid walletProvider: missing request method')
      }
    } catch (error: any) {
      // If the network doesn't exist, add it
      if (error.code === 4902) {
        try {
          await (walletProvider as { request: (...args: any[]) => Promise<any> }).request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${somniaTestnet.id.toString(16)}`,
              chainName: somniaTestnet.name,
              rpcUrls: somniaTestnet.rpcUrls.default.http,
              nativeCurrency: somniaTestnet.nativeCurrency,
              blockExplorerUrls: [somniaTestnet.blockExplorers?.default?.url ?? '']
            }]
          })
        } catch (addError) {
          console.error('Error adding network:', addError)
        }
      } else {
        console.error('Error switching network:', error)
      }
    }
  }

  // Fetch balance when connected or network changes
  useEffect(() => {
    if (isConnected && address) {
      fetchBalance()
    }
  }, [isConnected, address, chainId])

  useEffect(() => {
  console.log("Provider:", walletProvider)
}, [walletProvider])


  return {
    // AppKit methods
    open,
    close,
    disconnect,

    
    // Account info
    address,
    caipAddress,
    isConnected,
    status,
    
    // Network info
    chainId,
    caipNetwork,
    caipNetworkId,
    isCorrectNetwork,
    
    // Provider methods
    walletProvider,
    getProvider,
    getSigner,
    
    // Balance
    balance,
    isLoading,
    fetchBalance,
    
    // Network switching
    switchToSomnia,
    
    // Constants
    somniaTestnet
  }
}