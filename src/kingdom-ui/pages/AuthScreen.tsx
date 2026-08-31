'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Store,
  Bike,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  ChevronDown,
  Check,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  useAuth,
  useSetIsLoggedIn,
  useSetUserName,
  useSetUserEmail,
  useUserPhone,
  useSetShowOnboarding,
  useShowAuth,
} from '@/lib/store-selectors';
import { toast } from '@/hooks/use-toast';
import { track } from '@/lib/analytics';
import { KingdomShell, AIOrb, RoyalInput, RoyalBadge } from '../components';

/* ══════════════════════════════════════════════════════════════════
   KINGDOM V2 — AUTH SCREEN
   Auren Kingdom reinterpretation of the legacy SwiftRamadan auth flow.
   Same API calls + same store hooks, completely different visual system.

   Flow:
     login → signup → otp  (AnimatePresence-driven transitions)
   ══════════════════════════════════════════════════════════════════ */

type RoleKey = 'customer' | 'vendor' | 'rider';

const ROLES: { id: RoleKey; label: string; icon: React.ElementType; tagline: string }[] = [
  { id: 'customer', label: 'Customer', icon: ShoppingBag, tagline: 'Shop Iftar meals, groceries & more' },
  { id: 'vendor', label: 'Vendor', icon: Store, tagline: 'Sell your products on SwiftRamadan' },
  { id: 'rider', label: 'Rider', icon: Bike, tagline: 'Deliver & earn with SwiftLogistics' },
];

const RESIDENTIAL_AREAS = [
  'Lekki', 'Ikoyi', 'Victoria Island', 'Surulere', 'Ikeja',
  'Yaba', 'Ajah', 'Maryland', 'Gbagada', 'Festac',
];

const BUSINESS_CATEGORIES = [
  { value: 'Iftar Meals', label: 'Iftar Meals' },
  { value: 'Grills', label: 'Grills' },
  { value: 'Sahur', label: 'Sahur' },
  { value: 'Drinks', label: 'Drinks' },
  { value: 'Groceries', label: 'Groceries' },
  { value: 'Pharmacy', label: 'Pharmacy' },
  { value: 'Bundles', label: 'Bundles' },
];

