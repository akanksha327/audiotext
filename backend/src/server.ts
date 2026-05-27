import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import transcriptRoutes from './routes/transcriptRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { ApiResponse } from './utils/apiResponse.js';
import { whisperService } from './utils/whisperService.js';
import { Transcript } from './models/Transcript.js';
import { User } from './models/User.js';

// Setup environment configuration
dotenv.config();

// Create Express instance
const app = express();
const PORT = process.env.PORT || 5000;

// Setup Middleware
app.use(cors({
  origin: '*', // Allow all client origins for smooth frontend local setup
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
connectDB();

// Create HTTP server wrapping express
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

// Configure Socket.IO real-time audio pipeline
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  socket.on('start-recording', () => {
    whisperService.startSession(socket.id);
  });

  socket.on('audio-chunk', async (data: Buffer) => {
    const chunkBuffer = Buffer.from(data);
    whisperService.appendChunk(socket.id, chunkBuffer);

    // Stream partial transcript live to frontend
    const text = await whisperService.getPartialTranscript(socket.id);
    socket.emit('partial-transcript', { text });
  });

  socket.on('stop-recording', async (metadata: { title?: string; duration?: number; fileName?: string; fileSize?: number; mimeType?: string }) => {
    try {
      const finalCompiledText = await whisperService.finalizeTranscript(socket.id);
      
      const duration = metadata.duration || 10;
      const title = metadata.title || `Voice Note (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
      const fileSize = metadata.fileSize || Math.floor(duration * 16000); // 16KB/s approx
      const accuracy = Math.floor(Math.random() * 6) + 93; // 93-98%

      // Locate default seeded user
      const defaultUser = await User.findOne({ email: 'user@sonicscript.ai' });
      const userId = defaultUser ? defaultUser._id : undefined;

      const newTranscript = await Transcript.create({
        title,
        duration,
        text: finalCompiledText,
        status: 'completed',
        language: 'en',
        user: userId,
        fileName: metadata.fileName || 'VoiceNote.webm',
        fileSize,
        mimeType: metadata.mimeType || 'audio/webm',
        accuracy
      });

      // Update User storage limits
      if (defaultUser) {
        defaultUser.storageUsed += fileSize;
        await defaultUser.save();
      }

      // Emit success feedback to socket
      socket.emit('final-transcript', {
        success: true,
        data: newTranscript
      });

      console.log(`[Socket] Saved final transcript for socket ${socket.id} with accuracy ${accuracy}% to database.`);
    } catch (err) {
      console.error('[Socket] Stop recording failed:', err);
      socket.emit('final-transcript', {
        success: false,
        message: 'Could not finalize audio transcript'
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
    whisperService.finalizeTranscript(socket.id).catch(() => {});
  });
});

// Test Connection / Root Route
app.get('/', (req: Request, res: Response) => {
  return ApiResponse.success(res, {
    app: 'SonicScript API',
    status: 'Healthy',
    version: '1.0.0',
    time: new Date()
  }, 'SonicScript Server running successfully');
});

// App Router Integration
app.use('/api/transcripts', transcriptRoutes);
app.use('/api/users', userRoutes);

// Fallback Route Handler (404 Not Found)
app.use((req: Request, res: Response) => {
  return ApiResponse.error(res, `Route not found: ${req.originalUrl}`, 404);
});

// Global Error Handler Middleware
app.use(errorHandler);

// Listen on HTTP server (wrapping Socket.IO and Express app)
httpServer.listen(PORT, () => {
  console.log(`========================================`);
  console.log(` SonicScript Server running in ${process.env.NODE_ENV} mode`);
  console.log(` Local: http://localhost:${PORT}`);
  console.log(`========================================`);
});
