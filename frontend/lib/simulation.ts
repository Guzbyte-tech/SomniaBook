"use client"

import { useAppStore } from "./store"
import { mockEvents, mockStats } from "./mock-data"

interface LiveEvent {
  id: string
  type: "goal" | "card" | "price_move" | "basket" | "corner" | "substitution"
  message: string
  timestamp: Date
  eventId: string
}

class RealTimeSimulation {
  private intervals: NodeJS.Timeout[] = []
  private eventCallbacks: ((event: LiveEvent) => void)[] = []
  private isRunning = false

  start() {
    if (this.isRunning) return
    this.isRunning = true

    // Simulate odds changes every 3-8 seconds
    const oddsInterval = setInterval(
      () => {
        this.simulateOddsChange()
      },
      Math.random() * 5000 + 3000,
    )

    // Simulate live events every 10-20 seconds
    const eventsInterval = setInterval(
      () => {
        this.simulateLiveEvent()
      },
      Math.random() * 10000 + 10000,
    )

    // Update stats every 5 seconds
    const statsInterval = setInterval(() => {
      this.updateLiveStats()
    }, 5000)

    this.intervals.push(oddsInterval, eventsInterval, statsInterval)
  }

  stop() {
    this.intervals.forEach(clearInterval)
    this.intervals = []
    this.isRunning = false
  }

  onLiveEvent(callback: (event: LiveEvent) => void) {
    this.eventCallbacks.push(callback)
  }

  private simulateOddsChange() {
    const store = useAppStore.getState()
    const events = mockEvents

    // Pick a random event and market
    const randomEvent = events[Math.floor(Math.random() * events.length)]
    const randomMarket = randomEvent.markets[Math.floor(Math.random() * randomEvent.markets.length)]

    // Simulate odds change (±10% variation)
    const updatedOutcomes = randomMarket.outcomes.map((outcome) => ({
      ...outcome,
      odds: Math.max(1.1, outcome.odds * (0.9 + Math.random() * 0.2)),
    }))

    store.updateMarketOdds(randomEvent.id, randomMarket.id, updatedOutcomes)

    // Trigger odds change animation
    const oddsElements = document.querySelectorAll("[data-odds-change]")
    oddsElements.forEach((el) => {
      el.classList.add("odds-change")
      setTimeout(() => el.classList.remove("odds-change"), 300)
    })
  }

  private simulateLiveEvent() {
    const events = [
      {
        eventId: "1",
        type: "goal" as const,
        messages: [
          "⚽ Saka scores for Arsenal! 2-0",
          "⚽ Sterling equalizes for Chelsea! 2-1",
          "⚽ Jesus extends Arsenal's lead! 3-1",
          "🟨 Yellow card for Partey",
          "🔄 Substitution: Havertz comes on for Mount",
        ],
      },
      {
        eventId: "2",
        type: "price_move" as const,
        messages: [
          "📈 Bitcoin surges past $68,000!",
          "📉 BTC drops to $66,500 on profit taking",
          "⚡ Major whale movement detected",
          "📊 Trading volume spikes 40%",
          "🚀 BTC breaks resistance at $67,800",
        ],
      },
      {
        eventId: "3",
        type: "basket" as const,
        messages: [
          "🏀 LeBron James opens scoring with a three!",
          "🏀 Curry responds with a deep three-pointer",
          "🏀 Davis dominates in the paint",
          "🏀 Warriors take the lead 15-12",
          "⏰ End of first quarter",
        ],
      },
    ]

    const randomEventType = events[Math.floor(Math.random() * events.length)]
    const randomMessage = randomEventType.messages[Math.floor(Math.random() * randomEventType.messages.length)]

    const liveEvent: LiveEvent = {
      id: Date.now().toString(),
      type: randomEventType.type,
      message: randomMessage,
      timestamp: new Date(),
      eventId: randomEventType.eventId,
    }

    this.eventCallbacks.forEach((callback) => callback(liveEvent))
  }

  private updateLiveStats() {
    // Simulate changing stats
    mockStats.totalMarkets += Math.random() > 0.7 ? 1 : 0
    mockStats.totalLiquidity = `$${(2.4 + Math.random() * 0.5).toFixed(1)}M`

    // Add new recent win occasionally
    if (Math.random() > 0.8) {
      const newWin = {
        user: `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 4)}`,
        amount: `$${(Math.random() * 2000 + 100).toFixed(0)}`,
        outcome: ["Saka Goal", "BTC Up 2%", "Lakers Win", "Over 2.5 Goals"][Math.floor(Math.random() * 4)],
      }
      mockStats.recentWins.unshift(newWin)
      mockStats.recentWins = mockStats.recentWins.slice(0, 5)
    }
  }
}

export const simulation = new RealTimeSimulation()