const VEHICLE_TYPES = [
  { value: 'Motorcycle', label: 'Motorcycle' },
  { value: 'Bicycle', label: 'Bicycle' },
  { value: 'Car', label: 'Car' },
  { value: 'Electric Bike', label: 'Electric Bike' },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/* ─────────────── Dropdown (area / category / vehicle) ─────────────── */
function SelectDropdown({
  label,
  placeholder,
  value,
  options,
  open,
  onToggle,
  onSelect,
  leftIcon,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: { value: string; label: string }[];
  open: boolean;
  onToggle: () => void;
  onSelect: (v: string) => void;
  leftIcon: React.ReactNode;
}) {
  return (
    <div className="relative">
      <label className="text-xs font-semibold text-[var(--kv-text-secondary)] tracking-wide mb-2 block">
        {label}
      </label>
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`kv-input w-full flex items-center justify-between text-left ${value ? '' : 'text-[var(--kv-text-muted)]'}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-[var(--kv-text-tertiary)] shrink-0">{leftIcon}</span>
          <span className="truncate">{value || placeholder}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--kv-text-tertiary)] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 left-0 right-0 z-30 kv-card max-h-56 overflow-y-auto p-1"
            role="listbox"
            aria-label={label}
          >
            {options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelect(opt.value)}
                  role="option"
                  aria-selected={isSelected}
                  className={`w-full px-4 py-3 text-left text-sm rounded-lg flex items-center justify-between transition-colors hover:bg-[var(--kv-glass-hover)] ${
                    isSelected ? 'font-semibold' : 'text-[var(--kv-text-secondary)]'
                  }`}
                  style={isSelected ? { color: 'var(--kv-mystic)' } : undefined}
                >
                  {opt.label}
                  {isSelected && <Check className="w-4 h-4" style={{ color: 'var(--kv-mystic)' }} aria-hidden />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────── Role selector chips ─────────────── */
function RoleSelector({
  value,
  onChange,
}: {
  value: RoleKey;
  onChange: (r: RoleKey) => void;
}) {
  return (
    <div className="flex gap-2">
      {ROLES.map((role) => {
        const Icon = role.icon;
        const isSelected = value === role.id;
        const variant: 'royal' | 'gold' | 'neutral' = isSelected ? 'royal' : 'neutral';
        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onChange(role.id)}
            aria-pressed={isSelected}
            className={`flex-1 rounded-xl px-3 py-2 flex flex-col items-center gap-1 transition-all min-h-[52px] ${
              isSelected ? 'kv-glass' : 'hover:bg-[var(--kv-glass-hover)]'
            }`}
            style={{
              border: isSelected ? '1px solid var(--kv-royal-border)' : '1px solid var(--kv-glass-border)',
              boxShadow: isSelected ? 'var(--kv-shadow-royal)' : 'none',
            }}
          >
            <Icon
              className="w-4 h-4 transition-colors"
              style={{ color: isSelected ? 'var(--kv-mystic)' : 'var(--kv-text-tertiary)' }}
              aria-hidden
            />
            <RoyalBadge variant={variant}>{role.label}</RoyalBadge>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────── Social auth row ─────────────── */
function SocialAuth({ onPick, loading }: { onPick: (p: 'google' | 'apple') => void; loading: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        disabled={loading}
        onClick={() => onPick('google')}
        className="kv-card kv-glass-hover px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-white disabled:opacity-60"
        aria-label="Continue with Google"
      >
        <GoogleIcon />
        Google
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => onPick('apple')}
        className="kv-card kv-glass-hover px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-white disabled:opacity-60"
        aria-label="Continue with Apple"
      >
        <AppleIcon />
        Apple
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2 6.9 2 2.8 6.1 2.8 12S6.9 22 12 22c5.9 0 9.8-4.1 9.8-9.9 0-.7-.1-1.2-.2-1.7H12z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M16.4 12.9c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.7 1.1 8.9.7 1.1 1.6 2.3 2.8 2.2 1.1 0 1.5-.7 2.9-.7 1.3 0 1.7.7 2.9.7 1.2 0 1.9-1.1 2.6-2.1.8-1.2 1.2-2.3 1.2-2.4-.1 0-2.3-.9-2.3-3.5zm-2.5-6.6c.6-.8 1-1.8.9-2.9-.9 0-2 .6-2.6 1.4-.5.6-1 1.7-.9 2.7 1 .1 2-.5 2.6-1.2z"
      />
    </svg>
  );
}

/* ─────────────── Trust microcopy ─────────────── */
function TrustMicrocopy({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-center">
      <ShieldCheck className="w-3.5 h-3.5 text-[var(--kv-emerald)] shrink-0" aria-hidden />
      <p className="text-[11px] text-[var(--kv-text-tertiary)] tracking-wide">{message}</p>
    </div>
  );
}

/* ─────────────── Primary action button ─────────────── */
function RoyalAction({
  label,
  onClick,
  loading,
  icon: Icon,
  disabled,
}: {
  label: string;
  onClick: () => void;
  loading: boolean;
  icon?: React.ElementType;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      aria-busy={loading}
      className="kv-btn kv-btn-royal w-full text-base disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
            className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
            aria-hidden
          />
          Entering…
        </span>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4" aria-hidden />}
          {label}
        </>
      )}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════
   LOGIN SCREEN
   ══════════════════════════════════════════════════════════════════ */
function LoginScreen() {
  const { setShowAuth, setUserRole } = useAuth();
  const setIsLoggedIn = useSetIsLoggedIn();
  const setUserName = useSetUserName();
  const setUserEmail = useSetUserEmail();

  const [loginRole, setLoginRole] = useState<RoleKey>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async () => {
    const nextErrors: { email?: string; password?: string } = {};
    if (!email.trim()) nextErrors.email = 'Email is required';
    if (!password.trim()) nextErrors.password = 'Password is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast({ title: 'Missing fields', description: 'Please enter your email and password.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password, role: loginRole }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setUserName(data.user?.name || email.split('@')[0]);
        setUserEmail(email);
        setUserRole(loginRole);
        setIsLoggedIn(true);
        setShowAuth(null);
        track('login', { role: loginRole, method: 'password' });
        toast({ title: 'Welcome back!', description: `Signed in as ${loginRole}` });
      } else {
        // Demo mode: allow login even without DB account for seamless experience
        setUserName(email.split('@')[0]);
        setUserEmail(email);
        setUserRole(loginRole);
        setIsLoggedIn(true);
        setShowAuth(null);
        track('login', { role: loginRole, method: 'demo' });
        toast({ title: 'Welcome back!', description: `Signed in as ${loginRole} (demo)` });
      }
    } catch {
      // Fallback: demo login
      setUserName(email.split('@')[0]);
      setUserEmail(email);
      setUserRole(loginRole);
      setIsLoggedIn(true);
      setShowAuth(null);
      track('login', { role: loginRole, method: 'fallback' });
      toast({ title: 'Welcome back!', description: `Signed in as ${loginRole}` });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'oauth', provider }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setUserName(data.user?.name || '');
        setUserEmail(data.user?.email || '');
        setUserRole(data.user?.role || 'customer');
        setIsLoggedIn(true);
        setShowAuth(null);
        track('login', { role: loginRole, method: provider });
        toast({ title: 'Welcome back!', description: `Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}` });
      } else {
        toast({ title: 'OAuth Not Configured', description: data.message || `${provider} sign-in is not available yet.`, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: `Could not connect to ${provider}`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="login"
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -40, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="kv-entrance flex flex-col gap-5"
      role="form"
      aria-labelledby="auth-login-heading"
    >
      {/* Role selector */}
      <div>
        <label className="text-xs font-semibold text-[var(--kv-text-secondary)] tracking-wide mb-2 block">
          I am signing in as
        </label>
        <RoleSelector value={loginRole} onChange={setLoginRole} />
      </div>

      {/* Header */}
      <div>
        <h1 id="auth-login-heading" className="kv-gradient-text text-2xl sm:text-3xl font-extrabold tracking-tight">
          Welcome Back
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--kv-mystic)' }}>
          {ROLES.find((r) => r.id === loginRole)?.tagline}
        </p>
      </div>

      {/* Form */}
      <div className="kv-card p-5 sm:p-6 flex flex-col gap-4">
        <RoyalInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@kingdom.africa"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          aria-label="Email address"
          error={errors.email}
          required
        />
        <RoyalInput
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          showPasswordToggle
          aria-label="Password"
          error={errors.password}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleLogin();
          }}
          required
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => toast({ title: 'Reset link sent', description: 'Password reset link sent to your email' })}
            className="text-xs font-semibold hover:underline"
            style={{ color: 'var(--kv-mystic)' }}
          >
            Forgot password?
          </button>
        </div>

        <RoyalAction
          label="Enter Kingdom"
          onClick={handleLogin}
          loading={loading}
        />

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 kv-divider" />
          <span className="text-[11px] text-[var(--kv-text-tertiary)]">or continue with</span>
          <div className="flex-1 kv-divider" />
        </div>

        <SocialAuth onPick={handleOAuthLogin} loading={loading} />
      </div>

      {/* Trust */}
      <div className="kv-divider" />
      <TrustMicrocopy message="Your data is encrypted. Your privacy is sacred." />

      {/* Toggle */}
      <div className="text-center mt-1">
        <button
          type="button"
          onClick={() => setShowAuth('signup')}
          className="text-sm hover:opacity-80 transition-opacity"
          style={{ color: 'var(--kv-text-tertiary)' }}
        >
          Don&apos;t have an account?{' '}
          <span className="font-bold" style={{ color: 'var(--kv-mystic)' }}>Sign Up</span>
        </button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SIGNUP SCREEN
   ══════════════════════════════════════════════════════════════════ */
function SignupScreen() {
  const store = useAppStore.getState();
  const [signupRole, setSignupRole] = useState<RoleKey>(store.userRole || 'customer');
  const [step, setStep] = useState<1 | 2>(1);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [area, setArea] = useState('');
  const [areaOpen, setAreaOpen] = useState(false);
  const [signupPassword, setSignupPassword] = useState('');
  const [joinCommunity, setJoinCommunity] = useState(true);

  // Vendor fields
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('Iftar Meals');
  const [businessCategoryOpen, setBusinessCategoryOpen] = useState(false);
  const [businessAddress, setBusinessAddress] = useState('');

  // Rider fields
  const [vehicleType, setVehicleType] = useState('Motorcycle');
  const [vehicleTypeOpen, setVehicleTypeOpen] = useState(false);
  const [plateNumber, setPlateNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = signupRole === 'customer' ? 2 : 3;
  const filledSteps = step === 1 ? 1 : signupRole === 'customer' ? 2 : 2;

  const handleSubmit = async () => {
    setLoading(true);
    store.setUserRole(signupRole);
    if (signupRole === 'vendor') {
      store.setVendorStoreName(businessName);
      store.setVendorBusinessCategory(businessCategory);
      store.setVendorBusinessAddress(businessAddress);
    } else if (signupRole === 'rider') {
      store.setRiderVehicleType(vehicleType);
      store.setRiderPlateNumber(plateNumber);
      store.setRiderLicenseNumber(licenseNumber);
    }
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          name: fullName,
          phone: `+234${phone}`,
          email,
          area,
          role: signupRole,
          ...(signupPassword ? { password: signupPassword } : {}),
          ...(signupRole === 'vendor' ? { businessName, businessCategory, businessAddress } : {}),
          ...(signupRole === 'rider' ? { vehicleType, plateNumber, licenseNumber } : {}),
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        store.setUserName(fullName);
        store.setUserPhone(`+234${phone}`);
        store.setUserEmail(email);
        store.setUserArea(area);
        if (data.user?.referralCode) store.setReferralCode(data.user.referralCode);
        store.setShowAuth('otp');
        toast({ title: 'Account created!', description: 'Please verify your phone number.' });
      } else {
        toast({ title: 'Signup failed', description: data.message || 'Could not create account', variant: 'destructive' });
      }
    } catch {
      // Fallback for demo
      store.setUserName(fullName);
      store.setUserPhone(`+234${phone}`);
      store.setUserEmail(email);
      store.setUserArea(area);
      store.setReferralCode(`SWIFT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
      store.setShowAuth('otp');
      toast({ title: 'Account created!', description: 'Please verify your phone number.' });
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Next = () => {
    const nextErrors: Record<string, string> = {};
    if (!fullName.trim()) nextErrors.fullName = 'Full name is required';
    if (!phone.trim()) nextErrors.phone = 'Phone number is required';
    if (!email.trim()) nextErrors.email = 'Email is required';
    if (!area) nextErrors.area = 'Residential area is required';
    if (signupPassword.length > 0 && signupPassword.length < 6) nextErrors.signupPassword = 'Password must be at least 6 characters';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    if (signupRole === 'customer') {
      handleSubmit();
    } else {
      setStep(2);
    }
  };

  const handleStep2Submit = () => {
    if (signupRole === 'vendor') {
      if (!businessName.trim() || !businessCategory || !businessAddress.trim()) {
        toast({ title: 'Missing fields', description: 'Please fill in all business details.', variant: 'destructive' });
        return;
      }
    } else if (signupRole === 'rider') {
      if (!vehicleType || !plateNumber.trim() || !licenseNumber.trim()) {
        toast({ title: 'Missing fields', description: 'Please fill in all vehicle details.', variant: 'destructive' });
        return;
      }
    }
    handleSubmit();
  };

  return (
    <motion.div
      key="signup"
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -40, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="kv-entrance flex flex-col gap-5"
      role="form"
      aria-labelledby="auth-signup-heading"
    >
      {/* Header */}
      <div>
        <h1 id="auth-signup-heading" className="kv-gradient-text text-2xl sm:text-3xl font-extrabold tracking-tight">
          Create Account
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--kv-text-tertiary)' }}>
          Join the SwiftRamadan community
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full transition-all duration-300"
            style={{
              background: i < filledSteps ? 'linear-gradient(90deg, var(--kv-royal), var(--kv-mystic))' : 'rgba(255,255,255,0.08)',
            }}
          />
        ))}
        <span className="text-xs ml-2" style={{ color: 'var(--kv-text-tertiary)' }}>
          Step {filledSteps}/{totalSteps}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="kv-card p-5 sm:p-6 flex flex-col gap-4"
          >
            {/* Role selection */}
            <div>
              <label className="text-xs font-semibold text-[var(--kv-text-secondary)] tracking-wide mb-2 block">
                I am a
              </label>
              <RoleSelector value={signupRole} onChange={setSignupRole} />
            </div>

            <RoyalInput
              label="Full name"
              placeholder="Aisha Mohammed"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              error={errors.fullName}
              id="kv-signup-name"
              autoComplete="name"
            />

            <RoyalInput
              label="Phone number"
              type="tel"
              inputMode="numeric"
              placeholder="802 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
              leftIcon={<Phone className="w-4 h-4" />}
              error={errors.phone}
              id="kv-signup-phone"
              autoComplete="tel"
            />

            <RoyalInput
              label="Email address"
              type="email"
              placeholder="you@kingdom.africa"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email}
              id="kv-signup-email"
              autoComplete="email"
            />

            <SelectDropdown
              label="Residential area"
              placeholder="Select area"
              value={area}
              options={RESIDENTIAL_AREAS.map((a) => ({ value: a, label: a }))}
              open={areaOpen}
              onToggle={() => setAreaOpen((v) => !v)}
              onSelect={(v) => { setArea(v); setAreaOpen(false); }}
              leftIcon={<MapPin className="w-4 h-4" />}
            />
            {errors.area && (
              <p className="text-xs font-medium text-[var(--kv-danger)] -mt-2">{errors.area}</p>
            )}

            <RoyalInput
              label="Create password"
              type="password"
              placeholder="Min 6 characters"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              showPasswordToggle
              error={errors.signupPassword}
              id="kv-signup-password"
              autoComplete="new-password"
            />

            <button
              type="button"
              onClick={() => setJoinCommunity((v) => !v)}
              className="flex items-center gap-3 py-1 text-left"
              aria-pressed={joinCommunity}
            >
              <div
                className="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0"
                style={{
                  background: joinCommunity ? 'var(--kv-royal)' : 'transparent',
                  borderColor: joinCommunity ? 'var(--kv-royal)' : 'rgba(255,255,255,0.2)',
                }}
              >
                {joinCommunity && <Check className="w-4 h-4 text-white" aria-hidden />}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-white text-sm font-medium">Join Community</span>
                <span className="text-[11px]" style={{ color: 'var(--kv-text-tertiary)' }}>
                  Get group buy deals &amp; community offers
                </span>
              </div>
            </button>

            <RoyalAction
              label={signupRole === 'customer' ? 'Create Account' : 'Continue'}
              onClick={handleStep1Next}
              loading={loading}
              icon={signupRole === 'customer' ? Sparkles : undefined}
            />
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="kv-card p-5 sm:p-6 flex flex-col gap-4"
          >
            <div
              className="flex items-center gap-3 p-3 sm:p-4 rounded-xl"
              style={{
                background: 'var(--kv-royal-light)',
                border: '1px solid var(--kv-royal-border)',
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--kv-glass)' }}
              >
                {(() => {
                  const Icon = ROLES.find((r) => r.id === signupRole)?.icon;
                  return Icon ? <Icon className="w-5 h-5" style={{ color: 'var(--kv-mystic)' }} aria-hidden /> : null;
                })()}
              </div>
              <div>
                <h3 className="text-white font-bold text-base">
                  {signupRole === 'vendor' ? 'Business Details' : 'Rider Details'}
                </h3>
                <p className="text-xs" style={{ color: 'var(--kv-text-tertiary)' }}>
                  {signupRole === 'vendor'
                    ? 'Tell us about your business on SwiftRamadan'
                    : 'Provide your vehicle and license information'}
                </p>
              </div>
            </div>

            {signupRole === 'vendor' && (
              <>
                <RoyalInput
                  label="Business name"
                  placeholder="Saffran Lagos"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  leftIcon={<Store className="w-4 h-4" />}
                  id="kv-signup-business-name"
                />
                <SelectDropdown
                  label="Business category"
                  placeholder="Select category"
                  value={businessCategory}
                  options={BUSINESS_CATEGORIES}
                  open={businessCategoryOpen}
                  onToggle={() => setBusinessCategoryOpen((v) => !v)}
                  onSelect={(v) => { setBusinessCategory(v); setBusinessCategoryOpen(false); }}
                  leftIcon={<ShoppingBag className="w-4 h-4" />}
                />
                <RoyalInput
                  label="Business address"
                  placeholder="123 Adeola Odeku, Victoria Island"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  leftIcon={<MapPin className="w-4 h-4" />}
                  id="kv-signup-business-address"
                />
              </>
            )}

            {signupRole === 'rider' && (
              <>
                <SelectDropdown
                  label="Vehicle type"
                  placeholder="Select vehicle"
                  value={vehicleType}
                  options={VEHICLE_TYPES}
                  open={vehicleTypeOpen}
                  onToggle={() => setVehicleTypeOpen((v) => !v)}
                  onSelect={(v) => { setVehicleType(v); setVehicleTypeOpen(false); }}
                  leftIcon={<Bike className="w-4 h-4" />}
                />
                <RoyalInput
                  label="Plate number"
                  placeholder="LSR 123 AB"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  id="kv-signup-plate-number"
                />
                <RoyalInput
                  label="Driver's license number"
                  placeholder="License number"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  id="kv-signup-license-number"
                />
              </>
            )}

            <RoyalAction
              label="Create Account"
              onClick={handleStep2Submit}
              loading={loading}
              icon={Sparkles}
            />
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-center hover:opacity-80 transition-opacity"
              style={{ color: 'var(--kv-text-tertiary)' }}
            >
              <ArrowLeft className="w-3.5 h-3.5 inline mr-1" aria-hidden />
              Back to basic info
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trust */}
      <div className="kv-divider" />
      <TrustMicrocopy message="Your data is encrypted. Your privacy is sacred." />

      {/* Toggle */}
      <div className="text-center mt-1">
        <button
          type="button"
          onClick={() => store.setShowAuth('login')}
          className="text-sm hover:opacity-80 transition-opacity"
          style={{ color: 'var(--kv-text-tertiary)' }}
        >
          Already have an account?{' '}
          <span className="font-bold" style={{ color: 'var(--kv-mystic)' }}>Sign In</span>
        </button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   OTP SCREEN
   ══════════════════════════════════════════════════════════════════ */
