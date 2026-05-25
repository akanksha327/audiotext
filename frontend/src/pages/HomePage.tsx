import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Mic, Clock, ChevronDown, Shield, FileText, Zap, Award, ListFilter } from 'lucide-react';
import AudioUpload from '../components/AudioUpload.jsx';
import AudioRecorder from '../components/AudioRecorder.jsx';
import TranscriptionHistory from '../components/TranscriptionHistory.jsx';
import { transcriptService, TranscriptData } from '../services/api.js';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');
  const [transcripts, setTranscripts] = useState<TranscriptData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const appSectionRef = useRef<HTMLDivElement>(null);

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
  }, []);

  const handleTranscribeComplete = async (title: string, duration: number, customText?: string) => {
    try {
      await transcriptService.create({
        title,
        duration,
        text: customText,
        status: 'completed',
        language: 'en'
      });
      // Refresh list
      await fetchHistory();
    } catch (err) {
      console.error('Failed to save transcript:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await transcriptService.delete(id);
      if (success) {
        setTranscripts((prev) => prev.filter((t) => t._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete transcript:', err);
    }
  };

  const scrollToApp = () => {
    appSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Feature grid details
  const features = [
    {
      icon: <Zap className="h-5 w-5 text-brand-indigo" />,
      title: 'Sub-Second Speeds',
      description: 'Acquire complete, punctuated, and ready transcripts in less than 5 seconds.'
    },
    {
      icon: <Mic className="h-5 w-5 text-brand-indigo" />,
      title: 'In-Browser Recording',
      description: 'Record ideas directly through standard media devices with zero extension downloads.'
    },
    {
      icon: <Shield className="h-5 w-5 text-brand-indigo" />,
      title: 'Privacy Secured',
      description: 'Your voice snippets and records are safe, isolated, and under full user control.'
    },
    {
      icon: <FileText className="h-5 w-5 text-brand-indigo" />,
      title: 'Direct Text Exports',
      description: 'Download transcript files seamlessly with localized time indicators and configurations.'
    },
    {
      icon: <Award className="h-5 w-5 text-brand-indigo" />,
      title: 'Modern Dark Aesthetic',
      description: 'A premium system dashboard styled with subtle glass tiles and fine system elements.'
    },
    {
      icon: <Clock className="h-5 w-5 text-brand-indigo" />,
      title: 'Transcribe History',
      description: 'Access, search, filter, and inspect your saved scripts from a unified registry dashboard.'
    }
  ];

  return (
    <div className="relative overflow-hidden min-h-screen">
      
      {/* Drifting ambient lights (non-neon subtle glow) */}
      <div className="bg-mesh-glow top-[15%] left-[10%] opacity-80" />
      <div className="bg-mesh-glow top-[60%] right-[-5%] opacity-60" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* HERO SECTION */}
        <section className="pt-20 pb-16 text-center md:pt-32 md:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            {/* Announcement Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium bg-white/[0.03] border border-white/[0.08] text-text-secondary hover:border-white/20 transition-all cursor-default mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo animate-pulse" />
              Introducing SonicScript 1.0
            </span>

            {/* Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl max-w-3xl leading-[1.1] mb-6">
              Speak. Capture. <br className="sm:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-brand-indigo">
                Transcribe Instantly.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-text-secondary max-w-xl leading-relaxed mb-10">
              A premium AI speech-to-text platform designed for writers, thinkers, and builders. Capture voice notes or upload files directly inside your browser.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={scrollToApp}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-indigo hover:bg-brand-indigo-hover text-sm font-semibold text-white px-6 py-3 transition-all active:scale-95 shadow-lg shadow-brand-indigo/15"
              >
                Get Started Free
              </button>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-sm font-semibold text-text-primary px-6 py-3 transition-all"
              >
                Learn More <ChevronDown className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        </section>

        {/* APPLICATION PLAYGROUND SECTION */}
        <section ref={appSectionRef} className="py-12 scroll-mt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="glass-panel rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto shadow-2xl relative overflow-hidden"
          >
            {/* Tab Toggles */}
            <div className="flex items-center justify-center bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 max-w-[260px] mx-auto mb-8">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                  activeTab === 'upload'
                    ? 'bg-brand-indigo text-white shadow-sm'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                <Upload className="h-3.5 w-3.5" /> Upload File
              </button>
              <button
                onClick={() => setActiveTab('record')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                  activeTab === 'record'
                    ? 'bg-brand-indigo text-white shadow-sm'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                <Mic className="h-3.5 w-3.5" /> Record Live
              </button>
            </div>

            {/* Playground panels */}
            <div className="min-h-[220px] flex items-center justify-center">
              {activeTab === 'upload' ? (
                <AudioUpload onTranscribeComplete={handleTranscribeComplete} />
              ) : (
                <AudioRecorder onTranscribeComplete={handleTranscribeComplete} />
              )}
            </div>
          </motion.div>
        </section>

        {/* TRANSCRIPT CATALOG BOARD */}
        <section className="py-16">
          <div className="border-t border-white/[0.05] pt-16">
            <div className="flex items-center justify-between mb-8">
              <div className="text-left">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ListFilter className="h-5 w-5 text-brand-indigo" /> Saved History
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  Access and manage your speech-to-text catalog database.
                </p>
              </div>
            </div>

            <div className="bg-white/[0.01] border border-white/[0.05] rounded-3xl p-6 sm:p-8">
              <TranscriptionHistory
                transcripts={transcripts}
                onDelete={handleDelete}
                loading={loadingHistory}
              />
            </div>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" className="py-20 border-t border-white/[0.05] mt-12">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-white mb-3">
              Engineered for absolute fidelity
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Designed with premium utilities, local storage integrations, and swift acoustic calculations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="glass-panel glass-panel-interactive rounded-2xl p-6 text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-indigo/10 border border-brand-indigo/15 text-brand-indigo mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
