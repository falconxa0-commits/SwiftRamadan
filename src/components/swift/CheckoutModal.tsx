'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, CreditCard, Check, ChevronRight, Truck, Bell, Sun, Moon, Edit3, Package, Minus, Plus, Trash2, ShoppingBag, PartyPopper } from 'lucide-react';
import { useAppStore, OrderItem } from '@/lib/store';
import { deliveryLocations, paymentMethods, bnplPlans, formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

const timeSlots = [
  { id: 'morning', label: 'Morning', time: '8:00 - 11:00 AM', icon: Sun },
  { id: 'afternoon', label: 'Afternoon', time: '12:00 - 3:00 PM', icon: Sun },
  { id: 'evening', label: 'Evening', time: '4:00 - 7:00 PM', icon: Moon },
  { id: 'night', label: 'Night', time: '8:00 - 10:00 PM', icon: Moon },
];

const stepLabels = ['Cart', 'Location', 'Schedule', 'Payment', 'Done'];

/* ─────────────── Confetti Particle ─────────────── */

function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const randomX = Math.random() * 300 - 150;
  const randomY = Math.random() * 400 + 100;
  const randomRotate = Math.random() * 720 - 360;
  const size = Math.random() * 8 + 4;

  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      animate={{ opacity: 0, x: randomX, y: randomY, rotate: randomRotate, scale: 0.3 }}
      transition={{ duration: 1.8, delay, ease: 'easeOut' }}
      className="absolute rounded-sm pointer-events-none"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: '50%',
        top: '30%',
      }}
    />
  );
}

