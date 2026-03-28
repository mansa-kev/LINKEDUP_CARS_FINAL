import React, { useState } from 'react';
import { Car } from '../../../types';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

interface Step1Props {
  car: Car;
  onNext: (data: any) => void;
}

export function Step1({ car, onNext }: Step1Props) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ startDate, endDate, location });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-2xl font-serif font-black italic text-white mb-6">Dates & Location</h3>
      <div className="space-y-4">
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
          <input 
            type="text" 
            placeholder="Pickup Location"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input 
            type="date" 
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
          />
          <input 
            type="date" 
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
          />
        </div>
      </div>
      <button 
        type="submit"
        className="w-full py-4 bg-primary rounded-2xl text-black font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-primary/90 transition-all"
      >
        Continue <ArrowRight size={18} />
      </button>
    </form>
  );
}
