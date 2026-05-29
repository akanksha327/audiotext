import { Schema, model, Document, Types } from 'mongoose';

export interface ITranscript extends Document {
  title: string;
  audioUrl?: string;
  duration: number; // in seconds
  text: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  language: string;
  source?: string; // 'recording' | 'upload' etc.
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
      required: [true, 'Title is required'],
      default: 'Untitled Audio',
      trim: true,
    },
    audioUrl: {
      type: String,
      required: false,
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      default: 0,
      min: [0, 'Duration cannot be negative'],
    },
    text: {
      type: String,
      required: [true, 'Transcript text is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'completed',
    },
    language: {
      type: String,
      default: 'en',
    },
    source: {
      type: String,
      required: false,
      default: 'recording',
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
      min: [0, 'File size cannot be negative'],
    },
    mimeType: {
      type: String,
      required: false,
    },
    accuracy: {
      type: Number,
      required: false,
      default: 95,
      min: [0, 'Accuracy cannot be less than 0'],
      max: [100, 'Accuracy cannot exceed 100'],
    },
  },
  {
    timestamps: true,
  }
);

export const Transcript = model<ITranscript>('Transcript', TranscriptSchema);