export default function CheckoutModal() {
  const {
    activeModal, setActiveModal,
    cartItems, removeFromCart, updateQuantity, clearCart,
    checkoutStep, setCheckoutStep,
    deliveryAddress, setDeliveryAddress,
    deliveryInstructions, setDeliveryInstructions,
    iftarPrecision, setIftarPrecision,
    sahurAlarm, setSahurAlarm,
    paymentMethod, setPaymentMethod,
    setActiveTab,
    addOrder,
  } = useAppStore();
  const { toast } = useToast();
  const isOpen = activeModal === 'checkout';

  const [selectedTimeSlot, setSelectedTimeSlot] = useState('evening');
  const [selectedBnplPlan, setSelectedBnplPlan] = useState(2);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddressValue, setEditAddressValue] = useState(deliveryAddress);
  const [selectedLocation, setSelectedLocation] = useState(deliveryLocations[0]);
  const [orderId] = useState(() => `SWR-${Math.floor(1000 + Math.random() * 9000)}`);

  // Snapshot cart items for success step (before clearCart wipes them)
  const [placedCartItems, setPlacedCartItems] = useState<typeof cartItems>([]);
  const [placedTotal, setPlacedTotal] = useState(0);

  // Use deliveryAddress with fallback to first saved location
  const effectiveAddress = deliveryAddress || selectedLocation.address || deliveryLocations[0].address;

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal >= 5000 ? 0 : 500;
  const serviceFee = Math.round(subtotal * 0.02);
  const total = subtotal + deliveryFee + serviceFee;

  const currentStep = checkoutStep;

  const handleClose = () => {
    setActiveModal(null);
    setCheckoutStep(0);
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCheckoutStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCheckoutStep(currentStep - 1);
    }
  };

  const handlePlaceOrder = () => {
    // Snapshot cart before clearing
    const snapshotItems = [...cartItems];
    const snapshotTotal = total;

    // Create the order and add to store
    const order: OrderItem = {
      id: orderId,
      item: snapshotItems.length === 1 ? snapshotItems[0].name : `${snapshotItems[0].name} + ${snapshotItems.length - 1} more`,
      status: 'Preparing',
      eta: selectedTimeSlot === 'morning' ? '8:00 - 11:00 AM' :
           selectedTimeSlot === 'afternoon' ? '12:00 - 3:00 PM' :
           selectedTimeSlot === 'evening' ? '4:00 - 7:00 PM' : '8:00 - 10:00 PM',
      total: snapshotTotal,
      rider: null,
      items: snapshotItems.map(ci => ({ name: ci.name, qty: ci.quantity, price: ci.price })),
      progress: 15,
    };

    // Save snapshot for the success step display
    setPlacedCartItems(snapshotItems);
    setPlacedTotal(snapshotTotal);

    addOrder(order);
    clearCart();
    setCheckoutStep(4);

    toast({
      title: 'Order Placed! 🎉',
      description: `Your order ${orderId} is being prepared.`,
    });
  };

  const handleTrackOrder = () => {
    handleClose();
    setActiveTab('orders');
    toast({ title: 'Tracking Order 📦', description: 'Switching to your orders tab' });
  };

  const handleSaveAddress = () => {
    setDeliveryAddress(editAddressValue);
    setIsEditingAddress(false);
    toast({ title: 'Address Updated 📍', description: 'Delivery address saved' });
  };

  if (!isOpen) return null;

  return (
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
        {/* Header with Progress Stepper */}
        <div className="sticky top-0 z-10 glass-effect border-b border-white/5">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-white font-bold text-lg">Checkout</h2>
            <button
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Progress Stepper */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        i < currentStep
                          ? 'bg-[#13ec13] text-[#05070A]'
                          : i === currentStep
                            ? 'bg-[#13ec13]/20 border border-[#13ec13]/50 text-[#13ec13]'
                            : 'bg-white/5 text-white/20 border border-white/10'
                      }`}
                    >
                      {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-[10px] mt-1 font-bold ${
                      i <= currentStep ? 'text-white/70' : 'text-white/20'
                    }`}>
                      {label}
                    </span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded-full ${
                      i < currentStep ? 'bg-[#13ec13]' : 'bg-white/5'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="px-4 py-6 pb-40">
          <AnimatePresence mode="wait">

            {/* ─────────── Step 0: Cart Summary ─────────── */}
            {currentStep === 0 && (
              <motion.div
                key="cart"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <h3 className="text-white font-bold text-base flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#13ec13]" />
                  Your Cart
                  <span className="text-white/40 text-sm font-normal">({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</span>
                </h3>

                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <ShoppingBag className="w-16 h-16 text-white/10 mb-4" />
                    <p className="text-white/40 text-sm">Your cart is empty</p>
                    <button
                      onClick={handleClose}
                      className="mt-4 px-6 py-2.5 bg-[#13ec13] text-[#05070A] font-bold text-sm rounded-xl"
                    >
                      Browse Menu
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map(item => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="flex items-center gap-3 p-4 bg-[#1A1D26] rounded-2xl border border-white/5"
                      >
                        {/* Item image */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white/5">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-white/20" />
                            </div>
                          )}
                        </div>

                        {/* Item info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">{item.name}</p>
                          <p className="text-[#13ec13] font-bold text-sm">{formatNaira(item.price)}</p>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (item.quantity <= 1) {
                                removeFromCart(item.id);
                              } else {
                                updateQuantity(item.id, item.quantity - 1);
                              }
                            }}
                            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                          >
                            {item.quantity <= 1 ? (
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            ) : (
                              <Minus className="w-3.5 h-3.5 text-white/60" />
                            )}
                          </button>
                          <span className="text-white font-bold text-sm w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-white/60" />
                          </button>
                        </div>

                        {/* Line total */}
                        <div className="text-right shrink-0 ml-1">
                          <p className="text-white font-bold text-sm">{formatNaira(item.price * item.quantity)}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Cart Summary */}
                {cartItems.length > 0 && (
                  <div className="bg-[#1A1D26] rounded-2xl border border-white/5 p-4 space-y-3 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Subtotal</span>
                      <span className="text-white font-bold">{formatNaira(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Delivery Fee</span>
                      <span className={deliveryFee === 0 ? 'text-[#13ec13] font-bold' : 'text-white font-bold'}>
                        {deliveryFee === 0 ? 'FREE' : formatNaira(deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Service Fee</span>
                      <span className="text-white font-bold">{formatNaira(serviceFee)}</span>
                    </div>
                    {deliveryFee > 0 && (
                      <p className="text-[#13ec13]/60 text-[10px]">Free delivery on orders above ₦5,000</p>
                    )}
                    <div className="h-px bg-white/5" />
                    <div className="flex justify-between">
                      <span className="text-white font-bold text-sm">Total</span>
                      <span className="text-[#13ec13] font-black text-lg">{formatNaira(total)}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─────────── Step 1: Delivery Location ─────────── */}
            {currentStep === 1 && (
              <motion.div
                key="location"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#13ec13]" />
                    Delivery Address
                  </h3>

                  {/* Saved Locations */}
                  <div className="space-y-2">
                    {deliveryLocations.map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => { setSelectedLocation(loc); setDeliveryAddress(loc.address); }}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                          selectedLocation.id === loc.id
                            ? 'bg-[#13ec13]/5 border-[#13ec13]/30'
                            : 'bg-[#1A1D26] border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          selectedLocation.id === loc.id ? 'bg-[#13ec13]/20' : 'bg-white/5'
                        }`}>
                          <MapPin className={`w-5 h-5 ${selectedLocation.id === loc.id ? 'text-[#13ec13]' : 'text-white/30'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm">{loc.name}</p>
                          <p className="text-white/40 text-xs truncate">{loc.address}</p>
                        </div>
                        {selectedLocation.id === loc.id && (
                          <Check className="w-5 h-5 text-[#13ec13] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Edit Address */}
                  <div className="mt-3 flex items-center gap-4">
                    {isEditingAddress ? (
                      <div className="flex-1 bg-[#1A1D26] rounded-2xl p-4 border border-white/5 space-y-3">
                        <input
                          value={editAddressValue}
                          onChange={e => setEditAddressValue(e.target.value)}
                          className="w-full bg-[#0F1117] text-white text-sm rounded-xl p-3 border border-white/5 focus:border-[#13ec13]/30 focus:outline-none"
                          placeholder="Enter delivery address"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveAddress}
                            className="flex-1 bg-[#13ec13] text-[#05070A] font-bold py-2.5 rounded-xl text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setIsEditingAddress(false)}
                            className="px-4 bg-white/5 text-white/60 font-bold py-2.5 rounded-xl text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditAddressValue(effectiveAddress); setIsEditingAddress(true); }}
                          className="flex items-center gap-2 text-[#13ec13] text-xs font-bold hover:text-[#13ec13]/80 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit address
                        </button>
                        <button
                          onClick={() => setActiveModal('delivery-location')}
                          className="flex items-center gap-2 text-[#FFD700] text-xs font-bold hover:text-[#FFD700]/80 transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          Set on map
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Delivery Instructions */}
                <div>
                  <h4 className="text-white font-bold text-sm mb-2">Delivery Instructions</h4>
                  <input
                    value={deliveryInstructions}
                    onChange={e => setDeliveryInstructions(e.target.value)}
                    placeholder="e.g., Gate code, landmark, leave at door..."
                    className="w-full bg-[#1A1D26] text-white text-sm rounded-xl p-3 border border-white/5 focus:border-[#13ec13]/30 focus:outline-none placeholder:text-white/20"
                  />
                </div>
              </motion.div>
            )}

            {/* ─────────── Step 2: Schedule (iftarPrecision, sahurAlarm) ─────────── */}
            {currentStep === 2 && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Iftar Precision Toggle */}
                <div className="flex items-center justify-between p-4 bg-[#1A1D26] rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FFD700]/10 rounded-xl flex items-center justify-center">
                      <Sun className="w-5 h-5 text-[#FFD700]" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Iftar Precision</p>
                      <p className="text-white/40 text-xs">Deliver 15 min before Maghrib</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIftarPrecision(!iftarPrecision)}
                    className={`w-12 h-7 rounded-full transition-all relative ${
                      iftarPrecision ? 'bg-[#13ec13]' : 'bg-white/10'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                      iftarPrecision ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Sahur Alarm Toggle */}
                <div className="flex items-center justify-between p-4 bg-[#1A1D26] rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#13ec13]/10 rounded-xl flex items-center justify-center">
                      <Bell className="w-5 h-5 text-[#13ec13]" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Sahur Alarm</p>
                      <p className="text-white/40 text-xs">Wake-up reminder before Fajr</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSahurAlarm(!sahurAlarm)}
                    className={`w-12 h-7 rounded-full transition-all relative ${
                      sahurAlarm ? 'bg-[#13ec13]' : 'bg-white/10'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                      sahurAlarm ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Time Slot Selection */}
                <div>
                  <h3 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#13ec13]" />
                    Delivery Time Slot
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {timeSlots.map(slot => {
                      const Icon = slot.icon;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedTimeSlot(slot.id)}
                          className={`p-4 rounded-2xl border text-left transition-all relative ${
                            selectedTimeSlot === slot.id
                              ? 'bg-[#13ec13]/5 border-[#13ec13]/30'
                              : 'bg-[#1A1D26] border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className={`w-4 h-4 ${selectedTimeSlot === slot.id ? 'text-[#13ec13]' : 'text-white/30'}`} />
                            <span className={`font-bold text-sm ${selectedTimeSlot === slot.id ? 'text-[#13ec13]' : 'text-white'}`}>
                              {slot.label}
                            </span>
                          </div>
                          <p className="text-white/40 text-xs">{slot.time}</p>
                          {selectedTimeSlot === slot.id && (
                            <Check className="w-4 h-4 text-[#13ec13] absolute top-3 right-3" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Iftar Timing Option */}
                {iftarPrecision && (
                  <div className="bg-[#FFD700]/5 rounded-2xl border border-[#FFD700]/20 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Sun className="w-5 h-5 text-[#FFD700]" />
                      <span className="text-[#FFD700] font-bold text-sm">Iftar Delivery</span>
                    </div>
                    <p className="text-white/50 text-xs">
                      Your order will arrive 15 minutes before Maghrib (6:30 PM) so it&apos;s fresh for Iftar.
                    </p>
                  </div>
                )}

                {/* Sahur Timing Option */}
                {sahurAlarm && (
                  <div className="bg-[#13ec13]/5 rounded-2xl border border-[#13ec13]/20 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Moon className="w-5 h-5 text-[#13ec13]" />
                      <span className="text-[#13ec13] font-bold text-sm">Sahur Delivery</span>
                    </div>
                    <p className="text-white/50 text-xs">
                      Pre-dawn delivery between 3:00 - 4:30 AM so your Sahur meal is ready.
                    </p>
                  </div>
                )}

                {/* Address Summary */}
                <div className="bg-[#1A1D26] rounded-2xl border border-white/5 p-4">
                  <p className="text-white/40 text-xs mb-1">Delivering to</p>
                  <p className="text-white font-bold text-sm">{effectiveAddress}</p>
                </div>
              </motion.div>
            )}

            {/* ─────────── Step 3: Payment ─────────── */}
            {currentStep === 3 && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#13ec13]" />
                    Payment Method
                  </h3>
                  <div className="space-y-2">
                    {paymentMethods.map(pm => (
                      <button
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                          paymentMethod === pm.id
                            ? 'bg-[#13ec13]/5 border-[#13ec13]/30'
                            : 'bg-[#1A1D26] border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          paymentMethod === pm.id ? 'bg-[#13ec13]/20' : 'bg-white/5'
                        }`}>
                          <span className={`material-symbols-outlined text-lg ${
                            paymentMethod === pm.id ? 'text-[#13ec13]' : 'text-white/30'
                          }`}>{pm.icon}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-bold text-sm">{pm.name}</p>
                          {pm.providers.length > 0 && (
                            <p className="text-white/40 text-xs">{pm.providers.join(', ')}</p>
                          )}
                        </div>
                        {paymentMethod === pm.id && (
                          <Check className="w-5 h-5 text-[#13ec13] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BNPL Options */}
                {paymentMethod === 'bnpl' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <h4 className="text-white font-bold text-sm mb-3">Choose Plan</h4>
                    <div className="space-y-2">
                      {bnplPlans.map(plan => (
                        <button
                          key={plan.months}
                          onClick={() => setSelectedBnplPlan(plan.months)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                            selectedBnplPlan === plan.months
                              ? 'bg-[#FFD700]/5 border-[#FFD700]/30'
                              : 'bg-[#1A1D26] border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-bold text-sm">{plan.label}</p>
                              {plan.ramadanOffer && (
                                <span className="bg-[#13ec13]/10 text-[#13ec13] text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#13ec13]/20">
                                  0% RAMADAN
                                </span>
                              )}
                            </div>
                            <p className="text-white/40 text-xs">
                              {plan.interestRate}% interest &bull; {formatNaira(Math.round(total / plan.months))}/mo
                            </p>
                          </div>
                          {selectedBnplPlan === plan.months && (
                            <Check className="w-5 h-5 text-[#FFD700] shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Order Summary */}
                <div>
                  <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#FFD700]" />
                    Order Summary
                  </h4>
                  <div className="bg-[#1A1D26] rounded-2xl border border-white/5 p-4 space-y-3">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate pr-2">{item.name} x{item.quantity}</p>
                        </div>
                        <span className="text-white/50 text-xs font-bold">{formatNaira(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="h-px bg-white/5" />
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Subtotal</span>
                      <span className="text-white font-bold">{formatNaira(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Delivery Fee</span>
                      <span className={deliveryFee === 0 ? 'text-[#13ec13] font-bold' : 'text-white font-bold'}>
                        {deliveryFee === 0 ? 'FREE' : formatNaira(deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Service Fee</span>
                      <span className="text-white font-bold">{formatNaira(serviceFee)}</span>
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="flex justify-between">
                      <span className="text-white font-bold text-sm">Total</span>
                      <span className="text-[#13ec13] font-black text-lg">{formatNaira(total)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─────────── Step 4: Success ─────────── */}
            {currentStep === 4 && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative flex flex-col items-center text-center py-8 space-y-6 overflow-hidden"
              >
                {/* Confetti */}
                {['#13ec13', '#FFD700', '#3b82f6', '#ffffff', '#f472b6', '#06b6d4'].map((color, i) => (
                  <ConfettiParticle key={i} delay={i * 0.08} color={color} />
                ))}

                {/* Success Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.2 }}
                  className="w-24 h-24 bg-[#13ec13]/20 rounded-full flex items-center justify-center border border-[#13ec13]/30 green-glow"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring', damping: 10 }}
                  >
                    <PartyPopper className="w-12 h-12 text-[#13ec13]" />
                  </motion.div>
                </motion.div>

                <div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-white text-2xl font-black mb-2"
                  >
                    Order Placed! 🎉
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-white/50 text-sm"
                  >
                    Your Ramadan order is being prepared
                  </motion.p>
                </div>

                {/* Order Details */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="w-full bg-[#1A1D26] rounded-2xl border border-white/5 p-5 space-y-3 text-left"
                >
                  <div className="flex justify-between">
                    <span className="text-white/40 text-xs">Order Number</span>
                    <span className="text-white font-bold text-xs font-mono">{orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40 text-xs">Estimated Delivery</span>
                    <span className="text-[#13ec13] font-bold text-xs">
                      {selectedTimeSlot === 'morning' ? '8:00 - 11:00 AM' :
                       selectedTimeSlot === 'afternoon' ? '12:00 - 3:00 PM' :
                       selectedTimeSlot === 'evening' ? '4:00 - 7:00 PM' : '8:00 - 10:00 PM'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40 text-xs">Items</span>
                    <span className="text-white font-bold text-xs">{placedCartItems.length} item{placedCartItems.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40 text-xs">Total</span>
                    <span className="text-[#13ec13] font-black text-sm">{formatNaira(placedTotal)}</span>
                  </div>
                  {iftarPrecision && (
                    <div className="flex items-center gap-2 bg-[#FFD700]/5 rounded-lg px-3 py-2 border border-[#FFD700]/10">
                      <Sun className="w-3.5 h-3.5 text-[#FFD700]" />
                      <span className="text-[#FFD700] text-[10px] font-bold">Iftar Precision enabled - delivery before Maghrib</span>
                    </div>
                  )}
                  {sahurAlarm && (
                    <div className="flex items-center gap-2 bg-[#13ec13]/5 rounded-lg px-3 py-2 border border-[#13ec13]/10">
                      <Bell className="w-3.5 h-3.5 text-[#13ec13]" />
                      <span className="text-[#13ec13] text-[10px] font-bold">Sahur alarm set - you&apos;ll be reminded before Fajr</span>
                    </div>
                  )}
                </motion.div>

                {/* Track Order Button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  onClick={handleTrackOrder}
                  className="w-full bg-[#13ec13] text-[#05070A] font-black py-4 rounded-2xl text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-[#13ec13]/20"
                >
                  <Truck className="w-5 h-5" />
                  Track Order
                  <ChevronRight className="w-4 h-4" />
                </motion.button>

                <button
                  onClick={handleClose}
                  className="text-white/40 text-sm font-bold hover:text-white/60 transition-colors"
                >
                  Continue Shopping
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation Buttons */}
        {currentStep < 4 && (
          <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#05070A] border-t border-white/5 px-4 py-4 space-y-3">
            {/* Order Total Bar */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/40 text-[10px] uppercase">Total</p>
                <p className="text-[#13ec13] font-black text-lg">{formatNaira(total)}</p>
              </div>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-colors"
                  >
                    Back
                  </button>
                )}
                {currentStep < 3 ? (
                  <button
                    onClick={handleNext}
                    disabled={currentStep === 0 && cartItems.length === 0}
                    className="px-8 py-3 rounded-xl bg-[#13ec13] text-[#05070A] font-bold text-sm hover:bg-[#13ec13]/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    className="px-8 py-3 rounded-xl bg-[#13ec13] text-[#05070A] font-black text-sm hover:bg-[#13ec13]/90 active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-[#13ec13]/20"
                  >
                    Place Order
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}
