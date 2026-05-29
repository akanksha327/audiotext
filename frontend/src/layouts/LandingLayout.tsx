import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function LandingLayout() {
  const triggerScroll = () => {
    // Landing pages will redirect or scroll to elements
    const playground = document.getElementById('hero-main');
    if (playground) playground.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-bg bg-grid-pattern text-stone-text-primary selection:bg-brand-primary/20 selection:text-white">
      {/* Sticky header navbar */}
      <Navbar onScrollToApp={triggerScroll} />
      
      {/* Landing content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
