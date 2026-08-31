'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingCart, Calendar, Users, DollarSign, PartyPopper, ChevronRight, Truck } from 'lucide-react';
import { partyCategories, formatNaira } from '@/lib/data';
import { useNavigation, useCart } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

interface CrateItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

const livestockItems = [
  { id: 401, name: 'Whole Cow', description: 'Premium cow, freshly slaughtered. Feeds 50+ people.', price: 350000, image: '/images/meals/meal-suya.png', badge: 'Most Popular' },
  { id: 402, name: 'Half Cow', description: 'Half cow share, freshly cut. Feeds 25+ people.', price: 185000, image: '/images/meals/meal-suya.png', badge: 'Best Value' },
  { id: 403, name: 'Ram (Live)', description: 'Healthy ram for Eid celebration. Average 25kg.', price: 85000, image: '/images/meals/meal-suya.png', badge: 'Eid Special' },
  { id: 404, name: 'Ram (Dressed)', description: 'Slaughtered & cleaned ram. Ready to cook.', price: 95000, image: '/images/meals/meal-suya.png', badge: '' },
];

const grainItems = [
  { id: 501, name: '50kg Rice (Premium)', bulkPrice: 42000, singlePrice: 45000, image: '/images/categories/cat-groceries.png' },
  { id: 502, name: '25kg Beans', bulkPrice: 18000, singlePrice: 22000, image: '/images/categories/cat-groceries.png' },
  { id: 503, name: '10kg Flour', bulkPrice: 8500, singlePrice: 10000, image: '/images/categories/cat-groceries.png' },
  { id: 504, name: '5kg Semolina', bulkPrice: 5500, singlePrice: 7000, image: '/images/categories/cat-groceries.png' },
  { id: 505, name: '25L Cooking Oil', bulkPrice: 26000, singlePrice: 28000, image: '/images/categories/cat-groceries.png' },
  { id: 506, name: '10kg Sugar', bulkPrice: 12000, singlePrice: 15000, image: '/images/categories/cat-groceries.png' },
];

const crateBuilderItems = [
  { id: 601, name: 'Jollof Rice Pack', price: 4500, image: '/images/meals/meal-jollof.png' },
  { id: 602, name: 'Suya Platter', price: 3200, image: '/images/meals/meal-suya.png' },
  { id: 603, name: 'Moi Moi (6 pcs)', price: 2800, image: '/images/meals/meal-moimoi.png' },
  { id: 604, name: 'Date Smoothie', price: 1800, image: '/images/meals/meal-smoothie.png' },
  { id: 605, name: 'Zobo Drink (2L)', price: 1500, image: '/images/categories/cat-drinks.png' },
  { id: 606, name: 'Dates (1kg)', price: 4500, image: '/images/categories/cat-dates.png' },
  { id: 607, name: 'Fruit Basket', price: 5000, image: '/images/categories/cat-fruits.png' },
  { id: 608, name: 'Snack Pack', price: 2000, image: '/images/categories/cat-snacks.png' },
  { id: 609, name: 'Sahur Bundle', price: 3500, image: '/images/categories/cat-sahur.png' },
  { id: 610, name: 'Iftar Combo', price: 6000, image: '/images/categories/cat-iftar.png' },
  { id: 611, name: 'Kunu Drink (2L)', price: 1200, image: '/images/categories/cat-drinks.png' },
  { id: 612, name: 'Party Jollof (Large)', price: 8000, image: '/images/meals/meal-jollof.png' },
];

const drinkItems = [
  { id: 701, name: 'Zobo (10L)', bulkPrice: 8000, singlePrice: 12000, image: '/images/categories/cat-drinks.png' },
  { id: 702, name: 'Kunu (10L)', bulkPrice: 7500, singlePrice: 11000, image: '/images/categories/cat-drinks.png' },
  { id: 703, name: 'Hibiscus Punch (5L)', bulkPrice: 4000, singlePrice: 5500, image: '/images/categories/cat-drinks.png' },
  { id: 704, name: 'Fresh Juice Pack', bulkPrice: 6000, singlePrice: 8500, image: '/images/categories/cat-drinks.png' },
];

