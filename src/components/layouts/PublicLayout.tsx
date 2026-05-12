import { Outlet, Link, useLocation } from 'react-router-dom';
import { Ticket, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react'; // PERBAIKAN: Import useEffect

export default function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // PERBAIKAN TS: Menggunakan useEffect, bukan useState
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-ringkai-bg text-ringkai-text font-sans">
      <header className="sticky top-0 z-50 bg-ringkai-bg/80 backdrop-blur-md border-b border-stone-200/50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-ringkai-olive flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105">
              <span className="font-serif font-medium text-lg leading-none mt-0.5">R</span>
            </div>
            <span className="font-serif font-medium text-xl tracking-wide">Ringkai Binar</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link to="/" className="text-stone-500 hover:text-ringkai-text transition-colors">Beranda</Link>
            <Link to="/track-ticket" className="text-stone-500 hover:text-ringkai-text transition-colors">Lacak Tiket</Link>
            <Link 
              to="/checkout" 
              className="flex items-center gap-2 bg-ringkai-text text-ringkai-bg px-5 py-2.5 rounded-xl hover:bg-stone-700 transition-colors shadow-soft"
            >
              <Ticket className="w-4 h-4" />
              <span>Dapatkan Tiket</span>
            </Link>
          </nav>

          <button 
            className="md:hidden p-2 text-stone-500 hover:text-ringkai-text"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <nav className="md:hidden border-t border-stone-200/50 bg-ringkai-bg px-6 py-4 flex flex-col gap-4 shadow-soft">
            <Link to="/" className="py-2 text-stone-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Beranda</Link>
            <Link to="/track-ticket" className="py-2 text-stone-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Lacak Tiket</Link>
            <Link 
              to="/checkout" 
              className="flex items-center justify-center gap-2 bg-ringkai-text text-ringkai-bg p-3 rounded-xl font-medium mt-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Ticket className="w-4 h-4" />
              <span>Dapatkan Tiket</span>
            </Link>
          </nav>
        )}
      </header>

      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>

      <footer className="border-t border-stone-200/50 py-12 mt-20">
        <div className="max-w-5xl mx-auto px-6 text-center text-stone-400 text-sm">
          <p className="font-serif italic mb-2">"Remembering, Understanding, Actuating."</p>
          <p>&copy; 2026 SMILE FEST. Sustainable Muslim Living.</p>
        </div>
      </footer>
    </div>
  );
}