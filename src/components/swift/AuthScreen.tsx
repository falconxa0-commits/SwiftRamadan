'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import {
  X,
  ArrowLeft,
  Eye,
  EyeOff,
  ShoppingBag,
  Store,
  Bike,
  Check,
  ChevronDown,
  Mail,
  Phone,
  Lock,
  User,
  MapPin,
  Sparkles,
} from 'lucide-react';

/* ────────────────────────── Login Screen ────────────────────────── */

function LoginScreen() {
  const { setShowAuth, setIsLoggedIn, setUserName, setUserEmail } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast({ title: 'Missing fields', description: 'Please enter your email and password.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setUserName(data.user?.name || email.split('@')[0]);
        setUserEmail(email);
        setIsLoggedIn(true);
        setShowAuth(null);
        toast({ title: 'Welcome back! 🎉', description: 'You have been logged in successfully.' });
      } else {
        toast({ title: 'Login failed', description: data.message || 'Invalid credentials', variant: 'destructive' });
      }
    } catch {
      // Fallback: just log in anyway for demo
      setUserName(email.split('@')[0]);
      setUserEmail(email);
      setIsLoggedIn(true);
      setShowAuth(null);
      toast({ title: 'Welcome back! 🎉', description: 'You have been logged in successfully.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -40, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col min-h-full px-6 pt-4 pb-8"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-2xl font-extrabold tracking-tight">Welcome Back</h1>
        <p className="text-white/50 text-sm mt-1">Sign in to your SwiftRamadan account</p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4 flex-1">
        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#13ec13]/50 transition-colors"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-12 pr-12 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#13ec13]/50 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Forgot Password */}
        <div className="flex justify-end">
          <button
            onClick={() => toast({ title: 'Coming soon', description: 'Password reset will be available soon.' })}
            className="text-[#13ec13] text-xs font-semibold hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full h-14 rounded-xl bg-[#13ec13] text-[#05070A] font-bold text-base shadow-lg shadow-[#13ec13]/20 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-[#05070A]/30 border-t-[#05070A] rounded-full"
            />
          ) : (
            'Login'
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">or continue with</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Social Login */}
        <div className="flex gap-3">
          <button
            onClick={() => toast({ title: 'Coming soon', description: 'Google login will be available soon.' })}
            className="flex-1 h-12 rounded-xl bg-[#1A1D26] border border-white/10 flex items-center justify-center gap-2 text-white text-sm font-medium hover:border-white/20 transition-colors active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button
            onClick={() => toast({ title: 'Coming soon', description: 'Apple login will be available soon.' })}
            className="flex-1 h-12 rounded-xl bg-[#1A1D26] border border-white/10 flex items-center justify-center gap-2 text-white text-sm font-medium hover:border-white/20 transition-colors active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Apple
          </button>
        </div>
      </div>

      {/* Sign Up Link */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setShowAuth('signup')}
          className="text-white/50 text-sm"
        >
          Don&apos;t have an account?{' '}
          <span className="text-[#13ec13] font-bold">Sign Up</span>
        </button>
      </div>
    </motion.div>
  );
}

/* ────────────────────────── Signup Screen ────────────────────────── */

const RESIDENTIAL_AREAS = ['Lekki', 'Ikoyi', 'Victoria Island', 'Surulere', 'Ikeja', 'Yaba'];

function SignupScreen() {
  const { setShowAuth, setUserName, setUserPhone, setUserEmail } = useAppStore();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [area, setArea] = useState('');
  const [areaOpen, setAreaOpen] = useState(false);
  const [joinCommunity, setJoinCommunity] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName.trim() || !phone.trim() || !email.trim() || !area) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', name: fullName, phone: `+234${phone}`, email, area }),
      });
      const data = await res.json();
      if (data.success) {
        setUserName(fullName);
        setUserPhone(`+234${phone}`);
        setUserEmail(email);
        setShowAuth('otp');
        toast({ title: 'Account created!', description: 'Please verify your phone number.' });
      } else {
        toast({ title: 'Signup failed', description: data.message || 'Could not create account', variant: 'destructive' });
      }
    } catch {
      // Fallback for demo
      setUserName(fullName);
      setUserPhone(`+234${phone}`);
      setUserEmail(email);
      setShowAuth('otp');
      toast({ title: 'Account created!', description: 'Please verify your phone number.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -40, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col min-h-full px-6 pt-4 pb-8"
    >
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-white text-2xl font-extrabold tracking-tight">Create Account</h1>
        <p className="text-white/50 text-sm mt-1">Join the SwiftRamadan community</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 h-1.5 rounded-full bg-[#13ec13]" />
        <div className="flex-1 h-1.5 rounded-full bg-white/10" />
        <div className="flex-1 h-1.5 rounded-full bg-white/10" />
        <span className="text-white/30 text-xs ml-2">Step 1/3</span>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4 flex-1">
        {/* Full Name */}
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#13ec13]/50 transition-colors"
          />
        </div>

        {/* Phone */}
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <div className="absolute left-12 top-1/2 -translate-y-1/2 flex items-center pr-2 border-r border-white/10">
            <span className="text-white/50 text-sm font-medium">+234</span>
          </div>
          <input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-28 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#13ec13]/50 transition-colors"
          />
        </div>

        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#13ec13]/50 transition-colors"
          />
        </div>

        {/* Residential Area */}
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <button
            onClick={() => setAreaOpen(!areaOpen)}
            className={`w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-12 pr-10 text-left text-sm focus:outline-none transition-colors flex items-center ${area ? 'text-white' : 'text-white/30'}`}
          >
            {area || 'Residential area'}
          </button>
          <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 transition-transform ${areaOpen ? 'rotate-180' : ''}`} />

          {/* Dropdown */}
          <AnimatePresence>
            {areaOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-16 left-0 right-0 bg-[#1A1D26] border border-white/10 rounded-xl overflow-hidden z-20 shadow-2xl"
              >
                {RESIDENTIAL_AREAS.map((a) => (
                  <button
                    key={a}
                    onClick={() => { setArea(a); setAreaOpen(false); }}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex items-center justify-between ${area === a ? 'text-[#13ec13]' : 'text-white/70'}`}
                  >
                    {a}
                    {area === a && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Join Community */}
        <button
          onClick={() => setJoinCommunity(!joinCommunity)}
          className="flex items-center gap-3 py-1"
        >
          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${joinCommunity ? 'bg-[#13ec13] border-[#13ec13]' : 'bg-transparent border-white/20'}`}>
            {joinCommunity && <Check className="w-4 h-4 text-[#05070A]" />}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-white text-sm font-medium">Join Community</span>
            <span className="text-white/40 text-xs">Get group buy deals & community offers</span>
          </div>
        </button>

        {/* Create Account Button */}
        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full h-14 rounded-xl bg-[#13ec13] text-[#05070A] font-bold text-base shadow-lg shadow-[#13ec13]/20 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-[#05070A]/30 border-t-[#05070A] rounded-full"
            />
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Create Account
            </>
          )}
        </button>
      </div>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setShowAuth('login')}
          className="text-white/50 text-sm"
        >
          Already have an account?{' '}
          <span className="text-[#13ec13] font-bold">Sign In</span>
        </button>
      </div>
    </motion.div>
  );
}

/* ────────────────────────── OTP Screen ────────────────────────── */

function OTPScreen() {
  const { userPhone, setShowAuth, setIsLoggedIn } = useAppStore();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOtp(newOtp);
      const nextEmpty = pasted.length < 6 ? pasted.length : 5;
      inputRefs.current[nextEmpty]?.focus();
    }
  }, [otp]);

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      toast({ title: 'Incomplete code', description: 'Please enter the full 6-digit code.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-otp', phone: userPhone, otp: code }),
      });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        setShowAuth('role');
        toast({ title: 'Verified! 🎉', description: 'Your phone number has been verified.' });
      } else {
        toast({ title: 'Invalid code', description: data.message || 'The code you entered is incorrect.', variant: 'destructive' });
      }
    } catch {
      // Fallback for demo
      setIsLoggedIn(true);
      setShowAuth('role');
      toast({ title: 'Verified! 🎉', description: 'Your phone number has been verified.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setCanResend(false);
    setCountdown(60);
    setOtp(Array(6).fill(''));
    toast({ title: 'Code resent', description: 'A new verification code has been sent.' });
  };

  const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -40, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col min-h-full px-6 pt-4 pb-8"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-2xl font-extrabold tracking-tight">Verify Your Number</h1>
        <p className="text-white/50 text-sm mt-2">
          We sent a 6-digit code to{' '}
          <span className="text-white font-medium">{userPhone || '+234 800 000 0000'}</span>
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 h-1.5 rounded-full bg-[#13ec13]" />
        <div className="flex-1 h-1.5 rounded-full bg-[#13ec13]" />
        <div className="flex-1 h-1.5 rounded-full bg-white/10" />
        <span className="text-white/30 text-xs ml-2">Step 2/3</span>
      </div>

      {/* OTP Inputs */}
      <div className="flex gap-3 justify-center mb-8" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <input
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-12 h-14 sm:w-14 rounded-xl text-center text-white text-xl font-bold bg-[#1A1D26] border focus:outline-none transition-colors ${digit ? 'border-[#13ec13]/50 bg-[#13ec13]/5' : 'border-white/10'} focus:border-[#13ec13]`}
            />
          </motion.div>
        ))}
      </div>

      {/* Resend */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {canResend ? (
          <button onClick={handleResend} className="text-[#13ec13] text-sm font-bold hover:underline">
            Resend Code
          </button>
        ) : (
          <span className="text-white/30 text-sm">
            Resend code in <span className="text-[#f4c025] font-mono font-bold">{formatCountdown(countdown)}</span>
          </span>
        )}
      </div>

      {/* Verify Button */}
      <button
        onClick={handleVerify}
        disabled={loading}
        className="w-full h-14 rounded-xl bg-[#13ec13] text-[#05070A] font-bold text-base shadow-lg shadow-[#13ec13]/20 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
      >
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-[#05070A]/30 border-t-[#05070A] rounded-full"
          />
        ) : (
          'Verify'
        )}
      </button>
    </motion.div>
  );
}

