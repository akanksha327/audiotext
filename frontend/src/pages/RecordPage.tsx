import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Copy, Trash2, Check
} from 'lucide-react';
import AudioRecorder from '../components/AudioRecorder.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function RecordPage() {
  const { showToast } = useToast();
  const [transcript, setTranscript] = useState('');
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'processing' | 'completed'>('idle');
  const [aiStatus, setAiStatus] = useState('Standby');
  const [copied, setCopied] = useState(false);
  const [accuracyMetrics, setAccuracyMetrics] = useState({
    pct: 100,
    clarity: 'Excellent',
    noise: 'Low',
    active: false
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll transcript to bottom as text stream comes in
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTo({
        top: textareaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [transcript]);

  const handleTranscribeComplete = async (
    _title: string, 
    _duration: number, 
    finalCompiledText: string,
    _metadata?: any
  ) => {
    setRecordingState('completed');
    setAiStatus('Analysis Completed');
    setTranscript(finalCompiledText);
    showToast('Voice transcription saved to history catalog', 'success');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    showToast('Copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voxnote-transcript-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Transcript exported as TXT', 'success');
  };

  const handleDownloadPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>VoxNote Transcript</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #18181b; line-height: 1.6; }
            .header { border-bottom: 2px solid #8b5cf6; padding-bottom: 12px; margin-bottom: 24px; }
            h1 { color: #8b5cf6; margin: 0 0 8px 0; font-size: 22px; }
            .content { font-size: 14px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>VoxNote Speech Transcript</h1>
            <p style="font-size: 11px; color: #71717a; margin: 0;">Compiled via Web Speech Engine</p>
          </div>
          <div class="content">${transcript}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
    showToast('Transcript exported as PDF', 'success');
  };

  const handleClear = () => {
    if (confirm('Clear current transcript?')) {
      setTranscript('');
      setRecordingState('idle');
      setAiStatus('Standby');
      setAccuracyMetrics({ pct: 100, clarity: 'Excellent', noise: 'Low', active: false });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch text-left select-none h-full min-h-[calc(100vh-10rem)]">
      
      {/* LEFT CAPTURE PANEL (5 cols) */}
      <div className="lg:col-span-5 flex">
        <div className="glass-panel p-6 sm:p-8 flex flex-col justify-between w-full relative overflow-hidden">
          {/* Decorative Gloss Accent */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-primary via-brand-accent to-transparent" />
          
          <div>
            <h3 className="text-[10px] font-bold text-stone-text-muted flex items-center gap-2 mb-8 uppercase tracking-widest">
              Voice Recorder
            </h3>

            <div className="flex items-center justify-center py-6">
              <AudioRecorder 
                onTranscribeComplete={handleTranscribeComplete}
                onTextStream={setTranscript}
                onStateChange={setRecordingState}
                onStatusChange={setAiStatus}
                onMetricsChange={setAccuracyMetrics}
              />
            </div>
          </div>

          {/* Metrics displaying floating accuracy */}
          <AnimatePresence>
            {accuracyMetrics.active && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-stone-border/60 pt-4 space-y-3 overflow-hidden mt-6"
              >
                <span className="text-[9px] font-bold text-stone-text-muted uppercase tracking-widest block">Signal Metrics</span>
                <div className="grid grid-cols-2 gap-2 text-left">
                  
                  <div className="bg-[#241B18]/30 border border-stone-border/40 rounded-xl p-3">
                    <span className="text-[8px] uppercase tracking-widest text-stone-text-muted block">Clarity Rating</span>
                    <span className="text-xs font-bold text-white mt-0.5 block">{accuracyMetrics.clarity}</span>
                  </div>

                  <div className="bg-[#241B18]/30 border border-stone-border/40 rounded-xl p-3">
                    <span className="text-[8px] uppercase tracking-widest text-stone-text-muted block">Acoustic Noise</span>
                    <span className="text-xs font-bold text-white mt-0.5 block">{accuracyMetrics.noise}</span>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT TRANSCRIPT PANEL (7 cols) */}
      <div className="lg:col-span-7 flex">
        <div className="glass-panel p-6 sm:p-8 flex flex-col justify-between w-full h-full min-h-[460px]">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-border/50 pb-4 mb-5">
            <div className="flex flex-col gap-1">
              <h3 className="text-[10px] font-bold text-stone-text-muted uppercase tracking-widest">Live Transcript</h3>
              
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[9px] text-stone-text-muted font-bold tracking-widest">
                <span>
                  STATUS: <span className={recordingState === 'recording' ? 'text-brand-primary' : 'text-white'}>{aiStatus.toUpperCase()}</span>
                </span>

                {recordingState === 'recording' && (
                  <span className="inline-flex items-center gap-1 bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-full text-[8px] text-brand-primary animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                    LIVE PIPELINE
                  </span>
                )}

                {recordingState === 'processing' && (
                  <span className="inline-flex items-center gap-1 bg-brand-accent/10 border border-brand-accent/20 px-2 py-0.5 rounded-full text-[8px] text-brand-accent">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-ping" />
                    COMPILING...
                  </span>
                )}
              </div>
            </div>

            {/* Actions for transcript workspace */}
            {transcript && (
              <div className="flex items-center gap-1.5 self-end sm:self-auto select-none">
                <button
                  onClick={handleCopy}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-border text-stone-text-secondary hover:text-white hover:border-brand-primary bg-stone-secondary/40 hover:bg-stone-card transition-colors cursor-pointer"
                  title="Copy text"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={handleDownloadTxt}
                  className="h-8 px-2.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-stone-border text-stone-text-secondary hover:text-white hover:border-brand-primary bg-stone-secondary/40 hover:bg-stone-card transition-colors cursor-pointer"
                >
                  TXT
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="h-8 px-2.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-stone-border text-stone-text-secondary hover:text-white hover:border-brand-primary bg-stone-secondary/40 hover:bg-stone-card transition-colors cursor-pointer"
                >
                  PDF
                </button>
                <button
                  onClick={handleClear}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border-stone-border hover:border-brand-primary text-stone-text-secondary hover:text-red-500 bg-stone-secondary/40 hover:bg-stone-card transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Transcript display scrollable box */}
          <div className="flex-1 flex flex-col">
            {transcript || recordingState === 'recording' || recordingState === 'processing' ? (
              <div className="relative flex-grow flex flex-col bg-[#241B18]/20 border border-stone-border/40 rounded-xl p-4 min-h-[300px]">
                <textarea
                  ref={textareaRef}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={recordingState === 'recording' ? "Speak into your microphone..." : "Transcribed text appears here..."}
                  className="w-full flex-grow text-xs leading-relaxed text-[#F5EDE8] bg-transparent outline-none border-none resize-none font-sans placeholder-stone-text-muted"
                />
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-stone-text-muted py-20 border border-dashed border-stone-border/40 rounded-xl bg-[#241B18]/10 select-none">
                <FileText className="h-8 w-8 opacity-25 mb-2" />
                <p className="text-xs font-semibold">Workspace is empty</p>
                <p className="text-[10px] text-stone-text-muted mt-1 max-w-[240px] text-center leading-relaxed">
                  Start recording on the left to write transcripts using real-time cognitive models.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="hidden" aria-hidden="true">{transcript}</div>
    </div>
  );
}
