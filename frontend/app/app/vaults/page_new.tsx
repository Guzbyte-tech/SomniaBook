"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Clock,
  Shield,
  Users,
  Search,
  Filter,
  Eye,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"

import { VaultStruct } from "@/types/vault"
import { useVaults } from "@/hooks/useVaults"

type Vault = {
  id: string
  token: string
  amount: string
  unlockTime: number
  approvals: number
  threshold: number
  status: "locked" | "ready"
  signers: { address: string; approved: boolean }[]
  createdAt: number
}

// ---------------- Helpers ----------------
function getTimeRemaining(unlockTime: number): string {
  const now = Date.now()
  const diff = unlockTime * 1000 - now

  if (diff <= 0) return "Ready to unlock"

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(
    (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  )

  if (days > 0) return `${days}d ${hours}h remaining`
  return `${hours}h remaining`
}

function getStatusColor(status: Vault["status"]) {
  return status === "ready"
    ? "bg-accent text-accent-foreground"
    : "bg-secondary text-secondary-foreground"
}

// ---------------- Component ----------------
export default function VaultsPage() {
  const { fetchAllVaults } = useVaults()

  const [vaults, setVaults] = useState<Vault[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tokenFilter, setTokenFilter] = useState("all")

  useEffect(() => {
  const loadVaults = async () => {
    try {
      setLoading(true)
      const result = await fetchAllVaults()

      if (!result || result.length === 0) {
        setVaults([])
        return
      }

      const mapped: Vault[] = result
        .filter((data): data is VaultStruct => !!data) // filter out null/undefined
        .map((data: VaultStruct, i) => ({
          id: i.toString(), // use data.id if your struct has it
          token: data.tokenAddress,
          amount: data.amount.toString(),
          unlockTime: Number(data.unlockTimestamp),
          approvals: 0, // TODO: hook up real approval count
          threshold: Number(data.requiredSignatures),
          status: data.isUnlocked ? "ready" : "locked",
          signers: (data.signers ?? []).map((addr) => ({
            address: addr,
            approved: false, // TODO: hook up real approval status
          })),
          createdAt: Number(data.createdAt),
        }))

      setVaults(mapped)
    } catch (err) {
      console.error("Error fetching vaults:", err)
      setVaults([])
    } finally {
      setLoading(false)
    }
  }

  loadVaults()
}, [fetchAllVaults])

  const filteredVaults = vaults.filter((vault) => {
    const matchesSearch =
      vault.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vault.token.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || vault.status === statusFilter
    const matchesToken =
      tokenFilter === "all" || vault.token === tokenFilter

    return matchesSearch && matchesStatus && matchesToken
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">Loading vaults...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Vaults</h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor your time-locked vaults
          </p>
        </div>
        <Link href="/app/create">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Create New Vault
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by vault ID or token..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={tokenFilter}
                onValueChange={setTokenFilter}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Token" />
                </SelectTrigger>
                <SelectContent>
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

      {/* Vaults List */}
      <div className="space-y-4">
        {filteredVaults.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No vaults found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredVaults.map((vault) => (
            <Card key={vault.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Vault Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">
                        {vault.amount} {vault.token}
                      </h3>
                      <Badge className={getStatusColor(vault.status)}>
                        {vault.status === "ready"
                          ? "Ready to Release"
                          : "Time Locked"}
                      </Badge>
                      <span className="text-sm text-muted-foreground font-mono">
                        {vault.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>Unlock:</span>
                        <span className="font-medium">
                          {getTimeRemaining(vault.unlockTime)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>Approvals:</span>
                        <span className="font-medium">
                          {vault.approvals}/{vault.threshold}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span>Signers:</span>
                        <span className="font-medium">
                          {vault.signers.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Link href={`/app/vault/${vault.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                    </Link>

                    {vault.status === "ready" ? (
                      <Button
                        onClick={() => {
                          // TODO: releaseVault(vault.id)
                        }}
                        className="bg-accent hover:bg-accent/90 text-accent-foreground"
                      >
                        Release Funds
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          // TODO: approveVault(vault.id)
                        }}
                        variant="outline"
                        className="border-primary/50 text-primary hover:bg-primary/10"
                        disabled={vault.approvals >= vault.threshold}
                      >
                        {vault.approvals >= vault.threshold
                          ? "Fully Approved"
                          : "Approve"}
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
