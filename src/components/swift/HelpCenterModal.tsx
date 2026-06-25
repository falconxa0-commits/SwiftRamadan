'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  HelpCircle,
  Search,
  ChevronDown,
  MessageSquare,
  Flag,
  Truck,
  CreditCard,
  User,
  Moon,
  Store,
  Bike,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

type Category = 'Getting Started' | 'Orders & Delivery' | 'Payments' | 'Account' | 'Ramadan Features';

interface FAQ {
  q: string;
  a: string;
  category: Category;
  keywords?: string[];
}

const FAQS: FAQ[] = [
  // Getting Started
  {
    q: 'How do I place my first order on SwiftRamadan?',
    a: 'Tap the Search bar or Explore tab, browse meals or groceries, tap an item to view details, then tap "Add to Cart". Once you\'re ready, open your Cart tab and tap "Proceed to Checkout". Choose your delivery address, schedule, and payment method, then place your order.',
    category: 'Getting Started',
    keywords: ['order', 'first', 'place', 'buy'],
  },
  {
    q: 'Which areas in Lagos does SwiftRamadan deliver to?',
    a: 'We currently deliver across major Lagos areas including Lekki, Victoria Island, Ikoyi, Ikeja, Surulere, Yaba, Festac, and Gbagada. You can set your area during onboarding or in Profile → Edit Profile.',
    category: 'Getting Started',
    keywords: ['area', 'deliver', 'lagos', 'location'],
  },
  {
    q: 'How do I switch between Customer, Vendor, and Rider roles?',
    a: 'Open the Profile tab, tap "Switch Role", and pick the experience you want. You can switch back any time — your data for each role is preserved separately.',
    category: 'Getting Started',
    keywords: ['switch', 'role', 'vendor', 'rider', 'customer'],
  },

  // Orders & Delivery
  {
    q: 'How long does delivery usually take?',
    a: 'Most orders arrive in 30–45 minutes. During Iftar rush hour (5–7 PM), it may take up to 60 minutes. Use "Iftar Precision" at checkout to time your delivery for Maghrib.',
    category: 'Orders & Delivery',
    keywords: ['delivery', 'time', 'how long', 'minutes'],
  },
  {
    q: 'Can I track my rider in real time?',
    a: 'Yes. Open the Orders tab, tap any active order, then tap "Track" to open the live tracking map. You\'ll see your rider\'s location, ETA, and can call them directly.',
    category: 'Orders & Delivery',
    keywords: ['track', 'rider', 'live', 'map', 'eta'],
  },
  {
    q: 'What is "Iftar Precision" delivery?',
    a: 'Iftar Precision schedules your order to arrive 5–10 minutes before Maghrib (based on prayer times in your area), so your meal is hot and ready exactly when you break your fast.',
    category: 'Orders & Delivery',
    keywords: ['iftar', 'precision', 'maghrib', 'schedule', 'timing'],
  },
  {
    q: 'How do I cancel an order?',
    a: 'You can cancel an order for free within 2 minutes of placing it. After that, if the restaurant has started preparing, cancellation may attract a fee. Open the order → tap "Cancel Order" → confirm.',
    category: 'Orders & Delivery',
    keywords: ['cancel', 'refund', 'cancel order'],
  },

  // Payments
  {
    q: 'What payment methods can I use?',
    a: 'We accept cards (Visa, Mastercard, Verve), bank transfers, Paystack, and cash on delivery. You can also use Buy Now Pay Later (BNPL) for orders above ₦5,000.',
    category: 'Payments',
    keywords: ['payment', 'card', 'transfer', 'cash', 'paystack', 'bnpl'],
  },
  {
    q: 'How do Swift Points and coupons work?',
    a: 'You earn Swift Points on every order. Redeem them in the Profile tab under "Redeem Points" for coupons like ₦500 off, ₦1000 off, or Free Delivery. Coupons can be applied at checkout in the cart.',
    category: 'Payments',
    keywords: ['points', 'coupon', 'redeem', 'discount', 'swift points'],
  },
  {
    q: 'Is it safe to save my card on SwiftRamadan?',
    a: 'Yes. Cards are tokenized and stored securely with Paystack — we never see or store your raw card number. You can remove saved cards any time in Settings → Payment Methods.',
    category: 'Payments',
    keywords: ['card', 'safe', 'secure', 'paystack'],
  },

  // Account
  {
    q: 'How do I update my profile, phone, or area?',
    a: 'Open the Profile tab → tap "Edit Profile" (or open Settings → Edit Profile). Update your name, phone, area, and avatar, then tap Save Changes. Changes sync instantly across the app.',
    category: 'Account',
    keywords: ['profile', 'update', 'edit', 'phone', 'name', 'area'],
  },
  {
    q: 'How do I change my notification, language, or currency preferences?',
    a: 'Open Settings from the Profile tab. You can toggle push/email notifications, switch language (English, Yoruba, Hausa, Igbo, Arabic), and choose currency (NGN, USD, GBP).',
    category: 'Account',
    keywords: ['settings', 'language', 'currency', 'notification', 'preferences'],
  },
  {
    q: 'How do I log out?',
    a: 'Open the Profile tab → scroll to "Log Out" at the bottom, or open Settings → Log Out. You can log back in with your email and password any time.',
    category: 'Account',
    keywords: ['logout', 'log out', 'sign out', 'exit'],
  },

  // Ramadan Features
  {
    q: 'What Ramadan-specific features does SwiftRamadan offer?',
    a: 'We offer Iftar Precision delivery, Sahur Wake-Up alarm, prayer times widget, daily Hasanat points, charity & Zakat giving, mosque Sadaqah, Ramadan family boxes, and a Smart Kitchen with live AI cooking coach for Iftar meals.',
    category: 'Ramadan Features',
    keywords: ['ramadan', 'iftar', 'sahur', 'prayer', 'hasanat', 'zakat', 'charity'],
  },
  {
    q: 'How do I use the Sahur Wake-Up alarm?',
    a: 'Open the Sahur Wake-Up modal from the Home tab. Set your preferred wake-up time (defaults to 4:30 AM), enable the alarm, and we\'ll send you a reminder before Fajr so you can prep Sahur on time.',
    category: 'Ramadan Features',
    keywords: ['sahur', 'alarm', 'wake up', 'fajr'],
  },
  {
    q: 'How can I give Zakat or Sadaqah through the app?',
    a: 'Open the Profile tab → "Charity & Zakat". You can calculate your Zakat, donate to verified mosques, or contribute to iftar meals for the needy. Donations are added to your cart and processed securely.',
    category: 'Ramadan Features',
    keywords: ['zakat', 'sadaqah', 'charity', 'donate', 'mosque'],
  },

  // Vendor & Rider
  {
    q: 'How do I become a SwiftRamadan vendor?',
    a: 'Switch to Vendor role from the Profile tab. Complete vendor onboarding (store name, business category, bank details, operating hours). Once approved, you can list products, manage stock, and accept orders.',
    category: 'Account',
    keywords: ['vendor', 'sell', 'store', 'become vendor'],
  },
  {
    q: 'How do I become a SwiftRamadan rider?',
    a: 'Switch to Rider role from the Profile tab. Complete rider onboarding (vehicle type, plate number, license, bank details). Once approved, toggle yourself "Online" to start receiving delivery requests.',
    category: 'Account',
    keywords: ['rider', 'driver', 'deliver', 'become rider'],
  },
];

