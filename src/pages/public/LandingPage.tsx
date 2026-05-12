import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Leaf, BookOpen, CigaretteOff, MapPin } from 'lucide-react';

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    // Scrollspy Logic menggunakan Intersection Observer
    const sections = document.querySelectorAll('section[id]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, {
      root: null,
      rootMargin: '-50% 0px -50% 0px', // Aktif ketika section tepat di tengah layar
      threshold: 0
    });

    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        observer.unobserve(section);
      });
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-1000 relative">
      
      {/* Dot Navigation (Scrollspy) */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-4">
        {[
          { id: 'hero', label: 'Utama' },
          { id: 'journey', label: 'Alur' },
          { id: 'puncak', label: 'Puncak' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className="group relative flex items-center justify-end"
            title={item.label}
          >
            {/* Tooltip text */}
            <span className={`absolute right-6 px-2 py-1 bg-stone-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${activeSection === item.id ? 'font-semibold' : ''}`}>
              {item.label}
            </span>
            {/* Dot */}
            <div className={`w-2.5 rounded-full transition-all duration-300 ${activeSection === item.id ? 'h-8 bg-ringkai-olive' : 'h-2.5 bg-stone-300 hover:bg-stone-400'}`} />
          </button>
        ))}
      </div>

      {/* Hero Section */}
      <section id="hero" className="relative pt-32 pb-24 px-6 md:pt-48 md:pb-32 text-center flex flex-col items-center justify-center min-h-[80vh]">
        <div className="max-w-3xl mx-auto space-y-8">
          <span className="text-ringkai-olive font-semibold tracking-[0.3em] uppercase text-xs md:text-sm">
            Sebuah Pergerakan Kolektif
          </span>
          <h1 className="text-5xl md:text-7xl font-serif text-ringkai-text leading-tight">
            Sustainable <br className="hidden md:block" /> Muslim Living.
          </h1>
          <p className="text-lg md:text-xl text-stone-500 font-sans max-w-2xl mx-auto leading-relaxed">
            SMILE FEST 2026 bukan sekadar festival hiburan. Ini adalah ruang jeda untuk mengingat kembali masalah, memahami peran, dan melakukan aksi nyata.
          </p>
          <div className="pt-8">
            <Link 
              to="/checkout" 
              className="inline-flex items-center gap-3 bg-ringkai-text text-ringkai-bg px-8 py-4 rounded-xl font-medium hover:bg-stone-700 transition-all shadow-soft group"
            >
              <Ticket className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
              <span>Amankan Ruangmu</span>
            </Link>
          </div>
        </div>
      </section>

      {/* The Journey Section */}
      <section id="journey" className="py-24 bg-white border-y border-stone-200/50 min-h-screen flex items-center">
        <div className="max-w-5xl mx-auto px-6 w-full">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-serif">Alur Kesadaran</h2>
            <p className="text-stone-500">Rangkaian perjalanan sebelum menuju puncak acara.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Pre-event 1 */}
            <div className="space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-ringkai-olive group-hover:scale-110 transition-transform duration-300 shadow-soft">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl">Bening Saguling</h3>
              <p className="text-xs font-semibold text-stone-400 tracking-widest uppercase">3 Mei 2026</p>
              <p className="text-stone-500 text-sm leading-relaxed">Eco-journey, river clean-up, dan penanaman pohon. Aksi nyata merawat titipan bumi (Actuating).</p>
            </div>

            {/* Pre-event 2 */}
            <div className="space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-ringkai-olive group-hover:scale-110 transition-transform duration-300 shadow-soft">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl">Hari Buku</h3>
              <p className="text-xs font-semibold text-stone-400 tracking-widest uppercase">17 Mei 2026</p>
              <p className="text-stone-500 text-sm leading-relaxed">Membangun budaya literasi dan refleksi mendalam untuk melawan overkonsumsi dan brainrot (Understanding).</p>
            </div>

            {/* Pre-event 3 */}
            <div className="space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-ringkai-olive group-hover:scale-110 transition-transform duration-300 shadow-soft">
                <CigaretteOff className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl">Hari Anti Tembakau</h3>
              <p className="text-xs font-semibold text-stone-400 tracking-widest uppercase">30-31 Mei 2026</p>
              <p className="text-stone-500 text-sm leading-relaxed">Eksperimen sosial penukaran rokok. Membangun kesadaran tubuh dan melepaskan kebiasaan destruktif (Remembering).</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Event Section */}
      <section id="puncak" className="py-24 px-6 text-center min-h-[80vh] flex flex-col justify-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-serif">Puncak Refleksi.</h2>
          <div className="inline-flex items-center gap-2 text-stone-500 font-medium bg-stone-100 px-4 py-2 rounded-full text-sm">
            <MapPin className="w-4 h-4" />
            <span>7 Juni 2026 — GSG Salman ITB</span>
          </div>
          <p className="text-stone-500 text-lg leading-relaxed">
            Seminar, tenant keberlanjutan, dan ruang pameran kontemplatif (Immersive Spots): Palestine Spot, Self Reflection Spot, hingga area Human Waste.
          </p>
        </div>
      </section>
    </div>
  );
}