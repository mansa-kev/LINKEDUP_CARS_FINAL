import React from 'react';
import { Car } from '../../../types';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Step4Props {
  car: Car;
  onPrev: () => void;
}

export function Step4({ car, onPrev }: Step4Props) {
  const navigate = useNavigate();

  const handleConfirm = () => {
    // In a real app, you'd call the payment service here
    const bookingId = 'bk_' + Math.random().toString(36).substr(2, 9);
    navigate(`/booking-confirmation/${bookingId}`);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-serif font-black italic text-white mb-6">Payment</h3>
      <div className="p-6 bg-white/5 rounded-3xl text-sm text-white flex items-center gap-4">
        <CreditCard className="text-primary" />
        <div>
          <p className="font-bold">Secure Payment</p>
          <p className="text-muted-foreground">Pay with Credit Card</p>
        </div>
      </div>
      <div className="flex gap-4">
        <button 
          onClick={onPrev}
          className="w-1/3 py-4 bg-white/5 rounded-2xl text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={18} className="mx-auto" />
        </button>
        <button 
          onClick={handleConfirm}
          className="w-2/3 py-4 bg-primary rounded-2xl text-black font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
        >
          Confirm Payment
        </button>
      </div>
    </div>
  );
}
