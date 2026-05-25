import { Request, Response, NextFunction } from 'express';
import { Transcript } from '../models/Transcript.js';
import { ApiResponse } from '../utils/apiResponse.js';

// Pre-populated transcripts for demo fallback when DB is empty or disconnected
const demoTranscripts = [
  {
    _id: 'demo-1',
    title: 'Project Kickoff Meeting',
    duration: 72,
    text: 'Welcome everyone to the SonicScript kickoff meeting. Today we are launching our new AI speech-to-text SaaS foundation. We will focus on extreme visual premium feel, responsive panels, high accessibility, and instant downloads. The goal is to provide human-crafted layouts with zero template clutter.',
    status: 'completed',
    language: 'en',
    createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 2),
  },
  {
    _id: 'demo-2',
    title: 'Product Design Thoughts',
    duration: 120,
    text: 'I think we should stick to a clean, today-human aesthetic. Let us avoid artificial neon greens and purples. Deep charcoal gray surfaces, premium system typography like Inter, subtle cards with glassmorphic borders, and very soft, elegant buttons. Every interaction needs a micro-transition to feel organic and premium.',
    status: 'completed',
    language: 'en',
    createdAt: new Date(Date.now() - 3600000 * 24), // 24 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 24),
  }
];

const mockSentences = [
  "Integrating speech recognition APIs directly in the client gives users real-time transcription access.",
  "We are leveraging standard Web Audio API pipelines inside modern browsers to record high-fidelity voice snippets.",
  "By storing transcripts on a MongoDB cluster, we can track and index documents with search utilities efficiently.",
  "SonicScript leverages advanced neural networks to separate acoustics and output human-readable, punctuated transcripts.",
  "This foundation uses clean React states, custom hooks, and Tailwind CSS v4 styles to build a premium developer workspace."
];

// Helper to generate a random transcript text for simulation
const generateMockText = (durationSec: number): string => {
  const sentencesCount = Math.max(1, Math.min(5, Math.ceil(durationSec / 15)));
  const list: string[] = [];
  for (let i = 0; i < sentencesCount; i++) {
    const idx = Math.floor(Math.random() * mockSentences.length);
    list.push(mockSentences[idx]);
  }
  return list.join(' ');
};

/**
 * Get all transcripts
 */
export const getTranscripts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let transcripts: any[] = [];
    try {
      transcripts = await Transcript.find().sort({ createdAt: -1 });
    } catch (dbError) {
      console.warn('Database connection unavailable, falling back to in-memory demo data.');
    }

    if (transcripts.length === 0) {
      // Return demo data if DB is empty or connection fails
      ApiResponse.success(res, demoTranscripts, 'Fetched demo transcripts successfully');
      return;
    }

    ApiResponse.success(res, transcripts, 'Fetched transcripts successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new transcript
 */
export const createTranscript = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, duration, text, status, language } = req.body;

    const transcriptDuration = duration || Math.floor(Math.random() * 90) + 10; // default 10-100s
    const transcriptTitle = title || 'Speech Record';
    const transcriptText = text || generateMockText(transcriptDuration);

    let newTranscript: any;
    try {
      newTranscript = await Transcript.create({
        title: transcriptTitle,
        duration: transcriptDuration,
        text: transcriptText,
        status: status || 'completed',
        language: language || 'en',
      });
      console.log(`Saved new transcript to database: ${newTranscript._id}`);
    } catch (dbError) {
      console.warn('Database save failed or bypassed, creating transient in-memory transcript.');
      newTranscript = {
        _id: 'transient-' + Math.random().toString(36).substr(2, 9),
        title: transcriptTitle,
        duration: transcriptDuration,
        text: transcriptText,
        status: status || 'completed',
        language: language || 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    ApiResponse.success(res, newTranscript, 'Transcript created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a transcript
 */
export const deleteTranscript = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (id.startsWith('demo-') || id.startsWith('transient-')) {
      // Mock successful deletion of mockup items
      ApiResponse.success(res, { id }, 'Demo transcript deleted successfully');
      return;
    }

    let result = null;
    try {
      result = await Transcript.findByIdAndDelete(id);
    } catch (dbError) {
      console.warn('Database deletion failed due to DB offline.');
    }

    if (!result && !id.startsWith('demo-') && !id.startsWith('transient-')) {
      ApiResponse.error(res, 'Transcript not found in database', 404);
      return;
    }

    ApiResponse.success(res, { id }, 'Transcript deleted successfully');
  } catch (error) {
    next(error);
  }
};
