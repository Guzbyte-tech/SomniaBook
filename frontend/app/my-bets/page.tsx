"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { WalletConnect } from "@/components/wallet-connect"
import { ArrowLeft, TrendingUp, Clock, CheckCircle, XCircle, Wallet } from "lucide-react"
import Link from "next/link"
import { useAppStore } from "@/lib/store"
import { BetDetailsModal } from "@/components/bet-details-modal"
import { useWallet } from "@/hooks/useAppKit"
import ConnectWalletMiddleware from "@/components/ConnectWalletMiddleware"

// Mock additional bets for demonstration
const mockUserBets = [
  {
    id: "1",
    eventId: "1",
    eventName: "Arsenal vs Chelsea",
    marketId: "next-goal",
    marketName: "Next Goal Scorer",
    outcome: "Saka",
    amount: 0.5,
    odds: 3.2,
    status: "won" as const,
    payout: 1.6,
    placedAt: new Date(Date.now() - 3600000),
    resolvedAt: new Date(Date.now() - 1800000),
  },
  {
    id: "2",
    eventId: "2",
    eventName: "Bitcoin Price Movement",
    marketId: "btc-direction",
    marketName: "Price Direction (Next 15min)",
    outcome: "Up 1%+",
    amount: 1.2,
    odds: 2.4,
    status: "lost" as const,
    payout: 0,
    placedAt: new Date(Date.now() - 7200000),
    resolvedAt: new Date(Date.now() - 5400000),
  },
  {
    id: "3",
    eventId: "1",
    eventName: "Arsenal vs Chelsea",
    marketId: "next-card",
    marketName: "Next Yellow Card",
    outcome: "Arsenal Player",
    amount: 0.8,
    odds: 1.8,
    status: "pending" as const,
    payout: undefined,
    placedAt: new Date(Date.now() - 1800000),
    resolvedAt: undefined,
  },
  {
    id: "4",
    eventId: "3",
    eventName: "Lakers vs Warriors",
    marketId: "first-basket",
    marketName: "First Basket Scorer",
    outcome: "LeBron James",
    amount: 2.0,
    odds: 4.2,
    status: "pending" as const,
    payout: undefined,
    placedAt: new Date(Date.now() - 900000),
    resolvedAt: undefined,
  },
  {
    id: "5",
    eventId: "1",
    eventName: "Arsenal vs Chelsea",
    marketId: "corner-count",
    marketName: "Total Corners",
    outcome: "Over 8.5",
    amount: 0.3,
    odds: 2.1,
    status: "won" as const,
    payout: 0.63,
    placedAt: new Date(Date.now() - 5400000),
    resolvedAt: new Date(Date.now() - 3600000),
  },
]

export default function MyBetsPage() {
  const { user, userBets } = useAppStore()
  const [activeFilter, setActiveFilter] = useState("all")
  const [selectedBet, setSelectedBet] = useState<any>(null)
  const [showBetDetails, setShowBetDetails] = useState(false)

  const { 
      open, 
      close,
      address, 
      isConnected, 
      chainId,
      balance,
      isLoading
    } = useWallet();

  // Combine store bets with mock bets for demonstration
  const allBets = useMemo(() => {
    const storeBets = userBets.map((bet) => ({
      ...bet,
      eventName: "Current Event", // In real app, this would be fetched
      marketName: "Current Market",
      placedAt: new Date(),
      resolvedAt: undefined,
    }))
    return [...storeBets, ...mockUserBets]
  }, [userBets])

  const filteredBets = useMemo(() => {
    switch (activeFilter) {
      case "active":
        return allBets.filter((bet) => bet.status === "pending")
      case "resolved":
        return allBets.filter((bet) => bet.status === "won" || bet.status === "lost")
      default:
        return allBets
    }
  }, [allBets, activeFilter])

  const stats = useMemo(() => {
    const totalBets = allBets.length
    const activeBets = allBets.filter((bet) => bet.status === "pending").length
    const wonBets = allBets.filter((bet) => bet.status === "won").length
    const totalWagered = allBets.reduce((sum, bet) => sum + bet.amount, 0)
    const totalWon = allBets.filter((bet) => bet.status === "won").reduce((sum, bet) => sum + (bet.payout || 0), 0)
    const netProfit = totalWon - totalWagered

    return {
      totalBets,
      activeBets,
      wonBets,
      totalWagered,
      totalWon,
      netProfit,
      winRate: totalBets > 0 ? (wonBets / (totalBets - activeBets)) * 100 : 0,
    }
  }, [allBets])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "won":
        return <Badge className="bg-green-500/20 text-green-400">Won</Badge>
      case "lost":
        return <Badge className="bg-red-500/20 text-red-400">Lost</Badge>
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "won":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "lost":
        return <XCircle className="w-4 h-4 text-red-400" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-400" />
      default:
        return null
    }
  }

  const handleBetClick = (bet: any) => {
    setSelectedBet(bet)
    setShowBetDetails(true)
  }

  if (!isConnected) {
    <ConnectWalletMiddleware />
  }

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

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalBets}</div>
              <div className="text-sm text-muted-foreground">Total Bets</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.activeBets}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.wonBets}</div>
              <div className="text-sm text-muted-foreground">Won</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalWagered.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">ETH Wagered</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.totalWon.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">ETH Won</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {stats.netProfit >= 0 ? "+" : ""}
                {stats.netProfit.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Net P&L</div>
            </CardContent>
          </Card>
        </div>

        {/* Bets Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Betting History
              </CardTitle>
              <div className="text-sm text-muted-foreground">Win Rate: {stats.winRate.toFixed(1)}%</div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeFilter} onValueChange={setActiveFilter}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="all">All ({allBets.length})</TabsTrigger>
                <TabsTrigger value="active">Active ({stats.activeBets})</TabsTrigger>
                <TabsTrigger value="resolved">Resolved ({allBets.length - stats.activeBets})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeFilter}>
                {filteredBets.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No bets found</h3>
                    <p className="text-muted-foreground mb-4">
                      {activeFilter === "all" ? "You haven't placed any bets yet." : `No ${activeFilter} bets found.`}
                    </p>
                    <Link href="/">
                      <Button>Explore Markets</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Market</TableHead>
                          <TableHead>Outcome</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Odds</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payout</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBets.map((bet) => (
                          <TableRow
                            key={bet.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleBetClick(bet)}
                          >
                            <TableCell>
                              <div>
                                <div className="font-medium">{bet.eventName}</div>
                                <div className="text-sm text-muted-foreground truncate max-w-32">{bet.eventName}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{bet.marketName}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-primary">{bet.outcome}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{bet.amount.toFixed(3)} ETH</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{bet.odds}x</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(bet.status)}
                                {getStatusBadge(bet.status)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {bet.status === "won" && bet.payout ? (
                                <div className="text-green-400 font-medium">+{bet.payout.toFixed(3)} ETH</div>
                              ) : bet.status === "lost" ? (
                                <div className="text-red-400">-</div>
                              ) : (
                                <div className="text-muted-foreground">{(bet.amount * bet.odds).toFixed(3)} ETH</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {bet.placedAt.toLocaleDateString()}
                                <br />
                                {bet.placedAt.toLocaleTimeString()}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Bet Details Modal */}
        <BetDetailsModal isOpen={showBetDetails} onClose={() => setShowBetDetails(false)} bet={selectedBet} />
      </main>
    </div>
  )
}
