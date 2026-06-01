'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Eye, EyeOff, TrendingUp, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { vendorMenuItems, formatNaira } from '@/lib/data';

export default function VendorStockControl() {
  const { activeModal, setActiveModal } = useAppStore();
  const isOpen = activeModal === 'vendor-stock';

  const [items, setItems] = useState(
    vendorMenuItems.map(item => ({ ...item, available: item.available }))
  );

  const handleToggle = (id: number) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, available: !item.available } : item
      )
    );
  };

  const availableCount = items.filter(i => i.available).length;
  const unavailableCount = items.length - availableCount;

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
                <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 flex items-center justify-center border border-[#FFD700]/20">
                  <Package className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Stock Control</h2>
                  <p className="text-white/40 text-xs mt-0.5">Toggle items on or off</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Summary Stats */}
            <div className="px-5 pt-4 pb-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#13ec13]/5 border border-[#13ec13]/20 rounded-xl p-3 text-center">
                  <p className="text-[#13ec13] text-xl font-black">{availableCount}</p>
                  <p className="text-white/40 text-[10px] font-bold uppercase">Available</p>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 text-center">
                  <p className="text-red-400 text-xl font-black">{unavailableCount}</p>
                  <p className="text-white/40 text-[10px] font-bold uppercase">Unavailable</p>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto px-5 pb-8 custom-scrollbar">
              <div className="space-y-2 mt-3">
                {items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                      item.available
                        ? 'bg-[#1A1D26] border-white/5'
                        : 'bg-[#1A1D26]/40 border-white/5 opacity-60'
                    }`}
                  >
                    {/* Item Image Placeholder */}
                    <div className="w-12 h-12 rounded-xl bg-[#0F1117] border border-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.available ? (
                        <Package className="w-5 h-5 text-[#FFD700]" />
                      ) : (
                        <EyeOff className="w-5 h-5 text-white/20" />
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${item.available ? 'text-white' : 'text-white/40'}`}>
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-bold ${item.available ? 'text-[#FFD700]' : 'text-white/20'}`}>
                          {formatNaira(item.price)}
                        </span>
                        <span className="text-white/10 text-xs">•</span>
                        <span className="text-white/30 text-xs">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3 text-[#13ec13]/50" />
                        <span className="text-white/30 text-[10px]">{item.orders} orders</span>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggle(item.id)}
                      className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center px-0.5 shrink-0 ${
                        item.available ? 'bg-[#13ec13]' : 'bg-white/10'
                      }`}
                    >
                      <motion.div
                        animate={{ x: item.available ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-6 h-6 rounded-full bg-white shadow-md"
                      />
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setItems(prev => prev.map(item => ({ ...item, available: true })))}
                  className="flex-1 py-3 rounded-xl bg-[#13ec13]/10 border border-[#13ec13]/20 text-[#13ec13] text-sm font-bold hover:bg-[#13ec13]/20 transition-colors"
                >
                  Enable All
                </button>
                <button
                  onClick={() => setItems(prev => prev.map(item => ({ ...item, available: false })))}
                  className="flex-1 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-colors"
                >
                  Disable All
                </button>
              </div>

              {/* Tip */}
              <div className="mt-4 flex items-start gap-2 bg-[#FFD700]/5 border border-[#FFD700]/10 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-[#FFD700] shrink-0 mt-0.5" />
                <p className="text-white/40 text-xs leading-relaxed">
                  Unavailable items won&apos;t show to customers. Toggle them back on when stock is replenished.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
