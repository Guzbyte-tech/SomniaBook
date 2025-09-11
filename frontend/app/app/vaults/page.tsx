"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Shield, Users, Search, Filter, Eye, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

// Extended mock data for vault management
const mockVaults = [
  {
    id: "vault-001",
    token: "ETH",
    amount: "10.5",
    unlockTime: "2024-12-25T00:00:00Z",
    approvals: 2,
    threshold: 3,
    status: "locked",
    signers: ["0x1234...5678", "0x9abc...def0", "0x5678...9abc"],
    createdAt: "2024-01-15T10:30:00Z",
    value: "$26,250",
  },
  {
    id: "vault-002",
    token: "USDC",
    amount: "50000",
    unlockTime: "2024-11-15T12:00:00Z",
    approvals: 3,
    threshold: 3,
    status: "ready",
    signers: ["0x1234...5678", "0x9abc...def0", "0x5678...9abc"],
    createdAt: "2024-01-10T14:20:00Z",
    value: "$50,000",
  },
  {
    id: "vault-003",
    token: "DAI",
    amount: "25000",
    unlockTime: "2025-03-01T00:00:00Z",
    approvals: 1,
    threshold: 2,
    status: "locked",
    signers: ["0x1234...5678", "0x9abc...def0"],
    createdAt: "2024-02-01T09:15:00Z",
    value: "$25,000",
  },
  {
    id: "vault-004",
    token: "WBTC",
    amount: "0.5",
    unlockTime: "2024-10-30T18:00:00Z",
    approvals: 2,
    threshold: 2,
    status: "ready",
    signers: ["0x1234...5678", "0x9abc...def0"],
    createdAt: "2024-01-20T16:45:00Z",
    value: "$31,500",
  },
]

function getTimeRemaining(unlockTime: string) {
  const now = new Date()
  const unlock = new Date(unlockTime)
  const diff = unlock.getTime() - now.getTime()

  if (diff <= 0) return "Ready to unlock"

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `${days}d ${hours}h remaining`
  return `${hours}h remaining`
}

function getStatusColor(status: string) {
  switch (status) {
    case "ready":
      return "bg-accent text-accent-foreground"
    case "locked":
      return "bg-secondary text-secondary-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default function VaultsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tokenFilter, setTokenFilter] = useState("all")

  const filteredVaults = mockVaults.filter((vault) => {
    const matchesSearch =
      vault.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vault.token.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || vault.status === statusFilter
    const matchesToken = tokenFilter === "all" || vault.token === tokenFilter

    return matchesSearch && matchesStatus && matchesToken
  })

  const handleApprove = (vaultId: string) => {
    console.log(`Approving vault ${vaultId}`)
    // Here you would implement the approval logic
  }

  const handleRelease = (vaultId: string) => {
    console.log(`Releasing funds from vault ${vaultId}`)
    // Here you would implement the release logic
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Vaults</h1>
          <p className="text-muted-foreground mt-2">Manage and monitor your time-locked vaults</p>
        </div>
        <Link href="/app/create">
          <Button className="glow-button bg-accent hover:bg-accent/90 text-accent-foreground">Create New Vault</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by vault ID or token..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input border-border/50"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-input border-border/50">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tokenFilter} onValueChange={setTokenFilter}>
                <SelectTrigger className="w-32 bg-input border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50">
                  <SelectItem value="all">All Tokens</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="DAI">DAI</SelectItem>
                  <SelectItem value="WBTC">WBTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vault Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Vaults</p>
                <p className="text-2xl font-bold text-foreground">{mockVaults.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-secondary" />
              <div>
                <p className="text-sm text-muted-foreground">Locked</p>
                <p className="text-2xl font-bold text-foreground">
                  {mockVaults.filter((v) => v.status === "locked").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Ready</p>
                <p className="text-2xl font-bold text-foreground">
                  {mockVaults.filter((v) => v.status === "ready").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-foreground">$132.7K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vaults List */}
      <div className="space-y-4">
        {filteredVaults.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No vaults found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        ) : (
          filteredVaults.map((vault) => (
            <Card
              key={vault.id}
              className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Vault Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-foreground">
                        {vault.amount} {vault.token}
                      </h3>
                      <Badge className={getStatusColor(vault.status)}>
                        {vault.status === "ready" ? "Ready to Release" : "Time Locked"}
                      </Badge>
                      <span className="text-sm text-muted-foreground font-mono">{vault.id}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Unlock:</span>
                        <span className="font-medium">{getTimeRemaining(vault.unlockTime)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Approvals:</span>
                        <span className="font-medium">
                          {vault.approvals}/{vault.threshold}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Value:</span>
                        <span className="font-medium">{vault.value}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Link href={`/app/vault/${vault.id}`}>
                      <Button variant="outline" size="sm" className="border-border/50 bg-transparent">
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                    </Link>

                    {vault.status === "ready" ? (
                      <Button
                        onClick={() => handleRelease(vault.id)}
                        className="bg-accent hover:bg-accent/90 text-accent-foreground"
                      >
                        Release Funds
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleApprove(vault.id)}
                        variant="outline"
                        className="border-primary/50 text-primary hover:bg-primary/10"
                        disabled={vault.approvals >= vault.threshold}
                      >
                        {vault.approvals >= vault.threshold ? "Fully Approved" : "Approve"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