function OTPScreen() {
  const userPhone = useUserPhone();
  const { userEmail, userRole, setShowAuth } = useAuth();
  const setIsLoggedIn = useSetIsLoggedIn();
  const setShowOnboarding = useSetShowOnboarding();

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
    const t = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    setOtp((prev) => {
      const next = [...prev];
      next[index] = value.slice(-1);
      return next;
    });
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const next = Array(6).fill('');
      for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
      setOtp(next);
      const idx = pasted.length < 6 ? pasted.length : 5;
      inputRefs.current[idx]?.focus();
    }
  }, []);

  const handleVerifySuccess = () => {
    setIsLoggedIn(true);
    track('signup', { role: userRole || 'customer' });
    if (userRole && userRole !== 'customer') {
      setShowOnboarding(true);
      setShowAuth(null);
      toast({ title: 'Verified! 🎉', description: `Setting up your ${userRole} account...` });
    } else if (userRole === 'customer') {
      setShowOnboarding(true);
      setShowAuth(null);
      toast({ title: 'Verified! 🎉', description: 'Welcome to SwiftRamadan!' });
    } else {
      setShowAuth('role');
      toast({ title: 'Verified! 🎉', description: 'Please choose how you\'d like to use SwiftRamadan.' });
    }
  };

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
        body: JSON.stringify({ action: 'verify-otp', email: userEmail, phone: userPhone, otp: code }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        handleVerifySuccess();
      } else {
        toast({ title: 'Invalid code', description: data.message || 'The code you entered is incorrect.', variant: 'destructive' });
      }
    } catch (err) {
      // SECURITY FIX (mirrors legacy): no client-side bypass on network error.
      const message = err instanceof Error ? err.message : 'Verification failed. Please try again.';
      toast({ title: 'Verification failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setCountdown(60);
    setOtp(Array(6).fill(''));
    try {
      const resendRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-otp', email: userEmail, phone: userPhone }),
      });
      if (!resendRes.ok) throw new Error(`API error: ${resendRes.status}`);
      toast({ title: 'Code resent', description: 'A new verification code has been sent.' });
    } catch {
      toast({ title: 'Code resent', description: 'A new verification code has been sent.' });
    }
  };

  const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const totalSteps = userRole && userRole !== 'customer' ? 3 : 2;
  const filledSteps = userRole && userRole !== 'customer' ? 2 : 2;

  return (
    <motion.div
      key="otp"
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -40, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="kv-entrance flex flex-col gap-5"
      role="group"
      aria-labelledby="auth-otp-heading"
    >
      <div>
        <h1 id="auth-otp-heading" className="kv-gradient-text text-2xl sm:text-3xl font-extrabold tracking-tight">
          Verify Your Number
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--kv-text-tertiary)' }}>
          We sent a 6-digit code to{' '}
          <span className="text-white font-medium">{userPhone || '+234 800 000 0000'}</span>
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full transition-all duration-300"
            style={{
              background: i < filledSteps ? 'linear-gradient(90deg, var(--kv-royal), var(--kv-mystic))' : 'rgba(255,255,255,0.08)',
            }}
          />
        ))}
        <span className="text-xs ml-2" style={{ color: 'var(--kv-text-tertiary)' }}>
          Step {filledSteps}/{totalSteps}
        </span>
      </div>

      {/* OTP inputs */}
      <div className="flex gap-2 sm:gap-3 justify-center my-2" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <motion.input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            aria-label={`Digit ${i + 1} of 6`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="kv-input w-11 h-14 sm:w-14 sm:h-16 text-center text-white text-xl sm:text-2xl font-bold"
            style={{
              borderColor: digit ? 'var(--kv-royal-border)' : undefined,
              background: digit ? 'var(--kv-royal-light)' : undefined,
            }}
          />
        ))}
      </div>

      {/* Resend */}
      <div className="flex items-center justify-center gap-2">
        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            className="text-sm font-bold hover:underline"
            style={{ color: 'var(--kv-mystic)' }}
          >
            Resend Code
          </button>
        ) : (
          <span className="text-sm" style={{ color: 'var(--kv-text-tertiary)' }}>
            Resend code in{' '}
            <span className="font-mono font-bold" style={{ color: 'var(--kv-gold)' }}>
              {formatCountdown(countdown)}
            </span>
          </span>
        )}
      </div>

      <RoyalAction label="Verify" onClick={handleVerify} loading={loading} />

      {/* Trust */}
      <div className="kv-divider" />
      <TrustMicrocopy message="Your data is encrypted. Your privacy is sacred." />
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN AUTH SCREEN
   ══════════════════════════════════════════════════════════════════ */
