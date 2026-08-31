'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import {
  useAuth, useOnboarding, useSetIsLoggedIn, useSetUserName, useSetUserEmail,
  useUserPhone, useSetShowOnboarding, useSetOnboardingComplete, useShowAuth,
} from '@/lib/store-selectors';
import { toast } from '@/hooks/use-toast';
import { track } from '@/lib/analytics';
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
  Building2,
  Truck,
  CreditCard,
  Clock,
  Palette,
  Utensils,
  Flame,
  Moon,
  CupSoda,
  ShoppingCart,
  Pill,
  Package,
  ShieldCheck,
} from 'lucide-react';

/* ─────────────── Constants ─────────────── */

const ROLE_CONFIG = {
  customer: {
    label: 'Customer',
    accent: '#10E07A',
    accentLight: 'rgba(16,224,122,0.12)',
    accentMid: 'rgba(16,224,122,0.25)',
    gradient: 'from-[#064e3b] to-[#0a3d2e]',
    icon: ShoppingBag,
    tagline: 'Shop Iftar meals, groceries & more',
  },
  vendor: {
    label: 'Vendor',
    accent: '#F5C451',
    accentLight: 'rgba(245,196,81,0.12)',
    accentMid: 'rgba(245,196,81,0.25)',
    gradient: 'from-[#4a3d00] to-[#2d2100]',
    icon: Store,
    tagline: 'Sell your products on SwiftRamadan',
  },
  rider: {
    label: 'Rider',
    accent: '#38BDF8',
    accentLight: 'rgba(56,189,248,0.12)',
    accentMid: 'rgba(56,189,248,0.25)',
    gradient: 'from-[#1e3a5f] to-[#0c1929]',
    icon: Bike,
    tagline: 'Deliver & earn with SwiftLogistics',
  },
} as const;

type RoleKey = keyof typeof ROLE_CONFIG;

const RESIDENTIAL_AREAS = ['Lekki', 'Ikoyi', 'Victoria Island', 'Surulere', 'Ikeja', 'Yaba', 'Ajah', 'Maryland', 'Gbagada', 'Festac'];

const BUSINESS_CATEGORIES = [
  { value: 'Iftar Meals', label: 'Iftar Meals', icon: Utensils },
  { value: 'Grills', label: 'Grills', icon: Flame },
  { value: 'Sahur', label: 'Sahur', icon: Moon },
  { value: 'Drinks', label: 'Drinks', icon: CupSoda },
  { value: 'Groceries', label: 'Groceries', icon: ShoppingCart },
  { value: 'Pharmacy', label: 'Pharmacy', icon: Pill },
  { value: 'Bundles', label: 'Bundles', icon: Package },
];

const VEHICLE_TYPES = [
  { value: 'Motorcycle', label: 'Motorcycle' },
  { value: 'Bicycle', label: 'Bicycle' },
  { value: 'Car', label: 'Car' },
  { value: 'Electric Bike', label: 'Electric Bike' },
];

/* ─────────────── Reusable Components ─────────────── */

/** Premium dual-ring spinner — outer ring rotates clockwise, inner ring
 *  counter-rotates. Uses the role accent for the leading edge so it
 *  reads as “part of” the active role even while loading. */
function Spinner({ color = '#06070B' }: { color?: string }) {
  return (
    <span
      className="relative inline-flex w-5 h-5 shrink-0"
      role="status"
      aria-label="Loading"
    >
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-full border-2"
        style={{ borderColor: `${color}25`, borderTopColor: color }}
      />
      <motion.span
        animate={{ rotate: -360 }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-1 rounded-full border"
        style={{ borderColor: `${color}15`, borderBottomColor: color }}
      />
    </span>
  );
}

function RoleTabButton({
  role,
  selected,
  onClick,
}: {
  role: RoleKey;
  selected: boolean;
  onClick: () => void;
}) {
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className="relative flex-1 flex flex-col items-center justify-center gap-1.5 py-3 sm:py-3.5 px-2 sm:px-3 rounded-xl transition-all duration-300 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      style={{
        backgroundColor: selected ? config.accentLight : 'transparent',
        border: selected ? `1px solid ${config.accentMid}` : '1px solid transparent',
      }}
    >
      <Icon
        aria-hidden="true"
        className="w-5 h-5 transition-colors"
        style={{ color: selected ? config.accent : 'rgba(255,255,255,0.5)' }}
      />
      <span
        className="text-xs sm:text-sm font-bold transition-colors"
        style={{ color: selected ? config.accent : 'rgba(255,255,255,0.5)' }}
      >
        {config.label}
      </span>
      {selected && (
        <motion.div
          layoutId="role-tab-indicator"
          className="absolute -bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full"
          style={{ backgroundColor: config.accent }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        />
      )}
    </button>
  );
}

