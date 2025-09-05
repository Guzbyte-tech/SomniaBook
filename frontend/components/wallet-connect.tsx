"use client"

import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"

export function WalletConnect() {
  const { user, setUser } = useAppStore()

  const connectWallet = async () => {
    // Mock wallet connection for demo
    // In production, this would use wagmi/viem
    const mockAddress = "0x1234567890123456789012345678901234567890"
    setUser({
      address: mockAddress,
      isConnected: true,
    })
  }

  const disconnectWallet = () => {
    setUser({
      address: null,
      isConnected: false,
    })
  }

  if (user.isConnected) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          {user.address?.slice(0, 6)}...{user.address?.slice(-4)}
        </div>
        <Button variant="outline" size="sm" onClick={disconnectWallet}>
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={connectWallet} className="bg-primary hover:bg-primary/90 text-primary-foreground">
      Connect Wallet
    </Button>
  )
}
