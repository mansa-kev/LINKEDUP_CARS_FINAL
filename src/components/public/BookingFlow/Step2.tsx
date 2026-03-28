import React, { useState } from 'react';
import { Car } from '../../../types';
import { Upload, ArrowRight, ArrowLeft } from 'lucide-react';

interface Step2Props {
  car: Car;
  onNext: (data: any) => void;
  onPrev: () => void;
}

export function Step2({ car, onNext, onPrev }: Step2Props) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    dob: '',
    license: '',
    id: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-2xl font-serif font-black italic text-white mb-6">Personal Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <input 
          type="text" 
          placeholder="Full Name"
          required
          value={formData.fullName}
          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
        />
        <input 
          type="email" 
          placeholder="Email"
          required
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
        />
      </div>
      <input 
        type="text" 
        placeholder="Driver's License Number"
        required
        value={formData.license}
        onChange={(e) => setFormData({...formData, license: e.target.value})}
        className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
      />
      <div className="p-4 border-2 border-dashed border-white/10 rounded-2xl text-center text-muted-foreground text-sm">
        <Upload className="mx-auto mb-2" size={24} />
        Upload Driver's License (Front/Back)
      </div>
      <div className="flex gap-4">
        <button 
          type="button"
          onClick={onPrev}
          className="w-1/3 py-4 bg-white/5 rounded-2xl text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={18} className="mx-auto" />
        </button>
        <button 
          type="submit"
          className="w-2/3 py-4 bg-primary rounded-2xl text-black font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-primary/90 transition-all"
        >
          Continue <ArrowRight size={18} />
        </button>
      </div>
    </form>
  );
}