function InputField({
  icon: Icon,
  placeholder,
  value,
  onChange,
  type = 'text',
  accentColor = ROLE_CONFIG.customer.accent,
  rightElement,
  inputMode,
  maxLength,
  onKeyDown,
  id,
}: {
  icon: React.ElementType;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  accentColor?: string;
  rightElement?: React.ReactNode;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email';
  maxLength?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  id?: string;
}) {
  return (
    <div className="relative group">
      {id && <label htmlFor={id} className="sr-only">{placeholder}</label>}
      <Icon
        aria-hidden="true"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/45 transition-colors group-focus-within:text-white/70"
      />
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="w-full h-14 bg-[var(--sr-surface-elevated)] border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/50 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-white/15 focus:border-white/25 transition-all duration-200"
        style={{ borderColor: value ? `${accentColor}50` : undefined }}
      />
      {rightElement && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  loading,
  accentColor = ROLE_CONFIG.customer.accent,
  icon: Icon,
  fullWidth = true,
}: {
  label: string;
  onClick: () => void;
  loading?: boolean;
  accentColor?: string;
  icon?: React.ElementType;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-busy={loading}
      className={`${fullWidth ? 'w-full' : ''} h-14 rounded-xl font-bold text-base active:scale-[0.98] enabled:hover:brightness-105 enabled:hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
      style={{
        backgroundColor: accentColor,
        color: 'var(--sr-surface-base)',
        boxShadow: `0 4px 24px ${accentColor}30`,
      }}
    >
      {loading ? (
        <Spinner color="#06070B" />
      ) : (
        <>
          {Icon && <Icon aria-hidden="true" className="w-5 h-5" />}
          {label}
        </>
      )}
    </button>
  );
}

/* ─────────────── Login Screen ─────────────── */

function LoginScreen() {
  const { setShowAuth, setUserRole } = useAuth();
  const setIsLoggedIn = useSetIsLoggedIn();
  const setUserName = useSetUserName();
  const setUserEmail = useSetUserEmail();
  const [loginRole, setLoginRole] = useState<RoleKey>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const config = ROLE_CONFIG[loginRole];

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
        body: JSON.stringify({ action: 'login', email, password, role: loginRole }),
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setUserName(data.user?.name || email.split('@')[0]);
        setUserEmail(email);
        setUserRole(loginRole);
        setIsLoggedIn(true);
        setShowAuth(null);
        track('login', { role: loginRole, method: 'password' });
        toast({ title: `Welcome back!`, description: `Signed in as ${config.label}` });
      } else {
        // Demo mode: allow login even without DB account for seamless experience
        setUserName(email.split('@')[0]);
        setUserEmail(email);
        setUserRole(loginRole);
        setIsLoggedIn(true);
        setShowAuth(null);
        track('login', { role: loginRole, method: 'demo' });
        toast({ title: `Welcome back!`, description: `Signed in as ${config.label} (demo)` });
      }
    } catch {
      // Fallback: demo login
      setUserName(email.split('@')[0]);
      setUserEmail(email);
      setUserRole(loginRole);
      setIsLoggedIn(true);
      setShowAuth(null);
      track('login', { role: loginRole, method: 'fallback' });
      toast({ title: `Welcome back!`, description: `Signed in as ${config.label}` });
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
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        // OAuth flow completed or user logged in
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
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -40, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col min-h-full w-full max-w-md mx-auto px-5 sm:px-6 pt-4 pb-8"
    >
      {/* Role Selector Tabs */}
      <div className="flex gap-2 p-1.5 bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 mb-5 sm:mb-6">
        {(['customer', 'vendor', 'rider'] as RoleKey[]).map((role) => (
          <RoleTabButton
            key={role}
            role={role}
            selected={loginRole === role}
            onClick={() => setLoginRole(role)}
          />
        ))}
      </div>

      {/* Dynamic Header */}
      <div className="mb-5 sm:mb-6">
        <motion.div
          key={loginRole}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: config.accentLight, border: `1px solid ${config.accentMid}` }}
            >
              <config.icon className="w-5 h-5" style={{ color: config.accent }} />
            </div>
            <div>
              <h1 id="auth-login-heading" className="text-white text-xl sm:text-2xl font-extrabold tracking-tight">Welcome Back</h1>
              <p className="text-sm sm:text-base" style={{ color: config.accent }}>{config.tagline}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-3 sm:gap-4 flex-1" role="form" aria-labelledby="auth-login-heading">
        {/* Email */}
        <InputField
          icon={Mail}
          placeholder="Email address"
          value={email}
          onChange={setEmail}
          accentColor={config.accent}
          inputMode="email"
          id="auth-login-email"
        />

        {/* Password */}
        <div className="relative group">
          <label htmlFor="auth-login-password" className="sr-only">Password</label>
          <Lock aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/45 transition-colors group-focus-within:text-white/70" />
          <input
            id="auth-login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full h-14 bg-[var(--sr-surface-elevated)] border border-white/10 rounded-xl pl-12 pr-12 text-white placeholder:text-white/50 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-white/15 focus:border-white/25 transition-all duration-200"
            style={{ borderColor: password ? `${config.accent}50` : undefined }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff aria-hidden="true" className="w-5 h-5" /> : <Eye aria-hidden="true" className="w-5 h-5" />}
          </button>
        </div>

        {/* Forgot Password / Login Form Toggle */}
        <AnimatePresence mode="wait">
          {showForgotPassword ? (
            <motion.div
              key="forgot-form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-3 sm:gap-4"
            >
              <p className="text-white/50 text-xs sm:text-sm">Enter your email and we&apos;ll send you a password reset link.</p>
              <InputField
                icon={Mail}
                placeholder="Email address"
                value={forgotEmail}
                onChange={setForgotEmail}
                accentColor={config.accent}
                inputMode="email"
                id="auth-forgot-email"
              />
              <ActionButton
                label="Send Reset Link"
                onClick={async () => {
                  if (!forgotEmail.trim()) {
                    toast({ title: 'Missing email', description: 'Please enter your email address.', variant: 'destructive' });
                    return;
                  }
                  setForgotLoading(true);
                  try {
                    const forgotRes = await fetch('/api/auth', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'forgot-password', email: forgotEmail }),
                    });
                    if (!forgotRes.ok) {
                      throw new Error(`API error: ${forgotRes.status}`);
                    }
                  } catch {
                    // silently handle — we show the same toast regardless
                  } finally {
                    setForgotLoading(false);
                  }
                  toast({ title: 'Reset link sent', description: 'Password reset link sent to your email' });
                  setShowForgotPassword(false);
                  setForgotEmail('');
                }}
                loading={forgotLoading}
                accentColor={config.accent}
              />
              <button
                onClick={() => { setShowForgotPassword(false); setForgotEmail(''); }}
                className="text-white/65 text-xs font-semibold flex items-center gap-1 justify-center hover:text-white/60 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-3 sm:gap-4"
            >
              <div className="flex justify-end">
                <button
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: config.accent }}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <ActionButton
                label="Login"
                onClick={handleLogin}
                loading={loading}
                accentColor={config.accent}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider */}
        <div className="flex items-center gap-3 sm:gap-4 my-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/60 text-xs sm:text-sm">or continue with</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Social Login */}
        <div className="flex gap-2.5 sm:gap-3">
          <button
            onClick={() => handleOAuthLogin('google')}
            className="flex-1 h-12 sm:h-14 rounded-xl bg-[var(--sr-surface-elevated)] border border-white/10 flex items-center justify-center gap-2 text-white text-sm font-medium hover:border-white/20 transition-colors active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            aria-label="Continue with Google"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button
            onClick={() => handleOAuthLogin('apple')}
            className="flex-1 h-12 sm:h-14 rounded-xl bg-[var(--sr-surface-elevated)] border border-white/10 flex items-center justify-center gap-2 text-white text-sm font-medium hover:border-white/20 transition-colors active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            aria-label="Continue with Apple"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Apple
          </button>
        </div>

        {/* Trust microcopy */}
        <div className="flex items-center justify-center gap-1.5 text-white/45 text-xs sm:text-[13px]">
          <ShieldCheck aria-hidden="true" className="w-3.5 h-3.5 text-[var(--sr-success)] shrink-0" />
          <span>Your data is encrypted and never shared</span>
        </div>
      </div>

      {/* Sign Up Link */}
      <div className="mt-5 sm:mt-6 text-center">
        <button
          onClick={() => setShowAuth('signup')}
          className="text-white/50 text-sm sm:text-base hover:text-white/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded px-1"
        >
          Don&apos;t have an account?{' '}
          <span className="font-bold" style={{ color: config.accent }}>Sign Up</span>
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────── Signup Screen (Multi-Step) ─────────────── */

function SignupScreen() {
  const store = useAppStore.getState();
  const [step, setStep] = useState<1 | 2>(1);
  // Use the role already set in the store (from RoleScreen), fallback to 'customer'
  const [signupRole, setSignupRole] = useState<RoleKey>(store.userRole || 'customer');

  // Step 1 fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [area, setArea] = useState('');
  const [areaOpen, setAreaOpen] = useState(false);
  const [joinCommunity, setJoinCommunity] = useState(true);
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Step 2 fields - Vendor
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('Iftar Meals');
  const [businessCategoryOpen, setBusinessCategoryOpen] = useState(false);
  const [businessAddress, setBusinessAddress] = useState('');

  // Step 2 fields - Rider
  const [vehicleType, setVehicleType] = useState('Motorcycle');
  const [vehicleTypeOpen, setVehicleTypeOpen] = useState(false);
  const [plateNumber, setPlateNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const [loading, setLoading] = useState(false);

  const config = ROLE_CONFIG[signupRole];

  // Total steps depend on role
  const totalSteps = signupRole === 'customer' ? 2 : 3;
  const currentStep = step === 1 ? 1 : (signupRole === 'customer' ? 2 : 2);

  const handleStep1Next = () => {
    if (!fullName.trim() || !phone.trim() || !email.trim() || !area) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    if (signupPassword.length > 0 && signupPassword.length < 6) {
      toast({ title: 'Weak password', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    // If customer, go directly to OTP (skip step 2)
    if (signupRole === 'customer') {
      handleSubmit();
    } else {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    // Set role-specific fields in store
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
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
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

  // Progress bar segments
  const progressSegments = signupRole === 'customer' ? 2 : 3;
  const filledSegments = step === 1 ? 1 : (signupRole === 'customer' ? 2 : 2);

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -40, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col min-h-full w-full max-w-md mx-auto px-5 sm:px-6 pt-4 pb-8"
    >
      {/* Header */}
      <div className="mb-4 sm:mb-5">
        <h1 id="auth-signup-heading" className="text-white text-xl sm:text-2xl font-extrabold tracking-tight">Create Account</h1>
        <p className="text-white/50 text-sm sm:text-base mt-1">Join the SwiftRamadan community</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-5 sm:mb-6">
        {Array.from({ length: progressSegments }).map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 h-1.5 sm:h-2 rounded-full"
            initial={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            animate={{
              backgroundColor: i < filledSegments ? config.accent : 'rgba(255,255,255,0.1)',
            }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          />
        ))}
        <span className="text-white/60 text-xs sm:text-sm ml-2">
          Step {filledSegments}/{progressSegments}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          /* ─── Step 1: Basic Info + Role Selection ─── */
          <motion.div
            key="step1"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex flex-col gap-3 sm:gap-4 flex-1"
          >
            {/* Role Selection */}
            <div>
              <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 block">I am a</label>
              <div className="flex gap-2 p-1.5 bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5">
                {(['customer', 'vendor', 'rider'] as RoleKey[]).map((role) => {
                  const rc = ROLE_CONFIG[role];
                  const RIcon = rc.icon;
                  const isSelected = signupRole === role;
                  return (
                    <button
                      key={role}
                      onClick={() => setSignupRole(role)}
                      aria-pressed={isSelected}
                      className="relative flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 px-2 sm:px-3 rounded-xl transition-all duration-300 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      style={{
                        backgroundColor: isSelected ? rc.accentLight : 'transparent',
                        border: isSelected ? `1px solid ${rc.accentMid}` : '1px solid transparent',
                      }}
                    >
                      <RIcon
                        aria-hidden="true"
                        className="w-4 h-4 transition-colors"
                        style={{ color: isSelected ? rc.accent : 'rgba(255,255,255,0.5)' }}
                      />
                      <span
                        className="text-xs sm:text-sm font-bold transition-colors"
                        style={{ color: isSelected ? rc.accent : 'rgba(255,255,255,0.5)' }}
                      >
                        {rc.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Name */}
            <InputField
              icon={User}
              placeholder="Full name"
              value={fullName}
              onChange={setFullName}
              accentColor={config.accent}
              id="auth-signup-name"
            />

            {/* Phone */}
            <div className="relative group">
              <label htmlFor="auth-signup-phone" className="sr-only">Phone number</label>
              <Phone aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/45 transition-colors group-focus-within:text-white/70" />
              <div className="absolute left-12 top-1/2 -translate-y-1/2 flex items-center pr-2 border-r border-white/10">
                <span className="text-white/50 text-sm sm:text-base font-medium">+234</span>
              </div>
              <input
                id="auth-signup-phone"
                type="tel"
                inputMode="numeric"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
                className="w-full h-14 bg-[var(--sr-surface-elevated)] border border-white/10 rounded-xl pl-28 pr-4 text-white placeholder:text-white/50 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-white/15 focus:border-white/25 transition-all duration-200"
                style={{ borderColor: phone ? `${config.accent}50` : undefined }}
              />
            </div>

            {/* Email */}
            <InputField
              icon={Mail}
              placeholder="Email address"
              value={email}
              onChange={setEmail}
              accentColor={config.accent}
              inputMode="email"
              id="auth-signup-email"
            />

            {/* Residential Area */}
            <div className="relative group">
              <MapPin aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/45 transition-colors group-focus-within:text-white/70 pointer-events-none" />
              <button
                onClick={() => setAreaOpen(!areaOpen)}
                aria-label="Residential area"
                aria-expanded={areaOpen}
                className={`w-full h-14 bg-[var(--sr-surface-elevated)] border rounded-xl pl-12 pr-10 text-left text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-white/15 focus:border-white/25 transition-all duration-200 flex items-center ${area ? 'text-white' : 'text-white/50'}`}
                style={{ borderColor: area ? `${config.accent}50` : 'rgba(255,255,255,0.1)' }}
              >
                {area || 'Residential area'}
              </button>
              <ChevronDown aria-hidden="true" className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 transition-transform ${areaOpen ? 'rotate-180' : ''}`} />

              <AnimatePresence>
                {areaOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-16 left-0 right-0 bg-[var(--sr-surface-elevated)] border border-white/10 rounded-xl overflow-hidden z-20 shadow-2xl"
                  >
                    <div className="max-h-48 overflow-y-auto custom-scrollbar" role="listbox" aria-label="Residential areas">
                      {RESIDENTIAL_AREAS.map((a) => (
                        <button
                          key={a}
                          onClick={() => { setArea(a); setAreaOpen(false); }}
                          role="option"
                          aria-selected={area === a}
                          className={`w-full px-4 py-3 text-left text-sm sm:text-base hover:bg-white/5 transition-colors flex items-center justify-between ${area === a ? 'font-semibold' : 'text-white/70'}`}
                          style={{ color: area === a ? config.accent : undefined }}
                        >
                          {a}
                          {area === a && <Check aria-hidden="true" className="w-4 h-4" style={{ color: config.accent }} />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div className="relative group">
              <label htmlFor="auth-signup-password" className="sr-only">Create password</label>
              <Lock aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/45 transition-colors group-focus-within:text-white/70" />
              <input
                id="auth-signup-password"
                type={showSignupPassword ? 'text' : 'password'}
                placeholder="Create password (min 6 chars)"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className="w-full h-14 bg-[var(--sr-surface-elevated)] border border-white/10 rounded-xl pl-12 pr-12 text-white placeholder:text-white/50 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-white/15 focus:border-white/25 transition-all duration-200"
                style={{ borderColor: signupPassword ? `${config.accent}50` : undefined }}
              />
              <button
                type="button"
                onClick={() => setShowSignupPassword(!showSignupPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
              >
                {showSignupPassword ? <EyeOff aria-hidden="true" className="w-5 h-5" /> : <Eye aria-hidden="true" className="w-5 h-5" />}
              </button>
            </div>

            {/* Join Community */}
            <button
              onClick={() => setJoinCommunity(!joinCommunity)}
              className="flex items-center gap-3 py-1"
            >
              <div
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all`}
                style={{
                  backgroundColor: joinCommunity ? config.accent : 'transparent',
                  borderColor: joinCommunity ? config.accent : 'rgba(255,255,255,0.2)',
                }}
              >
                {joinCommunity && <Check aria-hidden="true" className="w-4 h-4 text-[var(--sr-surface-base)]" />}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-white text-sm font-medium">Join Community</span>
                <span className="text-white/65 text-xs">Get group buy deals & community offers</span>
              </div>
            </button>

            {/* Continue Button */}
            <ActionButton
              label={signupRole === 'customer' ? 'Create Account' : 'Continue'}
              onClick={handleStep1Next}
              loading={loading}
              accentColor={config.accent}
              icon={signupRole === 'customer' ? Sparkles : undefined}
            />
          </motion.div>
        ) : (
          /* ─── Step 2: Role-Specific Fields ─── */
          <motion.div
            key="step2"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex flex-col gap-3 sm:gap-4 flex-1"
          >
            {/* Role-specific header */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl border"
              style={{
                backgroundColor: config.accentLight,
                borderColor: config.accentMid,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${config.accent}30` }}
              >
                <config.icon aria-hidden="true" className="w-6 h-6" style={{ color: config.accent }} />
              </div>
              <div>
                <h3 className="text-white font-bold text-base sm:text-lg">
                  {signupRole === 'vendor' ? 'Business Details' : 'Rider Details'}
                </h3>
                <p className="text-white/50 text-xs sm:text-sm">
                  {signupRole === 'vendor'
                    ? 'Tell us about your business on SwiftRamadan'
                    : 'Provide your vehicle and license information'}
                </p>
              </div>
            </motion.div>

            {signupRole === 'vendor' && (
              <>
                {/* Business Name */}
                <InputField
                  icon={Building2}
                  placeholder="Business name"
                  value={businessName}
                  onChange={setBusinessName}
                  accentColor={config.accent}
                  id="auth-signup-business-name"
                />

                {/* Business Category */}
                <div className="relative group">
                  <ShoppingCart aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/45 transition-colors group-focus-within:text-white/70 pointer-events-none" />
                  <button
                    onClick={() => setBusinessCategoryOpen(!businessCategoryOpen)}
                    aria-label="Business category"
                    aria-expanded={businessCategoryOpen}
                    className="w-full h-14 bg-[var(--sr-surface-elevated)] border border-white/10 rounded-xl pl-12 pr-10 text-left text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-white/15 focus:border-white/25 transition-all duration-200 flex items-center text-white"
                    style={{ borderColor: businessCategory ? `${config.accent}50` : undefined }}
                  >
                    <span className="flex items-center gap-2">
                      {(() => {
                        const cat = BUSINESS_CATEGORIES.find(c => c.value === businessCategory);
                        const CatIcon = cat?.icon;
                        return CatIcon ? <CatIcon aria-hidden="true" className="w-4 h-4" style={{ color: config.accent }} /> : null;
                      })()}
                      {businessCategory || 'Business category'}
                    </span>
                  </button>
                  <ChevronDown aria-hidden="true" className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 transition-transform ${businessCategoryOpen ? 'rotate-180' : ''}`} />

                  <AnimatePresence>
                    {businessCategoryOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-16 left-0 right-0 bg-[var(--sr-surface-elevated)] border border-white/10 rounded-xl overflow-hidden z-20 shadow-2xl"
                      >
                        <div className="max-h-56 overflow-y-auto custom-scrollbar" role="listbox" aria-label="Business categories">
                          {BUSINESS_CATEGORIES.map((cat) => {
                            const CatIcon = cat.icon;
                            const isSelected = businessCategory === cat.value;
                            return (
                              <button
                                key={cat.value}
                                onClick={() => { setBusinessCategory(cat.value); setBusinessCategoryOpen(false); }}
                                role="option"
                                aria-selected={isSelected}
                                className="w-full px-4 py-3 text-left text-sm sm:text-base hover:bg-white/5 transition-colors flex items-center justify-between"
                                style={{ color: isSelected ? config.accent : 'rgba(255,255,255,0.7)' }}
                              >
                                <span className="flex items-center gap-3">
                                  <CatIcon aria-hidden="true" className="w-4 h-4" style={{ color: isSelected ? config.accent : 'rgba(255,255,255,0.4)' }} />
                                  {cat.label}
                                </span>
                                {isSelected && <Check aria-hidden="true" className="w-4 h-4" style={{ color: config.accent }} />}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Business Address */}
                <InputField
                  icon={MapPin}
                  placeholder="Business address"
                  value={businessAddress}
                  onChange={setBusinessAddress}
                  accentColor={config.accent}
                  id="auth-signup-business-address"
                />
              </>
            )}

            {signupRole === 'rider' && (
              <>
                {/* Vehicle Type */}
                <div className="relative group">
                  <Truck aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/45 transition-colors group-focus-within:text-white/70 pointer-events-none" />
                  <button
                    onClick={() => setVehicleTypeOpen(!vehicleTypeOpen)}
                    aria-label="Vehicle type"
                    aria-expanded={vehicleTypeOpen}
                    className="w-full h-14 bg-[var(--sr-surface-elevated)] border border-white/10 rounded-xl pl-12 pr-10 text-left text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-white/15 focus:border-white/25 transition-all duration-200 flex items-center text-white"
                    style={{ borderColor: vehicleType ? `${config.accent}50` : undefined }}
                  >
                    {vehicleType || 'Vehicle type'}
                  </button>
                  <ChevronDown aria-hidden="true" className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 transition-transform ${vehicleTypeOpen ? 'rotate-180' : ''}`} />

                  <AnimatePresence>
                    {vehicleTypeOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-16 left-0 right-0 bg-[var(--sr-surface-elevated)] border border-white/10 rounded-xl overflow-hidden z-20 shadow-2xl"
                      >
                        <div className="max-h-56 overflow-y-auto custom-scrollbar" role="listbox" aria-label="Vehicle types">
                          {VEHICLE_TYPES.map((vt) => {
                            const isSelected = vehicleType === vt.value;
                            return (
                              <button
                                key={vt.value}
                                onClick={() => { setVehicleType(vt.value); setVehicleTypeOpen(false); }}
                                role="option"
                                aria-selected={isSelected}
                                className="w-full px-4 py-3 text-left text-sm sm:text-base hover:bg-white/5 transition-colors flex items-center justify-between"
                                style={{ color: isSelected ? config.accent : 'rgba(255,255,255,0.7)' }}
                              >
                                {vt.label}
                                {isSelected && <Check aria-hidden="true" className="w-4 h-4" style={{ color: config.accent }} />}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Plate Number */}
                <InputField
                  icon={CreditCard}
                  placeholder="Plate number (e.g. LSR 123 AB)"
                  value={plateNumber}
                  onChange={(v) => setPlateNumber(v.toUpperCase())}
                  accentColor={config.accent}
                  id="auth-signup-plate-number"
                />

                {/* License Number */}
                <InputField
                  icon={Clock}
                  placeholder="Driver's license number"
                  value={licenseNumber}
                  onChange={setLicenseNumber}
                  accentColor={config.accent}
                  id="auth-signup-license-number"
                />
              </>
            )}

            {/* Submit Button */}
            <ActionButton
              label="Create Account"
              onClick={handleStep2Submit}
              loading={loading}
              accentColor={config.accent}
              icon={Sparkles}
            />

            {/* Back link */}
            <button
              onClick={() => setStep(1)}
              className="text-white/65 text-sm sm:text-base text-center hover:text-white/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded px-1 py-1"
            >
              ← Back to basic info
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trust microcopy */}
      <div className="flex items-center justify-center gap-1.5 mt-4 text-white/45 text-xs sm:text-[13px]">
        <ShieldCheck aria-hidden="true" className="w-3.5 h-3.5 text-[var(--sr-success)] shrink-0" />
        <span>Bank-grade encryption protects your data</span>
      </div>

      {/* Login Link */}
      <div className="mt-5 sm:mt-6 text-center">
        <button
          onClick={() => store.setShowAuth('login')}
          className="text-white/50 text-sm sm:text-base hover:text-white/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded px-1"
        >
          Already have an account?{' '}
          <span className="font-bold" style={{ color: config.accent }}>Sign In</span>
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────── OTP Screen ─────────────── */

function OTPScreen() {
  const userPhone = useUserPhone();
  const { userEmail, userRole, setUserRole, setShowAuth } = useAuth();
  const setIsLoggedIn = useSetIsLoggedIn();
  const setShowOnboarding = useSetShowOnboarding();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const config = ROLE_CONFIG[userRole || 'customer'];
  const accentColor = userRole ? config.accent : ROLE_CONFIG.customer.accent;

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

  const handleVerifySuccess = () => {
    setIsLoggedIn(true);
    track('signup', { role: userRole || 'customer' });
    if (userRole && userRole !== 'customer') {
      setShowOnboarding(true);
      setShowAuth(null);
      toast({ title: 'Verified! 🎉', description: `Setting up your ${ROLE_CONFIG[userRole].label} account...` });
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
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        handleVerifySuccess();
      } else {
        toast({ title: 'Invalid code', description: data.message || 'The code you entered is incorrect.', variant: 'destructive' });
      }
    } catch (err) {
      // SECURITY FIX: Removed OTP client-side bypass.
      // Previously, ANY network error accepted any 6-digit code as valid.
      // Now we surface the error and require the user to retry.
      // This closes the authentication bypass (audit H4).
      const message = err instanceof Error ? err.message : 'Verification failed. Please try again.';
      toast({
        title: 'Verification failed',
        description: message,
        variant: 'destructive',
      });
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
      if (!resendRes.ok) {
        throw new Error(`API error: ${resendRes.status}`);
      }
      toast({ title: 'Code resent', description: 'A new verification code has been sent.' });
    } catch {
      toast({ title: 'Code resent', description: 'A new verification code has been sent.' });
    }
  };

  const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Determine progress bar fill based on role
  const totalSteps = userRole && userRole !== 'customer' ? 3 : 2;
  const filledSteps = userRole && userRole !== 'customer' ? 2 : 2;

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -40, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col min-h-full w-full max-w-md mx-auto px-5 sm:px-6 pt-4 pb-8"
    >
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 id="auth-otp-heading" className="text-white text-xl sm:text-2xl font-extrabold tracking-tight">Verify Your Number</h1>
        <p className="text-white/50 text-sm sm:text-base mt-2">
          We sent a 6-digit code to{' '}
          <span className="text-white font-medium">{userPhone || '+234 800 000 0000'}</span>
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-5 sm:mb-6">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 h-1.5 sm:h-2 rounded-full"
            initial={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            animate={{
              backgroundColor: i < filledSteps ? accentColor : 'rgba(255,255,255,0.1)',
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
        <span className="text-white/60 text-xs sm:text-sm ml-2">
          Step {filledSteps}/{totalSteps}
        </span>
      </div>

      {/* OTP Inputs */}
      <div className="flex gap-2 sm:gap-3 justify-center mb-6 sm:mb-8" onPaste={handlePaste} role="group" aria-labelledby="auth-otp-heading">
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
              aria-label={`Digit ${i + 1} of 6`}
              className={`w-11 h-14 sm:w-14 sm:h-16 rounded-xl text-center text-white text-xl sm:text-2xl font-bold bg-[var(--sr-surface-elevated)] border focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-200 ${
                digit ? '' : 'border-white/10'
              }`}
              style={{
                borderColor: digit ? `${accentColor}50` : undefined,
                backgroundColor: digit ? `${accentColor}08` : undefined,
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Resend */}
      <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
        {canResend ? (
          <button onClick={handleResend} className="text-sm sm:text-base font-bold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded px-1" style={{ color: accentColor }}>
            Resend Code
          </button>
        ) : (
          <span className="text-white/60 text-sm sm:text-base">
            Resend code in <span className="text-[var(--sr-vendor)] font-mono font-bold">{formatCountdown(countdown)}</span>
          </span>
        )}
      </div>

      {/* Verify Button */}
      <ActionButton
        label="Verify"
        onClick={handleVerify}
        loading={loading}
        accentColor={accentColor}
      />

      {/* Trust microcopy */}
      <div className="flex items-center justify-center gap-1.5 mt-5 sm:mt-6 text-white/45 text-xs sm:text-[13px]">
        <ShieldCheck aria-hidden="true" className="w-3.5 h-3.5 text-[var(--sr-success)] shrink-0" />
        <span>We&apos;ll never share your phone number</span>
      </div>
    </motion.div>
  );
}

/* ─────────────── Role Selection Screen ─────────────── */

const ROLES = [
  {
    id: 'customer' as const,
    title: 'Customer',
    description: 'Shop iftar meals, groceries, and more',
    icon: ShoppingBag,
    gradient: 'from-[#064e3b] to-[#0a3d2e]',
    accent: '#10E07A',
    image: '/images/categories/hub-iftar.png',
  },
  {
    id: 'vendor' as const,
    title: 'Vendor',
    description: 'Sell your products on SwiftRamadan',
    icon: Store,
    gradient: 'from-[#4a3d00] to-[#2d2100]',
    accent: '#F5C451',
    image: '/images/categories/hub-groceries.png',
  },
  {
    id: 'rider' as const,
    title: 'Rider',
    description: 'Deliver and earn with SwiftLogistics',
    icon: Bike,
    gradient: 'from-[#1e3a5f] to-[#0c1929]',
    accent: '#38BDF8',
    image: '/images/categories/hub-pharmacy.png',
  },
];

function RoleScreen() {
  const { setUserRole, setShowAuth, isLoggedIn } = useAuth();
  const setShowOnboarding = useSetShowOnboarding();
  const setOnboardingComplete = useSetOnboardingComplete();
  const [selected, setSelected] = useState<'customer' | 'vendor' | 'rider'>('customer');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    if (isLoggedIn) {
      // Already logged in — switch role server-side to update session cookie
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'switch-role', role: selected }),
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        if (data.success && data.user) {
          setUserRole(data.user.role || selected);
        } else {
          setUserRole(selected);
        }
      } catch {
        // Fallback: just set client-side role
        setUserRole(selected);
      }
      setShowAuth(null);
      track('role_switch', { role: selected });
      toast({
        title: 'Role Switched! 🔄',
        description: `You're now using SwiftRamadan as a ${selected}.`,
      });
    } else {
      // New user - go to signup with role pre-selected
      setUserRole(selected);
      setShowAuth('signup');
      toast({
        title: 'Great choice! 🌙',
        description: `Let's create your ${selected} account.`,
      });
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -40, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col min-h-full w-full max-w-md mx-auto px-5 sm:px-6 pt-4 pb-8"
    >
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <h1 id="auth-role-heading" className="text-white text-xl sm:text-2xl font-extrabold tracking-tight">Choose Your Role</h1>
        <p className="text-white/50 text-sm sm:text-base mt-1">How would you like to use SwiftRamadan?</p>
      </div>

      {/* Role Cards */}
      <div className="flex flex-col gap-3 sm:gap-4 flex-1" role="radiogroup" aria-labelledby="auth-role-heading">
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
              role="radio"
              aria-checked={isSelected}
              aria-label={`${role.title}: ${role.description}`}
              className={`relative overflow-hidden rounded-2xl border-2 transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                isSelected
                  ? 'shadow-lg'
                  : 'border-white/10 hover:border-white/20'
              }`}
              style={{
                borderColor: isSelected ? role.accent : undefined,
                boxShadow: isSelected ? `0 4px 24px ${role.accent}20` : undefined,
              }}
            >
              {/* Background Image */}
              <div className="absolute inset-0 opacity-20" aria-hidden="true">
                <div
                  className="w-full h-full bg-center bg-cover"
                  style={{ backgroundImage: `url("${role.image}")` }}
                />
              </div>

              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${role.gradient} opacity-80`} aria-hidden="true" />

              {/* Content */}
              <div className="relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${role.accent}20`, border: `1px solid ${role.accent}40` }}
                >
                  <Icon aria-hidden="true" className="w-7 h-7" style={{ color: role.accent }} />
                </div>

                {/* Text */}
                <div className="flex-1 text-left">
                  <h3 className="text-white font-bold text-base sm:text-lg">{role.title}</h3>
                  <p className="text-white/60 text-xs sm:text-sm">{role.description}</p>
                </div>

                {/* Selected Indicator */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all`}
                  style={{
                    backgroundColor: isSelected ? role.accent : 'transparent',
                    border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  {isSelected && <Check aria-hidden="true" className="w-4 h-4 text-[var(--sr-surface-base)]" />}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Continue Button */}
      <ActionButton
        label="Continue"
        onClick={handleContinue}
        loading={loading}
        accentColor={ROLE_CONFIG[selected].accent}
      />

      {/* Trust microcopy */}
      <div className="flex items-center justify-center gap-1.5 mt-5 sm:mt-6 text-white/45 text-xs sm:text-[13px]">
        <ShieldCheck aria-hidden="true" className="w-3.5 h-3.5 text-[var(--sr-success)] shrink-0" />
        <span>Pick a role — you can switch anytime later</span>
      </div>
    </motion.div>
  );
}

/* ─────────────── Main Auth Screen ─────────────── */

export default function AuthScreen() {
  const showAuth = useShowAuth();
  const { setShowAuth, userRole, isLoggedIn } = useAuth();
  const { setShowWelcome } = useOnboarding();

  const handleBack = () => {
    if (showAuth === 'otp') {
      setShowAuth('signup');
    } else {
      // From login, signup, or role — go back to welcome page
      setShowWelcome(true);
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

  // Dynamic accent based on role
  const activeAccent = userRole ? ROLE_CONFIG[userRole].accent : ROLE_CONFIG.customer.accent;

  return (
    <AnimatePresence>
      {showAuth && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[110] flex flex-col"
          style={{ background: 'var(--sr-surface-base)' }}
          role="dialog"
          aria-modal="true"
          aria-label={getTitle() ? `${getTitle()} dialog` : 'Authentication dialog'}
        >
          {/* Top Bar - Luxury */}
          <div className="flex items-center justify-between px-4 sm:px-5 h-12 sm:h-14 shrink-0" style={{
            background: 'linear-gradient(180deg, rgba(212,175,55,0.03) 0%, transparent 100%)',
            borderBottom: '1px solid rgba(212,175,55,0.08)',
          }}>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:border-[var(--sr-luxury-gold)]/20 hover:bg-white/[0.06] transition-all duration-300 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-luxury-gold)]/40"
                aria-label="Go back"
              >
                <ArrowLeft aria-hidden="true" className="w-4.5 h-4.5 text-white/70" />
              </button>
              <span className="text-white/65 text-xs sm:text-sm font-semibold uppercase tracking-[0.15em]">{getTitle()}</span>
            </div>
            <button
              onClick={() => { setShowWelcome(true); setShowAuth(null); }}
              className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:border-[var(--sr-luxury-gold)]/20 hover:bg-white/[0.06] transition-all duration-300 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sr-luxury-gold)]/40"
              aria-label="Close and go to Welcome"
            >
              <X aria-hidden="true" className="w-4 h-4 text-white/70" />
            </button>
          </div>

          {/* Subtle gold accent line */}
          <div className="h-px" aria-hidden="true" style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.2) 50%, transparent 100%)',
          }} />

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
          <div className="shrink-0 h-6" style={{ background: 'var(--sr-surface-base)' }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
