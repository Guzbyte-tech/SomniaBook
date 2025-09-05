"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, TrendingUp, Wallet, CheckCircle, Plus } from "lucide-react"
import { useAppStore } from "@/lib/store"

interface BetModalProps {
  isOpen: boolean
  onClose: () => void
  outcome: {
    name: string
    odds: number
  } | null
  eventTitle: string
  marketName: string
}

export function BetModal({ isOpen, onClose, outcome, eventTitle, marketName }: BetModalProps) {
  const [betAmount, setBetAmount] = useState("")
  const [isConfirming, setIsConfirming] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [showAllOutcomes, setShowAllOutcomes] = useState(false)
  const { user, addBet } = useAppStore()

  const additionalOutcomes = [
    { name: "Alternative Outcome 1", odds: 3.5 },
    { name: "Alternative Outcome 2", odds: 2.8 },
    { name: "Alternative Outcome 3", odds: 4.2 },
    { name: "Alternative Outcome 4", odds: 1.9 },
    { name: "Alternative Outcome 5", odds: 5.1 },
  ]

  const betAmountNum = Number.parseFloat(betAmount) || 0
  const estimatedPayout = outcome ? betAmountNum * outcome.odds : 0
  const profit = estimatedPayout - betAmountNum

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setBetAmount("")
      setIsConfirming(false)
      setIsConfirmed(false)
    }
  }, [isOpen])

  const handleConfirmBet = async () => {
    if (!outcome || !user.isConnected || betAmountNum <= 0) return

    setIsConfirming(true)

    // Simulate wallet transaction
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Add bet to store
    const newBet = {
      id: Date.now().toString(),
      eventId: "1", // This would come from props in real app
      marketId: "current", // This would come from props in real app
      outcome: outcome.name,
      amount: betAmountNum,
      odds: outcome.odds,
      status: "pending" as const,
    }

    addBet(newBet)
    setIsConfirming(false)
    setIsConfirmed(true)

    // Auto close after success animation
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  const quickAmounts = [0.1, 0.5, 1.0, 2.0]

  if (!outcome) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {!isConfirmed ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Place Bet
              </DialogTitle>
              <DialogDescription>
                {eventTitle} • {marketName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Selected Outcome */}
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{outcome.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {(100 / outcome.odds).toFixed(1)}% implied probability
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg font-bold">
                    {outcome.odds}x
                  </Badge>
                </div>
              </div>

              {!showAllOutcomes ? (
                <Button variant="outline" onClick={() => setShowAllOutcomes(true)} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Show More Betting Options ({additionalOutcomes.length} more)
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">All Available Outcomes</h4>
                    <Button variant="ghost" size="sm" onClick={() => setShowAllOutcomes(false)}>
                      Show Less
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {additionalOutcomes.map((altOutcome) => (
                      <Button
                        key={altOutcome.name}
                        variant="outline"
                        className="justify-between h-auto p-3 bg-transparent"
                        onClick={() => {
                          // This would update the selected outcome
                          console.log("[v0] Selected alternative outcome:", altOutcome.name)
                        }}
                      >
                        <span className="text-sm">{altOutcome.name}</span>
                        <Badge variant="secondary">{altOutcome.odds}x</Badge>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bet Amount Input */}
              <div className="space-y-3">
                <Label htmlFor="bet-amount">Bet Amount (ETH)</Label>
                <Input
                  id="bet-amount"
                  type="number"
                  placeholder="0.00"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  className="text-lg"
                />

                {/* Quick Amount Buttons */}
                <div className="flex gap-2">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount(amount.toString())}
                      className="flex-1"
                    >
                      {amount} ETH
                    </Button>
                  ))}
                </div>
              </div>

              {/* Payout Calculation */}
              {betAmountNum > 0 && (
                <div className="bg-primary/10 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Bet Amount:</span>
                    <span>{betAmountNum.toFixed(3)} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Odds:</span>
                    <span>{outcome.odds}x</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Potential Payout:</span>
                    <span className="text-primary">{estimatedPayout.toFixed(3)} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Profit:</span>
                    <span>+{profit.toFixed(3)} ETH</span>
                  </div>
                </div>
              )}

              {/* Wallet Connection Check */}
              {!user.isConnected && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                  <Wallet className="w-8 h-8 mx-auto mb-2 text-destructive" />
                  <p className="text-sm text-destructive">Please connect your wallet to place bets</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isConfirming}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmBet}
                disabled={!user.isConnected || betAmountNum <= 0 || isConfirming}
                className="bg-primary hover:bg-primary/90"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  `Confirm Bet (${betAmountNum.toFixed(3)} ETH)`
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* Success State */
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <DialogTitle className="text-xl mb-2">Bet Placed Successfully!</DialogTitle>
            <DialogDescription className="mb-4">
              Your bet of {betAmountNum.toFixed(3)} ETH on "{outcome.name}" has been confirmed.
            </DialogDescription>
            <div className="bg-muted rounded-lg p-4 text-sm">
              <div className="flex justify-between mb-1">
                <span>Potential Payout:</span>
                <span className="font-medium text-primary">{estimatedPayout.toFixed(3)} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Potential Profit:</span>
                <span className="font-medium text-green-400">+{profit.toFixed(3)} ETH</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
