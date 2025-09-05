"use client"

import { useEffect, useState } from "react"
import { EventCard } from "@/components/event-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/store"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Play,
  Clock,
  CheckCircle,
} from "lucide-react"

const categories = [
  { id: "all", name: "All Events", icon: Calendar },
  { id: "football", name: "Football", icon: Trophy },
  { id: "basketball", name: "Basketball", icon: Trophy },
  { id: "crypto", name: "Crypto & Stocks", icon: TrendingUp },
]

const statusFilters = [
  { id: "all", name: "All", icon: Calendar },
  { id: "live", name: "Live", icon: Play },
  { id: "upcoming", name: "Upcoming", icon: Clock },
  { id: "ended", name: "Ended", icon: CheckCircle },
]

const EVENTS_PER_PAGE = 20

export default function EventsPage() {
  const { events, isLoading, loadEvents } = useAppStore()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, selectedStatus])

  const filteredEvents = events
    .filter((event) => {
      const categoryMatch = selectedCategory === "all" || event.category === selectedCategory
      const statusMatch = selectedStatus === "all" || event.status === selectedStatus
      return categoryMatch && statusMatch
    })
    .sort((a, b) => {
      const dateA = new Date(a.startTime).getTime()
      const dateB = new Date(b.startTime).getTime()
      return dateA - dateB
    })

  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE)
  const startIndex = (currentPage - 1) * EVENTS_PER_PAGE
  const endIndex = startIndex + EVENTS_PER_PAGE
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex)

  const eventsByCategory = categories.reduce(
    (acc, category) => {
      if (category.id === "all") {
        acc[category.id] = events.length
      } else {
        acc[category.id] = events.filter((event) => event.category === category.id).length
      }
      return acc
    },
    {} as Record<string, number>,
  )

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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-green-400 rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-bold">PredictLive</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm hover:text-primary transition-colors">
              Markets
            </Link>
            <Link href="/my-bets" className="text-sm hover:text-primary transition-colors">
              My Bets
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">All Events</span>
          </h1>
          <p className="text-muted-foreground">Browse all available prediction markets, sorted by upcoming events</p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Filter by Category</h3>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const Icon = category.icon
              const count = eventsByCategory[category.id] || 0
              const isActive = selectedCategory === category.id

              return (
                <Button
                  key={category.id}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                  <Badge variant={isActive ? "secondary" : "outline"} className="ml-1">
                    {count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Filter by Status</h3>
          <div className="flex flex-wrap gap-3">
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

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {selectedCategory === "all" && selectedStatus === "all"
                ? `All Events (${filteredEvents.length})`
                : `${selectedCategory !== "all" ? categories.find((c) => c.id === selectedCategory)?.name : ""} ${selectedStatus !== "all" ? statusFilters.find((s) => s.id === selectedStatus)?.name : ""} Events (${filteredEvents.length})`.trim()}
            </h2>
            {isLoading && <div className="text-sm text-muted-foreground">Loading latest events...</div>}
          </div>

          {isLoading && events.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">No events found with current filters</div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setSelectedCategory("all")}>
                  Clear Category Filter
                </Button>
                <Button variant="outline" onClick={() => setSelectedStatus("all")}>
                  Clear Status Filter
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-10 h-10 p-0"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}

              <div className="text-center text-sm text-muted-foreground mt-4">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredEvents.length)} of {filteredEvents.length} events
              </div>
            </>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-primary mb-2">{events.length}</div>
            <div className="text-sm text-muted-foreground">Total Events</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-green-400 mb-2">
              {events.filter((e) => e.status === "live").length}
            </div>
            <div className="text-sm text-muted-foreground">Live Events</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-2">
              {events.filter((e) => e.status === "upcoming").length}
            </div>
            <div className="text-sm text-muted-foreground">Upcoming Events</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-2">
              {events.filter((e) => e.status === "ended").length}
            </div>
            <div className="text-sm text-muted-foreground">Ended Events</div>
          </div>
        </div>
      </main>
    </div>
  )
}
