import React, { useRef } from 'react';
import { Car } from '../../../types';
import SignatureCanvas from 'react-signature-canvas';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface Step3Props {
  car: Car;
  onNext: (data: any) => void;
  onPrev: () => void;
}

export function Step3({ car, onNext, onPrev }: Step3Props) {
  const sigPad = useRef<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sigPad.current?.isEmpty()) {
      alert('Please provide a signature');
      return;
    }
    onNext({ signature: sigPad.current?.toDataURL() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-2xl font-serif font-black italic text-white mb-6">Review & Sign</h3>
      <div className="p-6 bg-white/5 rounded-3xl text-sm text-muted-foreground">
        <p>Review your booking details for {car.make} {car.model}.</p>
        <p className="mt-2 text-white font-bold">Total: ${car.daily_rate * 3} (Estimated)</p>
      </div>
      <div className="border border-white/10 rounded-2xl overflow-hidden">
        <SignatureCanvas 
          ref={sigPad}
          penColor='white'
          canvasProps={{width: 500, height: 200, className: 'sigCanvas'}} 
        />
      </div>
      <label className="flex items-center gap-2 text-xs text-white">
        <input type="checkbox" required className="accent-primary" />
        I agree to the Terms and Conditions.
      </label>
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
          Proceed to Payment <ArrowRight size={18} />
        </button>
      </div>
    </form>
  );
}
