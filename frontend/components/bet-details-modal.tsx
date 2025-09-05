"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, Clock, CheckCircle, XCircle, ExternalLink, Plus } from "lucide-react"
import { BetModal } from "./bet-modal"

interface BetDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  bet: {
    id: string
    eventId: string
    eventName: string
    marketId: string
    marketName: string
    outcome: string
    amount: number
    odds: number
    status: "pending" | "won" | "lost"
    payout?: number
    placedAt: Date
    resolvedAt?: Date
  } | null
}

// Mock additional markets for the same event
const getAdditionalMarkets = (eventName: string) => {
  if (eventName.includes("vs")) {
    // Sports event
    return [
      {
        id: "next-goal",
        name: "Next Goal Scorer",
        outcomes: [
          { name: "Player A", odds: 3.2 },
          { name: "Player B", odds: 4.1 },
          { name: "Player C", odds: 2.8 },
          { name: "Player D", odds: 5.2 },
          { name: "No Goal", odds: 1.9 },
        ],
      },
      {
        id: "total-goals",
        name: "Total Goals",
        outcomes: [
          { name: "Over 2.5", odds: 1.8 },
          { name: "Under 2.5", odds: 2.1 },
          { name: "Over 3.5", odds: 2.9 },
          { name: "Under 3.5", odds: 1.4 },
        ],
      },
      {
        id: "next-card",
        name: "Next Yellow Card",
        outcomes: [
          { name: "Home Team", odds: 1.9 },
          { name: "Away Team", odds: 2.0 },
          { name: "No Card", odds: 3.5 },
        ],
      },
    ]
  } else {
    // Crypto event
    return [
      {
        id: "price-direction",
        name: "Price Direction (Next 15min)",
        outcomes: [
          { name: "Up 1%+", odds: 2.4 },
          { name: "Down 1%+", odds: 2.6 },
          { name: "Sideways ±1%", odds: 3.1 },
        ],
      },
      {
        id: "volatility",
        name: "Volatility Level",
        outcomes: [
          { name: "High (>3%)", odds: 2.8 },
          { name: "Medium (1-3%)", odds: 2.2 },
          { name: "Low (<1%)", odds: 3.5 },
        ],
      },
    ]
  }
}

export function BetDetailsModal({ isOpen, onClose, bet }: BetDetailsModalProps) {
  const [showBetModal, setShowBetModal] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState<{ name: string; odds: number } | null>(null)

  if (!bet) return null

  const additionalMarkets = getAdditionalMarkets(bet.eventName)
  const profit = bet.status === "won" && bet.payout ? bet.payout - bet.amount : 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "won":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "lost":
        return <XCircle className="w-5 h-5 text-red-400" />
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-400" />
      default:
        return null
    }
  }

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

  const handlePlaceBet = (outcome: { name: string; odds: number }) => {
    setSelectedOutcome(outcome)
    setShowBetModal(true)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Bet Details
            </DialogTitle>
            <DialogDescription>View bet information and place additional bets on this event</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bet Details */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Bet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(bet.status)}
                      {getStatusBadge(bet.status)}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Event</span>
                      <span className="font-medium">{bet.eventName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Market</span>
                      <span className="font-medium">{bet.marketName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Outcome</span>
                      <span className="font-medium text-primary">{bet.outcome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Amount</span>
                      <span className="font-medium">{bet.amount.toFixed(3)} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Odds</span>
                      <span className="font-medium">{bet.odds}x</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    {bet.status === "won" && bet.payout ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Payout</span>
                          <span className="font-medium text-green-400">{bet.payout.toFixed(3)} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Profit</span>
                          <span className="font-medium text-green-400">+{profit.toFixed(3)} ETH</span>
                        </div>
                      </>
                    ) : bet.status === "pending" ? (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Potential Payout</span>
                        <span className="font-medium text-primary">{(bet.amount * bet.odds).toFixed(3)} ETH</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Loss</span>
                        <span className="font-medium text-red-400">-{bet.amount.toFixed(3)} ETH</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Placed</span>
                      <span>{bet.placedAt.toLocaleString()}</span>
                    </div>
                    {bet.resolvedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Resolved</span>
                        <span>{bet.resolvedAt.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Markets */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    More Markets for This Event
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {additionalMarkets.map((market) => (
                    <div key={market.id} className="space-y-3">
                      <h4 className="font-medium text-sm">{market.name}</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {market.outcomes.map((outcome) => (
                          <Button
                            key={outcome.name}
                            variant="outline"
                            className="justify-between h-auto p-3 bg-transparent"
                            onClick={() => handlePlaceBet(outcome)}
                          >
                            <span className="text-sm">{outcome.name}</span>
                            <Badge variant="secondary" className="ml-2">
                              {outcome.odds}x
                            </Badge>
                          </Button>
                        ))}
                      </div>
                      {market.id !== additionalMarkets[additionalMarkets.length - 1].id && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <ExternalLink className="w-4 h-4" />
              View Event Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bet Modal */}
      <BetModal
        isOpen={showBetModal}
        onClose={() => setShowBetModal(false)}
        outcome={selectedOutcome}
        eventTitle={bet.eventName}
        marketName={
          selectedOutcome
            ? additionalMarkets.find((m) => m.outcomes.some((o) => o.name === selectedOutcome.name))?.name || "Market"
            : "Market"
        }
      />
    </>
  )
}
