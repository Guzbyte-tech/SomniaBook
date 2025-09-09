import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'
import { ArrowLeft, Wallet } from 'lucide-react'
import { WalletConnect } from './wallet-connect'

function ConnectWalletMiddleware() {
  return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">My Bets</h1>
            </div>
            <WalletConnect />
          </div>
        </header>

        <main className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <Wallet className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to view your betting history and track your performance.
            </p>
            <WalletConnect />
          </div>
        </main>
      </div>
    )
}

export default ConnectWalletMiddleware