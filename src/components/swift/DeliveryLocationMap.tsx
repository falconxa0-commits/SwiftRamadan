'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, MapPin, Navigation, Home, Building2, Heart, ChevronDown } from 'lucide-react';
import { useNavigation, useCheckout } from '@/lib/store-selectors';
import { deliveryLocations } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export default function DeliveryLocationMap() {
  const { activeModal, setActiveModal } = useNavigation();
  const {
    deliveryAddress,
    setDeliveryAddress,
    deliveryInstructions,
    setDeliveryInstructions,
  } = useCheckout();
  const { toast } = useToast();

  const isOpen = activeModal === 'delivery-location';
  const [searchQuery, setSearchQuery] = useState(deliveryAddress);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [apartment, setApartment] = useState('');
  const [selectedShortcut, setSelectedShortcut] = useState<string | null>(null);

  const handleSelectLocation = (loc: typeof deliveryLocations[0]) => {
    setSearchQuery(loc.address);
    setDeliveryAddress(loc.address);
    setShowSuggestions(false);
    setSelectedShortcut(loc.name);
    toast({ title: 'Location Updated 📍', description: `Delivery set to ${loc.name}` });
  };

  const handleMyLocation = () => {
    const currentAddress = '12 Admiralty Way, Lekki Phase 1';
    setSearchQuery(currentAddress);
    setDeliveryAddress(currentAddress);
    setSelectedShortcut('Home');
    toast({ title: 'Current Location Found 📡', description: 'Using your current location' });
  };

  const handleConfirm = () => {
    setDeliveryAddress(searchQuery);
    setDeliveryInstructions(deliveryInstructions);
    toast({ title: 'Location Confirmed ✅', description: 'Delivery address saved successfully' });
    setActiveModal(null);
  };

  const shortcuts = [
    { id: 'home', label: 'Home', icon: Home, address: deliveryLocations[0].address },
    { id: 'office', label: 'Office', icon: Building2, address: deliveryLocations[1].address },
    { id: 'partner', label: "Partner's House", icon: Heart, address: deliveryLocations[2].address },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[90]"
            onClick={() => setActiveModal(null)}
          />

          {/* Full-screen modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#05070A] overflow-hidden flex flex-col"
          >
            {/* Simulated Map Background */}
            <div className="absolute inset-0">
              {/* Dark base */}
              <div className="absolute inset-0 bg-[#0a0e14]" />

              {/* Grid pattern */}
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(0deg, rgba(16,224,122,0.5) 0px, transparent 1px, transparent 60px),
                    repeating-linear-gradient(90deg, rgba(16,224,122,0.5) 0px, transparent 1px, transparent 60px)
                  `,
                }}
              />

              {/* Subtle diagonal streets */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
                <line x1="0" y1="0" x2="100%" y2="60%" stroke="#10E07A" strokeWidth="2" />
                <line x1="20%" y1="0" x2="80%" y2="100%" stroke="#10E07A" strokeWidth="1.5" />
                <line x1="60%" y1="0" x2="100%" y2="40%" stroke="#10E07A" strokeWidth="1" />
                <line x1="0" y1="40%" x2="100%" y2="80%" stroke="#10E07A" strokeWidth="1.5" />
                <line x1="0" y1="70%" x2="70%" y2="100%" stroke="#10E07A" strokeWidth="1" />
                <line x1="40%" y1="0" x2="0" y2="80%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <line x1="80%" y1="20%" x2="100%" y2="100%" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              </svg>

              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/80 via-transparent to-[#05070A]" />
              <div className="absolute top-0 left-0 w-64 h-64 bg-[var(--sr-customer)]/5 blur-[100px] rounded-full" />
              <div className="absolute bottom-40 right-0 w-48 h-48 bg-[var(--sr-vendor)]/5 blur-[80px] rounded-full" />

              {/* Block shapes */}
              <div className="absolute top-[25%] left-[15%] w-20 h-16 border border-white/[0.03] bg-white/[0.01] rounded-sm" />
              <div className="absolute top-[30%] left-[40%] w-28 h-12 border border-white/[0.03] bg-white/[0.01] rounded-sm" />
              <div className="absolute top-[45%] right-[20%] w-16 h-20 border border-white/[0.03] bg-white/[0.01] rounded-sm" />
              <div className="absolute top-[55%] left-[25%] w-24 h-14 border border-white/[0.03] bg-white/[0.01] rounded-sm" />
              <div className="absolute top-[20%] right-[30%] w-12 h-24 border border-white/[0.03] bg-white/[0.01] rounded-sm" />
            </div>

            {/* Map Content Layer */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Top Search Bar */}
              <div className="p-4">
                <div className="glass-effect rounded-2xl border border-white/10 p-2 sm:p-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => setActiveModal(null)}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                    >
                      <X className="w-5 h-5 text-white/60" />
                    </button>
                    <div className="flex-1 flex items-center gap-2 bg-[#0F1117] rounded-xl px-4 py-3 border border-white/5 focus-within:border-[var(--sr-customer)]/30 transition-all">
                      <Search className="w-4 h-4 text-[var(--sr-customer)]/60 shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Search for address..."
                        className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/60"
                      />
                    </div>
                  </div>

                  {/* Suggested Addresses */}
                  <AnimatePresence>
                    {showSuggestions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 space-y-1">
                          {deliveryLocations.map((loc) => (
                            <button
                              key={loc.id}
                              onClick={() => handleSelectLocation(loc)}
                              className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                            >
                              <div className="w-9 h-9 rounded-full bg-[var(--sr-customer)]/10 flex items-center justify-center border border-[var(--sr-customer)]/20 shrink-0">
                                <MapPin className="w-4 h-4 text-[var(--sr-customer)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-semibold">{loc.name}</p>
                                <p className="text-white/65 text-xs truncate">{loc.address}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Floating Buttons */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 sm:gap-3 z-20">
                {/* My Location Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleMyLocation}
                  className="w-12 h-12 rounded-full bg-[#1A1D26]/90 border border-white/10 flex items-center justify-center glass-effect green-glow"
                >
                  <Navigation className="w-5 h-5 text-[var(--sr-customer)]" />
                </motion.button>
              </div>

              {/* Deliver before Iftar Badge */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-[#1A1D26]/90 border border-[var(--sr-vendor)]/20 rounded-xl px-3 py-2 glass-effect"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌙</span>
                    <div>
                      <p className="text-[var(--sr-vendor)] text-xs font-bold">Deliver before Iftar</p>
                      <p className="text-white/65 text-[10px]">Maghrib 6:45 PM</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Center Pin */}
              <div className="flex-1 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  {/* Tooltip */}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap"
                  >
                    <div className="bg-[var(--sr-customer)] text-[#05070A] text-xs font-bold px-3 py-1.5 rounded-lg">
                      Delivery Point
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--sr-customer)] rotate-45" />
                    </div>
                  </motion.div>

                  {/* Pin */}
                  <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 150, delay: 0.1 }}
                    className="relative"
                  >
                    <div className="w-10 h-10 rounded-full bg-[var(--sr-customer)] flex items-center justify-center shadow-lg shadow-[#10E07A]/30">
                      <MapPin className="w-5 h-5 text-[#05070A]" fill="#05070A" />
                    </div>
                    {/* Pin shadow */}
                    <motion.div
                      animate={{
                        scale: [1, 1.8, 1],
                        opacity: [0.4, 0, 0.4],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="absolute top-0 left-0 w-10 h-10 rounded-full bg-[var(--sr-customer)]/20"
                    />
                  </motion.div>

                  {/* Pin stick */}
                  <div className="w-0.5 h-4 bg-[var(--sr-customer)] mx-auto" />
                </div>
              </div>

              {/* Bottom Sheet */}
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 25 }}
                className="bg-[#0F1117] rounded-t-3xl border-t border-white/10 max-h-[55%] overflow-y-auto custom-scrollbar"
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                <div className="px-5 pb-8">
                  {/* Current Address */}
                  <div className="flex items-start gap-2 sm:gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--sr-customer)]/10 flex items-center justify-center border border-[var(--sr-customer)]/20 shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5 text-[var(--sr-customer)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/65 text-xs mb-0.5">Current Address</p>
                      <p className="text-white text-sm font-semibold leading-snug">{searchQuery || deliveryAddress}</p>
                    </div>
                    <ChevronDown className="w-5 h-5 text-white/60 shrink-0 mt-1" />
                  </div>

                  {/* Apartment/Suite Input */}
                  <div className="mb-4">
                    <label className="text-white/65 text-xs mb-1.5 block">Apartment / Suite</label>
                    <input
                      type="text"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      placeholder="e.g. Flat 4, Block B"
                      className="w-full bg-[#1A1D26] border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--sr-customer)]/30 placeholder:text-white/20 transition-colors"
                    />
                  </div>

                  {/* Delivery Instructions */}
                  <div className="mb-5">
                    <label className="text-white/65 text-xs mb-1.5 block">Delivery Instructions</label>
                    <textarea
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      placeholder="e.g. Ring the bell twice, leave at the gate..."
                      rows={2}
                      className="w-full bg-[#1A1D26] border border-white/5 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--sr-customer)]/30 placeholder:text-white/20 resize-none transition-colors"
                    />
                  </div>

                  {/* Quick Shortcuts */}
                  <div className="mb-6">
                    <p className="text-white/65 text-xs mb-2">Quick Shortcuts</p>
                    <div className="flex gap-2">
                      {shortcuts.map((sc) => {
                        const Icon = sc.icon;
                        const isActive = selectedShortcut === sc.label;
                        return (
                          <button
                            key={sc.id}
                            onClick={() => handleSelectLocation({ id: shortcuts.indexOf(sc) + 1, name: sc.label, address: sc.address, lat: 0, lng: 0 })}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all ${
                              isActive
                                ? 'bg-[var(--sr-customer)]/20 border border-[var(--sr-customer)]/30 text-[var(--sr-customer)]'
                                : 'bg-[#1A1D26] border border-white/5 text-white/50 hover:bg-white/5'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {sc.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Confirm Button */}
                  <button
                    onClick={handleConfirm}
                    className="w-full py-4 rounded-2xl bg-[var(--sr-customer)] text-[#05070A] font-black text-base tracking-wide hover:brightness-110 transition-all green-glow active:scale-[0.98]"
                  >
                    CONFIRM LOCATION
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
