'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, CreditCard, Check, ChevronRight, Truck, Bell, Sun, Moon, Edit3, Package, Minus, Plus, Trash2, ShoppingBag, PartyPopper, Loader2, Tag, Home, Briefcase, Plus as PlusIcon } from 'lucide-react';
import { OrderItem } from '@/lib/store';
import { useAppStore, useNavigation, useCart, useCheckout, useOrders } from '@/lib/store-selectors';
import { deliveryLocations, paymentMethods, bnplPlans, formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { track } from '@/lib/analytics';
import { triggerOrderCelebration } from './OrderCelebration';

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  area: string;
  city: string;
  instructions: string;
  isDefault: boolean;
}

type CouponState = 'idle' | 'applying' | 'applied' | 'error';

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
  const { activeModal, setActiveModal, setActiveTab } = useNavigation();
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const {
    checkoutStep,
    setCheckoutStep,
    deliveryAddress,
    setDeliveryAddress,
    deliveryInstructions,
    setDeliveryInstructions,
    iftarPrecision,
    setIftarPrecision,
    sahurAlarm,
    setSahurAlarm,
    paymentMethod,
    setPaymentMethod,
  } = useCheckout();
  const { addOrder } = useOrders();
  const { toast } = useToast();
  const isOpen = activeModal === 'checkout';

  const [selectedTimeSlot, setSelectedTimeSlot] = useState('evening');
  const [selectedBnplPlan, setSelectedBnplPlan] = useState(2);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddressValue, setEditAddressValue] = useState(deliveryAddress);
  const [selectedLocation, setSelectedLocation] = useState(deliveryLocations[0]);
  const [orderId, setOrderId] = useState(() => `SWR-${Math.floor(1000 + Math.random() * 9000)}`);
  const [placing, setPlacing] = useState(false);

  // Snapshot cart items for success step (before clearCart wipes them)
  const [placedCartItems, setPlacedCartItems] = useState<typeof cartItems>([]);
  const [placedTotal, setPlacedTotal] = useState(0);

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [fetchingAddresses, setFetchingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('Home');
  const [newAddrText, setNewAddrText] = useState('');
  const [newAddrArea, setNewAddrArea] = useState('');
  const [newAddrInstructions, setNewAddrInstructions] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponState, setCouponState] = useState<CouponState>('idle');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState('');

  // Payment reference (created after /api/payments POST)
  const [paymentReference, setPaymentReference] = useState<string | null>(null);

  const currentUserEmail = useAppStore.getState().userEmail || 'guest';

  // Fetch saved addresses when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    // Analytics: track checkout initiation
    track('checkout_start', { itemCount: cartItems.length, total: total || grossTotal });
    const fetchAddresses = async () => {
      setFetchingAddresses(true);
      try {
        const res = await fetch(`/api/addresses?userId=${encodeURIComponent(currentUserEmail)}`);
        const data = await res.json();
        if (cancelled) return;
        const addrs: SavedAddress[] = Array.isArray(data.addresses) ? data.addresses : [];
        setSavedAddresses(addrs);
        // Auto-select the default address (or the first one)
        const def = addrs.find(a => a.isDefault) || addrs[0];
        if (def) {
          setSelectedAddressId(def.id);
          setDeliveryAddress(def.address);
        }
      } catch {
        if (!cancelled) setSavedAddresses([]);
      } finally {
        if (!cancelled) setFetchingAddresses(false);
      }
    };
    fetchAddresses();
    return () => { cancelled = true; };
  }, [isOpen, currentUserEmail]);

  // Use deliveryAddress with fallback to first saved location
  const effectiveAddress = deliveryAddress || selectedLocation.address || deliveryLocations[0].address;

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal >= 5000 ? 0 : 500;
  const serviceFee = Math.round(subtotal * 0.02);
  const grossTotal = subtotal + deliveryFee + serviceFee;
  const discount = couponState === 'applied' ? couponDiscount : 0;
  const total = Math.max(0, grossTotal - discount);

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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || couponState === 'applying') return;
    setCouponState('applying');
    setCouponMessage('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), cartTotal: grossTotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponState('applied');
        setCouponDiscount(data.discount || 0);
        setCouponMessage(data.message || `Coupon applied — you saved ${formatNaira(data.discount || 0)}`);
        setAppliedCouponCode(data.code || couponCode.trim().toUpperCase());
        track('coupon_apply', { code: data.code || couponCode.trim().toUpperCase(), discount: data.discount || 0 });
        toast({ title: 'Coupon Applied! 🎉', description: data.message });
      } else {
        setCouponState('error');
        setCouponMessage(data.message || 'Invalid coupon code');
        setCouponDiscount(0);
        setAppliedCouponCode('');
      }
    } catch {
      setCouponState('error');
      setCouponMessage('Failed to validate coupon — try again');
      setCouponDiscount(0);
      setAppliedCouponCode('');
    }
  };

  const handleRemoveCoupon = () => {
    setCouponState('idle');
    setCouponCode('');
    setCouponDiscount(0);
    setCouponMessage('');
    setAppliedCouponCode('');
  };

  const handleSaveNewAddress = async () => {
    if (!newAddrText.trim() || savingAddress) return;
    setSavingAddress(true);
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserEmail,
          label: newAddrLabel || 'Home',
          address: newAddrText,
          area: newAddrArea,
          city: 'Lagos',
          instructions: newAddrInstructions,
          isDefault: savedAddresses.length === 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Refetch addresses
        const refetch = await fetch(`/api/addresses?userId=${encodeURIComponent(currentUserEmail)}`);
        const refetchData = await refetch.json();
        const addrs: SavedAddress[] = Array.isArray(refetchData.addresses) ? refetchData.addresses : [];
        setSavedAddresses(addrs);
        const newAddr = addrs.find(a => a.address === newAddrText);
        if (newAddr) {
          setSelectedAddressId(newAddr.id);
          setDeliveryAddress(newAddr.address);
        }
        setShowAddAddressForm(false);
        setNewAddrText('');
        setNewAddrArea('');
        setNewAddrInstructions('');
        setNewAddrLabel('Home');
        toast({ title: 'Address Saved 📍', description: 'New delivery address added' });
      } else {
        toast({ title: 'Could not save address', description: data.message || 'Please log in to save addresses', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Could not save address', description: 'Network error — please try again', variant: 'destructive' });
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setDeliveryAddress(addr.address);
    if (addr.instructions) setDeliveryInstructions(addr.instructions);
  };

  const handlePlaceOrder = async () => {
    if (placing) return;
    setPlacing(true);
    // Snapshot cart before clearing
    const snapshotItems = [...cartItems];
    const snapshotTotal = total;
    const snapshotDiscount = discount;

    // Create the order object
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

    let dbOrderId: string | null = null;

    // Persist to database via API (so it survives refresh)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: order.status,
          total: order.total,
          riderName: order.rider,
          progress: order.progress,
          items: order.items,
          userId: currentUserEmail,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Use the DB-generated order id if available (format to SWR-XXXXXX)
        if (data.order?.id) {
          dbOrderId = data.order.id;
          const shortId = `SWR-${data.order.id.replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase()}`;
          order.id = shortId;
          setOrderId(shortId);
        }
      }
    } catch (e) {
      // Non-blocking: order still added to local store
    }

    // Create a payment record via /api/payments
    try {
      const payRes = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: dbOrderId || undefined,
          userId: currentUserEmail,
          amount: snapshotTotal,
          method: paymentMethod || 'card',
          reference: `SWR-PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        }),
      });
      if (payRes.ok) {
        const payData = await payRes.json();
        if (payData.payment?.reference) {
          setPaymentReference(payData.payment.reference);
        }
      }
    } catch (e) {
      // Non-blocking: payment record not critical for checkout flow
    }

    addOrder(order);
    clearCart();
    setCheckoutStep(4);
    setPlacing(false);

    // Trigger premium canvas-confetti celebration
    setTimeout(() => triggerOrderCelebration(), 300);

    track('order_placed', { orderId: order.id, total: snapshotTotal, items: snapshotItems.length, paymentMethod });
    track('checkout_complete', { orderId: order.id, total: snapshotTotal, paymentMethod });

    toast({
      title: 'Order Placed! 🎉',
      description: `Your order ${order.id} is being prepared.${snapshotDiscount > 0 ? ` You saved ${formatNaira(snapshotDiscount)}!` : ''}`,
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
        className="fixed inset-0 z-[100] bg-[var(--sr-surface-base)] overflow-y-auto custom-scrollbar"
      >
        {/* Header with Progress Stepper */}
        <div className="sticky top-0 z-10 glass-effect border-b border-white/5">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <h2 className="text-white font-bold text-lg auren-gradient-text">Checkout</h2>
            <button
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Progress Stepper */}
          <div className="px-4 pb-4 auren-progress">
            <div className="flex items-center justify-between">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        i < currentStep
                          ? 'bg-[var(--sr-customer)] text-[var(--sr-surface-base)]'
                          : i === currentStep
                            ? 'bg-[var(--sr-customer)]/20 border border-[var(--sr-customer)]/50 text-[var(--sr-customer)]'
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
                    <div className={`flex-1 h-0.5 mx-2 rounded-full auren-progress-fill ${
                      i < currentStep ? 'bg-[var(--sr-customer)]' : 'bg-white/5'
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
                  <ShoppingBag className="w-5 h-5 text-[var(--sr-customer)]" />
                  Your Cart
                  <span className="text-white/65 text-sm font-normal">({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</span>
                </h3>
                <div className="auren-accent-line" />

                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <ShoppingBag className="w-16 h-16 text-white/10 mb-4" />
                    <p className="text-white/65 text-sm">Your cart is empty</p>
                    <button
                      onClick={handleClose}
                      className="mt-4 px-6 py-2.5 bg-[var(--sr-customer)] text-[var(--sr-surface-base)] font-bold text-sm rounded-xl"
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
                        className="flex items-center gap-3 p-3 sm:p-4 bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5"
                      >
                        {/* Item image */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white/5 relative">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-white/20" />
                            </div>
                          )}
                        </div>

                        {/* Item info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">{item.name}</p>
                          <p className="text-[var(--sr-customer)] font-bold text-sm">{formatNaira(item.price)}</p>
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
                  <div className="bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 p-3 sm:p-4 space-y-3 mt-4 auren-premium-card">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/65">Subtotal</span>
                      <span className="text-white font-bold">{formatNaira(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/65">Delivery Fee</span>
                      <span className={deliveryFee === 0 ? 'text-[var(--sr-customer)] font-bold' : 'text-white font-bold'}>
                        {deliveryFee === 0 ? 'FREE' : formatNaira(deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/65">Service Fee</span>
                      <span className="text-white font-bold">{formatNaira(serviceFee)}</span>
                    </div>
                    {deliveryFee > 0 && (
                      <p className="text-[var(--sr-customer)]/60 text-[10px]">Free delivery on orders above ₦5,000</p>
                    )}
                    <div className="h-px bg-white/5" />
                    <div className="flex justify-between">
                      <span className="text-white font-bold text-sm">Total</span>
                      <span className="text-[var(--sr-customer)] font-black text-lg">{formatNaira(total)}</span>
                    </div>
                  </div>
                )}
                <div className="auren-divider" />
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
                    <MapPin className="w-5 h-5 text-[var(--sr-customer)]" />
                    Delivery Address
                  </h3>
                  <div className="auren-accent-line" />

                  {/* Saved Addresses (from /api/addresses) */}
                  <div className="space-y-2 mb-3">
                    <p className="text-white/65 text-[11px] uppercase tracking-widest font-bold">Your Saved Addresses</p>
                    {fetchingAddresses ? (
                      <div className="flex items-center gap-2 p-3 sm:p-4 bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5">
                        <Loader2 className="w-4 h-4 text-[var(--sr-customer)] animate-spin" />
                        <span className="text-white/65 text-sm">Loading saved addresses…</span>
                      </div>
                    ) : savedAddresses.length === 0 ? (
                      <div className="p-4 bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 text-center">
                        <p className="text-white/65 text-sm">No saved addresses yet</p>
                        <p className="text-white/60 text-xs mt-1">Add one below or pick a default location</p>
                      </div>
                    ) : (
                      savedAddresses.map(addr => {
                        const isSelected = selectedAddressId === addr.id;
                        const Icon = addr.label?.toLowerCase().includes('office') ? Briefcase : Home;
                        return (
                          <button
                            key={addr.id}
                            onClick={() => handleSelectAddress(addr)}
                            className={`w-full flex items-center gap-3 p-3 sm:p-4 rounded-2xl border text-left transition-all ${
                              isSelected
                                ? 'bg-[var(--sr-customer)]/5 border-[var(--sr-customer)]/40'
                                : 'bg-[var(--sr-surface-elevated)] border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isSelected ? 'bg-[var(--sr-customer)]/20' : 'bg-white/5'
                            }`}>
                              <Icon className={`w-5 h-5 ${isSelected ? 'text-[var(--sr-customer)]' : 'text-white/60'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-white font-bold text-sm">{addr.label}</p>
                                {addr.isDefault && (
                                  <span className="bg-[var(--sr-vendor)]/10 text-[var(--sr-vendor)] text-[9px] font-bold px-2 py-0.5 rounded-full border border-[var(--sr-vendor)]/20 uppercase">Default</span>
                                )}
                              </div>
                              <p className="text-white/65 text-xs truncate">{addr.address}{addr.area ? `, ${addr.area}` : ''}</p>
                            </div>
                            {isSelected && <Check className="w-5 h-5 text-[var(--sr-customer)] shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Add new address form */}
                  {showAddAddressForm ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-[var(--sr-surface-elevated)] rounded-2xl p-3 sm:p-4 border border-[var(--sr-customer)]/20 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {['Home', 'Office', 'Partner', 'Other'].map(lbl => (
                          <button
                            key={lbl}
                            onClick={() => setNewAddrLabel(lbl)}
                            className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                              newAddrLabel === lbl
                                ? 'bg-[var(--sr-customer)] text-[var(--sr-surface-base)]'
                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                      <label htmlFor="checkout-addr-street" className="sr-only">Street address</label>
                      <input
                        id="checkout-addr-street"
                        value={newAddrText}
                        onChange={e => setNewAddrText(e.target.value)}
                        placeholder="Street address (e.g. 12 Admiralty Way, Lekki Phase 1)"
                        className="w-full bg-[var(--sr-surface-raised)] text-white text-sm rounded-xl p-3 border border-white/5 focus:border-[var(--sr-customer)]/30 focus:outline-none placeholder:text-white/20 auren-input"
                      />
                      <label htmlFor="checkout-addr-area" className="sr-only">Area</label>
                      <input
                        id="checkout-addr-area"
                        value={newAddrArea}
                        onChange={e => setNewAddrArea(e.target.value)}
                        placeholder="Area (e.g. Lekki)"
                        className="w-full bg-[var(--sr-surface-raised)] text-white text-sm rounded-xl p-3 border border-white/5 focus:border-[var(--sr-customer)]/30 focus:outline-none placeholder:text-white/20 auren-input"
                      />
                      <label htmlFor="checkout-addr-instructions" className="sr-only">Delivery instructions</label>
                      <input
                        id="checkout-addr-instructions"
                        value={newAddrInstructions}
                        onChange={e => setNewAddrInstructions(e.target.value)}
                        placeholder="Delivery instructions (optional)"
                        className="w-full bg-[var(--sr-surface-raised)] text-white text-sm rounded-xl p-3 border border-white/5 focus:border-[var(--sr-customer)]/30 focus:outline-none placeholder:text-white/20 auren-input"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveNewAddress}
                          disabled={!newAddrText.trim() || savingAddress}
                          className="flex-1 bg-[var(--sr-customer)] text-[var(--sr-surface-base)] font-bold py-2.5 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                          {savingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Save Address
                        </button>
                        <button
                          onClick={() => setShowAddAddressForm(false)}
                          className="px-4 bg-white/5 text-white/60 font-bold py-2.5 rounded-xl text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => setShowAddAddressForm(true)}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-white/15 text-white/60 hover:text-white hover:border-[var(--sr-customer)]/40 transition-colors text-sm font-bold"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add New Address
                    </button>
                  )}

                  <div className="h-px bg-white/5 my-4" />

                  <p className="text-white/65 text-[11px] uppercase tracking-widest font-bold mb-2">Default Locations</p>
                  {/* Saved Locations */}
                  <div className="space-y-2">
                    {deliveryLocations.map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => { setSelectedLocation(loc); setDeliveryAddress(loc.address); }}
                        className={`w-full flex items-center gap-3 p-3 sm:p-4 rounded-2xl border text-left transition-all ${
                          selectedLocation.id === loc.id
                            ? 'bg-[var(--sr-customer)]/5 border-[var(--sr-customer)]/30'
                            : 'bg-[var(--sr-surface-elevated)] border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          selectedLocation.id === loc.id ? 'bg-[var(--sr-customer)]/20' : 'bg-white/5'
                        }`}>
                          <MapPin className={`w-5 h-5 ${selectedLocation.id === loc.id ? 'text-[var(--sr-customer)]' : 'text-white/60'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm">{loc.name}</p>
                          <p className="text-white/65 text-xs truncate">{loc.address}</p>
                        </div>
                        {selectedLocation.id === loc.id && (
                          <Check className="w-5 h-5 text-[var(--sr-customer)] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Edit Address */}
                  <div className="mt-3 flex items-center gap-3 sm:gap-4">
                    {isEditingAddress ? (
                      <div className="flex-1 bg-[var(--sr-surface-elevated)] rounded-2xl p-3 sm:p-4 border border-white/5 space-y-3">
                        <label htmlFor="checkout-edit-address" className="sr-only">Edit delivery address</label>
                        <input
                          id="checkout-edit-address"
                          value={editAddressValue}
                          onChange={e => setEditAddressValue(e.target.value)}
                          className="w-full bg-[var(--sr-surface-raised)] text-white text-sm rounded-xl p-3 border border-white/5 focus:border-[var(--sr-customer)]/30 focus:outline-none auren-input"
                          placeholder="Enter delivery address"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveAddress}
                            className="flex-1 bg-[var(--sr-customer)] text-[var(--sr-surface-base)] font-bold py-2.5 rounded-xl text-sm"
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
                          className="flex items-center gap-2 text-[var(--sr-customer)] text-xs font-bold hover:text-[var(--sr-customer)]/80 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit address
                        </button>
                        <button
                          onClick={() => setActiveModal('delivery-location')}
                          className="flex items-center gap-2 text-[var(--sr-vendor)] text-xs font-bold hover:text-[var(--sr-vendor)]/80 transition-colors"
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
                  <label htmlFor="checkout-delivery-instructions" className="sr-only">Delivery instructions</label>
                  <input
                    id="checkout-delivery-instructions"
                    value={deliveryInstructions}
                    onChange={e => setDeliveryInstructions(e.target.value)}
                    placeholder="e.g., Gate code, landmark, leave at door..."
                    className="w-full bg-[var(--sr-surface-elevated)] text-white text-sm rounded-xl p-3 border border-white/5 focus:border-[var(--sr-customer)]/30 focus:outline-none placeholder:text-white/20 auren-input"
                  />
                </div>
                <div className="auren-divider" />
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
                <div className="flex items-center justify-between p-3 sm:p-4 bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--sr-vendor)]/10 rounded-xl flex items-center justify-center">
                      <Sun className="w-5 h-5 text-[var(--sr-vendor)]" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Iftar Precision</p>
                      <p className="text-white/65 text-xs">Deliver 15 min before Maghrib</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIftarPrecision(!iftarPrecision)}
                    className={`w-12 h-7 rounded-full transition-all relative ${
                      iftarPrecision ? 'bg-[var(--sr-customer)]' : 'bg-white/10'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                      iftarPrecision ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Sahur Alarm Toggle */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--sr-customer)]/10 rounded-xl flex items-center justify-center">
                      <Bell className="w-5 h-5 text-[var(--sr-customer)]" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Sahur Alarm</p>
                      <p className="text-white/65 text-xs">Wake-up reminder before Fajr</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSahurAlarm(!sahurAlarm)}
                    className={`w-12 h-7 rounded-full transition-all relative ${
                      sahurAlarm ? 'bg-[var(--sr-customer)]' : 'bg-white/10'
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
                    <Clock className="w-5 h-5 text-[var(--sr-customer)]" />
                    Delivery Time Slot
                  </h3>
                  <div className="auren-accent-line" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {timeSlots.map(slot => {
                      const Icon = slot.icon;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedTimeSlot(slot.id)}
                          className={`p-4 rounded-2xl border text-left transition-all relative ${
                            selectedTimeSlot === slot.id
                              ? 'bg-[var(--sr-customer)]/5 border-[var(--sr-customer)]/30'
                              : 'bg-[var(--sr-surface-elevated)] border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className={`w-4 h-4 ${selectedTimeSlot === slot.id ? 'text-[var(--sr-customer)]' : 'text-white/60'}`} />
                            <span className={`font-bold text-sm ${selectedTimeSlot === slot.id ? 'text-[var(--sr-customer)]' : 'text-white'}`}>
                              {slot.label}
                            </span>
                          </div>
                          <p className="text-white/65 text-xs">{slot.time}</p>
                          {selectedTimeSlot === slot.id && (
                            <Check className="w-4 h-4 text-[var(--sr-customer)] absolute top-3 right-3" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Iftar Timing Option */}
                {iftarPrecision && (
                  <div className="bg-[var(--sr-vendor)]/5 rounded-2xl border border-[var(--sr-vendor)]/20 p-3 sm:p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Sun className="w-5 h-5 text-[var(--sr-vendor)]" />
                      <span className="text-[var(--sr-vendor)] font-bold text-sm">Iftar Delivery</span>
                    </div>
                    <p className="text-white/50 text-xs">
                      Your order will arrive 15 minutes before Maghrib (6:30 PM) so it&apos;s fresh for Iftar.
                    </p>
                  </div>
                )}

                {/* Sahur Timing Option */}
                {sahurAlarm && (
                  <div className="bg-[var(--sr-customer)]/5 rounded-2xl border border-[var(--sr-customer)]/20 p-3 sm:p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Moon className="w-5 h-5 text-[var(--sr-customer)]" />
                      <span className="text-[var(--sr-customer)] font-bold text-sm">Sahur Delivery</span>
                    </div>
                    <p className="text-white/50 text-xs">
                      Pre-dawn delivery between 3:00 - 4:30 AM so your Sahur meal is ready.
                    </p>
                  </div>
                )}

                {/* Address Summary */}
                <div className="bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 p-3 sm:p-4">
                  <p className="text-white/65 text-xs mb-1">Delivering to</p>
                  <p className="text-white font-bold text-sm">{effectiveAddress}</p>
                </div>
                <div className="auren-divider" />
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
                    <CreditCard className="w-5 h-5 text-[var(--sr-customer)]" />
                    Payment Method
                  </h3>
                  <div className="auren-accent-line" />
                  <div className="space-y-2">
                    {paymentMethods.map(pm => (
                      <button
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`w-full flex items-center gap-3 p-3 sm:p-4 rounded-2xl border text-left transition-all auren-premium-card ${
                          paymentMethod === pm.id
                            ? 'bg-[var(--sr-customer)]/5 border-[var(--sr-customer)]/30'
                            : 'bg-[var(--sr-surface-elevated)] border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          paymentMethod === pm.id ? 'bg-[var(--sr-customer)]/20' : 'bg-white/5'
                        }`}>
                          <span className={`material-symbols-outlined text-lg ${
                            paymentMethod === pm.id ? 'text-[var(--sr-customer)]' : 'text-white/60'
                          }`}>{pm.icon}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-bold text-sm">{pm.name}</p>
                          {pm.providers.length > 0 && (
                            <p className="text-white/65 text-xs">{pm.providers.join(', ')}</p>
                          )}
                        </div>
                        {paymentMethod === pm.id && (
                          <Check className="w-5 h-5 text-[var(--sr-customer)] shrink-0" />
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
                          className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-2xl border text-left transition-all auren-premium-card ${
                            selectedBnplPlan === plan.months
                              ? 'bg-[var(--sr-vendor)]/5 border-[var(--sr-vendor)]/30'
                              : 'bg-[var(--sr-surface-elevated)] border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-bold text-sm">{plan.label}</p>
                              {plan.ramadanOffer && (
                                <span className="bg-[var(--sr-customer)]/10 text-[var(--sr-customer)] text-[9px] font-bold px-2 py-0.5 rounded-full border border-[var(--sr-customer)]/20">
                                  0% RAMADAN
                                </span>
                              )}
                            </div>
                            <p className="text-white/65 text-xs">
                              {plan.interestRate}% interest &bull; {formatNaira(Math.round(total / plan.months))}/mo
                            </p>
                          </div>
                          {selectedBnplPlan === plan.months && (
                            <Check className="w-5 h-5 text-[var(--sr-vendor)] shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Coupon Code */}
                <div>
                  <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[var(--sr-ai)]" />
                    Promo Code
                  </h4>
                  {couponState === 'applied' ? (
                    <div className="bg-[var(--sr-customer)]/5 border border-[var(--sr-customer)]/30 rounded-2xl p-3 sm:p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--sr-customer)]/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-[var(--sr-customer)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm font-mono">{appliedCouponCode}</p>
                        <p className="text-[var(--sr-customer)] text-xs">{couponMessage}</p>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white/60 hover:text-white hover:bg-white/10"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <label htmlFor="checkout-coupon-code" className="sr-only">Coupon code</label>
                      <input
                        id="checkout-coupon-code"
                        value={couponCode}
                        onChange={e => {
                          setCouponCode(e.target.value.toUpperCase());
                          if (couponState === 'error') setCouponState('idle');
                        }}
                        placeholder="Enter code (e.g. RAMADAN)"
                        className="flex-1 bg-[var(--sr-surface-elevated)] text-white text-sm rounded-xl p-3 border border-white/5 focus:border-[var(--sr-customer)]/30 focus:outline-none placeholder:text-white/20 font-mono tracking-wider auren-input"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim() || couponState === 'applying'}
                        className="px-5 bg-[var(--sr-customer)] text-[var(--sr-surface-base)] font-bold text-sm rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
                      >
                        {couponState === 'applying' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Apply'
                        )}
                      </button>
                    </div>
                  )}
                  {couponState === 'error' && couponMessage && (
                    <p className="text-[var(--sr-error)] text-xs mt-2 flex items-center gap-1">
                      <X className="w-3 h-3" />
                      {couponMessage}
                    </p>
                  )}
                </div>

                {/* Order Summary */}
                <div>
                  <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[var(--sr-vendor)]" />
                    Order Summary
                  </h4>
                  <div className="bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 p-3 sm:p-4 space-y-3 auren-premium-card">
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
                      <span className="text-white/65">Subtotal</span>
                      <span className="text-white font-bold">{formatNaira(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/65">Delivery Fee</span>
                      <span className={deliveryFee === 0 ? 'text-[var(--sr-customer)] font-bold' : 'text-white font-bold'}>
                        {deliveryFee === 0 ? 'FREE' : formatNaira(deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/65">Service Fee</span>
                      <span className="text-white font-bold">{formatNaira(serviceFee)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--sr-customer)]">Discount ({appliedCouponCode})</span>
                        <span className="text-[var(--sr-customer)] font-bold">-{formatNaira(discount)}</span>
                      </div>
                    )}
                    <div className="h-px bg-white/5" />
                    <div className="flex justify-between">
                      <span className="text-white font-bold text-sm">Total</span>
                      <span className="text-[var(--sr-customer)] font-black text-lg">{formatNaira(total)}</span>
                    </div>
                  </div>
                </div>
                <div className="auren-divider" />
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
                {/* Confetti is handled by canvas-confetti via triggerOrderCelebration() */}

                {/* Success Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.2 }}
                  className="w-24 h-24 bg-[var(--sr-customer)]/20 rounded-full flex items-center justify-center border border-[var(--sr-customer)]/30 shadow-[0_0_32px_rgba(16,224,122,0.25)]"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring', damping: 10 }}
                  >
                    <PartyPopper className="w-12 h-12 text-[var(--sr-customer)]" />
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
                  <div className="auren-accent-line" />
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
                  className="w-full bg-[var(--sr-surface-elevated)] rounded-2xl border border-white/5 p-5 space-y-3 text-left"
                >
                  <div className="flex justify-between">
                    <span className="text-white/65 text-xs">Order Number</span>
                    <span className="text-white font-bold text-xs font-mono">{orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/65 text-xs">Estimated Delivery</span>
                    <span className="text-[var(--sr-customer)] font-bold text-xs">
                      {selectedTimeSlot === 'morning' ? '8:00 - 11:00 AM' :
                       selectedTimeSlot === 'afternoon' ? '12:00 - 3:00 PM' :
                       selectedTimeSlot === 'evening' ? '4:00 - 7:00 PM' : '8:00 - 10:00 PM'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/65 text-xs">Items</span>
                    <span className="text-white font-bold text-xs">{placedCartItems.length} item{placedCartItems.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/65 text-xs">Total</span>
                    <span className="text-[var(--sr-customer)] font-black text-sm">{formatNaira(placedTotal)}</span>
                  </div>
                  {appliedCouponCode && (
                    <div className="flex justify-between">
                      <span className="text-white/65 text-xs">Promo Code</span>
                      <span className="text-[var(--sr-customer)] font-bold text-xs font-mono">{appliedCouponCode}</span>
                    </div>
                  )}
                  {paymentReference && (
                    <div className="flex justify-between">
                      <span className="text-white/65 text-xs">Payment Ref</span>
                      <span className="text-white/60 font-mono text-[10px] truncate max-w-[60%] text-right">{paymentReference}</span>
                    </div>
                  )}
                  {iftarPrecision && (
                    <div className="flex items-center gap-2 bg-[var(--sr-vendor)]/5 rounded-lg px-3 py-2 border border-[var(--sr-vendor)]/10">
                      <Sun className="w-3.5 h-3.5 text-[var(--sr-vendor)]" />
                      <span className="text-[var(--sr-vendor)] text-[10px] font-bold">Iftar Precision enabled - delivery before Maghrib</span>
                    </div>
                  )}
                  {sahurAlarm && (
                    <div className="flex items-center gap-2 bg-[var(--sr-customer)]/5 rounded-lg px-3 py-2 border border-[var(--sr-customer)]/10">
                      <Bell className="w-3.5 h-3.5 text-[var(--sr-customer)]" />
                      <span className="text-[var(--sr-customer)] text-[10px] font-bold">Sahur alarm set - you&apos;ll be reminded before Fajr</span>
                    </div>
                  )}
                </motion.div>

                {/* Track Order Button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  onClick={handleTrackOrder}
                  className="w-full bg-[var(--sr-customer)] text-[var(--sr-surface-base)] font-black py-4 rounded-2xl text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-[var(--sr-customer)]/20"
                >
                  <Truck className="w-5 h-5" />
                  Track Order
                  <ChevronRight className="w-4 h-4" />
                </motion.button>

                <button
                  onClick={handleClose}
                  className="text-white/65 text-sm font-bold hover:text-white/60 transition-colors"
                >
                  Continue Shopping
                </button>
                <div className="auren-divider" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation Buttons */}
        {currentStep < 4 && (
          <div className="fixed bottom-0 left-0 right-0 z-20 bg-[var(--sr-surface-base)] border-t border-white/5 px-4 py-4 space-y-3">
            {/* Order Total Bar */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/65 text-[10px] uppercase">Total</p>
                <p className="text-[var(--sr-customer)] font-black text-lg">{formatNaira(total)}</p>
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
                    className="px-8 py-3 rounded-xl bg-[var(--sr-customer)] text-[var(--sr-surface-base)] font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    className="px-8 py-3 rounded-xl bg-[var(--sr-customer)] text-[var(--sr-surface-base)] font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-[var(--sr-customer)]/30 disabled:opacity-60 disabled:pointer-events-none auren-btn-gold"
                  >
                    {placing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Placing...
                      </>
                    ) : (
                      <>
                        Place Order
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
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
