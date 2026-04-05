import React from 'react';
import { HeroSection } from './HeroSection';
import { CarShowroom } from './CarShowroom';
import { PromoBanner } from './PromoBanner';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Clock, MapPin, Phone } from 'lucide-react';

export function PublicHome() {
  return (
    <div className="flex flex-col">
      <HeroSection />

      {/* Promo Banner - between hero and cars */}
      <PromoBanner />

      <CarShowroom />

      {/* CTA Section */}
      <section className="py-24 md:py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-primary text-xs font-black uppercase tracking-[0.3em] mb-4 block">Ready to Drive?</span>
            <h2 className="text-4xl md:text-6xl font-serif font-black tracking-tighter italic text-white leading-tight mb-8">
              Your Perfect <span className="text-primary">Ride</span> is Just a Click Away
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              Whether it's a business trip, a weekend getaway, or a special occasion — we've got the perfect car for you. Browse our curated fleet, book in minutes, and enjoy the road with confidence.
            </p>

            <div className="grid grid-cols-2 gap-6 mb-10">
              {[
                { icon: ShieldCheck, label: 'Insurance Included', desc: 'Drive with peace of mind' },
                { icon: Clock, label: 'Instant Booking', desc: 'Book online in minutes' },
                { icon: MapPin, label: 'Flexible Pickup', desc: 'Multiple locations in Nairobi' },
                { icon: Phone, label: '24/7 Support', desc: 'We\'re always a call away' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-0.5">{item.label}</h4>
                    <p className="text-muted-foreground text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/cars"
                className="px-8 py-4 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl shadow-primary/20 group"
              >
                Browse Fleet
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/contact"
                className="px-8 py-4 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-white/5 transition-all"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-square rounded-[60px] overflow-hidden border border-white/10"
          >
            <img
              src="https://picsum.photos/seed/cta-drive-now/1000/1000"
              alt="Drive with LinkedUp"
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