const partyPackItems = [
  { id: 801, name: 'Small Chop Pack (50 pcs)', price: 15000, image: '/images/categories/cat-snacks.png', serves: '25-30 people' },
  { id: 802, name: 'Suya Box (100 skewers)', price: 35000, image: '/images/meals/meal-suya.png', serves: '50+ people' },
  { id: 803, name: 'Party Rice Bowl (20 portions)', price: 45000, image: '/images/meals/meal-jollof.png', serves: '20 people' },
  { id: 804, name: 'Iftar Complete Package', price: 120000, image: '/images/products/ramadan-box-1.png', serves: '50+ people' },
];

export default function PartyBulkModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const isOpen = activeModal === 'partyBulk';

  const [activeCategory, setActiveCategory] = useState('all');
  const [crateItems, setCrateItems] = useState<CrateItem[]>([]);
  const [showPartyForm, setShowPartyForm] = useState(false);
  const [partyForm, setPartyForm] = useState({ eventName: '', date: '', guestCount: '', budgetRange: '' });

  const handleClose = () => setActiveModal(null);

  const crateTotal = crateItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCrate = (item: typeof crateBuilderItems[0]) => {
    setCrateItems(prev => {
      const existing = prev.find(ci => ci.id === item.id);
      if (existing) {
        return prev.map(ci => ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, image: item.image, quantity: 1 }];
    });
  };

  const removeFromCrate = (id: number) => {
    setCrateItems(prev => {
      const existing = prev.find(ci => ci.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(ci => ci.id === id ? { ...ci, quantity: ci.quantity - 1 } : ci);
      }
      return prev.filter(ci => ci.id !== id);
    });
  };

  const getCrateQuantity = (id: number) => {
    return crateItems.find(ci => ci.id === id)?.quantity || 0;
  };

  const handleAddCrateToCart = () => {
    if (crateItems.length === 0) return;
    crateItems.forEach(item => {
      addToCart({ id: item.id, name: item.name, price: item.price, image: item.image, quantity: item.quantity });
    });
    toast({ title: 'Crate added to cart! 🛒', description: `${crateItems.length} items totaling ${formatNaira(crateTotal)}` });
    setCrateItems([]);
  };

  const handleStartOrder = (name: string, price: number, image: string, id: number) => {
    addToCart({ id, name, price, image });
    toast({ title: 'Added to Cart! 🛒', description: `${name} - ${formatNaira(price)}` });
  };

  const handlePartyFormSubmit = () => {
    toast({ title: 'Party Order Requested! 🎉', description: `We'll prepare a custom quote for "${partyForm.eventName}" with ${partyForm.guestCount} guests.` });
    setShowPartyForm(false);
    setPartyForm({ eventName: '', date: '', guestCount: '', budgetRange: '' });
  };

  const shouldShowSection = (section: string) => {
    if (activeCategory === 'all') return true;
    return activeCategory === section;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[var(--sr-surface-base)] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 glass-effect border-b border-white/5">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--sr-vendor)]/10 rounded-xl flex items-center justify-center border border-[var(--sr-vendor)]/20">
                  <PartyPopper className="w-5 h-5 text-[var(--sr-vendor)]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Party & Bulk</h2>
                  <p className="text-white/65 text-xs">Plan Your Ramadan Gathering</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-[var(--sr-surface-elevated)] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
              {partyCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? 'bg-[var(--sr-customer)] text-[var(--sr-surface-base)]'
                      : 'bg-[var(--sr-surface-elevated)] border border-white/10 text-white/60 hover:text-white hover:border-white/20'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Hero Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mx-4 mt-4 rounded-2xl overflow-hidden"
          >
            <div
              className="w-full h-44 bg-center bg-no-repeat bg-cover"
              style={{ backgroundImage: 'url("/images/hero/hero-family-iftar.png")' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--sr-surface-base)] via-[var(--sr-surface-base)]/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h2 className="text-white font-black text-xl mb-1">Plan Your Ramadan Gathering</h2>
              <p className="text-white/60 text-xs">Bulk orders, party packs & livestock — all in one place</p>
            </div>
          </motion.div>

          {/* Premium Livestock */}
          {shouldShowSection('livestock') && (
            <div className="px-4 mt-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[var(--sr-vendor)] text-xl">pets</span>
                <h3 className="text-white font-bold text-lg">Premium Livestock</h3>
              </div>
              <div className="space-y-4">
                {livestockItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.4 }}
                    className="bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 overflow-hidden flex"
                  >
                    <div
                      className="w-28 h-28 bg-center bg-no-repeat bg-cover shrink-0"
                      style={{ backgroundImage: `url("${item.image}")` }}
                    />
                    <div className="flex-1 p-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-bold text-sm">{item.name}</h4>
                          {item.badge && (
                            <span className="bg-[var(--sr-vendor)]/10 text-[var(--sr-vendor)] text-[9px] font-bold px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-white/65 text-[11px] line-clamp-1">{item.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--sr-customer)] font-black text-sm">{formatNaira(item.price)}</span>
                        <button
                          onClick={() => handleStartOrder(item.name, item.price, item.image, item.id)}
                          className="bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/20 text-[var(--sr-customer)] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[var(--sr-customer)]/20 transition-colors"
                        >
                          Start Order
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Grains & Staples */}
          {shouldShowSection('grains') && (
            <div className="px-4 mt-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[var(--sr-customer)] text-xl">grain</span>
                <h3 className="text-white font-bold text-lg">Grains & Staples</h3>
                <span className="text-[var(--sr-customer)]/60 text-xs font-bold ml-auto">Bulk pricing</span>
              </div>
              <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
                {grainItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.06, duration: 0.3 }}
                    className="min-w-[160px] bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 overflow-hidden"
                  >
                    <div
                      className="w-full h-24 bg-center bg-no-repeat bg-cover"
                      style={{ backgroundImage: `url("${item.image}")` }}
                    />
                    <div className="p-3">
                      <p className="text-white font-bold text-xs mb-1 line-clamp-1">{item.name}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[var(--sr-customer)] font-black text-xs">{formatNaira(item.bulkPrice)}</span>
                        <span className="text-white/60 text-[10px] line-through">{formatNaira(item.singlePrice)}</span>
                      </div>
                      <button
                        onClick={() => handleStartOrder(item.name, item.bulkPrice, item.image, item.id)}
                        className="w-full bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/20 text-[var(--sr-customer)] py-1.5 rounded-lg text-[10px] font-bold hover:bg-[var(--sr-customer)]/20 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Drinks Section */}
          {shouldShowSection('drinks') && (
            <div className="px-4 mt-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[var(--sr-rider)] text-xl">local_drink</span>
                <h3 className="text-white font-bold text-lg">Drinks & Beverages</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {drinkItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.3 }}
                    className="bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 overflow-hidden"
                  >
                    <div
                      className="w-full h-20 bg-center bg-no-repeat bg-cover"
                      style={{ backgroundImage: `url("${item.image}")` }}
                    />
                    <div className="p-2.5">
                      <p className="text-white font-bold text-[11px] mb-1 line-clamp-1">{item.name}</p>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[var(--sr-customer)] font-black text-[11px]">{formatNaira(item.bulkPrice)}</span>
                        <span className="text-white/60 text-[9px] line-through">{formatNaira(item.singlePrice)}</span>
                      </div>
                      <button
                        onClick={() => handleStartOrder(item.name, item.bulkPrice, item.image, item.id)}
                        className="w-full bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/20 text-[var(--sr-customer)] py-1.5 rounded-lg text-[10px] font-bold hover:bg-[var(--sr-customer)]/20 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Party Packs */}
          {shouldShowSection('party-packs') && (
            <div className="px-4 mt-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[var(--sr-vendor)] text-xl">celebration</span>
                <h3 className="text-white font-bold text-lg">Party Packs</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {partyPackItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.3 }}
                    className="bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 overflow-hidden"
                  >
                    <div
                      className="w-full h-24 bg-center bg-no-repeat bg-cover relative"
                      style={{ backgroundImage: `url("${item.image}")` }}
                    >
                      <div className="absolute top-2 right-2 bg-[var(--sr-vendor)]/90 text-[var(--sr-surface-base)] text-[8px] font-black px-2 py-0.5 rounded-full">
                        {item.serves}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-white font-bold text-xs mb-1 line-clamp-1">{item.name}</p>
                      <span className="text-[var(--sr-customer)] font-black text-sm block mb-2">{formatNaira(item.price)}</span>
                      <button
                        onClick={() => handleStartOrder(item.name, item.price, item.image, item.id)}
                        className="w-full bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/20 text-[var(--sr-customer)] py-1.5 rounded-lg text-[10px] font-bold hover:bg-[var(--sr-customer)]/20 transition-colors"
                      >
                        Start Order
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Mix & Match Crate Builder */}
          {shouldShowSection('all') && (
            <div className="px-4 mt-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[var(--sr-warning)] text-xl">inventory_2</span>
                <h3 className="text-white font-bold text-lg">Mix & Match Crate Builder</h3>
              </div>
              <p className="text-white/65 text-xs mb-4">Build your perfect custom crate</p>

              <div className="grid grid-cols-3 gap-2.5 mb-4">
                {crateBuilderItems.map((item) => {
                  const qty = getCrateQuantity(item.id);
                  return (
                    <motion.div
                      key={item.id}
                      whileTap={{ scale: 0.95 }}
                      className="bg-[var(--sr-surface-elevated)] rounded-xl border border-white/5 overflow-hidden relative"
                    >
                      <div
                        className="w-full h-20 bg-center bg-no-repeat bg-cover"
                        style={{ backgroundImage: `url("${item.image}")` }}
                      />
                      <div className="p-2">
                        <p className="text-white font-bold text-[10px] mb-0.5 line-clamp-1">{item.name}</p>
                        <span className="text-[var(--sr-customer)] text-[10px] font-bold">{formatNaira(item.price)}</span>
                      </div>
                      {qty > 0 && (
                        <div className="absolute top-1.5 right-1.5 bg-[var(--sr-customer)] text-[var(--sr-surface-base)] text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                          {qty}
                        </div>
                      )}
                      <div className="flex border-t border-white/5">
                        <button
                          onClick={() => removeFromCrate(item.id)}
                          className={`flex-1 py-1.5 flex items-center justify-center transition-colors ${
                            qty > 0 ? 'text-red-400 hover:bg-red-500/10' : 'text-white/20 cursor-not-allowed'
                          }`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="w-px bg-white/5" />
                        <button
                          onClick={() => addToCrate(item)}
                          className="flex-1 py-1.5 flex items-center justify-center text-[var(--sr-customer)] hover:bg-[var(--sr-customer)]/10 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Crate Summary */}
              {crateItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[var(--sr-surface-elevated)] rounded-2xl border border-[var(--sr-customer)]/20 p-4 mb-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/60 text-xs font-medium">Your Crate ({crateItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span className="text-[var(--sr-customer)] font-black text-lg">{formatNaira(crateTotal)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {crateItems.map(item => (
                      <span key={item.id} className="bg-white/5 text-white/70 text-[10px] px-2 py-1 rounded-full">
                        {item.name} ×{item.quantity}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={handleAddCrateToCart}
                    className="w-full bg-[var(--sr-customer)] text-[var(--sr-surface-base)] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[var(--sr-customer)]/90 active:scale-[0.98] transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add Crate to Cart
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {/* Spacer for FAB */}
          <div className="h-32" />

          {/* Floating Action Button - Start a Party Order */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            onClick={() => setShowPartyForm(true)}
            className="fixed bottom-8 right-4 z-20 bg-[var(--sr-vendor)] text-[var(--sr-surface-base)] px-5 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-[var(--sr-vendor)]/20 hover:shadow-[var(--sr-vendor)]/30 transition-shadow active:scale-[0.98]"
          >
            <PartyPopper className="w-5 h-5" />
            Start a Party Order
          </motion.button>

          {/* Party Order Form Modal */}
          <AnimatePresence>
            {showPartyForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-30 bg-black/60 flex items-end sm:items-center justify-center"
                onClick={() => setShowPartyForm(false)}
              >
                <motion.div
                  initial={{ y: 300 }}
                  animate={{ y: 0 }}
                  exit={{ y: 300 }}
                  transition={{ type: 'spring', damping: 25 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full sm:max-w-md bg-[var(--sr-surface-elevated)] rounded-t-3xl sm:rounded-3xl border border-white/10 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-bold text-lg">Start a Party Order</h3>
                    <button onClick={() => setShowPartyForm(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-white/50 text-xs font-medium mb-1.5 block">Event Name</label>
                      <div className="relative">
                        <PartyPopper className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                        <input
                          type="text"
                          value={partyForm.eventName}
                          onChange={(e) => setPartyForm(p => ({ ...p, eventName: e.target.value }))}
                          placeholder="e.g., Amina's Iftar Party"
                          className="w-full bg-[var(--sr-surface-base)] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[var(--sr-vendor)]/30 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-white/50 text-xs font-medium mb-1.5 block">Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                        <input
                          type="date"
                          value={partyForm.date}
                          onChange={(e) => setPartyForm(p => ({ ...p, date: e.target.value }))}
                          className="w-full bg-[var(--sr-surface-base)] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-[var(--sr-vendor)]/30 focus:outline-none transition-colors [color-scheme:dark]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-white/50 text-xs font-medium mb-1.5 block">Number of Guests</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                        <input
                          type="number"
                          value={partyForm.guestCount}
                          onChange={(e) => setPartyForm(p => ({ ...p, guestCount: e.target.value }))}
                          placeholder="e.g., 50"
                          className="w-full bg-[var(--sr-surface-base)] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[var(--sr-vendor)]/30 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-white/50 text-xs font-medium mb-1.5 block">Budget Range</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                        <select
                          value={partyForm.budgetRange}
                          onChange={(e) => setPartyForm(p => ({ ...p, budgetRange: e.target.value }))}
                          className="w-full bg-[var(--sr-surface-base)] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-[var(--sr-vendor)]/30 focus:outline-none transition-colors appearance-none"
                        >
                          <option value="" className="bg-[var(--sr-surface-elevated)]">Select budget range</option>
                          <option value="50k-100k" className="bg-[var(--sr-surface-elevated)]">₦50,000 - ₦100,000</option>
                          <option value="100k-250k" className="bg-[var(--sr-surface-elevated)]">₦100,000 - ₦250,000</option>
                          <option value="250k-500k" className="bg-[var(--sr-surface-elevated)]">₦250,000 - ₦500,000</option>
                          <option value="500k+" className="bg-[var(--sr-surface-elevated)]">₦500,000+</option>
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 rotate-90" />
                      </div>
                    </div>

                    <button
                      onClick={handlePartyFormSubmit}
                      disabled={!partyForm.eventName || !partyForm.guestCount}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        partyForm.eventName && partyForm.guestCount
                          ? 'bg-[var(--sr-vendor)] text-[var(--sr-surface-base)] hover:bg-[var(--sr-vendor)]/90 active:scale-[0.98]'
                          : 'bg-white/5 text-white/60 cursor-not-allowed border border-white/10'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      Submit Party Order Request
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
