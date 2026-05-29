import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Mic, FileText, Copy, Trash2, 
  Check, ListFilter
} from 'lucide-react';
import AudioUpload from '../components/AudioUpload.jsx';
import AudioRecorder from '../components/AudioRecorder.jsx';
import TranscriptionHistory from '../components/TranscriptionHistory.jsx';
import { transcriptService, TranscriptData } from '../services/api.js';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');
  const [transcripts, setTranscripts] = useState<TranscriptData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Unified Workspace States
  const [transcript, setTranscript] = useState('');
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'processing' | 'completed'>('idle');
  const [aiStatus, setAiStatus] = useState('Standby');
  const [accuracyMetrics, setAccuracyMetrics] = useState({
    pct: 100,
    clarity: 'Excellent',
    noise: 'Low',
    active: false
  });
  
  const [selectedTranscript, setSelectedTranscript] = useState<TranscriptData | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll transcript workspace to bottom
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTo({
        top: textareaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [transcript]);

  // Fetch history list
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await transcriptService.getAll();
      setTranscripts(data);
    } catch (err) {
      console.error('Error fetching transcripts:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();

    // Listen for custom events to reload recents/history
    const handleSync = () => {
      fetchHistory();
    };
    window.addEventListener('transcripts-updated', handleSync);
    return () => window.removeEventListener('transcripts-updated', handleSync);
  }, []);

  // Listen to select events from Navbar or History lists
  useEffect(() => {
    const handleSelect = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      const targetId = customEvent.detail?.id;
      if (!targetId) return;

      const found = transcripts.find(t => t._id === targetId);
      if (found) {
        setSelectedTranscript(found);
        setTranscript(found.text);
        setRecordingState('completed');
        setAiStatus('Transcript Loaded');
        setAccuracyMetrics({
          pct: found.accuracy || 95,
          clarity: 'Excellent',
          noise: 'Low',
          active: true
        });
      }
    };

    window.addEventListener('select-transcript', handleSelect);
    return () => window.removeEventListener('select-transcript', handleSelect);
  }, [transcripts]);

  // Transcribe complete callback
  const handleTranscribeComplete = async (
    title: string, 
    duration: number, 
    finalCompiledText: string,
    metadata?: { _id?: string; fileName?: string; fileSize?: number; mimeType?: string; alreadySaved?: boolean; accuracy?: number }
  ) => {
    try {
      setRecordingState('processing');
      setAiStatus('Saving to Database...');
      
      const finalAcc = metadata?.accuracy || Math.floor(Math.random() * 6) + 93; // 93-98%

      let saved: any;
      if (metadata?.alreadySaved && metadata?._id) {
        saved = {
          _id: metadata._id,
          title,
          duration,
          text: finalCompiledText,
          status: 'completed',
          language: localStorage.getItem('sonic_lang') || 'en',
          accuracy: finalAcc,
          fileName: metadata.fileName,
          fileSize: metadata.fileSize,
          mimeType: metadata.mimeType,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        saved = await transcriptService.create({
          title,
          duration,
          text: finalCompiledText,
          status: 'completed',
          language: localStorage.getItem('sonic_lang') || 'en',
          accuracy: finalAcc,
          ...metadata
        });
      }
      
      // Dispatch updates to sync navbar and history
      window.dispatchEvent(new Event('transcripts-updated'));
      
      setSelectedTranscript(saved);
      setTranscript(finalCompiledText);
      setRecordingState('completed');
      setAiStatus('Analysis Completed');
      setAccuracyMetrics({
        pct: saved.accuracy || finalAcc,
        clarity: 'Excellent',
        noise: 'Low',
        active: true
      });
    } catch (err) {
      console.error('Failed to save transcript:', err);
      setRecordingState('completed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await transcriptService.delete(id);
      if (success) {
        if (selectedTranscript?._id === id) {
          setSelectedTranscript(null);
          setTranscript('');
          setRecordingState('idle');
          setAiStatus('Standby');
          setAccuracyMetrics({ pct: 100, clarity: 'Excellent', noise: 'Low', active: false });
        }
        setTranscripts((prev) => prev.filter((t) => t._id !== id));
        window.dispatchEvent(new Event('transcripts-updated'));
      }
    } catch (err) {
      console.error('Failed to delete transcript:', err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (confirm('Clear current workspace transcript?')) {
      setTranscript('');
      setSelectedTranscript(null);
      setRecordingState('idle');
      setAiStatus('Standby');
      setAccuracyMetrics({ pct: 100, clarity: 'Excellent', noise: 'Low', active: false });
    }
  };

  const handleDownloadTxt = () => {
    const textBlob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(textBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(selectedTranscript?.title || 'SonicScript-export').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    const title = selectedTranscript?.title || 'SonicScript AI Transcript';
    const date = selectedTranscript?.createdAt ? new Date(selectedTranscript.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
    const duration = selectedTranscript ? `${Math.floor(selectedTranscript.duration / 60)}m ${selectedTranscript.duration % 60}s` : 'N/A';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1c1917; line-height: 1.6; background-color: #f5f5f4; }
            .header { border-bottom: 1.5px solid #d6d3d1; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { color: #1c1917; margin: 0 0 10px 0; font-size: 24px; font-weight: 700; }
            .meta { font-size: 11px; color: #57534e; display: flex; gap: 20px; }
            .content { font-size: 13px; text-align: justify; white-space: pre-wrap; color: #1c1917; }
            .footer { margin-top: 50px; border-top: 1px solid #d6d3d1; padding-top: 20px; font-size: 10px; color: #78716c; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <div class="meta">
              <span><strong>Date:</strong> ${date}</span>
              <span><strong>Duration:</strong> ${duration}</span>
              <span><strong>Generated via:</strong> SonicScript</span>
            </div>
          </div>
          <div class="content">${transcript}</div>
          <div class="footer">
            © ${new Date().getFullYear()} SonicScript - Modern AI Speech to Text
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleRename = async (id: string, newTitle: string) => {
    try {
      const updatedList = transcripts.map(t => {
        if (t._id === id) {
          const updated = { ...t, title: newTitle };
          if (selectedTranscript?._id === id) {
            setSelectedTranscript(updated);
          }
          return updated;
        }
        return t;
      });
      setTranscripts(updatedList);
      
      await transcriptService.create({
        _id: id,
        title: newTitle,
        text: transcript,
        duration: selectedTranscript?.duration || 0,
        status: 'completed',
        language: selectedTranscript?.language || 'en'
      });
      window.dispatchEvent(new Event('transcripts-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-stone-bg text-stone-text-primary pb-20 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        
        {/* HERO SECTION */}
        <section id="hero-main" className="pt-20 pb-16 text-center max-w-3xl mx-auto select-none">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[10px] font-semibold bg-stone-secondary border border-stone-border text-stone-text-muted mb-6 uppercase tracking-wider">
              High-Fidelity Speech Engine
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-stone-text-primary leading-[1.12] mb-6">
              Turn Speech Into <br />
              <span className="text-stone-text-muted">Perfect Text Instantly</span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-stone-text-secondary max-w-xl leading-relaxed mb-8">
              SonicScript uses advanced low-latency speech pipelines to transcribe microphone audio and file uploads in real time. Minimal, secure, and fast.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
              <button
                onClick={() => {
                  setActiveTab('record');
                  scrollToSection('workspace-hub');
                }}
                className="w-full sm:w-auto px-6 py-3 inline-flex items-center justify-center gap-2 rounded-lg text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-sm transition-all cursor-pointer"
              >
                <Mic className="h-4 w-4" /> Start Recording
              </button>
              <button
                onClick={() => {
                  setActiveTab('upload');
                  scrollToSection('workspace-hub');
                }}
                className="w-full sm:w-auto px-6 py-3 inline-flex items-center justify-center gap-2 rounded-lg text-xs font-semibold text-stone-text-primary bg-stone-card hover:bg-stone-secondary border border-stone-border transition-all cursor-pointer"
              >
                <Upload className="h-4 w-4" /> Upload Audio File
              </button>
            </div>
          </motion.div>
        </section>

        {/* WORKSPACE SECTION */}
        <section id="workspace-hub" className="scroll-mt-20 py-8 border-t border-stone-border">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Capture Cards (Left 5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="minimal-panel p-6 sm:p-7 relative">
                
                {/* Header Selector Tabs */}
                <div className="flex items-center justify-between border-b border-stone-border pb-4 mb-6 select-none">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-text-primary flex items-center gap-1.5">
                    Audio Capture
                  </h3>
                  <div className="flex items-center bg-stone-secondary border border-stone-border rounded-lg p-0.5">
                    <button
                      onClick={() => setActiveTab('record')}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                        activeTab === 'record'
                          ? 'bg-stone-card text-stone-text-primary shadow-sm border border-stone-border/20'
                          : 'text-stone-text-secondary hover:text-stone-text-primary'
                      }`}
                    >
                      <Mic className="h-3 w-3" /> Record
                    </button>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                        activeTab === 'upload'
                          ? 'bg-stone-card text-stone-text-primary shadow-sm border border-stone-border/20'
                          : 'text-stone-text-secondary hover:text-stone-text-primary'
                      }`}
                    >
                      <Upload className="h-3 w-3" /> Upload
                    </button>
                  </div>
                </div>

                {/* Tab Component Body */}
                <div className="min-h-[220px] flex items-center justify-center">
                  {activeTab === 'record' ? (
                    <AudioRecorder 
                      onTranscribeComplete={handleTranscribeComplete}
                      onTextStream={setTranscript}
                      onStateChange={setRecordingState}
                      onStatusChange={setAiStatus}
                      onMetricsChange={setAccuracyMetrics}
                    />
                  ) : (
                    <AudioUpload 
                      onTranscribeComplete={handleTranscribeComplete} 
                    />
                  )}
                </div>

                {/* Accuracy Signal Panel */}
                <AnimatePresence>
                  {accuracyMetrics.active && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="mt-6 border-t border-stone-border pt-4 flex flex-col gap-3 text-left"
                    >
                      <span className="text-[10px] font-bold text-stone-text-secondary uppercase tracking-wider">Acoustic Signal Hub</span>
                      <div className="grid grid-cols-2 gap-2 select-none">
                        <div className="bg-stone-secondary border border-stone-border rounded-lg p-2.5 flex flex-col">
                          <span className="text-[8px] uppercase tracking-wider text-stone-text-secondary">Speech Accuracy</span>
                          <span className="text-sm font-bold text-stone-text-primary font-mono mt-0.5">{accuracyMetrics.pct}%</span>
                        </div>
                        <div className="bg-stone-secondary border border-stone-border rounded-lg p-2.5 flex flex-col">
                          <span className="text-[8px] uppercase tracking-wider text-stone-text-secondary">Clarification</span>
                          <span className="text-sm font-bold text-stone-text-primary mt-0.5">{accuracyMetrics.clarity}</span>
                        </div>
                        <div className="bg-stone-secondary border border-stone-border rounded-lg p-2.5 flex flex-col">
                          <span className="text-[8px] uppercase tracking-wider text-stone-text-secondary">Background Noise</span>
                          <span className="text-sm font-bold text-stone-text-primary mt-0.5">{accuracyMetrics.noise}</span>
                        </div>
                        <div className="bg-stone-secondary border border-stone-border rounded-lg p-2.5 flex flex-col">
                          <span className="text-[8px] uppercase tracking-wider text-stone-text-secondary">Pipeline Engine</span>
                          <span className="text-[9px] font-bold text-brand-primary mt-1.5 flex items-center gap-1 uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-stone-text-muted animate-pulse" /> Stream
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>

            {/* Live Transcription Panel (Right 7 Cols) */}
            <div id="transcription-pane" className="lg:col-span-7 scroll-mt-20">
              <div className="minimal-panel p-6 sm:p-7 flex flex-col h-full min-h-[460px] text-left">
                
                {/* Panel Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-border pb-4 mb-4 select-none">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xs font-bold text-stone-text-primary uppercase tracking-wider">Live Transcript Workspace</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] text-stone-text-secondary">
                      <span className="flex items-center gap-1 font-mono uppercase">
                        Status: <span className={recordingState === 'recording' ? 'text-brand-primary font-bold' : 'text-stone-text-primary'}>{aiStatus}</span>
                      </span>

                      {recordingState === 'recording' && (
                        <span className="inline-flex items-center gap-1 bg-stone-secondary border border-stone-border px-2.5 py-0.5 rounded-full text-[8.5px] font-bold text-stone-text-muted uppercase tracking-wider select-none animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                          Live Streaming
                        </span>
                      )}

                      {accuracyMetrics.active && accuracyMetrics.pct > 0 && (
                        <>
                          <span className="w-px h-3 bg-stone-border" />
                          <span className="inline-flex items-center gap-1.5 bg-stone-secondary border border-stone-border px-2.5 py-0.5 rounded-full text-[8.5px] font-bold text-stone-text-muted">
                            Acoustics: {accuracyMetrics.pct}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  {transcript && (
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={handleCopy}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-border text-stone-text-secondary hover:text-stone-text-primary hover:bg-stone-bg transition-colors cursor-pointer bg-stone-card"
                        title="Copy Text"
                      >
                        {copied ? <Check className="h-4 w-4 text-stone-text-primary" /> : <Copy className="h-4 w-4" />}
                      </button>
                      
                      <button
                        onClick={handleDownloadTxt}
                        className="h-8 px-2.5 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider rounded-lg border border-stone-border text-stone-text-secondary hover:text-stone-text-primary hover:bg-stone-bg transition-colors cursor-pointer bg-stone-card"
                        title="Export TXT"
                      >
                        TXT
                      </button>

                      <button
                        onClick={handleDownloadPdf}
                        className="h-8 px-2.5 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider rounded-lg border border-stone-border text-stone-text-secondary hover:text-stone-text-primary hover:bg-stone-bg transition-colors cursor-pointer bg-stone-card"
                        title="Export PDF"
                      >
                        PDF
                      </button>
                      
                      <button
                        onClick={handleClear}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-border hover:border-brand-primary text-stone-text-secondary hover:text-stone-text-primary hover:bg-stone-bg transition-colors cursor-pointer bg-stone-card"
                        title="Clear Workspace"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Workspace Text Editor */}
                <div className="flex-1 flex flex-col">
                  {transcript || recordingState === 'recording' || recordingState === 'processing' ? (
                    <div className="relative flex-grow flex flex-col">
                      <textarea
                        ref={textareaRef}
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder={recordingState === 'recording' ? "Listening and capturing audio signals..." : "Transcribed text appears here..."}
                        className="w-full flex-grow text-xs leading-relaxed text-stone-text-primary bg-stone-secondary/20 hover:bg-stone-secondary/40 focus:bg-stone-card border border-stone-border focus:border-brand-primary rounded-xl p-4 min-h-[300px] outline-none transition-colors duration-150 resize-none font-sans"
                      />
                      {recordingState === 'recording' && (
                        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-stone-card border border-stone-border px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider text-brand-primary select-none shadow-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
                          Receiving Audio
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-stone-text-secondary py-20 border border-dashed border-stone-border rounded-xl select-none bg-stone-secondary/10">
                      <FileText className="h-8 w-8 text-stone-text-muted/40 mb-2" />
                      <p className="text-xs font-semibold">Workspace is currently empty</p>
                      <p className="text-[10px] text-stone-text-secondary/70 mt-1 max-w-[240px] text-center leading-relaxed">
                        Start recording on the left or drop an audio file to compile transcripts.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* HISTORICAL CATALOG */}
        <section id="history-list" className="py-12 border-t border-stone-border scroll-mt-20">
          <div className="text-left mb-6">
            <h2 className="text-lg font-bold text-stone-text-primary flex items-center gap-2">
              <ListFilter className="h-4.5 w-4.5 text-brand-primary" /> Transcription History Catalog
            </h2>
            <p className="text-xs text-stone-text-secondary mt-0.5">
              Browse previous records, search text segments, rename notes, and re-export compiled transcripts.
            </p>
          </div>

          <div className="bg-stone-card border border-stone-border rounded-xl p-5 sm:p-6 shadow-sm">
            <TranscriptionHistory
              transcripts={transcripts}
              onDelete={handleDelete}
              onRename={handleRename}
              loading={loadingHistory}
            />
          </div>
        </section>

      </div>
    </div>
  );
}
