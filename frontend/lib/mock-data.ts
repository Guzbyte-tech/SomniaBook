import type { Event } from "./store"

export const mockEvents: Event[] = [
  {
    id: "1",
    title: "Arsenal vs Chelsea",
    description: "Premier League Match",
    startTime: new Date(Date.now() + 3600000), // 1 hour from now
    endTime: new Date(Date.now() + 9000000), // 2.5 hours from now
    status: "live",
    liveScore: "Arsenal 1 - 0 Chelsea",
    markets: [
      {
        id: "next-goal",
        name: "Next Goal Scorer",
        status: "active",
        endTime: new Date(Date.now() + 1800000), // 30 minutes
        outcomes: [
          { name: "Saka", odds: 3.2 },
          { name: "Sterling", odds: 4.1 },
          { name: "Jesus", odds: 3.8 },
          { name: "No Goal", odds: 2.1 },
        ],
      },
      {
        id: "next-card",
        name: "Next Yellow Card",
        status: "active",
        endTime: new Date(Date.now() + 1200000), // 20 minutes
        outcomes: [
          { name: "Arsenal Player", odds: 1.8 },
          { name: "Chelsea Player", odds: 2.2 },
          { name: "No Card", odds: 3.5 },
        ],
      },
    ],
  },
  {
    id: "2",
    title: "Bitcoin Price Movement",
    description: "BTC/USD Next Hour",
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000),
    status: "live",
    liveScore: "$67,234.56",
    markets: [
      {
        id: "btc-direction",
        name: "Price Direction (Next 15min)",
        status: "active",
        endTime: new Date(Date.now() + 900000), // 15 minutes
        outcomes: [
          { name: "Up 1%+", odds: 2.4 },
          { name: "Down 1%+", odds: 2.6 },
          { name: "Sideways", odds: 3.1 },
        ],
      },
    ],
  },
  {
    id: "3",
    title: "Lakers vs Warriors",
    description: "NBA Regular Season",
    startTime: new Date(Date.now() + 7200000), // 2 hours from now
    endTime: new Date(Date.now() + 14400000), // 4 hours from now
    status: "upcoming",
    markets: [
      {
        id: "first-basket",
        name: "First Basket Scorer",
        status: "active",
        endTime: new Date(Date.now() + 7200000),
        outcomes: [
          { name: "LeBron James", odds: 4.2 },
          { name: "Stephen Curry", odds: 3.8 },
          { name: "Anthony Davis", odds: 5.1 },
          { name: "Other Player", odds: 1.9 },
        ],
      },
    ],
  },
]

export const mockStats = {
  totalMarkets: 47,
  totalLiquidity: "$2.4M",
  recentWins: [
    { user: "0x1234...5678", amount: "$1,250", outcome: "Saka Goal" },
    { user: "0x9abc...def0", amount: "$890", outcome: "BTC Up 2%" },
    { user: "0x2468...ace1", amount: "$2,100", outcome: "Lakers Win" },
  ],
}
