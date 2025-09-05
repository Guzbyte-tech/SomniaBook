"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Clock } from "lucide-react"
import { simulation } from "@/lib/simulation"

interface LiveEvent {
  id: string
  type: "goal" | "card" | "price_move" | "basket" | "corner" | "substitution"
  message: string
  timestamp: Date
  eventId: string
}

export function LiveMatchFeed() {
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([])

  useEffect(() => {
    const handleLiveEvent = (event: LiveEvent) => {
      setLiveEvents((prev) => [event, ...prev.slice(0, 9)]) // Keep last 10 events
    }

    simulation.onLiveEvent(handleLiveEvent)
    simulation.start()

    return () => {
      simulation.stop()
    }
  }, [])

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "goal":
        return "bg-green-500/20 text-green-400"
      case "card":
        return "bg-yellow-500/20 text-yellow-400"
      case "price_move":
        return "bg-blue-500/20 text-blue-400"
      case "basket":
        return "bg-orange-500/20 text-orange-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Live Match Feed
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-80 overflow-y-auto">
          {liveEvents.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Waiting for live events...</p>
            </div>
          ) : (
            liveEvents.map((event) => (
              <div key={event.id} className="p-4 border-b border-border last:border-b-0 animate-in slide-in-from-top-2">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                  <span className="text-xs text-muted-foreground">{event.timestamp.toLocaleTimeString()}</span>
                </div>
                <p className="text-sm">{event.message}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
