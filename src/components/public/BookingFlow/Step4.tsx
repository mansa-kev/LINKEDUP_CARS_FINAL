import React, { useState } from 'react';
import { Car } from '../../../types';
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle2, Loader2, Phone, Info, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../../services/bookingService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Step4Props {
  car: Car;
  bookingData: any;
  onPrev: () => void;
}

export function Step4({ car, bookingData, onPrev }: Step4Props) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mpesa'>('card');
  const [mpesaCode, setMpesaCode] = useState('');

  const handleConfirm = async () => {
    if (paymentMethod === 'mpesa' && !mpesaCode) {
      toast.error('Please enter the M-Pesa transaction code');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await bookingService.createBooking({
        ...bookingData,
        carId: car.id,
        paymentMethod,
        mpesaCode: paymentMethod === 'mpesa' ? mpesaCode : null
      });

      if (result.id) {
        toast.success('Booking initiated successfully!');
        navigate(`/booking-confirmation/${result.id}`);
      } else {
        throw new Error('Failed to create booking');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h3 className="text-3xl font-serif font-black italic text-white">Secure Payment</h3>
        <p className="text-muted-foreground text-sm">Choose your preferred payment method to finalize your booking.</p>
      </div>

      <div className="space-y-6">
        {/* Payment Method Tabs */}
        <div className="flex gap-4 p-2 bg-white/5 rounded-[24px] border border-white/10">
          <button 
            onClick={() => setPaymentMethod('card')}
            className={`flex-1 py-4 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
              paymentMethod === 'card' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            <CreditCard size={16} /> Credit Card
          </button>
          <button 
            onClick={() => setPaymentMethod('mpesa')}
            className={`flex-1 py-4 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
              paymentMethod === 'mpesa' ? 'bg-[#2CB432] text-white shadow-lg shadow-[#2CB432]/20' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            <Phone size={16} /> M-Pesa
          </button>
        </div>

        <AnimatePresence mode="wait">
          {paymentMethod === 'card' ? (
            <motion.div 
              key="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="p-8 bg-white/5 border border-white/10 rounded-[32px] space-y-6"
            >
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-[20px] border border-primary/10 flex gap-3">
                  <ShieldCheck className="text-primary shrink-0" size={20} />
                  <p className="text-[10px] text-primary/80 font-bold uppercase tracking-widest leading-normal">
                    Secure Stripe Checkout. Your card details are never stored on our servers.
                  </p>
                </div>
                <div className="text-center py-8 space-y-4 border-2 border-dashed border-white/5 rounded-[24px]">
                  <CreditCard className="mx-auto text-white/10" size={48} />
                  <p className="text-xs text-muted-foreground">Stripe Payment Element will load here in production.</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="mpesa" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="p-8 bg-white/5 border border-white/10 rounded-[32px] space-y-6"
            >
              <div className="space-y-4">
                <div className="p-6 bg-[#2CB432]/5 rounded-[24px] border border-[#2CB432]/20 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#2CB432]">Instructions</p>
                  <ol className="text-xs text-white/80 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Go to M-Pesa on your phone</li>
                      <li>Select Lipa na M-Pesa &gt; Paybill</li>
                    <li>Enter Business No: <span className="font-black text-white">4040404</span></li>
                    <li>Enter Account No: <span className="font-black text-white">RENTAL_{Math.floor(1000 + Math.random() * 9000)}</span></li>
                    <li>Enter Amount: <span className="font-black text-white">${bookingData.totalAmount?.toLocaleString()}</span></li>
                  </ol>
                </div>
                <div className="group relative">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2CB432] mb-2 block">Transaction Code</label>
                  <input 
                    type="text" placeholder="e.g. QWE123RTY4" required
                    value={mpesaCode} onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-[20px] text-sm font-bold text-white focus:ring-2 focus:ring-[#2CB432]/20 outline-none transition-all uppercase tracking-widest"
                  />
                  <div className="mt-2 flex items-start gap-2">
                    <AlertCircle size={12} className="text-[#2CB432] shrink-0 mt-0.5" />
                    <p className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Your booking will be confirmed after our team verifies the transaction.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Total Summary */}
        <div className="flex justify-between items-end px-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Payable Total</p>
            <p className="text-sm text-white/60">{bookingData.days} Days Rental</p>
          </div>
          <p className="text-4xl font-black text-primary">${bookingData.totalAmount?.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          type="button" onClick={onPrev} disabled={isSubmitting}
          className="w-1/4 py-5 bg-white/5 rounded-[24px] text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center disabled:opacity-50"
        >
          <ArrowLeft size={20} />
        </button>
        <button 
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="w-3/4 py-5 bg-primary rounded-[24px] text-black font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 group disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={20} /> Processing...
            </>
          ) : (
            <>
              Confirm & Pay <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