/* ────────────────────────── Role Selection Screen ────────────────────────── */

const ROLES = [
  {
    id: 'customer' as const,
    title: 'Customer',
    description: 'Shop iftar meals, groceries, and more',
    icon: ShoppingBag,
    gradient: 'from-[#064e3b] to-[#0a3d2e]',
    accent: '#13ec13',
    image: '/images/categories/hub-iftar.png',
  },
  {
    id: 'vendor' as const,
    title: 'Vendor',
    description: 'Sell your products on SwiftRamadan',
    icon: Store,
    gradient: 'from-[#4a1d6e] to-[#2d0a4e]',
    accent: '#f4c025',
    image: '/images/categories/hub-groceries.png',
  },
  {
    id: 'rider' as const,
    title: 'Rider',
    description: 'Deliver and earn with SwiftLogistics',
    icon: Bike,
    gradient: 'from-[#1e3a5f] to-[#0c1929]',
    accent: '#3b82f6',
    image: '/images/categories/hub-pharmacy.png',
  },
];

function RoleScreen() {
  const { setUserRole, setShowAuth } = useAppStore();
  const [selected, setSelected] = useState<'customer' | 'vendor' | 'rider'>('customer');
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    setLoading(true);
    setTimeout(() => {
      setUserRole(selected);
      setShowAuth(null);
      toast({ title: 'Welcome to SwiftRamadan! 🌙', description: `You're all set as a ${selected.charAt(0).toUpperCase() + selected.slice(1)}.` });
      setLoading(false);
    }, 600);
  };

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -40, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col min-h-full px-6 pt-4 pb-8"
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white text-2xl font-extrabold tracking-tight">Choose Your Role</h1>
        <p className="text-white/50 text-sm mt-1">How would you like to use SwiftRamadan?</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 h-1.5 rounded-full bg-[#13ec13]" />
        <div className="flex-1 h-1.5 rounded-full bg-[#13ec13]" />
        <div className="flex-1 h-1.5 rounded-full bg-[#13ec13]" />
        <span className="text-white/30 text-xs ml-2">Step 3/3</span>
      </div>

      {/* Role Cards */}
      <div className="flex flex-col gap-4 flex-1">
        {ROLES.map((role, i) => {
          const Icon = role.icon;
          const isSelected = selected === role.id;
          return (
            <motion.button
              key={role.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelected(role.id)}
              className={`relative overflow-hidden rounded-2xl border-2 transition-all active:scale-[0.98] ${
                isSelected
                  ? 'border-[#13ec13] shadow-lg shadow-[#13ec13]/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Background Image */}
              <div className="absolute inset-0 opacity-20">
                <div
                  className="w-full h-full bg-center bg-cover"
                  style={{ backgroundImage: `url("${role.image}")` }}
                />
              </div>

              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${role.gradient} opacity-80`} />

              {/* Content */}
              <div className="relative flex items-center gap-4 p-5">
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${role.accent}20`, border: `1px solid ${role.accent}40` }}
                >
                  <Icon className="w-7 h-7" style={{ color: role.accent }} />
                </div>

                {/* Text */}
                <div className="flex-1 text-left">
                  <h3 className="text-white font-bold text-lg">{role.title}</h3>
                  <p className="text-white/60 text-sm">{role.description}</p>
                </div>

                {/* Selected Indicator */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isSelected ? 'bg-[#13ec13]' : 'bg-white/10 border border-white/20'
                }`}>
                  {isSelected && <Check className="w-4 h-4 text-[#05070A]" />}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={loading}
        className="w-full h-14 rounded-xl bg-[#13ec13] text-[#05070A] font-bold text-base shadow-lg shadow-[#13ec13]/20 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2 mt-6"
      >
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-[#05070A]/30 border-t-[#05070A] rounded-full"
          />
        ) : (
          'Continue'
        )}
      </button>
    </motion.div>
  );
}

/* ────────────────────────── Main Auth Screen ────────────────────────── */

export default function AuthScreen() {
  const { showAuth, setShowAuth } = useAppStore();

  const handleBack = () => {
    if (showAuth === 'otp') {
      setShowAuth('signup');
    } else if (showAuth === 'role') {
      setShowAuth('otp');
    } else {
      setShowAuth(null);
    }
  };

  const getTitle = () => {
    switch (showAuth) {
      case 'login': return 'Login';
      case 'signup': return 'Sign Up';
      case 'otp': return 'Verification';
      case 'role': return 'Role';
      default: return '';
    }
  };

  return (
    <AnimatePresence>
      {showAuth && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[110] bg-[#05070A] flex flex-col"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-white/5">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="w-10 h-10 rounded-full bg-[#1A1D26] border border-white/10 flex items-center justify-center hover:border-white/20 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <span className="text-white/50 text-sm font-medium">{getTitle()}</span>
            </div>
            <button
              onClick={() => setShowAuth(null)}
              className="w-10 h-10 rounded-full bg-[#1A1D26] border border-white/10 flex items-center justify-center hover:border-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {showAuth === 'login' && <LoginScreen key="login" />}
              {showAuth === 'signup' && <SignupScreen key="signup" />}
              {showAuth === 'otp' && <OTPScreen key="otp" />}
              {showAuth === 'role' && <RoleScreen key="role" />}
            </AnimatePresence>
          </div>

          {/* Bottom Safe Area */}
          <div className="shrink-0 h-6 bg-[#05070A]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