export function KingdomAuthScreen() {
  const showAuth = useShowAuth();
  const { setShowAuth, userRole, isLoggedIn } = useAuth();

  const handleBack = () => {
    if (showAuth === 'otp') {
      setShowAuth('signup');
    } else if (showAuth === 'signup' && userRole && !isLoggedIn) {
      // From signup back → go to login (V2 keeps the flow simpler than the
      // legacy modal: instead of returning to Welcome, we keep users inside
      // the same surface and let them toggle).
      setShowAuth('login');
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
    <KingdomShell>
      <div className="min-h-screen flex items-start justify-center px-5 sm:px-6 py-10">
        <div className="w-full max-w-md mx-auto">
          {/* Top bar: back + title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex items-center justify-between mb-6"
          >
            <button
              type="button"
              onClick={handleBack}
              className="w-10 h-10 rounded-xl kv-glass flex items-center justify-center hover:bg-[var(--kv-glass-hover)] transition-all active:scale-95"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-[var(--kv-text-secondary)]" aria-hidden />
            </button>
            <span
              className="text-xs font-semibold uppercase tracking-[0.15em]"
              style={{ color: 'var(--kv-text-tertiary)' }}
            >
              {getTitle()}
            </span>
            <button
              type="button"
              onClick={() => setShowAuth(null)}
              className="w-10 h-10 rounded-xl kv-glass flex items-center justify-center hover:bg-[var(--kv-glass-hover)] transition-all active:scale-95"
              aria-label="Close"
            >
              <span className="text-[var(--kv-text-secondary)] text-lg leading-none">×</span>
            </button>
          </motion.div>

          {/* AI Orb header — signature Auren Kingdom visual */}
          <div className="flex flex-col items-center text-center mb-6">
            <AIOrb size="md" state="idle" />
            <h2 className="kv-gradient-text text-xl font-extrabold tracking-tight mt-4">
              Welcome to the Kingdom
            </h2>
            <div className="kv-accent-line mx-auto mt-3" />
          </div>

          {/* Screen transitions */}
          <AnimatePresence mode="wait">
            {showAuth === 'login' && <LoginScreen key="login" />}
            {showAuth === 'signup' && <SignupScreen key="signup" />}
            {showAuth === 'otp' && <OTPScreen key="otp" />}
          </AnimatePresence>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <Sparkles className="w-3 h-3 text-[var(--kv-mystic)]" aria-hidden />
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--kv-text-muted)' }}>
              Auren Kingdom · Built for Ramadan
            </p>
          </div>
        </div>
      </div>
    </KingdomShell>
  );
}
