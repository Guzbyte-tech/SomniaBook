import { create } from "zustand"
import { apiClient } from "./api-client"
import type { Event, Market, Bet, User } from "./types"

interface AppState {
  user: User
  events: Event[]
  userBets: Bet[]
  isLoading: boolean
  lastUpdated: Date | null

  // Actions
  setUser: (user: User) => void
  addBet: (bet: Bet) => void
  loadEvents: () => Promise<void>
  updateEvent: (eventId: string, updates: Partial<Event>) => void
  updateMarketOdds: (eventId: string, marketId: string, outcomes: Array<{ name: string; odds: number }>) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  user: {
    address: null,
    isConnected: false,
  },
  events: [],
  userBets: [],
  isLoading: false,
  lastUpdated: null,

  setUser: (user) => set({ user }),

  addBet: (bet) =>
    set((state) => ({
      userBets: [...state.userBets, bet],
    })),

  loadEvents: async () => {
    set({ isLoading: true })
    try {
      const events = await apiClient.fetchAllEvents()
      set({ events, isLoading: false, lastUpdated: new Date() })
    } catch (error) {
      console.error("Failed to load events:", error)
      set({ isLoading: false })
    }
  },

  updateEvent: (eventId, updates) =>
    set((state) => ({
      events: state.events.map((event) => (event.id === eventId ? { ...event, ...updates } : event)),
    })),

  updateMarketOdds: (eventId, marketId, outcomes) =>
    set((state) => ({
      events: state.events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              markets: event.markets.map((market) => (market.id === marketId ? { ...market, outcomes } : market)),
            }
          : event,
      ),
    })),
}))

// Export store for external access
export type { Event, Market, Bet, User }
