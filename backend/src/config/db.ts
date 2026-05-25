import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async (): Promise<void> => {
  try {
    const connString = process.env.MONGODB_URI || 'mongodb://localhost:27017/sonicscript';
    console.log(`Connecting to MongoDB at: ${connString.replace(/:([^:@]+)@/, ':****@')}`);
    
    const conn = await mongoose.connect(connString);
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${(error as Error).message}`);
    // Do not crash the application in dev mode if database is offline, just log it.
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};
