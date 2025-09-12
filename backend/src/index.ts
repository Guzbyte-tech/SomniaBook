import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import contract from './config/contract';
import { chunkArray } from "./utils/chunk";
import Transaction from "./models/Transaction";




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





app.get("/", (req, res) => {
  res.send("API is running");
});

// Route files
app.post("/transaction/post", async (req, res) => {
  const { uuid, vaultId, txType, signer, txHash } = req.body;
  if (!uuid || !vaultId || !txType || !signer || !txHash) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }
  try {
    const transaction = new Transaction({ uuid, vaultId, txType, signer, txHash });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    if(error instanceof Error) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(400).json({message: String(error)});
  }
})

//Fetch transactinos by vaultId
app.get("/transaction/:vaultId", async (req, res) => {
  const { vaultId } = req.params;
  if (!vaultId) {
    res.status(400).json({ message: "Vault ID is required" });
    return;
  }
  try {
    const transactions = await Transaction.find({ vaultId });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(400).json({ message: String(error) });
  }
});

// In /indexBet


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});