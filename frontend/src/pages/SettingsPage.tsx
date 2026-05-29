import { useState, useEffect } from 'react';
import { 
  Settings, Sun, Moon, Globe, Mic, 
  HelpCircle
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function SettingsPage() {
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();

  const [lang, setLang] = useState(() => localStorage.getItem('voxnote_lang') || 'en');
  const [quality, setQuality] = useState(() => localStorage.getItem('voxnote_quality') || 'high');
  const [selectedMic, setSelectedMic] = useState(() => localStorage.getItem('voxnote_mic') || 'default');
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);

  // Enumerate input devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then((devices) => {
        const audioInputs = devices.filter((d) => d.kind === 'audioinput');
        setMics(audioInputs);
      })
      .catch((err) => {
        console.warn('Microphone listing not available:', err);
      });
  }, []);

  // Update theme setting
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    showToast(`Theme updated to ${newTheme} mode`, 'success');
  };

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setLang(val);
    localStorage.setItem('voxnote_lang', val);
    showToast(`Language updated successfully`, 'success');
  };

  const handleMicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedMic(val);
    localStorage.setItem('voxnote_mic', val);
    showToast(`Input microphone updated`, 'success');
  };

  const handleQualityChange = (q: string) => {
    setQuality(q);
    localStorage.setItem('voxnote_quality', q);
    showToast(`Transcription quality updated to ${q}`, 'success');
  };

  return (
    <div className="space-y-6 text-left max-w-3xl">
      
      {/* HEADER SECTION */}
      <div className="flex items-center gap-2 border-b border-stone-border pb-3 select-none">
        <Settings className="h-5 w-5 text-brand-primary" />
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">System Settings</h2>
          <p className="text-xs text-stone-text-secondary mt-0.5">
            Configure application preferences, speech models, and hardware inputs.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 space-y-6 relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-primary via-brand-accent to-transparent" />

        {/* 1. Theme Selection */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-stone-text-secondary uppercase tracking-widest block">Appearance</span>
          <div className="grid grid-cols-2 gap-1 bg-stone-secondary border border-stone-border rounded-lg p-0.5 max-w-sm select-none">
            {(['light', 'dark'] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold rounded capitalize cursor-pointer transition-colors ${
                  theme === t
                    ? 'bg-stone-card text-brand-primary shadow-sm border border-stone-border/20'
                    : 'text-stone-text-secondary hover:text-stone-text-primary'
                }`}
              >
                {t === 'light' && <Sun className="h-3.5 w-3.5" />}
                {t === 'dark' && <Moon className="h-3.5 w-3.5" />}
                {t === 'light' ? 'Light Mode' : 'Dark Mode'}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Language Preferences */}
        <div className="space-y-2 max-w-md">
          <label htmlFor="settings-lang" className="text-[10px] font-bold text-stone-text-secondary uppercase tracking-widest block">
            Default Language Model
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-3 h-4 w-4 text-stone-text-secondary pointer-events-none" />
            <select
              id="settings-lang"
              value={lang}
              onChange={handleLangChange}
              className="w-full text-xs text-stone-text-primary bg-stone-card border border-stone-border rounded-xl pl-9 pr-8 py-2.5 focus:border-brand-primary outline-none cursor-pointer appearance-none"
            >
              <option value="en">English (US)</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
              <option value="de">Deutsch (German)</option>
              <option value="ja">日本語 (Japanese)</option>
            </select>
          </div>
        </div>

        {/* 3. Input Microphone */}
        <div className="space-y-2 max-w-md">
          <label htmlFor="settings-mic" className="text-[10px] font-bold text-stone-text-secondary uppercase tracking-widest block">
            Microphone Input Source
          </label>
          <div className="relative">
            <Mic className="absolute left-3 top-3 h-4 w-4 text-stone-text-secondary pointer-events-none" />
            <select
              id="settings-mic"
              value={selectedMic}
              onChange={handleMicChange}
              className="w-full text-xs text-stone-text-primary bg-stone-card border border-stone-border rounded-xl pl-9 pr-8 py-2.5 focus:border-brand-primary outline-none cursor-pointer appearance-none"
            >
              <option value="default">System Default Input</option>
              {mics.map((m) => (
                <option key={m.deviceId} value={m.deviceId}>
                  {m.label || `Microphone ${m.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Quality Presets */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <label className="text-[10px] font-bold text-stone-text-secondary uppercase tracking-widest block">
              Cognitive Processing Preset
            </label>
            <span title="Higher quality presets use deeper neural architectures.">
              <HelpCircle className="h-3 w-3 text-stone-text-secondary cursor-help" />
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-stone-secondary border border-stone-border rounded-lg p-0.5 max-w-sm select-none">
            {['standard', 'high', 'ultra'].map((q) => (
              <button
                key={q}
                onClick={() => handleQualityChange(q)}
                className={`py-2 text-[10px] font-semibold rounded capitalize cursor-pointer transition-colors ${
                  quality === q
                    ? 'bg-stone-card text-brand-primary shadow-sm border border-stone-border/20'
                    : 'text-stone-text-secondary hover:text-stone-text-primary'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
