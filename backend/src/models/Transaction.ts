import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  uuid: string;           
  vaultId: number;
  txType: string;    
  signer: string;    
  txHash: string;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema<ITransaction>(
  {
    uuid: { type: String, required: true, unique: true, index: true },
    vaultId: { type: Number, required: true, index: true },
    txType: { type: String, required: true, index: true },
    signer: { type: String, required: true, index: true },
    txHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true // adds createdAt + updatedAt automatically
  }
);

export default mongoose.models.Bet || mongoose.model<ITransaction>("Transaction", TransactionSchema);
