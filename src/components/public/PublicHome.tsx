import React from 'react';
import { Helmet } from 'react-helmet-async';
import { HeroSection } from './HeroSection';
import { CarShowroom } from './CarShowroom';
import { PromoBanner } from './PromoBanner';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Clock, MapPin, Phone } from 'lucide-react';
import { usePublicImagesFinal } from '../../hooks/usePublicImagesFinal';
import { logger } from '../../utils/logger';

export function PublicHome() {
  const { images, loading } = usePublicImagesFinal();

  // Only show image if it exists from Supabase or localStorage cache
  // No fallback image - will show loading state instead
  const ctaImage = images.homepage_cta_image;
  const showImage = !loading && ctaImage;

  logger.log('PublicHome - Image loaded');

  return (
    <>
      <Helmet>
        <title>LinkedUp Cars Rentals | Car Hire, Chauffeur & Airport Transfers Nairobi</title>
        <meta name="description" content="Book a car online in Nairobi — self-drive, chauffeur, staff transport, corporate bus hire, JKIA airport transfers, game drive hires and high profile transfers. Instant confirmation." />
        <link rel="canonical" href="https://linkedupcarsrentals.com/" />
        <meta property="og:title" content="LinkedUp Cars Rentals | Car Hire Nairobi" />
        <meta property="og:url" content="https://linkedupcarsrentals.com/" />
        <meta property="og:description" content="Nairobi's premier car hire — self-drive, chauffeur, JKIA transfers, staff transport and corporate buses. Book instantly online." />
      </Helmet>
      <div className="flex flex-col">
      <HeroSection />

      {/* Promo Banner - between hero and cars */}
      <PromoBanner />

      <CarShowroom />

      {/* CTA Section */}
      <section className="py-24 md:py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-primary text-xs font-black uppercase tracking-[0.3em] mb-4 block">Ready to Drive?</span>
            <h2 className="text-4xl md:text-6xl font-serif font-black tracking-tighter italic text-foreground leading-tight mb-8">
              Your Perfect <span className="text-primary">Ride</span> is Just Three Steps Away
            </h2>

            {/* 4-Step Journey Display */}
            <div className="mb-10">
              {/* Desktop: Flex row with connectors */}
              <div className="hidden lg:flex flex-row items-center gap-2 flex-wrap">
                {[
                  { number: 'Step 1', label: 'Browse & Choose' },
                  { number: 'Step 2', label: 'Book Online' },
                  { number: 'Step 3', label: 'Pick Up & Drive' },
                  { number: '', label: 'Return & Review' }
                ].map((step, i) => (
                  <React.Fragment key={i}>
                    <div
                      className={`rounded-2xl px-4 py-3 bg-white/5 border border-orange-500/30 transition-all duration-300 hover:shadow-[0_0_28px_rgba(255,140,0,0.45)] hover:border-orange-400/60 cursor-pointer ${
                        i === 3 ? 'w-full max-w-[200px]' : ''
                      }`}
                    >
                      {step.number && (
                        <div className="text-orange-500 font-black text-xs tracking-widest uppercase mb-1">
                          {step.number}
                        </div>
                      )}
                      <div className="text-white font-serif italic font-semibold text-sm">
                        {step.label}
                      </div>
                    </div>
                    {i < 3 && (
                      <div className="w-8 h-0.5 relative overflow-hidden">
                        <div 
                          className="absolute inset-0"
                          style={{
                            background: 'linear-gradient(90deg, transparent, rgba(255,140,0,0.9), transparent)',
                            animation: 'shimmer 1.8s ease-in-out infinite'
                          }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Mobile: 2x2 grid without connectors */}
              <div className="lg:hidden grid grid-cols-2 gap-3">
                {[
                  { number: 'Step 1', label: 'Browse & Choose' },
                  { number: 'Step 2', label: 'Book Online' },
                  { number: 'Step 3', label: 'Pick Up & Drive' },
                  { number: '', label: 'Return & Review' }
                ].map((step, i) => (
                  <div
                    key={i}
                    className="rounded-2xl px-4 py-3 bg-white/5 border border-orange-500/30 transition-all duration-300 hover:shadow-[0_0_28px_rgba(255,140,0,0.45)] hover:border-orange-400/60 cursor-pointer"
                  >
                    {step.number && (
                      <div className="text-orange-500 font-black text-xs tracking-widest uppercase mb-1">
                        {step.number}
                      </div>
                    )}
                    <div className="text-white font-serif italic font-semibold text-sm">
                      {step.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shimmer animation keyframes */}
            <style>{`
              @keyframes shimmer {
                0%, 100% { transform: translateX(-100%) }
                50% { transform: translateX(100%) }
              }
            `}</style>

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
                className="px-8 py-4 border border-border text-foreground rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-card/50 transition-all"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-[4/3] sm:aspect-square lg:aspect-[3/2] rounded-[20px] sm:rounded-[40px] lg:rounded-[60px] overflow-hidden border border-border bg-muted"
          >
            {showImage ? (
              <img
                src={ctaImage}
                alt="Drive with LinkedUp"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground text-sm">
                    {loading ? 'Loading image...' : 'No image set'}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
    </>
  );
}
