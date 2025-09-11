"use client"

import type React from "react"

import { useWallet } from "@/components/wallet-provider"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet } from "lucide-react"

export function WalletGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useWallet()

  if (!isConnected) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-md border-border/50 shadow-2xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center ring-2 ring-primary/30">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Connect Your Wallet</h2>
              <p className="text-muted-foreground">You need to connect your wallet to access ChronoVault</p>
            </div>
            <ConnectWalletButton size="lg" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
