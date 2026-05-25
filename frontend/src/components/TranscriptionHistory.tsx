import React, { useState } from 'react';
import { TranscriptData } from '../services/api.js';
import { Search, Clock, Calendar, Copy, Download, Trash2, Check, FileText, Globe, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TranscriptionHistoryProps {
  transcripts: TranscriptData[];
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

export default function TranscriptionHistory({ transcripts, onDelete, loading }: TranscriptionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Search filter
  const filtered = transcripts.filter((t) => {
    const term = searchTerm.toLowerCase();
    return t.title.toLowerCase().includes(term) || t.text.toLowerCase().includes(term);
  });

  const selectedTranscript = transcripts.find(t => t._id === selectedId) || (filtered.length > 0 ? filtered[0] : null);

  // Update selected if deleted
  React.useEffect(() => {
    if (selectedTranscript && !transcripts.find(t => t._id === selectedTranscript._id)) {
      setSelectedId(filtered.length > 0 ? filtered[0]._id || null : null);
    }
  }, [transcripts]);

  // Set default selection
  React.useEffect(() => {
    if (!selectedId && filtered.length > 0) {
      setSelectedId(filtered[0]._id || null);
    }
  }, [filtered, selectedId]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (transcript: TranscriptData) => {
    const blob = new Blob([
      `SonicScript Audio Transcript\n`,
      `=============================\n`,
      `Title: ${transcript.title}\n`,
      `Duration: ${formatDuration(transcript.duration)}\n`,
      `Language: ${transcript.language.toUpperCase()}\n`,
      `Date Created: ${transcript.createdAt ? new Date(transcript.createdAt).toLocaleString() : 'N/A'}\n`,
      `=============================\n\n`,
      `${transcript.text}`
    ], { type: 'text/plain;charset=utf-8' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${transcript.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-transcript.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'Recent';
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        
        {/* Left Side: Search & Directory List */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="relative w-full mb-4">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transcripts..."
              className="w-full text-xs text-white bg-white/[0.02] border border-white/[0.06] focus:border-brand-indigo/50 focus:bg-white/[0.04] outline-none rounded-xl pl-10 pr-4 py-2.5 transition-all"
            />
          </div>

          <div className="flex-1 max-h-[480px] overflow-y-auto space-y-2 pr-1.5">
            {loading ? (
              <div className="py-12 text-center text-xs text-text-secondary">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-brand-indigo" />
                Loading transcription catalog...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-white/[0.05] rounded-xl text-xs text-text-secondary">
                No matching transcripts found.
              </div>
            ) : (
              filtered.map((item) => {
                const isActive = selectedTranscript?._id === item._id;
                return (
                  <motion.div
                    key={item._id}
                    onClick={() => setSelectedId(item._id || null)}
                    className={`p-4 border rounded-xl cursor-pointer text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-indigo/[0.06] border-brand-indigo/30 shadow-sm'
                        : 'bg-white/[0.01] border-white/[0.05] hover:bg-white/[0.03] hover:border-white/[0.1]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h4 className="text-xs font-semibold text-white truncate max-w-[180px]">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-text-secondary bg-white/[0.04] border border-white/[0.05] px-1.5 py-0.5 rounded">
                        {formatDuration(item.duration)}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed mb-3">
                      {item.text}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(item.createdAt)}
                      </span>
                      <span className="flex items-center gap-1 font-mono uppercase bg-white/[0.02] border border-white/[0.04] px-1 rounded text-[9px]">
                        <Globe className="h-3 w-3 text-brand-indigo/60" /> {item.language}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Transcription Details Viewer Panel */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedTranscript ? (
              <motion.div
                key={selectedTranscript._id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="glass-panel border-white/[0.08] rounded-2xl p-6 flex flex-col h-full text-left"
              >
                {/* Header bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.05] pb-4 mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white truncate max-w-[320px]">
                      {selectedTranscript.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {formatDuration(selectedTranscript.duration)}
                      </span>
                      <span className="w-1 h-1 bg-white/20 rounded-full" />
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {formatDate(selectedTranscript.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(selectedTranscript._id!, selectedTranscript.text)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.08] hover:border-white/20 text-text-secondary hover:text-white bg-white/[0.01] hover:bg-white/[0.04] transition-all"
                      title="Copy text"
                    >
                      {copiedId === selectedTranscript._id ? <Check className="h-4 w-4 text-brand-indigo" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDownload(selectedTranscript)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.08] hover:border-white/20 text-text-secondary hover:text-white bg-white/[0.01] hover:bg-white/[0.04] transition-all"
                      title="Download TXT"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    
                    {deleteConfirmId === selectedTranscript._id ? (
                      <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-lg">
                        <span className="text-[10px] text-red-400 font-medium">Delete?</span>
                        <button
                          onClick={async () => {
                            if (selectedTranscript._id) {
                              await onDelete(selectedTranscript._id);
                              setDeleteConfirmId(null);
                            }
                          }}
                          className="h-6 px-1.5 flex items-center justify-center rounded bg-red-500 text-white text-[10px] font-semibold hover:bg-red-600 transition"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="h-6 px-1.5 flex items-center justify-center rounded bg-white/[0.04] text-text-secondary text-[10px] font-medium hover:text-white transition"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(selectedTranscript._id || null)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-red-500/15 hover:border-red-500/30 text-red-400 hover:bg-red-500/5 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 max-h-[300px] overflow-y-auto text-xs text-text-primary leading-relaxed bg-white/[0.01] border border-white/[0.04] rounded-xl p-4 select-text">
                  {selectedTranscript.text}
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[300px] border border-dashed border-white/[0.06] rounded-2xl flex flex-col items-center justify-center text-text-secondary text-xs">
                <FileText className="h-8 w-8 text-white/20 mb-2" />
                Select a transcript on the left to inspect detailed scripts.
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
