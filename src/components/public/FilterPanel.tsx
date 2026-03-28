import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

export function FilterPanel({ onFilterChange }: { onFilterChange: (filters: any) => void }) {
  return (
    <div className="w-full md:w-64 p-6 bg-card border border-white/5 rounded-[40px]">
      <div className="flex items-center gap-2 mb-6 text-primary">
        <SlidersHorizontal size={20} />
        <h3 className="font-serif font-black italic text-white">Filters</h3>
      </div>
      <div className="space-y-6">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Car Type</label>
          <select className="w-full p-3 bg-background border border-white/5 rounded-xl text-sm">
            <option>All</option>
            <option>Luxury</option>
            <option>SUV</option>
            <option>Sedan</option>
            <option>Electric</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Price Range</label>
          <input type="range" className="w-full" />
        </div>
      </div>
    </div>
  );
}
