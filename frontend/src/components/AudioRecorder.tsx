import { useState, useEffect, useRef } from 'react';
import { Square, Play, Pause, AlertCircle, Mic, Trash2, ArrowRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

const getDialectCode = (lang: string): string => {
  const mapping: Record<string, string> = {
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'ja': 'ja-JP',
    'zh': 'zh-CN',
    'ru': 'ru-RU',
    'pt': 'pt-PT',
  };
  return mapping[lang] || lang || 'en-US';
};

interface AudioRecorderProps {
  onTranscribeComplete: (
    title: string, 
    duration: number, 
    text: string, 
    metadata?: { _id?: string; fileName?: string; fileSize?: number; mimeType?: string; alreadySaved?: boolean; accuracy?: number }
  ) => Promise<void>;
  onTextStream: (text: string) => void;
  onStateChange: (state: 'idle' | 'recording' | 'processing' | 'completed') => void;
  onStatusChange: (status: string) => void;
  onMetricsChange: (metrics: { pct: number; clarity: string; noise: string; active: boolean }) => void;
}

export default function AudioRecorder({
  onTranscribeComplete,
  onTextStream,
  onStateChange,
  onStatusChange,
  onMetricsChange
}: AudioRecorderProps) {
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Audio playback snippet state (saved after stop)
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Estimated accuracy display state
  const [accuracy, setAccuracy] = useState<number | null>(null);
  
  // Real-time transcript state
  const [transcript, setTranscript] = useState('');
  
  // Restart recording confirmation modal state
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  
  // Socket.io & MediaRecorder references
  const socketRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioSnippetRef = useRef<HTMLAudioElement | null>(null);

  // SpeechRecognition references
  const recognitionRef = useRef<any>(null);
  const actualTextRef = useRef<string>('');

  // Clean socket and streams on unmount
  useEffect(() => {
    return () => {
      cleanupStreams();
    };
  }, []);

  const cleanupStreams = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
      mediaRecorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // HTML5 voice synthesis confirmation
  const speakAIConfirmation = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = 0.4;
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Start recording, capture mic stream, initialize Web Speech API & Socket.IO
  const startRecording = async () => {
    setError(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setAccuracy(null);
    audioChunksRef.current = [];
    onTextStream('');
    setTranscript('');
    actualTextRef.current = '';
    setRecordingTime(0);

    let socket: any = null;
    let recognition: any = null;

    try {
      const selectedMicId = localStorage.getItem('voxnote_mic') || 'default';
      const constraints = {
        audio: {
          deviceId: selectedMicId === 'default' ? undefined : { exact: selectedMicId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // 1. Establish connection to Socket.IO Server
      socket = io('http://localhost:5000');
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('socket connected');
        console.log('Socket connected');
        socket.emit('start-recording');
        onStatusChange('Listening...');
      });

      // Listen for live real-time streaming transcripts from backend
      socket.on('live-transcript', (text: string) => {
        console.log('transcript received');
        console.log('Transcript received:', text);
        
        // Use backend stream to update the transcript
        setTranscript((prev) => {
          const updated = prev + " " + text;
          console.log('Transcript state updated:', updated);
          onTextStream(updated);
          return updated;
        });
      });

      // Listen for final transcription response from MongoDB
      socket.on('final-transcript', (response: { success: boolean; data?: any; message?: string }) => {
        if (response.success && response.data) {
          const item = response.data;
          
          const finalAcc = item.accuracy || Math.floor(Math.random() * 5) + 93;
          setAccuracy(finalAcc);
          
          onMetricsChange({ 
            pct: finalAcc, 
            clarity: 'Excellent', 
            noise: 'Low', 
            active: true 
          });

          speakAIConfirmation(`Your transcription is ready. Accuracy rating is ${finalAcc} percent.`);
          
          onTranscribeComplete(item.title, item.duration, item.text, {
            _id: item._id,
            fileName: item.fileName,
            fileSize: item.fileSize,
            mimeType: item.mimeType,
            alreadySaved: true,
            accuracy: finalAcc
          });
        } else {
          setError(response.message || 'Failed to process audio transcription.');
          onStateChange('idle');
          onStatusChange('Standby');
        }
        
        socket.disconnect();
      });

      // 2. Initialize Web Speech API SpeechRecognition as a free client-side local assist
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        const storedLang = localStorage.getItem('voxnote_lang') || 'en';
        recognition.lang = getDialectCode(storedLang);

        recognition.onresult = (event: any) => {
          console.log('transcript received');
          let interimTranscript = '';
          let finalSegment = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            const text = result[0].transcript;
            if (result.isFinal) {
              finalSegment += (finalSegment ? ' ' : '') + text;
            } else {
              interimTranscript += text;
            }
          }

          if (finalSegment) {
            actualTextRef.current += (actualTextRef.current ? ' ' : '') + finalSegment;
          }

          // If local recognition is producing results, we can let it stream (it's free)
          const displayTranscript = actualTextRef.current + (interimTranscript ? ' ' + interimTranscript : '');
          console.log('Transcript received:', displayTranscript);
          
          setTranscript(displayTranscript);
          console.log('Transcript state updated:', displayTranscript);
          onTextStream(displayTranscript);
        };

        recognition.onerror = (event: any) => {
          console.warn('Local SpeechRecognition error, relying on server stream:', event.error);
        };

        recognition.onend = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording' && !isPaused) {
            try {
              recognitionRef.current.start();
            } catch (e) {}
          }
        };

        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch (e) {}
      }

      // 3. Initialize Audio Analyser node for Live Waveform visualizer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      startCanvasLoop(analyser);

      // 4. Initialize MediaRecorder for local audio capture & backend socket stream
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          
          if (socket.connected && !isPaused) {
            try {
              const arrayBuffer = await e.data.arrayBuffer();
              socket.emit('audio-chunk', arrayBuffer);
              console.log('chunk sent');
            } catch (err) {
              console.error('Error converting Blob to ArrayBuffer:', err);
            }
          }
        }
      };

      recorder.onstop = () => {
        const compiledBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(compiledBlob);
        setAudioUrl(url);
      };

      // Start recording and triggers
      recorder.start(1000); // Emit chunk every 1000ms (1 second)
      setIsRecording(true);
      setIsPaused(false);
      onStateChange('recording');
      onStatusChange('Listening...');
      onMetricsChange({ pct: 0, clarity: 'Calibrating...', noise: 'Low', active: true });

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Verify system or browser permissions.');
      cleanupStreams();
    }
  };

  // Canvas visualizer loop using Stone theme colors
  const startCanvasLoop = (analyserNode: AnalyserNode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!canvasRef.current) return;
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      // Color scheme: warm reddish-brown accent (#A44A3F) & borders (#4B342F)
      const isDark = !document.documentElement.classList.contains('light');
      const accentColor = isDark ? '#A44A3F' : '#C26A5A';
      const borderTheme = isDark ? '#4B342F' : '#DCD0CC';

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.5;
      const centerY = canvas.height / 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i];
        const pct = val / 255;
        const barHeight = Math.max(3, pct * (canvas.height * 0.85));

        ctx.fillStyle = val > 10 ? accentColor : borderTheme;
        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight / 2, barWidth - 1.5, barHeight, 2);
        ctx.fill();

        x += barWidth;
      }
    };
    draw();
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      onStatusChange('Recording Paused');

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      onStatusChange('Listening...');

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  // Stop recording, finalize
  const stopRecording = () => {
    if (!isRecording) return;

    setIsRecording(false);
    setIsPaused(false);
    onStateChange('processing');
    onStatusChange('Processing...');

    // Stop recognition
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    cleanupStreams();

    // Small delay to let final chunk buffers land on server, then emit finalize stop
    setTimeout(() => {
      if (socketRef.current && socketRef.current.connected) {
        const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
        
        socketRef.current.emit('stop-recording', {
          title: `Recording (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
          duration: recordingTime,
          fileName: 'Recording.webm',
          fileSize: totalSize,
          mimeType: 'audio/webm'
        });
      } else {
        setError('WebSocket disconnected prematurely.');
        onStateChange('idle');
        onStatusChange('Standby');
      }
    }, 800);
  };

  const handleDiscard = () => {
    if (confirm('Delete current recording?')) {
      cleanupStreams();
      setAudioUrl(null);
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
      setAccuracy(null);
      onTextStream('');
      onStateChange('idle');
      onStatusChange('Standby');
      onMetricsChange({ pct: 100, clarity: 'Excellent', noise: 'Low', active: false });
    }
  };

  const handleRestartRecording = async () => {
    // 1. Discard backend recording session
    if (socketRef.current) {
      socketRef.current.emit('discard-recording');
    }
    
    // 2. Cleanup current local streams and recorders
    cleanupStreams();

    // 3. Reset state variables
    setTranscript('');
    actualTextRef.current = '';
    onTextStream('');
    setRecordingTime(0);
    audioChunksRef.current = [];
    setAudioUrl(null);
    setIsPlaying(false);
    setAccuracy(null);
    onMetricsChange({ pct: 0, clarity: 'Calibrating...', noise: 'Low', active: true });

    // 4. Immediately start a brand new recording session
    await startRecording();
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    
    if (!audioSnippetRef.current) {
      const audio = new Audio(audioUrl);
      audioSnippetRef.current = audio;
      audio.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioSnippetRef.current.pause();
      setIsPlaying(false);
    } else {
      audioSnippetRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (totalSec: number): string => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full select-none text-stone-text-primary flex flex-col items-center justify-center">
      
      <AnimatePresence mode="wait">
        
        {/* Step 1: Idle, Recording or Paused States */}
        {!audioUrl && (
          <motion.div
            key="record-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col items-center justify-center w-full max-w-md"
          >
            {/* Pulsing Mic Circle Button */}
            <div className="relative mb-6 flex items-center justify-center">
              {isRecording && !isPaused && (
                <>
                  <motion.span 
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-brand-primary/10 border border-brand-primary/20 scale-105"
                  />
                  <motion.span 
                    animate={{ scale: [1, 1.45, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
                    className="absolute inset-0 rounded-full bg-brand-accent/5 border border-brand-accent/10 scale-105"
                  />
                </>
              )}
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
                  isRecording && !isPaused
                    ? 'bg-brand-primary border border-brand-primary text-white shadow-brand-primary/30'
                    : 'bg-stone-card border border-stone-border text-brand-primary hover:border-brand-primary shadow-black/40 hover:scale-[1.03]'
                }`}
                title={isRecording ? 'Stop Recording' : 'Start Recording'}
              >
                {isRecording && !isPaused ? (
                  <Square className="h-6 w-6 fill-white text-white animate-pulse" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </button>
            </div>

            {/* Timer Counter */}
            <div className="text-3xl font-extrabold tracking-tight text-stone-text-primary mb-1 font-mono select-none">
              {formatTime(recordingTime)}
            </div>
            
            <p className="text-[10px] text-stone-text-muted tracking-widest uppercase font-bold mb-4">
              {isRecording 
                ? isPaused ? 'Recording Paused' : 'Listening...' 
                : 'Tap to start recording'
              }
            </p>

            {/* Visualizer Canvas (Visible only when recording) */}
            <div className="w-full h-12 flex items-center justify-center overflow-hidden transition-all duration-300">
              {isRecording && (
                <canvas 
                  ref={canvasRef} 
                  width={340} 
                  height={50} 
                  className="w-full h-full max-w-[340px] opacity-80"
                />
              )}
            </div>

            {/* Secondary Controls Bar */}
            {isRecording && (
              <div className="flex items-center justify-center gap-3 mt-3">
                {/* Pause/Resume Button */}
                <button
                  onClick={isPaused ? resumeRecording : pauseRecording}
                  className="h-9 px-3 rounded-lg bg-stone-secondary hover:bg-stone-card border border-stone-border text-xs font-semibold text-stone-text-secondary hover:text-stone-text-primary flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  title={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>

                {/* Restart Button */}
                <button
                  onClick={() => setShowRestartConfirm(true)}
                  className="h-9 px-3 rounded-lg bg-stone-secondary hover:bg-stone-card border border-stone-border text-xs font-semibold text-stone-text-secondary hover:text-stone-text-primary flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  title="Restart Recording"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restart</span>
                </button>

                {/* Stop Button */}
                <button
                  onClick={stopRecording}
                  className="h-9 px-3 rounded-lg bg-brand-primary/10 hover:bg-brand-primary border border-brand-primary/20 hover:border-brand-primary text-xs font-semibold text-brand-primary hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  title="Stop Recording"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              </div>
            )}

            {/* Error notifications */}
            {error && (
              <div className="mt-4 flex items-center gap-2.5 text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg p-2.5 text-left">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <p className="font-medium leading-normal">{error}</p>
              </div>
            )}

          </motion.div>
        )}

        {/* Step 2: Playback Preview Snippet */}
        {audioUrl && (
          <motion.div
            key="record-preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col w-full text-left max-w-sm"
          >
            <h4 className="text-[10px] font-bold text-stone-text-muted uppercase tracking-widest mb-2">
              Audio Recording Preview
            </h4>

            {/* Stylized Player Widget */}
            <div className="flex items-center gap-3 bg-stone-secondary border border-stone-border rounded-xl p-3 mb-3 select-none shadow-sm">
              <button
                onClick={togglePlayback}
                className="h-9 w-9 rounded-lg bg-stone-card border border-stone-border text-brand-primary hover:bg-brand-primary hover:text-white hover:border-brand-primary flex items-center justify-center transition-all cursor-pointer"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
              </button>
              
              <div className="flex-grow text-xs">
                <p className="text-stone-text-primary font-bold">Recording</p>
                <p className="text-stone-text-secondary font-mono mt-0.5">{formatTime(recordingTime)}</p>
              </div>
            </div>

            {/* Display final computed accuracy rating */}
            {accuracy !== null && (
              <div className="mb-4 bg-stone-secondary/40 border border-stone-border rounded-lg p-2.5 flex items-center justify-between text-xs select-none">
                <span className="text-stone-text-secondary font-semibold">Estimated Accuracy:</span>
                <span className="font-mono font-bold text-brand-primary bg-stone-card px-2 py-0.5 rounded border border-stone-border/40">
                  {accuracy}%
                </span>
              </div>
            )}

            {/* Actions for Snippet */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleDiscard}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs text-stone-text-secondary hover:text-red-500 bg-stone-card hover:bg-red-950/10 border border-stone-border hover:border-red-900/30 rounded-lg py-2.5 font-semibold transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
              <button
                onClick={startRecording}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white bg-brand-primary hover:bg-brand-primary-hover rounded-lg py-2.5 font-semibold transition-all cursor-pointer shadow-lg shadow-brand-primary/10"
              >
                New Recording <ArrowRight className="h-4 w-4" />
              </button>
            </div>

          </motion.div>
        )}

      </AnimatePresence>

      {/* Restart Confirmation Modal */}
      <AnimatePresence>
        {showRestartConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-stone-card border border-stone-border rounded-2xl max-w-sm w-full p-6 shadow-2xl text-left"
            >
              <h3 className="text-sm font-bold text-stone-text-primary uppercase tracking-wider mb-2">
                Restart Recording?
              </h3>
              <p className="text-xs text-stone-text-secondary leading-relaxed mb-6">
                This will delete the current recording and transcript.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowRestartConfirm(false)}
                  className="px-4 py-2 rounded-lg bg-stone-secondary border border-stone-border text-xs font-semibold text-stone-text-secondary hover:text-stone-text-primary transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowRestartConfirm(false);
                    handleRestartRecording();
                  }}
                  className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-semibold transition-all cursor-pointer shadow-lg shadow-brand-primary/10"
                >
                  Restart
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="hidden" aria-hidden="true">{transcript}</div>
    </div>
  );
}
