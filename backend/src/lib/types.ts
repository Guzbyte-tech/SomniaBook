export interface Event {
  id: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  category: string
  status: "upcoming" | "live" | "ended"
  currentScore: string | null
  markets: Market[]
  totalVolume: number
  participantCount: number
}

export interface Market {
  id: string
  name: string
  outcomes: Outcome[]
  isResolved: boolean
  winningOutcome?: string
}

export interface Outcome {
  id: string
  name: string
  odds: number
  impliedProbability: number
}

export interface Bet {
  id: string
  eventId: string
  eventName: string
  marketName: string
  outcomeName: string
  amount: number
  odds: number
  potentialPayout: number
  status: "pending" | "won" | "lost"
  placedAt: Date
  resolvedAt?: Date
}

export interface LiveStats {
  totalMarkets: number
  totalLiquidity: number
  recentWins: Array<{
    id: string
    winner: string
    amount: number
    event: string
  }>
}
