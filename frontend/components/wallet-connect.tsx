"use client"

import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { useWallet } from '../hooks/useAppKit'
import { useEffect } from 'react'
import { useDisconnect } from "@reown/appkit/react"

export function WalletConnect() {
  const { user, setUser } = useAppStore()
  const { disconnect } = useDisconnect();

  const { 
    open, 
    close,
    address, 
    isConnected, 
    chainId,
    balance,
    isLoading
  } = useWallet()


  const handleConnect = () => {
    open()
  }

  const handleDisconnect = async () => {
      try {
        await disconnect();
      } catch (error) {
        console.error("Failed to disconnect:", error);
      }
    }


  useEffect(() =>{
    console.log("Wallet state changed:", { isConnected, address, chainId })
  }, [isConnected, address, chainId]);

  

  // Show loading state while connecting
  if (isLoading) {
    return (
      <Button disabled className="bg-primary hover:bg-primary/90 text-primary-foreground">
        Connecting...
      </Button>
    )
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
        <div className="text-xs text-muted-foreground">
          {parseFloat(balance).toFixed(4)} STT
        </div>
        <Button variant="outline" size="sm" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={handleConnect} className="bg-primary hover:bg-primary/90 text-primary-foreground">
      Connect Wallet
    </Button>
  )
}
