'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Plus,
  Utensils,
  Users,
  Clock,
  Navigation,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useNavigation } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

/* ───────── Types ───────── */

interface IftarSpot {
  id: string;
  name: string;
  type: 'mosque' | 'community' | 'stall';
  description: string;
  meals: string;
  mealsLeft: number;
  distance: string;
  lat: number;
  lng: number;
  isActive: boolean;
  startTime: string;
  isFree: boolean;
  pinned: boolean;
}

/* ───────── Mock Data ───────── */

const MOCK_SPOTS: IftarSpot[] = [
  {
    id: 'spot-1',
    name: 'Al-Huda Mosque Iftar',
    type: 'mosque',
    description: 'Community Iftar for all — dates, zobo, jollof rice & chicken',
    meals: '200 packs',
    mealsLeft: 47,
    distance: '0.3 km',
    lat: 6.45,
    lng: 3.4,
    isActive: true,
    startTime: '6:32 PM',
    isFree: true,
    pinned: false,
  },
  {
    id: 'spot-2',
    name: 'Lekki Food Stall Hub',
    type: 'stall',
    description: 'Pop-up Iftar stalls with moin-moin, akara & pap',
    meals: '80 packs',
    mealsLeft: 22,
    distance: '0.7 km',
    lat: 6.43,
    lng: 3.48,
    isActive: true,
    startTime: '6:15 PM',
    isFree: false,
    pinned: false,
  },
  {
    id: 'spot-3',
    name: 'VI Community Iftar',
    type: 'community',
    description: 'Open community Iftar — bring your family, everyone welcome!',
    meals: '150 packs',
    mealsLeft: 89,
    distance: '1.2 km',
    lat: 6.42,
    lng: 3.42,
    isActive: true,
    startTime: '6:30 PM',
    isFree: true,
    pinned: false,
  },
  {
    id: 'spot-4',
    name: 'Ikeja Central Mosque',
    type: 'mosque',
    description: 'Daily iftar distribution — sponsored by community donors',
    meals: '500 packs',
    mealsLeft: 310,
    distance: '3.1 km',
    lat: 6.6,
    lng: 3.35,
    isActive: true,
    startTime: '6:35 PM',
    isFree: true,
    pinned: false,
  },
  {
    id: 'spot-5',
    name: 'Surulere Suya Night',
    type: 'stall',
    description: 'Ramadan suya & kunu special — pay what you can',
    meals: '60 packs',
    mealsLeft: 15,
    distance: '2.4 km',
    lat: 6.49,
    lng: 3.35,
    isActive: false,
    startTime: '7:00 PM',
    isFree: false,
    pinned: false,
  },
  {
    id: 'spot-6',
    name: 'Yaba Student Iftar',
    type: 'community',
    description: 'Free iftar for students — organized by Yaba Muslim Youth',
    meals: '120 packs',
    mealsLeft: 68,
    distance: '1.8 km',
    lat: 6.51,
    lng: 3.38,
    isActive: true,
    startTime: '6:25 PM',
    isFree: true,
    pinned: false,
  },
];

/* ───────── SVG Map Marker Positions (mapped to Lagos grid) ───────── */

const SPOT_POSITIONS: Record<string, { x: number; y: number }> = {
  'spot-1': { x: 140, y: 200 },
  'spot-2': { x: 310, y: 160 },
  'spot-3': { x: 220, y: 130 },
  'spot-4': { x: 80, y: 60 },
  'spot-5': { x: 160, y: 120 },
  'spot-6': { x: 190, y: 90 },
};

/* ───────── Filter Chips ───────── */

type SpotFilter = 'all' | 'mosque' | 'community' | 'stall';

const FILTER_CHIPS: { id: SpotFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All Spots', icon: <Sparkles className="w-3 h-3" /> },
  { id: 'mosque', label: 'Mosque', icon: <span className="text-xs">🕌</span> },
  { id: 'community', label: 'Community', icon: <Users className="w-3 h-3" /> },
  { id: 'stall', label: 'Food Stall', icon: <Utensils className="w-3 h-3" /> },
];

