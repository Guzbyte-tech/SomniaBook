"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Clock,
  Shield,
  Users,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Copy,
  ExternalLink,
  AlertTriangle,
  Calendar,
  Coins,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useVaults } from "@/hooks/useVaults"
import { VaultStruct } from "@/types/vault"

// ⏱ Timer
function getTimeRemaining(unlockTime: number | string) {
  const now = new Date()
  const unlock = new Date(unlockTime)
  const diff = unlock.getTime() - now.getTime()

  if (diff <= 0) {
    return {
      text: "Ready to unlock",
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
    }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return {
    text: `${days}d ${hours}h ${minutes}m remaining`,
    expired: false,
    days,
    hours,
    minutes,
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}

export default function VaultDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { fetchVault } = useVaults()
  const [vault, setVault] = useState<any | null>(null)
  const [timeRemaining, setTimeRemaining] = useState({
    text: "",
    expired: false,
    days: 0,
    hours: 0,
    minutes: 0,
  })

  const vaultId = params.id as string

  useEffect(() => {
    if (!vaultId) return

    const loadVault = async () => {
      try {
        const data = await fetchVault(BigInt(vaultId))

        // map struct → UI format
        const mapped = {
          id: vaultId,
          token: data.tokenAddress,
          amount: data.amount.toString(),
          unlockTime: Number(data.unlockTimestamp),
          threshold: data.requiredSignatures,
          creator: data.creator,
          contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
          signers: data.signers.map((addr: string) => ({
            address: addr,
            approved: false, // will fetch via hasUserSigned if needed
          })),
          status: data.isUnlocked ? "ready" : "locked",
          createdAt: Number(data.createdAt),
        }

        setVault(mapped)
        setTimeRemaining(getTimeRemaining(mapped.unlockTime))
      } catch (err) {
        console.error("Error loading vault:", err)
      }
    }

    loadVault()
  }, [vaultId, fetchVault])

  if (!vault) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Vault not found</h3>
            <p className="text-muted-foreground">The requested vault does not exist.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const approvalProgress =
    vault.signers.length > 0
      ? (vault.signers.filter((s: any) => s.approved).length / vault.threshold) * 100
      : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vault Details</h1>
          <p className="text-muted-foreground mt-1 font-mono">ID: {vault.id}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vault Overview */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Coins className="w-6 h-6 text-primary" />
                  Vault Overview
                </div>
                <Badge
                  className={
                    vault.status === "ready"
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }
                >
                  {vault.status === "ready" ? "Ready to Release" : "Time Locked"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Token</p>
                  <p className="text-2xl font-bold text-foreground">{vault.token}</p>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold text-foreground">{vault.amount}</p>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold text-foreground capitalize">{vault.status}</p>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    {timeRemaining.expired ? "Unlock Time Reached" : "Time Until Unlock"}
                  </h3>
                </div>
                <p className={cn("text-3xl font-bold mb-2", timeRemaining.expired ? "text-accent" : "text-foreground")}>
                  {timeRemaining.text}
                </p>
                <p className="text-sm text-muted-foreground">
                  Unlock Date: {new Date(vault.unlockTime * 1000).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Signers */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="w-6 h-6 text-secondary" />
                Multi-Signature Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Approval Progress</span>
                  <span className="font-medium">
                    {vault.signers.filter((s: any) => s.approved).length}/{vault.threshold} signatures
                  </span>
                </div>
                <Progress value={approvalProgress} className="h-2" />
              </div>

              {/* Signers List */}
              <div className="space-y-3">
                {vault.signers.map((signer: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      {signer.approved ? (
                        <CheckCircle className="w-5 h-5 text-accent" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{signer.address}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground font-mono">
                            {signer.address.slice(0, 6)}...{signer.address.slice(-4)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(signer.address)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {signer.approved ? (
                        <Badge variant="outline" className="text-accent border-accent/50">
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vault.status === "ready" ? (
                <Button className="w-full glow-button bg-accent hover:bg-accent/90 text-accent-foreground py-6">
                  <Shield className="w-4 h-4 mr-2" />
                  Release Funds
                </Button>
              ) : (
                <Button
                  className="w-full py-6 border-primary/50 text-primary hover:bg-primary/10 bg-transparent"
                  variant="outline"
                  disabled={approvalProgress >= 100}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {approvalProgress >= 100 ? "Fully Approved" : "Approve Transaction"}
                </Button>
              )}
              <Separator />
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  size="sm"
                  onClick={() => copyToClipboard(vault.id)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Vault ID
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `https://explorer.somnia.network/address/${vault.contractAddress}`,
                      "_blank"
                    )
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Vault Info */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Vault Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{new Date(vault.createdAt * 1000).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creator:</span>
                  <span className="font-mono text-xs">
                    {vault.creator.slice(0, 6)}...{vault.creator.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract:</span>
                  <span className="font-mono text-xs">
                    {vault.contractAddress.slice(0, 6)}...{vault.contractAddress.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Threshold:</span>
                  <span className="font-medium">
                    {vault.threshold} of {vault.signers.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
