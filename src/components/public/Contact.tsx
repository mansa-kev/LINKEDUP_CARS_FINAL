import React from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, Instagram, Twitter, Facebook } from 'lucide-react';

export function Contact() {
  const contactInfo = [
    {
      icon: Mail,
      label: "Email Us",
      value: "hello@linkeduprentals.com",
      link: "mailto:hello@linkeduprentals.com"
    },
    {
      icon: Phone,
      label: "Call Us",
      value: "+1 (555) 000-0000",
      link: "tel:+15550000000"
    },
    {
      icon: MapPin,
      label: "Visit Us",
      value: "123 Luxury Lane, Beverly Hills, CA 90210",
      link: "https://maps.google.com"
    }
  ];

  return (
    <div className="pt-32 pb-20">
      <section className="px-6 mb-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            {/* Contact Information */}
            <div>
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-primary text-xs font-black uppercase tracking-[0.3em] mb-6 block"
              >
                Get in Touch
              </motion.span>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-8xl font-serif font-black tracking-tighter italic text-white leading-tight mb-12"
              >
                Let's Start Your <span className="text-primary">Next Journey</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-muted-foreground font-medium leading-relaxed mb-16"
              >
                Have a question about our fleet or need assistance with a booking? Our dedicated team is here to help you 24/7.
              </motion.p>

              <div className="space-y-12">
                {contactInfo.map((item, index) => (
                  <motion.a 
                    key={index}
                    href={item.link}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-8 group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-card border border-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                      <item.icon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                        {item.label}
                      </span>
                      <span className="text-xl font-serif font-black tracking-tight italic text-white group-hover:text-primary transition-colors">
                        {item.value}
                      </span>
                    </div>
                  </motion.a>
                ))}
              </div>

              <div className="mt-20 flex items-center gap-8">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Follow Us</span>
                <div className="flex gap-4">
                  {[Instagram, Twitter, Facebook].map((Icon, i) => (
                    <motion.a 
                      key={i}
                      href="#"
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="w-12 h-12 rounded-xl bg-card border border-white/5 flex items-center justify-center hover:border-primary/20 transition-all"
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="p-12 rounded-[60px] bg-card border border-white/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
              
              <form className="relative z-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="John Doe"
                      className="w-full px-8 py-5 rounded-2xl bg-background border border-white/10 focus:border-primary/40 focus:outline-none transition-all text-white font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="john@example.com"
                      className="w-full px-8 py-5 rounded-2xl bg-background border border-white/10 focus:border-primary/40 focus:outline-none transition-all text-white font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Subject</label>
                  <select className="w-full px-8 py-5 rounded-2xl bg-background border border-white/10 focus:border-primary/40 focus:outline-none transition-all text-white font-medium appearance-none">
                    <option>General Inquiry</option>
                    <option>Booking Assistance</option>
                    <option>Fleet Partnership</option>
                    <option>Feedback</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Message</label>
                  <textarea 
                    rows={6}
                    placeholder="How can we help you?"
                    className="w-full px-8 py-5 rounded-2xl bg-background border border-white/10 focus:border-primary/40 focus:outline-none transition-all text-white font-medium resize-none"
                  />
                </div>
                <button className="w-full py-6 bg-primary rounded-2xl text-black font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-primary/90 transition-all group">
                  Send Message
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section Placeholder */}
      <section className="px-6">
        <div className="max-w-7xl mx-auto h-[500px] rounded-[60px] overflow-hidden border border-white/5 bg-card relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-primary mx-auto mb-6 opacity-20" />
              <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Interactive Map Integration</p>
            </div>
          </div>
          {/* Real map would go here */}
          <img 
            src="https://picsum.photos/seed/map/1920/1080?grayscale" 
            alt="Map" 
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>
    </div>
  );
}
