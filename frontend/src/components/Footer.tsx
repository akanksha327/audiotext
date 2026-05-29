import { Mic, Github, Twitter, MessageSquare } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-stone-border bg-stone-bg py-12 text-sm text-stone-text-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary/10 border border-brand-primary/20">
                <Mic className="h-4 w-4 text-brand-primary" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-stone-text-primary">SonicScript</span>
            </div>
            <p className="max-w-xs text-xs leading-relaxed">
              Secure, premium speech-to-text platform transcribing audio instantly inside modern browsers.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-text-primary">Product</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-brand-primary transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">System Status</a></li>
            </ul>
          </div>

          {/* Developer Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-text-primary">Developer</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-brand-primary transition-colors">API References</a></li>
              <li><a href="https://github.com/akanksha327/audiotext" target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary transition-colors">GitHub Repository</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">SDK Toolkits</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Sample Snippets</a></li>
            </ul>
          </div>

          {/* Socials & Community */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-text-primary">Connect</h4>
            <div className="flex items-center gap-4">
              <a href="https://github.com/akanksha327/audiotext" target="_blank" rel="noopener noreferrer" className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-border hover:border-brand-primary text-stone-text-secondary hover:text-brand-primary transition-all" aria-label="GitHub">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-border hover:border-brand-primary text-stone-text-secondary hover:text-brand-primary transition-all" aria-label="Twitter">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-border hover:border-brand-primary text-stone-text-secondary hover:text-brand-primary transition-all" aria-label="Discord">
                <MessageSquare className="h-4 w-4" />
              </a>
            </div>
            <p className="text-[10px] leading-relaxed pt-2">
              Designed with care in a refined minimal aesthetic.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-stone-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} SonicScript Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-brand-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
