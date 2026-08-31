'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  Compass,
  ShoppingBag,
  Users,
  User,
  Utensils,
  ChefHat,
  Users2,
  Heart,
  Sparkles,
  Clock,
} from 'lucide-react';
import {
  KingdomShell,
  RoyalNavigation,
  AIOrb,
  IntelligenceCard,
  MissionCard,
} from '../components';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'profile', label: 'Profile', icon: User },
];

const QUICK_ACTIONS = [
  { icon: Utensils, title: 'Order Food', description: 'Iftar-ready meals near you.' },
  { icon: ChefHat, title: 'Smart Kitchen', description: 'AI recipes from your fridge.' },
  { icon: Users2, title: 'Group Buy', description: 'Unlock bulk halal deals.' },
  { icon: Heart, title: 'Community', description: 'Break fast together.' },
];

const TRENDING_MEALS = [
  {
    name: 'Jollof Royale',
    vendor: 'Saffran Lagos',
    eta: '24 min',
    price: '₦4,500',
    gradient: 'linear-gradient(135deg, #7C3AED, #F59E0B)',
  },
  {
    name: 'Suya Sampler',
    vendor: 'Yan Cooks',
    eta: '18 min',
    price: '₦3,200',
    gradient: 'linear-gradient(135deg, #EF4444, #D4AF37)',
  },
  {
    name: 'Kunu Cooler',
    vendor: 'Northern Delights',
    eta: '12 min',
    price: '₦1,200',
    gradient: 'linear-gradient(135deg, #10B981, #38BDF8)',
  },
  {
    name: 'Date & Walnut Pack',
    vendor: 'Medjool Souq',
    eta: '30 min',
    price: '₦2,800',
    gradient: 'linear-gradient(135deg, #D4AF37, #F59E0B)',
  },
];

export function KingdomHome() {
  const [active, setActive] = useState('home');

  return (
    <KingdomShell>
      <div className="max-w-md mx-auto px-5 sm:px-6 pb-32 pt-10">
        {/* Greeting */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <p className="text-sm text-[var(--kv-text-tertiary)]">Salam,</p>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Aisha
            </h1>
            <p className="text-xs text-[var(--kv-text-tertiary)] mt-1 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[var(--kv-amber)]" />
              Maghrib in 1h 24m
            </p>
          </div>
          <AIOrb size="md" state="idle" />
        </motion.header>

        {/* Stagger container */}
        <div className="kv-stagger space-y-5">
          {/* AI suggestion */}
          <IntelligenceCard
            variant="royal"
            title="Safa recommends"
            subtitle="AI · Personalised for Ramadan"
          >
            <div className="flex items-start gap-3 mt-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--kv-royal-light)' }}>
                <Sparkles className="w-5 h-5 text-[var(--kv-mystic)]" />
              </div>
              <div>
                <p className="text-sm text-white font-medium leading-snug">
                  Order Jollof Royale from Saffran Lagos — it pairs perfectly with your taste DNA and arrives before Maghrib.
                </p>
                <button
                  type="button"
                  className="kv-btn kv-btn-royal mt-3 text-xs py-2 px-4 min-h-[36px]"
                >
                  Order now
                </button>
              </div>
            </div>
          </IntelligenceCard>

          {/* Quick action grid */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--kv-text-tertiary)] mb-3">
              Quick actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((q) => {
                const Icon = q.icon;
                return (
                  <MissionCard
                    key={q.title}
                    icon={Icon}
                    title={q.title}
                    description={q.description}
                  />
                );
              })}
            </div>
          </section>

          {/* Trending meals */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--kv-text-tertiary)]">
                Trending this hour
              </h2>
              <button
                type="button"
                className="text-xs text-[var(--kv-mystic)] font-semibold"
              >
                See all
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
              {TRENDING_MEALS.map((meal) => (
                <div
                  key={meal.name}
                  className="kv-card p-3 min-w-[160px] max-w-[180px] snap-start shrink-0"
                >
                  <div
                    className="w-full aspect-[4/3] rounded-xl mb-3 flex items-end p-2"
                    style={{ background: meal.gradient }}
                  >
                    <span className="text-[10px] uppercase tracking-wider font-bold text-black/70 bg-white/30 backdrop-blur px-2 py-0.5 rounded">
                      {meal.eta}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {meal.name}
                  </h3>
                  <p className="text-[11px] text-[var(--kv-text-tertiary)] mt-0.5">
                    {meal.vendor}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-extrabold kv-gradient-gold">
                      {meal.price}
                    </span>
                    <button
                      type="button"
                      aria-label={`Add ${meal.name} to cart`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--kv-royal-light)' }}
                    >
                      <Utensils className="w-3.5 h-3.5 text-[var(--kv-mystic)]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <RoyalNavigation items={NAV_ITEMS} active={active} onChange={setActive} />
    </KingdomShell>
  );
}
