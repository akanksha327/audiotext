import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, Menu, X } from 'lucide-react';

interface NavbarProps {
  onScrollToApp?: () => void;
}

export default function Navbar({ onScrollToApp }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'GitHub', href: 'https://github.com/akanksha327/audiotext', target: '_blank' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#EADEE0] bg-[#FBF9F9]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo - Burgundy */}
        <a href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#800020] bg-white text-[#800020] transition-colors duration-200">
            <Mic className="h-4 w-4 text-[#800020]" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-[#2C1A1C]">
            SonicScript
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target={link.target}
              rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
              className="text-xs font-medium text-[#5C4E50] hover:text-[#800020] transition-colors duration-200"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Action Button - Burgundy Accent */}
        <div className="hidden md:flex items-center">
          <button 
            onClick={onScrollToApp}
            className="inline-flex items-center justify-center rounded-lg bg-[#800020] hover:bg-[#5A1220] text-xs font-medium text-white px-4 py-2 transition-colors duration-200 cursor-pointer shadow-sm"
          >
            Launch Console
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EADEE0] text-[#5C4E50] hover:text-[#800020] md:hidden transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="border-b border-[#EADEE0] bg-[#FBF9F9] md:hidden"
          >
            <div className="space-y-1 px-4 py-4 sm:px-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target={link.target}
                  rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-xs font-medium text-[#5C4E50] hover:bg-[#F3EFEF] hover:text-[#2C1A1C] transition-all"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-3 border-t border-[#EADEE0] mt-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onScrollToApp) onScrollToApp();
                  }}
                  className="w-full inline-flex items-center justify-center rounded-lg bg-[#800020] hover:bg-[#5A1220] py-2 text-xs font-medium text-white transition-colors"
                >
                  Launch Console
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
