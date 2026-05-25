import { useState, useEffect } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder.js';
import { Mic, Square, Play, Pause, Trash2, Check, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioRecorderProps {
  onTranscribeComplete: (title: string, duration: number, text?: string) => Promise<void>;
}

const transcribingSteps = [
  'Decoding captured voice signals...',
  'Compiling spectral audio waveforms...',
  'Translating phonemes to tokens...',
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

  // Handle HTML5 audio playback states
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
    }, 900);

    try {
      // Simulate API Transcription duration
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center p-6"
          >
            {/* Animated mic container or Waveforms */}
            <div className="h-20 flex items-center justify-center gap-1.5 mb-6">
              {isRecording && !isPaused ? (
                // Custom Waveform Animation (dances while speaking)
                [...Array(12)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 bg-brand-indigo rounded-full"
                    animate={{ 
                      height: [16, Math.floor(Math.random() * 48) + 16, 16],
                    }}
                    transition={{
                      duration: 0.6 + i * 0.05,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                ))
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.02] border border-white/[0.06] text-text-secondary">
                  <Mic className="h-6 w-6" />
                </div>
              )}
            </div>

            {/* Timer display */}
            <div className="text-3xl font-semibold tracking-tight text-white mb-2 font-mono">
              {formatTime(recordingTime)}
            </div>
            
            <p className="text-xs text-text-secondary mb-8">
              {isRecording 
                ? isPaused ? 'Recording paused' : 'Capturing live microphone input...' 
                : 'Click mic to record directly in your browser'
              }
            </p>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-4">
              {isRecording ? (
                <>
                  <button
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className="text-xs text-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-4 py-2 rounded-xl transition-all"
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={stopRecording}
                    className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white active:scale-95 transition-all shadow-lg shadow-red-500/20"
                    aria-label="Stop recording"
                  >
                    <Square className="h-5 w-5 fill-white" />
                  </button>
                </>
              ) : (
                <button
                  onClick={startRecording}
                  className="h-16 w-16 rounded-full bg-brand-indigo hover:bg-brand-indigo-hover flex items-center justify-center text-white active:scale-95 transition-all shadow-lg shadow-brand-indigo/20 group relative"
                  aria-label="Start recording"
                >
                  <span className="absolute -inset-1.5 rounded-full border border-brand-indigo/30 animate-ping opacity-60 group-hover:opacity-0 transition-opacity" />
                  <Mic className="h-6 w-6 text-white" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 2: Audio recorded, ready to preview/transcribe */}
        {audioBlob && !isTranscribing && (
          <motion.div
            key="record-preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel border-white/[0.08] rounded-2xl p-6 text-left"
          >
            <h4 className="text-sm font-semibold text-white mb-4">
              Recording Prepared
            </h4>

            {/* Custom Playback Player */}
            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-4">
              <button
                onClick={togglePlayback}
                className="h-10 w-10 rounded-lg bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo hover:bg-brand-indigo hover:text-white flex items-center justify-center transition-all"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <div className="flex-1 text-xs">
                <p className="text-white font-medium">Recording Snippet</p>
                <p className="text-text-secondary font-mono mt-0.5">{formatTime(recordingTime)}</p>
              </div>
            </div>

            {/* Optional Input Title */}
            <div className="mb-6">
              <label htmlFor="rec-title" className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Recording Name (Optional)
              </label>
              <input
                id="rec-title"
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Brainstorming, Interview Note..."
                className="w-full text-xs text-white bg-white/[0.02] border border-white/[0.06] focus:border-brand-indigo/50 focus:bg-white/[0.04] outline-none rounded-xl px-3 py-2.5 transition-all"
              />
            </div>

            {/* Action options */}
            <div className="flex items-center gap-2">
              <button
                onClick={clearRecording}
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs text-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl py-2.5 font-medium transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" /> Discard
              </button>
              <button
                onClick={handleTranscribe}
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs text-white bg-brand-indigo hover:bg-brand-indigo-hover rounded-xl py-2.5 font-medium transition-all shadow-md shadow-brand-indigo/15 active:scale-95"
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
            className="glass-panel rounded-2xl border-white/[0.08] p-8 text-center flex flex-col items-center justify-center"
          >
            <div className="relative flex items-center justify-center mb-6">
              <RefreshCw className="h-10 w-10 text-brand-indigo animate-spin" />
            </div>
            <h4 className="text-sm font-medium text-white mb-2">
              Analyzing Recording
            </h4>
            <p className="text-xs text-brand-indigo animate-pulse h-4">
              {transcribingSteps[transcribeStep]}
            </p>
            {/* Custom progressive visual bar */}
            <div className="w-48 h-1 bg-white/[0.05] rounded-full overflow-hidden mt-6">
              <motion.div
                className="h-full bg-brand-indigo"
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel rounded-2xl border-brand-indigo/25 bg-brand-indigo/[0.02] p-8 text-center flex flex-col items-center justify-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-indigo/20 border border-brand-indigo/35 text-brand-indigo mb-4">
              <Check className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">
              Voice Note Saved!
            </h4>
            <p className="text-xs text-text-secondary mb-4 leading-normal">
              Voice snippet compiled and added to history list successfully.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="text-xs text-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl px-4 py-2 font-medium transition-all"
            >
              Record new voice note
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-xs text-red-400 bg-red-400/5 border border-red-400/10 rounded-xl p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
