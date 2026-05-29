import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Mic, Upload, History, Settings, 
  Menu, X, ChevronLeft, ChevronRight, Search, 
  Bell, Sun, Moon, LogOut
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { userService, UserData } from '../services/api.js';

interface SidebarItem {
  name: string;
  path: string;
  icon: any;
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Record Audio', path: '/dashboard/record', icon: Mic },
  { name: 'Upload Audio', path: '/dashboard/upload', icon: Upload },
  { name: 'History Catalog', path: '/dashboard/history', icon: History },
  { name: 'System Settings', path: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserData | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'dark'
  );
  
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Load profile metrics
  useEffect(() => {
    userService.getProfile()
      .then(setUserProfile)
      .catch((err) => console.warn('Could not load profile:', err));
  }, [location.pathname]); // Reload stats on page navigation to stay updated

  // Theme application
  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem('theme', theme);
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(systemDark);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  const handleLogout = () => {
    showToast('Logged out successfully', 'info');
    setTimeout(() => {
      navigate('/');
    }, 800);
  };

  const getPageTitle = () => {
    const active = sidebarItems.find(item => item.path === location.pathname);
    return active ? active.name : 'VoxNote Workspace';
  };

  return (
    <div className="flex h-screen bg-stone-bg bg-dot-pattern text-stone-text-primary overflow-hidden font-sans">
      
      {/* BACKGROUND GRAPHICS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 opacity-40 dark:opacity-100">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-brand-accent/5 blur-[120px]" />
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-stone-secondary border-r border-stone-border p-5 z-50 flex flex-col justify-between lg:hidden"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-stone-border">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-brand-primary flex items-center justify-center text-white">
                      <Mic className="h-4.5 w-4.5" />
                    </div>
                    <span className="font-bold tracking-tight text-sm">VoxNote Dashboard</span>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg border border-stone-border text-stone-text-secondary">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <nav className="mt-8 space-y-1">
                  {sidebarItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all relative ${
                          isActive
                            ? 'text-white bg-brand-primary'
                            : 'text-stone-text-secondary hover:text-stone-text-primary hover:bg-stone-card'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-stone-border pt-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 w-full text-left text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <motion.aside
        animate={{ width: collapsed ? '4.5rem' : '16rem' }}
        className="hidden lg:flex flex-col justify-between h-full bg-stone-secondary/40 backdrop-blur-md border-r border-stone-border relative z-30 shrink-0"
      >
        <div>
          {/* Logo Section */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-stone-border">
            <Link to="/dashboard" className="flex items-center gap-2 truncate">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                <Mic className="h-4 w-4" />
              </div>
              {!collapsed && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-bold tracking-tight text-xs bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent"
                >
                  VoxNote
                </motion.span>
              )}
            </Link>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-lg hover:bg-stone-card border border-stone-border/40 text-stone-text-secondary hover:text-stone-text-primary cursor-pointer transition-colors"
            >
              {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 relative group cursor-pointer ${
                    isActive
                      ? 'text-white'
                      : 'text-stone-text-secondary hover:text-stone-text-primary'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute inset-0 bg-brand-primary rounded-lg -z-10 shadow-lg shadow-brand-primary/20"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={`h-4 w-4 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {item.name}
                    </motion.span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Account bottom widget */}
        <div className="p-3 border-t border-stone-border">
          {collapsed ? (
            <button
              onClick={handleLogout}
              className="h-10 w-full flex items-center justify-center rounded-lg hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <div className="h-7 w-7 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {userProfile?.avatar || 'VN'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-stone-text-primary truncate">{userProfile?.name || 'Sandbox User'}</p>
                  <p className="text-[9px] text-stone-text-secondary truncate">{userProfile?.email || 'user@voxnote.ai'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="h-3 w-3" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </motion.aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* TOP NAVBAR */}
        <header className="h-16 border-b border-stone-border bg-stone-secondary/20 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 relative z-20">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-stone-border text-stone-text-secondary hover:text-stone-text-primary bg-stone-card"
            >
              <Menu className="h-4 w-4" />
            </button>
            <h1 className="text-xs font-bold text-stone-text-secondary uppercase tracking-wider flex items-center gap-2 select-none">
              <span>{getPageTitle()}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Command Palette Trigger (Shows Shortcut badge) */}
            <button
              onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
              className="hidden sm:inline-flex items-center gap-2 border border-stone-border bg-stone-card px-3 py-1.5 rounded-lg text-[10px] font-semibold text-stone-text-secondary hover:text-stone-text-primary hover:border-brand-primary transition-all cursor-pointer shadow-sm select-none"
            >
              <Search className="h-3.5 w-3.5 text-stone-text-secondary" />
              <span>Search Action</span>
              <kbd className="bg-stone-secondary border border-stone-border px-1.5 py-0.5 rounded text-[8px] font-mono leading-none">Ctrl+K</kbd>
            </button>

            {/* Quick Theme Switcher */}
            <div className="flex items-center bg-stone-secondary border border-stone-border rounded-lg p-0.5 select-none">
              {(['dark', 'light'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    theme === t
                      ? 'bg-stone-card text-brand-primary shadow-sm'
                      : 'text-stone-text-secondary hover:text-stone-text-primary'
                  }`}
                  title={`Switch to ${t} mode`}
                >
                  {t === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>

            {/* Notification Badge */}
            <button 
              onClick={() => showToast('AI processing systems operational', 'info')}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-border text-stone-text-secondary hover:text-stone-text-primary bg-stone-card cursor-pointer shadow-sm"
            >
              <Bell className="h-4 w-4 animate-pulse text-brand-primary" />
            </button>
          </div>
        </header>

        {/* WORKSPACE CONTENT SCROLL */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
