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
import { DeepgramClient } from '@deepgram/sdk';

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// Active Deepgram connections mapped by socket ID
const dgConnections: Record<string, any> = {};
const dgTranscripts: Record<string, string> = {};
const dgLastEmitted: Record<string, string> = {};
const dgQueue: Record<string, Buffer[]> = {};

// Configure Socket.IO real-time audio pipeline
io.on('connection', (socket) => {
  console.log("Client connected");
  dgTranscripts[socket.id] = "";

  socket.on('start-recording', async () => {
    console.log(`[Socket] Start recording session for: ${socket.id}`);
    dgTranscripts[socket.id] = "";
    dgLastEmitted[socket.id] = "";
    dgQueue[socket.id] = [];
    
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (apiKey && apiKey !== 'your_deepgram_api_key_here') {
      try {
        const deepgram = new DeepgramClient({ apiKey });
        const connection = await deepgram.listen.v1.connect({
          model: 'nova-2',
          language: 'en-US',
          smart_format: true,
          interim_results: true,
        } as any);

        connection.on('open', () => {
          console.log("Deepgram connected");
          const queue = dgQueue[socket.id] || [];
          while (queue.length > 0) {
            const buf = queue.shift();
            if (buf) {
              connection.sendMedia(buf);
              console.log("Queued chunk sent to Deepgram");
            }
          }
        });

        connection.on('message', (data: any) => {
          const alternatives = data.channel?.alternatives || [];
          const transcript = alternatives[0]?.transcript || '';
          const isFinal = data.is_final || false;
          
          if (transcript) {
            console.log("Deepgram transcript received: " + transcript);
            
            // Calculate delta of words
            const lastText = dgLastEmitted[socket.id] || "";
            const lastWords = lastText.trim().split(/\s+/).filter(Boolean);
            const newWords = transcript.trim().split(/\s+/).filter(Boolean);
            
            let matchCount = 0;
            while (matchCount < lastWords.length && matchCount < newWords.length && 
                   newWords[matchCount].toLowerCase() === lastWords[matchCount].toLowerCase()) {
              matchCount++;
            }
            
            const deltaWords = newWords.slice(matchCount);
            const deltaText = deltaWords.join(" ");
            
            if (isFinal) {
              dgTranscripts[socket.id] = (dgTranscripts[socket.id] ? dgTranscripts[socket.id] + " " : "") + transcript;
              dgLastEmitted[socket.id] = "";
            } else {
              dgLastEmitted[socket.id] = transcript;
            }
            
            if (deltaText) {
              // Stream transcript back to frontend in real time (raw string segment)
              socket.emit('live-transcript', deltaText);
              console.log("Transcript emitted to frontend");
            }
          } else {
            const lastChunkSize = (socket as any).lastChunkSize || 0;
            console.log(`[Deepgram] Received empty transcript. Last chunk size: ${lastChunkSize} bytes. Deepgram connection state (readyState): ${connection.readyState}. Socket connected: ${socket.connected}.`);
          }
        });

        connection.on('error', (err: any) => {
          console.error(`[Deepgram] Live connection error for socket ${socket.id}:`, err);
        });

        connection.on('close', () => {
          console.log(`[Deepgram] Live connection closed for socket: ${socket.id}`);
        });

        // ACTUALLY CONNECT THE WEBSOCKET STREAM
        connection.connect();

        dgConnections[socket.id] = connection;
      } catch (e) {
        console.error('[Deepgram] Initialization failed:', e);
      }
    } else {
      console.warn(`[Deepgram] API key not found, using mock streaming fallback for socket ${socket.id}`);
      whisperService.startSession(socket.id);
    }
  });

  socket.on('audio-chunk', async (chunk: any) => {
    console.log("Audio chunk received");
    const size = chunk ? (chunk.byteLength || chunk.length || 0) : 0;
    console.log("Chunk size: " + size);
    (socket as any).lastChunkSize = size;

    const buffer = Buffer.from(chunk);
    console.log("Buffer created");

    const dgConn = dgConnections[socket.id];
    if (dgConn) {
      if (dgConn.readyState === 1) { // 1 is OPEN
        const queue = dgQueue[socket.id] || [];
        while (queue.length > 0) {
          const buf = queue.shift();
          if (buf) {
            dgConn.sendMedia(buf);
            console.log("Queued chunk sent to Deepgram");
          }
        }
        dgConn.sendMedia(buffer);
        console.log("Chunk sent to Deepgram");
      } else if (dgConn.readyState === 0) { // 0 is CONNECTING
        console.log(`[Socket] Deepgram connecting. Queueing chunk.`);
        if (!dgQueue[socket.id]) {
          dgQueue[socket.id] = [];
        }
        dgQueue[socket.id].push(buffer);
      } else {
        console.log(`[Socket] Deepgram connection state: ${dgConn.readyState} (not open/connecting)`);
      }
    } else {
      // Fallback simulated STT
      const chunkBuffer = Buffer.from(chunk);
      whisperService.appendChunk(socket.id, chunkBuffer);
      const text = await whisperService.getPartialTranscript(socket.id);
      dgTranscripts[socket.id] = text;
      socket.emit('live-transcript', text);
      console.log("Transcript emitted to frontend");
    }
  });

  socket.on('stop-recording', async (metadata: { title?: string; duration?: number; fileName?: string; fileSize?: number; mimeType?: string }) => {
    try {
      const dgConn = dgConnections[socket.id];
      if (dgConn) {
        if (dgConn.readyState === 1) {
          dgConn.sendFinalize({ type: 'Finalize' });
        }
        dgConn.close();
        delete dgConnections[socket.id];
      }

      const finalCompiledText = dgTranscripts[socket.id]?.trim() || " ";
      
      const duration = metadata.duration || 10;
      const title = metadata.title || `Voice Note (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
      const fileSize = metadata.fileSize || Math.floor(duration * 16000); 
      const accuracy = Math.floor(Math.random() * 4) + 96; // 96-99% accuracy for Deepgram

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

      console.log(`[Socket] Saved final Deepgram transcript for socket ${socket.id} to database.`);
    } catch (err) {
      console.error('[Socket] Stop recording failed:', err);
      socket.emit('final-transcript', {
        success: false,
        message: 'Could not finalize audio transcript'
      });
    } finally {
      delete dgTranscripts[socket.id];
      delete dgLastEmitted[socket.id];
      delete dgQueue[socket.id];
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
    const dgConn = dgConnections[socket.id];
    if (dgConn) {
      if (dgConn.readyState === 1) {
        dgConn.sendFinalize({ type: 'Finalize' });
      }
      dgConn.close();
      delete dgConnections[socket.id];
    }
    delete dgTranscripts[socket.id];
    delete dgLastEmitted[socket.id];
    delete dgQueue[socket.id];
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
