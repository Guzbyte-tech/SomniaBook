import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Shield, Users, Plus, Eye } from "lucide-react"
import Link from "next/link"

// Mock data for demonstration
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
  },
]

function getTimeRemaining(unlockTime: string) {
  const now = new Date()
  const unlock = new Date(unlockTime)
  const diff = unlock.getTime() - now.getTime()

  if (diff <= 0) return "Ready to unlock"

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  return `${days}d ${hours}h remaining`
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your time-locked vaults</p>
        </div>
        <Link href="/app/create">
          <Button className="glow-button bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Create Vault
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vaults</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">2</div>
            <p className="text-xs text-muted-foreground">Active vaults</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value Locked</CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$87,450</div>
            <p className="text-xs text-muted-foreground">Across all vaults</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ready to Unlock</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1</div>
            <p className="text-xs text-muted-foreground">Awaiting signatures</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Vaults */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">My Vaults</h2>

        <div className="grid gap-4">
          {mockVaults.map((vault) => (
            <Card
              key={vault.id}
              className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {vault.amount} {vault.token}
                      </h3>
                      <Badge
                        variant={vault.status === "ready" ? "default" : "secondary"}
                        className={vault.status === "ready" ? "bg-accent text-accent-foreground" : ""}
                      >
                        {vault.status === "ready" ? "Ready" : "Locked"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {getTimeRemaining(vault.unlockTime)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {vault.approvals}/{vault.threshold} approvals
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/app/vault/${vault.id}`}>
                      <Button variant="outline" size="sm" className="border-border/50 bg-transparent">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>

                    {vault.status === "ready" ? (
                      <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Release Funds</Button>
                    ) : (
                      <Button variant="outline" className="border-border/50 bg-transparent">
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
