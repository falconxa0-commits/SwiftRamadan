'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bike,
  Clock,
  Package,
  CheckCircle2,
  PartyPopper,
  Users,
  MapPin,
  Phone,
  MessageCircle,
  Sparkles,
  Timer,
} from 'lucide-react';
import { useNavigation } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

/* ───────── Types ───────── */

type OrderStage = 'placed' | 'preparing' | 'picked_up' | 'two_min_away' | 'delivered';

interface RiderInfo {
  name: string;
  rating: number;
  avatar: string;
  vehicleType: string;
  plateNumber: string;
}

interface GroupMember {
  name: string;
  avatar: string;
  status: OrderStage;
}

/* ───────── Stage Config ───────── */

const STAGES: { id: OrderStage; label: string; icon: React.ReactNode }[] = [
  { id: 'placed', label: 'Order Placed', icon: <Package className="w-4 h-4" /> },
  { id: 'preparing', label: 'Preparing', icon: <Timer className="w-4 h-4" /> },
  { id: 'picked_up', label: 'Picked Up', icon: <Bike className="w-4 h-4" /> },
  { id: 'two_min_away', label: '2 Min Away!', icon: <PartyPopper className="w-4 h-4" /> },
  { id: 'delivered', label: 'Delivered!', icon: <CheckCircle2 className="w-4 h-4" /> },
];

const STAGE_INDEX: Record<OrderStage, number> = {
  placed: 0,
  preparing: 1,
  picked_up: 2,
  two_min_away: 3,
  delivered: 4,
};

/* ───────── Mock Data ───────── */

const MOCK_RIDER: RiderInfo = {
  name: 'Ibrahim A.',
  rating: 4.9,
  avatar: '👨🏾',
  vehicleType: 'Motorcycle',
  plateNumber: 'EKY-482QX',
};

const MOCK_GROUP_MEMBERS: GroupMember[] = [
  { name: 'Amina K.', avatar: '👩🏾', status: 'two_min_away' },
  { name: 'Tunde B.', avatar: '👨🏾', status: 'two_min_away' },
  { name: 'Fatima S.', avatar: '👩🏾', status: 'two_min_away' },
  { name: 'Yusuf M.', avatar: '👨🏾', status: 'two_min_away' },
];

/* ───────── Confetti-like particle component ───────── */

function PartyParticles({ active }: { active: boolean }) {
  if (!active) return null;

  const particles = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    x: Math.random() * 300 - 150,
    y: -(Math.random() * 200 + 50),
    scale: Math.random() * 0.5 + 0.5,
    color: ['#10E07A', '#F5C451', '#A78BFA', '#38BDF8'][i % 4],
    delay: Math.random() * 0.5,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, scale: p.scale }}
          transition={{ duration: 1.8, delay: p.delay, ease: 'easeOut' }}
          className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════ */

