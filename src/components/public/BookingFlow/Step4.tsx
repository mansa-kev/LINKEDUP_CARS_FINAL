import React, { useState, useEffect } from 'react';
import { Car } from '../../../types';
import { ArrowLeft, ShieldCheck, CheckCircle2, Loader2, AlertCircle, Lock, Copy, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../../services/bookingService';
import { enhancedContractService } from '../../../services/enhancedContractService';
import { supabase } from '../../../lib/supabase';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface Step4Props {
  car: Car;
  bookingData: any;
  onPrev: () => void;
  onComplete?: () => void;
}

const PAYBILL = import.meta.env.VITE_MPESA_SHORTCODE || '174379';

export function Step4({ car, bookingData, onPrev, onComplete }: Step4Props) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mpesaCode, setMpesaCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const accountRef = `LU${car.id.split('-')[0].toUpperCase()}`;

  // Supabase realtime listener — auto-redirect if admin confirms payment
  useEffect(() => {
    if (!bookingId) return;
    const channel = supabase
      .channel(`booking-payment-${bookingId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `id=eq.${bookingId}`,
      }, (payload: any) => {
        const updated = payload.new;
        if (updated.payment_status === 'paid' && updated.status === 'confirmed') {
          toast.success('Payment verified! Booking confirmed.');
          onComplete?.();
          navigate(`/booking-confirmation/${bookingId}`);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [bookingId, navigate]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`)).catch(() => {});
  };

  const handleSubmit = async () => {
    if (!mpesaCode || mpesaCode.length < 8) {
      toast.error('Please enter a valid M-Pesa transaction code (e.g. SHK4ABCDEF)');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create booking
      const booking = await bookingService.createBooking({
        ...bookingData,
        carId: car.id,
        paymentMethod: 'mpesa',
        mpesaCode,
      });
      if (!booking?.id) throw new Error('Failed to create booking');
      setBookingId(booking.id);

      if (bookingData.contractId) {
        await enhancedContractService.releasePaymentHold(bookingData.contractId).catch(() => {});
      }

      // pending_payments record is created inside bookingService.createBooking
      setSubmitted(true);
      toast.success('Payment code submitted! Awaiting verification.');

      // Navigate to confirmation after brief delay
      setTimeout(() => {
        onComplete?.();
        navigate(`/booking-confirmation/${booking.id}`);
      }, 2500);
    } catch (error: any) {
      console.error('Payment submission error:', error);
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── SUCCESS STATE ─────────────────────────────────────────────
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="space-y-5 animate-in fade-in duration-500"
      >
        <div className="p-5 sm:p-8 bg-[#2CB432]/10 border border-[#2CB432]/30 rounded-[20px] sm:rounded-[28px] text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200 }}
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-[#2CB432]/20 rounded-full flex items-center justify-center"
          >
            <CheckCircle2 size={36} className="text-[#2CB432]" />
          </motion.div>
          <h4 className="text-lg sm:text-xl font-serif font-black italic text-foreground">Payment Code Submitted!</h4>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Your M-Pesa code <span className="font-black text-[#2CB432]">{mpesaCode}</span> has been received.
            Our team will verify the payment and confirm your booking shortly.
          </p>
          <div className="flex items-center justify-center gap-2 text-[#2CB432]">
            <Clock size={14} />
            <p className="text-[10px] font-black uppercase tracking-widest">Redirecting to booking details...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── MAIN PAYMENT FORM ─────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-black italic text-foreground">Complete Payment</h3>
        <p className="text-muted-foreground text-xs sm:text-sm">Pay via M-Pesa and enter your transaction code below.</p>
      </div>

      {bookingData.contractSigned && (
        <div className="p-2.5 sm:p-3 bg-green-500/10 rounded-[12px] sm:rounded-[16px] border border-green-500/20 flex gap-2 items-center">
          <Lock className="text-green-500 shrink-0" size={14} />
          <p className="text-[10px] sm:text-xs text-green-500 font-bold uppercase tracking-widest">Contract Signed</p>
        </div>
      )}

      {/* M-Pesa Payment Instructions */}
      <div className="p-3 sm:p-5 bg-[#2CB432]/5 border border-[#2CB432]/20 rounded-[16px] sm:rounded-[24px] space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#2CB432]/20 flex items-center justify-center shrink-0">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/1200px-M-PESA_LOGO-01.svg.png" alt="M-Pesa" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#2CB432]">M-Pesa Payment</p>
        </div>

        <div className="space-y-2">
          {/* Paybill */}
          <div className="flex items-center justify-between p-2.5 sm:p-3 bg-card/50 rounded-[10px] sm:rounded-[14px] border border-border">
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Paybill Number</p>
              <p className="text-sm sm:text-lg font-black text-foreground">{PAYBILL}</p>
            </div>
            <button onClick={() => copyToClipboard(PAYBILL, 'Paybill')} className="p-2 hover:bg-card/70 rounded-lg transition-colors">
              <Copy size={14} className="text-muted-foreground" />
            </button>
          </div>
          {/* Account */}
          <div className="flex items-center justify-between p-2.5 sm:p-3 bg-card/50 rounded-[10px] sm:rounded-[14px] border border-border">
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account Number</p>
              <p className="text-sm sm:text-lg font-black text-foreground">{accountRef}</p>
            </div>
            <button onClick={() => copyToClipboard(accountRef, 'Account')} className="p-2 hover:bg-card/70 rounded-lg transition-colors">
              <Copy size={14} className="text-muted-foreground" />
            </button>
          </div>
          {/* Amount */}
          <div className="flex items-center justify-between p-2.5 sm:p-3 bg-[#2CB432]/10 rounded-[10px] sm:rounded-[14px] border border-[#2CB432]/20">
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#2CB432]/70">Amount to Pay</p>
              <p className="text-lg sm:text-xl font-black text-[#2CB432]">KES {bookingData.totalAmount?.toLocaleString()}</p>
            </div>
            <button onClick={() => copyToClipboard(String(bookingData.totalAmount), 'Amount')} className="p-2 hover:bg-card/70 rounded-lg transition-colors">
              <Copy size={14} className="text-[#2CB432]/60" />
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-[#2CB432]/10">
          <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed">
            <strong className="text-foreground/70">How to pay:</strong> Open M-Pesa → Lipa na M-Pesa → Paybill → Enter details above → Enter PIN → Send
          </p>
        </div>
      </div>

      {/* Transaction Code Input */}
      <div className="space-y-2">
        <label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] text-[#2CB432]">M-Pesa Transaction Code</label>
        <input
          type="text"
          placeholder="e.g. SHK4ABCDEF"
          value={mpesaCode}
          onChange={(e) => setMpesaCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
          maxLength={12}
          className="w-full px-4 py-3 sm:py-4 bg-card/50 border border-border rounded-[14px] sm:rounded-[18px] text-sm sm:text-base font-bold text-foreground focus:ring-2 focus:ring-[#2CB432]/30 focus:border-[#2CB432]/40 outline-none transition-all uppercase tracking-[0.2em] text-center placeholder:text-muted-foreground/50 placeholder:tracking-widest"
        />
        <div className="flex items-start gap-1.5">
          <AlertCircle size={10} className="text-muted-foreground/50 shrink-0 mt-0.5" />
          <p className="text-[8px] sm:text-[9px] text-muted-foreground/50 uppercase font-bold tracking-widest">
            Enter the code from your M-Pesa confirmation SMS. Booking will be confirmed after verification.
          </p>
        </div>
      </div>

      {/* Price Summary */}
      <div className="px-1 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] sm:text-xs text-muted-foreground">{bookingData.days} Days × KES {car.daily_rate?.toLocaleString()}</span>
          <span className="text-xs sm:text-sm text-muted-foreground">KES {(bookingData.originalAmount || bookingData.totalAmount)?.toLocaleString()}</span>
        </div>
        {bookingData.discount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-[10px] sm:text-xs text-green-400 font-bold">{bookingData.promoTitle || 'Discount'}</span>
            <span className="text-xs sm:text-sm text-green-400 font-bold">- KES {bookingData.discount?.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between items-end pt-2 border-t border-border">
          <span className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest">Total Amount</span>
          <span className="text-sm sm:text-base font-black text-foreground">KES {bookingData.totalAmount?.toLocaleString()}</span>
        </div>
      </div>

      <div className="p-2.5 sm:p-3 bg-primary/5 rounded-[12px] sm:rounded-[16px] flex gap-2 items-center border border-primary/10">
        <ShieldCheck className="text-primary shrink-0" size={12} />
        <p className="text-[8px] sm:text-[9px] text-primary/80 font-bold uppercase tracking-widest">Secure booking with full insurance coverage</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 sm:gap-3">
        <button
          type="button" onClick={onPrev} disabled={isSubmitting}
          className="w-1/5 sm:w-1/4 py-3.5 sm:py-4 bg-card/50 rounded-[14px] sm:rounded-[20px] text-foreground font-black hover:bg-card/70 transition-all flex items-center justify-center disabled:opacity-50 border border-border"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !mpesaCode || mpesaCode.length < 8}
          className="flex-1 py-3.5 sm:py-4 bg-[#2CB432] rounded-[14px] sm:rounded-[20px] text-primary-foreground font-black uppercase tracking-[0.12em] text-[11px] sm:text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#2CB432]/20 disabled:opacity-40 disabled:hover:scale-100"
        >
          {isSubmitting ? (
            <><Loader2 className="animate-spin" size={16} /> Verifying...</>
          ) : (
            <>Submit Payment Code <CheckCircle2 size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}
