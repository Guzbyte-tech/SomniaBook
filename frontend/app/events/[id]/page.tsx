"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { BetModal } from "@/components/bet-modal"
import { LiveMatchFeed } from "@/components/live-match-feed"
import { ArrowLeft, Clock, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useAppStore } from "@/lib/store"

interface Bet {
  id: string
  user: string
  amount: number
  outcome: string
  odds: number
  timestamp: Date
}

interface ResolvedOutcome {
  id: string
  marketName: string
  winningOutcome: string
  resolvedAt: Date
  totalPayout: number
}

export default function EventDetailsPage() {
  const params = useParams()
  const eventId = params.id as string
  const { events, loadEvents } = useAppStore()
  const [activeMarket, setActiveMarket] = useState(0)
  const [timeLeft, setTimeLeft] = useState("")
  const [recentBets, setRecentBets] = useState<Bet[]>([])
  const [resolvedOutcomes, setResolvedOutcomes] = useState<ResolvedOutcome[]>([])
  const [betModalOpen, setBetModalOpen] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState<{ name: string; odds: number } | null>(null)

  const event = events.find((e) => e.id === eventId)

  useEffect(() => {
    if (events.length === 0) {
      loadEvents()
    }
  }, [events.length, loadEvents])

  const handleBetClick = (outcome: { name: string; odds: number }) => {
    setSelectedOutcome(outcome)
    setBetModalOpen(true)
  }

  useEffect(() => {
    if (!event) return

    const updateTimer = () => {
      const now = new Date()
      const target = event.markets[activeMarket]?.endTime

      if (!target) return

      const diff = target.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft("Market Closed")
        return
      }

      const minutes = Math.floor(diff / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft(`${minutes}m ${seconds}s`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [event, activeMarket])

  useEffect(() => {
    const interval = setInterval(() => {
      const outcomes = event?.markets[activeMarket]?.outcomes || []
      if (outcomes.length === 0) return

      const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)]
      const newBet: Bet = {
        id: Date.now().toString(),
        user: `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 4)}`,
        amount: Math.random() * 2 + 0.1,
        outcome: randomOutcome.name,
        odds: randomOutcome.odds,
        timestamp: new Date(),
      }

      setRecentBets((prev) => [newBet, ...prev.slice(0, 9)])
    }, 5000)

    return () => clearInterval(interval)
  }, [event, activeMarket])

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {events.length === 0 ? "Loading events..." : "This event could not be found."}
          </p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentMarket = event.markets[activeMarket]
  const progress = event.status === "live" ? 45 : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <Badge
              className={event.status === "live" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}
            >
              {event.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
              <p className="text-muted-foreground mb-4">{event.description}</p>

              {event.liveScore && <div className="text-xl font-semibold text-primary mb-4">{event.liveScore}</div>}

              {event.status === "live" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Match Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Clock className="w-4 h-4" />
                    Next Market Ends In
                  </div>
                  <div className="text-2xl font-bold text-primary">{timeLeft}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Markets and Odds */}
          <div className="lg:col-span-2">
            <Tabs value={activeMarket.toString()} onValueChange={(value) => setActiveMarket(Number.parseInt(value))}>
              <TabsList className="grid w-full grid-cols-2">
                {event.markets.map((market, index) => (
                  <TabsTrigger key={market.id} value={index.toString()}>
                    {market.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {event.markets.map((market, index) => (
                <TabsContent key={market.id} value={index.toString()} className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {market.name}
                        <Badge variant="outline">{market.outcomes.length} Outcomes</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {market.outcomes.map((outcome) => (
                          <div
                            key={outcome.name}
                            className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                          >
                            <div>
                              <div className="font-medium">{outcome.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {(100 / outcome.odds).toFixed(1)}% implied probability
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-lg font-bold text-primary" data-odds-change>
                                  {outcome.odds.toFixed(1)}x
                                </div>
                                <div className="text-xs text-muted-foreground">odds</div>
                              </div>
                              <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90"
                                onClick={() => handleBetClick(outcome)}
                              >
                                Bet
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Sidebar with feeds */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Match Feed */}
            <LiveMatchFeed />

            {/* Recent Bets Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Recent Bets
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-60 overflow-y-auto">
                  {recentBets.map((bet) => (
                    <div
                      key={bet.id}
                      className="p-4 border-b border-border last:border-b-0 animate-in slide-in-from-top-2"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium">{bet.user}</span>
                        <span className="text-xs text-muted-foreground">{bet.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {bet.amount.toFixed(2)} ETH on <span className="text-primary">{bet.outcome}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">@ {bet.odds}x odds</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resolved Outcomes */}
            <Card>
              <CardHeader>
                <CardTitle>Resolved Markets</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-40 overflow-y-auto">
                  {resolvedOutcomes.map((outcome) => (
                    <div key={outcome.id} className="p-4 border-b border-border last:border-b-0">
                      <div className="font-medium text-sm mb-1">{outcome.marketName}</div>
                      <div className="text-sm text-green-400 mb-1">Winner: {outcome.winningOutcome}</div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{outcome.resolvedAt.toLocaleTimeString()}</span>
                        <span>{outcome.totalPayout}x payout</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Bet Modal */}
      <BetModal
        isOpen={betModalOpen}
        onClose={() => setBetModalOpen(false)}
        outcome={selectedOutcome}
        eventTitle={event.title}
        marketName={event.markets[activeMarket]?.name || ""}
      />
    </div>
  )
}
