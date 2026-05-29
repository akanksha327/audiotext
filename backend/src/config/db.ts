import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';

dotenv.config();

const seedSandboxUser = async (): Promise<void> => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      await User.create({
        name: 'Sandbox User',
        email: 'user@sonicscript.ai',
        avatar: 'SS',
        accountType: 'Premium AI Sandbox',
        storageLimit: 100 * 1024 * 1024, // 100MB
        storageUsed: 4.2 * 1024 * 1024,  // 4.2MB starter data
      });
      console.log(`Default sandbox user seeded successfully.`);
    }
  } catch (err) {
    console.warn(`User seeding failed: ${(err as Error).message}`);
  }
};

export const connectDB = async (): Promise<void> => {
  try {
    const connString = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sonicscript';
    console.log(`Connecting to MongoDB at: ${connString.replace(/:([^:@]+)@/, ':****@')}`);
    
    const conn = await mongoose.connect(connString);
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
    
    // Seed default user
    await seedSandboxUser();
  } catch (error) {
    console.error(`MongoDB Connection Error: ${(error as Error).message}`);
    // Do not crash the application in dev mode if database is offline, just log it.
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};
