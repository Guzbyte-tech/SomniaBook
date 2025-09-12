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

// Mock vault data - in real app this would come from API
const mockVaultData = {
  "vault-001": {
    id: "vault-001",
    token: "ETH",
    amount: "10.5",
    unlockTime: "2024-12-25T00:00:00Z",
    approvals: 2,
    threshold: 3,
    status: "locked",
    value: "$26,250",
    createdAt: "2024-01-15T10:30:00Z",
    creator: "0x1234567890abcdef1234567890abcdef12345678",
    contractAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    signers: [
      {
        address: "0x1234567890abcdef1234567890abcdef12345678",
        name: "Alice (Creator)",
        approved: true,
        approvedAt: "2024-01-15T10:30:00Z",
      },
      {
        address: "0x9abcdef01234567890abcdef01234567890abcdef",
        name: "Bob",
        approved: true,
        approvedAt: "2024-01-16T14:20:00Z",
      },
      {
        address: "0x567890abcdef1234567890abcdef1234567890ab",
        name: "Charlie",
        approved: false,
        approvedAt: null,
      },
    ],
    transactions: [
      {
        id: "tx-001",
        type: "created",
        timestamp: "2024-01-15T10:30:00Z",
        signer: "0x1234567890abcdef1234567890abcdef12345678",
        txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
      },
      {
        id: "tx-002",
        type: "approved",
        timestamp: "2024-01-16T14:20:00Z",
        signer: "0x9abcdef01234567890abcdef01234567890abcdef",
        txHash: "0x9abcdef01234567890abcdef01234567890abcdef01234567890abcdef01234567",
      },
    ],
  },
  "vault-002": {
    id: "vault-002",
    token: "USDC",
    amount: "50000",
    unlockTime: "2024-11-15T12:00:00Z",
    approvals: 3,
    threshold: 3,
    status: "ready",
    value: "$50,000",
    createdAt: "2024-01-10T14:20:00Z",
    creator: "0x1234567890abcdef1234567890abcdef12345678",
    contractAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    signers: [
      {
        address: "0x1234567890abcdef1234567890abcdef12345678",
        name: "Alice (Creator)",
        approved: true,
        approvedAt: "2024-01-10T14:20:00Z",
      },
      {
        address: "0x9abcdef01234567890abcdef01234567890abcdef",
        name: "Bob",
        approved: true,
        approvedAt: "2024-01-11T09:15:00Z",
      },
      {
        address: "0x567890abcdef1234567890abcdef1234567890ab",
        name: "Charlie",
        approved: true,
        approvedAt: "2024-01-12T16:45:00Z",
      },
    ],
    transactions: [
      {
        id: "tx-003",
        type: "created",
        timestamp: "2024-01-10T14:20:00Z",
        signer: "0x1234567890abcdef1234567890abcdef12345678",
        txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
      },
      {
        id: "tx-004",
        type: "approved",
        timestamp: "2024-01-11T09:15:00Z",
        signer: "0x9abcdef01234567890abcdef01234567890abcdef",
        txHash: "0x9abcdef01234567890abcdef01234567890abcdef01234567890abcdef01234567",
      },
      {
        id: "tx-005",
        type: "approved",
        timestamp: "2024-01-12T16:45:00Z",
        signer: "0x567890abcdef1234567890abcdef1234567890ab",
        txHash: "0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
      },
    ],
  },
}

function getTimeRemaining(unlockTime: string) {
  const now = new Date()
  const unlock = new Date(unlockTime)
  const diff = unlock.getTime() - now.getTime()

  if (diff <= 0) return { text: "Ready to unlock", expired: true }

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
  const [timeRemaining, setTimeRemaining] = useState({ text: "", expired: false, days: 0, hours: 0, minutes: 0 })

  const vaultId = params.id as string
  const vault = mockVaultData[vaultId as keyof typeof mockVaultData]

  useEffect(() => {
    if (!vault) return

    const updateTimer = () => {
      setTimeRemaining(getTimeRemaining(vault.unlockTime))
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [vault])

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

  const approvalProgress = (vault.approvals / vault.threshold) * 100

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
          <p className="text-muted-foreground mt-1 font-mono">{vault.id}</p>
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
                  <p className="text-sm text-muted-foreground">Value</p>
                  <p className="text-2xl font-bold text-foreground">{vault.value}</p>
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
                  Unlock Date: {new Date(vault.unlockTime).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Signers Status */}
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
                    {vault.approvals}/{vault.threshold} signatures
                  </span>
                </div>
                <Progress value={approvalProgress} className="h-2" />
              </div>

              {/* Signers List */}
              <div className="space-y-3">
                {vault.signers.map((signer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      {signer.approved ? (
                        <CheckCircle className="w-5 h-5 text-accent" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{signer.name}</p>
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
                        <div>
                          <Badge variant="outline" className="text-accent border-accent/50">
                            Approved
                          </Badge>
                          {signer.approvedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(signer.approvedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
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

          {/* Transaction History */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-primary" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vault.transactions.map((tx, index) => (
                  <div key={tx.id} className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg">
                    <div className="w-2 h-2 bg-accent rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground capitalize">{tx.type}</p>
                        <Badge variant="outline" className="text-xs">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        By: {tx.signer.slice(0, 6)}...{tx.signer.slice(-4)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://etherscan.io/tx/${tx.txHash}`, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
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
                  disabled={vault.approvals >= vault.threshold}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {vault.approvals >= vault.threshold ? "Fully Approved" : "Approve Transaction"}
                </Button>
              )}

              <Separator />

              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Vault ID
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
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
                  <span className="font-medium">{new Date(vault.createdAt).toLocaleDateString()}</span>
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