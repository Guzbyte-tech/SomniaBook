"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"

import { useWallet } from "../hooks/useAppKit"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Clock, Wallet } from "lucide-react"

export function WalletGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useWallet()

  if (!isConnected) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border border-border shadow-lg">
          <CardHeader className="flex flex-col items-center space-y-6">
            {/* Logo at the top */}
            {/* <Image
              src="/logo.svg"
              alt="ChronoVault Logo"
              width={64}
              height={64}
              className="h-16 w-16"
              priority
            /> */}
            <Link href="/" className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-accent" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ChronoVault
              </span>
            </Link>

            {/* Wallet icon in brand circle */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Wallet className="h-8 w-8" />
            </div>

            {/* Heading + description */}
            <CardTitle className="text-center">Connect Your Wallet</CardTitle>
            <CardDescription className="text-center">
              You need to connect your wallet to access ChronoVault
            </CardDescription>
          </CardHeader>

          <CardContent className="flex justify-center pt-4">
            <ConnectWalletButton size="lg" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
