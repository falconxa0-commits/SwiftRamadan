'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dna, Sparkles, ChefHat, Flame, Leaf, Droplets, Sun } from 'lucide-react';
import { useNavigation } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

interface TasteProfile {
  smoky: number;
  sweet: number;
  spicy: number;
  umami: number;
  fresh: number;
  rich: number;
}

interface Recommendation {
  name: string;
  reason: string;
  price: number;
}

const DIMENSION_CONFIG = [
  { key: 'smoky' as const, label: 'Smoky', color: '#F97316', icon: Flame },
  { key: 'sweet' as const, label: 'Sweet', color: '#F5C451', icon: Sun },
  { key: 'spicy' as const, label: 'Spicy', color: '#EF4444', icon: Flame },
  { key: 'umami' as const, label: 'Umami', color: '#A855F7', icon: Droplets },
  { key: 'fresh' as const, label: 'Fresh', color: '#10E07A', icon: Leaf },
  { key: 'rich' as const, label: 'Rich', color: '#F59E0B', icon: ChefHat },
];

const DEFAULT_PROFILE: TasteProfile = {
  smoky: 50,
  sweet: 30,
  spicy: 40,
  umami: 60,
  fresh: 35,
  rich: 55,
};

function generateRecommendations(profile: TasteProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  if (profile.spicy > 60) recs.push({ name: 'Pepper Soup', reason: 'Matches your bold spice preference', price: 3500 });
  if (profile.umami > 50) recs.push({ name: 'Jollof Rice & Chicken', reason: 'Rich umami depth you crave', price: 4500 });
  if (profile.fresh > 50) recs.push({ name: 'Grilled Chicken Salad', reason: 'Fresh and clean like your taste', price: 3500 });
  if (profile.sweet > 40) recs.push({ name: 'Plantain & Honey', reason: 'Sweet tooth satisfaction', price: 2000 });
  if (profile.rich > 60) recs.push({ name: 'Egusi Soup & Pounded Yam', reason: 'Rich, hearty comfort', price: 4000 });
  if (profile.smoky > 50) recs.push({ name: 'Suya Platter', reason: 'Smoky grilled perfection', price: 3200 });
  // Ensure at least 3 recs
  if (recs.length < 3) {
    recs.push(
      { name: 'Ofada Rice & Stew', reason: 'A flavor adventure', price: 4000 },
      { name: 'Zobo Drink', reason: 'Refreshing palate cleanser', price: 800 },
    );
  }
  return recs.slice(0, 4);
}

