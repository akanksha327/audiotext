import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Menu, X } from 'lucide-react';

interface NavbarProps {
  onScrollToApp?: () => void;
}

export default function Navbar({ onScrollToApp }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'API Docs', href: '#' },
    { name: 'Pricing', href: '#' },
    { name: 'Github', href: 'https://github.com/akanksha327/audiotext', target: '_blank' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.05] bg-dark-bg/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-indigo/10 border border-brand-indigo/20 group-hover:border-brand-indigo/40 transition-all duration-300">
            <Mic className="h-5 w-5 text-brand-indigo group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white group-hover:text-brand-indigo transition-colors duration-200">
            SonicScript
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20">
            Beta
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target={link.target}
              rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
              className="text-sm font-medium text-text-secondary hover:text-white transition-colors duration-200"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={onScrollToApp}
            className="relative inline-flex items-center gap-2 rounded-xl bg-brand-indigo px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-brand-indigo-hover active:scale-95 shadow-md shadow-brand-indigo/10 hover:shadow-brand-indigo/20"
          >
            Launch Transcriber
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] hover:bg-white/[0.04] text-text-secondary hover:text-white md:hidden transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-white/[0.05] bg-dark-bg/95 md:hidden"
          >
            <div className="space-y-1 px-4 py-4 sm:px-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target={link.target}
                  rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-base font-medium text-text-secondary hover:bg-white/[0.03] hover:text-white transition-all"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 border-t border-white/[0.05] mt-4">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onScrollToApp) onScrollToApp();
                  }}
                  className="w-full inline-flex items-center justify-center rounded-xl bg-brand-indigo px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-indigo-hover transition-colors"
                >
                  Launch Transcriber
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
