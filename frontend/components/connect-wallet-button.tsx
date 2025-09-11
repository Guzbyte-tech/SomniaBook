"use client"

import { Button } from "@/components/ui/button"
import { Wallet, LogOut } from "lucide-react"
import { useWallet } from '../hooks/useAppKit'
import { useDisconnect } from "@reown/appkit/react"

interface ConnectWalletButtonProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  showAddress?: boolean
}

export function ConnectWalletButton({
  variant = "default",
  size = "default",
  showAddress = false,
}: ConnectWalletButtonProps) {
  
 const { 
    open, 
    close,
    address, 
    isConnected, 
    chainId,
    balance,
    isLoading
  } = useWallet()

  const { disconnect } = useDisconnect()

  const handleConnect = async () => {
    try {
      await open()
    } catch (err) {
      console.error("Error during wallet connection:", err)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (err) {
      console.error("Error during wallet disconnection:", err)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {showAddress && <span className="text-sm text-muted-foreground">{formatAddress(address)}</span>}
        <Button
          variant={variant}
          size={size}
          onClick={handleDisconnect}
          className="flex items-center gap-2 bg-gradient-to-r from-primary via-accent to-secondary hover:from-primary/80 hover:via-accent/80 hover:to-secondary/80 text-white border-0 glow-button"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleConnect}
      disabled={isLoading}
      className="flex items-center gap-2 bg-gradient-to-r from-primary via-accent to-secondary hover:from-primary/80 hover:via-accent/80 hover:to-secondary/80 text-white border-0 glow-button"
    >
      <Wallet className="w-4 h-4" />
      {isLoading ? "Connecting..." : "Connect Wallet"}
    </Button>
  )
}
