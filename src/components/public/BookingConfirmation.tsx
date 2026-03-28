import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, Download, UserPlus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export function BookingConfirmation() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    // Logic to create account and link guest data
    toast.success('Account created successfully!');
    navigate('/client');
  };

  return (
    <div className="pt-32 pb-20 bg-background min-h-screen">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 rounded-[40px] bg-card border border-white/5 text-center"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="text-primary" size={48} />
          </div>
          <h1 className="text-4xl font-serif font-black italic text-white mb-4">Booking Confirmed! Your Adventure Awaits.</h1>
          <p className="text-muted-foreground mb-8">Booking ID: {bookingId}</p>
          
          <button className="px-8 py-4 bg-white/5 rounded-2xl text-white font-bold flex items-center gap-2 mx-auto hover:bg-white/10 transition-all">
            <Download size={18} /> Download Contract (PDF)
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 p-12 rounded-[40px] bg-card border border-white/5"
        >
          <div className="flex items-center gap-4 mb-6">
            <UserPlus className="text-primary" size={32} />
            <h2 className="text-2xl font-serif font-black italic text-white">Want to make your next booking even faster?</h2>
          </div>
          <p className="text-muted-foreground mb-8">Create an account now and save your details for 1-click bookings, track past rentals, and unlock exclusive discounts.</p>
          
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <input 
              type="email" 
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none"
            />
            <input 
              type="password" 
              placeholder="Set Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none"
            />
            <input 
              type="password" 
              placeholder="Confirm Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none"
            />
            <button 
              type="submit"
              className="w-full py-6 bg-primary rounded-2xl text-black font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-primary/90 transition-all"
            >
              Create My Account <ArrowRight size={18} />
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
