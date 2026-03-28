import React from 'react';
import { Search, Calendar, MapPin } from 'lucide-react';

export function SearchControls({ onSearch }: { onSearch: (params: any) => void }) {
  return (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/10 py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full flex items-center gap-2 px-4 py-3 bg-card border border-white/5 rounded-2xl">
          <MapPin className="text-primary" size={20} />
          <input type="text" placeholder="Pickup Location" className="bg-transparent w-full focus:outline-none text-sm" />
        </div>
        <div className="flex-1 w-full flex items-center gap-2 px-4 py-3 bg-card border border-white/5 rounded-2xl">
          <Calendar className="text-primary" size={20} />
          <input type="date" className="bg-transparent w-full focus:outline-none text-sm" />
        </div>
        <div className="flex-1 w-full flex items-center gap-2 px-4 py-3 bg-card border border-white/5 rounded-2xl">
          <Calendar className="text-primary" size={20} />
          <input type="date" className="bg-transparent w-full focus:outline-none text-sm" />
        </div>
        <button className="w-full md:w-auto px-8 py-3 bg-primary text-black font-black uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all">
          Search
        </button>
      </div>
    </div>
  );
}
