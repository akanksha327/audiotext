import { exec, execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Active audio buffers mapped by socket ID
const sessionBuffers: Record<string, Buffer[]> = {};
const sessionSpeechIndex: Record<string, number> = {};

const mockSentences = [
  "Hello and welcome to SonicScript.",
  "We are streaming audio chunks continuously from the frontend client to the Express Node server.",
  "The backend processes these audio fragments using a Whisper speech recognition engine.",
  "In this premium sandbox environment, Mongoose database models index and store every transcript.",
  "Our real-time WebSockets connection enables extremely low latency speech translation.",
  "Web Audio API analysers paint beautiful mirrored frequency visualizers right inside your browser.",
  "Designed using matte stone color styles, typography scales smoothly on laptops and mobile devices.",
  "Transcripts can be exported instantly to plain text and print-ready PDF files."
];

export const whisperService = {
  /**
   * Initialize a new recording session
   */
  startSession(socketId: string) {
    sessionBuffers[socketId] = [];
    sessionSpeechIndex[socketId] = 0;
    console.log(`[WhisperService] Start session for socket: ${socketId}`);
  },

  /**
   * Append binary chunk to buffer
   */
  appendChunk(socketId: string, chunk: Buffer) {
    if (!sessionBuffers[socketId]) {
      sessionBuffers[socketId] = [];
    }
    sessionBuffers[socketId].push(chunk);
  },

  /**
   * Transcribe a single chunk (partial transcript for real-time streaming feedback)
   */
  async getPartialTranscript(socketId: string): Promise<string> {
    const buffers = sessionBuffers[socketId] || [];
    if (buffers.length === 0) return "";

    const binPath = process.env.WHISPER_BIN_PATH;
    const modelPath = process.env.WHISPER_MODEL_PATH;

    // 1. If Whisper.cpp binary is configured, try running child process
    if (binPath && modelPath && fs.existsSync(binPath)) {
      try {
        const fullBuffer = Buffer.concat(buffers);
        const tempWebm = path.join(os.tmpdir(), `sonic-${socketId}-partial.webm`);
        const tempWav = path.join(os.tmpdir(), `sonic-${socketId}-partial.wav`);
        fs.writeFileSync(tempWebm, fullBuffer);

        return new Promise((resolve) => {
          // Convert incoming webm audio chunk to 16kHz 16-bit mono wavPCM for Whisper.cpp
          exec(`ffmpeg -y -i "${tempWebm}" -ar 16000 -ac 1 -c:a pcm_s16le "${tempWav}"`, (ffmpegErr) => {
            try {
              if (fs.existsSync(tempWebm)) fs.unlinkSync(tempWebm);
            } catch (e) {}

            if (ffmpegErr) {
              console.warn('[WhisperService] FFmpeg conversion failed, using mock fallback');
              try {
                if (fs.existsSync(tempWav)) fs.unlinkSync(tempWav);
              } catch (e) {}
              resolve(this.getMockPartial(socketId));
              return;
            }

            // Command: whisper-cli -m model.bin -f file.wav -otxt
            execFile(binPath, ['-m', modelPath, '-f', tempWav, '--no-timestamps'], (err, stdout) => {
              try {
                if (fs.existsSync(tempWav)) fs.unlinkSync(tempWav);
              } catch (e) {}

              if (err) {
                console.warn('[WhisperService] Native partial transcription error, using mock fallback');
                resolve(this.getMockPartial(socketId));
              } else {
                resolve(stdout.trim());
              }
            });
          });
        });
      } catch (e) {
        return this.getMockPartial(socketId);
      }
    }

    // 2. Fallback to simulated real-time stream
    return this.getMockPartial(socketId);
  },

  /**
   * Transcribe the full completed recording session
   */
  async finalizeTranscript(socketId: string): Promise<string> {
    const buffers = sessionBuffers[socketId] || [];
    const fullText = await this.getPartialTranscript(socketId);
    
    // Cleanup session memory
    delete sessionBuffers[socketId];
    delete sessionSpeechIndex[socketId];
    
    console.log(`[WhisperService] Finalized session for socket: ${socketId}`);
    return fullText || "SonicScript completed recording successfully.";
  },

  /**
   * Helper to return simulated real-time streams based on socket chunk events count
   */
  getMockPartial(socketId: string): string {
    const count = sessionBuffers[socketId]?.length || 0;
    
    // Return cumulative mock sentences based on time elapsed
    const sentenceIndex = Math.floor(count / 3); 
    const list: string[] = [];
    
    for (let i = 0; i <= Math.min(sentenceIndex, mockSentences.length - 1); i++) {
      list.push(mockSentences[i]);
    }
    
    // Add interim final characters to simulate typing action
    const currentSentence = mockSentences[Math.min(sentenceIndex + 1, mockSentences.length - 1)];
    const wordPct = (count % 3) / 3;
    const words = currentSentence.split(' ');
    const visibleWords = words.slice(0, Math.ceil(words.length * wordPct)).join(' ');
    
    if (visibleWords) {
      list.push(visibleWords);
    }

    return list.join(' ');
  }
};
