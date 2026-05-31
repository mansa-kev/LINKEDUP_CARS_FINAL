import React, { useEffect, useState } from 'react';
import { Car } from '../../../types';
import { ArrowLeft, ShieldCheck, CheckCircle2, Loader2, AlertCircle, Lock, Smartphone, RefreshCw, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../../services/bookingService';
import { enhancedContractService } from '../../../services/enhancedContractService';
import { paymentService } from '../../../services/paymentService';
import { supabase } from '../../../lib/supabase';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface Step4Props {
  car: Car;
  bookingData: any;
  onPrev: () => void;
  onComplete?: () => void;
}

type PaymentPhase = 'ready' | 'creating_booking' | 'sending_stk' | 'waiting' | 'paid' | 'failed' | 'timeout';

export function Step4({ car, bookingData, onPrev, onComplete }: Step4Props) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<PaymentPhase>('ready');
  const [phone, setPhone] = useState(bookingData.phone || '');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentRequestId, setPaymentRequestId] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState('');

  const isBusy = phase === 'creating_booking' || phase === 'sending_stk' || phase === 'waiting';

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
          setPhase('paid');
          toast.success('Payment confirmed! Booking confirmed.');
          onComplete?.();
          navigate(`/booking-confirmation/${bookingId}`);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [bookingId, navigate, onComplete]);

  const getOrCreateBooking = async () => {
    if (bookingId) return bookingId;

    setPhase('creating_booking');
    const booking = await bookingService.createBooking({
      ...bookingData,
      carId: car.id,
      paymentMethod: 'ncba_stk',
    });

    if (!booking?.id) throw new Error('Failed to create booking');

    setBookingId(booking.id);

    if (bookingData.contractId) {
      await enhancedContractService.releasePaymentHold(bookingData.contractId).catch(() => {});
    }

    return booking.id;
  };

  const handlePaid = (id: string) => {
    setPhase('paid');
    toast.success('Payment confirmed! Booking confirmed.');
    onComplete?.();
    navigate(`/booking-confirmation/${id}`);
  };

  const handleSendStk = async () => {
    const cleanPhone = phone.replace(/[\s\-+]/g, '');

    if (cleanPhone.length < 9) {
      toast.error('Enter a valid phone number for STK Push');
      return;
    }

    try {
      setLastMessage('');
      const id = await getOrCreateBooking();

      setPhase('sending_stk');
      const result = await paymentService.initiateSTKPush({ phone: cleanPhone, bookingId: id });

      if (result.paymentRequestId) {
        setPaymentRequestId(result.paymentRequestId);
      }

      if (!result.success || !result.paymentRequestId) {
        setPhase('failed');
        setLastMessage(result.error || result.statusDescription || 'STK Push could not be sent. Please try again.');
        toast.error(result.error || 'STK Push failed. Please try again.');
        return;
      }

      setPhase('waiting');
      setLastMessage(result.statusDescription || 'STK Push sent. Check your phone and enter your PIN.');
      toast.success('STK Push sent. Check your phone.');

      const pollResult = await paymentService.pollUntilPaid(result.paymentRequestId, id);

      if (pollResult === 'paid') {
        handlePaid(id);
      } else if (pollResult === 'failed') {
        setPhase('failed');
        setLastMessage('Payment was not completed. You can retry without creating a new booking.');
      } else {
        setPhase('timeout');
        setLastMessage('Payment is still pending or timed out. You can retry STK Push for the same booking.');
      }
    } catch (error: any) {
      console.error('NCBA STK payment error:', error);
      setPhase('failed');
      setLastMessage(error.message || 'Payment could not be started. Please try again.');
      toast.error(error.message || 'Payment could not be started. Please try again.');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-1">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-black italic text-foreground">Complete Payment</h3>
        <p className="text-muted-foreground text-xs sm:text-sm">Pay securely using NCBA STK Push. No manual transaction code is required.</p>
      </div>

      {bookingData.contractSigned && (
        <div className="p-2.5 sm:p-3 bg-green-500/10 rounded-[12px] sm:rounded-[16px] border border-green-500/20 flex gap-2 items-center">
          <Lock className="text-green-500 shrink-0" size={14} />
          <p className="text-[10px] sm:text-xs text-green-500 font-bold uppercase tracking-widest">Contract Signed</p>
        </div>
      )}

      <div className="p-4 sm:p-5 bg-primary/5 border border-primary/20 rounded-[16px] sm:rounded-[24px] space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Smartphone size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-primary">NCBA STK Push</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">You will receive a payment prompt on your phone.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] text-primary">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isBusy}
            placeholder="07XXXXXXXX or 2547XXXXXXXX"
            className="w-full px-4 py-3 sm:py-4 bg-card/50 border border-border rounded-[14px] sm:rounded-[18px] text-sm sm:text-base font-bold text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary/40 outline-none transition-all disabled:opacity-60"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-card/50 rounded-[14px] border border-border">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount</p>
            <p className="text-sm sm:text-lg font-black text-foreground">KES {bookingData.totalAmount?.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-card/50 rounded-[14px] border border-border">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vehicle</p>
            <p className="text-sm sm:text-lg font-black text-foreground truncate">{car.make} {car.model}</p>
          </div>
        </div>

        {phase !== 'ready' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-[14px] border border-border bg-card/50">
            <div className="flex items-start gap-2">
              {phase === 'creating_booking' || phase === 'sending_stk' || phase === 'waiting' ? (
                <Loader2 className="animate-spin text-primary shrink-0 mt-0.5" size={16} />
              ) : phase === 'paid' ? (
                <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={16} />
              ) : (
                <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={16} />
              )}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground">
                  {phase === 'creating_booking' && 'Creating booking'}
                  {phase === 'sending_stk' && 'Sending STK Push'}
                  {phase === 'waiting' && 'Waiting for payment'}
                  {phase === 'paid' && 'Payment confirmed'}
                  {phase === 'failed' && 'Payment attempt failed'}
                  {phase === 'timeout' && 'Payment still pending'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {lastMessage || 'Please wait while we process your payment.'}
                </p>
                {paymentRequestId && (
                  <p className="text-[9px] text-muted-foreground/60 mt-1 font-mono">Request: {paymentRequestId.slice(0, 8).toUpperCase()}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

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
        <p className="text-[8px] sm:text-[9px] text-primary/80 font-bold uppercase tracking-widest">Secure NCBA payment with booking retry support</p>
      </div>

      {(phase === 'failed' || phase === 'timeout') && bookingId && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-[14px] flex gap-2 items-start">
          <Clock className="text-yellow-500 shrink-0 mt-0.5" size={14} />
          <p className="text-[10px] text-yellow-500/90 font-bold uppercase tracking-widest">
            Your booking is still held as pending payment verification. Retry STK Push to complete payment.
          </p>
        </div>
      )}

      <div className="flex gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={isBusy}
          className="w-1/5 sm:w-1/4 py-3.5 sm:py-4 bg-card/50 rounded-[14px] sm:rounded-[20px] text-foreground font-black hover:bg-card/70 transition-all flex items-center justify-center disabled:opacity-50 border border-border"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={handleSendStk}
          disabled={isBusy || !phone}
          className="flex-1 py-3.5 sm:py-4 bg-primary rounded-[14px] sm:rounded-[20px] text-primary-foreground font-black uppercase tracking-[0.12em] text-[11px] sm:text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-40 disabled:hover:scale-100"
        >
          {phase === 'creating_booking' ? (
            <><Loader2 className="animate-spin" size={16} /> Creating Booking...</>
          ) : phase === 'sending_stk' ? (
            <><Loader2 className="animate-spin" size={16} /> Sending STK...</>
          ) : phase === 'waiting' ? (
            <><Loader2 className="animate-spin" size={16} /> Waiting for PIN...</>
          ) : phase === 'failed' || phase === 'timeout' ? (
            <>Retry STK Push <RefreshCw size={16} /></>
          ) : (
            <>Send NCBA STK Push <CheckCircle2 size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}