/* ───────── Color map ───────── */

const TYPE_COLORS: Record<string, string> = {
  mosque: '#10E07A',
  community: '#F5C451',
  stall: '#A78BFA',
};

const TYPE_BG: Record<string, string> = {
  mosque: 'rgba(16,224,122,0.15)',
  community: 'rgba(245,196,81,0.15)',
  stall: 'rgba(167,139,250,0.15)',
};

const TYPE_BORDER: Record<string, string> = {
  mosque: 'rgba(16,224,122,0.3)',
  community: 'rgba(245,196,81,0.3)',
  stall: 'rgba(167,139,250,0.3)',
};

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════ */

function IftarRadarInner() {
  const { activeModal, setActiveModal } = useNavigation();
  const { toast } = useToast();
  const isOpen = activeModal === 'iftar-radar';

  const [spots, setSpots] = useState<IftarSpot[]>(MOCK_SPOTS);
  const [activeFilter, setActiveFilter] = useState<SpotFilter>('all');
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null);
  const [showPinForm, setShowPinForm] = useState(false);
  const [pinName, setPinName] = useState('');
  const [pinDescription, setPinDescription] = useState('');
  const [pinType, setPinType] = useState<'mosque' | 'community' | 'stall'>('community');

  const handleClose = () => {
    setActiveModal(null);
    setSelectedSpot(null);
    setShowPinForm(false);
    setPinName('');
    setPinDescription('');
  };

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showPinForm) {
          setShowPinForm(false);
        } else if (selectedSpot) {
          setSelectedSpot(null);
        } else {
          handleClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showPinForm, selectedSpot]);

  const filteredSpots = spots.filter((s) => {
    if (activeFilter === 'all') return true;
    return s.type === activeFilter;
  });

  const activeSpots = filteredSpots.filter((s) => s.isActive);

  const handlePinIftar = () => {
    if (!pinName.trim()) return;

    const newSpot: IftarSpot = {
      id: `spot-pinned-${Date.now()}`,
      name: pinName.trim(),
      type: pinType,
      description: pinDescription.trim() || 'Free Iftar here! Come join us.',
      meals: 'Open',
      mealsLeft: 999,
      distance: '0.1 km',
      lat: 6.45,
      lng: 3.45,
      isActive: true,
      startTime: '6:30 PM',
      isFree: true,
      pinned: true,
    };

    setSpots((prev) => [newSpot, ...prev]);
    setShowPinForm(false);
    setPinName('');
    setPinDescription('');

    toast({
      title: 'Iftar Pinned! 🎉',
      description: `"${newSpot.name}" is now visible to everyone nearby.`,
    });
  };

  const handleGetDirections = (spotName: string) => {
    toast({
      title: 'Directions 🧭',
      description: `Opening directions to ${spotName}...`,
    });
  };

  const selectedSpotData = spots.find((s) => s.id === selectedSpot);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[70]"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[95vh] bg-[var(--sr-surface-base)] rounded-t-3xl z-[80] flex flex-col overflow-hidden border-t border-white/8"
            role="dialog"
            aria-modal="true"
            aria-label="Iftar Radar — Find nearby Iftar gatherings"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between p-4 border-b border-white/8 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(16,224,122,0.15)', border: '1px solid rgba(16,224,122,0.3)' }}>
                  <MapPin className="w-4 h-4" style={{ color: '#10E07A' }} />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg leading-tight">Iftar Radar</h2>
                  <p className="text-white/45 text-xs">{activeSpots.length} active spots near you</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPinForm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={{ backgroundColor: 'rgba(16,224,122,0.15)', color: '#10E07A', border: '1px solid rgba(16,224,122,0.3)' }}
                  aria-label="Pin a free Iftar spot"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pin Iftar</span>
                </button>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>

            {/* ── SVG Map ── */}
            <div className="px-4 pt-4 shrink-0">
              <div className="relative rounded-2xl overflow-hidden border border-white/8" style={{ backgroundColor: '#0F1118' }}>
                <svg
                  viewBox="0 0 400 260"
                  className="w-full h-auto"
                  style={{ display: 'block' }}
                  aria-label="Stylized map of Lagos showing Iftar spots"
                >
                  {/* Water body (Lagos Lagoon) */}
                  <path
                    d="M0 100 Q100 80 200 110 Q300 140 400 120 L400 260 L0 260 Z"
                    fill="rgba(56,189,248,0.06)"
                    stroke="rgba(56,189,248,0.12)"
                    strokeWidth="0.5"
                  />
                  {/* Lagoon label */}
                  <text x="200" y="200" textAnchor="middle" fill="rgba(56,189,248,0.2)" fontSize="9" fontFamily="sans-serif">
                    Lagos Lagoon
                  </text>

                  {/* Main roads */}
                  <line x1="40" y1="40" x2="360" y2="40" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                  <line x1="40" y1="160" x2="360" y2="160" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                  <line x1="100" y1="20" x2="80" y2="240" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
                  <line x1="250" y1="20" x2="230" y2="240" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
                  <line x1="340" y1="20" x2="330" y2="240" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />

                  {/* Third Mainland Bridge */}
                  <path
                    d="M60 60 Q180 100 320 50"
                    fill="none"
                    stroke="rgba(245,196,81,0.15)"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <text x="180" y="72" textAnchor="middle" fill="rgba(245,196,81,0.2)" fontSize="7" fontFamily="sans-serif">
                    Third Mainland Bridge
                  </text>

                  {/* Area labels */}
                  <text x="80" y="55" fill="rgba(255,255,255,0.12)" fontSize="8" fontFamily="sans-serif" fontWeight="600">Ikeja</text>
                  <text x="170" y="110" fill="rgba(255,255,255,0.12)" fontSize="8" fontFamily="sans-serif" fontWeight="600">Yaba</text>
                  <text x="130" y="210" fill="rgba(255,255,255,0.12)" fontSize="8" fontFamily="sans-serif" fontWeight="600">Surulere</text>
                  <text x="290" y="150" fill="rgba(255,255,255,0.12)" fontSize="8" fontFamily="sans-serif" fontWeight="600">Lekki</text>
                  <text x="200" y="140" fill="rgba(255,255,255,0.12)" fontSize="8" fontFamily="sans-serif" fontWeight="600">VI</text>

                  {/* Pulsing active spot markers */}
                  {filteredSpots.map((spot, i) => {
                    const pos = SPOT_POSITIONS[spot.id] || {
                      x: 100 + (i * 47) % 300,
                      y: 80 + (i * 37) % 160,
                    };
                    const color = TYPE_COLORS[spot.type];
                    return (
                      <g key={spot.id} onClick={() => setSelectedSpot(spot.id)} style={{ cursor: 'pointer' }}>
                        {/* Pulse ring for active spots */}
                        {spot.isActive && (
                          <circle cx={pos.x} cy={pos.y} r="14" fill="none" stroke={color} strokeWidth="1" opacity="0.4">
                            <animate attributeName="r" from="10" to="22" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
                          </circle>
                        )}
                        {/* Outer circle */}
                        <circle cx={pos.x} cy={pos.y} r="10" fill={`${color}20`} stroke={`${color}50`} strokeWidth="1.5" />
                        {/* Inner dot */}
                        <circle cx={pos.x} cy={pos.y} r="4" fill={color} opacity={spot.isActive ? 1 : 0.4} />
                        {/* Pinned badge */}
                        {spot.pinned && (
                          <circle cx={pos.x + 8} cy={pos.y - 8} r="3.5" fill="#F5C451" />
                        )}
                      </g>
                    );
                  })}

                  {/* User location */}
                  <g>
                    <circle cx="200" cy="180" r="6" fill="rgba(56,189,248,0.2)" stroke="#38BDF8" strokeWidth="1.5" />
                    <circle cx="200" cy="180" r="2.5" fill="#38BDF8" />
                    <circle cx="200" cy="180" r="12" fill="none" stroke="rgba(56,189,248,0.2)" strokeWidth="1">
                      <animate attributeName="r" from="8" to="18" dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.4" to="0" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                    <text x="200" y="196" textAnchor="middle" fill="rgba(56,189,248,0.5)" fontSize="7" fontFamily="sans-serif">
                      You
                    </text>
                  </g>

                  {/* Legend */}
                  <g transform="translate(10, 10)">
                    <rect x="0" y="0" width="90" height="50" rx="6" fill="rgba(11,13,20,0.85)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                    <circle cx="14" cy="14" r="4" fill="#10E07A" />
                    <text x="22" y="17" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="sans-serif">Mosque</text>
                    <circle cx="14" cy="28" r="4" fill="#F5C451" />
                    <text x="22" y="31" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="sans-serif">Community</text>
                    <circle cx="14" cy="42" r="4" fill="#A78BFA" />
                    <text x="22" y="45" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="sans-serif">Food Stall</text>
                  </g>
                </svg>

                {/* Map overlay gradient bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0F1118] to-transparent pointer-events-none" />
              </div>
            </div>

            {/* ── Filter Chips ── */}
            <div className="px-4 mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1 shrink-0">
              {FILTER_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setActiveFilter(chip.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
                    activeFilter === chip.id
                      ? 'text-[#0B0D14]'
                      : 'bg-white/5 text-white/50 border border-white/8'
                  }`}
                  style={
                    activeFilter === chip.id
                      ? { backgroundColor: '#10E07A' }
                      : undefined
                  }
                >
                  {chip.icon}
                  {chip.label}
                </button>
              ))}
            </div>

            {/* ── Scrollable Spot List ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 mt-3 pb-6 space-y-3">
              {filteredSpots.map((spot, i) => {
                const color = TYPE_COLORS[spot.type];
                const bg = TYPE_BG[spot.type];
                const border = TYPE_BORDER[spot.type];
                const isSelected = selectedSpot === spot.id;

                return (
                  <motion.div
                    key={spot.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl p-4 border transition-all cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? bg : '#0F1118',
                      borderColor: isSelected ? border : 'rgba(255,255,255,0.08)',
                    }}
                    onClick={() => setSelectedSpot(isSelected ? null : spot.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Type icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: bg, border: `1px solid ${border}` }}
                      >
                        {spot.type === 'mosque' && <span className="text-lg">🕌</span>}
                        {spot.type === 'community' && <Users className="w-4 h-4" style={{ color }} />}
                        {spot.type === 'stall' && <Utensils className="w-4 h-4" style={{ color }} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-bold text-sm truncate">{spot.name}</h4>
                          {spot.pinned && (
                            <span
                              className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold"
                              style={{ backgroundColor: 'rgba(245,196,81,0.15)', color: '#F5C451' }}
                            >
                              YOURS
                            </span>
                          )}
                          {spot.isActive && (
                            <span className="shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: '#10E07A', boxShadow: '0 0 6px #10E07A' }} />
                          )}
                        </div>
                        <p className="text-white/65 text-xs mt-0.5 line-clamp-1">{spot.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-white/50 text-[11px]">
                            <MapPin className="w-3 h-3" style={{ color }} />
                            {spot.distance}
                          </span>
                          <span className="flex items-center gap-1 text-white/50 text-[11px]">
                            <Clock className="w-3 h-3" />
                            {spot.startTime}
                          </span>
                          <span className="text-[11px] font-semibold" style={{ color }}>
                            {spot.isFree ? 'Free' : 'Paid'}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-white/20 shrink-0 mt-1" />
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-3 border-t border-white/8 space-y-3">
                            {/* Meals left progress */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-white/65 text-[10px] uppercase tracking-wider">Meals Remaining</span>
                                <span className="text-white/60 text-xs font-bold">{spot.mealsLeft} left</span>
                              </div>
                              <div className="w-full bg-white/5 rounded-full h-2">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min((spot.mealsLeft / parseInt(spot.meals)) * 100, 100)}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                  className="h-2 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGetDirections(spot.name);
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                                style={{ backgroundColor: bg, color, border: `1px solid ${border}` }}
                              >
                                <Navigation className="w-3 h-3" />
                                Directions
                              </button>
                              {spot.isFree && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast({ title: 'Reserved! 🎉', description: `Your spot at ${spot.name} is confirmed.` });
                                  }}
                                  className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                                  style={{ backgroundColor: '#10E07A', color: '#0B0D14' }}
                                >
                                  Reserve Spot
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {filteredSpots.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <MapPin className="w-10 h-10 text-white/10 mb-3" />
                  <p className="text-white/60 text-sm">No iftar spots found for this filter</p>
                </div>
              )}
            </div>

            {/* ── Pin Iftar Form Overlay ── */}
            <AnimatePresence>
              {showPinForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[var(--sr-surface-base)]/95 z-[90] flex flex-col"
                >
                  <div className="flex items-center justify-between p-4 border-b border-white/8 shrink-0">
                    <h3 className="text-white font-bold text-base">Pin Free Iftar Here!</h3>
                    <button
                      onClick={() => setShowPinForm(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5"
                      aria-label="Close pin form"
                    >
                      <X className="w-4 h-4 text-white/60" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Type selector */}
                    <div>
                      <label className="text-white/65 text-[10px] uppercase tracking-wider mb-2 block">Type</label>
                      <div className="flex gap-2">
                        {(['mosque', 'community', 'stall'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setPinType(t)}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 border"
                            style={{
                              backgroundColor: pinType === t ? TYPE_BG[t] : 'transparent',
                              borderColor: pinType === t ? TYPE_BORDER[t] : 'rgba(255,255,255,0.08)',
                              color: pinType === t ? TYPE_COLORS[t] : 'rgba(255,255,255,0.4)',
                            }}
                          >
                            {t === 'mosque' ? '🕌 Mosque' : t === 'community' ? '👥 Community' : '🍽️ Food Stall'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name input */}
                    <div>
                      <label className="text-white/65 text-[10px] uppercase tracking-wider mb-2 block">Spot Name</label>
                      <input
                        type="text"
                        value={pinName}
                        onChange={(e) => setPinName(e.target.value)}
                        placeholder="e.g. My Street Iftar Table"
                        className="w-full h-11 px-4 rounded-xl bg-[var(--sr-surface-raised)] border border-white/8 text-white text-sm focus:outline-none focus:border-[var(--sr-customer)]/40 placeholder:text-white/25 transition-colors"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-white/65 text-[10px] uppercase tracking-wider mb-2 block">Description</label>
                      <textarea
                        value={pinDescription}
                        onChange={(e) => setPinDescription(e.target.value)}
                        placeholder="What's available? e.g. Dates, zobo, jollof rice"
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--sr-surface-raised)] border border-white/8 text-white text-sm focus:outline-none focus:border-[var(--sr-customer)]/40 placeholder:text-white/25 resize-none transition-colors"
                      />
                    </div>

                    {/* Location hint */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--sr-surface-raised)] border border-white/8">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)' }}>
                        <MapPin className="w-4 h-4" style={{ color: '#38BDF8' }} />
                      </div>
                      <div>
                        <p className="text-white text-xs font-semibold">Using current location</p>
                        <p className="text-white/35 text-[10px]">Lekki Phase 1, Lagos</p>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handlePinIftar}
                      disabled={!pinName.trim()}
                      className="w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#10E07A', color: '#0B0D14' }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" />
                        Pin &quot;Free Iftar Here!&quot;
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default React.memo(IftarRadarInner);
