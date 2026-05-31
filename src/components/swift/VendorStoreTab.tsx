'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, AlertTriangle, ShoppingBag, Package } from 'lucide-react';
import { vendorMenuItems, formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

type CategoryFilter = 'All' | 'Iftar Meals' | 'Grills' | 'Sahur' | 'Drinks' | 'Bundles';

export default function VendorStoreTab() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [menuItems, setMenuItems] = useState(vendorMenuItems);

  const categories: CategoryFilter[] = ['All', 'Iftar Meals', 'Grills', 'Sahur', 'Drinks', 'Bundles'];

  const filteredItems = activeCategory === 'All'
    ? menuItems
    : menuItems.filter((item) => item.category === activeCategory);

  const unavailableCount = menuItems.filter((item) => !item.available).length;

  const toggleAvailability = (id: number) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, available: !item.available } : item
      )
    );
    const item = menuItems.find((m) => m.id === id);
    if (item) {
      toast({
        title: item.available ? 'Item Unavailable ❌' : 'Item Available ✅',
        description: `${item.name} is now ${item.available ? 'hidden from customers' : 'visible to customers'}`,
      });
    }
  };

  return (
    <div className="flex flex-col gap-5 px-4 pb-32 pt-2">
      {/* Stock Alert */}
      <AnimatePresence>
        {unavailableCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/20 shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 text-sm font-bold">Stock Alert</p>
                <p className="text-white/40 text-xs mt-0.5">
                  {unavailableCount} item{unavailableCount > 1 ? 's' : ''} currently unavailable — customers can&apos;t order them
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-white text-lg font-black">Menu Items</h2>
          <span className="px-2 py-0.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] text-[10px] font-black border border-[#FFD700]/20">
            {menuItems.length}
          </span>
        </div>
      </motion.div>

      {/* Category Filter Chips */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4"
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              activeCategory === cat
                ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30'
                : 'bg-[#1A1D26] text-white/40 border border-white/5 hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {/* Menu Item Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, i) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl bg-[#1A1D26] border p-4 transition-all ${
                item.available ? 'border-white/5' : 'border-red-500/20 opacity-70'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Item Image Thumbnail */}
                <div
                  className="w-16 h-16 rounded-xl bg-cover bg-center shrink-0 border border-white/10"
                  style={{ backgroundImage: `url(${item.image})` }}
                />

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${item.available ? 'text-white' : 'text-white/50'}`}>
                        {item.name}
                      </p>
                      <p className="text-[#FFD700] text-xs font-black mt-0.5">{formatNaira(item.price)}</p>
                    </div>
                    {/* Quick Edit Button */}
                    <button
                      onClick={() => toast({ title: 'Edit Item', description: `Editing ${item.name}` })}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 hover:bg-white/10 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5 text-white/40" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {/* Category Badge */}
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/40 text-[10px] font-semibold">
                      {item.category}
                    </span>
                    {/* Order Count */}
                    <div className="flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-white/30" />
                      <span className="text-white/30 text-[10px] font-semibold">{item.orders} orders</span>
                    </div>
                  </div>

                  {/* Availability Toggle */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <span className={`text-xs font-bold ${item.available ? 'text-[#13ec13]' : 'text-red-400'}`}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </span>
                    <button
                      onClick={() => toggleAvailability(item.id)}
                      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                        item.available ? 'bg-[#13ec13]' : 'bg-white/10'
                      }`}
                    >
                      <motion.div
                        animate={{ x: item.available ? 24 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add New Item FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
        onClick={() => toast({ title: 'Add New Item 🍽️', description: 'Item creation form coming soon' })}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-[#FFD700] flex items-center justify-center shadow-lg z-40 gold-glow active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 text-[#05070A]" strokeWidth={3} />
      </motion.button>

      {/* Empty state if filtered items is empty */}
      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/40 text-sm font-semibold">No items in this category</p>
          <p className="text-white/20 text-xs mt-1">Try selecting a different filter</p>
        </div>
      )}
    </div>
  );
}
