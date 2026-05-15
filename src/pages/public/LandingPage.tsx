import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Ticket, MapPin, Video, Mic, Recycle, Globe, 
  Store, Gift, CheckCircle2, BookOpen, RefreshCw, 
  Calendar, ArrowRight 
} from 'lucide-react';
import PartnersSection from '../../components/ui/PartnersSection';

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    // Kita tambahkan id="partners" ke dalam pencarian observer otomatis
    const sections = document.querySelectorAll('section[id], div[id="partners"]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, {
      root: null,
      rootMargin: '-30% 0px -30% 0px', 
      threshold: 0
    });

    sections.forEach((section) => observer.observe(section));
    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-1000 relative bg-[#FDFDFD]">
      
      {/* Dot Navigation (Melayang di sisi kanan tengah) */}
      <div className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-5">
        {[
          { id: 'hero', label: 'Utama' },
          { id: 'partners', label: 'Kolaborator' }, // <-- Ditambahkan di sini
          { id: 'whats-on', label: 'Kegiatan' },
          { id: 'benefits', label: 'Benefit' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className="group relative flex items-center justify-end"
          >
            <span className={`absolute right-8 px-3 py-1.5 bg-white text-stone-700 text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-md border border-stone-100 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-x-2 group-hover:translate-x-0 ${activeSection === item.id ? 'text-ringkai-olive' : ''}`}>
              {item.label}
            </span>
            <div className={`rounded-full transition-all duration-500 shadow-sm border border-white ${activeSection === item.id ? 'w-3 h-10 bg-ringkai-olive' : 'w-3 h-3 bg-stone-300 hover:bg-stone-400'}`} />
          </button>
        ))}
      </div>

      {/* Hero Section */}
      <section id="hero" className="relative pt-20 pb-16 px-6 md:pt-21 md:pb-24 scroll-mt-32 text-center flex flex-col items-center justify-center min-h-[90vh]">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-stone-100 border border-stone-200 text-stone-500 rounded-full text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">
            Sustainable Muslim Living
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-stone-900 leading-[1.05] tracking-tighter">
            Ketika Bumi Bercerita: <br className="hidden md:block" />
            <span className="text-ringkai-olive block mt-2 md:mt-4 font-semibold italic opacity-90">
              Menemukan Arah Peran Manusia Akhir Zaman
            </span>
          </h1>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 pt-4">
            <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-stone-100 w-full sm:w-auto">
              <div className="w-10 h-10 bg-ringkai-olive/10 rounded-xl flex items-center justify-center text-ringkai-olive">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-stone-800 leading-none">Ahad, 14 Juni 2026</p>
                <p className="text-[11px] text-stone-400 mt-1 uppercase tracking-wider">08.00 - 16.00 WIB</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-stone-100 w-full sm:w-auto">
              <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-500">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-stone-800 leading-none">Masjid Salman ITB</p>
                <p className="text-[11px] text-stone-400 mt-1 uppercase tracking-wider">Bandung, Jawa Barat</p>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col items-center gap-5">
            <Link 
              to="/checkout" 
              className="inline-flex items-center gap-3 bg-stone-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-ringkai-olive transition-all duration-300 shadow-lg hover:shadow-ringkai-olive/20 hover:-translate-y-1 group"
            >
              <Ticket className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
              <span>Dapatkan Tiket Presale</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Partner/Kolaborator Section */}
      <div id="partners" className="scroll-mt-26 pt-8 pb-16" >
        <PartnersSection />
      </div>

      {/* What's In Section */}
      <section id="whats-on" className="py-24 bg-stone-50 scroll-mt-4 border-y border-stone-200/60 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-3xl md:text-5xl font-serif text-stone-900">What's in SMILE FEST 2026</h2>
            <p className="text-stone-500 md:text-lg max-w-2xl mx-auto">Eksplorasi ruang kontemplatif dan aksi nyata untuk bumi yang lebih baik.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: Video, title: "Documentary Screening", desc: "Penayangan Film Menolak Punah by @idbaruid." },
              { icon: Mic, title: "Live Podcast & Workshop", desc: "Storytelling bersama praktisi muslim berkelanjutan tentang peran akhir zaman." },
              { icon: Globe, title: "Immersive Corner", desc: "Pameran Instalasi interaktif: Gaza's Point of View & Voices of the Earth." },
              { icon: RefreshCw, title: "Reuse Corner", desc: "Praktik pasar tukar untuk memperpanjang produktivitas barang." },
              { icon: Recycle, title: "Recycling Corner", desc: "Edukasi memilah dan mengolah sisa konsumsi menjadi lebih berkah." },
              { icon: Store, title: "Bazaar & Collab Hub", desc: "Ruang kolaborasi UMKM dan komunitas pendukung lingkungan." },
              { icon: Gift, title: "Kids Corner", desc: "Area edukasi ramah anak untuk menanamkan cinta lingkungan sejak dini." },
              { icon: BookOpen, title: "Books Corner", desc: "Pameran literasi tentang bumi, manusia, dan peranannya." }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm hover:shadow-xl hover:border-ringkai-olive/30 transition-all duration-500 group">
                <div className="w-14 h-14 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-ringkai-olive mb-6 group-hover:bg-ringkai-olive group-hover:text-white transition-all duration-300 shadow-inner">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl mb-3 text-stone-800 leading-tight">{item.title}</h3>
                <p className="text-stone-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ticket Benefits Section */}
      <section id="benefits" className="py-24 px-6 min-h-[80vh] flex scroll-mt-24 flex-col justify-center items-center bg-white">
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-center md:text-left">
            <h2 className="text-4xl md:text-6xl font-serif text-stone-900 leading-none">Ticket<br/><span className="text-ringkai-olive">Benefits.</span></h2>
            <p className="text-stone-500 text-lg leading-relaxed">
              Dukunganmu hari ini adalah investasi untuk ekosistem muslim yang berkelanjutan di masa depan.
            </p>
            <div className="inline-block p-5 bg-stone-50 border border-stone-200 rounded-2xl text-left shadow-sm">
              <p className="text-xs font-bold text-stone-700 flex items-start gap-3 leading-relaxed">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-ringkai-olive" />
                Potongan IDR 20.000 khusus untuk sekolah, universitas, dan komunitas partner dengan Kode Promo.
              </p>
            </div>
          </div>

          <div className="bg-stone-900 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden text-white">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-ringkai-olive/20 rounded-full blur-3xl" />
            <ul className="space-y-6">
              {["Full Access to All Sessions", "Handout + Journaling Book", "Token of Appreciation", "Official E-Certificate"].map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-4 font-medium pb-5 border-b border-white/10 last:border-0 last:pb-0">
                  <CheckCircle2 className="w-5 h-5 text-ringkai-olive" />
                  {benefit}
                </li>
              ))}
            </ul>
            <Link to="/checkout" className="mt-10 w-full flex items-center justify-center gap-2 bg-white text-stone-900 py-4 rounded-xl font-bold hover:bg-ringkai-olive hover:text-white transition-all shadow-lg group">
              Amankan Tiketmu <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}