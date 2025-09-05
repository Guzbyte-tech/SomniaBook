"use client"

import { useEffect, useState } from "react"
import { WalletConnect } from "@/components/wallet-connect"
import { LiveStatsTicker } from "@/components/live-stats-ticker"
import { EventCard } from "@/components/event-card"
import { LiveMatchFeed } from "@/components/live-match-feed"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/store"
import Link from "next/link"
import { Calendar, Play, Clock, CheckCircle } from "lucide-react"

const statusFilters = [
  { id: "all", name: "All", icon: Calendar },
  { id: "live", name: "Live", icon: Play },
  { id: "upcoming", name: "Upcoming", icon: Clock },
  { id: "ended", name: "Ended", icon: CheckCircle },
]

export default function HomePage() {
  const { events, isLoading, loadEvents } = useAppStore()
  const [selectedStatus, setSelectedStatus] = useState("all")

  useEffect(() => {
    loadEvents()

    const interval = setInterval(loadEvents, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadEvents])

  const getFeaturedEvents = () => {
    let filteredEvents = events

    if (selectedStatus !== "all") {
      filteredEvents = events.filter((e) => e.status === selectedStatus)
    }

    const footballEvents = filteredEvents.filter((e) => e.category === "football").slice(0, 8)
    const basketballEvents = filteredEvents.filter((e) => e.category === "basketball").slice(0, 4)
    const cryptoEvents = filteredEvents.filter((e) => e.category === "crypto").slice(0, 6)

    return [...footballEvents, ...basketballEvents, ...cryptoEvents].slice(0, 18)
  }

  const featuredEvents = getFeaturedEvents()

  const eventsByStatus = statusFilters.reduce(
    (acc, status) => {
      if (status.id === "all") {
        acc[status.id] = events.length
      } else {
        acc[status.id] = events.filter((event) => event.status === status.id).length
      }
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-green-400 rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <span className="text-xl font-bold">PredictLive</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm hover:text-primary transition-colors">
              Markets
            </Link>
            <Link href="/my-bets" className="text-sm hover:text-primary transition-colors">
              My Bets
            </Link>
            <Link href="/leaderboard" className="text-sm hover:text-primary transition-colors">
              Leaderboard
            </Link>
          </nav>

          <WalletConnect />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-green-400 to-primary bg-clip-text text-transparent">
              Bet as it happens,
            </span>
            <br />
            <span className="bg-gradient-to-r from-green-400 via-primary to-green-400 bg-clip-text text-transparent">
              get paid instantly
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Real-time prediction markets for sports, crypto, and live events. Place bets instantly and receive payouts
            the moment markets resolve.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <WalletConnect />
            <Button variant="outline" size="lg">
              Explore Markets
            </Button>
          </div>
        </div>

        {/* Live Stats Ticker */}
        <LiveStatsTicker />

        <div className="mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {statusFilters.map((status) => {
              const Icon = status.icon
              const count = eventsByStatus[status.id] || 0
              const isActive = selectedStatus === status.id

              return (
                <Button
                  key={status.id}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setSelectedStatus(status.id)}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Icon className="w-4 h-4" />
                  {status.name}
                  <Badge variant={isActive ? "secondary" : "outline"} className="ml-1">
                    {count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Featured Events */}
          <section className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {selectedStatus === "all"
                  ? "Featured Events"
                  : `${statusFilters.find((s) => s.id === selectedStatus)?.name} Events`}
                {isLoading && <span className="text-sm text-muted-foreground ml-2">(Loading...)</span>}
              </h2>
              <Button variant="ghost" asChild>
                <Link href="/events">View All Events</Link>
              </Button>
            </div>

            {isLoading && events.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(18)].map((_, i) => (
                  <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : featuredEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">No {selectedStatus} events available</div>
                <Button variant="outline" onClick={() => setSelectedStatus("all")}>
                  View All Events
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {featuredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </section>

          {/* Live Match Feed */}
          <section className="lg:col-span-1">
            <LiveMatchFeed />
          </section>
        </div>

        {/* Call to Action */}
        <section className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary/10 to-green-400/10 rounded-2xl p-8 border border-primary/20">
            <h3 className="text-2xl font-bold mb-4">Ready to start winning?</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Join thousands of users making instant profits on live events. Connect your wallet and place your first
              bet in seconds.
            </p>
            <WalletConnect />
          </div>
        </section>
      </main>

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-primary to-green-400 rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">P</span>
              </div>
              <span className="font-semibold">PredictLive</span>
            </div>

            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link href="/support" className="hover:text-primary transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
