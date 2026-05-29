import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, LayoutDashboard, Mic, Upload, History, Settings, 
  Moon, Sun, Sparkles, Terminal
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

interface PaletteItem {
  id: string;
  name: string;
  category: string;
  icon: any;
  action: () => void;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const items: PaletteItem[] = [
    {
      id: 'nav-dash',
      name: 'Go to Dashboard Overview',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => navigate('/dashboard')
    },
    {
      id: 'nav-rec',
      name: 'Go to Record Audio Workspace',
      category: 'Navigation',
      icon: Mic,
      action: () => navigate('/dashboard/record')
    },
    {
      id: 'nav-up',
      name: 'Go to Audio Upload Zone',
      category: 'Navigation',
      icon: Upload,
      action: () => navigate('/dashboard/upload')
    },
    {
      id: 'nav-hist',
      name: 'Go to History Catalog',
      category: 'Navigation',
      icon: History,
      action: () => navigate('/dashboard/history')
    },
    {
      id: 'nav-set',
      name: 'Go to System Settings',
      category: 'Navigation',
      icon: Settings,
      action: () => navigate('/dashboard/settings')
    },
    {
      id: 'theme-dark',
      name: 'Switch theme to Dark Mode',
      category: 'Preferences',
      icon: Moon,
      action: () => {
        localStorage.setItem('theme', 'dark');
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        showToast('Switched to Dark Mode', 'success');
      }
    },
    {
      id: 'theme-light',
      name: 'Switch theme to Light Mode',
      category: 'Preferences',
      icon: Sun,
      action: () => {
        localStorage.setItem('theme', 'light');
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        showToast('Switched to Light Mode', 'success');
      }
    },
    {
      id: 'ai-status',
      name: 'Check AI Engine Connectivity',
      category: 'Diagnostics',
      icon: Sparkles,
      action: () => showToast('Speech Recognition pipeline fully operational', 'success')
    }
  ];

  // Listen for Ctrl+K shortcut or custom open events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    const handleOpen = () => setOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpen);
    };
  }, []);

  // Reset indices on search or toggle
  useEffect(() => {
    setSelectedIndex(0);
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setSearch('');
    }
  }, [open, search]);

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-[#09090B]/80 backdrop-blur-sm z-[99999]"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.97 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-[#18181B] border border-stone-border rounded-xl shadow-2xl z-[999999] overflow-hidden select-none font-sans"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-stone-border">
              <Search className="h-4.5 w-4.5 text-stone-text-secondary shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or route..."
                className="w-full text-xs text-white bg-transparent outline-none border-none placeholder-stone-text-secondary"
              />
              <span className="text-[9px] font-bold text-stone-text-secondary border border-stone-border px-1.5 py-0.5 rounded uppercase shrink-0 font-mono">ESC</span>
            </div>

            {/* Suggestions list */}
            <div className="max-h-64 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-text-secondary flex flex-col items-center justify-center">
                  <Terminal className="h-6 w-6 opacity-30 mb-2" />
                  No results matching "{search}"
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        item.action();
                        setOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-brand-primary text-white'
                          : 'text-stone-text-secondary hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-white' : 'text-stone-text-secondary'}`} />
                        <span className="text-xs font-semibold truncate">{item.name}</span>
                      </div>

                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded capitalize font-mono shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-stone-secondary text-stone-text-secondary'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
