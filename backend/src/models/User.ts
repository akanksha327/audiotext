import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  avatar: string;
  accountType: string;
  storageLimit: number; // in bytes (e.g., 100MB)
  storageUsed: number;  // in bytes
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      default: 'Sandbox User',
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      default: 'user@voxnote.ai',
      trim: true,
      lowercase: true,
    },
    avatar: {
      type: String,
      default: 'VN',
    },
    accountType: {
      type: String,
      default: 'Premium AI Sandbox',
    },
    storageLimit: {
      type: Number,
      default: 100 * 1024 * 1024, // 100MB
    },
    storageUsed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>('User', UserSchema);
