import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  X,
  Copy,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { reservationService, ReservationData } from '../../../services/reservationService';
import { Car } from '../../../types';
import { supabase } from '../../../lib/supabase';

const PAYBILL = import.meta.env.VITE_MPESA_SHORTCODE || '880100';

interface ReservationFlowProps {
  car: Car;
  onClose: () => void;
}

export function ReservationFlow({ car, onClose }: ReservationFlowProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationFee, setReservationFee] = useState(500);
  const [mpesaCode, setMpesaCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<ReservationData>({
    carId: car.id,
    startDate: '',
    endDate: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: ''
  });

  React.useEffect(() => {
    // Get current reservation fee
    reservationService.getReservationFee().then(setReservationFee);
  }, []);

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculateTotal = () => {
    const days = calculateDays();
    const rentalAmount = car.daily_rate * days;
    return reservationFee + rentalAmount;
  };

  const validateStep = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        if (!formData.startDate || !formData.endDate) {
          toast.error('Please select both pickup and return dates');
          return false;
        }
        if (formData.startDate >= formData.endDate) {
          toast.error('Return date must be after pickup date');
          return false;
        }
        return true;
      case 2:
        if (!formData.contactName || !formData.contactEmail || !formData.contactPhone) {
          toast.error('Please fill in all contact information fields');
          return false;
        }
        return true;
      case 3:
        if (!formData.startDate || !formData.endDate || !formData.contactName || !formData.contactEmail || !formData.contactPhone) {
          toast.error('Please complete all required information');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Only handle payment submission on step 4
      if (step === 4) {
        if (!mpesaCode || mpesaCode.length < 8) {
          toast.error('Please enter a valid M-Pesa transaction code (e.g. SHK4ABCDEF)');
          return;
        }

        // Check availability first
        const availability = await reservationService.checkAvailability(
          formData.carId,
          formData.startDate,
          formData.endDate
        );

        if (!availability.available) {
          toast.error('Selected dates are not available. Please choose different dates.');
          return;
        }

        // Create reservation with payment details
        const reservation = await reservationService.createReservation(formData);
        
        // Update reservation record with payment details
        await supabase
          .from('car_reservations')
          .update({
            transaction_code: mpesaCode,
            payment_method: 'mpesa',
            payment_status: 'pending'
          })
          .eq('id', reservation.id);

        setSubmitted(true);
        toast.success('Reservation submitted! Awaiting payment verification.');

        // Close modal after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (error) {
      console.error('Reservation error:', error);
      toast.error('Failed to create reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`)).catch(() => {});
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <>
      {/* Success State */}
      {submitted ? (
        <div className="p-8 text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h3 className="text-2xl font-serif font-black italic">Reservation Submitted!</h3>
          <p className="text-muted-foreground text-sm">Your payment code has been received. We'll confirm your reservation within 24 hours.</p>
          <p className="text-xs text-muted-foreground">This window will close automatically...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-black italic text-warning">Reserve This Car</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">Pay a small fee to hold this car for your dates</p>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 sticky top-0 bg-card z-10 pb-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  s <= step ? 'bg-warning text-black' : 'bg-muted text-muted-foreground'
                }`}>
                  {s}
                </div>
                {s < 4 && <div className={`flex-1 h-1 rounded-full transition-colors ${
                  s < step ? 'bg-warning' : 'bg-muted'
                }`} />}
              </div>
            ))}
          </div>

      {/* Step 1: Select Dates */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <h4 className="font-bold text-lg">Select Reservation Dates</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pickup Date *</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-warning/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Return Date *</label>
              <input
                type="date"
                required
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-warning/20"
              />
            </div>
          </div>

          {formData.startDate && formData.endDate && (
            <div className="p-4 bg-warning/5 rounded-xl border border-warning/20">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Rental Period</span>
                <span className="font-bold">{calculateDays()} days</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Rental Amount</span>
                <span className="font-bold">KES {(car.daily_rate * calculateDays()).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-warning/20">
                <span className="text-sm text-muted-foreground">Reservation Fee</span>
                <span className="font-bold text-warning">KES {reservationFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-warning/20">
                <span className="text-sm font-bold">Total to Pay</span>
                <span className="text-lg font-bold text-warning">KES {calculateTotal().toLocaleString()}</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Step 2: Contact Information */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <h4 className="font-bold text-lg">Contact Information</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  required
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-warning/20"
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-warning/20"
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="tel"
                  required
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-warning/20"
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes (Optional)</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-warning/20"
                placeholder="Any special requests or notes..."
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 3: Review & Confirm */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <h4 className="font-bold text-lg">Review & Confirm</h4>
          
          <div className="p-4 bg-warning/5 rounded-xl border border-warning/20 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Car</span>
              <span className="font-bold">{car.make} {car.model}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Dates</span>
              <span className="font-bold">{formData.startDate} to {formData.endDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Duration</span>
              <span className="font-bold">{calculateDays()} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Contact</span>
              <span className="font-bold">{formData.contactName}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-warning/20">
              <span className="text-sm font-bold">Total Amount</span>
              <span className="text-lg font-bold text-warning">KES {calculateTotal().toLocaleString()}</span>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
              <div className="text-sm text-amber-800">
                <p className="font-bold mb-1">Important Information:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Reservation fee is non-refundable</li>
                  <li>Reservation expires in 24 hours if not paid</li>
                  <li>This holds the car for your selected dates</li>
                  <li>Full payment required before pickup</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 4: M-Pesa Payment */}
      {step === 4 && !submitted && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <h4 className="font-bold text-lg">Complete Payment</h4>
          
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
                  <p className="text-sm sm:text-lg font-black text-foreground">RESERVE-{car.id.split('-')[0].toUpperCase()}</p>
                </div>
                <button onClick={() => copyToClipboard(`RESERVE-${car.id.split('-')[0].toUpperCase()}`, 'Account')} className="p-2 hover:bg-card/70 rounded-lg transition-colors">
                  <Copy size={14} className="text-muted-foreground" />
                </button>
              </div>
              {/* Amount */}
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-[#2CB432]/10 rounded-[10px] sm:rounded-[14px] border border-[#2CB432]/20">
                <div>
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#2CB432]/70">Amount to Pay</p>
                  <p className="text-lg sm:text-xl font-black text-[#2CB432]">KES {reservationFee.toLocaleString()}</p>
                </div>
                <button onClick={() => copyToClipboard(String(reservationFee), 'Amount')} className="p-2 hover:bg-card/70 rounded-lg transition-colors">
                  <Copy size={14} className="text-[#2CB432]/60" />
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-[#2CB432]/10">
              <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground/70">How to pay:</strong> Open M-Pesa &rarr; Lipa na M-Pesa &rarr; Paybill &rarr; Enter details above &rarr; Enter PIN &rarr; Send
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
                Enter the code from your M-Pesa confirmation SMS. Reservation will be confirmed after verification.
              </p>
            </div>
          </div>

          <div className="p-2.5 sm:p-3 bg-primary/5 rounded-[12px] sm:rounded-[16px] flex gap-2 items-center border border-primary/10">
            <ShieldCheck className="text-primary shrink-0" size={12} />
            <p className="text-[8px] sm:text-[9px] text-primary/80 font-bold uppercase tracking-widest">Secure reservation with 24-hour expiry protection</p>
          </div>
        </motion.div>
      )}

      {/* Success State */}
      {step === 4 && submitted && (
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
            <h4 className="text-lg sm:text-xl font-serif font-black italic text-foreground">Reservation submitted!</h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Your M-Pesa code <span className="font-black text-[#2CB432]">{mpesaCode}</span> has been received.
              Our team will verify the payment and confirm your reservation shortly.
            </p>
            <div className="flex items-center justify-center gap-2 text-[#2CB432]">
              <Clock size={14} />
              <p className="text-[10px] font-black uppercase tracking-widest">Closing this window...</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation Buttons */}
          <div className="flex gap-2 sm:gap-4">
            <button
              type="button"
              onClick={step === 1 ? onClose : prevStep}
              disabled={isSubmitting}
              className="w-1/5 sm:w-1/4 py-3.5 sm:py-5 bg-card/50 rounded-[14px] sm:rounded-[24px] text-foreground font-black uppercase tracking-widest hover:bg-card/70 transition-all flex items-center justify-center border border-border disabled:opacity-50 disabled:hover:bg-card/50"
            >
              {step === 1 ? <X size={18} /> : <ArrowLeft size={18} />}
            </button>
            
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={isSubmitting}
                className="flex-1 py-3.5 sm:py-5 bg-warning rounded-[14px] sm:rounded-[24px] text-black font-black uppercase tracking-[0.15em] text-[11px] sm:text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-warning/20 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            ) : step === 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={isSubmitting}
                className="flex-1 py-3.5 sm:py-5 bg-warning rounded-[14px] sm:rounded-[24px] text-black font-black uppercase tracking-[0.15em] text-[11px] sm:text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-warning/20 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processing...
                  </>
                ) : (
                  <>
                    Proceed to Payment
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !mpesaCode || mpesaCode.length < 8}
                className="flex-1 py-3.5 sm:py-5 bg-[#2CB432] rounded-[14px] sm:rounded-[24px] text-primary-foreground font-black uppercase tracking-[0.15em] text-[11px] sm:text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#2CB432]/20 disabled:opacity-40 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Submit Payment Code
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      )}
    </>
  );
}
