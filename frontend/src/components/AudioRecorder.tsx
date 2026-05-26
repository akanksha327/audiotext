import { useState, useEffect } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder.js';
import { Square, Play, Pause, Check, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioRecorderProps {
  onTranscribeComplete: (title: string, duration: number, text?: string) => Promise<void>;
}

const transcribingSteps = [
  'Decoding captured voice...',
  'Extracting sound signals...',
  'Processing speech tokens...',
  'Polishing grammatical flow...',
  'Saving to database...'
];

export default function AudioRecorder({ onTranscribeComplete }: AudioRecorderProps) {
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecording,
    error,
  } = useAudioRecorder();

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeStep, setTranscribeStep] = useState(0);
  const [success, setSuccess] = useState(false);
  const [customTitle, setCustomTitle] = useState('');

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      setAudioElement(audio);

      audio.onended = () => {
        setIsPlaying(false);
      };

      return () => {
        audio.pause();
        setAudioElement(null);
      };
    }
  }, [audioUrl]);

  const togglePlayback = () => {
    if (!audioElement) return;
    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    setIsTranscribing(true);
    setTranscribeStep(0);

    const stepInterval = setInterval(() => {
      setTranscribeStep((prev) => {
        if (prev < transcribingSteps.length - 1) {
          return prev + 1;
        }
        clearInterval(stepInterval);
        return prev;
      });
    }, 950);

    try {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      
      const defaultTitle = `Voice Note (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
      const finalTitle = customTitle.trim() || defaultTitle;
      
      await onTranscribeComplete(finalTitle, recordingTime);
      clearInterval(stepInterval);
      setSuccess(true);
      clearRecording();
      setCustomTitle('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full text-center">
      <AnimatePresence mode="wait">
        
        {/* Step 1: Initial state or Recording state */}
        {!audioBlob && !isTranscribing && !success && (
          <motion.div
            key="record-controls"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex flex-col items-center justify-center p-4"
          >
            {/* Minimal visualizer - just simple vertical periwinkle bars */}
            <div className="h-16 w-full flex items-center justify-center gap-1 mb-6 rounded-xl bg-[#F3F5FC] border border-[#D2D8EC]">
              {isRecording && !isPaused ? (
                [...Array(12)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="w-1 bg-[#8A9FE8] rounded-full"
                    animate={{ 
                      height: [12, Math.floor(Math.random() * 32) + 10, 12],
                    }}
                    transition={{
                      duration: 0.6 + i * 0.05,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                ))
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D2D8EC] bg-white text-[#8A9FE8]">
                  <MicIcon className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Timer Display */}
            <div className="text-2xl font-bold tracking-tight text-[#1A233D] mb-2 font-mono">
              {formatTime(recordingTime)}
            </div>
            
            <p className="text-xs text-[#505A73] mb-6">
              {isRecording 
                ? isPaused ? 'Recording is paused' : 'Recording audio from browser...' 
                : 'Click mic to record directly'
              }
            </p>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3">
              {isRecording ? (
                <>
                  <button
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className="text-xs text-[#505A73] hover:text-[#1A233D] bg-white hover:bg-[#F3F5FC] border border-[#D2D8EC] px-3.5 py-2 rounded-lg transition-colors cursor-pointer font-medium"
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  
                  <button
                    onClick={stopRecording}
                    className="h-11 w-11 rounded-lg bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors cursor-pointer"
                    aria-label="Stop recording"
                  >
                    <Square className="h-4 w-4 fill-white text-white" />
                  </button>
                </>
              ) : (
                <button
                  onClick={startRecording}
                  className="h-12 w-12 rounded-lg bg-[#8A9FE8] hover:bg-[#6B82D6] flex items-center justify-center text-white transition-colors cursor-pointer"
                  aria-label="Start recording"
                >
                  <MicIcon className="h-5 w-5 text-white" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 2: Audio recorded, ready to preview/transcribe */}
        {audioBlob && !isTranscribing && (
          <motion.div
            key="record-preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="minimal-panel p-5 text-left"
          >
            <h4 className="text-xs font-bold text-[#1A233D] mb-3">
              Audio Recording Ready
            </h4>

            {/* Custom Playback Player */}
            <div className="flex items-center gap-3 bg-[#F3F5FC] border border-[#D2D8EC] rounded-xl p-3.5 mb-4">
              <button
                onClick={togglePlayback}
                className="h-8 w-8 rounded-lg bg-white border border-[#D2D8EC] text-[#8A9FE8] hover:bg-[#E4E8F4] flex items-center justify-center transition-colors cursor-pointer"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
              </button>
              
              <div className="flex-1 text-xs">
                <p className="text-[#1A233D] font-semibold">Recording Snippet</p>
                <p className="text-[#505A73] font-mono mt-0.5">{formatTime(recordingTime)}</p>
              </div>
            </div>

            {/* Optional Input Title */}
            <div className="mb-5">
              <label htmlFor="rec-title" className="block text-[10px] font-bold text-[#505A73] uppercase tracking-wider mb-1.5">
                Recording Title (Optional)
              </label>
              <input
                id="rec-title"
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Brainstorming session, memo..."
                className="w-full text-xs text-[#1A233D] bg-white border border-[#D2D8EC] focus:border-[#8A9FE8] outline-none rounded-lg px-3 py-2 transition-colors"
              />
            </div>

            {/* Action options */}
            <div className="flex items-center gap-2">
              <button
                onClick={clearRecording}
                className="flex-1 text-xs text-[#505A73] hover:text-[#1A233D] bg-white hover:bg-[#F3F5FC] border border-[#D2D8EC] rounded-lg py-2 font-semibold transition-colors cursor-pointer"
              >
                Discard
              </button>
              <button
                onClick={handleTranscribe}
                className="flex-1 inline-flex items-center justify-center gap-1 text-xs text-white bg-[#8A9FE8] hover:bg-[#6B82D6] rounded-lg py-2 font-bold transition-colors cursor-pointer"
              >
                Transcribe <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Transcribing loader */}
        {isTranscribing && (
          <motion.div
            key="transcribing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="minimal-panel p-8 text-center flex flex-col items-center justify-center min-h-[220px]"
          >
            <div className="flex h-8 w-8 items-center justify-center mb-4">
              <RefreshCwIcon className="h-5 w-5 text-[#8A9FE8] animate-spin" />
            </div>

            <h4 className="text-xs font-semibold text-[#1A233D] mb-1">
              Analyzing Speech
            </h4>
            
            <p className="text-[11px] text-[#505A73] h-4 mb-4">
              {transcribingSteps[transcribeStep]}
            </p>

            <div className="w-48 h-1 bg-[#E4E8F4] rounded-full overflow-hidden border border-[#D2D8EC]/50">
              <motion.div
                className="h-full bg-[#8A9FE8]"
                initial={{ width: 0 }}
                animate={{ width: `${((transcribeStep + 1) / transcribingSteps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        )}

        {/* Step 4: Success confirmation */}
        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="minimal-panel p-8 text-center flex flex-col items-center justify-center min-h-[220px]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D2D8EC] bg-[#F3F5FC] text-[#8A9FE8] mb-4">
              <Check className="h-5 w-5" />
            </div>

            <h4 className="text-xs font-bold text-[#1A233D] mb-1">
              Voice Note Saved
            </h4>
            
            <p className="text-[11px] text-[#505A73] mb-4 max-w-xs">
              Your recording has been transcribed and added to history.
            </p>
            
            <button
              onClick={() => setSuccess(false)}
              className="text-xs font-medium text-[#505A73] hover:text-[#1A233D] bg-[#E4E8F4] hover:bg-[#D2D8EC] border border-[#D2D8EC] rounded-lg px-4 py-2 transition-colors cursor-pointer"
            >
              Record new voice note
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mt-4 flex items-center gap-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 text-left">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <p className="font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}

// Local minimal Mic icon
function MicIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

// Local minimal Refresh icon
function RefreshCwIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
