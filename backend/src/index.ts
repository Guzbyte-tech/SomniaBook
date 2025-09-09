import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import contract from './config/contract';
import Bet from "./models/Bet";
import { chunkArray } from "./utils/chunk";
import { startResolver } from "./services/resolver";




dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: process.env.NODE_ENV === "production"
    ? "https://yourfrontend.com"
    : "*", // allow all during dev
};

app.use(cors(corsOptions));

connectDB();
app.use(express.json()); 

//Set up to listen to contract events here...
console.log('Setting up contract event listeners...');
contract.on("BetPlaced", async (betId: string, user: string, amount: any, odds: any, event: any) => {
  try{
      console.log('🎯 BetPlaced Event:', {
        betId: betId.toString(),
        user: user.toString(),
        amount: amount.toString(),
        odds: odds.toString(),
        transactionHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber
      });

      //Save to DB or process as needed...
      await Bet.create({
        betId: betId.toString(),
        user: user.toLowerCase(),
        amount: amount.toString(),
        odds: odds.toString(),
        status: "active",
        txHash: event?.transactionHash ?? null
      });


  } catch(err){
    console.error('Error handling BetPlaced event:', err);
    return;
  }
  
});



app.get("/", (req, res) => {
  res.send("API is running");
});

// Route files

// In /indexBet
app.post("/mapBetting", async (req, res) => {
  
  const { betId, eventId, marketId, outcomeId, txHash } = req.body;
  if (!betId || !eventId || !outcomeId) {
    return res.status(400).json({ error: "betId, eventId and outcomeId required" });
  }

  await Bet.updateOne(
    { betId },
    { $set: { eventId, marketId: marketId || null, outcomeId, txHash: txHash || null } }
  );

  return res.json({
    success: true,
    message: "Bet mapped successfully",
  }).status(200);
});


 startResolver();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});