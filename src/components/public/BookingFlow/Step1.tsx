import React, { useState, useEffect } from 'react';
import { Car } from '../../../types';
import { Calendar, MapPin, ArrowRight, Info, Clock, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface Step1Props {
  car: Car;
  onNext: (data: any) => void;
}

export function Step1({ car, onNext }: Step1Props) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('Nairobi, Kenya');
  const [days, setDays] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      setDays(diffDays);
      setTotal(diffDays * car.daily_rate);
    }
  }, [startDate, endDate, car.daily_rate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (days <= 0) return;
    onNext({ startDate, endDate, location, totalAmount: total, days });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h3 className="text-3xl font-serif font-black italic text-white">Select Your Journey</h3>
        <p className="text-muted-foreground text-sm">Choose your preferred pickup location and rental duration.</p>
      </div>

      <div className="space-y-6">
        {/* Location Picker */}
        <div className="group">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2 block">Pickup & Return Location</label>
          <div className="relative">
            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors" size={20} />
            <select 
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-[24px] text-sm font-bold text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none hover:bg-white/10"
            >
              <option value="Nairobi, Kenya" className="bg-background">Nairobi, Kenya (HQ)</option>
              <option value="Mombasa, Kenya" className="bg-background">Mombasa, Kenya</option>
              <option value="Kisumu, Kenya" className="bg-background">Kisumu, Kenya</option>
              <option value="Eldoret, Kenya" className="bg-background">Eldoret, Kenya</option>
            </select>
          </div>
        </div>

        {/* Date Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2 block">Pickup Date</label>
            <div className="relative">
              <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors" size={20} />
              <input 
                type="date" 
                required
                min={new Date().toISOString().split('T')[0]}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-[24px] text-sm font-bold text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:bg-white/10 [color-scheme:dark]"
              />
            </div>
          </div>
          <div className="group">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2 block">Return Date</label>
            <div className="relative">
              <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors" size={20} />
              <input 
                type="date" 
                required
                min={startDate || new Date().toISOString().split('T')[0]}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-[24px] text-sm font-bold text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:bg-white/10 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Price Card */}
      {days > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-primary/5 border border-primary/20 rounded-[32px] space-y-4"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Duration</p>
                <p className="text-sm font-bold text-white">{days} {days === 1 ? 'Day' : 'Days'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Total Amount</p>
              <p className="text-2xl font-black text-primary">${total.toLocaleString()}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-primary/10 flex items-center gap-2 text-[10px] text-primary/60 font-bold uppercase tracking-widest">
            <ShieldCheck size={14} />
            Includes Basic Insurance & 24/7 Roadside Assistance
          </div>
        </motion.div>
      )}

      <button 
        type="submit"
        disabled={!startDate || !endDate || days <= 0}
        className="w-full py-6 bg-primary rounded-[24px] text-black font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100 group"
      >
        Continue to Details 
        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </form>
  );
}
