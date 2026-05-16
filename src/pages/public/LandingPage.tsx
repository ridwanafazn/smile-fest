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
    <div className="flex flex-col animate-in fade-in duration-1000 relative bg-[#FDFDFD] overflow-hidden">
      
      {/* Dot Navigation (Melayang di sisi kanan tengah) */}
      <div className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-5">
        {[
          { id: 'hero', label: 'Utama' },
          { id: 'partners', label: 'Kolaborator' },
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
            <div className={`rounded-full transition-all duration-500 shadow-sm border border-white ${activeSection === item.id ? 'w-3 h-6 bg-ringkai-olive' : 'w-3 h-3 bg-stone-300 hover:bg-stone-400'}`} />
          </button>
        ))}
      </div>

      {/* --- HERO SECTION --- */}
      <section id="hero" className="relative pt-20 pb-16 px-6 md:pt-21 md:pb-24 scroll-mt-32 text-center flex flex-col items-center justify-center min-h-[90vh]">
        
        {/* Ornamen Latar Belakang Hero */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Grid Kertas Milimeter (Blueprint Style) */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />
          {/* Cahaya Pendar (Ambient Blur) */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-ringkai-olive/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 left-1/4 w-72 h-72 bg-stone-200/60 rounded-full blur-[80px]" />
        </div>

        {/* Konten Hero */}
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-stone-200 text-stone-500 rounded-full text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-ringkai-olive animate-pulse"></span>
            Sustainable Muslim Living
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-stone-900 leading-[1.05] tracking-tighter drop-shadow-sm">
            Ketika Bumi Bercerita: <br className="hidden md:block" />
            <span className="text-ringkai-olive block mt-2 md:mt-4 font-semibold italic opacity-90">
              Menemukan Arah Peran Manusia Akhir Zaman
            </span>
          </h1>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 pt-4">
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow-sm border border-stone-200 w-full sm:w-auto hover:bg-white hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-ringkai-olive/10 rounded-xl flex items-center justify-center text-ringkai-olive">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-stone-800 leading-none">Ahad, 14 Juni 2026</p>
                <p className="text-[11px] text-stone-400 mt-1 uppercase tracking-wider">08.00 - 16.00 WIB</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow-sm border border-stone-200 w-full sm:w-auto hover:bg-white hover:shadow-md transition-all">
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
              className="inline-flex items-center gap-3 bg-stone-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-ringkai-olive transition-all duration-300 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.3)] hover:shadow-ringkai-olive/30 hover:-translate-y-1 group"
            >
              <Ticket className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
              <span>Dapatkan Tiket Presale</span>
            </Link>
          </div>
        </div>
      </section>

      {/* --- PARTNERS SECTION --- */}
      <div id="partners" className="relative scroll-mt-26 pt-8 pb-16 bg-white border-t border-stone-100 z-10" >
        <PartnersSection />
      </div>

      {/* --- WHAT'S ON SECTION --- */}
      <section id="whats-on" className="relative py-24 bg-stone-50 scroll-mt-4 border-y border-stone-200/80 min-h-screen flex items-center overflow-hidden">
        
        {/* Pola Titik (Dotted Pattern) */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
           <div className="absolute inset-0 bg-[radial-gradient(#d6d3d1_2px,transparent_2px)] [background-size:24px_24px]" />
           {/* Masking gradien agar polanya memudar di tengah dan kuat di pinggir */}
           <div className="absolute inset-0 bg-stone-50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,#000_100%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
          <div className="text-center mb-20 space-y-4">
            <div className="inline-block mb-2">
              <span className="px-3 py-1 bg-white border border-stone-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-stone-400 shadow-sm">
                Rangkaian Acara
              </span>
            </div>
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
              <div key={idx} className="bg-white/90 backdrop-blur-sm p-8 rounded-[2rem] border border-stone-200 shadow-sm hover:shadow-xl hover:border-ringkai-olive/40 hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                {/* Aksen sudut kotak */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-ringkai-olive/5 rounded-bl-full transition-transform group-hover:scale-150" />
                
                <div className="w-14 h-14 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-ringkai-olive mb-6 group-hover:bg-ringkai-olive group-hover:text-white transition-all duration-300 shadow-inner relative z-10">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl mb-3 text-stone-800 leading-tight relative z-10">{item.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TICKET BENEFITS SECTION --- */}
      <section id="benefits" className="relative py-24 px-6 min-h-[80vh] flex scroll-mt-24 flex-col justify-center items-center bg-white overflow-hidden z-10">
        
        {/* Background ambient blobs untuk memberi tekstur pada area polos */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -left-20 top-1/4 w-[500px] h-[500px] bg-stone-100 rounded-full mix-blend-multiply blur-[120px] opacity-70" />
          <div className="absolute right-0 bottom-0 w-[600px] h-[600px] bg-ringkai-olive/5 rounded-full mix-blend-multiply blur-[120px] opacity-80" />
        </div>

        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8 text-center md:text-left">
            <h2 className="text-4xl md:text-6xl font-serif text-stone-900 leading-none drop-shadow-sm">Ticket<br/><span className="text-ringkai-olive">Benefits.</span></h2>
            <p className="text-stone-500 text-lg leading-relaxed">
              Dukunganmu hari ini adalah investasi untuk ekosistem muslim yang berkelanjutan di masa depan.
            </p>
            <div className="inline-block p-6 bg-white border border-stone-200 rounded-2xl text-left shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-ringkai-olive" />
              <p className="text-xs font-bold text-stone-700 flex items-start gap-3 leading-relaxed">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-ringkai-olive" />
                Potongan IDR 20.000 khusus untuk sekolah, universitas, dan komunitas partner dengan Kode Promo.
              </p>
            </div>
          </div>

          {/* Kartu Gelap */}
          <div className="bg-stone-900 border border-stone-800 rounded-[2.5rem] p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden text-white group">
            {/* Ornamen Mesh Gradient dalam kartu */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-ringkai-olive/30 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-stone-700/40 rounded-full blur-[60px]" />
            
            <ul className="space-y-6 relative z-10">
              {["Full Access to All Sessions", "Handout + Journaling Book", "Token of Appreciation", "Official E-Certificate"].map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-4 font-medium pb-5 border-b border-white/10 last:border-0 last:pb-0">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-ringkai-olive" />
                  </div>
                  {benefit}
                </li>
              ))}
            </ul>
            
            <Link to="/checkout" className="relative z-10 mt-10 w-full flex items-center justify-center gap-2 bg-white text-stone-900 py-4.5 rounded-xl font-bold hover:bg-ringkai-olive hover:text-white transition-all duration-300 shadow-xl group/btn overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                Amankan Tiketmu <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}