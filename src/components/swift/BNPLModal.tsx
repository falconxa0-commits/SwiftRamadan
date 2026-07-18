'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Sparkles, Calculator, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { bnplPlans, formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export default function BNPLModal() {
  const { activeModal, setActiveModal } = useAppStore();
  const { toast } = useToast();
  const isOpen = activeModal === 'bnpl';

  const [selectedPlan, setSelectedPlan] = useState<number>(bnplPlans[0].months);
  const [amount, setAmount] = useState<string>('30000');
  const [applied, setApplied] = useState(false);

  const numericAmount = parseFloat(amount) || 0;

  const currentPlan = bnplPlans.find(p => p.months === selectedPlan) || bnplPlans[0];

  const calculation = useMemo(() => {
    if (numericAmount <= 0 || !currentPlan) return null;
    const totalInterest = numericAmount * (currentPlan.interestRate / 100);
    const totalAmount = numericAmount + totalInterest;
    const monthlyPayment = totalAmount / currentPlan.months;
    return {
      totalInterest,
      totalAmount,
      monthlyPayment,
    };
  }, [numericAmount, currentPlan]);

  const handleApply = () => {
    if (!calculation || numericAmount <= 0) {
      toast({ title: 'Enter an amount', description: 'Please enter the purchase amount first' });
      return;
    }
    setApplied(true);
    toast({
      title: 'Application Submitted! 🎉',
      description: `${currentPlan.label} plan for ${formatNaira(numericAmount)} - ${formatNaira(Math.ceil(calculation.monthlyPayment))}/month`,
    });
    setTimeout(() => setApplied(false), 3000);
  };

  const handleClose = () => {
    setActiveModal(null);
    setApplied(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[90]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#05070A] overflow-y-auto custom-scrollbar"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 glass-effect border-b border-white/5">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#10E07A]/20 flex items-center justify-center border border-[#10E07A]/30">
                    <CreditCard className="w-5 h-5 text-[#10E07A]" />
                  </div>
                  <h2 className="text-white text-lg font-bold">Pay Small-Small</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-32">
              {/* Available Credit Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1D26] to-[#0F1117] border border-white/10 p-6 mt-4"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#10E07A]/10 blur-[60px]" />
                <div className="relative z-10">
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Available Credit</p>
                  <p className="text-[#10E07A] text-3xl font-black mt-1">{formatNaira(150000)}</p>
                  <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest">Balance Used</p>
                      <p className="text-white font-bold text-lg mt-0.5">{formatNaira(45000)}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest">Next Payment</p>
                      <p className="text-[#F5C451] font-bold text-lg mt-0.5">{formatNaira(15000)}</p>
                      <p className="text-white/30 text-[10px]">Due Apr 1</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Ramadan 0% Interest Banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-4 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4a1d6e]/40 to-[#05070A] border border-[#F5C451]/30 p-5"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#F5C451]/15 blur-[40px]" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#F5C451]/20 flex items-center justify-center border border-[#F5C451]/30 shrink-0">
                    <Sparkles className="w-6 h-6 text-[#F5C451]" />
                  </div>
                  <div>
                    <h3 className="text-[#F5C451] font-bold text-sm">Ramadan 0% Interest!</h3>
                    <p className="text-white/50 text-xs mt-0.5">Split payments for 2 months at absolutely zero interest this Ramadan</p>
                  </div>
                </div>
              </motion.div>

              {/* Plan Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6"
              >
                <h4 className="text-white font-bold text-sm mb-3">Choose Your Plan</h4>
                <div className="space-y-3">
                  {bnplPlans.map((plan, i) => {
                    const isSelected = selectedPlan === plan.months;
                    return (
                      <motion.button
                        key={plan.months}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.05 }}
                        onClick={() => setSelectedPlan(plan.months)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                          isSelected
                            ? 'bg-[#10E07A]/5 border-[#10E07A]/40'
                            : 'bg-[#1A1D26]/40 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                          isSelected
                            ? 'bg-[#10E07A]/20 border-[#10E07A]/30'
                            : 'bg-white/5 border-white/10'
                        }`}>
                          <CreditCard className={`w-5 h-5 ${isSelected ? 'text-[#10E07A]' : 'text-white/30'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-white/60'}`}>{plan.label}</p>
                            {plan.ramadanOffer && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#F5C451]/20 text-[#F5C451] border border-[#F5C451]/20">
                                Ramadan Deal
                              </span>
                            )}
                          </div>
                          <p className="text-white/40 text-xs mt-0.5">
                            {plan.interestRate === 0 ? 'No interest' : `${plan.interestRate}% interest`} • {plan.months} monthly payments
                          </p>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full bg-[#10E07A] flex items-center justify-center shrink-0"
                          >
                            <Check className="w-3.5 h-3.5 text-[#05070A]" strokeWidth={3} />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Calculator */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-6"
              >
                <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#10E07A]" />
                  Payment Calculator
                </h4>
                <div className="bg-[#1A1D26] rounded-2xl border border-white/5 p-5">
                  <div className="mb-4">
                    <label className="text-white/40 text-xs font-bold uppercase tracking-widest block mb-2">Purchase Amount</label>
                    <div className="flex items-center gap-2 bg-[#0F1117] rounded-xl border border-white/5 focus-within:border-[#10E07A]/30 transition-all px-4 py-3">
                      <span className="text-white/40 text-lg font-bold">₦</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="30000"
                        className="flex-1 bg-transparent text-white text-lg font-bold focus:outline-none placeholder:text-white/20"
                      />
                    </div>
                    {/* Quick amounts */}
                    <div className="flex gap-2 mt-3">
                      {[10000, 25000, 50000, 100000].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setAmount(String(amt))}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                            amount === String(amt)
                              ? 'bg-[#10E07A]/10 text-[#10E07A] border border-[#10E07A]/20'
                              : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                          }`}
                        >
                          {formatNaira(amt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Breakdown */}
                  {calculation && numericAmount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="border-t border-white/5 pt-4 mt-4 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-white/40 text-xs">Purchase Amount</span>
                        <span className="text-white font-bold text-sm">{formatNaira(numericAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/40 text-xs">Interest ({currentPlan.interestRate}%)</span>
                        <span className={`font-bold text-sm ${currentPlan.interestRate === 0 ? 'text-[#10E07A]' : 'text-[#F5C451]'}`}>
                          {currentPlan.interestRate === 0 ? 'FREE' : formatNaira(Math.ceil(calculation.totalInterest))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/40 text-xs">Total Amount</span>
                        <span className="text-white font-bold text-sm">{formatNaira(Math.ceil(calculation.totalAmount))}</span>
                      </div>
                      <div className="h-px bg-white/5" />
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm font-bold">Monthly Payment</span>
                        <span className="text-[#10E07A] text-xl font-black">{formatNaira(Math.ceil(calculation.monthlyPayment))}</span>
                      </div>
                      <p className="text-white/30 text-[10px] text-center">for {currentPlan.months} months</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Apply Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="mt-6 mb-4"
              >
                <button
                  onClick={handleApply}
                  disabled={applied}
                  className={`w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] ${
                    applied
                      ? 'bg-[#10E07A]/20 text-[#10E07A] border border-[#10E07A]/20'
                      : 'bg-[#10E07A] text-[#05070A] hover:bg-[#10E07A]/90'
                  }`}
                >
                  {applied ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Application Submitted
                    </span>
                  ) : (
                    'Apply for BNPL'
                  )}
                </button>
                <p className="text-white/20 text-[10px] text-center mt-2">
                  Subject to approval. No hidden fees. Cancel anytime.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
