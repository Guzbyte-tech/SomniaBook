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
    return [
      // NFL Events (15 events)
      {
        id: "fallback-nfl-1",
        title: "Kansas City Chiefs vs Buffalo Bills",
        description: "NFL Championship Game",
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
        category: "football",
        status: "upcoming",
        currentScore: null,
        markets: [
          {
            id: "fallback-nfl-1-winner",
            name: "Match Winner",
            outcomes: [
              { id: "chiefs-win", name: "Kansas City Chiefs", odds: 1.85, impliedProbability: 54.1 },
              { id: "bills-win", name: "Buffalo Bills", odds: 1.95, impliedProbability: 51.3 },
            ],
            isResolved: false,
          },
        ],
        totalVolume: 750000,
        participantCount: 1250,
      },
      {
        id: "fallback-nfl-2",
        title: "San Francisco 49ers vs Dallas Cowboys",
        description: "NFL Wild Card",
        startTime: new Date(Date.now() + 15 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 18 * 60 * 60 * 1000),
        category: "football",
        status: "upcoming",
        currentScore: null,
        markets: [
          {
            id: "fallback-nfl-2-winner",
            name: "Match Winner",
            outcomes: [
              { id: "49ers-win", name: "San Francisco 49ers", odds: 1.75, impliedProbability: 57.1 },
              { id: "cowboys-win", name: "Dallas Cowboys", odds: 2.05, impliedProbability: 48.8 },
            ],
            isResolved: false,
          },
        ],
        totalVolume: 650000,
        participantCount: 980,
      },
      {
        id: "fallback-nfl-3",
        title: "Green Bay Packers vs Minnesota Vikings",
        description: "NFL Division Championship",
        startTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 7 * 60 * 60 * 1000),
        category: "football",
        status: "upcoming",
        currentScore: null,
        markets: [
          {
            id: "fallback-nfl-3-winner",
            name: "Match Winner",
            outcomes: [
              { id: "packers-win", name: "Green Bay Packers", odds: 1.9, impliedProbability: 52.6 },
              { id: "vikings-win", name: "Minnesota Vikings", odds: 1.9, impliedProbability: 52.6 },
            ],
            isResolved: false,
          },
        ],
        totalVolume: 580000,
        participantCount: 1100,
      },
      {
        id: "fallback-nfl-4",
        title: "Miami Dolphins vs New York Jets",
        description: "NFL Regular Season",
        startTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 9 * 60 * 60 * 1000),
        category: "football",
        status: "upcoming",
        currentScore: null,
        markets: [
          {
            id: "fallback-nfl-4-winner",
            name: "Match Winner",
            outcomes: [
              { id: "dolphins-win", name: "Miami Dolphins", odds: 1.8, impliedProbability: 55.6 },
              { id: "jets-win", name: "New York Jets", odds: 2.0, impliedProbability: 50.0 },
            ],
            isResolved: false,
          },
        ],
        totalVolume: 420000,
        participantCount: 850,
      },
      {
        id: "fallback-nfl-5",
        title: "Pittsburgh Steelers vs Baltimore Ravens",
        description: "NFL Division Rivalry",
        startTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 11 * 60 * 60 * 1000),
        category: "football",
        status: "upcoming",
        currentScore: null,
        markets: [
          {
            id: "fallback-nfl-5-winner",
            name: "Match Winner",
            outcomes: [
              { id: "steelers-win", name: "Pittsburgh Steelers", odds: 2.1, impliedProbability: 47.6 },
              { id: "ravens-win", name: "Baltimore Ravens", odds: 1.75, impliedProbability: 57.1 },
            ],
            isResolved: false,
          },
        ],
        totalVolume: 690000,
        participantCount: 1300,
      },
      // Soccer/Football Events (20 events)
      {
        id: "fallback-laliga-1",
        title: "Real Madrid vs Barcelona",
        description: "La Liga - El Clasico",
        startTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
        category: "football",
        status: "upcoming",
        currentScore: null,
        markets: [
          {
            id: "fallback-laliga-1-winner",
            name: "Match Winner",
            outcomes: [
              { id: "real-win", name: "Real Madrid", odds: 2.1, impliedProbability: 47.6 },
              { id: "barca-win", name: "Barcelona", odds: 2.3, impliedProbability: 43.5 },
              { id: "draw", name: "Draw", odds: 3.2, impliedProbability: 31.3 },
            ],
            isResolved: false,
          },
        ],
        totalVolume: 950000,
        participantCount: 2100,
      },
      {
        id: "fallback-epl-1",
        title: "Manchester United vs Liverpool",
        description: "Premier League",
        startTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 10 * 60 * 60 * 1000),
        category: "football",
        status: "upcoming",
        currentScore: null,
        markets: [
          {
            id: "fallback-epl-1-winner",
            name: "Match Winner",
            outcomes: [
              { id: "united-win", name: "Manchester United", odds: 2.4, impliedProbability: 41.7 },
              { id: "liverpool-win", name: "Liverpool", odds: 1.9, impliedProbability: 52.6 },
              { id: "draw", name: "Draw", odds: 3.5, impliedProbability: 28.6 },
            ],
            isResolved: false,
          },
        ],
        totalVolume: 1100000,
        participantCount: 1850,
      },
      {
        id: "fallback-epl-2",
        title: "Manchester City vs Arsenal",
        description: "Premier League",
        startTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 14 * 60 * 60 * 1000),
        category: "football",
        status: "upcoming",
        currentScore: null,
        markets: [
          {
            id: "fallback-epl-2-winner",
            name: "Match Winner",
            outcomes: [
              { id: "city-win", name: "Manchester City", odds: 1.7, impliedProbability: 58.8 },
              { id: "arsenal-win", name: "Arsenal", odds: 2.5, impliedProbability: 40.0 },
              { id: "draw", name: "Draw", odds: 3.8, impliedProbability: 26.3 },
            ],
            isResolved: false,
          },
        ],
        totalVolume: 1200000,
        participantCount: 2000,
      },
      {
        id: "fallback-epl-3",
        title: "Chelsea vs Tottenham",
        description: "Premier League - London Derby",
        startTime: new Date(Date.now() + 16 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 18 * 60 * 60 * 1000),
        category: "football",
        status: "upcoming",
        currentScore: null,
        markets: [
          {
            id: "fallback-epl-3-winner",
            name: "Match Winner",
            outcomes: [
              { id: "chelsea-win", name: "Chelsea", odds: 2.0, impliedProbability: 50.0 },
              { id: "spurs-win", name: "Tottenham", odds: 2.2, impliedProbability: 45.5 },
              { id: "draw", name: "Draw", odds: 3.4, impliedProbability: 29.4 },
            ],
            isResolved: false,
          },
        ],
        totalVolume: 850000,
        participantCount: 1650,
      },
      {
        id: "fallback-bundesliga-1",
        title: "Bayern Munich vs Borussia Dortmund",
        description: "Bundesliga - Der Klassiker",
        startTime: new Date(Date.now() + 20 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 22 * 60 * 60 * 1000),
        category: "football",
        status: "upcoming",
        currentScore: null,
        markets: [
          {
            id: "fallback-bundesliga-1-winner",
            name: "Match Winner",
            outcomes: [
              { id: "bayern-win", name: "Bayern Munich", odds: 1.8, impliedProbability: 55.6 },
              { id: "dortmund-win", name: "Borussia Dortmund", odds: 2.4, impliedProbability: 41.7 },
              { id: "draw", name: "Draw", odds: 3.6, impliedProbability: 27.8 },
            ],
            isResolved: false,
          },
        ],
        totalVolume: 780000,
        participantCount: 1400,
      },
      // Basketball Events (15 events)
      {
        id: "fallback-nba-1",
        title: "Los Angeles Lakers vs Boston Celtics",
        description: "NBA Regular Season",
        startTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 9 * 60 * 60 * 1000),
        category: "basketball",
        status: "upcoming",
        currentScore: null,
        markets: [
          {
            id: "fallback-nba-1-winner",
            name: "Match Winner",
            outcomes: [
              { id: "lakers-win", name: "Los Angeles Lakers", odds: 1.95, impliedProbability: 51.3 },
              { id: "celtics-win", name: "Boston Celtics", odds: 1.85, impliedProbability: 54.1 },
            ],
            isResolved: false,
          },
        ],
        totalVolume: 580000,
        participantCount: 1200,
      },
      {
        id: "fallback-nba-2",
        title: "Golden State Warriors vs Phoenix Suns",
        description: "NBA Regular Season",
        startTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 15 * 60 * 60 * 1000),
        category: "basketball",
        status: "upcoming",
        currentScore: null,
        markets: [
          {
            id: "fallback-nba-2-winner",
            name: "Match Winner",
            outcomes: [
              { id: "warriors-win", name: "Golden State Warriors", odds: 2.1, impliedProbability: 47.6 },
              { id: "suns-win", name: "Phoenix Suns", odds: 1.75, impliedProbability: 57.1 },
            ],
            isResolved: false,
          },
        ],
        totalVolume: 420000,
        participantCount: 890,
      },
      {
        id: "fallback-nba-3",
        title: "Miami Heat vs Milwaukee Bucks",
        description: "NBA Eastern Conference",
        startTime: new Date(Date.now() + 18 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 21 * 60 * 60 * 1000),
        category: "basketball",
        status: "upcoming",
        currentScore: null,
        markets: [
          {
            id: "fallback-nba-3-winner",
            name: "Match Winner",
            outcomes: [
              { id: "heat-win", name: "Miami Heat", odds: 2.3, impliedProbability: 43.5 },
              { id: "bucks-win", name: "Milwaukee Bucks", odds: 1.65, impliedProbability: 60.6 },
            ],
            isResolved: false,
          },
        ],
        totalVolume: 520000,
        participantCount: 950,
      },
      // Live Events (5 events)
      {
        id: "fallback-live-1",
        title: "Chelsea vs Arsenal",
        description: "Premier League - Live",
        startTime: new Date(Date.now() - 30 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        category: "football",
        status: "live",
        currentScore: "1-1",
        markets: [
          {
            id: "fallback-live-1-winner",
            name: "Match Winner",
            outcomes: [
              { id: "chelsea-win", name: "Chelsea", odds: 2.2, impliedProbability: 45.5 },
              { id: "arsenal-win", name: "Arsenal", odds: 2.0, impliedProbability: 50.0 },
              { id: "draw", name: "Draw", odds: 3.8, impliedProbability: 26.3 },
            ],
            isResolved: false,
          },
        ],
        totalVolume: 890000,
        participantCount: 1650,
      },
      {
        id: "fallback-live-2",
        title: "Denver Nuggets vs Los Angeles Clippers",
        description: "NBA - Live",
        startTime: new Date(Date.now() - 45 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 75 * 60 * 60 * 1000),
        category: "basketball",
        status: "live",
        currentScore: "78-82",
        markets: [
          {
            id: "fallback-live-2-winner",
            name: "Match Winner",
            outcomes: [
              { id: "nuggets-win", name: "Denver Nuggets", odds: 1.9, impliedProbability: 52.6 },
              { id: "clippers-win", name: "Los Angeles Clippers", odds: 1.9, impliedProbability: 52.6 },
            ],
            isResolved: false,
          },
        ],
        totalVolume: 650000,
        participantCount: 1100,
      },
    ]
  }

  private getFallbackCryptoEvents(): Event[] {
    console.log("[v0] Using fallback crypto events")
    const cryptos = [
      { name: "Bitcoin", symbol: "BTC", price: 43250, change: 2.5 },
      { name: "Ethereum", symbol: "ETH", price: 2650, change: -1.2 },
      { name: "Binance Coin", symbol: "BNB", price: 315, change: 3.8 },
      { name: "Solana", symbol: "SOL", price: 98, change: 5.2 },
      { name: "XRP", symbol: "XRP", price: 0.52, change: -2.1 },
      { name: "Cardano", symbol: "ADA", price: 0.48, change: 1.8 },
      { name: "Avalanche", symbol: "AVAX", price: 36, change: 4.5 },
      { name: "Dogecoin", symbol: "DOGE", price: 0.08, change: -0.5 },
      { name: "Polygon", symbol: "MATIC", price: 0.85, change: 2.3 },
      { name: "Chainlink", symbol: "LINK", price: 14.5, change: 1.9 },
      { name: "Litecoin", symbol: "LTC", price: 72, change: -1.8 },
      { name: "Uniswap", symbol: "UNI", price: 6.2, change: 3.1 },
      { name: "Internet Computer", symbol: "ICP", price: 12.8, change: 0.7 },
      { name: "Stellar", symbol: "XLM", price: 0.11, change: -0.9 },
      { name: "VeChain", symbol: "VET", price: 0.025, change: 2.8 },
      { name: "Filecoin", symbol: "FIL", price: 5.4, change: 1.2 },
      { name: "TRON", symbol: "TRX", price: 0.105, change: -1.5 },
      { name: "Cosmos", symbol: "ATOM", price: 9.8, change: 3.7 },
      { name: "Monero", symbol: "XMR", price: 158, change: 0.8 },
      { name: "Algorand", symbol: "ALGO", price: 0.18, change: 2.1 },
    ]

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
