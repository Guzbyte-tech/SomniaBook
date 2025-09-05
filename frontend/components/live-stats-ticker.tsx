"use client"

import { useEffect, useState } from "react"
import { mockStats } from "@/lib/mock-data"

export function LiveStatsTicker() {
  const [currentWinIndex, setCurrentWinIndex] = useState(0)
  const [stats, setStats] = useState(mockStats)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWinIndex((prev) => (prev + 1) % mockStats.recentWins.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats({ ...mockStats })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary animate-pulse">{stats.totalMarkets}</div>
          <div className="text-sm text-muted-foreground">Live Markets</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{stats.totalLiquidity}</div>
          <div className="text-sm text-muted-foreground">Total Liquidity</div>
        </div>

        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Recent Win</div>
          <div className="h-12 flex items-center justify-center">
            <div key={currentWinIndex} className="animate-in slide-in-from-bottom-2 duration-500">
              <div className="text-sm font-medium text-green-400">{stats.recentWins[currentWinIndex]?.user}</div>
              <div className="text-xs text-muted-foreground">
                {stats.recentWins[currentWinIndex]?.amount} • {stats.recentWins[currentWinIndex]?.outcome}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-1 pulse-glow"></div>
          <div className="text-xs text-muted-foreground">Live Updates</div>
        </div>
      </div>
    </div>
  )
}
