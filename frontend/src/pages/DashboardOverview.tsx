import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, Mic, Upload, Clock, ArrowRight, Activity, 
  Sparkles, HardDrive
} from 'lucide-react';
import { transcriptService, TranscriptData } from '../services/api.js';

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [transcripts, setTranscripts] = useState<TranscriptData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    transcriptService.getAll()
      .then((data) => {
        setTranscripts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching dashboard stats:', err);
        setLoading(false);
      });
  }, []);

  // Compute analytics
  const totalCount = transcripts.length;
  
  // Calculate total seconds of audio
  const totalSeconds = transcripts.reduce((sum, t) => sum + (t.duration || 0), 0);
  const formatDuration = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  // Sizing formatting helper
  const totalSize = transcripts.reduce((sum, t) => sum + (t.fileSize || 0), 0);
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const uploadCount = transcripts.filter(t => t.fileName).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }
  };

  return (
    <div className="space-y-8 select-none text-left">
      
      {/* HEADER GREETINGS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">SonicScript Workspace</h2>
          <p className="text-xs text-stone-text-secondary mt-0.5">
            Welcome to your futuristic real-time transcription dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/record')}
            className="px-4 py-2 inline-flex items-center gap-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover shadow-md shadow-brand-primary/10 transition-colors cursor-pointer"
          >
            <Mic className="h-3.5 w-3.5" /> Start Recording
          </button>
          <button
            onClick={() => navigate('/dashboard/upload')}
            className="px-4 py-2 inline-flex items-center gap-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-stone-text-primary bg-stone-secondary hover:bg-stone-border border border-stone-border/80 transition-colors cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" /> Upload File
          </button>
        </div>
      </div>

      {/* STATS WIDGETS SECTION */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="minimal-panel p-5 h-28 animate-pulse flex flex-col justify-between">
              <div className="h-4 bg-stone-border/50 rounded w-1/3" />
              <div className="h-8 bg-stone-border/50 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {/* Card 1: Total Transcriptions */}
          <motion.div 
            variants={itemVariants} 
            className="minimal-panel p-5 relative overflow-hidden group hover:border-brand-primary/40 transition-colors"
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-brand-primary/5 blur-2xl group-hover:bg-brand-primary/10 transition-colors" />
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-text-secondary">Total Transcriptions</span>
              <FileText className="h-4 w-4 text-brand-primary" />
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-white font-mono">{totalCount}</h3>
              <p className="text-[9px] text-stone-text-secondary mt-1">Compiled transcript files</p>
            </div>
          </motion.div>

          {/* Card 2: Audio Uploaded */}
          <motion.div 
            variants={itemVariants}
            className="minimal-panel p-5 relative overflow-hidden group hover:border-brand-accent/40 transition-colors"
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-brand-accent/5 blur-2xl group-hover:bg-brand-accent/10 transition-colors" />
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-text-secondary">Audio Uploaded</span>
              <Upload className="h-4 w-4 text-brand-accent" />
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-white font-mono">{uploadCount}</h3>
              <p className="text-[9px] text-stone-text-secondary mt-1">Processed local files</p>
            </div>
          </motion.div>

          {/* Card 3: Recording Duration */}
          <motion.div 
            variants={itemVariants}
            className="minimal-panel p-5 relative overflow-hidden group hover:border-brand-primary/40 transition-colors"
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-brand-primary/5 blur-2xl group-hover:bg-brand-primary/10 transition-colors" />
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-text-secondary">Recording Duration</span>
              <Clock className="h-4 w-4 text-brand-primary" />
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-white font-mono">{formatDuration(totalSeconds)}</h3>
              <p className="text-[9px] text-stone-text-secondary mt-1">Voice processing time</p>
            </div>
          </motion.div>

          {/* Card 4: Total Storage Used */}
          <motion.div 
            variants={itemVariants}
            className="minimal-panel p-5 relative overflow-hidden group hover:border-brand-accent/40 transition-colors"
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-brand-accent/5 blur-2xl group-hover:bg-brand-accent/10 transition-colors" />
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-text-secondary">Sandbox Storage</span>
              <HardDrive className="h-4 w-4 text-brand-accent" />
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-white font-mono">{formatBytes(totalSize || (totalCount * 128000))}</h3>
              <p className="text-[9px] text-stone-text-secondary mt-1">Estimated binary buffers</p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* DASHBOARD BODY LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RECENT ACTIVITY LOGS (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-border pb-3">
            <Activity className="h-4 w-4 text-brand-primary" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Activity Logs</h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="minimal-panel p-4 h-16 animate-pulse" />
              ))}
            </div>
          ) : transcripts.length === 0 ? (
            <div className="minimal-panel p-12 text-center text-stone-text-secondary border-dashed flex flex-col items-center">
              <Sparkles className="h-8 w-8 opacity-40 mb-3 text-brand-accent" />
              <p className="text-xs font-bold">No active transcriptions found</p>
              <p className="text-[10px] text-stone-text-secondary/70 mt-1">Launch recorder to create your first speech transcription.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transcripts.slice(0, 4).map((item) => (
                <div
                  key={item._id}
                  onClick={() => navigate('/dashboard/history')}
                  className="minimal-panel p-4 flex items-center justify-between gap-4 hover:border-brand-primary/40 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-stone-secondary border border-stone-border flex items-center justify-center text-brand-primary group-hover:scale-105 transition-transform shrink-0">
                      {item.fileName ? <Upload className="h-4 w-4 text-brand-accent" /> : <Mic className="h-4 w-4 text-brand-primary" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.title}</p>
                      <p className="text-[9px] text-stone-text-secondary mt-0.5">
                        {item.fileName ? 'Uploaded File' : 'Recorded Audio'} • {formatDuration(item.duration)} • Accuracy: {item.accuracy || 95}%
                      </p>
                    </div>
                  </div>
                  
                  <span className="p-1 rounded-lg border border-stone-border text-stone-text-secondary group-hover:text-white group-hover:border-brand-primary transition-colors shrink-0">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              ))}

              <button
                onClick={() => navigate('/dashboard/history')}
                className="w-full text-center py-2.5 rounded-lg border border-stone-border hover:border-brand-primary/50 text-[10px] font-bold text-brand-primary hover:text-white uppercase tracking-wider block transition-colors bg-stone-card/20"
              >
                View Complete Catalog
              </button>
            </div>
          )}
        </div>

        {/* SYSTEM STATUS WIDGET (Right 1 Column) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-border pb-3">
            <Sparkles className="h-4 w-4 text-brand-accent" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Neural Core Status</h3>
          </div>

          <div className="minimal-panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-border pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-text-secondary">Speech engine</span>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Operational
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-stone-border pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-text-secondary">Database save pipeline</span>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Active
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-text-secondary">Gateway Socket Latency</span>
              <span className="text-[10px] font-bold text-white font-mono">18ms</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
