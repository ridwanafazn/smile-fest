import { Outlet, Link, useLocation } from 'react-router-dom';
import { Ticket, Menu, X, Leaf} from 'lucide-react';
import { useState, useEffect } from 'react'; 
import logoAsli from '../../assets/logo-ringkai.svg';
const InstagramIcon = ({ className }: { className?: string }) => (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" height="20" viewBox="0 0 24 24" fill="none" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
              className={className}
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          );

export default function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  return (
    // Background dasar dibuat sangat terang agar card di dalamnya menonjol
    <div className="min-h-screen flex flex-col bg-[#FDFDFD] text-stone-800 font-sans selection:bg-ringkai-olive/20 selection:text-stone-900">
      
      {/* FLOATING NAVBAR */}
      <header className="fixed top-0 inset-x-0 z-50 pt-4 md:pt-6 px-4 md:px-6 pointer-events-none">
        <div className="max-w-5xl mx-auto pointer-events-auto">
          <div className="bg-white/80 backdrop-blur-xl border border-stone-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-16 md:h-20 rounded-full flex items-center justify-between px-5 md:px-8 transition-all duration-300">
            
            {/* LOGO BRAND */}
            <Link to="/" className="flex items-center gap-2 md:gap-3 group">
              {/* Jika file logo-ringkai.svg sudah ada, hapus div di bawah ini dan gunakan tag img: */}
              {/* <img src={logoAsli} alt="Ringkai Binar" className="h-8 w-auto group-hover:scale-105 transition-transform" /> */}
              
              {/* --- Fallback Logo Ikon (Hapus jika sudah pakai img di atas) --- */}
              <div className="relative w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-ringkai-olive group-hover:bg-ringkai-olive group-hover:text-white transition-all duration-500 shadow-sm border border-stone-200">
                <img src={logoAsli} alt="Ringkai Binar" className="h-9 w-auto group-hover:scale-105 transition-transform drop-shadow-sm" />
              </div>
              {/* --- Batas Fallback --- */}
              
              <span className="font-serif font-bold text-lg md:text-xl tracking-wide text-stone-900 group-hover:text-ringkai-olive transition-colors">
                Ringkai Binar
              </span>
            </Link>

            {/* DEKSTOP MENU */}
            <nav className="hidden md:flex items-center gap-2 lg:gap-4">
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${isActive('/') ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'}`}
              >
                Beranda
              </Link>
              <Link 
                to="/track-ticket" 
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${isActive('/track-ticket') ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'}`}
              >
                Lacak Tiket
              </Link>
              
              <div className="w-px h-6 bg-stone-200 mx-2"></div> {/* Separator vertical */}
              
              <Link 
                to="/checkout" 
                className="flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-full hover:bg-ringkai-olive transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 group"
              >
                <Ticket className="w-4 h-4 group-hover:-rotate-12 transition-transform" />
                <span className="font-semibold text-sm">Dapatkan Tiket</span>
              </Link>
            </nav>

            {/* MOBILE MENU BUTTON */}
            <button 
              className="md:hidden p-2.5 bg-stone-50 rounded-full text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors border border-stone-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        <div className={`md:hidden absolute top-[5rem] left-4 right-4 bg-white/95 backdrop-blur-xl border border-stone-200 shadow-2xl rounded-3xl overflow-hidden transition-all duration-300 transform origin-top pointer-events-auto ${isMobileMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
          <nav className="flex flex-col p-4 gap-2">
            <Link 
              to="/" 
              className={`px-6 py-4 rounded-2xl text-base font-semibold transition-colors ${isActive('/') ? 'bg-stone-100 text-stone-900' : 'text-stone-500 active:bg-stone-50'}`}
            >
              Beranda
            </Link>
            <Link 
              to="/track-ticket" 
              className={`px-6 py-4 rounded-2xl text-base font-semibold transition-colors ${isActive('/track-ticket') ? 'bg-stone-100 text-stone-900' : 'text-stone-500 active:bg-stone-50'}`}
            >
              Lacak Tiket
            </Link>
            <div className="h-px w-full bg-stone-100 my-2"></div>
            <Link 
              to="/checkout" 
              className="flex items-center justify-center gap-2 bg-stone-900 text-white px-6 py-4 rounded-2xl font-semibold mt-1 active:scale-[0.98] transition-transform shadow-md"
            >
              <Ticket className="w-5 h-5" />
              <span>Dapatkan Tiket Sekarang</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      {/* pt-32 agar konten tidak tertutup oleh floating navbar */}
      <main className="flex-grow flex flex-col pt-21 pb-12">
        <Outlet />
      </main>

      {/* FOOTER KONTRAS TINGGI */}
      <footer className="bg-stone-950 text-stone-400 py-16 md:py-24 border-t border-stone-900 mt-20 relative overflow-hidden">
        {/* Dekorasi Glow pada Footer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-px bg-gradient-to-r from-transparent via-ringkai-olive/50 to-transparent"></div>
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-ringkai-olive/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-ringkai-olive mb-6 shadow-inner">
            <Leaf className="w-5 h-5" />
          </div>
          
          <h4 className="text-xl md:text-2xl font-serif text-stone-200 mb-4">SMILE FEST 2026</h4>
          <p className="font-serif italic text-lg md:text-xl text-stone-500 mb-12 max-w-md leading-relaxed">
            "Remembering, Understanding, Actuating."
          </p>
          
          <div className="w-24 h-px bg-stone-800 mb-8"></div>
          
          <p className="text-sm font-medium tracking-wide uppercase">
            <a 
              href="https://www.instagram.com/ringkaibinar.project/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-stone-500 hover:text-ringkai-olive transition-colors mb-6 group"
            >
              <InstagramIcon className="w-5 h-5 transition-transform group-hover:scale-125" />
              <span className="font-small text-sm">ringkaibinar.project</span>
            </a>
            &copy; 2026 <span className="text-stone-300">Ringkai Binar Project</span>. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}