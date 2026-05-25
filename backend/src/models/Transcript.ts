import { Schema, model, Document } from 'mongoose';

export interface ITranscript extends Document {
  title: string;
  audioUrl?: string;
  duration: number; // in seconds
  text: string;
  status: 'pending' | 'completed' | 'failed';
  language: string;
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
  },
  {
    timestamps: true,
  }
);

export const Transcript = model<ITranscript>('Transcript', TranscriptSchema);
