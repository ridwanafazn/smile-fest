export default function PartnersSection() {
  // Ganti src dengan link atau path logo aslinya nanti
  const partners = [
    { name: 'Ringkai Binar', logo: 'https://via.placeholder.com/150x50/f5f5f4/a8a29e?text=RINGKAI+BINAR' },
    { name: 'Salman ITB', logo: 'https://via.placeholder.com/150x50/f5f5f4/a8a29e?text=SALMAN+ITB' },
    { name: 'Sponsor 3', logo: 'https://via.placeholder.com/150x50/f5f5f4/a8a29e?text=SPONSOR+3' },
    { name: 'Sponsor 4', logo: 'https://via.placeholder.com/150x50/f5f5f4/a8a29e?text=SPONSOR+4' },
    { name: 'Sponsor 5', logo: 'https://via.placeholder.com/150x50/f5f5f4/a8a29e?text=SPONSOR+5' },
    { name: 'Sponsor 6', logo: 'https://via.placeholder.com/150x50/f5f5f4/a8a29e?text=SPONSOR+6' },
  ];

  const duplicatedPartners = [...partners, ...partners];

  return (
    <section id="partners" className="py-10 bg-white border-b border-stone-100 overflow-hidden relative z-10">
      <style>
        {`
          @keyframes scroll-ltr {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          .animate-marquee-ltr {
            /* Ubah 30s menjadi lebih besar jika ingin lebih lambat */
            animation: scroll-ltr 30s linear infinite; 
          }
          .pause-on-hover:hover .animate-marquee-ltr {
            animation-play-state: paused;
          }
        `}
      </style>

      <div className="max-w-7xl mx-auto px-6 mb-6">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-stone-400">
          Didukung Penuh Oleh
        </p>
      </div>

      <div className="relative w-full pause-on-hover flex">
        {/* Gradient tepi (kiri & kanan) agar smooth */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

        <div className="flex w-max animate-marquee-ltr items-center">
          {duplicatedPartners.map((partner, index) => (
            <div 
              key={index} 
              className="px-8 md:px-12 flex-shrink-0 transition-all duration-300 filter grayscale opacity-60 hover:grayscale-0 hover:opacity-100 cursor-pointer"
            >
              <img 
                src={partner.logo} 
                alt={partner.name} 
                className="h-10 md:h-12 w-auto object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}