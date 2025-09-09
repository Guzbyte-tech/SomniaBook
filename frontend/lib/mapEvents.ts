import type { Event, Market, Outcome } from "./types"; // import your types

export function mapOddsApiToEvents(apiEvents: any[]): Event[] {
  return apiEvents.map((apiEvent) => {
    const markets: Market[] = [];

    if (apiEvent.bookmakers.length > 0) {
      const bookmaker = apiEvent.bookmakers[0];

      bookmaker.markets.forEach((market: any) => {
        const outcomes: Outcome[] = market.outcomes.map((o: any) => ({
          id: `${apiEvent.id}-${market.key}-${o.name}`,
          name: o.name,
          odds: o.price,
          impliedProbability: (1 / o.price) * 100,
        }));

        markets.push({
          id: `${apiEvent.id}-${market.key}`,
          name: getMarketDisplayName(market.key),
          outcomes,
          isResolved: false,
        });
      });
    }

    const startTime = new Date(apiEvent.commence_time);
    const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);

    let status: "upcoming" | "live" | "ended" = "upcoming";
    const now = new Date();
    if (now >= startTime && now < endTime) {
      status = "live";
    } else if (now >= endTime) {
      status = "ended";
    }

    return {
      id: apiEvent.id,
      title: `${apiEvent.away_team} vs ${apiEvent.home_team}`,
      description: apiEvent.sport_title,
      startTime,
      endTime,
      category: getCategoryFromSport(apiEvent.sport_key),
      status,
      currentScore:
        status === "live"
          ? `${Math.floor(Math.random() * 3)}-${Math.floor(Math.random() * 3)}`
          : null,
      markets,
      totalVolume: Math.floor(Math.random() * 1000000),
      participantCount: Math.floor(Math.random() * 5000),
    };
  });
}

function getMarketDisplayName(key: string): string {
  const map: Record<string, string> = {
    h2h: "Match Winner",
    spreads: "Point Spread",
    totals: "Over/Under",
  };
  return map[key] || key;
}

function getCategoryFromSport(sportKey: string): string {
  if (sportKey.includes("football")) return "football";
  if (sportKey.includes("basketball")) return "basketball";
  if (sportKey.includes("soccer")) return "football";
  if (sportKey.includes("hockey")) return "hockey";
  return "sports";
}
