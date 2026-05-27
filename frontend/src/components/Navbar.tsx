import { useState, useEffect, useRef } from 'react';
import { 
  Mic, Settings, History, Sun, Moon, Laptop, LogOut, 
  ChevronDown, Globe, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { transcriptService, TranscriptData, userService, UserData } from '../services/api.js';

interface NavbarProps {
  onScrollToApp?: () => void;
}

export default function Navbar({ onScrollToApp }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'history' | 'settings' | 'profile' | null>(null);
  
  // Dropdown data states
  const [recents, setRecents] = useState<TranscriptData[]>([]);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState('default');
  const [userProfile, setUserProfile] = useState<UserData | null>(null);
  
  // Settings preferences
  const [lang, setLang] = useState(() => localStorage.getItem('sonic_lang') || 'en');
  const [quality, setQuality] = useState(() => localStorage.getItem('sonic_quality') || 'high');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Monitor scroll for header background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Enumerate inputs
  useEffect(() => {
    if (activeDropdown === 'settings') {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        setMics(audioInputs);
      }).catch(err => console.warn('Could not enumerate mics:', err));
    }
  }, [activeDropdown]);

  // Utility to format raw storage bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Fetch user profile metrics
  const fetchUserProfile = async () => {
    try {
      const profile = await userService.getProfile();
      setUserProfile(profile);
    } catch (err) {
      console.warn('Failed to load profile in Navbar:', err);
    }
  };

  // Fetch recent saved recordings
  const fetchRecents = async () => {
    try {
      const data = await transcriptService.getAll();
      setRecents(data.slice(0, 4)); // Show latest 4
    } catch (err) {
      console.warn('Failed to load recents in Navbar:', err);
    }
  };

  useEffect(() => {
    fetchRecents();
    fetchUserProfile();
    
    // Listen for updates from HomePage
    const handleUpdate = () => {
      fetchRecents();
      fetchUserProfile();
    };
    window.addEventListener('transcripts-updated', handleUpdate);
    return () => window.removeEventListener('transcripts-updated', handleUpdate);
  }, []);

  // Theme application
  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem('theme', theme);
    
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(systemDark);
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  // Update localStorage when setting variables change
  useEffect(() => {
    localStorage.setItem('sonic_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('sonic_quality', quality);
  }, [quality]);

  const handleSelectMic = (deviceId: string) => {
    setSelectedMic(deviceId);
    localStorage.setItem('sonic_mic', deviceId);
  };

  const handleSelectRecent = (id: string) => {
    setActiveDropdown(null);
    if (onScrollToApp) onScrollToApp();
    
    // Smooth scroll delay to allow page focus, then dispatch select event
    setTimeout(() => {
      const event = new CustomEvent('select-transcript', { detail: { id } });
      window.dispatchEvent(event);
    }, 150);
  };

  const handleDeleteRecent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await transcriptService.delete(id);
      // Dispatch event to sync home page
      window.dispatchEvent(new Event('transcripts-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    setActiveDropdown(null);
    if (confirm('Are you sure you want to log out? Local sandbox state will remain.')) {
      window.location.reload();
    }
  };

  const formatDuration = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
        isScrolled 
          ? 'bg-stone-bg/80 backdrop-blur-md border-stone-border shadow-sm' 
          : 'bg-transparent border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo - Burgundy */}
        <a href="/" className="flex items-center gap-2 group select-none">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-primary/30 bg-stone-card text-brand-primary shadow-sm relative">
            <Mic className="h-4 w-4 text-brand-primary relative z-10" />
            <span className="absolute inset-0 rounded-lg bg-brand-primary/10 animate-ping opacity-60 scale-95" />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-sm font-semibold tracking-tight text-stone-text-primary">
              SonicScript
            </span>
            <span className="text-[8px] font-mono tracking-widest text-brand-primary uppercase mt-0.5 flex items-center gap-1 font-bold">
              AI Active <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
            </span>
          </div>
        </a>

        {/* Navigation Dropdowns Row */}
        <div className="flex items-center gap-2.5" ref={dropdownRef}>
          
          {/* Dashboard Quick Scroll */}
          <button 
            onClick={onScrollToApp}
            className="hidden sm:inline-flex items-center justify-center text-xs font-semibold text-stone-text-secondary hover:text-stone-text-primary bg-stone-card hover:bg-stone-secondary border border-stone-border rounded-lg px-3.5 py-1.5 transition-all shadow-sm cursor-pointer select-none"
          >
            Dashboard
          </button>

          {/* History Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'history' ? null : 'history')}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                activeDropdown === 'history'
                  ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                  : 'border-stone-border text-stone-text-secondary hover:text-stone-text-primary bg-stone-card hover:bg-stone-secondary'
              }`}
              title="Recent Recordings"
            >
              <History className="h-4 w-4" />
            </button>
            
            <AnimatePresence>
              {activeDropdown === 'history' && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-72 rounded-xl border border-stone-border bg-stone-card p-2 shadow-lg z-50 text-left"
                >
                  <div className="px-3 py-2 border-b border-stone-border mb-1 select-none">
                    <h3 className="text-[10px] font-bold text-stone-text-secondary uppercase tracking-wider">Recent Recordings</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                    {recents.length === 0 ? (
                      <div className="px-3 py-6 text-center text-xs text-stone-text-secondary">
                        No transcripts recorded yet.
                      </div>
                    ) : (
                      recents.map((item) => (
                        <div
                          key={item._id}
                          onClick={() => handleSelectRecent(item._id || '')}
                          className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-stone-secondary cursor-pointer transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-stone-text-primary truncate">{item.title}</p>
                            <p className="text-[9px] text-stone-text-secondary font-mono mt-0.5">{formatDuration(item.duration)} • {new Date(item.createdAt || '').toLocaleDateString([], {month: 'short', day: 'numeric'})}</p>
                          </div>
                          <button
                            onClick={(e) => handleDeleteRecent(e, item._id || '')}
                            className="h-6 w-6 rounded flex items-center justify-center hover:bg-red-50 hover:text-red-600 text-stone-text-secondary transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="pt-2 border-t border-stone-border mt-1">
                    <button
                      onClick={() => {
                        setActiveDropdown(null);
                        if (onScrollToApp) onScrollToApp();
                        setTimeout(() => {
                          const playground = document.getElementById('playground');
                          if (playground) playground.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="w-full text-center py-1.5 text-[10px] font-bold text-brand-primary hover:text-brand-primary-hover uppercase tracking-wider block"
                    >
                      View All History
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'settings' ? null : 'settings')}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                activeDropdown === 'settings'
                  ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                  : 'border-stone-border text-stone-text-secondary hover:text-stone-text-primary bg-stone-card hover:bg-stone-secondary'
              }`}
              title="System Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            <AnimatePresence>
              {activeDropdown === 'settings' && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-72 rounded-xl border border-stone-border bg-stone-card p-3.5 shadow-lg z-50 text-left space-y-4"
                >
                  <div className="border-b border-stone-border pb-2 select-none">
                    <h3 className="text-[10px] font-bold text-stone-text-secondary uppercase tracking-wider">AI Platform Settings</h3>
                  </div>

                  {/* Dark Mode Toggle Options */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-text-secondary uppercase tracking-wider block">Theme Mode</span>
                    <div className="grid grid-cols-3 gap-1 bg-stone-secondary border border-stone-border rounded-lg p-0.5">
                      {(['light', 'dark', 'system'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`flex items-center justify-center gap-1.5 py-1 text-[10px] font-semibold rounded capitalize cursor-pointer transition-colors ${
                            theme === t
                              ? 'bg-stone-card text-stone-text-primary shadow-sm'
                              : 'text-stone-text-secondary hover:text-stone-text-primary'
                          }`}
                        >
                          {t === 'light' && <Sun className="h-3 w-3" />}
                          {t === 'dark' && <Moon className="h-3 w-3" />}
                          {t === 'system' && <Laptop className="h-3 w-3" />}
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language Selection */}
                  <div className="space-y-1.5">
                    <label htmlFor="lang-sel" className="text-[10px] font-bold text-stone-text-secondary uppercase tracking-wider block">Language</label>
                    <div className="relative">
                      <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-text-secondary" />
                      <select
                        id="lang-sel"
                        value={lang}
                        onChange={(e) => setLang(e.target.value)}
                        className="w-full text-xs text-stone-text-primary bg-stone-card border border-stone-border rounded-lg pl-8 pr-4 py-2 focus:border-brand-primary outline-none cursor-pointer appearance-none"
                      >
                        <option value="en">English (US)</option>
                        <option value="es">Español (Spanish)</option>
                        <option value="fr">Français (French)</option>
                        <option value="de">Deutsch (German)</option>
                        <option value="ja">日本語 (Japanese)</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-3 h-3 w-3 pointer-events-none text-stone-text-secondary" />
                    </div>
                  </div>

                  {/* Microphone Selection */}
                  <div className="space-y-1.5">
                    <label htmlFor="mic-sel" className="text-[10px] font-bold text-stone-text-secondary uppercase tracking-wider block">Microphone</label>
                    <div className="relative">
                      <Mic className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-text-secondary" />
                      <select
                        id="mic-sel"
                        value={selectedMic}
                        onChange={(e) => handleSelectMic(e.target.value)}
                        className="w-full text-xs text-stone-text-primary bg-stone-card border border-stone-border rounded-lg pl-8 pr-4 py-2 focus:border-brand-primary outline-none cursor-pointer appearance-none"
                      >
                        <option value="default">System Default</option>
                        {mics.map((m) => (
                          <option key={m.deviceId} value={m.deviceId}>
                            {m.label || `Microphone ${m.deviceId.slice(0, 5)}`}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-3 h-3 w-3 pointer-events-none text-stone-text-secondary" />
                    </div>
                  </div>

                  {/* AI Transcription Quality */}
                  <div className="space-y-1.5">
                    <label htmlFor="quality-sel" className="text-[10px] font-bold text-stone-text-secondary uppercase tracking-wider block">AI Quality Preset</label>
                    <div className="grid grid-cols-3 gap-1 bg-stone-secondary border border-stone-border rounded-lg p-0.5">
                      {['standard', 'high', 'ultra'].map((q) => (
                        <button
                          key={q}
                          onClick={() => setQuality(q)}
                          className={`py-1 text-[10px] font-semibold rounded capitalize cursor-pointer transition-colors ${
                            quality === q
                              ? 'bg-stone-card text-stone-text-primary shadow-sm border border-stone-border/20'
                              : 'text-stone-text-secondary hover:text-stone-text-primary'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Settings logout divider */}
                  <div className="pt-2 border-t border-stone-border flex justify-end">
                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-red-600 hover:text-red-700 uppercase tracking-wider py-1 hover:bg-red-50/50 rounded px-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3 w-3" /> Logout
                    </button>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')}
              className={`flex h-8 w-8 items-center justify-center rounded-full border overflow-hidden transition-all cursor-pointer bg-brand-primary text-white text-xs font-bold ${
                activeDropdown === 'profile' ? 'ring-2 ring-brand-primary' : 'border-stone-border hover:border-brand-primary'
              }`}
            >
              SS
            </button>

            <AnimatePresence>
              {activeDropdown === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 rounded-xl border border-stone-border bg-stone-card p-3.5 shadow-lg z-50 text-left space-y-4"
                >
                  {/* Profile Header */}
                  <div className="flex items-center gap-3 border-b border-stone-border pb-3 select-none">
                    <div className="h-10 w-10 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-bold shadow-inner">
                      {userProfile?.avatar || 'SS'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-text-primary truncate">{userProfile?.name || 'Sandbox User'}</p>
                      <p className="text-[10px] text-stone-text-secondary truncate">{userProfile?.email || 'user@sonicscript.ai'}</p>
                    </div>
                  </div>

                  {/* Profile Metrics Metadata */}
                  <div className="space-y-3 select-none">
                    <div>
                      <span className="text-[9px] font-bold text-stone-text-secondary uppercase tracking-wider block mb-1">Account Tier</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                        {userProfile?.accountType || 'Premium AI Sandbox'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[9px] font-bold text-stone-text-secondary uppercase tracking-wider mb-1">
                        <span>Cloud Storage</span>
                        <span className="font-mono">
                          {formatBytes(userProfile?.storageUsed || 0)} / {formatBytes(userProfile?.storageLimit || 100 * 1024 * 1024)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-secondary border border-stone-border rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-primary rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${Math.min(100, ((userProfile?.storageUsed || 0) / (userProfile?.storageLimit || 100 * 1024 * 1024)) * 100)}%` 
                          }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions list */}
                  <div className="pt-2.5 border-t border-stone-border space-y-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-stone-text-secondary hover:text-red-600 rounded-lg hover:bg-stone-secondary transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Logout Session
                    </button>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </header>
  );
}
