import React, { useState, useMemo } from 'react';
import { Car } from '../../../types';
import { ArrowLeft, ShieldCheck, CheckCircle2, Loader2, Phone, AlertCircle, Lock, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../../services/bookingService';
import { enhancedContractService } from '../../../services/enhancedContractService';
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
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'cash'>('mpesa');
  const [mpesaCode, setMpesaCode] = useState('');
  const mpesaAccountNumber = useMemo(() => `RENTAL_${Math.floor(1000 + Math.random() * 9000)}`, []);

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
        paymentMethod: paymentMethod,
        mpesaCode: paymentMethod === 'mpesa' ? mpesaCode : null
      });

      if (bookingData.contractId) {
        await enhancedContractService.releasePaymentHold(bookingData.contractId).catch(() => {});
      }

      if (result?.id) {
        toast.success(paymentMethod === 'mpesa'
          ? 'Booking submitted! Payment will be verified shortly.'
          : 'Booking submitted! Pay on pickup to confirm.');
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
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-4 md:space-y-6">
        <h3 className="text-2xl md:text-3xl font-serif font-black italic text-white">Secure Payment</h3>
        <p className="text-muted-foreground text-sm">Choose your preferred payment method to finalize your booking.</p>

        {bookingData.contractSigned && (
          <div className="p-3 md:p-4 bg-green-500/10 rounded-[16px] md:rounded-[20px] border border-green-500/20 flex gap-3">
            <Lock className="text-green-500 shrink-0" size={16} />
            <div>
              <p className="text-xs text-green-500 font-bold uppercase tracking-widest">Contract Secured</p>
              <p className="text-[10px] text-green-500/80">Your rental agreement has been signed</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Payment Method Tabs */}
        <div className="flex gap-3 p-2 bg-white/5 rounded-[20px] md:rounded-[24px] border border-white/10">
          <button
            onClick={() => setPaymentMethod('mpesa')}
            className={`flex-1 py-3 md:py-4 rounded-[14px] md:rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              paymentMethod === 'mpesa' ? 'bg-[#2CB432] text-white shadow-lg shadow-[#2CB432]/20' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            <Phone size={14} /> M-Pesa
          </button>
          <button
            onClick={() => setPaymentMethod('cash')}
            className={`flex-1 py-3 md:py-4 rounded-[14px] md:rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              paymentMethod === 'cash' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            <Banknote size={14} /> Pay on Pickup
          </button>
        </div>

        <AnimatePresence mode="wait">
          {paymentMethod === 'mpesa' ? (
            <motion.div
              key="mpesa" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="p-5 md:p-8 bg-white/5 border border-white/10 rounded-[24px] md:rounded-[32px] space-y-4 md:space-y-6"
            >
              <div className="space-y-4">
                <div className="p-4 md:p-6 bg-[#2CB432]/5 rounded-[18px] md:rounded-[24px] border border-[#2CB432]/20 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#2CB432]">M-Pesa Instructions</p>
                  <ol className="text-xs text-white/80 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Go to M-Pesa on your phone</li>
                    <li>Select <strong>Lipa na M-Pesa</strong> &gt; <strong>Paybill</strong></li>
                    <li>Enter Business No: <span className="font-black text-white">4040404</span></li>
                    <li>Enter Account No: <span className="font-black text-white">{mpesaAccountNumber}</span></li>
                    <li>Enter Amount: <span className="font-black text-white">KES {bookingData.totalAmount?.toLocaleString()}</span></li>
                    <li>Enter your M-Pesa PIN and confirm</li>
                  </ol>
                </div>
                <div className="group relative">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2CB432] mb-2 block">M-Pesa Transaction Code</label>
                  <input
                    type="text" placeholder="e.g. QWE123RTY4" required
                    value={mpesaCode} onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                    className="w-full px-4 md:px-6 py-3 md:py-4 bg-white/5 border border-white/10 rounded-[16px] md:rounded-[20px] text-sm font-bold text-white focus:ring-2 focus:ring-[#2CB432]/20 outline-none transition-all uppercase tracking-widest"
                  />
                  <div className="mt-2 flex items-start gap-2">
                    <AlertCircle size={12} className="text-[#2CB432] shrink-0 mt-0.5" />
                    <p className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Your booking will be confirmed after payment verification.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="cash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="p-5 md:p-8 bg-white/5 border border-white/10 rounded-[24px] md:rounded-[32px] space-y-4"
            >
              <div className="p-4 md:p-6 bg-amber-500/5 rounded-[18px] md:rounded-[24px] border border-amber-500/20 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Pay on Pickup</p>
                <div className="text-xs text-white/80 space-y-2 leading-relaxed">
                  <p>You can pay the full rental amount when you pick up the vehicle.</p>
                  <p>Accepted methods at pickup: <strong>Cash (KES)</strong> or <strong>M-Pesa</strong></p>
                </div>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-[14px] flex items-start gap-2">
                <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-500/80 font-bold">Your booking will be held for 2 hours. Payment must be completed at pickup to confirm.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Total Summary */}
        <div className="flex justify-between items-end px-2 md:px-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Payable Total</p>
            <p className="text-sm text-white/60">{bookingData.days} Days Rental</p>
          </div>
          <p className="text-2xl md:text-4xl font-black text-primary">KES {bookingData.totalAmount?.toLocaleString()}</p>
        </div>

        <div className="p-3 bg-primary/5 rounded-[16px] flex gap-2 items-center border border-primary/10">
          <ShieldCheck className="text-primary shrink-0" size={14} />
          <p className="text-[9px] text-primary/80 font-bold uppercase tracking-widest">Secure booking with full insurance coverage included</p>
        </div>
      </div>

      <div className="flex gap-3 md:gap-4">
        <button
          type="button" onClick={onPrev} disabled={isSubmitting}
          className="w-1/4 py-4 md:py-5 bg-white/5 rounded-[20px] md:rounded-[24px] text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center disabled:opacity-50"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="w-3/4 py-4 md:py-5 bg-primary rounded-[20px] md:rounded-[24px] text-black font-black uppercase tracking-[0.15em] text-xs md:text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 group disabled:opacity-50"
        >
          {isSubmitting ? (
            <><Loader2 className="animate-spin" size={18} /> Processing...</>
          ) : (
            <>{paymentMethod === 'cash' ? 'Reserve Vehicle' : 'Confirm & Pay'} <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" /></>
          )}
        </button>
      </div>
    </div>
  );
}
