"use client"

import { Button } from "@/components/ui/button"
import { useWallet } from "@/components/wallet-provider"
import { Wallet, LogOut } from "lucide-react"

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
  const { isConnected, address, connect, disconnect, isConnecting } = useWallet()

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
          onClick={disconnect}
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
      onClick={connect}
      disabled={isConnecting}
      className="flex items-center gap-2 bg-gradient-to-r from-primary via-accent to-secondary hover:from-primary/80 hover:via-accent/80 hover:to-secondary/80 text-white border-0 glow-button"
    >
      <Wallet className="w-4 h-4" />
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  )
}
