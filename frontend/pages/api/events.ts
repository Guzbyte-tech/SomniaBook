import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { mapOddsApiToEvents } from "../../lib/mapEvents";
import { connectDB } from "@/lib/db";
import { OddsEvent } from "@/models/OddsEvent";

const ODDS_API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY!;
const ODDS_API_URL = "https://api.the-odds-api.com/v4";
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDB();

    const { sportKey } = req.query;
    if (!sportKey || typeof sportKey !== "string") {
      return res.status(400).json({ error: "Missing sportKey" });
    }

    // 1. Check cache (Mongo)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let cached = await OddsEvent.findOne({
      sportKey,
      lastUpdated: { $gte: oneHourAgo },
    });

    if (cached) {
      return res.status(200).json({ source: "cache", data: cached.data });
    }
          // const url = `${ODDS_API_URL}/sports/${sport}/odds?apiKey=${ODDS_API_KEY}&regions=us,uk&markets=h2h,spreads,totals&oddsFormat=decimal`

    // 2. Fetch fresh from Odds API
    const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds?apiKey=${process.env.NEXT_PUBLIC_ODDS_API_KEY}&regions=us,uk&markets=h2h,spreads,totals&oddsFormat=decimal`;

    console.log("Fetching from Odds API:", url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Odds API failed with status ${response.status}`);
    }

    const events = await response.json();
    const mappedEvents = mapOddsApiToEvents(events);

    // 3. Save/Update in MongoDB
    await OddsEvent.findOneAndUpdate(
      { sportKey },
      { sportKey, data: mappedEvents, lastUpdated: new Date() },
      { upsert: true }
    );

    res.status(200).json({ source: "api", data: mappedEvents });
  } catch (err: any) {
    console.error("❌ Error in /api/events:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}
