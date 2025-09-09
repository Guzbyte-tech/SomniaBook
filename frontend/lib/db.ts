import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI!;

if (!MONGO_URI) {
  throw new Error("❌ Please define MONGO_URI in .env.local");
}

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  return mongoose.connect(MONGO_URI, {
    dbName: "sports-betting",
  });
}
