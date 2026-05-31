'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import {
  X,
  ArrowLeft,
  Check,
  Camera,
  Truck,
  Users,
  Heart,
  Clock,
  ShoppingBag,
  MapPin,
  Bike,
  Car,
  Zap,
  UtensilsCrossed,
  Moon,
  CupSoda,
  Apple,
  Cookie,
  Flower2,
  ShoppingCart,
  ShieldCheck,
  CreditCard,
  User,
  ChevronDown,
  Sparkles,
  Award,
  Star,
  Store,
} from 'lucide-react';

/* ──────────────────── Accent Colors per Role ──────────────────── */

const ROLE_ACCENT = {
  customer: '#13ec13',
  vendor: '#FFD700',
  rider: '#3b82f6',
} as const;

const ROLE_BTN_CLASS = {
  customer: 'bg-[#13ec13] text-[#05070A] shadow-[#13ec13]/20',
  vendor: 'bg-[#FFD700] text-[#05070A] shadow-[#FFD700]/20',
  rider: 'bg-[#3b82f6] text-white shadow-[#3b82f6]/20',
} as const;

const ROLE_CTA = {
  customer: 'Start Shopping',
  vendor: 'Start Selling',
  rider: 'Start Earning',
} as const;

const ROLE_DEFAULT_TAB = {
  customer: 'home' as const,
  vendor: 'vendor-dashboard' as const,
  rider: 'rider-dashboard' as const,
};

/* ──────────────────── Data ──────────────────── */

const DIETARY_PREFS = [
  { id: 'halal', label: 'Halal Only', emoji: '🥩' },
  { id: 'vegetarian', label: 'Vegetarian Options', emoji: '🥬' },
  { id: 'no-spicy', label: 'No Spicy', emoji: '🌶️' },
  { id: 'gluten-free', label: 'Gluten Free', emoji: '🌾' },
  { id: 'nut-free', label: 'Nut Free', emoji: '🥜' },
  { id: 'diabetic', label: 'Diabetic Friendly', emoji: '💉' },
];

const FAVORITE_CATEGORIES = [
  { id: 'iftar', label: 'Iftar Meals', emoji: '🍽️' },
  { id: 'sahur', label: 'Sahur', emoji: '🌙' },
  { id: 'dates', label: 'Dates', emoji: '🌴' },
  { id: 'drinks', label: 'Drinks', emoji: '🥤' },
  { id: 'snacks', label: 'Snacks', emoji: '🍿' },
  { id: 'fruits', label: 'Fruits', emoji: '🍇' },
  { id: 'groceries', label: 'Groceries', emoji: '🛒' },
];

const LAGOS_AREAS = ['Lekki', 'Ikoyi', 'Victoria Island', 'Surulere', 'Ikeja', 'Yaba'];

const VENDOR_CATEGORIES = [
  'Iftar Meals', 'Grills', 'Sahur', 'Drinks', 'Groceries', 'Pharmacy', 'Bundles',
];

const VEHICLE_TYPES = [
  { id: 'motorcycle', label: 'Motorcycle', icon: Bike, description: 'Fast & agile for Lagos traffic' },
  { id: 'electric-bike', label: 'Electric Bike', icon: Zap, description: 'Eco-friendly & efficient' },
  { id: 'bicycle', label: 'Bicycle', icon: Bike, description: 'For short-distance deliveries' },
  { id: 'car', label: 'Car', icon: Car, description: 'For bulk & large orders' },
];

const ID_TYPES = ['National ID', "Driver's License", "Voter's Card", 'International Passport'];

/* ──────────────────── Progress Bar ──────────────────── */

function ProgressBar({ step, total, accent }: { step: number; total: number; accent: string }) {
  return (
    <div className="flex items-center gap-2 w-full">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div
            className="w-full h-1.5 rounded-full transition-all duration-500"
            style={{
              backgroundColor: i <= step ? accent : 'rgba(255,255,255,0.1)',
              boxShadow: i === step ? `0 0 8px ${accent}40` : 'none',
            }}
          />
        </div>
      ))}
      <span className="text-white/30 text-xs font-medium ml-2 shrink-0">
        Step {step + 1} of {total}
      </span>
    </div>
  );
}

