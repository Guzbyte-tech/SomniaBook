import axios from "axios";
import cron from "node-cron";
import Bet from "../models/Bet";
import contract from "../config/contract";
import { chunkArray } from "../utils/chunk";

/**
 * Start automatic resolver
 */
export function startResolver() {
  const schedule = process.env.RESOLVE_INTERVAL || "*/5 * * * *"; // default: every 5 min
  console.log(`⏱️  Auto-resolver running every: ${schedule}`);

  cron.schedule(schedule, async () => {
    console.log("🔍 Checking for resolvable events...");

    try {
      // Find distinct unresolved eventIds in bets
      const activeEvents = await Bet.distinct("eventId", { status: "active" });
      for (const eventId of activeEvents) {
        if (!eventId) continue;
        await resolveEvent(eventId);
      }
    } catch (err) {
      console.error("Resolver job failed:", err);
    }
  });
}

async function resolveEvent(eventId: string) {
  try {
    // fetch event from Odds API
    const url = `${process.env.ODDS_API_URL}/events/${eventId}`;
    const { data } = await axios.get(url, {
      headers: { "Authorization": `Bearer ${process.env.ODDS_API_KEY}` }
    });

    if (!data) return;

    const { status, markets } = data;

    // only resolve finished events
    if (status !== "finished" && status !== "completed") return;

    // Example: find winner of "Match Winner" market
    const market = markets.find((m: any) => m.name === "Match Winner");
    if (!market || !market.isResolved) return;

    const winningOutcome = market.outcomes.find((o: any) => o.isWinner === true);
    if (!winningOutcome) return;

    const winningOutcomeId = winningOutcome.id;
    console.log(`🏆 Event ${eventId} winner: ${winningOutcomeId}`);

    // get all active bets for this event
    const activeBets = await Bet.find({ eventId, status: "active" });
    if (activeBets.length === 0) return;

    const winners = activeBets.filter(b => b.outcomeId === winningOutcomeId).map(b => b.betId);
    const losers = activeBets.filter(b => b.outcomeId !== winningOutcomeId).map(b => b.betId);

    
    const BATCH_SIZE = parseInt(process.env.RESOLVE_BATCH_SIZE || "200", 10);

    // resolve winners
    for (const chunk of chunkArray(winners, BATCH_SIZE)) {
      if (chunk.length === 0) continue;
      const tx = await contract.resolveBets(chunk, true);
      await tx.wait();
      await Bet.updateMany(
        { betId: { $in: chunk } },
        { $set: { status: "won", resolvedAt: new Date() } }
      );
      console.log(`✅ Resolved ${chunk.length} winners`);
    }

    // resolve losers
    for (const chunk of chunkArray(losers, BATCH_SIZE)) {
      if (chunk.length === 0) continue;
      const tx = await contract.resolveBets(chunk, false);
      await tx.wait();
      await Bet.updateMany(
        { betId: { $in: chunk } },
        { $set: { status: "lost", resolvedAt: new Date() } }
      );
      console.log(`❌ Resolved ${chunk.length} losers`);
    }

  } catch (err: any) {
    console.error(`Failed resolving event ${eventId}:`, err.message || err);
  }
}
