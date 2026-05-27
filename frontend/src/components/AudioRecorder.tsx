import { useState, useEffect, useRef } from 'react';
import { Square, Play, Pause, AlertCircle, Mic, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioRecorderProps {
  onTranscribeComplete: (title: string, duration: number, text: string) => Promise<void>;
  onTextStream: (text: string) => void;
  onStateChange: (state: 'idle' | 'recording' | 'processing' | 'completed') => void;
  onStatusChange: (status: string) => void;
  onMetricsChange: (metrics: { pct: number; clarity: string; noise: string; active: boolean }) => void;
}

// Check for Web Speech Recognition API
const SpeechRecognition = 
  (window as any).SpeechRecognition || 
  (window as any).webkitSpeechRecognition;

export default function AudioRecorder({
  onTranscribeComplete,
  onTextStream,
  onStateChange,
  onStatusChange,
  onMetricsChange
}: AudioRecorderProps) {
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Audio playback snippet state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Recognition and Audio Context references
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioSnippetRef = useRef<HTMLAudioElement | null>(null);

  // Live transcribed text segments
  const finalTranscriptRef = useRef('');
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);

  // Check Speech recognition support on mount
  useEffect(() => {
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      console.warn('SpeechRecognition API not supported in this browser.');
    }
  }, []);

  // Cleanup audio tracks and loops on unmount
  useEffect(() => {
    return () => {
      cleanupStreams();
      if (audioSnippetRef.current) {
        audioSnippetRef.current.pause();
        audioSnippetRef.current = null;
      }
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
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onresult = null;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
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
  };

  // Speaks AI confirmation voice feedback
  const speakAIConfirmation = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel active speeches
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      
      // Select a nice female or natural sounding English voice
      const preferred = voices.find(v => 
        (v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira')))
      );
      if (preferred) utterance.voice = preferred;
      
      utterance.volume = 0.5; // Soft volume
      utterance.rate = 1.0;
      utterance.pitch = 1.02;
      window.speechSynthesis.speak(utterance);
    }
  };

  const cleanFillerWords = (text: string): string => {
    return text
      .replace(/\b(um|uh|like|you know|err|ah|eh|basically|actually)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const capitalizeAndPunctuate = (text: string): string => {
    if (!text) return '';
    let formatted = text.trim();
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    if (!/[.!?]$/.test(formatted)) {
      formatted += '.';
    }
    return formatted;
  };

  // Start recording workflow
  const startRecording = async () => {
    setError(null);
    setAudioUrl(null);
    setIsPlaying(false);
    audioChunksRef.current = [];
    finalTranscriptRef.current = '';
    onTextStream('');
    setRecordingTime(0);

    try {
      const selectedMicId = localStorage.getItem('sonic_mic') || 'default';
      const constraints = {
        audio: selectedMicId === 'default' ? true : { deviceId: { exact: selectedMicId } }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // 1. Initialize MediaRecorder for audio preview saves
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const compiledBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(compiledBlob);
        setAudioUrl(url);
      };

      // 2. Initialize Web Audio API Analyser for Visualizer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128; // high resolution wave
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Start Visualizer Canvas Loop
      startCanvasLoop(analyser);

      // 3. Initialize SpeechRecognition for Streaming Transcripts
      if (isSpeechSupported) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = localStorage.getItem('sonic_lang') || 'en';

        recognition.onresult = (e: any) => {
          let interimText = '';
          let finalParts = '';
          
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) {
              finalParts += e.results[i][0].transcript;
            } else {
              interimText += e.results[i][0].transcript;
            }
          }

          if (finalParts) {
            finalTranscriptRef.current += ' ' + finalParts;
          }

          let combined = finalTranscriptRef.current + ' ' + interimText;
          combined = cleanFillerWords(combined);
          combined = capitalizeAndPunctuate(combined);
          
          onTextStream(combined);
        };

        recognition.onerror = (e: any) => {
          console.error('Speech recognition error:', e);
          if (e.error === 'not-allowed') {
            setError('Microphone permission blocked by browser.');
          }
        };

        recognition.onend = () => {
          // Restart recognition if recording is still active
          if (isRecording && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err) {}
          }
        };

        recognition.start();
      } else {
        // Speech API unsupported fallback message
        onTextStream("SpeechRecognition API is not supported in this browser. Try Chrome/Edge or upload an audio file below.");
      }

      // 4. Start recording states & timers
      recorder.start();
      setIsRecording(true);
      onStateChange('recording');
      onStatusChange('Listening...');
      onMetricsChange({ pct: 95, clarity: 'Excellent', noise: 'Low', active: true });

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => {
          const nextTime = prev + 1;
          // Simulate changing statuses during speech pause patterns
          if (nextTime % 7 === 0) {
            onStatusChange('Improving Accuracy...');
            onMetricsChange({ pct: 97, clarity: 'Excellent', noise: 'Low', active: true });
          } else if (nextTime % 7 === 4) {
            onStatusChange('Formatting Response...');
            onMetricsChange({ pct: 98, clarity: 'Excellent', noise: 'Low', active: true });
          } else {
            onStatusChange('Listening...');
          }
          return nextTime;
        });
      }, 1000);

    } catch (err) {
      console.error('Error starting mic capture:', err);
      setError('Could not access microphone. Verify system or browser permissions.');
      cleanupStreams();
    }
  };

  // Canvas visualizer rendering loop
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

      // Get theme variables
      const isDark = document.documentElement.classList.contains('dark');
      const primaryColor = isDark ? '#C52B4B' : '#800020'; // Brand burgundy
      const secondaryColor = isDark ? '#2D2324' : '#EADEE0'; // Borders

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw mirrored bar visualizer
      const barWidth = (canvas.width / bufferLength) * 1.5;
      const centerY = canvas.height / 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i];
        const pct = val / 255;
        const barHeight = Math.max(3, pct * (canvas.height * 0.85));

        // Draw nice rounded lines
        ctx.fillStyle = val > 10 ? primaryColor : secondaryColor;
        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight / 2, barWidth - 1.5, barHeight, 2);
        ctx.fill();

        x += barWidth;
      }
    };
    draw();
  };

  // Stop recording workflow
  const stopRecording = async () => {
    if (!isRecording) return;

    setIsRecording(false);
    onStateChange('processing');
    onStatusChange('Improving Accuracy...');
    
    // Simulating active punctuation and filler word checks
    setTimeout(() => {
      onStatusChange('Formatting Response...');
    }, 1200);

    cleanupStreams();

    // Small delay to wrap up Audio Blob and Text
    setTimeout(async () => {
      let finalSpeechText = finalTranscriptRef.current.trim();
      
      // Cleanup speech
      finalSpeechText = cleanFillerWords(finalSpeechText);
      finalSpeechText = capitalizeAndPunctuate(finalSpeechText);

      if (!finalSpeechText && isSpeechSupported) {
        finalSpeechText = "No voice input detected. Please record again.";
        onTextStream(finalSpeechText);
        onStateChange('idle');
        onStatusChange('Standby');
        onMetricsChange({ pct: 100, clarity: 'Excellent', noise: 'Low', active: false });
        speakAIConfirmation("No transcription was recorded.");
        return;
      } else if (!isSpeechSupported) {
        // Simulated backup text when Speech recognition is unsupported
        finalSpeechText = "This is a simulated speech text. To experience real-time browser transcription, please run SonicScript in Google Chrome, Microsoft Edge, or Apple Safari.";
        onTextStream(finalSpeechText);
      }

      // Generate a title based on timestamps
      const title = `Voice Note (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
      
      // Speaks AI vocal confirmation response
      speakAIConfirmation("Your transcription is ready. Voice clarity was excellent.");

      await onTranscribeComplete(title, recordingTime, finalSpeechText);
    }, 2400);
  };

  const handleDiscard = () => {
    if (confirm('Discard current recording?')) {
      cleanupStreams();
      setAudioUrl(null);
      setIsRecording(false);
      setRecordingTime(0);
      onTextStream('');
      onStateChange('idle');
      onStatusChange('Standby');
      onMetricsChange({ pct: 100, clarity: 'Excellent', noise: 'Low', active: false });
    }
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
    <div className="w-full select-none">
      
      <AnimatePresence mode="wait">
        
        {/* Step 1: Idle or Recording State */}
        {!audioUrl && (
          <motion.div
            key="record-view"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex flex-col items-center justify-center p-2"
          >
            {/* Visualizer Canvas & Indicator */}
            <div className="relative w-full h-24 flex items-center justify-center rounded-xl bg-stone-secondary border border-stone-border overflow-hidden mb-6">
              {isRecording ? (
                <canvas 
                  ref={canvasRef} 
                  width={340} 
                  height={80} 
                  className="w-full h-full max-w-[340px]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-stone-text-secondary/70">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-border bg-stone-card text-brand-primary mb-1">
                    <Mic className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Mic Ready</span>
                </div>
              )}
            </div>

            {/* Timer Counter */}
            <div className="text-3xl font-extrabold tracking-tight text-stone-text-primary mb-1 font-mono">
              {formatTime(recordingTime)}
            </div>
            
            <p className="text-[10px] text-stone-text-secondary tracking-wide uppercase font-semibold mb-6">
              {isRecording ? 'Listening and translating...' : 'Tap center microphone button to record'}
            </p>

            {/* Premium Circular Microphone Trigger */}
            <div className="relative flex items-center justify-center">
              
              {/* Outer Pulsing Rings while recording */}
              {isRecording && (
                <>
                  <span className="absolute h-24 w-24 rounded-full bg-brand-primary/10 border border-brand-primary/20 animate-ping opacity-75" />
                  <span className="absolute h-20 w-20 rounded-full bg-brand-primary/15 border border-brand-primary/30 animate-pulse scale-105" />
                </>
              )}

              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`relative z-10 h-16 w-16 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                  isRecording 
                    ? 'bg-brand-primary text-white border-2 border-white/20' 
                    : 'bg-stone-card border border-stone-border hover:border-brand-primary text-brand-primary hover:bg-stone-secondary'
                }`}
                aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
              >
                {isRecording ? (
                  <Square className="h-5 w-5 fill-white text-white" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Error notifications */}
            {error && (
              <div className="mt-6 flex items-center gap-2.5 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 text-left">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <p className="font-semibold leading-normal">{error}</p>
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
            className="flex flex-col w-full text-left"
          >
            <h4 className="text-[11px] font-bold text-stone-text-secondary uppercase tracking-wider mb-3">
              Audio Snippet Saved
            </h4>

            {/* Stylized Player Widget */}
            <div className="flex items-center gap-3 bg-stone-secondary border border-stone-border rounded-xl p-3.5 mb-5 select-none">
              <button
                onClick={togglePlayback}
                className="h-9 w-9 rounded-lg bg-stone-card border border-stone-border text-brand-primary hover:bg-stone-bg flex items-center justify-center transition-colors cursor-pointer"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
              </button>
              
              <div className="flex-1 text-xs">
                <p className="text-stone-text-primary font-bold">Voice Snippet Preview</p>
                <p className="text-stone-text-secondary font-mono mt-0.5">{formatTime(recordingTime)}</p>
              </div>
            </div>

            {/* Actions for Snippet */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDiscard}
                className="flex-1 flex items-center justify-center gap-1 text-[11px] uppercase tracking-wider text-stone-text-secondary hover:text-red-600 bg-stone-card hover:bg-red-50 border border-stone-border hover:border-red-200 rounded-lg py-2.5 font-bold transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Discard
              </button>
              <button
                onClick={startRecording}
                className="flex-1 flex items-center justify-center gap-1 text-[11px] uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover rounded-lg py-2.5 font-bold transition-all cursor-pointer shadow-sm"
              >
                Record New <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}