export default function TasteDNAModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const { toast } = useToast();
  const isOpen = activeModal === 'taste-dna';

  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string>('default');

  const handleClose = () => setActiveModal(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/taste-dna');
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setSource(data.source || 'default');
      }
    } catch {
      setProfile(DEFAULT_PROFILE);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !profile) {
      fetchProfile();
    }
  }, [isOpen, profile, fetchProfile]);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/taste-dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderHistory: ['Jollof Rice', 'Suya', 'Zobo'],
          preferences: ['spicy', 'fresh'],
          currentProfile: profile || DEFAULT_PROFILE,
        }),
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setSource(data.source || 'ai');
        toast({ title: 'Taste DNA Analyzed! 🧬', description: `Source: ${data.source === 'ai' ? 'AI Analysis' : 'Estimated'}` });
      }
    } catch {
      toast({ title: 'Analysis Failed', description: 'Could not analyze taste profile. Using defaults.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const displayProfile = profile || DEFAULT_PROFILE;
  const recommendations = generateRecommendations(displayProfile);

  // Compute polygon points for radar chart
  const radarPoints = DIMENSION_CONFIG.map((dim, i) => {
    const value = displayProfile[dim.key] / 100;
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const x = 50 + 40 * value * Math.cos(angle);
    const y = 50 + 40 * value * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  const gridPoints = DIMENSION_CONFIG.map((_, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    return { x: 50 + 40 * Math.cos(angle), y: 50 + 40 * Math.sin(angle) };
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#05070A] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 glass-effect border-b border-white/5">
            <div className="flex items-center justify-between p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#A855F7]/10 rounded-xl flex items-center justify-center border border-[#A855F7]/20">
                  <Dna className="w-5 h-5 text-[#A855F7]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">🧬 Taste DNA</h2>
                  <p className="text-white/65 text-xs">Your unique flavor fingerprint</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-[#1A1D26] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="px-4 pt-6 pb-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-[#1A1D26] rounded-2xl border border-white/5 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-base">Flavor Radar</h3>
                <span className="text-[10px] text-white/60 bg-white/5 px-2 py-1 rounded-full">
                  {source === 'ai' ? '✨ AI Analyzed' : source === 'default' ? 'Default Profile' : 'Estimated'}
                </span>
              </div>

              <div className="flex justify-center mb-4">
                <svg viewBox="0 0 100 100" className="w-64 h-64">
                  {/* Grid rings */}
                  {[20, 40, 60, 80, 100].map((r) => (
                    <polygon
                      key={r}
                      points={DIMENSION_CONFIG.map((_, i) => {
                        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                        const scale = r / 100;
                        return `${50 + 40 * scale * Math.cos(angle)},${50 + 40 * scale * Math.sin(angle)}`;
                      }).join(' ')}
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="0.3"
                    />
                  ))}

                  {/* Axis lines */}
                  {gridPoints.map((pt, i) => (
                    <line key={i} x1="50" y1="50" x2={pt.x} y2={pt.y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
                  ))}

                  {/* Data polygon */}
                  <motion.polygon
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 0.25, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    points={radarPoints}
                    fill="#A855F7"
                    stroke="#A855F7"
                    strokeWidth="0.5"
                    style={{ transformOrigin: '50% 50%' }}
                  />

                  {/* Data points */}
                  {DIMENSION_CONFIG.map((dim, i) => {
                    const value = displayProfile[dim.key] / 100;
                    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                    const x = 50 + 40 * value * Math.cos(angle);
                    const y = 50 + 40 * value * Math.sin(angle);
                    return (
                      <motion.circle
                        key={dim.key}
                        initial={{ r: 0 }}
                        animate={{ r: 1.5 }}
                        transition={{ delay: i * 0.1, duration: 0.3 }}
                        cx={x}
                        cy={y}
                        fill={dim.color}
                        stroke="#05070A"
                        strokeWidth="0.5"
                      />
                    );
                  })}

                  {/* Labels */}
                  {DIMENSION_CONFIG.map((dim, i) => {
                    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                    const lx = 50 + 48 * Math.cos(angle);
                    const ly = 50 + 48 * Math.sin(angle);
                    return (
                      <text
                        key={dim.key}
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={dim.color}
                        fontSize="4"
                        fontWeight="bold"
                      >
                        {dim.label}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Dimension Bars */}
          <div className="px-4 mb-6">
            <h3 className="text-white font-bold text-base mb-3">Taste Dimensions</h3>
            <div className="space-y-3">
              {DIMENSION_CONFIG.map((dim, i) => {
                const value = displayProfile[dim.key];
                const Icon = dim.icon;
                return (
                  <motion.div
                    key={dim.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="bg-[#1A1D26] rounded-xl border border-white/5 p-3"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: dim.color }} />
                        <span className="text-white text-sm font-medium">{dim.label}</span>
                      </div>
                      <span className="text-white/60 text-xs font-bold">{value}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-2 rounded-full"
                        style={{ backgroundColor: dim.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Analyze Button */}
          <div className="px-4 mb-6">
            <motion.button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all bg-[#A855F7] text-white hover:bg-[#A855F7]/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze My Taste
                </>
              )}
            </motion.button>
          </div>

          {/* Recommendations */}
          <div className="px-4 mb-32">
            <h3 className="text-white font-bold text-base mb-1">Based on your taste profile, you&apos;d love...</h3>
            <p className="text-white/60 text-xs mb-3">Personalized picks for your unique palate</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommendations.map((rec, i) => (
                <motion.div
                  key={rec.name}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                  className="bg-[#1A1D26] rounded-2xl border border-white/5 p-3 sm:p-4 hover:border-white/10 transition-colors"
                >
                  <div className="w-8 h-8 bg-[var(--sr-customer)]/10 rounded-lg flex items-center justify-center mb-2">
                    <ChefHat className="w-4 h-4 text-[var(--sr-customer)]" />
                  </div>
                  <h4 className="text-white font-bold text-sm mb-1">{rec.name}</h4>
                  <p className="text-white/65 text-[10px] leading-tight mb-2">{rec.reason}</p>
                  <span className="text-[var(--sr-customer)] text-xs font-bold">
                    ₦{rec.price.toLocaleString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
