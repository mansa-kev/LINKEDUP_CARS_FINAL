import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Car, Sliders, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';

interface HeroContent {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  overlay_text: string;
  display_order: number;
}

export function HeroSection() {
  const [heroContent, setHeroContent] = useState<HeroContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'find' | 'browse'>('find');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHeroContent();
  }, []);

  const fetchHeroContent = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_content')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setHeroContent(data || []);
    } catch (error) {
      console.error('Error fetching hero content:', error);
      // Fallback content if table doesn't exist or is empty
      setHeroContent([
        {
          id: '1',
          media_type: 'image',
          media_url: 'https://picsum.photos/seed/luxury-car-1/1920/1080',
          overlay_text: 'Experience the Pinnacle of Luxury',
          display_order: 0
        },
        {
          id: '2',
          media_type: 'image',
          media_url: 'https://picsum.photos/seed/luxury-car-2/1920/1080',
          overlay_text: 'Unforgettable Journeys Await',
          display_order: 1
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (heroContent.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroContent.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [heroContent]);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % heroContent.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + heroContent.length) % heroContent.length);

  return (
    <section className="relative h-[100vh] min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Carousel */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          {heroContent.map((content, index) => (
            index === currentIndex && (
              <motion.div
                key={content.id}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="absolute inset-0"
              >
                {content.media_type === 'video' ? (
                  <video
                    src={content.media_url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={content.media_url}
                    alt={content.overlay_text}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                {/* Overlay Gradients */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-8xl font-serif font-black tracking-tighter text-white italic mb-6 drop-shadow-2xl">
            {heroContent[currentIndex]?.overlay_text || 'Experience Luxury'}
          </h1>
          <p className="text-xl md:text-2xl text-white/80 font-medium max-w-2xl mx-auto drop-shadow-lg">
            {heroContent[currentIndex]?.overlay_text ? '' : 'Curated fleet of world-class vehicles for your next journey.'}
          </p>
        </motion.div>

        {/* Search Widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full max-w-4xl glass rounded-[40px] p-2 shadow-2xl overflow-hidden"
        >
          {/* Tabs */}
          <div className="flex p-2 gap-2">
            <button
              onClick={() => setActiveTab('find')}
              className={`flex-1 py-4 rounded-[30px] text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'find' ? 'bg-primary text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Find Your Car
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex-1 py-4 rounded-[30px] text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'browse' ? 'bg-primary text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Browse by Category
            </button>
          </div>

          {/* Form Area */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'find' ? (
                <motion.div
                  key="find"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  {/* Location */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <MapPin size={12} className="text-primary" />
                      Pickup Location
                    </label>
                    <div className="relative">
                      <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white outline-none focus:border-primary/50 transition-colors appearance-none">
                        <option value="">Select Location</option>
                        <option value="nairobi">Nairobi, Kenya</option>
                        <option value="mombasa">Mombasa, Kenya</option>
                      </select>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <Calendar size={12} className="text-primary" />
                      Pickup & Return
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="date" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-xs font-bold text-white outline-none focus:border-primary/50 transition-colors"
                      />
                      <input 
                        type="date" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-xs font-bold text-white outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Make/Model */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <Car size={12} className="text-primary" />
                      Vehicle Preference
                    </label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white outline-none focus:border-primary/50 transition-colors appearance-none">
                      <option value="">All Makes</option>
                      <option value="toyota">Toyota</option>
                      <option value="mercedes">Mercedes-Benz</option>
                      <option value="bmw">BMW</option>
                    </select>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="browse"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  {['Luxury', 'SUV', 'Sedan', 'Electric'].map((cat) => (
                    <button 
                      key={cat}
                      className="p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center gap-3 hover:bg-primary/10 hover:border-primary/30 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Car size={24} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-white">{cat}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA Button */}
            <div className="mt-10">
              <button className="w-full py-6 bg-primary text-white rounded-[30px] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/40 group">
                <Search size={20} className="group-hover:rotate-12 transition-transform" />
                Search Available Fleet
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Carousel Controls */}
      <div className="absolute bottom-12 right-12 flex gap-4 z-20">
        <button 
          onClick={prevSlide}
          className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={nextSlide}
          className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
      >
        <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">Scroll</span>
      </motion.div>
    </section>
  );
}