/* ──────────────────── Confetti Particle ──────────────────── */

function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const randomX = Math.random() * 300 - 150;
  const randomY = Math.random() * 400 + 100;
  const randomRotate = Math.random() * 720 - 360;
  const size = Math.random() * 8 + 4;

  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      animate={{ opacity: 0, x: randomX, y: randomY, rotate: randomRotate, scale: 0.3 }}
      transition={{ duration: 1.8, delay, ease: 'easeOut' }}
      className="absolute rounded-sm"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: '50%',
        top: '40%',
      }}
    />
  );
}

/* ════════════════════════════════════════════════════════════════
   CUSTOMER ONBOARDING STEPS
   ════════════════════════════════════════════════════════════════ */

function CustomerStep1() {
  const { userName } = useAppStore();
  const firstName = userName?.split(' ')[0] || 'there';

  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -60, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col items-center text-center px-6 py-8"
    >
      {/* Animated Welcome */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 150, delay: 0.1 }}
        className="w-24 h-24 rounded-full bg-[#13ec13]/10 border-2 border-[#13ec13]/30 flex items-center justify-center mb-6"
        style={{ boxShadow: '0 0 30px #13ec1320' }}
      >
        <span className="text-5xl">🌙</span>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-white text-3xl font-extrabold tracking-tight mb-2"
      >
        Welcome to SwiftRamadan!
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-[#13ec13] text-xl font-bold mb-1"
      >
        Ramadan Mubarak, {firstName}! 🎉
      </motion.p>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-white/50 text-sm mb-8"
      >
        Let&apos;s personalize your experience
      </motion.p>

      {/* Feature Highlights */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full flex flex-col gap-4"
      >
        {[
          { icon: Truck, title: 'Iftar Delivery', desc: 'Hot meals timed perfectly for Maghrib', color: '#13ec13' },
          { icon: Users, title: 'Group Buy', desc: 'Community savings on Ramadan staples', color: '#FFD700' },
          { icon: Heart, title: 'Charity & Zakat', desc: 'Give back this blessed month', color: '#f472b6' },
        ].map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            className="flex items-center gap-4 p-4 bg-[#1A1D26] border border-white/10 rounded-xl"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${feature.color}15`, border: `1px solid ${feature.color}30` }}
            >
              <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-white font-bold text-sm">{feature.title}</h3>
              <p className="text-white/50 text-xs">{feature.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function CustomerStep2() {
  const { customerDietaryPrefs, setCustomerDietaryPrefs, customerFavoriteCategories, setCustomerFavoriteCategories } = useAppStore();

  const toggleDietary = (id: string) => {
    setCustomerDietaryPrefs(
      customerDietaryPrefs.includes(id)
        ? customerDietaryPrefs.filter((p) => p !== id)
        : [...customerDietaryPrefs, id]
    );
  };

  const toggleCategory = (id: string) => {
    setCustomerFavoriteCategories(
      customerFavoriteCategories.includes(id)
        ? customerFavoriteCategories.filter((c) => c !== id)
        : [...customerFavoriteCategories, id]
    );
  };

  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -60, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col px-6 py-8"
    >
      <h1 className="text-white text-2xl font-extrabold tracking-tight mb-1">Your Preferences</h1>
      <p className="text-white/50 text-sm mb-6">Help us tailor your Ramadan experience</p>

      {/* Dietary Preferences */}
      <div className="mb-6">
        <h3 className="text-white/70 text-xs font-bold uppercase tracking-wider mb-3">Dietary Preferences</h3>
        <div className="flex flex-wrap gap-2">
          {DIETARY_PREFS.map((pref) => {
            const isSelected = customerDietaryPrefs.includes(pref.id);
            return (
              <motion.button
                key={pref.id}
                onClick={() => toggleDietary(pref.id)}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-[#13ec13]/15 border border-[#13ec13]/40 text-[#13ec13]'
                    : 'bg-[#1A1D26] border border-white/10 text-white/60 hover:border-white/20'
                }`}
              >
                <span className="text-base">{pref.emoji}</span>
                {pref.label}
                {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Favorite Categories */}
      <div>
        <h3 className="text-white/70 text-xs font-bold uppercase tracking-wider mb-3">Favorite Categories</h3>
        <div className="grid grid-cols-3 gap-3">
          {FAVORITE_CATEGORIES.map((cat) => {
            const isSelected = customerFavoriteCategories.includes(cat.id);
            return (
              <motion.button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-[#13ec13]/10 border-2 border-[#13ec13]/40'
                    : 'bg-[#1A1D26] border border-white/10 hover:border-white/20'
                }`}
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className={`text-xs font-semibold ${isSelected ? 'text-[#13ec13]' : 'text-white/60'}`}>
                  {cat.label}
                </span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-4 h-4 rounded-full bg-[#13ec13] flex items-center justify-center"
                  >
                    <Check className="w-2.5 h-2.5 text-[#05070A]" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function CustomerStep3() {
  const {
    deliveryAddress, setDeliveryAddress,
    userArea, setUserArea,
  } = useAppStore();
  const [deliverBeforeIftar, setDeliverBeforeIftar] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);

  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -60, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col px-6 py-8"
    >
      <h1 className="text-white text-2xl font-extrabold tracking-tight mb-1">Set Your Delivery Location</h1>
      <p className="text-white/50 text-sm mb-6">Where should we deliver your iftar?</p>

      <div className="flex flex-col gap-5">
        {/* Address Input */}
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#13ec13]/60" />
          <input
            type="text"
            placeholder="Enter delivery address"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#13ec13]/50 transition-colors"
          />
        </div>

        {/* Area Selector */}
        <div className="relative">
          <button
            onClick={() => setAreaOpen(!areaOpen)}
            className={`w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-4 pr-10 text-left text-sm focus:outline-none transition-colors flex items-center ${userArea ? 'text-white' : 'text-white/30'}`}
          >
            <MapPin className="w-4 h-4 mr-2 text-[#13ec13]/60" />
            {userArea || 'Select your area'}
          </button>
          <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 transition-transform ${areaOpen ? 'rotate-180' : ''}`} />

          <AnimatePresence>
            {areaOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-16 left-0 right-0 bg-[#1A1D26] border border-white/10 rounded-xl overflow-hidden z-20 shadow-2xl"
              >
                {LAGOS_AREAS.map((a) => (
                  <button
                    key={a}
                    onClick={() => { setUserArea(a); setAreaOpen(false); }}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex items-center justify-between ${userArea === a ? 'text-[#13ec13]' : 'text-white/70'}`}
                  >
                    {a}
                    {userArea === a && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Deliver Before Iftar Toggle */}
        <div className="flex items-center justify-between p-4 bg-[#1A1D26] border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#13ec13]/10 flex items-center justify-center">
              <Moon className="w-5 h-5 text-[#13ec13]" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Deliver before Iftar</p>
              <p className="text-white/40 text-xs">Priority delivery before Maghrib</p>
            </div>
          </div>
          <button
            onClick={() => setDeliverBeforeIftar(!deliverBeforeIftar)}
            className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center px-0.5 ${
              deliverBeforeIftar ? 'bg-[#13ec13]' : 'bg-white/10'
            }`}
          >
            <motion.div
              animate={{ x: deliverBeforeIftar ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-6 h-6 rounded-full bg-white shadow-md"
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
   VENDOR ONBOARDING STEPS
   ════════════════════════════════════════════════════════════════ */

function VendorStep1() {
  const {
    vendorStoreName, setVendorStoreName,
    vendorBusinessCategory, setVendorBusinessCategory,
    vendorBusinessAddress, setVendorBusinessAddress,
  } = useAppStore();
  const [storeDesc, setStoreDesc] = useState('');
  const [catOpen, setCatOpen] = useState(false);

  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -60, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col px-6 py-8"
    >
      <h1 className="text-white text-2xl font-extrabold tracking-tight mb-1">Set Up Your Store</h1>
      <p className="text-white/50 text-sm mb-6">Tell us about your business</p>

      <div className="flex flex-col gap-4">
        {/* Store Logo Placeholder */}
        <div className="flex justify-center mb-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => toast({ title: 'Coming soon', description: 'Logo upload will be available soon.' })}
            className="w-24 h-24 rounded-2xl bg-[#1A1D26] border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1 hover:border-[#FFD700]/40 transition-colors"
          >
            <Camera className="w-6 h-6 text-white/30" />
            <span className="text-white/30 text-[10px] font-medium">Store Logo</span>
          </motion.button>
        </div>

        {/* Store Name */}
        <div className="relative">
          <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFD700]/60" />
          <input
            type="text"
            placeholder="Store name"
            value={vendorStoreName}
            onChange={(e) => setVendorStoreName(e.target.value)}
            className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-colors"
          />
        </div>

        {/* Business Category */}
        <div className="relative">
          <button
            onClick={() => setCatOpen(!catOpen)}
            className={`w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-4 pr-10 text-left text-sm focus:outline-none transition-colors flex items-center ${vendorBusinessCategory ? 'text-white' : 'text-white/30'}`}
          >
            <ShoppingBag className="w-4 h-4 mr-2 text-[#FFD700]/60" />
            {vendorBusinessCategory || 'Business category'}
          </button>
          <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 transition-transform ${catOpen ? 'rotate-180' : ''}`} />
          <AnimatePresence>
            {catOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-16 left-0 right-0 bg-[#1A1D26] border border-white/10 rounded-xl overflow-hidden z-20 shadow-2xl"
              >
                {VENDOR_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setVendorBusinessCategory(cat); setCatOpen(false); }}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex items-center justify-between ${vendorBusinessCategory === cat ? 'text-[#FFD700]' : 'text-white/70'}`}
                  >
                    {cat}
                    {vendorBusinessCategory === cat && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Business Address */}
        <div className="relative">
          <MapPin className="absolute left-4 top-4 w-5 h-5 text-[#FFD700]/60" />
          <input
            type="text"
            placeholder="Business address"
            value={vendorBusinessAddress}
            onChange={(e) => setVendorBusinessAddress(e.target.value)}
            className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-colors"
          />
        </div>

        {/* Store Description */}
        <textarea
          placeholder="Describe your store (what makes it special?)"
          value={storeDesc}
          onChange={(e) => setStoreDesc(e.target.value)}
          rows={3}
          className="w-full bg-[#1A1D26] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-colors resize-none"
        />
      </div>
    </motion.div>
  );
}

function VendorStep2() {
  const {
    vendorOpenTime, setVendorOpenTime,
    vendorCloseTime, setVendorCloseTime,
  } = useAppStore();
  const [sahurOrders, setSahurOrders] = useState(false);
  const [iftarRush, setIftarRush] = useState(true);
  const [maxOrders, setMaxOrders] = useState('50');

  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -60, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col px-6 py-8"
    >
      <h1 className="text-white text-2xl font-extrabold tracking-tight mb-1">Business Hours & Details</h1>
      <p className="text-white/50 text-sm mb-6">When are you open for orders?</p>

      <div className="flex flex-col gap-5">
        {/* Open/Close Time */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-white/50 text-xs font-semibold mb-2 block">Opening Time</label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFD700]/60" />
              <input
                type="time"
                value={vendorOpenTime}
                onChange={(e) => setVendorOpenTime(e.target.value)}
                className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-11 pr-4 text-white text-sm focus:outline-none focus:border-[#FFD700]/50 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-white/50 text-xs font-semibold mb-2 block">Closing Time</label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFD700]/60" />
              <input
                type="time"
                value={vendorCloseTime}
                onChange={(e) => setVendorCloseTime(e.target.value)}
                className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-11 pr-4 text-white text-sm focus:outline-none focus:border-[#FFD700]/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Sahur Orders Toggle */}
        <div className="flex items-center justify-between p-4 bg-[#1A1D26] border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 flex items-center justify-center">
              <Moon className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Open for Sahur orders</p>
              <p className="text-white/40 text-xs">Accept orders between 4-5 AM</p>
            </div>
          </div>
          <button
            onClick={() => setSahurOrders(!sahurOrders)}
            className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center px-0.5 ${sahurOrders ? 'bg-[#FFD700]' : 'bg-white/10'}`}
          >
            <motion.div
              animate={{ x: sahurOrders ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-6 h-6 rounded-full bg-white shadow-md"
            />
          </button>
        </div>

        {/* Iftar Rush Toggle */}
        <div className="flex items-center justify-between p-4 bg-[#1A1D26] border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Accept Iftar rush orders</p>
              <p className="text-white/40 text-xs">High-demand period before Maghrib</p>
            </div>
          </div>
          <button
            onClick={() => setIftarRush(!iftarRush)}
            className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center px-0.5 ${iftarRush ? 'bg-[#FFD700]' : 'bg-white/10'}`}
          >
            <motion.div
              animate={{ x: iftarRush ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-6 h-6 rounded-full bg-white shadow-md"
            />
          </button>
        </div>

        {/* Max Daily Orders */}
        <div>
          <label className="text-white/50 text-xs font-semibold mb-2 block">Maximum Daily Orders</label>
          <div className="relative">
            <ShoppingCart className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFD700]/60" />
            <input
              type="number"
              placeholder="e.g., 50"
              value={maxOrders}
              onChange={(e) => setMaxOrders(e.target.value)}
              className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-11 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-colors"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function VendorStep3() {
  const {
    vendorBankName, setVendorBankName,
    vendorAccountNumber, setVendorAccountNumber,
  } = useAppStore();
  const [accountHolder, setAccountHolder] = useState('');

  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -60, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col px-6 py-8"
    >
      <h1 className="text-white text-2xl font-extrabold tracking-tight mb-1">Payment Setup</h1>
      <p className="text-white/50 text-sm mb-6">Where should we send your earnings?</p>

      <div className="flex flex-col gap-5">
        {/* Bank Illustration */}
        <div className="flex justify-center mb-2">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: '#FFD70010', border: '1px solid #FFD70030' }}
          >
            <CreditCard className="w-10 h-10 text-[#FFD700]" />
          </div>
        </div>

        {/* Bank Name */}
        <div className="relative">
          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFD700]/60" />
          <input
            type="text"
            placeholder="Bank name"
            value={vendorBankName}
            onChange={(e) => setVendorBankName(e.target.value)}
            className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-colors"
          />
        </div>

        {/* Account Number */}
        <div className="relative">
          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFD700]/60" />
          <input
            type="text"
            placeholder="Account number"
            value={vendorAccountNumber}
            onChange={(e) => setVendorAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-colors"
          />
        </div>

        {/* Account Holder Name */}
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFD700]/60" />
          <input
            type="text"
            placeholder="Account holder name"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-colors"
          />
        </div>

        {/* Security Note */}
        <div className="flex items-start gap-3 p-4 bg-[#1A1D26] border border-[#FFD700]/10 rounded-xl">
          <ShieldCheck className="w-5 h-5 text-[#FFD700] shrink-0 mt-0.5" />
          <p className="text-white/50 text-xs leading-relaxed">
            Your banking details are encrypted and secure. SwiftRamadan never stores raw account numbers.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
   RIDER ONBOARDING STEPS
   ════════════════════════════════════════════════════════════════ */

function RiderStep1() {
  const {
    riderVehicleType, setRiderVehicleType,
    riderVehicleColor, setRiderVehicleColor,
    riderPlateNumber, setRiderPlateNumber,
  } = useAppStore();

  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -60, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col px-6 py-8"
    >
      <h1 className="text-white text-2xl font-extrabold tracking-tight mb-1">Vehicle Information</h1>
      <p className="text-white/50 text-sm mb-6">Tell us about your ride</p>

      <div className="flex flex-col gap-5">
        {/* Vehicle Type Cards */}
        <div className="grid grid-cols-2 gap-3">
          {VEHICLE_TYPES.map((vehicle, i) => {
            const Icon = vehicle.icon;
            const isSelected = riderVehicleType.toLowerCase().replace(/\s+/g, '-') === vehicle.id ||
              (vehicle.id === 'motorcycle' && riderVehicleType === 'Motorcycle');
            return (
              <motion.button
                key={vehicle.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setRiderVehicleType(vehicle.label)}
                whileTap={{ scale: 0.97 }}
                className={`flex flex-col items-center gap-2 p-5 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-[#3b82f6]/10 border-2 border-[#3b82f6]/50'
                    : 'bg-[#1A1D26] border border-white/10 hover:border-white/20'
                }`}
                style={{ boxShadow: isSelected ? '0 0 15px #3b82f620' : 'none' }}
              >
                <Icon className={`w-8 h-8 ${isSelected ? 'text-[#3b82f6]' : 'text-white/40'}`} />
                <span className={`text-sm font-bold ${isSelected ? 'text-[#3b82f6]' : 'text-white/70'}`}>
                  {vehicle.label}
                </span>
                <span className="text-white/30 text-[10px] text-center">{vehicle.description}</span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 rounded-full bg-[#3b82f6] flex items-center justify-center mt-1"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Vehicle Color */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white/20 bg-gradient-to-br from-red-400 via-green-400 to-blue-400" />
          <input
            type="text"
            placeholder="Vehicle color"
            value={riderVehicleColor}
            onChange={(e) => setRiderVehicleColor(e.target.value)}
            className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
          />
        </div>

        {/* Plate Number */}
        <div className="relative">
          <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3b82f6]/60" />
          <input
            type="text"
            placeholder="Plate number (e.g., LSR 123 AB)"
            value={riderPlateNumber}
            onChange={(e) => setRiderPlateNumber(e.target.value.toUpperCase())}
            className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#3b82f6]/50 transition-colors uppercase tracking-wider font-mono"
          />
        </div>
      </div>
    </motion.div>
  );
}

function RiderStep2() {
  const { riderLicenseNumber, setRiderLicenseNumber } = useAppStore();
  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idOpen, setIdOpen] = useState(false);

  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -60, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col px-6 py-8"
    >
      <h1 className="text-white text-2xl font-extrabold tracking-tight mb-1">Documents & Verification</h1>
      <p className="text-white/50 text-sm mb-6">We need to verify your identity</p>

      <div className="flex flex-col gap-5">
        {/* License Number */}
        <div className="relative">
          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3b82f6]/60" />
          <input
            type="text"
            placeholder="License number"
            value={riderLicenseNumber}
            onChange={(e) => setRiderLicenseNumber(e.target.value)}
            className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
          />
        </div>

        {/* ID Type */}
        <div className="relative">
          <button
            onClick={() => setIdOpen(!idOpen)}
            className={`w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-4 pr-10 text-left text-sm focus:outline-none transition-colors flex items-center ${idType ? 'text-white' : 'text-white/30'}`}
          >
            <User className="w-4 h-4 mr-2 text-[#3b82f6]/60" />
            {idType || 'ID type'}
          </button>
          <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 transition-transform ${idOpen ? 'rotate-180' : ''}`} />
          <AnimatePresence>
            {idOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-16 left-0 right-0 bg-[#1A1D26] border border-white/10 rounded-xl overflow-hidden z-20 shadow-2xl"
              >
                {ID_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => { setIdType(type); setIdOpen(false); }}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex items-center justify-between ${idType === type ? 'text-[#3b82f6]' : 'text-white/70'}`}
                  >
                    {type}
                    {idType === type && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ID Number */}
        <div className="relative">
          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3b82f6]/60" />
          <input
            type="text"
            placeholder="ID number"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
          />
        </div>

        {/* Upload Documents Placeholder */}
        <div>
          <label className="text-white/50 text-xs font-semibold mb-3 block">Upload Documents</label>
          <div className="grid grid-cols-2 gap-3">
            {['License Photo', 'ID Card Photo'].map((doc) => (
              <motion.button
                key={doc}
                whileTap={{ scale: 0.97 }}
                onClick={() => toast({ title: 'Coming soon', description: `${doc} upload will be available soon.` })}
                className="flex flex-col items-center gap-2 p-5 bg-[#1A1D26] border border-dashed border-white/20 rounded-xl hover:border-[#3b82f6]/30 transition-colors"
              >
                <Camera className="w-6 h-6 text-white/25" />
                <span className="text-white/40 text-[11px] font-medium text-center">{doc}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-start gap-3 p-4 bg-[#1A1D26] border border-[#3b82f6]/10 rounded-xl">
          <ShieldCheck className="w-5 h-5 text-[#3b82f6] shrink-0 mt-0.5" />
          <p className="text-white/50 text-xs leading-relaxed">
            Your documents are encrypted and used only for verification. Processing takes 24-48 hours.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function RiderStep3() {
  const {
    riderBankName, setRiderBankName,
    riderAccountNumber, setRiderAccountNumber,
  } = useAppStore();
  const [accountHolder, setAccountHolder] = useState('');

  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -60, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col px-6 py-8"
    >
      <h1 className="text-white text-2xl font-extrabold tracking-tight mb-1">Payment Setup</h1>
      <p className="text-white/50 text-sm mb-6">Where should we send your earnings?</p>

      <div className="flex flex-col gap-5">
        {/* Earnings Illustration */}
        <div className="flex justify-center mb-2">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: '#3b82f610', border: '1px solid #3b82f630' }}
          >
            <Star className="w-10 h-10 text-[#3b82f6]" />
          </div>
        </div>

        {/* Bank Name */}
        <div className="relative">
          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3b82f6]/60" />
          <input
            type="text"
            placeholder="Bank name"
            value={riderBankName}
            onChange={(e) => setRiderBankName(e.target.value)}
            className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
          />
        </div>

        {/* Account Number */}
        <div className="relative">
          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3b82f6]/60" />
          <input
            type="text"
            placeholder="Account number"
            value={riderAccountNumber}
            onChange={(e) => setRiderAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
          />
        </div>

        {/* Account Holder Name */}
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3b82f6]/60" />
          <input
            type="text"
            placeholder="Account holder name"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            className="w-full h-14 bg-[#1A1D26] border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
          />
        </div>

        {/* Security Note */}
        <div className="flex items-start gap-3 p-4 bg-[#1A1D26] border border-[#3b82f6]/10 rounded-xl">
          <ShieldCheck className="w-5 h-5 text-[#3b82f6] shrink-0 mt-0.5" />
          <p className="text-white/50 text-xs leading-relaxed">
            Your banking details are encrypted and secure. Payments are settled daily.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CELEBRATION SCREEN
   ════════════════════════════════════════════════════════════════ */

function CelebrationScreen({ role, onDone }: { role: 'customer' | 'vendor' | 'rider'; onDone: () => void }) {
  const accent = ROLE_ACCENT[role];
  const confettiColors = useMemo(() => {
    const base = [accent, '#FFD700', '#ffffff', '#f472b6', '#06b6d4', '#a78bfa'];
    return base;
  }, [accent]);

  const ctaText = ROLE_CTA[role];
  const btnClass = ROLE_BTN_CLASS[role];
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  const messages: Record<string, string> = {
    customer: 'Your personalized Ramadan experience is ready!',
    vendor: 'Your store is now live on SwiftRamadan!',
    rider: 'You\'re all set to start delivering & earning!',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] bg-[#05070A] flex flex-col items-center justify-center px-8"
    >
      {/* Confetti Particles */}
      {confettiColors.map((color, i) => (
        <ConfettiParticle key={i} delay={i * 0.08} color={color} />
      ))}

      {/* Checkmark */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, stiffness: 100, delay: 0.2 }}
        className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
        style={{
          backgroundColor: `${accent}15`,
          border: `3px solid ${accent}50`,
          boxShadow: `0 0 40px ${accent}30`,
        }}
      >
        <Check className="w-12 h-12" style={{ color: accent }} />
      </motion.div>

      {/* Text */}
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-white text-3xl font-extrabold tracking-tight text-center mb-3"
      >
        You&apos;re All Set! 🎉
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-white/50 text-sm text-center mb-2"
      >
        {messages[role]}
      </motion.p>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-sm font-bold text-center mb-10"
        style={{ color: accent }}
      >
        Welcome, {roleLabel}!
      </motion.p>

      {/* CTA Button */}
      <motion.button
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
        onClick={onDone}
        whileTap={{ scale: 0.97 }}
        className={`w-full max-w-xs h-14 rounded-xl font-bold text-base shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2 ${btnClass}`}
      >
        <Sparkles className="w-5 h-5" />
        {ctaText}
      </motion.button>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN ONBOARDING FLOW
   ════════════════════════════════════════════════════════════════ */

export default function OnboardingFlow() {
  const {
    showOnboarding,
    setShowOnboarding,
    onboardingStep,
    setOnboardingStep,
    onboardingComplete,
    setOnboardingComplete,
    userRole,
    setActiveTab,
  } = useAppStore();

  const [showCelebration, setShowCelebration] = useState(false);

  const accent = ROLE_ACCENT[userRole];
  const btnClass = ROLE_BTN_CLASS[userRole];
  const ctaText = ROLE_CTA[userRole];
  const totalSteps = 3;

  const getStepContent = () => {
    switch (userRole) {
      case 'customer':
        return [
          <CustomerStep1 key="c1" />,
          <CustomerStep2 key="c2" />,
          <CustomerStep3 key="c3" />,
        ];
      case 'vendor':
        return [
          <VendorStep1 key="v1" />,
          <VendorStep2 key="v2" />,
          <VendorStep3 key="v3" />,
        ];
      case 'rider':
        return [
          <RiderStep1 key="r1" />,
          <RiderStep2 key="r2" />,
          <RiderStep3 key="r3" />,
        ];
      default:
        return [<CustomerStep1 key="c1" />, <CustomerStep2 key="c2" />, <CustomerStep3 key="c3" />];
    }
  };

  const steps = getStepContent();

  const handleNext = () => {
    if (onboardingStep < totalSteps - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      // Complete onboarding - show celebration
      setShowCelebration(true);
    }
  };

  const handleBack = () => {
    if (onboardingStep > 0) {
      setOnboardingStep(onboardingStep - 1);
    }
  };

  const handleSkip = () => {
    setShowCelebration(true);
  };

  const handleCelebrationDone = () => {
    setOnboardingComplete(true);
    setShowOnboarding(false);
    setActiveTab(ROLE_DEFAULT_TAB[userRole]);
    setOnboardingStep(0);
    setShowCelebration(false);
    toast({
      title: `Welcome to SwiftRamadan! 🌙`,
      description: `Your ${userRole} experience is ready.`,
    });
  };

  // Reset celebration state when onboarding reopens
  const handleOnboardingClose = () => {
    if (!showCelebration) {
      setShowCelebration(true);
    }
  };

  if (!showOnboarding || onboardingComplete) return null;

  // Show celebration overlay
  if (showCelebration) {
    return (
      <AnimatePresence>
        <CelebrationScreen role={userRole} onDone={handleCelebrationDone} />
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[120] bg-[#05070A] flex flex-col"
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-white/5">
          <div className="flex items-center gap-3">
            {onboardingStep > 0 ? (
              <button
                onClick={handleBack}
                className="w-10 h-10 rounded-full bg-[#1A1D26] border border-white/10 flex items-center justify-center hover:border-white/20 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            ) : (
              <div className="w-10" />
            )}
          </div>

          {/* Progress */}
          <div className="flex-1 mx-4">
            <ProgressBar step={onboardingStep} total={totalSteps} accent={accent} />
          </div>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="text-white/40 text-sm font-semibold hover:text-white/60 transition-colors px-2"
          >
            Skip
          </button>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {steps[onboardingStep]}
          </AnimatePresence>
        </div>

        {/* Bottom Action Button */}
        <div className="shrink-0 px-6 py-5 border-t border-white/5 bg-[#05070A]">
          <button
            onClick={handleNext}
            whileTap={{ scale: 0.97 }}
            className={`w-full h-14 rounded-xl font-bold text-base shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2 ${btnClass}`}
          >
            {onboardingStep === totalSteps - 1 ? (
              <>
                <Sparkles className="w-5 h-5" />
                {ctaText}
              </>
            ) : (
              <>
                Continue
                <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
              </>
            )}
          </button>
        </div>

        {/* Bottom Safe Area */}
        <div className="shrink-0 h-2 bg-[#05070A]" />
      </motion.div>
    </AnimatePresence>
  );
}
