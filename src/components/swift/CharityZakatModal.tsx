'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ChevronRight, Check, Share2 } from 'lucide-react';
import { useNavigation, useCart, useAppStore } from '@/lib/store-selectors';
import { charityItems, charityOrphanages, formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

type DonationTab = 'single' | 'box';

export default function CharityZakatModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const { addToCart } = useCart();
  const hasanatPoints = useAppStore(s => s.hasanatPoints);
  const setHasanatPoints = useAppStore(s => s.setHasanatPoints);
  const { toast } = useToast();
  const isOpen = activeModal === 'charity';

  const [donationTab, setDonationTab] = useState<DonationTab>('single');
  const [selectedOrphanage, setSelectedOrphanage] = useState<number | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(2500);
  const [customAmount, setCustomAmount] = useState('');
  const [showAmountSelector, setShowAmountSelector] = useState(false);
  const [showConfirmed, setShowConfirmed] = useState(false);
  const [confirmedAmount, setConfirmedAmount] = useState(0);
  const [confirmedMeals, setConfirmedMeals] = useState(0);

  // Zakat calculator state
  const [income, setIncome] = useState('');
  const [savings, setSavings] = useState('');
  const [debts, setDebts] = useState('');
  const [zakatResult, setZakatResult] = useState<number | null>(null);

  // Impact ticker counter
  const [impactCount, setImpactCount] = useState(340);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setImpactCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const donationAmounts = [2500, 5000, 10000];

  const handleDonateOrphanage = (orphanageId: number) => {
    setSelectedOrphanage(orphanageId);
    setShowAmountSelector(true);
  };

  const handleConfirmDonation = () => {
    const amount = customAmount ? parseInt(customAmount) : selectedAmount;
    const meals = Math.floor(amount / 2500);
    setConfirmedAmount(amount);
    setConfirmedMeals(meals);
    setHasanatPoints(hasanatPoints + meals * 50);
    setShowAmountSelector(false);
    setShowConfirmed(true);
  };

  const handleQuickCharity = (item: typeof charityItems[0]) => {
    if (item.amount > 0) {
      const meals = item.mealsProvided;
      setConfirmedAmount(item.amount);
      setConfirmedMeals(meals);
      setHasanatPoints(hasanatPoints + meals * 50);
      addToCart({
        id: 500 + item.id,
        name: `Donation: ${item.name}`,
        price: item.amount,
        image: '',
      });
      setShowConfirmed(true);
    } else {
      toast({ title: 'Zakat Calculator', description: 'Use the Zakat Calculator below to compute your obligation' });
    }
  };

  const handleCalculateZakat = () => {
    const totalIncome = parseFloat(income) || 0;
    const totalSavings = parseFloat(savings) || 0;
    const totalDebts = parseFloat(debts) || 0;
    const netAssets = totalIncome + totalSavings - totalDebts;
    if (netAssets > 0) {
      setZakatResult(netAssets * 0.025);
    } else {
      setZakatResult(0);
    }
  };

  const handleShareImpact = () => {
    toast({ title: 'Impact Shared! 📤', description: `You sponsored ${confirmedMeals} meal${confirmedMeals > 1 ? 's' : ''} this Ramadan` });
  };

  const handleClose = () => {
    setActiveModal(null);
    setShowAmountSelector(false);
    setShowConfirmed(false);
    setSelectedOrphanage(null);
    setZakatResult(null);
    setCustomAmount('');
    setIncome('');
    setSavings('');
    setDebts('');
  };

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
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-rose-400" />
                <h2 className="text-white font-bold text-lg">Charity & Zakat</h2>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Donation Confirmed State */}
              <AnimatePresence mode="wait">
                {showConfirmed ? (
                  <motion.div
                    key="confirmed"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center px-6 py-16 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                      className="w-24 h-24 bg-[var(--sr-customer)]/20 rounded-full flex items-center justify-center border border-[var(--sr-customer)]/30 green-glow mb-6"
                    >
                      <Check className="w-12 h-12 text-[var(--sr-customer)]" />
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-2xl font-black text-white mb-2"
                    >
                      JazakAllah Khair!
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-white/50 text-sm mb-4"
                    >
                      Your donation of {formatNaira(confirmedAmount)} has been confirmed
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-[#1A1D26] rounded-2xl p-3 sm:p-4 border border-white/5 mb-4 w-full max-w-xs"
                    >
                      <p className="text-[var(--sr-customer)] text-3xl font-black">{confirmedMeals}</p>
                      <p className="text-white/65 text-xs">Meal{confirmedMeals > 1 ? 's' : ''} Sponsored</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="bg-[var(--sr-vendor)]/10 rounded-xl p-3 border border-[var(--sr-vendor)]/20 mb-6 w-full max-w-xs"
                    >
                      <p className="text-[var(--sr-vendor)] text-sm font-bold">+{confirmedMeals * 50} Hasanat Points</p>
                      <p className="text-white/65 text-[10px]">Earned from your generosity</p>
                    </motion.div>
                    <div className="flex gap-3 w-full max-w-xs">
                      <button
                        onClick={handleShareImpact}
                        className="flex-1 bg-[#1A1D26] text-white font-bold py-3 rounded-xl text-sm border border-white/10 flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Share Impact
                      </button>
                      <button
                        onClick={() => {
                          setShowConfirmed(false);
                        }}
                        className="flex-1 bg-[var(--sr-customer)] text-[#05070A] font-bold py-3 rounded-xl text-sm"
                      >
                        Done
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="main"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Impact Ticker */}
                    <div className="px-4 pt-4">
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#064e3b]/40 to-[#05070A] border border-[var(--sr-customer)]/20 p-3 sm:p-4">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--sr-customer)]/10 blur-[40px]" />
                        <div className="relative flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="flex size-2 bg-[var(--sr-customer)] rounded-full animate-pulse" />
                          </div>
                          <div>
                            <p className="text-[var(--sr-customer)] text-2xl font-black">{impactCount.toLocaleString()}</p>
                            <p className="text-white/50 text-xs">meals donated this hour</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Donation Type Tabs */}
                    <div className="px-4 mt-4">
                      <div className="flex bg-[#1A1D26] rounded-xl p-1 border border-white/5">
                        {(['single', 'box'] as DonationTab[]).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setDonationTab(tab)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                              donationTab === tab
                                ? 'bg-[var(--sr-customer)] text-[#05070A]'
                                : 'text-white/50 hover:text-white'
                            }`}
                          >
                            {tab === 'single' ? 'Single Meal' : 'Ramadan Box'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Orphanage Cards */}
                    <div className="px-4 mt-6">
                      <h3 className="text-white font-bold text-base mb-3">Support Orphanages</h3>
                      <div className="space-y-3">
                        {charityOrphanages.map(orphanage => (
                          <motion.div
                            key={orphanage.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#1A1D26] rounded-2xl p-3 sm:p-4 border border-white/5"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="text-white font-bold text-sm">{orphanage.name}</h4>
                                <p className="text-white/65 text-xs mt-0.5">{orphanage.location}</p>
                              </div>
                              <span className="text-[var(--sr-vendor)] text-xs font-bold">{orphanage.mealsServed} meals served</span>
                            </div>
                            {/* Progress Bar */}
                            <div className="mb-2">
                              <div className="flex justify-between text-[10px] text-white/65 mb-1">
                                <span>{orphanage.progress}% funded</span>
                                <span>{formatNaira(orphanage.raised)} / {formatNaira(orphanage.goal)}</span>
                              </div>
                              <div className="w-full bg-white/5 rounded-full h-2">
                                <motion.div
                                  className="bg-[var(--sr-customer)] h-2 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${orphanage.progress}%` }}
                                  transition={{ duration: 1, ease: 'easeOut' }}
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => handleDonateOrphanage(orphanage.id)}
                              className="w-full bg-[var(--sr-customer)]/10 text-[var(--sr-customer)] font-bold py-2.5 rounded-xl text-sm border border-[var(--sr-customer)]/20 hover:bg-[var(--sr-customer)]/20 transition-colors"
                            >
                              Donate
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Amount Selector (when donating to orphanage) */}
                    <AnimatePresence>
                      {showAmountSelector && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-4 mt-4 overflow-hidden"
                        >
                          <div className="bg-[#1A1D26] rounded-2xl p-3 sm:p-4 border border-[var(--sr-vendor)]/20">
                            <h4 className="text-white font-bold text-sm mb-3">Select Amount</h4>
                            <div className="flex gap-2 mb-3">
                              {donationAmounts.map(amt => (
                                <button
                                  key={amt}
                                  onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                                    selectedAmount === amt && !customAmount
                                      ? 'bg-[var(--sr-customer)] text-[#05070A]'
                                      : 'bg-white/5 text-white border border-white/10'
                                  }`}
                                >
                                  {formatNaira(amt)}
                                </button>
                              ))}
                            </div>
                            <input
                              type="number"
                              placeholder="Custom amount"
                              value={customAmount}
                              onChange={e => { setCustomAmount(e.target.value); }}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/60 focus:border-[var(--sr-customer)]/30 focus:outline-none mb-3"
                            />
                            <button
                              onClick={handleConfirmDonation}
                              className="w-full bg-[var(--sr-customer)] text-[#05070A] font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                            >
                              Confirm Donation
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Zakat Calculator */}
                    <div className="px-4 mt-6">
                      <div className="bg-[#1A1D26] rounded-2xl p-3 sm:p-4 border-2 border-[var(--sr-vendor)]/30 gold-glow">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="material-symbols-outlined text-[var(--sr-vendor)]">calculate</span>
                          <h3 className="text-[var(--sr-vendor)] font-bold text-base">Zakat Calculator</h3>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-white/65 text-[10px] uppercase tracking-widest mb-1 block">Annual Income</label>
                            <input
                              type="number"
                              placeholder="e.g. 5000000"
                              value={income}
                              onChange={e => setIncome(e.target.value)}
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:border-[var(--sr-vendor)]/30 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-white/65 text-[10px] uppercase tracking-widest mb-1 block">Savings & Assets</label>
                            <input
                              type="number"
                              placeholder="e.g. 2000000"
                              value={savings}
                              onChange={e => setSavings(e.target.value)}
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:border-[var(--sr-vendor)]/30 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-white/65 text-[10px] uppercase tracking-widest mb-1 block">Debts & Liabilities</label>
                            <input
                              type="number"
                              placeholder="e.g. 500000"
                              value={debts}
                              onChange={e => setDebts(e.target.value)}
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:border-[var(--sr-vendor)]/30 focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={handleCalculateZakat}
                            className="w-full gold-gradient text-[#05070A] font-bold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
                          >
                            Calculate Zakat
                          </button>
                          {zakatResult !== null && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-black/30 p-3 sm:p-4 rounded-xl border border-[var(--sr-vendor)]/20 text-center"
                            >
                              <p className="text-white/65 text-xs mb-1">Your Zakat (2.5% of net assets)</p>
                              <p className="text-[var(--sr-vendor)] text-2xl font-black">{formatNaira(Math.round(zakatResult))}</p>
                              {zakatResult > 0 && (
                                <button
                                  onClick={() => {
                                    setConfirmedAmount(Math.round(zakatResult));
                                    setConfirmedMeals(Math.floor(zakatResult / 2500));
                                    setHasanatPoints(hasanatPoints + Math.floor(zakatResult / 2500) * 50);
                                    setShowConfirmed(true);
                                  }}
                                  className="mt-3 bg-[var(--sr-vendor)]/10 text-[var(--sr-vendor)] font-bold py-2 px-6 rounded-xl text-xs border border-[var(--sr-vendor)]/20 hover:bg-[var(--sr-vendor)]/20 transition-colors"
                                >
                                  Pay Zakat Now
                                </button>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Charity Grid */}
                    <div className="px-4 mt-6 mb-6">
                      <h3 className="text-white font-bold text-base mb-3">Quick Charity</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {charityItems.map(item => (
                          <motion.button
                            key={item.id}
                            onClick={() => handleQuickCharity(item)}
                            whileTap={{ scale: 0.97 }}
                            className="bg-[#1A1D26] rounded-2xl p-3 sm:p-4 border border-white/5 text-left hover:border-[var(--sr-customer)]/20 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[var(--sr-vendor)] text-2xl mb-2">{item.icon}</span>
                            <p className="text-white font-bold text-sm">{item.name}</p>
                            <p className="text-white/65 text-[10px] mt-0.5">{item.description}</p>
                            {item.amount > 0 && (
                              <p className="text-[var(--sr-customer)] text-xs font-bold mt-2">{formatNaira(item.amount)}</p>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
