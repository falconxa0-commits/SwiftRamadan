'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight, Gift, Heart, Send,
  Check, Sparkles, MessageSquare, User, CreditCard
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  giftCardTemplates,
  giftCardMoods,
  giftCardBlessings,
  giftCardAmountPresets,
  paymentMethods,
  formatNaira,
} from '@/lib/data';

const themeMap: Record<string, string> = {
  'Crescent Grace': 'crescent-grace',
  'Midnight over Abuja': 'midnight-abuja',
  'Traditional Lanterns': 'traditional-lanterns',
  'Royal Gold': 'royal-gold',
  'Emerald Heritage': 'emerald-heritage',
  'Marble Elegance': 'marble-elegance',
};

const reverseThemeMap: Record<string, string> = Object.fromEntries(
  Object.entries(themeMap).map(([k, v]) => [v, k])
);

export default function GiftCardModal() {
  const {
    activeModal, setActiveModal,
    giftCardStep, setGiftCardStep,
    giftCardTheme, setGiftCardTheme,
    giftCardAmount, setGiftCardAmount,
    giftCardRecipient, setGiftCardRecipient,
    giftCardMessage, setGiftCardMessage,
    giftCardDeliveryMethod, setGiftCardDeliveryMethod,
    giftCardMood, setGiftCardMood,
    resetGiftCard,
    userName,
    addOrder,
  } = useAppStore();

  const isOpen = activeModal === 'giftcard';
  const [customAmount, setCustomAmount] = useState('');
  const [charityOptIn, setCharityOptIn] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [selectedBlessing, setSelectedBlessing] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClose = () => {
    setActiveModal(null);
    resetGiftCard();
    setShowSuccess(false);
    setCustomAmount('');
    setCharityOptIn(false);
    setSelectedPayment('card');
    setSelectedBlessing(0);
  };

  const handleNext = () => {
    if (giftCardStep < 2) setGiftCardStep(giftCardStep + 1);
  };

  const handleBack = () => {
    if (giftCardStep > 0) setGiftCardStep(giftCardStep - 1);
  };

  const handleSelectTheme = (templateName: string) => {
    setGiftCardTheme(themeMap[templateName] || templateName.toLowerCase().replace(/\s+/g, '-'));
  };

  const handleAmountPreset = (amount: number) => {
    setGiftCardAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmount = () => {
    const val = parseInt(customAmount);
    if (val > 0) {
      setGiftCardAmount(val);
    }
  };

  const handleBlessing = (idx: number) => {
    setSelectedBlessing(idx);
    setGiftCardMessage(giftCardBlessings[idx]);
  };

  const handleConfirm = () => {
    setShowSuccess(true);
    const orderId = `SWR-${Math.floor(1000 + Math.random() * 9000)}`;
    addOrder({
      id: orderId,
      item: `Gift Card - ${formatNaira(giftCardAmount)}`,
      status: 'Sent',
      eta: `To ${giftCardRecipient}`,
      total: giftCardAmount + 500,
      rider: null,
      items: [{ name: `Gift Card (${reverseThemeMap[giftCardTheme] || giftCardTheme})`, qty: 1, price: giftCardAmount }],
      progress: 100,
    });
    setTimeout(() => {
      handleClose();
    }, 2500);
  };

  const deliveryFee = 500;
  const charityAmount = charityOptIn ? Math.round(giftCardAmount * 0.1) : 0;
  const totalAmount = giftCardAmount + deliveryFee + charityAmount;

  const currentThemeTemplate = giftCardTemplates.find(
    (t) => themeMap[t.name] === giftCardTheme
  ) || giftCardTemplates[0];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-[#05070A]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button
            onClick={giftCardStep > 0 && !showSuccess ? handleBack : handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10"
            aria-label={giftCardStep > 0 && !showSuccess ? 'Go back' : 'Close'}
          >
            {giftCardStep > 0 && !showSuccess ? (
              <ChevronLeft className="w-5 h-5 text-white" />
            ) : (
              <X className="w-5 h-5 text-white" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#FFD700]" />
            <h2 className="text-white font-bold text-lg">Gift Card</h2>
          </div>
          <div className="w-10" />
        </div>

        {/* Step Indicators */}
        {!showSuccess && (
          <div className="flex items-center justify-center gap-3 py-3">
            {[0, 1, 2].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step === giftCardStep
                      ? 'bg-[#13ec13] text-[#05070A]'
                      : step < giftCardStep
                      ? 'bg-[#13ec13]/30 text-[#13ec13]'
                      : 'bg-white/5 text-white/30 border border-white/10'
                  }`}
                >
                  {step < giftCardStep ? <Check className="w-4 h-4" /> : step + 1}
                </div>
                {step < 2 && (
                  <div className={`w-8 h-0.5 rounded ${step < giftCardStep ? 'bg-[#13ec13]' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-24" style={{ height: 'calc(100vh - 120px)' }}>
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-24 h-24 rounded-full bg-[#13ec13]/20 flex items-center justify-center mb-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
                  >
                    <Check className="w-12 h-12 text-[#13ec13]" />
                  </motion.div>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white text-2xl font-black mb-2"
                >
                  Gift Card Sent! 🎁
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/50 text-sm text-center"
                >
                  Your {formatNaira(giftCardAmount)} gift card has been sent to {giftCardRecipient} via {giftCardDeliveryMethod === 'whatsapp' ? 'WhatsApp' : 'Email'}
                </motion.p>
                {charityOptIn && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-[#FFD700] text-sm mt-2"
                  >
                    🤲 {formatNaira(charityAmount)} donated to charity
                  </motion.p>
                )}
              </motion.div>
            ) : giftCardStep === 0 ? (
              <motion.div
                key="design"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Theme Selection */}
                <h3 className="text-white font-bold text-sm mb-3 mt-2">Choose a Theme</h3>
                <div className="grid grid-cols-2 gap-3">
                  {giftCardTemplates.map((template) => {
                    const isSelected = themeMap[template.name] === giftCardTheme;
                    return (
                      <button
                        key={template.id}
                        onClick={() => handleSelectTheme(template.name)}
                        className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                          isSelected ? 'border-[#13ec13] shadow-lg shadow-[#13ec13]/20' : 'border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div
                          className={`bg-gradient-to-br ${template.color} h-28 flex items-center justify-center`}
                        >
                          <span className="material-symbols-outlined text-4xl text-white/40">
                            {template.icon}
                          </span>
                        </div>
                        <div className="px-3 py-2 bg-[#1A1D26]">
                          <p className="text-white text-xs font-bold truncate">{template.name}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#13ec13] flex items-center justify-center">
                            <Check className="w-3 h-3 text-[#05070A]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Amount Presets */}
                <h3 className="text-white font-bold text-sm mb-3 mt-6">Select Amount</h3>
                <div className="flex flex-wrap gap-2">
                  {giftCardAmountPresets.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleAmountPreset(amount)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                        giftCardAmount === amount && !customAmount
                          ? 'bg-[#13ec13] text-[#05070A]'
                          : 'bg-white/5 text-white border border-white/10 hover:border-[#13ec13]/30'
                      }`}
                    >
                      {formatNaira(amount)}
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div className="mt-4 flex gap-2">
                  <div className="flex-1 flex items-center bg-[#1A1D26] rounded-xl border border-white/10 px-3">
                    <span className="text-white/30 text-sm">₦</span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        const val = parseInt(e.target.value);
                        if (val > 0) setGiftCardAmount(val);
                      }}
                      placeholder="Custom amount"
                      className="flex-1 bg-transparent text-white text-sm py-3 px-2 focus:outline-none placeholder:text-white/30"
                    />
                  </div>
                  <button
                    onClick={handleCustomAmount}
                    className="bg-[#13ec13]/10 border border-[#13ec13]/20 text-[#13ec13] px-4 rounded-xl font-bold text-sm hover:bg-[#13ec13]/20 transition-colors"
                  >
                    Set
                  </button>
                </div>

                {/* Blessing Selection */}
                <h3 className="text-white font-bold text-sm mb-3 mt-6">Choose a Blessing</h3>
                <div className="space-y-2">
                  {giftCardBlessings.map((blessing, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleBlessing(idx)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                        selectedBlessing === idx
                          ? 'bg-[#13ec13]/10 border-[#13ec13]/30 text-white'
                          : 'bg-[#1A1D26] border-white/5 text-white/70 hover:border-white/10'
                      }`}
                    >
                      <p className="text-xs leading-relaxed">{blessing}</p>
                    </button>
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  className="w-full mt-6 bg-[#13ec13] py-4 rounded-2xl text-[#05070A] font-black text-sm uppercase tracking-widest shadow-lg shadow-[#13ec13]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : giftCardStep === 1 ? (
              <motion.div
                key="personalize"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Recipient Name */}
                <h3 className="text-white font-bold text-sm mb-3 mt-2">Recipient Name</h3>
                <div className="flex items-center bg-[#1A1D26] rounded-xl border border-white/10 px-3">
                  <User className="w-4 h-4 text-white/30 shrink-0" />
                  <input
                    type="text"
                    value={giftCardRecipient}
                    onChange={(e) => setGiftCardRecipient(e.target.value)}
                    placeholder="Who is this gift for?"
                    className="flex-1 bg-transparent text-white text-sm py-3 px-2 focus:outline-none placeholder:text-white/30"
                  />
                </div>

                {/* From Field */}
                <h3 className="text-white font-bold text-sm mb-3 mt-5">From</h3>
                <div className="flex items-center bg-[#1A1D26] rounded-xl border border-white/10 px-3">
                  <User className="w-4 h-4 text-white/30 shrink-0" />
                  <input
                    type="text"
                    value={userName}
                    readOnly
                    className="flex-1 bg-transparent text-white/50 text-sm py-3 px-2 focus:outline-none"
                  />
                </div>

                {/* Message */}
                <h3 className="text-white font-bold text-sm mb-3 mt-5">
                  Message{' '}
                  <span className="text-white/30 font-normal">
                    ({giftCardMessage.length}/200)
                  </span>
                </h3>
                <div className="bg-[#1A1D26] rounded-xl border border-white/10 p-3">
                  <textarea
                    value={giftCardMessage}
                    onChange={(e) => {
                      if (e.target.value.length <= 200) setGiftCardMessage(e.target.value);
                    }}
                    placeholder="Write a heartfelt message..."
                    rows={3}
                    className="w-full bg-transparent text-white text-sm focus:outline-none placeholder:text-white/30 resize-none"
                  />
                </div>

                {/* Mood Selector */}
                <h3 className="text-white font-bold text-sm mb-3 mt-5">Mood</h3>
                <div className="flex gap-2">
                  {giftCardMoods.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => setGiftCardMood(mood.id)}
                      className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        giftCardMood === mood.id
                          ? 'bg-[#13ec13]/10 border-[#13ec13]/30'
                          : 'bg-[#1A1D26] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl text-white/60">
                        {mood.icon}
                      </span>
                      <span className={`text-xs font-bold ${giftCardMood === mood.id ? 'text-[#13ec13]' : 'text-white/50'}`}>
                        {mood.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Delivery Method */}
                <h3 className="text-white font-bold text-sm mb-3 mt-5">Delivery Method</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGiftCardDeliveryMethod('whatsapp')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-200 ${
                      giftCardDeliveryMethod === 'whatsapp'
                        ? 'bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366]'
                        : 'bg-[#1A1D26] border-white/5 text-white/50 hover:border-white/10'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-bold">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => setGiftCardDeliveryMethod('email')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-200 ${
                      giftCardDeliveryMethod === 'email'
                        ? 'bg-[#13ec13]/10 border-[#13ec13]/30 text-[#13ec13]'
                        : 'bg-[#1A1D26] border-white/5 text-white/50 hover:border-white/10'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span className="text-sm font-bold">Email</span>
                  </button>
                </div>

                {/* Live Preview Card */}
                <h3 className="text-white font-bold text-sm mb-3 mt-6">Preview</h3>
                <div className="rounded-2xl overflow-hidden border border-white/10">
                  <div className={`bg-gradient-to-br ${currentThemeTemplate.color} p-6 relative`}>
                    <div className="absolute top-3 right-3">
                      <Gift className="w-6 h-6 text-white/20" />
                    </div>
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1">SwiftRamadan Gift Card</p>
                    <p className="text-white text-3xl font-black">{formatNaira(giftCardAmount)}</p>
                    {giftCardRecipient && (
                      <p className="text-white/80 text-sm mt-2">To: {giftCardRecipient}</p>
                    )}
                    <p className="text-white/40 text-xs mt-1">From: {userName}</p>
                  </div>
                  <div className="bg-[#1A1D26] p-4">
                    {giftCardMessage && (
                      <p className="text-white/60 text-xs italic leading-relaxed">&ldquo;{giftCardMessage}&rdquo;</p>
                    )}
                  </div>
                </div>

                {/* Proceed Button */}
                <button
                  onClick={handleNext}
                  disabled={!giftCardRecipient.trim()}
                  className="w-full mt-6 bg-[#13ec13] py-4 rounded-2xl text-[#05070A] font-black text-sm uppercase tracking-widest shadow-lg shadow-[#13ec13]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Proceed to Review
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Full Card Preview */}
                <div className="rounded-2xl overflow-hidden border border-white/10 mt-2">
                  <div className={`bg-gradient-to-br ${currentThemeTemplate.color} p-8 relative`}>
                    <div className="absolute top-4 right-4">
                      <Gift className="w-8 h-8 text-white/20" />
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-[#FFD700]" />
                      <span className="text-white/50 text-xs uppercase tracking-widest">SwiftRamadan Gift Card</span>
                    </div>
                    <p className="text-white text-4xl font-black">{formatNaira(giftCardAmount)}</p>
                    <div className="mt-4 space-y-1">
                      <p className="text-white/80 text-sm">
                        <span className="text-white/40">To:</span> {giftCardRecipient || 'Recipient'}
                      </p>
                      <p className="text-white/60 text-xs">
                        <span className="text-white/40">From:</span> {userName}
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#1A1D26] p-5 space-y-3">
                    {giftCardMessage && (
                      <div className="flex gap-2">
                        <MessageSquare className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />
                        <p className="text-white/60 text-xs italic leading-relaxed">&ldquo;{giftCardMessage}&rdquo;</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <Send className="w-3 h-3" />
                      <span>Via {giftCardDeliveryMethod === 'whatsapp' ? 'WhatsApp' : 'Email'}</span>
                      <span className="mx-1">•</span>
                      <Heart className="w-3 h-3" />
                      <span>{giftCardMoods.find((m) => m.id === giftCardMood)?.name || 'Formal'} mood</span>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-[#1A1D26] rounded-2xl p-5 border border-white/5 mt-4 space-y-3">
                  <h3 className="text-white font-bold text-sm mb-2">Order Summary</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Gift Card Amount</span>
                    <span className="text-white font-bold">{formatNaira(giftCardAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Delivery Fee</span>
                    <span className="text-white font-bold">{formatNaira(deliveryFee)}</span>
                  </div>
                  {charityOptIn && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#FFD700]">Charity Donation (10%)</span>
                      <span className="text-[#FFD700] font-bold">{formatNaira(charityAmount)}</span>
                    </div>
                  )}
                  <div className="h-px bg-white/5 my-1" />
                  <div className="flex justify-between">
                    <span className="text-white font-bold">Total</span>
                    <span className="text-[#13ec13] font-black text-lg">{formatNaira(totalAmount)}</span>
                  </div>
                </div>

                {/* Charity Opt-in */}
                <button
                  onClick={() => setCharityOptIn(!charityOptIn)}
                  className="w-full mt-4 p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 text-left"
                  style={{
                    borderColor: charityOptIn ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.05)',
                    background: charityOptIn ? 'rgba(255,215,0,0.05)' : '#1A1D26',
                  }}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      charityOptIn ? 'bg-[#FFD700] border-[#FFD700]' : 'border-white/20'
                    }`}
                  >
                    {charityOptIn && <Check className="w-3 h-3 text-[#05070A]" />}
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">Donate 10% to Charity 🤲</p>
                    <p className="text-white/40 text-xs">{formatNaira(charityOptIn ? charityAmount : Math.round(giftCardAmount * 0.1))} will feed the fasting</p>
                  </div>
                </button>

                {/* Payment Method */}
                <h3 className="text-white font-bold text-sm mb-3 mt-5">Payment Method</h3>
                <div className="space-y-2">
                  {paymentMethods.filter(m => m.id !== 'bnpl').map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                        selectedPayment === method.id
                          ? 'bg-[#13ec13]/10 border-[#13ec13]/30'
                          : 'bg-[#1A1D26] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg text-white/50">
                        {method.icon}
                      </span>
                      <span className={`text-sm font-bold ${selectedPayment === method.id ? 'text-[#13ec13]' : 'text-white/70'}`}>
                        {method.name}
                      </span>
                      {selectedPayment === method.id && (
                        <Check className="w-4 h-4 text-[#13ec13] ml-auto" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Confirm Button */}
                <button
                  onClick={handleConfirm}
                  className="w-full mt-6 mb-4 bg-[#13ec13] py-4 rounded-2xl text-[#05070A] font-black text-sm uppercase tracking-widest shadow-lg shadow-[#13ec13]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <Send className="w-4 h-4" />
                  Confirm & Send &bull; {formatNaira(totalAmount)}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
