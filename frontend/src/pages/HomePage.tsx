import { useState, useEffect } from 'react';
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
    const element = document.getElementById('playground');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const features = [
    {
      icon: <Zap className="h-4 w-4 text-[#800020]" />,
      title: 'Fast Processing',
      description: 'Acquire complete, punctuated, and ready transcripts in seconds.'
    },
    {
      icon: <Mic className="h-4 w-4 text-[#800020]" />,
      title: 'In-Browser Recording',
      description: 'Record ideas directly through standard media devices with zero extension downloads.'
    },
    {
      icon: <Shield className="h-4 w-4 text-[#800020]" />,
      title: 'Privacy Secured',
      description: 'Your voice snippets and records are safe, isolated, and under full user control.'
    },
    {
      icon: <FileText className="h-4 w-4 text-[#800020]" />,
      title: 'Direct Text Exports',
      description: 'Download transcript files seamlessly with localized time indicators and configurations.'
    },
    {
      icon: <Award className="h-4 w-4 text-[#800020]" />,
      title: 'Minimal Modern UI',
      description: 'A clean and elegant system layout styled with a soft burgundy design.'
    },
    {
      icon: <Clock className="h-4 w-4 text-[#800020]" />,
      title: 'Transcribe History',
      description: 'Access, search, filter, and inspect your saved scripts from a unified registry dashboard.'
    }
  ];

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#FBF9F9] text-[#2C1A1C]">
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* HERO SECTION - Simple layout with proper spacing */}
        <section className="pt-20 pb-16 text-center md:pt-28 md:pb-20 select-none">
          <div className="flex flex-col items-center">
            {/* Announcement badge minimal */}
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold bg-[#F3EFEF] border border-[#EADEE0] text-[#5C4E50] mb-6">
              SonicScript 1.0 Release
            </span>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#2C1A1C] max-w-3xl leading-[1.15] mb-6">
              Convert speech to text <br className="hidden sm:inline" />
              with burgundy visual clarity.
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm md:text-base text-[#5C4E50] max-w-lg leading-relaxed mb-10">
              A modern, minimal transcription dashboard. capture voice notes or upload files directly inside your browser. No extra decorations, just clear annotations.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={scrollToApp}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-[#800020] hover:bg-[#5A1220] text-xs font-semibold text-white px-5 py-3 transition-colors cursor-pointer shadow-sm"
              >
                Launch Console
              </button>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1 rounded-lg bg-white hover:bg-[#FBF9F9] border border-[#EADEE0] text-xs font-semibold text-[#2C1A1C] px-5 py-3 transition-all"
              >
                Learn More <ChevronDown className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* Live system counters stats section */}
        <section className="py-10 border-y border-[#EADEE0] mb-12 select-none">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto text-center">
            <div className="p-2">
              <p className="text-2xl font-extrabold text-[#2C1A1C] font-mono">99.8%</p>
              <p className="text-[9px] uppercase tracking-wider text-[#5C4E50] font-semibold mt-1">Accuracy Quotient</p>
            </div>
            <div className="p-2 border-t sm:border-t-0 sm:border-x border-[#EADEE0]">
              <p className="text-2xl font-extrabold text-[#2C1A1C] font-mono">&lt; 2.5s</p>
              <p className="text-[9px] uppercase tracking-wider text-[#5C4E50] font-semibold mt-1">Computation Latency</p>
            </div>
            <div className="p-2 border-t sm:border-t-0">
              <p className="text-2xl font-extrabold text-[#2C1A1C] font-mono">Secure</p>
              <p className="text-[9px] uppercase tracking-wider text-[#5C4E50] font-semibold mt-1">Encrypted Files</p>
            </div>
          </div>
        </section>

        {/* APPLICATION PLAYGROUND SECTION */}
        <section id="playground" className="py-12 scroll-mt-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="minimal-panel p-6 sm:p-8 max-w-3xl mx-auto shadow-sm"
          >
            {/* Tab toggles */}
            <div className="flex items-center justify-center bg-[#F3EFEF] border border-[#EADEE0] rounded-lg p-1 max-w-[260px] mx-auto mb-8 select-none">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 flex items-center justify-center gap-1 rounded-md py-2 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-white text-[#2C1A1C] shadow-sm'
                    : 'text-[#5C4E50] hover:text-[#2C1A1C]'
                }`}
              >
                <Upload className="h-3.5 w-3.5" /> File Upload
              </button>
              <button
                onClick={() => setActiveTab('record')}
                className={`flex-1 flex-center flex items-center justify-center gap-1 rounded-md py-2 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'record'
                    ? 'bg-white text-[#2C1A1C] shadow-sm'
                    : 'text-[#5C4E50] hover:text-[#2C1A1C]'
                }`}
              >
                <Mic className="h-3.5 w-3.5" /> Record Audio
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
          <div className="border-t border-[#EADEE0] pt-16">
            <div className="flex items-center justify-between mb-8 select-none text-left">
              <div>
                <h2 className="text-lg font-bold text-[#2C1A1C] flex items-center gap-2">
                  <ListFilter className="h-4.5 w-4.5" /> Transcriptions History
                </h2>
                <p className="text-xs text-[#5C4E50] mt-0.5">
                  Browse previous transcripts and download text records.
                </p>
              </div>
            </div>

            <div className="bg-white/50 border border-[#EADEE0] rounded-2xl p-5 sm:p-6">
              <TranscriptionHistory
                transcripts={transcripts}
                onDelete={handleDelete}
                loading={loadingHistory}
              />
            </div>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" className="py-20 border-t border-[#EADEE0] mt-12">
          <div className="text-center max-w-xl mx-auto mb-16 select-none">
            <h2 className="text-xl font-bold text-[#2C1A1C] mb-2">
              Features overview
            </h2>
            <p className="text-xs sm:text-sm text-[#5C4E50] leading-relaxed">
              Designed simply to deliver speech conversion files cleanly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="minimal-panel p-5 text-left transition-colors duration-200 hover:border-[#800020]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EADEE0] bg-[#FBF9F9] mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xs font-bold text-[#2C1A1C] mb-1">
                  {feature.title}
                </h3>
                <p className="text-[11px] text-[#5C4E50] leading-relaxed">
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
