'use client';

/**
 * KingdomCheckoutModal — Auren Kingdom V2 reinterpretation of the legacy
 * SwiftRamadan CheckoutModal.
 *
 * Same store hooks (useNavigation, useCart, useCheckout, useOrders,
 * useAppStore.getState().userEmail) and the SAME API calls (/api/addresses
 * GET+POST, /api/coupons/validate POST, /api/orders POST, /api/payments
 * POST) are preserved. Analytics (`track`) + `triggerOrderCelebration`
 * parity with the legacy.
 *
 * V2 spec sections:
 *  1. RoyalModal wrapper with kv-backdrop
 *  2. Title "Royal Checkout" with kv-gradient-text
 *  3. kv-progress + kv-progress-fill for step indicator
 *  4. Steps as sections with kv-accent-line dividers:
 *     - Step 1: "Delivery"  — RoyalInput fields for address (combined with
 *                schedule controls: time slot, iftar precision, sahur alarm,
 *                saved addresses, add new address, delivery instructions)
 *     - Step 2: "Payment"   — kv-card payment method selectors + BNPL + coupon
 *     - Step 3: "Review"    — kv-card order summary + confirm button
 *  5. Place order button: kv-btn-gold "Confirm Your Iftar"
 *  6. Success state: kv-success with gold celebration
 *  7. kv-divider between steps
 *  8. Trust microcopy "Your payment is secured by the Kingdom."
 *  9. Same API calls preserved
 * 10. Same store hooks preserved
 * 11. Route: src/app/kingdom/checkout/page.tsx
 *
 * The legacy `src/components/swift/CheckoutModal.tsx` is untouched.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  CreditCard,
  Check,
  ChevronRight,
  Truck,
  Bell,
  Sun,
  Moon,
  Edit3,
  Package,
  Loader2,
  Tag,
  Home,
  Briefcase,
  Plus as PlusIcon,
  PartyPopper,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { OrderItem } from '@/lib/store';
import {
  useAppStore,
  useNavigation,
  useCart,
  useCheckout,
  useOrders,
} from '@/lib/store-selectors';
import { deliveryLocations, paymentMethods, bnplPlans, formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { track } from '@/lib/analytics';
import { triggerOrderCelebration } from '@/components/swift/OrderCelebration';
import { RoyalModal, RoyalInput } from '../components';

/* ─────────────────────── Types & static config ─────────────────────── */

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

// V2 spec collapses legacy 5 steps (Cart/Location/Schedule/Payment/Done)
// into 3 main steps + Success.
const stepLabels = ['Delivery', 'Payment', 'Review', 'Done'];

export interface KingdomCheckoutModalProps {
  /** Optional callback fired AFTER the modal is closed (used by the
   *  /kingdom/checkout route page to redirect back to /kingdom/cart). */
  onClosed?: () => void;
}

