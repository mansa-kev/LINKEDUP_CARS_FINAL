import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, Loader2, AlertCircle, ArrowRight, Car } from 'lucide-react';
import { motion } from 'motion/react';
import { useSubdomain } from '../../contexts/SubdomainContext';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setPreviewSubdomain } = useSubdomain();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Determine redirect path based on current subdomain
      const hostname = window.location.hostname;
      const isDev = hostname.includes('run.app') || hostname === 'localhost' || hostname.includes('google.com');

      // For development, we'll just use the preview subdomain switcher
      // If they are on www, redirect to app (client portal) by default
      const targetSubdomain = location.pathname.includes('/admin') ? 'admin' 
                            : location.pathname.includes('/fleet') ? 'fleet' 
                            : 'app';

      if (isDev) {
        setPreviewSubdomain(targetSubdomain);
        if (targetSubdomain === 'admin') navigate('/admin');
        else if (targetSubdomain === 'fleet') navigate('/fleet');
        else navigate('/client');
      } else {
        window.location.href = `https://${targetSubdomain}.${hostname.split('.').slice(1).join('.')}/${targetSubdomain === 'app' ? 'client' : targetSubdomain}`;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 pb-0 flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
              <Car size={32} />
            </div>
            <h1 className="text-3xl font-serif font-black tracking-tighter text-foreground italic mb-2">
              LINKEDUP
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Access your command center
            </p>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3 text-error text-sm"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-muted border border-transparent focus:border-primary/30 rounded-xl outline-none transition-all font-medium"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Password
                  </label>
                  <button type="button" className="text-[10px] font-bold text-primary hover:underline">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-muted border border-transparent focus:border-primary/30 rounded-xl outline-none transition-all font-medium"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="p-6 bg-muted/30 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Don't have an account?{' '}
              <button className="font-bold text-primary hover:underline">
                Contact Support
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
