import React from 'react';
import { HeroSection } from './HeroSection';
import { CarShowroom } from './CarShowroom';
import { motion } from 'motion/react';

export function PublicHome() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      
      <CarShowroom />

      {/* Why Choose Us Section */}
      <section className="py-32 px-6 bg-card relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-primary text-xs font-black uppercase tracking-[0.3em] mb-4 block">Our Commitment</span>
            <h2 className="text-4xl md:text-6xl font-serif font-black tracking-tighter italic text-white leading-tight mb-8">
              Redefining the <span className="text-primary">Luxury Rental</span> Experience
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-12">
              We don't just rent cars; we provide gateways to unforgettable memories. Our commitment to excellence is reflected in every vehicle we curate and every interaction we have with our clients.
            </p>
            <div className="grid grid-cols-2 gap-8">
              {[
                { label: 'Premium Fleet', desc: 'Hand-picked luxury vehicles' },
                { label: '24/7 Support', desc: 'Always here for your needs' },
                { label: 'Easy Booking', desc: 'Seamless digital experience' },
                { label: 'Best Rates', desc: 'Luxury at competitive prices' },
              ].map((item, i) => (
                <div key={i}>
                  <h4 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">{item.label}</h4>
                  <p className="text-muted-foreground text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-square rounded-[60px] overflow-hidden border border-white/10"
          >
            <img 
              src="https://picsum.photos/seed/luxury-experience/1000/1000" 
              alt="Experience" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-12 left-12 right-12">
              <div className="p-8 glass rounded-[40px]">
                <p className="text-white font-serif italic text-2xl mb-4 leading-tight">
                  "The best rental experience I've ever had. The car was pristine and the service was impeccable."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">JD</div>
                  <div>
                    <p className="text-white text-xs font-bold uppercase tracking-widest">James Dalton</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest">Premium Client</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