export function KingdomCheckoutModal({ onClosed }: KingdomCheckoutModalProps = {}) {
  /* ── SAME store hooks preserved ── */
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

  /* ── Local UI state (mirrors legacy) ── */
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('evening');
  const [selectedBnplPlan, setSelectedBnplPlan] = useState(2);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddressValue, setEditAddressValue] = useState(deliveryAddress);
  const [selectedLocation, setSelectedLocation] = useState(deliveryLocations[0]);
  const [orderId, setOrderId] = useState(
    () => `SWR-${Math.floor(1000 + Math.random() * 9000)}`,
  );
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

  /* ── Calculations (identical to legacy) ── */
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFee = subtotal >= 5000 ? 0 : 500;
  const serviceFee = Math.round(subtotal * 0.02);
  const grossTotal = subtotal + deliveryFee + serviceFee;
  const discount = couponState === 'applied' ? couponDiscount : 0;
  const total = Math.max(0, grossTotal - discount);

  const currentStep = checkoutStep;

  /* ── Use deliveryAddress with fallback to first saved location ── */
  const effectiveAddress =
    deliveryAddress || selectedLocation.address || deliveryLocations[0].address;

  /* ── Handlers ── */
  const handleClose = () => {
    setActiveModal(null);
    setCheckoutStep(0);
    onClosed?.();
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCheckoutStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCheckoutStep(currentStep - 1);
    }
  };

  /* ── Coupon handlers (identical API call to legacy) ── */
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
        setCouponMessage(
          data.message ||
            `Coupon applied — you saved ${formatNaira(data.discount || 0)}`,
        );
        setAppliedCouponCode(data.code || couponCode.trim().toUpperCase());
        track('coupon_apply', {
          code: data.code || couponCode.trim().toUpperCase(),
          discount: data.discount || 0,
        });
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

  /* ── Address handlers (identical API calls to legacy) ── */
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
        const refetch = await fetch(
          `/api/addresses?userId=${encodeURIComponent(currentUserEmail)}`,
        );
        const refetchData = await refetch.json();
        const addrs: SavedAddress[] = Array.isArray(refetchData.addresses)
          ? refetchData.addresses
          : [];
        setSavedAddresses(addrs);
        const newAddr = addrs.find((a) => a.address === newAddrText);
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
        toast({
          title: 'Could not save address',
          description: data.message || 'Please log in to save addresses',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Could not save address',
        description: 'Network error — please try again',
        variant: 'destructive',
      });
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setDeliveryAddress(addr.address);
    if (addr.instructions) setDeliveryInstructions(addr.instructions);
  };

  const handleSaveAddress = () => {
    setDeliveryAddress(editAddressValue);
    setIsEditingAddress(false);
    toast({ title: 'Address Updated 📍', description: 'Delivery address saved' });
  };

  /* ── Place order — SAME API calls to /api/orders + /api/payments ── */
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
      item:
        snapshotItems.length === 1
          ? snapshotItems[0].name
          : `${snapshotItems[0].name} + ${snapshotItems.length - 1} more`,
      status: 'Preparing',
      eta:
        selectedTimeSlot === 'morning'
          ? '8:00 - 11:00 AM'
          : selectedTimeSlot === 'afternoon'
            ? '12:00 - 3:00 PM'
            : selectedTimeSlot === 'evening'
              ? '4:00 - 7:00 PM'
              : '8:00 - 10:00 PM',
      total: snapshotTotal,
      rider: null,
      items: snapshotItems.map((ci) => ({
        name: ci.name,
        qty: ci.quantity,
        price: ci.price,
      })),
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
          const shortId = `SWR-${data.order.id
            .replace(/[^a-z0-9]/gi, '')
            .slice(-6)
            .toUpperCase()}`;
          order.id = shortId;
          setOrderId(shortId);
        }
      }
    } catch {
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
          reference: `SWR-PAY-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)
            .toUpperCase()}`,
        }),
      });
      if (payRes.ok) {
        const payData = await payRes.json();
        if (payData.payment?.reference) {
          setPaymentReference(payData.payment.reference);
        }
      }
    } catch {
      // Non-blocking: payment record not critical for checkout flow
    }

    addOrder(order);
    clearCart();
    setCheckoutStep(3);
    setPlacing(false);

    // Trigger premium canvas-confetti celebration
    setTimeout(() => triggerOrderCelebration(), 300);

    track('order_placed', {
      orderId: order.id,
      total: snapshotTotal,
      items: snapshotItems.length,
      paymentMethod,
    });
    track('checkout_complete', {
      orderId: order.id,
      total: snapshotTotal,
      paymentMethod,
    });

    toast({
      title: 'Order Placed! 🎉',
      description: `Your order ${order.id} is being prepared.${
        snapshotDiscount > 0 ? ` You saved ${formatNaira(snapshotDiscount)}!` : ''
      }`,
    });
  };

  const handleTrackOrder = () => {
    setActiveModal(null);
    setCheckoutStep(0);
    setActiveTab('orders');
    onClosed?.();
    toast({ title: 'Tracking Order 📦', description: 'Switching to your orders tab' });
  };

  /* ─────────────────────── Effects ─────────────────────── */

  // Fetch saved addresses when modal opens (identical to legacy)
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    // Analytics: track checkout initiation
    track('checkout_start', { itemCount: cartItems.length, total: total || grossTotal });
    const fetchAddresses = async () => {
      setFetchingAddresses(true);
      try {
        const res = await fetch(
          `/api/addresses?userId=${encodeURIComponent(currentUserEmail)}`,
        );
        const data = await res.json();
        if (cancelled) return;
        const addrs: SavedAddress[] = Array.isArray(data.addresses)
          ? data.addresses
          : [];
        setSavedAddresses(addrs);
        // Auto-select the default address (or the first one)
        const def = addrs.find((a) => a.isDefault) || addrs[0];
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
    return () => {
      cancelled = true;
    };
  }, [isOpen, currentUserEmail]);

  /* ─────────────────────── Render ─────────────────────── */

  return (
    <RoyalModal
      open={isOpen}
      onClose={handleClose}
      title="Royal Checkout"
      subtitle="Complete your Ramadan iftar order"
      size="lg"
      closeOnBackdrop={false}
      className="!max-w-md !max-h-[92vh] !overflow-y-auto"
    >
      {/* ─────────────────────── Progress stepper ─────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {stepLabels.slice(0, 3).map((label, i) => (
            <div
              key={label}
              className="flex items-center flex-1 last:flex-none"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    i < currentStep
                      ? 'bg-[var(--kv-royal)] text-white'
                      : i === currentStep
                        ? 'border-2 border-[var(--kv-royal)] text-[var(--kv-mystic)]'
                        : 'bg-[var(--kv-glass)] text-[var(--kv-text-tertiary)] border border-[var(--kv-glass-border)]'
                  }`}
                  aria-current={i === currentStep ? 'step' : undefined}
                >
                  {i < currentStep ? (
                    <Check className="w-4 h-4" aria-hidden />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1 font-bold ${
                    i <= currentStep
                      ? 'text-[var(--kv-text-secondary)]'
                      : 'text-[var(--kv-text-muted)]'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 2 && (
                <div className="flex-1 mx-2 kv-progress">
                  <div
                    className="kv-progress-fill"
                    style={{ width: i < currentStep ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ─────────── Step 0: Delivery ─────────── */}
        {currentStep === 0 && (
          <motion.div
            key="delivery"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <section>
              <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--kv-mystic)]" aria-hidden />
                Delivery Address
              </h3>
              <div className="kv-accent-line mb-4" />

              {/* Saved Addresses (from /api/addresses) */}
              <div className="space-y-2 mb-3">
                <p className="text-[var(--kv-text-tertiary)] text-[10px] uppercase tracking-widest font-bold">
                  Your Saved Addresses
                </p>
                {fetchingAddresses ? (
                  <div className="kv-card p-4 flex items-center gap-2">
                    <Loader2
                      className="w-4 h-4 text-[var(--kv-mystic)] animate-spin"
                      aria-hidden
                    />
                    <span className="text-[var(--kv-text-secondary)] text-sm">
                      Loading saved addresses…
                    </span>
                  </div>
                ) : savedAddresses.length === 0 ? (
                  <div className="kv-card p-4 text-center">
                    <p className="text-[var(--kv-text-secondary)] text-sm">
                      No saved addresses yet
                    </p>
                    <p className="text-[var(--kv-text-tertiary)] text-xs mt-1">
                      Add one below or pick a default location
                    </p>
                  </div>
                ) : (
                  savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    const Icon = addr.label?.toLowerCase().includes('office')
                      ? Briefcase
                      : Home;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectAddress(addr)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'kv-card-royal'
                            : 'kv-card hover:bg-[var(--kv-glass-hover)]'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[var(--kv-royal-light)]'
                              : 'bg-[var(--kv-glass)]'
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              isSelected
                                ? 'text-[var(--kv-mystic)]'
                                : 'text-[var(--kv-text-tertiary)]'
                            }`}
                            aria-hidden
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-bold text-sm">
                              {addr.label}
                            </p>
                            {addr.isDefault && (
                              <span className="kv-badge-gold !text-[9px] !py-0.5 !px-2">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-[var(--kv-text-secondary)] text-xs truncate">
                            {addr.address}
                            {addr.area ? `, ${addr.area}` : ''}
                          </p>
                        </div>
                        {isSelected && (
                          <Check
                            className="w-5 h-5 text-[var(--kv-mystic)] shrink-0"
                            aria-hidden
                          />
                        )}
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
                  className="kv-card kv-card-royal p-4 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {['Home', 'Office', 'Partner', 'Other'].map((lbl) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setNewAddrLabel(lbl)}
                        className={`py-2 rounded-lg text-xs font-bold transition-colors min-h-[36px] ${
                          newAddrLabel === lbl
                            ? 'bg-[var(--kv-royal)] text-white'
                            : 'bg-[var(--kv-glass)] text-[var(--kv-text-tertiary)] hover:bg-[var(--kv-glass-hover)]'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                  <RoyalInput
                    value={newAddrText}
                    onChange={(e) => setNewAddrText(e.target.value)}
                    placeholder="Street address (e.g. 12 Admiralty Way, Lekki Phase 1)"
                    aria-label="Street address"
                  />
                  <RoyalInput
                    value={newAddrArea}
                    onChange={(e) => setNewAddrArea(e.target.value)}
                    placeholder="Area (e.g. Lekki)"
                    aria-label="Area"
                  />
                  <RoyalInput
                    value={newAddrInstructions}
                    onChange={(e) => setNewAddrInstructions(e.target.value)}
                    placeholder="Delivery instructions (optional)"
                    aria-label="Delivery instructions"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveNewAddress}
                      disabled={!newAddrText.trim() || savingAddress}
                      className="flex-1 kv-btn kv-btn-royal text-sm !py-2.5 disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {savingAddress ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                      ) : (
                        <Check className="w-4 h-4" aria-hidden />
                      )}
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAddressForm(false)}
                      className="px-4 kv-btn kv-btn-ghost text-sm !py-2.5"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddAddressForm(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[var(--kv-glass-border)] text-[var(--kv-text-tertiary)] hover:text-[var(--kv-mystic)] hover:border-[var(--kv-royal-border)] transition-colors text-sm font-bold min-h-[44px]"
                >
                  <PlusIcon className="w-4 h-4" aria-hidden />
                  Add New Address
                </button>
              )}

              <div className="kv-divider my-4" />

              <p className="text-[var(--kv-text-tertiary)] text-[10px] uppercase tracking-widest font-bold mb-2">
                Default Locations
              </p>
              <div className="space-y-2">
                {deliveryLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      setSelectedLocation(loc);
                      setDeliveryAddress(loc.address);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedLocation.id === loc.id
                        ? 'kv-card-royal'
                        : 'kv-card hover:bg-[var(--kv-glass-hover)]'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        selectedLocation.id === loc.id
                          ? 'bg-[var(--kv-royal-light)]'
                          : 'bg-[var(--kv-glass)]'
                      }`}
                    >
                      <MapPin
                        className={`w-5 h-5 ${
                          selectedLocation.id === loc.id
                            ? 'text-[var(--kv-mystic)]'
                            : 'text-[var(--kv-text-tertiary)]'
                        }`}
                        aria-hidden
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">{loc.name}</p>
                      <p className="text-[var(--kv-text-secondary)] text-xs truncate">
                        {loc.address}
                      </p>
                    </div>
                    {selectedLocation.id === loc.id && (
                      <Check
                        className="w-5 h-5 text-[var(--kv-mystic)] shrink-0"
                        aria-hidden
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Edit Address */}
              <div className="mt-3 flex items-center gap-3">
                {isEditingAddress ? (
                  <div className="flex-1 kv-card p-3 space-y-3">
                    <RoyalInput
                      value={editAddressValue}
                      onChange={(e) => setEditAddressValue(e.target.value)}
                      placeholder="Enter delivery address"
                      aria-label="Edit delivery address"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveAddress}
                        className="flex-1 kv-btn kv-btn-royal text-sm !py-2.5"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="px-4 kv-btn kv-btn-ghost text-sm !py-2.5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditAddressValue(effectiveAddress);
                        setIsEditingAddress(true);
                      }}
                      className="flex items-center gap-1.5 text-[var(--kv-mystic)] text-xs font-bold hover:opacity-80 transition-opacity min-h-[36px]"
                    >
                      <Edit3 className="w-3.5 h-3.5" aria-hidden />
                      Edit address
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal('delivery-location')}
                      className="flex items-center gap-1.5 text-[var(--kv-gold)] text-xs font-bold hover:opacity-80 transition-opacity min-h-[36px]"
                    >
                      <MapPin className="w-3.5 h-3.5" aria-hidden />
                      Set on map
                    </button>
                  </>
                )}
              </div>
            </section>

            {/* Delivery Instructions */}
            <section>
              <h4 className="text-white font-bold text-sm mb-2">
                Delivery Instructions
              </h4>
              <RoyalInput
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="e.g., Gate code, landmark, leave at door..."
                aria-label="Delivery instructions"
              />
            </section>

            <div className="kv-divider" />

            {/* Schedule section (iftarPrecision, sahurAlarm, time slot) */}
            <section>
              <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--kv-mystic)]" aria-hidden />
                Schedule
              </h3>
              <div className="kv-accent-line mb-4" />

              {/* Iftar Precision Toggle */}
              <div className="flex items-center justify-between p-3 kv-card mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--kv-gold-light)' }}
                  >
                    <Sun className="w-5 h-5 text-[var(--kv-gold)]" aria-hidden />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Iftar Precision</p>
                    <p className="text-[var(--kv-text-tertiary)] text-xs">
                      Deliver 15 min before Maghrib
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIftarPrecision(!iftarPrecision)}
                  className={`w-12 h-7 rounded-full transition-all relative ${
                    iftarPrecision
                      ? 'bg-[var(--kv-royal)]'
                      : 'bg-[var(--kv-glass)]'
                  }`}
                  aria-label="Toggle iftar precision"
                  aria-pressed={iftarPrecision}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                      iftarPrecision ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Sahur Alarm Toggle */}
              <div className="flex items-center justify-between p-3 kv-card mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--kv-royal-light)' }}
                  >
                    <Bell className="w-5 h-5 text-[var(--kv-mystic)]" aria-hidden />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Sahur Alarm</p>
                    <p className="text-[var(--kv-text-tertiary)] text-xs">
                      Wake-up reminder before Fajr
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSahurAlarm(!sahurAlarm)}
                  className={`w-12 h-7 rounded-full transition-all relative ${
                    sahurAlarm ? 'bg-[var(--kv-royal)]' : 'bg-[var(--kv-glass)]'
                  }`}
                  aria-label="Toggle sahur alarm"
                  aria-pressed={sahurAlarm}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                      sahurAlarm ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Time Slot Selection */}
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((slot) => {
                  const Icon = slot.icon;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot.id)}
                      className={`p-3 rounded-xl border text-left transition-all relative min-h-[68px] ${
                        selectedTimeSlot === slot.id
                          ? 'kv-card-royal'
                          : 'kv-card hover:bg-[var(--kv-glass-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          className={`w-3.5 h-3.5 ${
                            selectedTimeSlot === slot.id
                              ? 'text-[var(--kv-mystic)]'
                              : 'text-[var(--kv-text-tertiary)]'
                          }`}
                          aria-hidden
                        />
                        <span
                          className={`font-bold text-xs ${
                            selectedTimeSlot === slot.id
                              ? 'text-[var(--kv-mystic)]'
                              : 'text-white'
                          }`}
                        >
                          {slot.label}
                        </span>
                      </div>
                      <p className="text-[var(--kv-text-secondary)] text-[10px]">
                        {slot.time}
                      </p>
                      {selectedTimeSlot === slot.id && (
                        <Check
                          className="w-3.5 h-3.5 text-[var(--kv-mystic)] absolute top-2 right-2"
                          aria-hidden
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Iftar timing detail */}
              {iftarPrecision && (
                <div
                  className="mt-3 rounded-xl p-3"
                  style={{
                    background: 'var(--kv-gold-light)',
                    border: '1px solid var(--kv-gold-border)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sun className="w-4 h-4 text-[var(--kv-gold)]" aria-hidden />
                    <span className="text-[var(--kv-gold)] font-bold text-xs">
                      Iftar Delivery
                    </span>
                  </div>
                  <p className="text-[var(--kv-text-tertiary)] text-[10px]">
                    Your order will arrive 15 minutes before Maghrib (6:30 PM) so
                    it&apos;s fresh for Iftar.
                  </p>
                </div>
              )}

              {/* Sahur timing detail */}
              {sahurAlarm && (
                <div
                  className="mt-3 rounded-xl p-3"
                  style={{
                    background: 'var(--kv-royal-light)',
                    border: '1px solid var(--kv-royal-border)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Moon className="w-4 h-4 text-[var(--kv-mystic)]" aria-hidden />
                    <span className="text-[var(--kv-mystic)] font-bold text-xs">
                      Sahur Delivery
                    </span>
                  </div>
                  <p className="text-[var(--kv-text-tertiary)] text-[10px]">
                    Pre-dawn delivery between 3:00 - 4:30 AM so your Sahur meal is
                    ready.
                  </p>
                </div>
              )}

              {/* Address Summary */}
              <div className="kv-card mt-3 p-3">
                <p className="text-[var(--kv-text-tertiary)] text-[10px] mb-1 uppercase tracking-wider">
                  Delivering to
                </p>
                <p className="text-white font-bold text-sm">{effectiveAddress}</p>
              </div>
            </section>
            <div className="kv-divider" />
          </motion.div>
        )}

        {/* ─────────── Step 1: Payment ─────────── */}
        {currentStep === 1 && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <section>
              <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[var(--kv-mystic)]" aria-hidden />
                Payment Method
              </h3>
              <div className="kv-accent-line mb-4" />
              <div className="space-y-2">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      paymentMethod === pm.id
                        ? 'kv-card-royal'
                        : 'kv-card hover:bg-[var(--kv-glass-hover)]'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        paymentMethod === pm.id
                          ? 'bg-[var(--kv-royal-light)]'
                          : 'bg-[var(--kv-glass)]'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-lg ${
                          paymentMethod === pm.id
                            ? 'text-[var(--kv-mystic)]'
                            : 'text-[var(--kv-text-tertiary)]'
                        }`}
                        aria-hidden
                      >
                        {pm.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">{pm.name}</p>
                      {pm.providers.length > 0 && (
                        <p className="text-[var(--kv-text-secondary)] text-xs">
                          {pm.providers.join(', ')}
                        </p>
                      )}
                    </div>
                    {paymentMethod === pm.id && (
                      <Check
                        className="w-5 h-5 text-[var(--kv-mystic)] shrink-0"
                        aria-hidden
                      />
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* BNPL Options */}
            {paymentMethod === 'bnpl' && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h4 className="text-white font-bold text-sm mb-2">Choose Plan</h4>
                <div className="space-y-2">
                  {bnplPlans.map((plan) => (
                    <button
                      key={plan.months}
                      type="button"
                      onClick={() => setSelectedBnplPlan(plan.months)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        selectedBnplPlan === plan.months
                          ? 'kv-card-gold'
                          : 'kv-card hover:bg-[var(--kv-glass-hover)]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold text-sm">
                            {plan.label}
                          </p>
                          {plan.ramadanOffer && (
                            <span className="kv-badge-gold !text-[9px] !py-0.5 !px-2">
                              0% RAMADAN
                            </span>
                          )}
                        </div>
                        <p className="text-[var(--kv-text-secondary)] text-xs mt-0.5">
                          {plan.interestRate}% interest ·{' '}
                          {formatNaira(Math.round(total / plan.months))}/mo
                        </p>
                      </div>
                      {selectedBnplPlan === plan.months && (
                        <Check
                          className="w-5 h-5 text-[var(--kv-gold)] shrink-0"
                          aria-hidden
                        />
                      )}
                    </button>
                  ))}
                </div>
              </motion.section>
            )}

            <div className="kv-divider" />

            {/* Coupon Code */}
            <section>
              <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[var(--kv-mystic)]" aria-hidden />
                Promo Code
              </h4>
              {couponState === 'applied' ? (
                <div
                  className="rounded-xl p-3 flex items-center gap-3"
                  style={{
                    background: 'var(--kv-royal-light)',
                    border: '1px solid var(--kv-royal-border)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(124, 58, 237, 0.25)' }}
                  >
                    <Check className="w-5 h-5 text-[var(--kv-mystic)]" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm font-mono tracking-wider">
                      {appliedCouponCode}
                    </p>
                    <p className="text-[var(--kv-mystic)] text-xs truncate">
                      {couponMessage}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="px-3 py-1.5 kv-card text-xs font-bold text-[var(--kv-text-secondary)] hover:text-[var(--kv-danger)] min-h-[36px]"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <RoyalInput
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        if (couponState === 'error') setCouponState('idle');
                      }}
                      placeholder="Enter code (e.g. RAMADAN)"
                      aria-label="Coupon code"
                      className="font-mono tracking-wider"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || couponState === 'applying'}
                    className="kv-btn kv-btn-royal !min-h-[52px] px-5 text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {couponState === 'applying' ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    ) : (
                      'Apply'
                    )}
                  </button>
                </div>
              )}
              {couponState === 'error' && couponMessage && (
                <p className="text-[var(--kv-danger)] text-xs mt-2 flex items-center gap-1">
                  <X className="w-3 h-3" aria-hidden />
                  {couponMessage}
                </p>
              )}
            </section>
            <div className="kv-divider" />
          </motion.div>
        )}

        {/* ─────────── Step 2: Review ─────────── */}
        {currentStep === 2 && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <section>
              <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <Package className="w-4 h-4 text-[var(--kv-mystic)]" aria-hidden />
                Order Summary
              </h3>
              <div className="kv-accent-line mb-4" />

              <div className="kv-card p-4 space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[var(--kv-elevated)] relative">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package
                            className="w-5 h-5 text-[var(--kv-text-muted)]"
                            aria-hidden
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">
                        {item.name} × {item.quantity}
                      </p>
                      <p className="text-[var(--kv-text-tertiary)] text-[10px]">
                        {formatNaira(item.price)} each
                      </p>
                    </div>
                    <span className="text-white text-xs font-bold">
                      {formatNaira(item.price * item.quantity)}
                    </span>
                  </div>
                ))}

                <div className="kv-divider my-1" />

                <div className="flex justify-between text-xs">
                  <span className="text-[var(--kv-text-tertiary)]">Subtotal</span>
                  <span className="text-white font-bold">{formatNaira(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--kv-text-tertiary)]">
                    Delivery Fee
                  </span>
                  <span
                    className={
                      deliveryFee === 0
                        ? 'kv-gradient-gold font-bold'
                        : 'text-white font-bold'
                    }
                  >
                    {deliveryFee === 0 ? 'FREE' : formatNaira(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--kv-text-tertiary)]">
                    Service Fee
                  </span>
                  <span className="text-white font-bold">
                    {formatNaira(serviceFee)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--kv-gold)]">
                      Discount ({appliedCouponCode})
                    </span>
                    <span className="text-[var(--kv-gold)] font-bold">
                      -{formatNaira(discount)}
                    </span>
                  </div>
                )}

                <div className="kv-divider my-1" />

                <div className="flex items-end justify-between">
                  <div>
                    <p className="kv-metric-label">Total Due</p>
                    <p className="kv-metric-value kv-gradient-gold mt-1">
                      {formatNaira(total)}
                    </p>
                  </div>
                  <span className="text-[10px] text-[var(--kv-text-tertiary)] uppercase tracking-wider">
                    Inclusive of fees
                  </span>
                </div>
              </div>
            </section>

            <div className="kv-divider" />

            {/* Delivery & payment recap */}
            <section>
              <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[var(--kv-mystic)]" aria-hidden />
                Delivery Recap
              </h3>
              <div className="kv-accent-line mb-3" />
              <div className="kv-card p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--kv-text-tertiary)]">Address</span>
                  <span className="text-white font-bold text-right max-w-[60%] truncate">
                    {effectiveAddress}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--kv-text-tertiary)]">Time slot</span>
                  <span className="text-white font-bold">
                    {selectedTimeSlot === 'morning'
                      ? '8:00 - 11:00 AM'
                      : selectedTimeSlot === 'afternoon'
                        ? '12:00 - 3:00 PM'
                        : selectedTimeSlot === 'evening'
                          ? '4:00 - 7:00 PM'
                          : '8:00 - 10:00 PM'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--kv-text-tertiary)]">Payment</span>
                  <span className="text-white font-bold capitalize">
                    {paymentMethod === 'bnpl'
                      ? `BNPL · ${selectedBnplPlan}mo`
                      : paymentMethod === 'card'
                        ? 'Card'
                        : paymentMethod === 'transfer'
                          ? 'Transfer'
                          : 'Cash'}
                  </span>
                </div>
                {iftarPrecision && (
                  <div className="flex items-center gap-2 pt-1">
                    <Sun className="w-3 h-3 text-[var(--kv-gold)]" aria-hidden />
                    <span className="text-[var(--kv-gold)] text-[10px] font-bold">
                      Iftar Precision enabled
                    </span>
                  </div>
                )}
                {sahurAlarm && (
                  <div className="flex items-center gap-2">
                    <Bell className="w-3 h-3 text-[var(--kv-mystic)]" aria-hidden />
                    <span className="text-[var(--kv-mystic)] text-[10px] font-bold">
                      Sahur alarm set
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Trust microcopy */}
            <p className="text-[var(--kv-text-tertiary)] text-[10px] text-center flex items-center justify-center gap-1.5">
              <Check className="w-3 h-3 text-[var(--kv-gold)]" aria-hidden />
              Your payment is secured by the Kingdom.
            </p>
          </motion.div>
        )}

        {/* ─────────── Step 3: Success ─────────── */}
        {currentStep === 3 && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="kv-success relative space-y-5"
          >
            {/* Success Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                damping: 10,
                stiffness: 100,
                delay: 0.2,
              }}
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto kv-gold-glow"
              style={{
                background: 'var(--kv-gold-light)',
                border: '1px solid var(--kv-gold-border)',
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', damping: 10 }}
              >
                <PartyPopper
                  className="w-12 h-12 text-[var(--kv-gold)]"
                  aria-hidden
                />
              </motion.div>
            </motion.div>

            <div className="text-center">
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-white text-2xl font-black mb-2"
              >
                Iftar Confirmed! 🎉
              </motion.h3>
              <div className="kv-accent-line mx-auto mb-3" />
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-[var(--kv-text-tertiary)] text-sm"
              >
                Your Ramadan order is being prepared
              </motion.p>
            </div>

            {/* Order Details */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="kv-card p-5 space-y-3 text-left"
            >
              <div className="flex justify-between">
                <span className="text-[var(--kv-text-tertiary)] text-xs">
                  Order Number
                </span>
                <span className="text-white font-bold text-xs font-mono">
                  {orderId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--kv-text-tertiary)] text-xs">
                  Estimated Delivery
                </span>
                <span className="kv-gradient-gold font-bold text-xs">
                  {selectedTimeSlot === 'morning'
                    ? '8:00 - 11:00 AM'
                    : selectedTimeSlot === 'afternoon'
                      ? '12:00 - 3:00 PM'
                      : selectedTimeSlot === 'evening'
                        ? '4:00 - 7:00 PM'
                        : '8:00 - 10:00 PM'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--kv-text-tertiary)] text-xs">Items</span>
                <span className="text-white font-bold text-xs">
                  {placedCartItems.length} item
                  {placedCartItems.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--kv-text-tertiary)] text-xs">Total</span>
                <span className="kv-gradient-gold font-black text-sm">
                  {formatNaira(placedTotal)}
                </span>
              </div>
              {appliedCouponCode && (
                <div className="flex justify-between">
                  <span className="text-[var(--kv-text-tertiary)] text-xs">
                    Promo Code
                  </span>
                  <span className="text-[var(--kv-gold)] font-bold text-xs font-mono">
                    {appliedCouponCode}
                  </span>
                </div>
              )}
              {paymentReference && (
                <div className="flex justify-between">
                  <span className="text-[var(--kv-text-tertiary)] text-xs">
                    Payment Ref
                  </span>
                  <span className="text-[var(--kv-text-secondary)] font-mono text-[10px] truncate max-w-[60%] text-right">
                    {paymentReference}
                  </span>
                </div>
              )}
              {iftarPrecision && (
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{
                    background: 'var(--kv-gold-light)',
                    border: '1px solid var(--kv-gold-border)',
                  }}
                >
                  <Sun className="w-3.5 h-3.5 text-[var(--kv-gold)]" aria-hidden />
                  <span className="text-[var(--kv-gold)] text-[10px] font-bold">
                    Iftar Precision enabled — delivery before Maghrib
                  </span>
                </div>
              )}
              {sahurAlarm && (
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{
                    background: 'var(--kv-royal-light)',
                    border: '1px solid var(--kv-royal-border)',
                  }}
                >
                  <Bell className="w-3.5 h-3.5 text-[var(--kv-mystic)]" aria-hidden />
                  <span className="text-[var(--kv-mystic)] text-[10px] font-bold">
                    Sahur alarm set — you&apos;ll be reminded before Fajr
                  </span>
                </div>
              )}
            </motion.div>

            {/* Track Order Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              type="button"
              onClick={handleTrackOrder}
              className="w-full kv-btn kv-btn-gold !py-4 text-sm uppercase tracking-widest font-extrabold flex items-center justify-center gap-2"
            >
              <Truck className="w-5 h-5" aria-hidden />
              Track Order
              <ChevronRight className="w-4 h-4" aria-hidden />
            </motion.button>

            <button
              type="button"
              onClick={handleClose}
              className="w-full text-[var(--kv-text-secondary)] text-sm font-bold hover:text-white transition-colors min-h-[44px]"
            >
              Continue Shopping
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────── Bottom action bar ─────────────────────── */}
      {currentStep < 3 && (
        <div className="mt-6 pt-4 border-t border-[var(--kv-glass-border)] space-y-3">
          {/* Trust microcopy near the action buttons */}
          <p className="text-[var(--kv-text-tertiary)] text-[10px] text-center flex items-center justify-center gap-1.5">
            <Check className="w-3 h-3 text-[var(--kv-gold)]" aria-hidden />
            Your payment is secured by the Kingdom.
          </p>

          {/* Order Total Bar */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--kv-text-tertiary)] text-[10px] uppercase tracking-wider">
                Total
              </p>
              <p className="kv-gradient-gold font-black text-lg">
                {formatNaira(total)}
              </p>
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="kv-btn kv-btn-ghost !py-3 text-sm"
                >
                  Back
                </button>
              )}
              {currentStep < 2 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentStep === 0 && cartItems.length === 0}
                  className="kv-btn kv-btn-royal !py-3 px-8 text-sm disabled:opacity-40 disabled:pointer-events-none"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="kv-btn kv-btn-gold !py-3 px-8 text-sm uppercase tracking-widest font-extrabold flex items-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {placing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                      Placing...
                    </>
                  ) : (
                    <>
                      Confirm Your Iftar
                      <ChevronRight className="w-4 h-4" aria-hidden />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </RoyalModal>
  );
}
