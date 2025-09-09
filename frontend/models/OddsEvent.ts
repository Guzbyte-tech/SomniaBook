import mongoose, { Schema, Document } from "mongoose";

export interface IOddsEvent extends Document {
  sportKey: string;
  data: any;
  updatedAt: Date;
}

const OddsEventSchema = new Schema<IOddsEvent>({
  sportKey: { type: String, required: true, unique: true },
  data: { type: Object, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export const OddsEvent =
  mongoose.models.OddsEvent ||
  mongoose.model<IOddsEvent>("OddsEvent", OddsEventSchema);
