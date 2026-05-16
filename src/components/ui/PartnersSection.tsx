export default function PartnersSection() {
  const partners = [
    { name: 'Baik Berisik', logo: '/partners/baik-berisik.png' },
    { name: 'Bumi Kitani ID', logo: '/partners/bumikitani-id.png' },
    { name: 'Eco Deen', logo: '/partners/eco-deen.png' },
    { name: 'Karisma Salman', logo: '/partners/karisma-salman.png' },
    { name: 'Lindungi Hutan', logo: '/partners/lindungi-hutan.png' },
    { name: 'Sadar Lemari', logo: '/partners/sadar-lemari.png' },
    { name: 'Saviorangers', logo: '/partners/saviorangers.png' },
    { name: 'Smart 171', logo: '/partners/smart-171.png' },
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

      <div className="max-w-7xl mx-auto px-6 mb-12 md:mb-16">
        <h4 className="text-center text-xs font-bold uppercase tracking-widest text-stone-400">
          Didukung Penuh Oleh
        </h4>
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
                className="h-18 md:h-20 w-auto object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}