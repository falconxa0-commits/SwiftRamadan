'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Package, Check, Calendar, Truck, Star, Clock, Gift,
  Sparkles, ChevronRight, Sun, Moon, Utensils, Coffee, Apple
} from 'lucide-react';
import { formatNaira } from '@/lib/data';
import { useNavigation, useSubscriptions } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  period: string;
  icon: React.ElementType;
  color: string;
  features: string[];
  popular?: boolean;
  deliverySchedule: { day: string; meal: string; time: string }[];
}

const plans: SubscriptionPlan[] = [
  {
    id: 'sahur',
    name: 'Weekly Sahur Box',
    subtitle: 'Pre-dawn nourishment delivered daily',
    price: 12000,
    period: 'week',
    icon: Sun,
    color: '#F5C451',
    features: [
      'Daily Sahur meal for 1 person',
      'Fresh fruits & dates included',
      'Hot beverage of your choice',
      'Delivered before 4:30 AM',
      'Swap meals any day',
      'Cancel anytime',
    ],
    deliverySchedule: [
      { day: 'Mon', meal: 'Oats & Banana Smoothie', time: '4:15 AM' },
      { day: 'Tue', meal: 'Akara & Pap', time: '4:15 AM' },
      { day: 'Wed', meal: 'Moimoi & Custard', time: '4:15 AM' },
      { day: 'Thu', meal: 'Bread & Tea with Eggs', time: '4:15 AM' },
      { day: 'Fri', meal: 'Yam & Egg Sauce', time: '4:15 AM' },
      { day: 'Sat', meal: 'Pancakes & Honey', time: '4:15 AM' },
      { day: 'Sun', meal: 'Bean Cake & Kunu', time: '4:15 AM' },
    ],
  },
  {
    id: 'full',
    name: 'Full Ramadan Plan',
    subtitle: 'Complete Sahur + Iftar for 30 days',
    price: 85000,
    period: '30 days',
    icon: Moon,
    color: '#10E07A',
    popular: true,
    features: [
      'Daily Sahur + Iftar for 1 person',
      'Premium protein options',
      'Fresh juice & Zobo daily',
      'Dates & water included',
      'Iftar-precision delivery',
      'Free cancellation in first 3 days',
      'Priority rider assignment',
      'Special Eid box included',
    ],
    deliverySchedule: [
      { day: 'Mon', meal: 'Sahur: Oats & Smoothie | Iftar: Jollof Rice & Chicken', time: '4:15 AM / 6:45 PM' },
      { day: 'Tue', meal: 'Sahur: Akara & Pap | Iftar: Suya & Fried Rice', time: '4:15 AM / 6:45 PM' },
      { day: 'Wed', meal: 'Sahur: Moimoi & Custard | Iftar: Pepper Soup & Agidi', time: '4:15 AM / 6:45 PM' },
      { day: 'Thu', meal: 'Sahur: Bread & Tea | Iftar: Ofada Rice & Stew', time: '4:15 AM / 6:45 PM' },
      { day: 'Fri', meal: 'Sahur: Yam & Egg | Iftar: Fried Rice & Turkey', time: '4:15 AM / 6:45 PM' },
      { day: 'Sat', meal: 'Sahur: Pancakes & Honey | Iftar: Asun & Pounded Yam', time: '4:15 AM / 6:45 PM' },
      { day: 'Sun', meal: 'Sahur: Bean Cake & Kunu | Iftar: Grilled Fish & Salad', time: '4:15 AM / 6:45 PM' },
    ],
  },
];

