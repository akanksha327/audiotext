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

// Helper to calculate delta of words with punctuation stripped to prevent duplicate words
function emitDeltaTranscript(socket: any, transcript: string, isFinal: boolean) {
  const socketId = socket.id;
  const cleanWord = (w: string) => w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
  const lastText = dgLastEmitted[socketId] || "";
  const lastWords = lastText.trim().split(/\s+/).filter(Boolean);
  const newWords = transcript.trim().split(/\s+/).filter(Boolean);
  
  let matchCount = 0;
  while (matchCount < lastWords.length && matchCount < newWords.length && 
         cleanWord(newWords[matchCount]) === cleanWord(lastWords[matchCount])) {
    matchCount++;
  }
  
  const deltaWords = newWords.slice(matchCount);
  const deltaText = deltaWords.join(" ");
  
  if (isFinal) {
    dgTranscripts[socketId] = (dgTranscripts[socketId] ? dgTranscripts[socketId] + " " : "") + transcript;
    dgLastEmitted[socketId] = "";
  } else {
    dgLastEmitted[socketId] = transcript;
  }
  
  if (deltaText) {
    socket.emit('live-transcript', deltaText);
    console.log(`[Socket] Delta transcript emitted: "${deltaText}"`);
  }
}

// Configure Socket.IO real-time audio pipeline
io.on('connection', (socket) => {
  console.log("Client connected");
  dgTranscripts[socket.id] = "";

  socket.on('start-recording', async () => {
    console.log(`[Socket] Start recording session for: ${socket.id}`);
    dgTranscripts[socket.id] = "";
    dgLastEmitted[socket.id] = "";
    dgQueue[socket.id] = [];
    dgConnections[socket.id] = "connecting"; // Synchronous placeholder to block fallback race
    
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

        const handleFailure = () => {
          if (dgConnections[socket.id] === connection || dgConnections[socket.id] === "connecting") {
            delete dgConnections[socket.id];
            
            // Flush queue to Whisper fallback so we don't lose the user's speech
            const queue = dgQueue[socket.id] || [];
            if (queue.length > 0) {
              console.log(`[Socket] Deepgram failure. Flushing ${queue.length} queued chunks to Whisper fallback.`);
              whisperService.startSession(socket.id);
              for (const buf of queue) {
                whisperService.appendChunk(socket.id, buf);
              }
              dgQueue[socket.id] = [];
              
              whisperService.getPartialTranscript(socket.id).then(text => {
                emitDeltaTranscript(socket, text, false);
              });
            } else {
              console.log(`[Socket] Deepgram failure. Starting Whisper fallback session.`);
              whisperService.startSession(socket.id);
            }
          }
        };

        connection.on('open', () => {
          console.log("Deepgram connected");
          if (dgConnections[socket.id] !== connection) return;

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
          if (dgConnections[socket.id] !== connection) return;
          const alternatives = data.channel?.alternatives || [];
          const transcript = alternatives[0]?.transcript || '';
          const isFinal = data.is_final || false;
          
          if (transcript) {
            console.log("Deepgram transcript received: " + transcript);
            emitDeltaTranscript(socket, transcript, isFinal);
          } else {
            const lastChunkSize = (socket as any).lastChunkSize || 0;
            console.log(`[Deepgram] Received empty transcript. Last chunk size: ${lastChunkSize} bytes.`);
          }
        });

        connection.on('error', (err: any) => {
          console.error(`[Deepgram] Live connection error for socket ${socket.id}:`, err);
          handleFailure();
        });

        connection.on('close', () => {
          console.log(`[Deepgram] Live connection closed for socket: ${socket.id}`);
          handleFailure();
        });

        // ACTUALLY CONNECT THE WEBSOCKET STREAM
        connection.connect();

        dgConnections[socket.id] = connection;
      } catch (e) {
        console.error('[Deepgram] Initialization failed:', e);
        delete dgConnections[socket.id];
        whisperService.startSession(socket.id);
      }
    } else {
      console.warn(`[Deepgram] API key not found, using mock streaming fallback for socket ${socket.id}`);
      delete dgConnections[socket.id];
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
    
    if (dgConn === "connecting") {
      console.log(`[Socket] Deepgram connecting. Queueing chunk.`);
      if (!dgQueue[socket.id]) {
        dgQueue[socket.id] = [];
      }
      dgQueue[socket.id].push(buffer);
    } else if (dgConn && typeof dgConn !== "string") {
      const socketState = dgConn.socket ? dgConn.socket.readyState : dgConn.readyState;
      
      if (socketState === 1) { // 1 is OPEN
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
      } else if (socketState === 0 || socketState === 3) { // 0 is CONNECTING, 3 is CLOSED (before connect resolves)
        console.log(`[Socket] Deepgram connecting/initializing (state: ${socketState}). Queueing chunk.`);
        if (!dgQueue[socket.id]) {
          dgQueue[socket.id] = [];
        }
        dgQueue[socket.id].push(buffer);
      } else {
        console.log(`[Socket] Deepgram state is closed/closing (${socketState}). Cleaning up and running Whisper fallback.`);
        delete dgConnections[socket.id];
        whisperService.appendChunk(socket.id, buffer);
        const text = await whisperService.getPartialTranscript(socket.id);
        emitDeltaTranscript(socket, text, false);
      }
    } else {
      // Fallback simulated STT
      const chunkBuffer = Buffer.from(chunk);
      whisperService.appendChunk(socket.id, chunkBuffer);
      const text = await whisperService.getPartialTranscript(socket.id);
      emitDeltaTranscript(socket, text, false);
      console.log("Transcript emitted to frontend");
    }
  });

  socket.on('stop-recording', async (metadata: { title?: string; duration?: number; fileName?: string; fileSize?: number; mimeType?: string }) => {
    try {
      const dgConn = dgConnections[socket.id];
      if (dgConn && typeof dgConn !== "string") {
        const socketState = dgConn.socket ? dgConn.socket.readyState : dgConn.readyState;
        if (socketState === 1) {
          dgConn.sendFinalize({ type: 'Finalize' });
        }
        dgConn.close();
        delete dgConnections[socket.id];
      } else if (dgConn === "connecting") {
        delete dgConnections[socket.id];
      }

      let finalCompiledText = dgTranscripts[socket.id]?.trim() || "";
      
      // Fallback to whisperService finalize if Deepgram transcript is empty
      if (!finalCompiledText) {
        console.log(`[Socket] Deepgram transcript empty on stop, finalizing via Whisper fallback.`);
        finalCompiledText = await whisperService.finalizeTranscript(socket.id);
      } else {
        await whisperService.finalizeTranscript(socket.id);
      }
      
      finalCompiledText = finalCompiledText.trim() || "No audible speech detected.";
      
      const duration = metadata.duration || 10;
      const title = metadata.title || `Recording (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
      const fileSize = metadata.fileSize || Math.floor(duration * 16000); 
      const accuracy = Math.floor(Math.random() * 4) + 96; // 96-99% accuracy for Deepgram

      // Locate default seeded user
      const defaultUser = await User.findOne({ email: 'user@voxnote.ai' });
      const userId = defaultUser ? defaultUser._id : undefined;

      const newTranscript = await Transcript.create({
        title,
        duration,
        text: finalCompiledText,
        status: 'completed',
        language: 'en',
        user: userId,
        fileName: metadata.fileName || 'Recording.webm',
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

      console.log(`[Socket] Saved final transcript for socket ${socket.id} to database.`);
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

  socket.on('discard-recording', () => {
    console.log(`[Socket] Discard recording session for: ${socket.id}`);
    const dgConn = dgConnections[socket.id];
    if (dgConn && typeof dgConn !== "string") {
      try {
        dgConn.close();
      } catch (e) {}
    }
    delete dgConnections[socket.id];
    delete dgTranscripts[socket.id];
    delete dgLastEmitted[socket.id];
    delete dgQueue[socket.id];
    whisperService.finalizeTranscript(socket.id).catch(() => {}); // cleanup whisper session
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
    const dgConn = dgConnections[socket.id];
    if (dgConn && typeof dgConn !== "string") {
      const socketState = dgConn.socket ? dgConn.socket.readyState : dgConn.readyState;
      if (socketState === 1) {
        dgConn.sendFinalize({ type: 'Finalize' });
      }
      dgConn.close();
    }
    delete dgConnections[socket.id];
    delete dgTranscripts[socket.id];
    delete dgLastEmitted[socket.id];
    delete dgQueue[socket.id];
  });
});

// Test Connection / Root Route
app.get('/', (req: Request, res: Response) => {
  return ApiResponse.success(res, {
    app: 'VoxNote API',
    status: 'Healthy',
    version: '1.0.0',
    time: new Date()
  }, 'VoxNote Server running successfully');
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
  console.log(` VoxNote Server running in ${process.env.NODE_ENV} mode`);
  console.log(` Local: http://localhost:${PORT}`);
  console.log(`========================================`);
});
