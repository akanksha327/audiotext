import { Schema, model, Document, Types } from 'mongoose';

export interface ITranscript extends Document {
  title: string;
  audioUrl?: string;
  duration: number; // in seconds
  text: string;
  status: 'pending' | 'completed' | 'failed';
  language: string;
  user?: Types.ObjectId;
  fileName?: string;
  fileSize?: number; // in bytes
  mimeType?: string;
  accuracy?: number; // in percentage
  createdAt: Date;
  updatedAt: Date;
}

const TranscriptSchema = new Schema<ITranscript>(
  {
    title: {
      type: String,
      required: true,
      default: 'Untitled Audio',
      trim: true,
    },
    audioUrl: {
      type: String,
      required: false,
    },
    duration: {
      type: Number,
      required: true,
      default: 0,
    },
    text: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    language: {
      type: String,
      default: 'en',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    fileName: {
      type: String,
      required: false,
    },
    fileSize: {
      type: Number,
      required: false,
      default: 0,
    },
    mimeType: {
      type: String,
      required: false,
    },
    accuracy: {
      type: Number,
      required: false,
      default: 95,
    },
  },
  {
    timestamps: true,
  }
);

export const Transcript = model<ITranscript>('Transcript', TranscriptSchema);
