import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, Loader2, AlertCircle, ArrowRight, Car, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useSubdomain } from '../../contexts/SubdomainContext';

interface RateLimitState {
  attempts: number;
  lockoutUntil: number | null;
}

const RATE_LIMIT_KEY = 'login_rate_limit';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setPreviewSubdomain } = useSubdomain();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    attempts: 0,
    lockoutUntil: null
  });

  // Load rate limit state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setRateLimitState(parsed);
    }
  }, []);

  // Check if user is currently locked out
  const isLockedOut = () => {
    if (!rateLimitState.lockoutUntil) return false;
    return Date.now() < rateLimitState.lockoutUntil;
  };

  // Get remaining lockout time in minutes
  const getRemainingLockoutTime = () => {
    if (!rateLimitState.lockoutUntil) return 0;
    const remaining = rateLimitState.lockoutUntil - Date.now();
    return Math.ceil(remaining / (60 * 1000));
  };

  // Update rate limit state in localStorage
  const updateRateLimitState = (newState: RateLimitState) => {
    setRateLimitState(newState);
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newState));
  };

  // Increment login attempts
  const incrementAttempts = () => {
    const newAttempts = rateLimitState.attempts + 1;
    
    if (newAttempts >= MAX_ATTEMPTS) {
      // Lock out the user
      const lockoutUntil = Date.now() + LOCKOUT_DURATION;
      updateRateLimitState({
        attempts: newAttempts,
        lockoutUntil
      });
      setError(`Too many failed attempts. Account locked for ${LOCKOUT_DURATION / (60 * 1000)} minutes.`);
    } else {
      updateRateLimitState({
        attempts: newAttempts,
        lockoutUntil: rateLimitState.lockoutUntil
      });
    }
  };

  // Reset rate limit on successful login
  const resetRateLimit = () => {
    updateRateLimitState({
      attempts: 0,
      lockoutUntil: null
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Check rate limiting first
    if (isLockedOut()) {
      const remainingTime = getRemainingLockoutTime();
      setError(`Account locked. Try again in ${remainingTime} minutes.`);
      setLoading(false);
      return;
    }

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      // Real authentication with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Supabase auth error:', signInError);
        incrementAttempts(); // Increment failed attempts
        setError(signInError.message || 'Invalid email or password');
        return;
      }

      if (data.user) {
        // Reset rate limit on successful login
        resetRateLimit();
        
        // Get user profile to determine role
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setError('Unable to fetch user profile. Please contact support.');
          return;
        }

        // Determine redirect path based on user role
        const userRole = profile?.role || 'client';
        const targetSubdomain = location.pathname.includes('/admin') ? 'admin' 
                              : location.pathname.includes('/fleet') ? 'fleet' 
                              : userRole === 'admin' ? 'admin'
                              : userRole === 'fleet_owner' ? 'fleet'
                              : 'app';

        const hostname = window.location.hostname;
        const isDev = hostname.includes('run.app') || hostname === 'localhost' || hostname.includes('google.com');

        if (isDev) {
          setPreviewSubdomain(targetSubdomain);
          if (targetSubdomain === 'admin') navigate('/admin');
          else if (targetSubdomain === 'fleet') navigate('/fleet');
          else navigate('/client');
        } else {
          window.location.href = `https://${targetSubdomain}.${hostname.split('.').slice(1).join('.')}/${targetSubdomain === 'app' ? 'client' : targetSubdomain}`;
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      incrementAttempts(); // Increment failed attempts for system errors too
      setError('An unexpected error occurred. Please try again.');
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

            {/* Rate Limiting Warning */}
            {isLockedOut() && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800"
              >
                <Clock className="flex-shrink-0" size={18} />
                <div className="text-sm">
                  <div className="font-semibold">Account Temporarily Locked</div>
                  <div>Too many failed login attempts. Please try again in {getRemainingLockoutTime()} minutes.</div>
                </div>
              </motion.div>
            )}

            {/* Remaining Attempts Warning */}
            {!isLockedOut() && rateLimitState.attempts > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3 text-orange-800 text-sm"
              >
                <AlertCircle className="flex-shrink-0" size={16} />
                <div>
                  {MAX_ATTEMPTS - rateLimitState.attempts} attempts remaining before account lockout.
                </div>
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
              disabled={loading || isLockedOut()}
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
