import { mockFallBackSports } from "./mock-fallback-sports"
import type { Event, Market, Outcome } from "./types"

// API Configuration
const ODDS_API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY || "demo-key"
const COINGECKO_API_URL = "https://api.coingecko.com/api/v3"
const ODDS_API_URL = "https://api.the-odds-api.com/v4"

// Types for API responses
interface OddsApiEvent {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: Array<{
    key: string
    title: string
    markets: Array<{
      key: string
      outcomes: Array<{
        name: string
        price: number
      }>
    }>
  }>
}

interface CoinGeckoPrice {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
}

class ApiClient {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 30000 // 30 seconds

  private validateApiKey(): boolean {
    const hasValidKey = ODDS_API_KEY && ODDS_API_KEY !== "demo-key" && ODDS_API_KEY.length > 10
    if (!hasValidKey) {
      console.error("[v0] ❌ Invalid or missing ODDS_API_KEY:", ODDS_API_KEY)
      console.error("[v0] 📝 To get real sports data, you need a valid API key from https://the-odds-api.com/")
      console.error("[v0] 🔧 Set NEXT_PUBLIC_ODDS_API_KEY in your environment variables")
    } else {
      console.log("[v0] ✅ Valid API key detected, attempting real API calls...")
    }
    return hasValidKey
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  private setCachedData(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  async fetchSportsEvents(): Promise<Event[]> {
    const cacheKey = "sports-events"
    const cached = this.getCachedData<Event[]>(cacheKey)
    if (cached) return cached

    if (!this.validateApiKey()) {
      console.log("[v0] 🔄 Using fallback sports data due to missing/invalid API key")
      const fallbackEvents = this.getFallbackSportsEvents()
      this.setCachedData(cacheKey, fallbackEvents)
      return fallbackEvents
    }

    try {
      const sports = [
        "americanfootball_nfl",
        "basketball_nba",
        "soccer_epl", // Premier League
        "soccer_spain_la_liga", // La Liga
        "soccer_germany_bundesliga", // Bundesliga
        "soccer_italy_serie_a", // Serie A
        "soccer_france_ligue_one", // Ligue 1
        "soccer_uefa_champs_league", // Champions League
        "icehockey_nhl",
      ]
      const allEvents: Event[] = []
      let apiFailureCount = 0

      console.log("[v0] 🏈 Attempting to fetch real sports data from", sports.length, "leagues...")

      for (const sport of sports) {
        try {
          const url = `${ODDS_API_URL}/sports/${sport}/odds?apiKey=${ODDS_API_KEY}&regions=us,uk&markets=h2h,spreads,totals&oddsFormat=decimal`
          console.log("[v0] 📡 Fetching", sport, "from API...")

          const response = await fetch(url)

          if (!response.ok) {
            apiFailureCount++
            console.error(`[v0] ❌ API Error for ${sport}:`, response.status, response.statusText)

            if (response.status === 401) {
              console.error("[v0] 🔑 Authentication failed - API key is invalid or expired")
              if (apiFailureCount === 1) {
                console.error("[v0] 💡 To fix this:")
                console.error("[v0]    1. Get a free API key from https://the-odds-api.com/")
                console.error("[v0]    2. Add it to your environment: NEXT_PUBLIC_ODDS_API_KEY=your_key_here")
                console.error("[v0]    3. Restart your development server")
                console.error("[v0] 📊 Currently showing demo data instead of live sports")
              }
            } else if (response.status === 429) {
              console.error("[v0] ⏰ Rate limit exceeded - too many requests")
            } else if (response.status === 403) {
              console.error("[v0] 🚫 Access forbidden - check API key permissions")
            }
            continue
          }

          const data: OddsApiEvent[] = await response.json()
          console.log(`[v0] ✅ Successfully fetched ${data.length} events for ${sport}`)

          const events = data.map((apiEvent): Event => {
            const markets: Market[] = []

            // Process bookmaker data to create markets
            if (apiEvent.bookmakers.length > 0) {
              const bookmaker = apiEvent.bookmakers[0] // Use first bookmaker

              bookmaker.markets.forEach((market) => {
                const outcomes: Outcome[] = market.outcomes.map((outcome) => ({
                  id: `${apiEvent.id}-${market.key}-${outcome.name}`,
                  name: outcome.name,
                  odds: outcome.price,
                  impliedProbability: (1 / outcome.price) * 100,
                }))

                markets.push({
                  id: `${apiEvent.id}-${market.key}`,
                  name: this.getMarketDisplayName(market.key),
                  outcomes,
                  isResolved: false,
                })
              })
            }

            const now = new Date()
            const startTime = new Date(apiEvent.commence_time)
            const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000)

            let status: "upcoming" | "live" | "ended" = "upcoming"
            if (now >= startTime && now < endTime) {
              status = "live"
            } else if (now >= endTime) {
              status = "ended"
            }

            return {
              id: apiEvent.id,
              title: `${apiEvent.away_team} vs ${apiEvent.home_team}`,
              description: apiEvent.sport_title,
              startTime,
              endTime,
              category: this.getCategoryFromSport(apiEvent.sport_key),
              status,
              currentScore:
                status === "live" ? `${Math.floor(Math.random() * 3)}-${Math.floor(Math.random() * 3)}` : null,
              markets,
              totalVolume: Math.floor(Math.random() * 1000000) + 100000,
              participantCount: Math.floor(Math.random() * 5000) + 500,
            }
          })

          allEvents.push(...events)
        } catch (sportError) {
          console.error(`[v0] ❌ Network error fetching ${sport}:`, sportError)
          continue
        }
      }

      if (allEvents.length === 0) {
        console.log("[v0] ⚠️ No real sports events retrieved from API - using fallback data")
        console.log("[v0] 💡 This happened because:")
        if (apiFailureCount > 0) {
          console.log("[v0]    ❌ All API calls failed (likely invalid API key)")
          console.log("[v0]    🔧 Solution: Get a valid API key from https://the-odds-api.com/")
          console.log("[v0]    📝 The Odds API offers 500 free requests per month")
        } else {
          console.log("[v0]    📅 No games scheduled for selected sports")
          console.log("[v0]    🔄 Try again later or check different sports")
        }
        console.log("[v0] 🎭 Showing realistic demo data instead")

        const fallbackEvents = this.getFallbackSportsEvents()
        this.setCachedData(cacheKey, fallbackEvents)
        return fallbackEvents
      }

      console.log(`[v0] 🎉 Successfully loaded ${allEvents.length} real sports events!`)
      this.setCachedData(cacheKey, allEvents)
      return allEvents
    } catch (error) {
      console.error("[v0] ❌ Critical error fetching sports events:", error)
      const fallbackEvents = this.getFallbackSportsEvents()
      this.setCachedData(cacheKey, fallbackEvents)
      return fallbackEvents
    }
  }

  async fetchCryptoEvents(): Promise<Event[]> {
    const cacheKey = "crypto-events"
    const cached = this.getCachedData<Event[]>(cacheKey)
    if (cached) return cached

    try {
      console.log("[v0] 💰 Fetching real crypto data from CoinGecko...")
      const response = await fetch(
        `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`,
      )

      if (!response.ok) {
        console.error("[v0] ❌ CoinGecko API Error:", response.status, response.statusText)
        throw new Error(`CoinGecko API error: ${response.statusText}`)
      }

      const cryptoData: CoinGeckoPrice[] = await response.json()
      console.log(`[v0] ✅ Successfully fetched ${cryptoData.length} real crypto prices!`)

      const events: Event[] = cryptoData.map((crypto): Event => {
        const currentPrice = crypto.current_price
        const priceTargets = [
          currentPrice * 1.05, // 5% up
          currentPrice * 1.1, // 10% up
          currentPrice * 0.95, // 5% down
          currentPrice * 0.9, // 10% down
        ]

        const markets: Market[] = [
          {
            id: `${crypto.id}-price-24h`,
            name: "24h Price Direction",
            outcomes: [
              {
                id: `${crypto.id}-up`,
                name: "Price Up",
                odds: crypto.price_change_percentage_24h > 0 ? 1.8 : 2.2,
                impliedProbability: crypto.price_change_percentage_24h > 0 ? 55.6 : 45.5,
              },
              {
                id: `${crypto.id}-down`,
                name: "Price Down",
                odds: crypto.price_change_percentage_24h < 0 ? 1.8 : 2.2,
                impliedProbability: crypto.price_change_percentage_24h < 0 ? 55.6 : 45.5,
              },
            ],
            isResolved: false,
          },
          {
            id: `${crypto.id}-price-target`,
            name: "Price Target (24h)",
            outcomes: priceTargets.map((target, index) => ({
              id: `${crypto.id}-target-${index}`,
              name: `$${target.toFixed(2)}`,
              odds: 2.5 + Math.random() * 2,
              impliedProbability: 25 + Math.random() * 15,
            })),
            isResolved: false,
          },
        ]

        return {
          id: `crypto-${crypto.id}`,
          title: `${crypto.name} (${crypto.symbol.toUpperCase()}) Price Prediction`,
          description: `Current: $${currentPrice.toFixed(2)} (${crypto.price_change_percentage_24h.toFixed(2)}% 24h)`,
          startTime: new Date(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          category: "crypto",
          status: "live",
          currentScore: `$${currentPrice.toFixed(2)}`,
          markets,
          totalVolume: crypto.total_volume,
          participantCount: Math.floor(Math.random() * 2000) + 200,
        }
      })

      this.setCachedData(cacheKey, events)
      return events
    } catch (error) {
      console.error("[v0] ❌ Error fetching crypto events:", error)
      console.log("[v0] 🔄 Using fallback crypto data")
      return this.getFallbackCryptoEvents()
    }
  }

  async fetchAllEvents(): Promise<Event[]> {
    try {
      console.log("[v0] Fetching all events...")
      const [sportsEvents, cryptoEvents] = await Promise.all([this.fetchSportsEvents(), this.fetchCryptoEvents()])

      console.log("[v0] Sports events loaded:", sportsEvents.length)
      console.log("[v0] Crypto events loaded:", cryptoEvents.length)

      console.log("Data from Odds API: ", sportsEvents)
      console.log("Crypto Data from Odds API: ", cryptoEvents)

      const allEvents = [...sportsEvents, ...cryptoEvents]

      const eventsByCategory = allEvents.reduce(
        (acc, event) => {
          acc[event.category] = (acc[event.category] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const eventsByStatus = allEvents.reduce(
        (acc, event) => {
          acc[event.status] = (acc[event.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      console.log("[v0] Events by category:", eventsByCategory)
      console.log("[v0] Events by status:", eventsByStatus)

      return allEvents
    } catch (error) {
      console.error("Error fetching all events:", error)
      const fallbackEvents = [...this.getFallbackSportsEvents(), ...this.getFallbackCryptoEvents()]
      console.log("[v0] Using complete fallback data:", fallbackEvents.length, "events")
      return fallbackEvents
    }
  }

  private getMarketDisplayName(marketKey: string): string {
    const marketNames: Record<string, string> = {
      h2h: "Match Winner",
      spreads: "Point Spread",
      totals: "Over/Under",
    }
    return marketNames[marketKey] || marketKey
  }

  private getCategoryFromSport(sportKey: string): string {
    if (sportKey.includes("football")) return "football"
    if (sportKey.includes("basketball")) return "basketball"
    if (sportKey.includes("soccer")) return "football"
    if (sportKey.includes("hockey")) return "hockey"
    return "football"
  }

  private getFallbackSportsEvents(): Event[] {
    console.log("[v0] Using fallback sports events")
    // Ensure status is typed as "upcoming" | "live" | "ended"
    return mockFallBackSports.map(event => ({
      ...event,
      status: event.status as "upcoming" | "live" | "ended",
    }));
  }

  private getFallbackCryptoEvents(): Event[] {
    console.log("[v0] Using fallback crypto events")
    const cryptos = mockCryptoEvents;

    return cryptos.map((crypto, index) => ({
      id: `fallback-crypto-${crypto.symbol.toLowerCase()}`,
      title: `${crypto.name} (${crypto.symbol}) Price Prediction`,
      description: `Current: $${crypto.price.toFixed(crypto.price < 1 ? 4 : 2)} (${crypto.change > 0 ? "+" : ""}${crypto.change.toFixed(1)}% 24h)`,
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      category: "crypto",
      status: "live" as const,
      currentScore: `$${crypto.price.toFixed(crypto.price < 1 ? 4 : 2)}`,
      markets: [
        {
          id: `fallback-${crypto.symbol.toLowerCase()}-direction`,
          name: "24h Price Direction",
          outcomes: [
            {
              id: `${crypto.symbol.toLowerCase()}-up`,
              name: "Price Up",
              odds: crypto.change > 0 ? 1.8 : 2.2,
              impliedProbability: crypto.change > 0 ? 55.6 : 45.5,
            },
            {
              id: `${crypto.symbol.toLowerCase()}-down`,
              name: "Price Down",
              odds: crypto.change < 0 ? 1.8 : 2.2,
              impliedProbability: crypto.change < 0 ? 55.6 : 45.5,
            },
          ],
          isResolved: false,
        },
      ],
      totalVolume: Math.floor(Math.random() * 2000000) + 500000,
      participantCount: Math.floor(Math.random() * 1000) + 200,
    }))
  }
}

export const apiClient = new ApiClient()
