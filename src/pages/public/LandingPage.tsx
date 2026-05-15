import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, MapPin, Video, Mic, Recycle, Globe, Store, Gift, CheckCircle2 } from 'lucide-react';

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
      rootMargin: '-50% 0px -50% 0px', 
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
          { id: 'whats-on', label: 'Kegiatan' },
          { id: 'benefits', label: 'Benefit' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className="group relative flex items-center justify-end"
            title={item.label}
          >
            <span className={`absolute right-6 px-2 py-1 bg-stone-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${activeSection === item.id ? 'font-semibold' : ''}`}>
              {item.label}
            </span>
            <div className={`w-2.5 rounded-full transition-all duration-300 ${activeSection === item.id ? 'h-8 bg-ringkai-olive' : 'h-2.5 bg-stone-300 hover:bg-stone-400'}`} />
          </button>
        ))}
      </div>

      {/* Hero Section */}
      <section id="hero" className="relative pt-32 pb-24 px-6 md:pt-48 md:pb-32 text-center flex flex-col items-center justify-center min-h-[80vh]">
        <div className="max-w-4xl mx-auto space-y-8">
          <span className="inline-block px-4 py-1.5 bg-stone-100 text-stone-600 rounded-full text-xs md:text-sm font-semibold tracking-[0.2em] uppercase">
            Sustainable Muslim Living
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-ringkai-text leading-tight">
            Ketika Bumi Bercerita: <br className="hidden md:block" />
            <span className="text-ringkai-olive">Menemukan Arah Peran Manusia Akhir Zaman.</span>
          </h1>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
            <div className="inline-flex items-center gap-2 text-stone-600 font-medium bg-white border border-stone-200 px-6 py-3 rounded-full text-sm shadow-sm">
              <MapPin className="w-4 h-4 text-ringkai-olive" />
              <span>Ahad, 14 Juni 2026 — Masjid Salman, ITB</span>
            </div>
          </div>

          <div className="pt-8">
            <Link 
              to="/checkout" 
              className="inline-flex items-center gap-3 bg-ringkai-text text-ringkai-bg px-8 py-4 rounded-2xl font-medium hover:bg-stone-700 transition-all shadow-soft group"
            >
              <Ticket className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
              <span>Dapatkan Tiket Presale</span>
            </Link>
          </div>
        </div>
      </section>

      {/* What's In Section */}
      <section id="whats-on" className="py-24 bg-stone-50 border-y border-stone-200/50 min-h-screen flex items-center">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-serif">What's in SMILE FEST 2026</h2>
            <p className="text-stone-500">Ragam ruang kontemplasi dan aksi nyata yang akan Anda temui.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            
            <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-soft hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-ringkai-olive mb-6 group-hover:scale-110 transition-transform duration-300">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl mb-3">Documentary Screening</h3>
              <p className="text-stone-500 text-sm leading-relaxed">Menyaksikan realita "Menolak Punah" melalui dokumenter eksklusif tentang kondisi semesta hari ini.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-soft hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-ringkai-olive mb-6 group-hover:scale-110 transition-transform duration-300">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl mb-3">Live Podcast & Workshop</h3>
              <p className="text-stone-500 text-sm leading-relaxed">Diskusi interaktif bersama para ahli dan praktisi gaya hidup berkelanjutan dari kacamata Islam.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-soft hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-ringkai-olive mb-6 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl mb-3">Immersive Corners</h3>
              <p className="text-stone-500 text-sm leading-relaxed">Ruang refleksi mendalam: <span className="font-medium text-stone-700">Voices of Gaza, Voices of the Earth,</span> dan <span className="font-medium text-stone-700">Voice of Humanity</span>.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-soft hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-ringkai-olive mb-6 group-hover:scale-110 transition-transform duration-300">
                <Recycle className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl mb-3">Reuse & Recycling Corner</h3>
              <p className="text-stone-500 text-sm leading-relaxed">Membawa dan mengelola sampah dengan bijak, serta mengubah barang tak terpakai menjadi manfaat baru.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-soft hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-ringkai-olive mb-6 group-hover:scale-110 transition-transform duration-300">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl mb-3">Kids Corner</h3>
              <p className="text-stone-500 text-sm leading-relaxed">Area edukasi ramah anak untuk menanamkan nilai-nilai cinta lingkungan sejak usia dini.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-soft hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-ringkai-olive mb-6 group-hover:scale-110 transition-transform duration-300">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl mb-3">Bazaar & Collab Hub</h3>
              <p className="text-stone-500 text-sm leading-relaxed">Dukung UMKM lokal dan temukan produk-produk ramah lingkungan (eco-friendly & ethical).</p>
            </div>

          </div>
        </div>
      </section>

      {/* Ticket Benefits Section */}
      <section id="benefits" className="py-24 px-6 min-h-[80vh] flex flex-col justify-center items-center bg-white">
        <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-8 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-serif">Ticket Benefit.</h2>
            <p className="text-stone-500 text-lg leading-relaxed">
              Dengan mengamankan satu ruang di festival ini, Anda berhak mendapatkan akses penuh ke seluruh ekosistem acara.
            </p>
            <div className="inline-block p-4 bg-ringkai-olive/10 border border-ringkai-olive/20 rounded-2xl text-left">
              <p className="text-sm font-semibold text-ringkai-olive flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                Dapatkan potongan harga IDR 20.000 khusus untuk Mahasiswa & Partner Komunitas menggunakan Kode Promo.
              </p>
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-3xl p-8 shadow-soft">
            <ul className="space-y-6">
              {[
                "Full Access to All Sessions & Activities",
                "Handout + Journaling Book",
                "Token of Appreciation (Extra Gift)",
                "Official E-Certificate"
              ].map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-4 text-stone-700 font-medium pb-6 border-b border-stone-200 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center shrink-0 shadow-sm text-ringkai-text">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  {benefit}
                </li>
              ))}
            </ul>
            <div className="mt-8 pt-8 border-t border-stone-200">
              <Link to="/checkout" className="w-full flex items-center justify-center gap-2 bg-ringkai-text text-white py-4 rounded-xl font-medium hover:bg-stone-800 transition-colors shadow-soft">
                Pilih Gelombang Tiket
              </Link>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}