import { ReactNode } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {

  const triggerScroll = () => {
    // Attempt to locate home scroll anchors
    const element = document.getElementById('playground') || document.querySelector('.scroll-mt-20');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#090D16] text-[#F3F4F6] selection:bg-[#5A60EC]/30 selection:text-white">
      {/* Sticky header navbar */}
      <Navbar onScrollToApp={triggerScroll} />
      
      {/* Dynamic Main Body Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Corporate footer block */}
      <Footer />
    </div>
  );
}
