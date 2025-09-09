import mongoose, { Schema, Document } from "mongoose";

export interface IBet extends Document {
uuid: string;           // MongoDB unique ID
  betId: string;            // bytes32 from contract
  user: string;             // wallet address
  amount: string;           // stored as string to avoid JS number issues
  odds: string;             // stored as string (odds * 1000)
  eventId?: string;         // odds API eventId
  marketId?: string;        // odds API marketId
  outcomeId?: string;       // odds API outcomeId
  status: "active" | "won" | "lost" | "cancelled" | "claimed";
  txHash?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

const BetSchema: Schema = new Schema<IBet>(
  {
    uuid: { type: String, required: true, unique: true, index: true },
    betId: { type: String, required: true, unique: true, index: true },
    user: { type: String, required: true, index: true },
    amount: { type: String, required: true },
    odds: { type: String, required: true },
    eventId: { type: String },
    marketId: { type: String },
    outcomeId: { type: String },
    status: {
      type: String,
      enum: ["active", "won", "lost", "cancelled", "claimed"],
      default: "active"
    },
    txHash: { type: String },
    createdAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date }
  },
  {
    timestamps: true // adds createdAt + updatedAt automatically
  }
);

export default mongoose.models.Bet || mongoose.model<IBet>("Bet", BetSchema);
