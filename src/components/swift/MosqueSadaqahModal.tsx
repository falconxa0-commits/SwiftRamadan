'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Navigation, Heart, MapPin, Compass, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { mosques, formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

type CategoryChip = 'iftar' | 'jummah' | 'sadaqah' | 'large';

export default function MosqueSadaqahModal() {
  const { activeModal, setActiveModal, hasanatPoints, setHasanatPoints } = useAppStore();
  const { toast } = useToast();
  const isOpen = activeModal === 'mosque';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState<CategoryChip | null>(null);
  const [selectedMosque, setSelectedMosque] = useState<number | null>(null);
  const [showQibla, setShowQibla] = useState(false);
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [donationConfirmed, setDonationConfirmed] = useState<string | null>(null);
  const [donationPoints, setDonationPoints] = useState(0);

  const categoryChips: { id: CategoryChip; label: string }[] = [
    { id: 'iftar', label: 'Active Iftar' },
    { id: 'jummah', label: 'Jummah' },
    { id: 'sadaqah', label: 'Sadaqah' },
    { id: 'large', label: 'Large Space' },
  ];

  const filteredMosques = mosques.filter(m => {
    const matchesSearch = searchQuery === '' ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesChip = !activeChip ||
      (activeChip === 'iftar' && m.iftarAvailable) ||
      (activeChip === 'jummah' && m.jummah) ||
      (activeChip === 'sadaqah' && m.sadaqah) ||
      (activeChip === 'large' && m.capacity === 'Large');

    return matchesSearch && matchesChip;
  });

  const handleDirections = (mosqueName: string) => {
    toast({ title: 'Directions 🧭', description: `Opening directions to ${mosqueName}...` });
  };

  const handleSponsorMeals = (mosqueName: string) => {
    setHasanatPoints(hasanatPoints + 100);
    setDonationPoints(100);
    setDonationConfirmed(mosqueName);
  };

  const handleQuickSadaqah = () => {
    setHasanatPoints(hasanatPoints + 25);
    setDonationPoints(25);
    setDonationConfirmed('Quick Sadaqah');
  };

  const handleQiblaFinder = () => {
    setShowQibla(true);
    // Animate to 56 degrees (NE for Lagos)
    setTimeout(() => setQiblaAngle(56), 100);
  };

  const handleClose = () => {
    setActiveModal(null);
    setSelectedMosque(null);
    setShowQibla(false);
    setQiblaAngle(0);
    setSearchQuery('');
    setActiveChip(null);
    setDonationConfirmed(null);
    setDonationPoints(0);
  };

  const selectedMosqueData = mosques.find(m => m.id === selectedMosque);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[70]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[95vh] bg-[#05070A] rounded-t-3xl z-[80] flex flex-col overflow-hidden border-t border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#FFD700]">mosque</span>
                <h2 className="text-white font-bold text-lg">Mosque & Sadaqah Hub</h2>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              {/* Donation Confirmed Overlay */}
              <AnimatePresence>
                {donationConfirmed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#05070A]/95 z-[85] flex flex-col items-center justify-center p-6"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 12, stiffness: 150, delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-[#10E07A]/20 flex items-center justify-center border border-[#10E07A]/30 green-glow mb-6"
                    >
                      <span className="material-symbols-outlined text-[#10E07A] text-4xl">check_circle</span>
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-white text-xl font-black text-center mb-2"
                    >
                      Donation Confirmed!
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-white/50 text-sm text-center mb-4"
                    >
                      {donationConfirmed === 'Quick Sadaqah'
                        ? '₦1,000 feeds 1 person. May Allah accept your sadaqah.'
                        : `50 meals sponsored at ${donationConfirmed}. May Allah accept your charity.`}
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-[#1A1D26] rounded-2xl p-4 border border-[#10E07A]/20 mb-6 text-center"
                    >
                      <p className="text-white/40 text-[10px] uppercase tracking-widest">Hasanat Points Earned</p>
                      <p className="text-[#10E07A] text-2xl font-black">+{donationPoints}</p>
                    </motion.div>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      onClick={() => { setDonationConfirmed(null); setDonationPoints(0); }}
                      className="bg-[#10E07A] text-[#05070A] font-bold py-3 px-8 rounded-xl text-sm active:scale-[0.98] transition-transform"
                    >
                      Continue
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Qibla Finder Overlay */}
              <AnimatePresence>
                {showQibla && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-[#05070A]/95 z-[90] flex flex-col items-center justify-center"
                  >
                    <button
                      onClick={() => { setShowQibla(false); setQiblaAngle(0); }}
                      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5"
                    >
                      <X className="w-4 h-4 text-white/60" />
                    </button>
                    <h3 className="text-white font-bold text-lg mb-2">Qibla Finder</h3>
                    <p className="text-white/40 text-sm mb-8">Pointing toward Makkah (NE)</p>

                    {/* Compass */}
                    <div className="relative w-64 h-64">
                      {/* Outer ring */}
                      <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                      {/* Cardinal directions */}
                      {['N', 'E', 'S', 'W'].map((dir, i) => (
                        <span
                          key={dir}
                          className="absolute text-white/30 text-xs font-bold"
                          style={{
                            top: i === 0 ? '4px' : i === 2 ? 'auto' : '50%',
                            bottom: i === 2 ? '4px' : 'auto',
                            left: i === 3 ? '4px' : i === 1 ? 'auto' : '50%',
                            right: i === 1 ? '4px' : 'auto',
                            transform: i === 0 || i === 2 ? 'translateX(-50%)' : 'translateY(-50%)',
                          }}
                        >
                          {dir}
                        </span>
                      ))}
                      {/* Inner circle */}
                      <div className="absolute inset-8 rounded-full border border-white/5 bg-[#1A1D26]/50" />
                      {/* Tick marks */}
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-0.5 h-3 bg-white/10 left-1/2 -translate-x-1/2 origin-bottom"
                          style={{
                            top: '8px',
                            transform: `translateX(-50%) rotate(${i * 30}deg)`,
                            transformOrigin: '50% 124px',
                          }}
                        />
                      ))}
                      {/* Qibla Arrow */}
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        animate={{ rotate: qiblaAngle }}
                        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                      >
                        <div className="relative">
                          <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[60px] border-l-transparent border-r-transparent border-b-[#10E07A] -mt-16" />
                          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[40px] border-l-transparent border-r-transparent border-t-white/20 -mt-0 mx-auto" />
                        </div>
                      </motion.div>
                      {/* Center dot */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#10E07A] rounded-full green-glow" />
                    </div>

                    <div className="mt-8 bg-[#1A1D26] rounded-xl p-4 border border-white/5 text-center">
                      <p className="text-[#10E07A] text-lg font-black">56° NE</p>
                      <p className="text-white/40 text-xs">Qibla direction from Lagos</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Map Placeholder */}
              <div className="relative mx-4 mt-4 h-48 rounded-2xl bg-[#1A1D26] border border-white/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] to-[#0d1117]">
                  {/* Grid pattern to simulate map */}
                  <div className="absolute inset-0 opacity-10">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={`h${i}`} className="absolute w-full h-px bg-white" style={{ top: `${(i + 1) * 12.5}%` }} />
                    ))}
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={`v${i}`} className="absolute h-full w-px bg-white" style={{ left: `${(i + 1) * 12.5}%` }} />
                    ))}
                  </div>
                  {/* Mosque pin markers */}
                  {mosques.map((m, i) => (
                    <motion.div
                      key={m.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.15 }}
                      className="absolute cursor-pointer"
                      style={{
                        top: `${20 + i * 25}%`,
                        left: `${25 + i * 22}%`,
                      }}
                      onClick={() => setSelectedMosque(m.id)}
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-[#10E07A]/20 rounded-full flex items-center justify-center border border-[#10E07A]/30 green-glow">
                          <span className="material-symbols-outlined text-[#10E07A] text-sm">mosque</span>
                        </div>
                        <div className="w-0.5 h-1 bg-[#10E07A]/50" />
                      </div>
                    </motion.div>
                  ))}
                  {/* Current location marker */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <div className="w-4 h-4 bg-[#FFD700] rounded-full border-2 border-[#05070A] gold-glow" />
                    <div className="w-8 h-8 bg-[#FFD700]/10 rounded-full absolute -top-2 -left-2 animate-ping" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/10">
                  <span className="text-white/50 text-[10px]">Lekki, Lagos</span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="px-4 mt-4">
                <div className="flex items-center rounded-xl h-11 bg-[#1A1D26] border border-white/5 focus-within:border-[#10E07A]/30 transition-all">
                  <Search className="w-4 h-4 text-white/30 ml-3 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search mosques near you"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-white text-sm px-3 py-2 focus:outline-none placeholder:text-white/30"
                  />
                </div>
              </div>

              {/* Category Chips */}
              <div className="px-4 mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => setActiveChip(null)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    activeChip === null
                      ? 'bg-[#10E07A] text-[#05070A]'
                      : 'bg-white/5 text-white/50 border border-white/10'
                  }`}
                >
                  All
                </button>
                {categoryChips.map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => setActiveChip(activeChip === chip.id ? null : chip.id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      activeChip === chip.id
                        ? 'bg-[#10E07A] text-[#05070A]'
                        : 'bg-white/5 text-white/50 border border-white/10'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Mosque Cards */}
              <div className="px-4 mt-4 space-y-3">
                {filteredMosques.map(mosque => (
                  <motion.div
                    key={mosque.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-white font-bold text-sm">{mosque.name}</h4>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-white/30" />
                          <p className="text-white/40 text-xs">{mosque.address}</p>
                        </div>
                        <p className="text-[#10E07A] text-xs font-bold mt-1">{mosque.distance}</p>
                      </div>
                    </div>
                    {/* Feature Badges */}
                    <div className="flex flex-wrap gap-2 mt-3 mb-3">
                      {mosque.iftarAvailable && (
                        <span className="px-2 py-0.5 bg-[#10E07A]/10 text-[#10E07A] text-[10px] font-bold rounded-full border border-[#10E07A]/20">
                          Iftar Available
                        </span>
                      )}
                      {mosque.jummah && (
                        <span className="px-2 py-0.5 bg-[#FFD700]/10 text-[#FFD700] text-[10px] font-bold rounded-full border border-[#FFD700]/20">
                          Jummah
                        </span>
                      )}
                      {mosque.sadaqah && (
                        <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold rounded-full border border-cyan-500/20">
                          Sadaqah
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-white/5 text-white/40 text-[10px] font-bold rounded-full border border-white/5">
                        {mosque.capacity}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDirections(mosque.name)}
                        className="flex-1 bg-white/5 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-white/5 hover:bg-white/10 transition-colors"
                      >
                        <Navigation className="w-3 h-3" />
                        Directions
                      </button>
                      <button
                        onClick={() => handleSponsorMeals(mosque.name)}
                        className="flex-1 bg-[#10E07A]/10 text-[#10E07A] font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-[#10E07A]/20 hover:bg-[#10E07A]/20 transition-colors"
                      >
                        <Heart className="w-3 h-3" />
                        Sponsor Meals
                      </button>
                      <button
                        onClick={() => setSelectedMosque(selectedMosque === mosque.id ? null : mosque.id)}
                        className="w-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 hover:bg-white/10 transition-colors"
                      >
                        {selectedMosque === mosque.id ? (
                          <ChevronUp className="w-4 h-4 text-white/40" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-white/40" />
                        )}
                      </button>
                    </div>

                    {/* Expanded Mosque Detail */}
                    <AnimatePresence>
                      {selectedMosque === mosque.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                            {/* Prayer Times */}
                            <div>
                              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Prayer Times</p>
                              <div className="grid grid-cols-5 gap-2">
                                {Object.entries(mosque.prayerTimes).map(([name, time]) => (
                                  <div key={name} className="bg-black/30 p-2 rounded-lg text-center border border-white/5">
                                    <p className="text-white text-[10px] font-bold capitalize">{name}</p>
                                    <p className="text-white/50 text-[9px]">{time}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* Capacity & Funding */}
                            <div className="flex gap-3">
                              <div className="flex-1 bg-black/30 p-3 rounded-xl border border-white/5">
                                <p className="text-white/40 text-[10px]">Capacity</p>
                                <p className="text-white font-bold text-sm">{mosque.capacity}</p>
                              </div>
                              <div className="flex-1 bg-black/30 p-3 rounded-xl border border-white/5">
                                <p className="text-white/40 text-[10px]">Funding Goal</p>
                                <div className="w-full bg-white/5 rounded-full h-1.5 mt-2">
                                  <div className="bg-[#10E07A] h-1.5 rounded-full" style={{ width: `${mosque.sadaqah ? 65 : 40}%` }} />
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleSponsorMeals(mosque.name)}
                              className="w-full bg-[#10E07A] text-[#05070A] font-bold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
                            >
                              Sponsor 50 Meals &bull; {formatNaira(50000)}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

              {/* Quick Sadaqah Banner */}
              <div className="px-4 mt-6">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#064e3b]/40 to-[#05070A] border border-[#10E07A]/20 p-4">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#10E07A]/10 blur-[40px]" />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-[#10E07A] text-sm font-bold">Quick Sadaqah</p>
                      <p className="text-white/50 text-xs mt-0.5">{formatNaira(1000)} feeds 1 person</p>
                    </div>
                    <button
                      onClick={handleQuickSadaqah}
                      className="bg-[#10E07A] text-[#05070A] font-bold py-2.5 px-5 rounded-xl text-sm active:scale-[0.98] transition-transform"
                    >
                      Donate Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Qibla Finder Button */}
              <div className="px-4 mt-4 mb-6">
                <button
                  onClick={handleQiblaFinder}
                  className="w-full bg-[#1A1D26] rounded-2xl p-4 border border-white/5 flex items-center gap-4 hover:border-[#FFD700]/20 transition-colors"
                >
                  <div className="w-12 h-12 bg-[#FFD700]/10 rounded-full flex items-center justify-center border border-[#FFD700]/20">
                    <Compass className="w-6 h-6 text-[#FFD700]" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-bold text-sm">Qibla Finder</p>
                    <p className="text-white/40 text-xs">Find prayer direction (NE &bull; 56°)</p>
                  </div>
                  <span className="material-symbols-outlined text-white/20">arrow_forward</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
