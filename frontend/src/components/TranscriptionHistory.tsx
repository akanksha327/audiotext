import { useState, useEffect, useRef } from 'react';
import { TranscriptData } from '../services/api.js';
import { Search, Clock, Calendar, Copy, Download, Trash2, Check, FileText, Globe, RefreshCw, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TranscriptionHistoryProps {
  transcripts: TranscriptData[];
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

type TabType = 'transcript' | 'summary' | 'insights' | 'translation';

// Local Mock Translation Dictionary
const translationsDict: Record<string, Record<string, string>> = {
  'demo-1': {
    es: 'Bienvenidos todos a la reunión de lanzamiento de SonicScript. Hoy estamos lanzando nuestra nueva base SaaS de IA de voz a texto. Nos centraremos en una sensación visual extrema, paneles receptivos, alta accesibilidad y descargas instantáneas.',
    fr: 'Bienvenue à tous à la réunion de lancement de SonicScript. Aujourd\'hui, nous lançons notre nouvelle base SaaS d\'IA de conversion parole-texte. Nous nous concentrerons sur une sensation visuelle extrême, des panneaux réactifs, une accessibilité élevée et des téléchargements instantanés.',
    de: 'Begrüßen Sie alle zum SonicScript Kickoff-Meeting. Heute starten wir unser neues KI-Sprach-zu-Text-SaaS-Fundament. Wir werden uns auf extremes visuelles Premium-Feeling, reaktionsschnelle Panels, hohe Barrierefreiheit und sofortige Downloads konzentrieren.',
    ja: 'SonicScriptキックオフミーティングへようこそ。本日、新しいAI音声テキスト変換SaaSファンデーションを立ち上げます。極限のプレミアムな視覚的感触、応答性の高いパネル、高いアクセシビリティ、そして即時ダウンロードに焦点を当てます。'
  },
  'demo-2': {
    es: 'Creo que deberíamos apegarnos a una estética humana y limpia. Evitemos los verdes y morados de neón artificiales. Superficies de gris carbón profundo, tipografía de sistema premium como Inter, tarjetas sutiles con bordes glassmorphic y botones muy suaves y elegantes.',
    fr: 'Je pense que nous devrions nous en tenir à une esthétique humaine propre. Évitons les verts et violets néon artificiels. Des surfaces gris anthracite profond, une typographie système haut de gamme comme Inter, des cartes subtiles avec des bordures glassmorphiques et des boutons très doux.',
    de: 'Ich denke, wir sollten uns an eine saubere, menschliche Ästhetik halten. Vermeiden wir künstliche Neongrüntöne und Lilatöne. Tiefes Anthrazitgrau für die Oberflächen, hochwertige Systemtypografie wie Inter, subtile Karten mit glassmorphem Rand und sehr weiche, elegante Tasten.',
    ja: '私たちはクリーンで人間的な美学に固執すべきだと思います。人工的なネオングリーンやパープルは避けましょう。深いチャコールグレーの表面、Interのようなプレミアムなシステムタイポグラフィ、グラスモルフィックな境界線を持つ微妙なカード、そして非常に柔らかくエレガントなボタン。'
  }
};

export default function TranscriptionHistory({ transcripts, onDelete, loading }: TranscriptionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Player States
  const [activeTab, setActiveTab] = useState<TabType>('transcript');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [selectedLang, setSelectedLang] = useState('es');
  
  const playbackIntervalRef = useRef<number | null>(null);

  const filtered = transcripts.filter((t) => {
    const term = searchTerm.toLowerCase();
    return t.title.toLowerCase().includes(term) || t.text.toLowerCase().includes(term);
  });

  const selectedTranscript = transcripts.find(t => t._id === selectedId) || (filtered.length > 0 ? filtered[0] : null);

  useEffect(() => {
    setIsPlaying(false);
    setPlayProgress(0);
    setActiveTab('transcript');
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  }, [selectedId]);

  useEffect(() => {
    if (selectedTranscript && !transcripts.find(t => t._id === selectedTranscript._id)) {
      setSelectedId(filtered.length > 0 ? filtered[0]._id || null : null);
    }
  }, [transcripts]);

  useEffect(() => {
    if (!selectedId && filtered.length > 0) {
      setSelectedId(filtered[0]._id || null);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    if (isPlaying) {
      const stepTime = selectedTranscript ? (selectedTranscript.duration * 1000) / 100 : 300;
      playbackIntervalRef.current = window.setInterval(() => {
        setPlayProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
            return 0;
          }
          return prev + 1;
        });
      }, stepTime);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    }
    return () => {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    };
  }, [isPlaying, selectedTranscript]);

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

  const getAISummary = (text: string) => {
    const sentences = text.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
    const overview = sentences.slice(0, 2).join('. ') + '.';
    
    const talkingPoints = sentences.length > 2 
      ? sentences.slice(2, 5).map(s => s.charAt(0).toUpperCase() + s.slice(1))
      : ['Analyze audio acoustics.', 'Structure punctuation.', 'Verify outputs.'];
      
    const actionItems = [
      'Export detailed annotated transcript.',
      'Deploy visual templates.',
      'Conduct verification inspections.'
    ];

    return { overview, talkingPoints, actionItems };
  };

  const getMockTranslationText = (transcript: TranscriptData, lang: string): string => {
    if (transcript._id && translationsDict[transcript._id]?.[lang]) {
      return translationsDict[transcript._id][lang];
    }
    
    const mappings: Record<string, string> = {
      es: 'Traducción: Bienvenidos a la plataforma SonicScript. Su transcripción de audio se ha procesado con alta fidelidad.',
      fr: 'Traduction: Bienvenue sur la plateforme SonicScript. Votre transcription audio a été traitée avec succès.',
      de: 'Übersetzung: Willkommen auf der SonicScript-Plattform. Ihre Transkription wurde erfolgreich verarbeitet.',
      ja: '翻訳: SonicScriptプラットフォームへようこそ。文字起こしが正常に完了しました。'
    };
    return mappings[lang] || transcript.text;
  };

  const getSentimentScore = (text: string) => {
    const txt = text.toLowerCase();
    let positive = 0;
    let analytical = 0;
    
    const posWords = ['welcome', 'launching', 'premium', 'clean', 'beautiful', 'fidelity', 'instant', 'excellent'];
    const analWords = ['focus', 'should', 'think', 'avoid', 'system', 'structure', 'calculation', 'speed', 'database'];
    
    posWords.forEach(w => { if (txt.includes(w)) positive += 15; });
    analWords.forEach(w => { if (txt.includes(w)) analytical += 12; });

    const posPct = Math.min(95, Math.max(45, 60 + positive));
    const analPct = Math.min(98, Math.max(50, 70 + analytical));
    
    const tags = ['Acoustic', 'Web Audio', 'Speech AI', 'Database'];
    if (txt.includes('design') || txt.includes('aesthetic')) tags.push('Visual', 'Minimal');
    
    return { posPct, analPct, tags };
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        
        {/* Left Side: Directory List */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="relative w-full mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#505A73]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transcriptions..."
              className="w-full text-xs text-[#1A233D] bg-white border border-[#D2D8EC] focus:border-[#8A9FE8] outline-none rounded-lg pl-9 pr-4 py-2.5 transition-colors"
            />
          </div>

          <div className="flex-1 max-h-[460px] overflow-y-auto space-y-2 pr-1 select-none">
            {loading ? (
              <div className="py-16 text-center text-xs text-[#505A73]">
                <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2 text-[#8A9FE8]" />
                Loading transcription catalog...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-[#D2D8EC] rounded-xl text-xs text-[#505A73]">
                No transcriptions found.
              </div>
            ) : (
              filtered.map((item) => {
                const isActive = selectedTranscript?._id === item._id;
                return (
                  <div
                    key={item._id}
                    onClick={() => setSelectedId(item._id || null)}
                    className={`p-4 border rounded-xl cursor-pointer text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-[#E4E8F4] border-[#8A9FE8] shadow-sm'
                        : 'bg-white border-[#D2D8EC] hover:bg-[#F3F5FC]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <h4 className="text-xs font-semibold text-[#1A233D] truncate max-w-[170px]">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-[#505A73] bg-[#E4E8F4] border border-[#D2D8EC] px-2 py-0.5 rounded font-mono">
                        {formatDuration(item.duration)}
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-[#505A73] line-clamp-2 leading-relaxed mb-3">
                      {item.text}
                    </p>
                    
                    <div className="flex items-center justify-between text-[10px] text-[#505A73]">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3" /> {formatDate(item.createdAt)}
                      </span>
                      <span className="flex items-center gap-1 font-mono uppercase bg-[#F3F5FC] border border-[#D2D8EC] px-1.5 py-0.5 rounded text-[9px]">
                        <Globe className="h-2.5 w-2.5" /> {item.language}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Transcription detail Viewer */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedTranscript ? (
              <motion.div
                key={selectedTranscript._id}
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.15 }}
                className="minimal-panel p-6 flex flex-col h-full text-left"
              >
                {/* Header metadata bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D2D8EC] pb-4 mb-4 select-none">
                  <div>
                    <h3 className="text-sm font-bold text-[#1A233D] truncate max-w-[280px]">
                      {selectedTranscript.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#505A73]">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3.5 w-3.5" /> {formatDuration(selectedTranscript.duration)}
                      </span>
                      <span className="w-px h-3 bg-[#D2D8EC]" />
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="h-3.5 w-3.5" /> {formatDate(selectedTranscript.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => handleCopy(selectedTranscript._id!, selectedTranscript.text)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#D2D8EC] hover:border-[#8A9FE8] text-[#505A73] hover:text-[#1A233D] bg-white transition-colors cursor-pointer"
                      title="Copy"
                    >
                      {copiedId === selectedTranscript._id ? <Check className="h-4 w-4 text-[#8A9FE8]" /> : <Copy className="h-4 w-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleDownload(selectedTranscript)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#D2D8EC] hover:border-[#8A9FE8] text-[#505A73] hover:text-[#1A233D] bg-white transition-colors cursor-pointer"
                      title="Download text"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    
                    {deleteConfirmId === selectedTranscript._id ? (
                      <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
                        <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider">Confirm?</span>
                        <button
                          onClick={async () => {
                            if (selectedTranscript._id) {
                              await onDelete(selectedTranscript._id);
                              setDeleteConfirmId(null);
                            }
                          }}
                          className="h-6 px-2 flex items-center justify-center rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 transition cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="h-6 px-2 flex items-center justify-center rounded bg-white text-[#505A73] border border-[#D2D8EC] text-[10px] font-semibold hover:bg-[#F3F5FC] transition cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(selectedTranscript._id || null)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-red-200 hover:border-red-400 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete transcript"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Waveform seekbar */}
                <div className="bg-[#F3F5FC] border border-[#D2D8EC] rounded-xl p-4 mb-4 select-none flex items-center gap-4">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="h-9 w-9 shrink-0 rounded-lg bg-[#8A9FE8] hover:bg-[#6B82D6] flex items-center justify-center text-white transition-colors cursor-pointer shadow-sm"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                  </button>

                  <div className="flex-1 flex flex-col gap-1 text-left">
                    <span className="text-[10px] text-[#505A73] font-bold uppercase tracking-wider">Playback</span>
                    <div className="h-6 flex items-end gap-[3px] w-full cursor-pointer relative">
                      {[...Array(40)].map((_, idx) => {
                        const heightPct = Math.max(20, Math.floor(Math.sin(idx * 0.4) * 30) + 50) + (idx % 3 === 0 ? 8 : -8);
                        const isActive = (idx / 40) * 100 <= playProgress;
                        return (
                          <div
                            key={idx}
                            onClick={() => setPlayProgress(Math.floor((idx / 40) * 100))}
                            className="waveform-bar flex-1 rounded-t-sm"
                            style={{ 
                              height: `${heightPct}%`,
                              backgroundColor: isActive ? '#8A9FE8' : '#D2D8EC'
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#D2D8EC] mb-4 select-none overflow-x-auto">
                  {(['transcript', 'summary', 'insights', 'translation'] as TabType[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-xs font-bold border-b-2 capitalize transition-colors cursor-pointer whitespace-nowrap ${
                        activeTab === tab
                          ? 'border-[#8A9FE8] text-[#1A233D]'
                          : 'border-transparent text-[#505A73] hover:text-[#1A233D]'
                      }`}
                    >
                      {tab === 'insights' ? 'Insights' : tab === 'summary' ? 'Summary' : tab === 'translation' ? 'Translation' : 'Transcript'}
                    </button>
                  ))}
                </div>

                {/* Tab contents */}
                <div className="flex-1 min-h-[160px] max-h-[200px] overflow-y-auto pr-1 bg-[#F3F5FC]/30 border border-[#D2D8EC] rounded-xl p-4">
                  <AnimatePresence mode="wait">
                    
                    {/* Tab 1: Full transcript body */}
                    {activeTab === 'transcript' && (
                      <motion.div
                        key="transcript-tab"
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        className="text-xs text-[#1A233D] leading-relaxed select-text"
                      >
                        {selectedTranscript.text.split('. ').map((sentence, idx, array) => {
                          const sentenceProgressStart = (idx / array.length) * 100;
                          const sentenceProgressEnd = ((idx + 1) / array.length) * 100;
                          const isSentenceActive = isPlaying && playProgress >= sentenceProgressStart && playProgress < sentenceProgressEnd;
                          
                          return (
                            <span 
                              key={idx} 
                              className={`transition-colors duration-200 mr-1 ${isSentenceActive ? 'word-active' : ''}`}
                            >
                              {sentence}{idx < array.length - 1 ? '.' : ''}
                            </span>
                          );
                        })}
                      </motion.div>
                    )}

                    {/* Tab 2: Summaries */}
                    {activeTab === 'summary' && (
                      <motion.div
                        key="summary-tab"
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        className="space-y-4 text-left"
                      >
                        <div>
                          <span className="text-[10px] font-bold text-[#505A73] uppercase tracking-wider block mb-1">Executive Summary</span>
                          <p className="text-xs text-[#1A233D] leading-relaxed">
                            {getAISummary(selectedTranscript.text).overview}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-[#505A73] uppercase tracking-wider block mb-1">Key Talking Points</span>
                            <ul className="space-y-1 text-xs text-[#505A73] pl-1 list-disc list-inside">
                              {getAISummary(selectedTranscript.text).talkingPoints.map((item, i) => (
                                <li key={i} className="leading-relaxed hover:text-[#1A233D] transition-colors">{item}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-[#505A73] uppercase tracking-wider block mb-1">Next Steps</span>
                            <ul className="space-y-1 text-xs text-[#505A73] pl-1 list-disc list-inside">
                              {getAISummary(selectedTranscript.text).actionItems.map((item, i) => (
                                <li key={i} className="leading-relaxed hover:text-[#1A233D] transition-colors">{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Tab 3: Detailed insights */}
                    {activeTab === 'insights' && (
                      <motion.div
                        key="insights-tab"
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        className="space-y-4 text-left"
                      >
                        <div>
                          <span className="text-[10px] font-bold text-[#505A73] uppercase tracking-wider block mb-2">Sentiment Profile</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-white border border-[#D2D8EC] rounded-lg p-2.5">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-[#505A73] font-medium">Confident</span>
                                <span className="font-mono text-[#1A233D] font-bold">{getSentimentScore(selectedTranscript.text).posPct}%</span>
                              </div>
                              <div className="w-full h-1 bg-[#E4E8F4] rounded-full overflow-hidden">
                                <div className="h-full bg-[#8A9FE8] rounded-full" style={{ width: `${getSentimentScore(selectedTranscript.text).posPct}%` }} />
                              </div>
                            </div>

                            <div className="bg-white border border-[#D2D8EC] rounded-lg p-2.5">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-[#505A73] font-medium">Technical</span>
                                <span className="font-mono text-[#1A233D] font-bold">{getSentimentScore(selectedTranscript.text).analPct}%</span>
                              </div>
                              <div className="w-full h-1 bg-[#E4E8F4] rounded-full overflow-hidden">
                                <div className="h-full bg-[#8A9FE8] rounded-full" style={{ width: `${getSentimentScore(selectedTranscript.text).analPct}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-[#505A73] uppercase tracking-wider block mb-1.5">Speaking Statistics</span>
                            <div className="flex items-center gap-4 text-xs text-[#505A73] bg-white border border-[#D2D8EC] rounded-lg p-2.5">
                              <div>
                                <p className="font-mono text-base text-[#1A233D] font-bold">148</p>
                                <p className="text-[9px] uppercase tracking-wider mt-0.5">Pace (WPM)</p>
                              </div>
                              <div className="w-px h-6 bg-[#D2D8EC]" />
                              <div>
                                <p className="font-mono text-base text-[#1A233D] font-bold">{selectedTranscript.text.split(' ').length}</p>
                                <p className="text-[9px] uppercase tracking-wider mt-0.5">Total Words</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-[#505A73] uppercase tracking-wider block mb-1.5">Entity Tags</span>
                            <div className="flex flex-wrap gap-1">
                              {getSentimentScore(selectedTranscript.text).tags.map((tag, idx) => (
                                <span key={idx} className="text-[9px] font-bold text-[#1A233D] bg-[#E4E8F4] border border-[#D2D8EC] px-2 py-0.5 rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Tab 4: Localized language translations */}
                    {activeTab === 'translation' && (
                      <motion.div
                        key="translation-tab"
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        className="space-y-4 text-left"
                      >
                        <div className="flex items-center justify-between border-b border-[#D2D8EC] pb-2 select-none">
                          <span className="text-[10px] font-bold text-[#505A73] uppercase tracking-wider">Language translation</span>
                          
                          <select
                            value={selectedLang}
                            onChange={(e) => setSelectedLang(e.target.value)}
                            className="bg-white text-xs text-[#1A233D] border border-[#D2D8EC] focus:border-[#8A9FE8] outline-none rounded-lg px-2 py-0.5 cursor-pointer"
                          >
                            <option value="es">Castellano (Spanish)</option>
                            <option value="fr">Français (French)</option>
                            <option value="de">Deutsch (German)</option>
                            <option value="ja">日本語 (Japanese)</option>
                          </select>
                        </div>

                        <div className="text-xs text-[#1A233D] leading-relaxed italic bg-white p-3 rounded-lg border border-[#D2D8EC]">
                          {getMockTranslationText(selectedTranscript, selectedLang)}
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[350px] border border-dashed border-[#D2D8EC] rounded-2xl flex flex-col items-center justify-center text-[#505A73] text-xs select-none">
                <FileText className="h-8 w-8 text-[#9CA3AF] mb-2" />
                Select an item in history to view transcription details.
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
