import React from 'react';
import { motion } from 'motion/react';
import { Shield, Clock, Heart, Award } from 'lucide-react';

export function AboutUs() {
  const values = [
    {
      icon: Shield,
      title: "Uncompromising Safety",
      description: "Every vehicle in our fleet undergoes rigorous multi-point inspections and regular maintenance to ensure your peace of mind."
    },
    {
      icon: Clock,
      title: "Seamless Experience",
      description: "From booking to drop-off, we've optimized every touchpoint to be fast, intuitive, and respectful of your time."
    },
    {
      icon: Heart,
      title: "Passion for Service",
      description: "We don't just rent cars; we provide the keys to your next adventure with a dedicated team available 24/7."
    },
    {
      icon: Award,
      title: "Premium Standards",
      description: "Our curated selection features only the latest models with top-tier specifications and pristine interiors."
    }
  ];

  return (
    <div className="pt-32 pb-20">
      {/* Hero Section */}
      <section className="px-6 mb-32">
        <div className="max-w-7xl mx-auto text-center">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-primary text-xs font-black uppercase tracking-[0.3em] mb-6 block"
          >
            Our Story
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-serif font-black tracking-tighter italic text-white leading-tight mb-12"
          >
            Redefining the <span className="text-primary">Art of Travel</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed"
          >
            Founded on the principle that every journey deserves a touch of luxury, LinkedUp Car Rentals has grown from a boutique fleet to a premier automotive experience provider.
          </motion.p>
        </div>
      </section>

      {/* Image Section */}
      <section className="px-6 mb-32">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-[21/9] rounded-[60px] overflow-hidden border border-white/5"
          >
            <img 
              src="https://picsum.photos/seed/luxury-fleet/1920/800" 
              alt="Our Luxury Fleet" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="px-6 mb-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-10 rounded-[40px] bg-card border border-white/5 hover:border-primary/20 transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <value.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-serif font-black tracking-tight italic mb-4 text-white">
                  {value.title}
                </h3>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="px-6 py-32 bg-primary/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary rounded-full blur-[120px]" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-serif font-black tracking-tight italic text-white mb-12 leading-tight">
            "Our mission is to provide more than just a car; we provide the freedom to explore with confidence and style."
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-[1px] bg-primary/40" />
            <span className="text-primary font-black uppercase tracking-widest text-xs">The LinkedUp Team</span>
            <div className="w-12 h-[1px] bg-primary/40" />
          </div>
        </div>
      </section>
    </div>
  );
}