const CATEGORIES: { id: Category | 'All'; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: 'All', label: 'All', icon: HelpCircle, color: 'text-white/60' },
  { id: 'Getting Started', label: 'Getting Started', icon: User, color: 'text-[#10E07A]' },
  { id: 'Orders & Delivery', label: 'Orders', icon: Truck, color: 'text-[#38BDF8]' },
  { id: 'Payments', label: 'Payments', icon: CreditCard, color: 'text-[#F5C451]' },
  { id: 'Account', label: 'Account', icon: User, color: 'text-[#A78BFA]' },
  { id: 'Ramadan Features', label: 'Ramadan', icon: Moon, color: 'text-[#FB7185]' },
];

export default function HelpCenterModal() {
  const { activeModal, setActiveModal } = useAppStore();
  const { toast } = useToast();
  const isOpen = activeModal === 'help-center';

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    const q = search.toLowerCase().trim();
    return FAQS.filter(faq => {
      const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      const haystack = (faq.q + ' ' + faq.a + ' ' + (faq.keywords || []).join(' ')).toLowerCase();
      return haystack.includes(q);
    });
  }, [search, activeCategory]);

  const handleClose = () => setActiveModal(null);

  const handleContactSupport = () => {
    toast({
      title: 'Support team will reach out via WhatsApp',
      description: 'Our team typically responds within 15 minutes during business hours.',
    });
  };

  const handleReportProblem = () => {
    toast({
      title: 'Report submitted',
      description: 'Thanks for the feedback. We\'ll investigate and follow up via email.',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-md max-h-[90vh] glass-card rounded-3xl border border-white/10 overflow-hidden flex flex-col pointer-events-auto"
              style={{ background: 'linear-gradient(180deg, rgba(15,17,24,0.95), rgba(11,13,20,0.98))' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#10E07A]/10 border border-[#10E07A]/30 flex items-center justify-center icon-tile">
                    <HelpCircle className="w-5 h-5 text-[#10E07A] relative z-10" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-base tracking-tight">Help Center</h2>
                    <p className="text-white/40 text-[11px]">FAQs, guides & support</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  aria-label="Close help center"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Search */}
              <div className="px-5 pt-4 pb-3 shrink-0">
                <div className="flex items-center gap-2 bg-[#0F1118] border border-white/10 rounded-xl px-3 focus-within:border-[#10E07A]/40 transition-colors">
                  <Search className="w-4 h-4 text-white/40 shrink-0" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search FAQs…"
                    className="flex-1 bg-transparent text-white text-sm py-2.5 focus:outline-none placeholder:text-white/30"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="text-white/40 hover:text-white/60"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category chips */}
              <div className="px-5 pb-2 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        isActive
                          ? 'bg-[#10E07A]/10 border-[#10E07A]/40 text-[#10E07A]'
                          : 'bg-white/[0.02] border-white/5 text-white/50 hover:text-white/80'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#10E07A]' : cat.color}`} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* FAQ list */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-3 space-y-2">
                {filteredFaqs.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center text-center py-12"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                      <HelpCircle className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-white/70 text-sm font-bold">No results found</p>
                    <p className="text-white/40 text-xs mt-1 max-w-[240px]">
                      Try a different search term or category — or contact our support team.
                    </p>
                  </motion.div>
                ) : (
                  filteredFaqs.map((faq, i) => {
                    const key = `${faq.category}-${faq.q}`;
                    const isOpenFaq = expanded === key;
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                        className="glass-card rounded-xl overflow-hidden border border-white/[0.06]"
                      >
                        <button
                          onClick={() => setExpanded(isOpenFaq ? null : key)}
                          className="flex items-center justify-between w-full p-3.5 text-left hover:bg-white/[0.02] transition-colors"
                          aria-expanded={isOpenFaq}
                        >
                          <span className="flex-1 text-white text-sm font-bold pr-2">{faq.q}</span>
                          <motion.span
                            animate={{ rotate: isOpenFaq ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="shrink-0"
                          >
                            <ChevronDown className={`w-4 h-4 ${isOpenFaq ? 'text-[#10E07A]' : 'text-white/40'}`} />
                          </motion.span>
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpenFaq && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: 'easeOut' }}
                              className="overflow-hidden"
                            >
                              <p className="px-3.5 pb-3.5 text-white/65 text-xs leading-relaxed">
                                {faq.a}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer actions */}
              <div className="px-5 py-4 border-t border-white/5 shrink-0 grid grid-cols-2 gap-2">
                <button
                  onClick={handleContactSupport}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#10E07A] text-[#06070B] font-bold text-xs hover:bg-[#0eB060] transition-colors active:scale-[0.98] green-glow"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Contact Support
                </button>
                <button
                  onClick={handleReportProblem}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#FB7185]/10 border border-[#FB7185]/20 text-[#FB7185] font-bold text-xs hover:bg-[#FB7185]/15 transition-colors active:scale-[0.98]"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Report a Problem
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