export default function RiderETAParty() {
  const { activeModal, setActiveModal } = useNavigation();
  const { toast } = useToast();
  const isOpen = activeModal === 'rider-eta-party';

  const [currentStage, setCurrentStage] = useState<OrderStage>('picked_up');
  const [etaMinutes, setEtaMinutes] = useState(7);
  const [isGroupOrder] = useState(true);
  const [isPartyMode, setIsPartyMode] = useState(false);
  const celebratedRef = useRef(false);
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstTickRef = useRef(true);

  const handleClose = () => {
    setActiveModal(null);
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
  };

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto-advance demo: simulate rider getting closer
  useEffect(() => {
    if (!isOpen) {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      return;
    }

    // Reset for new open
    isFirstTickRef.current = true;
    celebratedRef.current = false;

    autoTimerRef.current = setInterval(() => {
      // On first tick, reset state
      if (isFirstTickRef.current) {
        isFirstTickRef.current = false;
        setCurrentStage('picked_up');
        setEtaMinutes(7);
        setIsPartyMode(false);
        return;
      }

      setCurrentStage((prev) => {
        const idx = STAGE_INDEX[prev];
        if (idx >= 4) return prev;
        const nextStage = STAGES[idx + 1].id;
        if (nextStage === 'two_min_away') {
          setEtaMinutes(2);
          setIsPartyMode(true);
          if (!celebratedRef.current) {
            celebratedRef.current = true;
            toast({ title: '🚀 Rider is 2 min away!', description: 'Get ready — your Iftar is almost here!' });
          }
        } else if (nextStage === 'delivered') {
          setEtaMinutes(0);
          setIsPartyMode(false);
        }
        return nextStage;
      });
      setEtaMinutes((prev) => Math.max(0, prev - 2));
    }, 4000);

    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
  }, [isOpen]);

  const currentStageIndex = STAGE_INDEX[currentStage];
  const progressPercent = (currentStageIndex / (STAGES.length - 1)) * 100;

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

          {/* Green pulse overlay for party mode */}
          <AnimatePresence>
            {isPartyMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.08, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="fixed inset-0 z-[71] pointer-events-none"
                style={{ backgroundColor: '#10E07A' }}
              />
            )}
          </AnimatePresence>

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[95vh] bg-[var(--sr-surface-base)] rounded-t-3xl z-[80] flex flex-col overflow-hidden border-t border-white/8"
            role="dialog"
            aria-modal="true"
            aria-label="Rider ETA Party Mode"
          >
            {/* Party particles */}
            <PartyParticles active={isPartyMode} />

            {/* ── Header ── */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/8 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: isPartyMode ? 'rgba(16,224,122,0.2)' : 'rgba(56,189,248,0.15)',
                    border: `1px solid ${isPartyMode ? 'rgba(16,224,122,0.4)' : 'rgba(56,189,248,0.3)'}`,
                  }}
                >
                  <Bike className="w-4 h-4" style={{ color: isPartyMode ? '#10E07A' : '#38BDF8' }} />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg leading-tight">
                    {isPartyMode ? '🎉 Almost There!' : 'Rider Tracking'}
                  </h2>
                  <p className="text-white/45 text-xs">
                    {isPartyMode ? 'Get ready — your Iftar is arriving!' : 'Live delivery updates'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* ── ETA Card ── */}
            <div className="px-4 pt-4 shrink-0">
              <motion.div
                animate={isPartyMode ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 0.8, repeat: isPartyMode ? Infinity : 0 }}
                className="rounded-2xl p-5 border relative overflow-hidden"
                style={{
                  backgroundColor: isPartyMode ? 'rgba(16,224,122,0.08)' : '#0F1118',
                  borderColor: isPartyMode ? 'rgba(16,224,122,0.3)' : 'rgba(255,255,255,0.08)',
                }}
              >
                {/* Green glow for party mode */}
                {isPartyMode && (
                  <div
                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px]"
                    style={{ backgroundColor: 'rgba(16,224,122,0.15)' }}
                  />
                )}

                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-white/65 text-[10px] uppercase tracking-wider">
                      {currentStage === 'delivered' ? 'Delivered' : 'Estimated Arrival'}
                    </p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span
                        className="text-4xl font-black"
                        style={{ color: isPartyMode ? '#10E07A' : '#F5C451' }}
                      >
                        {currentStage === 'delivered' ? '✓' : etaMinutes}
                      </span>
                      {currentStage !== 'delivered' && (
                        <span className="text-white/65 text-sm font-medium">min</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {currentStage !== 'delivered' && (
                      <span
                        className="px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: isPartyMode ? 'rgba(16,224,122,0.15)' : 'rgba(245,196,81,0.15)',
                          color: isPartyMode ? '#10E07A' : '#F5C451',
                          border: `1px solid ${isPartyMode ? 'rgba(16,224,122,0.3)' : 'rgba(245,196,81,0.3)'}`,
                        }}
                      >
                        {currentStage === 'two_min_away' ? '🔥 PARTY MODE' : 'EN ROUTE'}
                      </span>
                    )}
                    {currentStage === 'delivered' && (
                      <span
                        className="px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{ backgroundColor: 'rgba(16,224,122,0.15)', color: '#10E07A', border: '1px solid rgba(16,224,122,0.3)' }}
                      >
                        COMPLETED
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── Animated Timeline ── */}
            <div className="px-4 pt-5 shrink-0">
              <div className="relative">
                {/* Progress track */}
                <div className="absolute top-5 left-5 right-5 h-1 bg-white/5 rounded-full">
                  <motion.div
                    className="h-1 rounded-full"
                    style={{ backgroundColor: '#10E07A' }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>

                {/* Stage dots */}
                <div className="flex items-start justify-between relative">
                  {STAGES.map((stage, i) => {
                    const isCompleted = i <= currentStageIndex;
                    const isCurrent = i === currentStageIndex;
                    const isPartyStage = stage.id === 'two_min_away' && isCurrent;

                    return (
                      <div key={stage.id} className="flex flex-col items-center w-1/5">
                        <motion.div
                          animate={
                            isPartyStage
                              ? { scale: [1, 1.3, 1], boxShadow: ['0 0 0px #10E07A', '0 0 20px #10E07A', '0 0 0px #10E07A'] }
                              : isCurrent
                                ? { scale: [1, 1.1, 1] }
                                : {}
                          }
                          transition={
                            isPartyStage
                              ? { duration: 0.8, repeat: Infinity }
                              : isCurrent
                                ? { duration: 1.2, repeat: Infinity }
                                : {}
                          }
                          className="w-10 h-10 rounded-full flex items-center justify-center z-10 border-2 transition-all"
                          style={{
                            backgroundColor: isCompleted ? '#10E07A' : '#0F1118',
                            borderColor: isCompleted ? '#10E07A' : 'rgba(255,255,255,0.1)',
                            color: isCompleted ? '#0B0D14' : 'rgba(255,255,255,0.3)',
                            boxShadow: isPartyStage ? '0 0 20px rgba(16,224,122,0.5)' : 'none',
                          }}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" style={{ color: isCurrent ? '#0B0D14' : '#0B0D14' }} />
                          ) : (
                            stage.icon
                          )}
                        </motion.div>
                        <p
                          className="text-[10px] mt-2 font-semibold text-center leading-tight"
                          style={{ color: isCompleted ? '#10E07A' : 'rgba(255,255,255,0.25)' }}
                        >
                          {stage.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Rider Info ── */}
            <div className="px-4 pt-5 shrink-0">
              <div className="rounded-2xl p-3 sm:p-4 border border-white/8 flex items-center gap-3 sm:gap-4" style={{ backgroundColor: '#0F1118' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}>
                  {MOCK_RIDER.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold text-sm">{MOCK_RIDER.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-white/65 text-xs">{MOCK_RIDER.vehicleType}</span>
                    <span className="text-white/20">•</span>
                    <span className="text-white/65 text-xs">{MOCK_RIDER.plateNumber}</span>
                    <span className="text-white/20">•</span>
                    <span className="text-[var(--sr-vendor)] text-xs font-bold">★ {MOCK_RIDER.rating}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/8 bg-white/5 hover:bg-white/10 transition-colors"
                    aria-label="Call rider"
                    onClick={() => toast({ title: 'Calling Ibrahim...', description: 'Connecting you to your rider' })}
                  >
                    <Phone className="w-4 h-4 text-[var(--sr-customer)]" />
                  </button>
                  <button
                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/8 bg-white/5 hover:bg-white/10 transition-colors"
                    aria-label="Message rider"
                    onClick={() => toast({ title: 'Chat opened', description: 'You can message your rider' })}
                  >
                    <MessageCircle className="w-4 h-4 text-[var(--sr-rider)]" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Group Order ── */}
            {isGroupOrder && (
              <div className="px-4 pt-4 shrink-0">
                <div className="rounded-2xl p-3 sm:p-4 border border-white/8" style={{ backgroundColor: '#0F1118' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[var(--sr-ai)]" />
                      <span className="text-white font-semibold text-sm">Group Order</span>
                    </div>
                    <span className="text-white/65 text-xs">{MOCK_GROUP_MEMBERS.length} members</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {MOCK_GROUP_MEMBERS.map((member, i) => (
                      <motion.div
                        key={member.name}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex flex-col items-center gap-1.5 shrink-0"
                      >
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-lg relative"
                          style={{ backgroundColor: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)' }}
                        >
                          {member.avatar}
                          {/* Live indicator */}
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0F1118]"
                            style={{
                              backgroundColor: member.status === currentStage ? '#10E07A' : '#F5C451',
                              boxShadow: member.status === currentStage ? '0 0 6px #10E07A' : 'none',
                            }}
                          />
                        </div>
                        <span className="text-white/50 text-[10px] font-medium">{member.name.split(' ')[0]}</span>
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-white/60 text-[10px] mt-3 text-center">Everyone sees live rider tracking simultaneously</p>
                </div>
              </div>
            )}

            {/* ── Delivery Map (SVG) ── */}
            <div className="px-4 pt-4 flex-1">
              <div className="rounded-2xl overflow-hidden border border-white/8 relative" style={{ backgroundColor: '#0F1118' }}>
                <svg
                  viewBox="0 0 400 200"
                  className="w-full h-auto"
                  style={{ display: 'block' }}
                  aria-label="Delivery route map"
                >
                  {/* Grid */}
                  {Array.from({ length: 10 }).map((_, i) => (
                    <line key={`h${i}`} x1="0" y1={i * 20} x2="400" y2={i * 20} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                  ))}
                  {Array.from({ length: 20 }).map((_, i) => (
                    <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="200" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                  ))}

                  {/* Route path */}
                  <path
                    d="M60 160 Q120 120 180 100 Q240 80 300 60 Q340 48 360 40"
                    fill="none"
                    stroke="rgba(16,224,122,0.3)"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                  />
                  {/* Completed route */}
                  <motion.path
                    d="M60 160 Q120 120 180 100 Q240 80 300 60 Q340 48 360 40"
                    fill="none"
                    stroke="#10E07A"
                    strokeWidth="3"
                    strokeDasharray="500"
                    strokeDashoffset={500 - (500 * progressPercent) / 100}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />

                  {/* Restaurant marker */}
                  <g>
                    <circle cx="60" cy="160" r="8" fill="rgba(245,196,81,0.15)" stroke="#F5C451" strokeWidth="1.5" />
                    <circle cx="60" cy="160" r="3" fill="#F5C451" />
                    <text x="60" y="178" textAnchor="middle" fill="rgba(245,196,81,0.5)" fontSize="8" fontFamily="sans-serif">Restaurant</text>
                  </g>

                  {/* Rider marker (animated) */}
                  <motion.circle
                    cx="0"
                    cy="0"
                    r="6"
                    fill="#10E07A"
                    animate={{
                      cx: 60 + (360 - 60) * (progressPercent / 100),
                      cy: 160 + (40 - 160) * (progressPercent / 100),
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                  <motion.circle
                    cx="0"
                    cy="0"
                    r="12"
                    fill="none"
                    stroke="#10E07A"
                    strokeWidth="1"
                    opacity="0.4"
                    animate={{
                      cx: 60 + (360 - 60) * (progressPercent / 100),
                      cy: 160 + (40 - 160) * (progressPercent / 100),
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  >
                    <animate attributeName="r" from="8" to="18" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
                  </motion.circle>

                  {/* Destination marker */}
                  <g>
                    <circle cx="360" cy="40" r="8" fill="rgba(56,189,248,0.15)" stroke="#38BDF8" strokeWidth="1.5" />
                    <MapPin className="w-4 h-4" x="352" y="32" fill="#38BDF8" />
                    <text x="360" y="58" textAnchor="middle" fill="rgba(56,189,248,0.5)" fontSize="8" fontFamily="sans-serif">Your Location</text>
                  </g>
                </svg>
              </div>
            </div>

            {/* ── Bottom CTA ── */}
            <div className="px-4 py-4 shrink-0">
              {currentStage === 'delivered' ? (
                <motion.button
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  onClick={() => {
                    toast({ title: 'Thanks for ordering! 🌙', description: 'May your Ramadan be blessed' });
                    handleClose();
                  }}
                  className="w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                  style={{ backgroundColor: '#10E07A', color: '#0B0D14' }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Rate & Tip Rider
                  </span>
                </motion.button>
              ) : (
                <div className="flex items-center justify-center gap-2 text-white/60 text-xs py-2">
                  <Clock className="w-3 h-3" />
                  <span>Auto-updating • Live tracking active</span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
