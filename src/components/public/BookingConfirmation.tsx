import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Car, CheckCircle2, Download, Calendar, MapPin, CreditCard, FileText, ShieldCheck, Clock, AlertCircle, UserPlus, ArrowRight, Loader2 } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export function BookingConfirmation() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function fetchBooking() {
      if (!bookingId) return;
      try {
        const data = await bookingService.getBookingById(bookingId);
        setBooking(data);
        if (data?.metadata?.guest_info?.email) {
          setEmail(data.metadata.guest_info.email);
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [bookingId]);

  const [creatingAccount, setCreatingAccount] = useState(false);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setCreatingAccount(true);
    try {
      // Sign up with Supabase Auth
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/login`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user profile with guest info from booking
        const guestInfo = booking?.metadata?.guest_info;
        await supabase.from('user_profiles').upsert({
          id: authData.user.id,
          email,
          full_name: guestInfo?.full_name || '',
          phone_number: guestInfo?.phone || '',
          license_number: guestInfo?.license_number || '',
          role: 'client',
        });

        // Link the booking to the new user account
        if (bookingId) {
          await supabase
            .from('bookings')
            .update({ client_id: authData.user.id })
            .eq('id', bookingId);
        }

        toast.success('Account created successfully! Welcome to the family.');
        navigate('/client');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account. Please try again.');
    } finally {
      setCreatingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-6 space-y-12">
        {/* Success Header */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative p-12 rounded-[48px] bg-card border border-white/5 text-center overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="text-primary" size={48} />
          </div>
          <h1 className="text-5xl font-serif font-black italic text-white mb-4 tracking-tight">Booking Confirmed!</h1>
          <p className="text-primary font-black uppercase tracking-[0.3em] text-sm mb-8">Your Adventure Awaits</p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="px-6 py-3 bg-white/5 rounded-full border border-white/10 text-xs font-bold text-white/60">
              Booking ID: <span className="text-white">{bookingId}</span>
            </div>
            <div className="px-6 py-3 bg-white/5 rounded-full border border-white/10 text-xs font-bold text-white/60">
              Status: <span className="text-primary uppercase">{booking?.status?.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Contract Status */}
          {booking?.contract_signed && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 bg-success/5 rounded-[24px] border border-success/20 space-y-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="text-success" size={20} />
                <div>
                  <p className="text-sm font-bold text-success">Contract Secured</p>
                  <p className="text-xs text-success/80">Digital signature captured and stored</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-success" size={16} />
                <p className="text-xs text-success/80">Payment authorization hold active</p>
              </div>
            </motion.div>
          )}

          <button className="px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full flex items-center gap-3 mx-auto hover:bg-primary transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/5">
            <Download size={18} /> Download Rental Contract
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Booking Summary */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-10 rounded-[40px] bg-card border border-white/5 space-y-8"
          >
            <h2 className="text-2xl font-serif font-black italic text-white">Trip Summary</h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary shrink-0">
                  <Car size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Vehicle</p>
                  <p className="text-sm font-bold text-white">{booking?.cars?.make} {booking?.cars?.model} ({booking?.cars?.year})</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Rental Period</p>
                  <p className="text-sm font-bold text-white">{booking?.start_date} — {booking?.end_date}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Pickup Location</p>
                  <p className="text-sm font-bold text-white">{booking?.pickup_location}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Fully Insured</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Total Paid</p>
                  <p className="text-2xl font-black text-white">KES {booking?.total_amount?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Account Creation */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-10 rounded-[40px] bg-primary/5 border border-primary/10 space-y-8"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <UserPlus size={24} />
              </div>
              <h2 className="text-2xl font-serif font-black italic text-white">Unlock VIP Access</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Convert your guest booking into a permanent account to track your rentals, manage documents, and unlock exclusive loyalty rewards.
              </p>
            </div>
            
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <input 
                type="email" placeholder="Email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-[20px] text-sm text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="password" placeholder="Password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-[20px] text-sm text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <input 
                  type="password" placeholder="Confirm" required
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-[20px] text-sm text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={creatingAccount}
                className="w-full py-5 bg-primary rounded-[24px] text-black font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 group disabled:opacity-50"
              >
                {creatingAccount ? (
                  <><Loader2 className="animate-spin" size={18} /> Creating Account...</>
                ) : (
                  <>Create My Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>

            <p className="text-[10px] text-center text-white/40 font-bold uppercase tracking-widest">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Sign In</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
