'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, DollarSign, Clock, Zap, AlertCircle } from 'lucide-react';
import { useNavigation } from '@/lib/store-selectors';
import { vendorMenuItems, formatNaira } from '@/lib/data';

interface PriceItem {
  id: number;
  name: string;
  price: number;
  category: string;
  adjustment: number; // percentage
}

export default function VendorPricingModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const isOpen = activeModal === 'vendor-pricing';

  const [priceItems, setPriceItems] = useState<PriceItem[]>(
    vendorMenuItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      adjustment: 0,
    }))
  );

  const [peakHoursEnabled, setPeakHoursEnabled] = useState(false);
  const [peakAdjustment, setPeakAdjustment] = useState(15);

  const handleAdjustmentChange = (id: number, value: number) => {
    setPriceItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, adjustment: value } : item
      )
    );
  };

  const getAdjustedPrice = (price: number, adjustment: number) => {
    return Math.round(price * (1 + adjustment / 100));
  };

  const handleClose = () => {
    setActiveModal(null);
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
            className="fixed inset-0 bg-black/70 z-[90]"
            onClick={handleClose}
          />
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#0F1117] rounded-t-3xl z-[100] flex flex-col overflow-hidden border-t border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center border border-cyan-400/20">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Dynamic Pricing</h2>
                  <p className="text-white/65 text-xs mt-0.5">Adjust prices for demand</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Peak Hours Toggle */}
            <div className="px-5 pt-4">
              <div className="flex items-center justify-between p-4 bg-[#1A1D26] rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F5C451]/10 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#F5C451]" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Peak Hours Mode</p>
                    <p className="text-white/65 text-xs">Auto-adjust during 5:30 - 7:00 PM</p>
                  </div>
                </div>
                <button
                  onClick={() => setPeakHoursEnabled(!peakHoursEnabled)}
                  className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center px-0.5 ${
                    peakHoursEnabled ? 'bg-[#F5C451]' : 'bg-white/10'
                  }`}
                >
                  <motion.div
                    animate={{ x: peakHoursEnabled ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-6 h-6 rounded-full bg-white shadow-md"
                  />
                </button>
              </div>

              {/* Peak Hours Adjustment */}
              <AnimatePresence>
                {peakHoursEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 bg-[#F5C451]/5 border border-[#F5C451]/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/50 text-xs font-bold uppercase">Peak Markup</span>
                        <span className="text-[#F5C451] text-sm font-black">+{peakAdjustment}%</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={30}
                        step={5}
                        value={peakAdjustment}
                        onChange={e => setPeakAdjustment(Number(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#F5C451]"
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-white/20 text-[10px]">+5%</span>
                        <span className="text-white/20 text-[10px]">+30%</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto px-5 pb-8 custom-scrollbar mt-3">
              <div className="space-y-3">
                {priceItems.map((item, i) => {
                  const adjustedPrice = getAdjustedPrice(item.price, item.adjustment);
                  const peakPrice = peakHoursEnabled ? getAdjustedPrice(item.price, peakAdjustment) : null;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-[#1A1D26] rounded-2xl border border-white/5 p-4"
                    >
                      {/* Item Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-white/60 text-xs">{item.category}</span>
                            <span className="text-white/10 text-xs">•</span>
                            <span className="text-white/65 text-xs">Base: {formatNaira(item.price)}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className={`font-black text-sm ${item.adjustment > 0 ? 'text-[#F5C451]' : item.adjustment < 0 ? 'text-cyan-400' : 'text-white/60'}`}>
                            {formatNaira(adjustedPrice)}
                          </p>
                          {peakPrice && (
                            <p className="text-[#F5C451]/50 text-[10px]">
                              Peak: {formatNaira(peakPrice)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Slider */}
                      <div className="flex items-center gap-3">
                        <span className="text-white/20 text-[10px] font-bold w-8">-20%</span>
                        <input
                          type="range"
                          min={-20}
                          max={30}
                          step={5}
                          value={item.adjustment}
                          onChange={e => handleAdjustmentChange(item.id, Number(e.target.value))}
                          className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#F5C451]"
                        />
                        <span className="text-white/20 text-[10px] font-bold w-8 text-right">+30%</span>
                      </div>

                      {/* Current adjustment label */}
                      <div className="flex items-center justify-center mt-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.adjustment > 0
                            ? 'bg-[#F5C451]/10 text-[#F5C451] border border-[#F5C451]/20'
                            : item.adjustment < 0
                              ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                              : 'bg-white/5 text-white/60 border border-white/10'
                        }`}>
                          {item.adjustment > 0 ? '+' : ''}{item.adjustment}%
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Info Tip */}
              <div className="mt-4 flex items-start gap-2 bg-cyan-400/5 border border-cyan-400/10 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-white/65 text-xs leading-relaxed">
                  Adjust individual product prices based on demand. Peak hours mode adds an automatic markup during high-traffic Iftar periods.
                </p>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => setActiveModal(null)}
                className="w-full mt-4 bg-[#F5C451] py-3.5 rounded-2xl text-[#05070A] font-black text-sm uppercase tracking-widest shadow-lg shadow-[#F5C451]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <DollarSign className="w-4 h-4" />
                Apply Pricing
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
