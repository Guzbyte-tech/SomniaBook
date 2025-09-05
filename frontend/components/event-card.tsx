"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Event } from "@/lib/types"
import Link from "next/link"

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date()
      const target = event.status === "upcoming" ? event.startTime : event.endTime

      if (!target) return

      const diff = target.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft("Live")
        return
      }

      const minutes = Math.floor(diff / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (minutes > 60) {
        const hours = Math.floor(minutes / 60)
        setTimeLeft(`${hours}h ${minutes % 60}m`)
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`)
      }
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [event])

  const topMarket = event.markets[0]
  const statusColor = {
    upcoming: "bg-blue-500/20 text-blue-400",
    live: "bg-green-500/20 text-green-400",
    ended: "bg-gray-500/20 text-gray-400",
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{event.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{event.description}</p>
          </div>
          <Badge className={statusColor[event.status]}>{event.status}</Badge>
        </div>

        {event.currentScore && <div className="text-sm font-medium text-primary">{event.currentScore}</div>}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{event.status === "upcoming" ? "Starts in" : "Ends in"}</span>
          <span className="font-medium text-primary">{timeLeft}</span>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Volume: ${event.totalVolume.toLocaleString()}</span>
          <span>{event.participantCount} bettors</span>
        </div>

        {topMarket && (
          <div>
            <div className="text-sm font-medium mb-2">{topMarket.name}</div>
            <div className="grid grid-cols-2 gap-2">
              {topMarket.outcomes.slice(0, 2).map((outcome) => (
                <div key={outcome.name} className="flex justify-between items-center p-2 bg-muted rounded text-xs">
                  <span className="truncate">{outcome.name}</span>
                  <span className="font-medium text-primary">{outcome.odds.toFixed(2)}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link href={`/events/${event.id}`}>
          <Button className="w-full bg-transparent" variant="outline">
            View Event
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