export default function SubscriptionBoxes() {
  const { activeModal, setActiveModal } = useNavigation();
  const { activeSubscription, setActiveSubscription } = useSubscriptions();
  const { toast } = useToast();
  const isOpen = activeModal === 'subscriptionBoxes';

  const [selectedPlan, setSelectedPlan] = useState<string>('full');
  const [showSchedule, setShowSchedule] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleClose = useCallback(() => {
    setActiveModal(null);
    setShowSchedule(false);
  }, [setActiveModal]);

  // Escape key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleClose]);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveSubscription(selectedPlan);
        toast({
          title: 'Subscribed! 🎉',
          description: `Your ${plans.find((p) => p.id === selectedPlan)?.name} is now active!`,
        });
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to subscribe', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubscribing(false);
    }
  };

  const currentPlan = plans.find((p) => p.id === selectedPlan)!;
  const isSubscribed = activeSubscription === selectedPlan;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#0B0D14] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Subscription Boxes - weekly meal plans for Ramadan"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 backdrop-blur-xl bg-[#0B0D14]/80 border-b border-white/8">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F5C451]/10 rounded-xl flex items-center justify-center border border-[#F5C451]/20">
                  <Gift className="w-5 h-5 text-[#F5C451]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Subscription Boxes</h2>
                  <p className="text-white/65 text-xs">Curated meals, delivered daily</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-[#0F1118] border border-white/8 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Close subscription boxes"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Hero */}
          <div className="relative overflow-hidden px-4 pt-6 pb-8">
            <div className="absolute inset-0 bg-gradient-to-b from-[#F5C451]/5 to-transparent pointer-events-none" />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative text-center"
            >
              <div className="inline-flex items-center gap-2 bg-[#10E07A]/10 border border-[#10E07A]/20 rounded-full px-4 py-1.5 mb-4">
                <Sparkles className="w-4 h-4 text-[#10E07A]" />
                <span className="text-[#10E07A] text-xs font-bold">Never Miss a Meal</span>
              </div>
              <h1 className="text-3xl font-black text-white mb-2">
                Ramadan <span className="text-[#F5C451]">Meal Plans</span>
              </h1>
              <p className="text-white/50 text-sm max-w-md mx-auto">
                Curated Sahur & Iftar meals delivered to your door every day. Subscribe and forget about meal prep.
              </p>
            </motion.div>
          </div>

          {/* Plan Toggle */}
          <div className="px-4 mb-6">
            <div className="bg-[#0F1118] rounded-2xl border border-white/8 p-1.5 flex gap-1.5">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    selectedPlan === plan.id
                      ? 'bg-[#10E07A] text-[#0B0D14]'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                  aria-label={`Select ${plan.name}`}
                >
                  <plan.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{plan.name}</span>
                  <span className="sm:hidden">{plan.id === 'sahur' ? 'Sahur' : 'Full'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Plan Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedPlan}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="px-4 mb-6"
            >
              <div
                className="bg-[#0F1118] rounded-2xl border overflow-hidden relative"
                style={{ borderColor: currentPlan.popular ? `${currentPlan.color}30` : 'rgba(255,255,255,0.08)' }}
              >
                {currentPlan.popular && (
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: `linear-gradient(to right, ${currentPlan.color}, ${currentPlan.color}50)` }}
                  />
                )}
                {currentPlan.popular && (
                  <div className="absolute top-3 right-3">
                    <span
                      className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide"
                      style={{ backgroundColor: `${currentPlan.color}20`, color: currentPlan.color }}
                    >
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center border"
                      style={{ backgroundColor: `${currentPlan.color}10`, borderColor: `${currentPlan.color}20` }}
                    >
                      <currentPlan.icon className="w-7 h-7" style={{ color: currentPlan.color }} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{currentPlan.name}</h3>
                      <p className="text-white/65 text-xs">{currentPlan.subtitle}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-end gap-2 mb-6">
                    <span className="font-black text-3xl" style={{ color: currentPlan.color }}>
                      {formatNaira(currentPlan.price)}
                    </span>
                    <span className="text-white/65 text-sm mb-1">/ {currentPlan.period}</span>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {currentPlan.features.map((feature, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="flex items-center gap-3"
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${currentPlan.color}15` }}
                        >
                          <Check className="w-3 h-3" style={{ color: currentPlan.color }} />
                        </div>
                        <span className="text-white/70 text-sm">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Delivery Schedule Toggle */}
                  <button
                    onClick={() => setShowSchedule(!showSchedule)}
                    className="w-full flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 mb-4 hover:bg-white/8 transition-colors"
                    aria-label="Toggle delivery schedule"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" style={{ color: currentPlan.color }} />
                      <span className="text-white/70 text-sm font-medium">Delivery Schedule</span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-white/60 transition-transform ${showSchedule ? 'rotate-90' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {showSchedule && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden mb-4"
                      >
                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                          {currentPlan.deliverySchedule.map((item, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5"
                            >
                              <span className="text-[10px] font-black w-8" style={{ color: currentPlan.color }}>
                                {item.day}
                              </span>
                              <span className="text-white/60 text-xs flex-1">{item.meal}</span>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-white/60" />
                                <span className="text-white/65 text-[10px]">{item.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Subscribe Button */}
                  {isSubscribed ? (
                    <div
                      className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border"
                      style={{ backgroundColor: `${currentPlan.color}10`, borderColor: `${currentPlan.color}20`, color: currentPlan.color }}
                    >
                      <Check className="w-4 h-4" />
                      Active Subscription
                    </div>
                  ) : (
                    <motion.button
                      onClick={handleSubscribe}
                      disabled={isSubscribing}
                      className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                      style={{
                        backgroundColor: currentPlan.color,
                        color: '#0B0D14',
                        opacity: isSubscribing ? 0.7 : 1,
                      }}
                      whileTap={{ scale: 0.98 }}
                      aria-label={`Subscribe to ${currentPlan.name} for ${formatNaira(currentPlan.price)}`}
                    >
                      {isSubscribing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#0B0D14]/30 border-t-[#0B0D14] rounded-full animate-spin" />
                          Subscribing...
                        </>
                      ) : (
                        <>
                          <Truck className="w-4 h-4" />
                          Subscribe Now — {formatNaira(currentPlan.price)}/{currentPlan.period}
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Plan Comparison */}
          <div className="px-4 mb-8">
            <h3 className="text-white font-bold text-lg mb-4">Compare Plans</h3>
            <div className="bg-[#0F1118] rounded-2xl border border-white/8 overflow-hidden">
              <div className="grid grid-cols-3 border-b border-white/8">
                <div className="p-3 text-white/65 text-xs font-bold">Feature</div>
                <div className="p-3 text-center text-[#F5C451] text-xs font-bold">Sahur Box</div>
                <div className="p-3 text-center text-[#10E07A] text-xs font-bold">Full Plan</div>
              </div>
              {[
                { feature: 'Sahur Meals', sahur: true, full: true },
                { feature: 'Iftar Meals', sahur: false, full: true },
                { feature: 'Fresh Fruits', sahur: true, full: true },
                { feature: 'Premium Protein', sahur: false, full: true },
                { feature: 'Iftar Precision', sahur: false, full: true },
                { feature: 'Eid Box', sahur: false, full: true },
                { feature: 'Priority Rider', sahur: false, full: true },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-3 border-b border-white/5 last:border-0">
                  <div className="p-3 text-white/50 text-xs flex items-center gap-1.5">
                    {row.feature === 'Sahur Meals' ? <Coffee className="w-3 h-3" /> :
                     row.feature === 'Iftar Meals' ? <Utensils className="w-3 h-3" /> :
                     <Apple className="w-3 h-3" />}
                    {row.feature}
                  </div>
                  <div className="p-3 flex items-center justify-center">
                    {row.sahur ? (
                      <Check className="w-4 h-4 text-[#F5C451]" />
                    ) : (
                      <X className="w-4 h-4 text-white/10" />
                    )}
                  </div>
                  <div className="p-3 flex items-center justify-center">
                    <Check className="w-4 h-4 text-[#10E07A]" />
                  </div>
                </div>
              ))}
              {/* Price Row */}
              <div className="grid grid-cols-3 bg-white/3">
                <div className="p-3 text-white/50 text-xs font-bold">Price</div>
                <div className="p-3 text-center text-[#F5C451] text-xs font-black">{formatNaira(12000)}/wk</div>
                <div className="p-3 text-center text-[#10E07A] text-xs font-black">{formatNaira(85000)}/30d</div>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="px-4 mb-8">
            <div className="bg-[#0F1118] rounded-2xl border border-white/8 p-5">
              <div className="flex items-center gap-1.5 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 text-[#F5C451] fill-[#F5C451]" />
                ))}
              </div>
              <p className="text-white/70 text-sm mb-3 italic">
                &ldquo;The Full Ramadan Plan saved me so much time! Every Iftar was a delight, and the Sahur was always delivered before I woke up. Highly recommend!&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#A78BFA]/20 flex items-center justify-center text-[#A78BFA] text-xs font-bold">
                  FK
                </div>
                <div>
                  <p className="text-white text-xs font-bold">Fatima K.</p>
                  <p className="text-white/60 text-[10px]">Full Plan Subscriber</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Subscription Badge */}
          {activeSubscription && (
            <div className="px-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#10E07A]/10 border border-[#10E07A]/20 rounded-2xl p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-[#10E07A]/20 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-[#10E07A]" />
                </div>
                <div className="flex-1">
                  <p className="text-[#10E07A] font-bold text-sm">Active: {plans.find((p) => p.id === activeSubscription)?.name}</p>
                  <p className="text-white/65 text-xs">Your next delivery is scheduled</p>
                </div>
                <Check className="w-5 h-5 text-[#10E07A]" />
              </motion.div>
            </div>
          )}

          <div className="h-20" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
