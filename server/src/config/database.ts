import mongoose from "mongoose";
import { env } from "./env";

export const connectDatabase = async (): Promise<void> => {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(env.MONGODB_URI);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};