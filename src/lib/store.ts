import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TabId = 'home' | 'explore' | 'cart' | 'orders' | 'offers' | 'profile'
  | 'rider-dashboard' | 'rider-earnings' | 'rider-deliveries' | 'rider-profile'
  | 'vendor-dashboard' | 'vendor-orders' | 'vendor-earnings' | 'vendor-store' | 'vendor-profile';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: string;
}

export interface OrderItem {
  id: string;
  item: string;
  status: string;
  eta: string;
  total: number;
  rider: string | null;
  items: { name: string; qty: number; price: number }[];
  progress: number;
}

interface AppState {
  // Navigation
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;

  // Cart
  cartCount: number;
  setCartCount: (count: number) => void;
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, qty: number) => void;
  clearCart: () => void;

  // Modals & Overlays
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  selectedProduct: number | null;
  setSelectedProduct: (id: number | null) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;

  // Notifications
  notifications: NotificationItem[];
  setNotifications: (notifications: NotificationItem[]) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;

  // Wishlist
  wishlist: number[];
  toggleWishlist: (id: number) => void;

  // Category filter
  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;

  // Auth
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  showAuth: string | null; // 'login' | 'signup' | 'otp' | 'role' | null
  setShowAuth: (val: string | null) => void;
  userName: string;
  setUserName: (name: string) => void;
  userPhone: string;
  setUserPhone: (phone: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  userRole: 'customer' | 'vendor' | 'rider';
  setUserRole: (role: 'customer' | 'vendor' | 'rider') => void;
  userAvatar: string;
  setUserAvatar: (avatar: string) => void;
  userArea: string;
  setUserArea: (area: string) => void;

  // Onboarding
  onboardingComplete: boolean;
  setOnboardingComplete: (val: boolean) => void;
  showOnboarding: boolean;
  setShowOnboarding: (val: boolean) => void;
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;

  // Vendor Onboarding Fields
  vendorBusinessCategory: string;
  setVendorBusinessCategory: (cat: string) => void;
  vendorBusinessAddress: string;
  setVendorBusinessAddress: (addr: string) => void;
  vendorBankName: string;
  setVendorBankName: (name: string) => void;
  vendorAccountNumber: string;
  setVendorAccountNumber: (num: string) => void;
  vendorOpenTime: string;
  setVendorOpenTime: (time: string) => void;
  vendorCloseTime: string;
  setVendorCloseTime: (time: string) => void;

  // Rider Onboarding Fields
  riderVehicleType: string;
  setRiderVehicleType: (type: string) => void;
  riderPlateNumber: string;
  setRiderPlateNumber: (plate: string) => void;
  riderLicenseNumber: string;
  setRiderLicenseNumber: (license: string) => void;
  riderBankName: string;
  setRiderBankName: (name: string) => void;
  riderAccountNumber: string;
  setRiderAccountNumber: (num: string) => void;
  riderVehicleColor: string;
  setRiderVehicleColor: (color: string) => void;

  // Customer Onboarding Fields
  customerDietaryPrefs: string[];
  setCustomerDietaryPrefs: (prefs: string[]) => void;
  customerFavoriteCategories: string[];
  setCustomerFavoriteCategories: (cats: string[]) => void;

  // Loyalty
  hasanatPoints: number;
  setHasanatPoints: (pts: number) => void;
  swiftPoints: number;
  setSwiftPoints: (pts: number) => void;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  setLoyaltyTier: (tier: 'bronze' | 'silver' | 'gold' | 'platinum') => void;
  dailyStreak: number;
  setDailyStreak: (streak: number) => void;
  claimDailyPoints: () => void;

  // Orders
  orders: OrderItem[];
  setOrders: (orders: OrderItem[]) => void;
  addOrder: (order: OrderItem) => void;

  // Checkout
  checkoutStep: number; // 0=cart, 1=location, 2=schedule, 3=payment, 4=success
  setCheckoutStep: (step: number) => void;
  deliveryAddress: string;
  setDeliveryAddress: (addr: string) => void;
  deliveryInstructions: string;
  setDeliveryInstructions: (instr: string) => void;
  iftarPrecision: boolean;
  setIftarPrecision: (val: boolean) => void;
  sahurAlarm: boolean;
  setSahurAlarm: (val: boolean) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;

  // Gift Card
  giftCardStep: number; // 0=design, 1=personalize, 2=review
  setGiftCardStep: (step: number) => void;
  giftCardTheme: string;
  setGiftCardTheme: (theme: string) => void;
  giftCardAmount: number;
  setGiftCardAmount: (amount: number) => void;
  giftCardRecipient: string;
  setGiftCardRecipient: (recipient: string) => void;
  giftCardMessage: string;
  setGiftCardMessage: (msg: string) => void;
  giftCardDeliveryMethod: string;
  setGiftCardDeliveryMethod: (method: string) => void;
  giftCardMood: string;
  setGiftCardMood: (mood: string) => void;
  resetGiftCard: () => void;

  // Group Buy
  groupBuySlots: Record<number, { filled: number; total: number; joined: boolean }>;
  joinGroupBuy: (id: number, total: number) => void;

  // Voice
  isListening: boolean;
  setIsListening: (val: boolean) => void;
  voiceTranscript: string;
  setVoiceTranscript: (text: string) => void;

  // Sahur Alarm
  sahurAlarmTime: string;
  setSahurAlarmTime: (time: string) => void;
  sahurAlarmEnabled: boolean;
  setSahurAlarmEnabled: (val: boolean) => void;

  // Referral
  referralCode: string;
  referralCount: number;
  incrementReferral: () => void;

  // Rider State
  riderOnline: boolean;
  setRiderOnline: (val: boolean) => void;
  riderCurrentDelivery: string | null;
  setRiderCurrentDelivery: (id: string | null) => void;
  riderEarnings: number;
  setRiderEarnings: (val: number) => void;
  riderCompletedToday: number;
  setRiderCompletedToday: (val: number) => void;
  riderRating: number;
  setRiderRating: (val: number) => void;

  // Vendor State
  vendorOnline: boolean;
  setVendorOnline: (val: boolean) => void;
  vendorStoreName: string;
  setVendorStoreName: (name: string) => void;
  vendorBalance: number;
  setVendorBalance: (val: number) => void;
  vendorPendingSettlement: number;
  setVendorPendingSettlement: (val: number) => void;
  vendorTotalEarnings: number;
  setVendorTotalEarnings: (val: number) => void;

  // Logout
  logout: () => void;
}

const defaultGiftCard = {
  giftCardStep: 0,
  giftCardTheme: 'crescent-grace',
  giftCardAmount: 10000,
  giftCardRecipient: '',
  giftCardMessage: '',
  giftCardDeliveryMethod: 'whatsapp',
  giftCardMood: 'formal',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      activeTab: 'home',
      setActiveTab: (tab) => set({ activeTab: tab }),
      showWelcome: true,
      setShowWelcome: (show) => set({ showWelcome: show }),

      // Cart
      cartCount: 0,
      setCartCount: (count) => set({ cartCount: count }),
      cartItems: [],
      addToCart: (item) => {
        const { cartItems } = get();
        const qty = item.quantity || 1;
        const existing = cartItems.find(ci => ci.id === item.id);
        let newItems: CartItem[];
        if (existing) {
          newItems = cartItems.map(ci =>
            ci.id === item.id ? { ...ci, quantity: ci.quantity + qty } : ci
          );
        } else {
          newItems = [...cartItems, { ...item, quantity: qty }];
        }
        set({
          cartItems: newItems,
          cartCount: newItems.reduce((sum, ci) => sum + ci.quantity, 0),
        });
      },
      removeFromCart: (id) => {
        const { cartItems } = get();
        const newItems = cartItems.filter(ci => ci.id !== id);
        set({
          cartItems: newItems,
          cartCount: newItems.reduce((sum, ci) => sum + ci.quantity, 0),
        });
      },
      updateQuantity: (id, qty) => {
        const { cartItems } = get();
        if (qty <= 0) {
          const newItems = cartItems.filter(ci => ci.id !== id);
          set({
            cartItems: newItems,
            cartCount: newItems.reduce((sum, ci) => sum + ci.quantity, 0),
          });
          return;
        }
        const newItems = cartItems.map(ci =>
          ci.id === id ? { ...ci, quantity: qty } : ci
        );
        set({
          cartItems: newItems,
          cartCount: newItems.reduce((sum, ci) => sum + ci.quantity, 0),
        });
      },
      clearCart: () => set({ cartItems: [], cartCount: 0 }),

      // Modals & Overlays
      activeModal: null,
      setActiveModal: (modal) => set({ activeModal: modal }),
      selectedProduct: null,
      setSelectedProduct: (id) => set({ selectedProduct: id }),

      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      showSearch: false,
      setShowSearch: (show) => set({ showSearch: show }),

      // Notifications
      notifications: [],
      setNotifications: (notifications) => {
        set({
          notifications,
          unreadCount: notifications.filter(n => !n.read).length,
        });
      },
      unreadCount: 0,
      setUnreadCount: (count) => set({ unreadCount: count }),

      // Wishlist
      wishlist: [],
      toggleWishlist: (id) => {
        const { wishlist } = get();
        if (wishlist.includes(id)) {
          set({ wishlist: wishlist.filter(wid => wid !== id) });
        } else {
          set({ wishlist: [...wishlist, id] });
        }
      },

      // Category filter
      activeCategory: null,
      setActiveCategory: (category) => set({ activeCategory: category }),

      // Auth
      isLoggedIn: false,
      setIsLoggedIn: (val) => set({ isLoggedIn: val }),
      showAuth: null,
      setShowAuth: (val) => set({ showAuth: val }),
      userName: 'Bolaji Ahmed',
      setUserName: (name) => set({ userName: name }),
      userPhone: '',
      setUserPhone: (phone) => set({ userPhone: phone }),
      userEmail: '',
      setUserEmail: (email) => set({ userEmail: email }),
      userRole: 'customer',
      setUserRole: (role) => set({ userRole: role }),
      userAvatar: '',
      setUserAvatar: (avatar) => set({ userAvatar: avatar }),
      userArea: 'Lekki Phase 1',
      setUserArea: (area) => set({ userArea: area }),

      // Onboarding
      onboardingComplete: false,
      setOnboardingComplete: (val) => set({ onboardingComplete: val }),
      showOnboarding: false,
      setShowOnboarding: (val) => set({ showOnboarding: val }),
      onboardingStep: 0,
      setOnboardingStep: (step) => set({ onboardingStep: step }),

      // Vendor Onboarding
      vendorBusinessCategory: 'Iftar Meals',
      setVendorBusinessCategory: (cat) => set({ vendorBusinessCategory: cat }),
      vendorBusinessAddress: '',
      setVendorBusinessAddress: (addr) => set({ vendorBusinessAddress: addr }),
      vendorBankName: '',
      setVendorBankName: (name) => set({ vendorBankName: name }),
      vendorAccountNumber: '',
      setVendorAccountNumber: (num) => set({ vendorAccountNumber: num }),
      vendorOpenTime: '08:00',
      setVendorOpenTime: (time) => set({ vendorOpenTime: time }),
      vendorCloseTime: '22:00',
      setVendorCloseTime: (time) => set({ vendorCloseTime: time }),

      // Rider Onboarding
      riderVehicleType: 'Motorcycle',
      setRiderVehicleType: (type) => set({ riderVehicleType: type }),
      riderPlateNumber: '',
      setRiderPlateNumber: (plate) => set({ riderPlateNumber: plate }),
      riderLicenseNumber: '',
      setRiderLicenseNumber: (license) => set({ riderLicenseNumber: license }),
      riderBankName: '',
      setRiderBankName: (name) => set({ riderBankName: name }),
      riderAccountNumber: '',
      setRiderAccountNumber: (num) => set({ riderAccountNumber: num }),
      riderVehicleColor: '',
      setRiderVehicleColor: (color) => set({ riderVehicleColor: color }),

      // Customer Onboarding
      customerDietaryPrefs: [],
      setCustomerDietaryPrefs: (prefs) => set({ customerDietaryPrefs: prefs }),
      customerFavoriteCategories: [],
      setCustomerFavoriteCategories: (cats) => set({ customerFavoriteCategories: cats }),

      // Loyalty
      hasanatPoints: 5400,
      setHasanatPoints: (pts) => set({ hasanatPoints: pts }),
      swiftPoints: 1200,
      setSwiftPoints: (pts) => set({ swiftPoints: pts }),
      loyaltyTier: 'gold',
      setLoyaltyTier: (tier) => set({ loyaltyTier: tier }),
      dailyStreak: 3,
      setDailyStreak: (streak) => set({ dailyStreak: streak }),
      claimDailyPoints: () => {
        const { hasanatPoints, dailyStreak } = get();
        set({
          hasanatPoints: hasanatPoints + 50,
          dailyStreak: dailyStreak + 1,
        });
      },

      // Orders
      orders: [],
      setOrders: (orders) => set({ orders }),
      addOrder: (order) => {
        const { orders } = get();
        set({ orders: [order, ...orders] });
      },

      // Checkout
      checkoutStep: 0,
      setCheckoutStep: (step) => set({ checkoutStep: step }),
      deliveryAddress: '12 Admiralty Way, Lekki Phase 1',
      setDeliveryAddress: (addr) => set({ deliveryAddress: addr }),
      deliveryInstructions: '',
      setDeliveryInstructions: (instr) => set({ deliveryInstructions: instr }),
      iftarPrecision: false,
      setIftarPrecision: (val) => set({ iftarPrecision: val }),
      sahurAlarm: false,
      setSahurAlarm: (val) => set({ sahurAlarm: val }),
      paymentMethod: 'card',
      setPaymentMethod: (method) => set({ paymentMethod: method }),

      // Gift Card
      ...defaultGiftCard,
      setGiftCardStep: (step) => set({ giftCardStep: step }),
      setGiftCardTheme: (theme) => set({ giftCardTheme: theme }),
      setGiftCardAmount: (amount) => set({ giftCardAmount: amount }),
      setGiftCardRecipient: (recipient) => set({ giftCardRecipient: recipient }),
      setGiftCardMessage: (msg) => set({ giftCardMessage: msg }),
      setGiftCardDeliveryMethod: (method) => set({ giftCardDeliveryMethod: method }),
      setGiftCardMood: (mood) => set({ giftCardMood: mood }),
      resetGiftCard: () => set(defaultGiftCard),

      // Group Buy
      groupBuySlots: {},
      joinGroupBuy: (id, total) => {
        const { groupBuySlots } = get();
        const current = groupBuySlots[id] || { filled: 0, total, joined: false };
        if (current.joined) return;
        set({
          groupBuySlots: {
            ...groupBuySlots,
            [id]: { ...current, filled: current.filled + 1, joined: true },
          },
        });
      },

      // Voice
      isListening: false,
      setIsListening: (val) => set({ isListening: val }),
      voiceTranscript: '',
      setVoiceTranscript: (text) => set({ voiceTranscript: text }),

      // Sahur Alarm
      sahurAlarmTime: '04:30',
      setSahurAlarmTime: (time) => set({ sahurAlarmTime: time }),
      sahurAlarmEnabled: false,
      setSahurAlarmEnabled: (val) => set({ sahurAlarmEnabled: val }),

      // Referral
      referralCode: 'BOLAJI24',
      referralCount: 3,
      incrementReferral: () => set({ referralCount: get().referralCount + 1 }),

      // Rider State
      riderOnline: false,
      setRiderOnline: (val) => set({ riderOnline: val }),
      riderCurrentDelivery: null,
      setRiderCurrentDelivery: (id) => set({ riderCurrentDelivery: id }),
      riderEarnings: 24500,
      setRiderEarnings: (val) => set({ riderEarnings: val }),
      riderCompletedToday: 12,
      setRiderCompletedToday: (val) => set({ riderCompletedToday: val }),
      riderRating: 4.9,
      setRiderRating: (val) => set({ riderRating: val }),

      // Vendor State
      vendorOnline: false,
      setVendorOnline: (val) => set({ vendorOnline: val }),
      vendorStoreName: 'Suya Central',
      setVendorStoreName: (name) => set({ vendorStoreName: name }),
      vendorBalance: 450000,
      setVendorBalance: (val) => set({ vendorBalance: val }),
      vendorPendingSettlement: 25400,
      setVendorPendingSettlement: (val) => set({ vendorPendingSettlement: val }),
      vendorTotalEarnings: 1280000,
      setVendorTotalEarnings: (val) => set({ vendorTotalEarnings: val }),

      // Logout
      logout: () => {
        set({
          isLoggedIn: false,
          showAuth: null,
          showOnboarding: false,
          onboardingComplete: false,
          activeTab: 'home',
          activeModal: null,
          cartItems: [],
          cartCount: 0,
          riderOnline: false,
          vendorOnline: false,
        });
      },
    }),
    {
      name: 'swiftramadan-store',
      partialize: (state) => ({
        showWelcome: state.showWelcome,
        cartItems: state.cartItems,
        cartCount: state.cartCount,
        wishlist: state.wishlist,
        isLoggedIn: state.isLoggedIn,
        userName: state.userName,
        userPhone: state.userPhone,
        userEmail: state.userEmail,
        userRole: state.userRole,
        userArea: state.userArea,
        onboardingComplete: state.onboardingComplete,
        hasanatPoints: state.hasanatPoints,
        swiftPoints: state.swiftPoints,
        loyaltyTier: state.loyaltyTier,
        dailyStreak: state.dailyStreak,
        orders: state.orders,
        deliveryAddress: state.deliveryAddress,
        groupBuySlots: state.groupBuySlots,
        referralCode: state.referralCode,
        referralCount: state.referralCount,
        sahurAlarmTime: state.sahurAlarmTime,
        sahurAlarmEnabled: state.sahurAlarmEnabled,
        riderOnline: state.riderOnline,
        riderEarnings: state.riderEarnings,
        riderCompletedToday: state.riderCompletedToday,
        riderRating: state.riderRating,
        vendorOnline: state.vendorOnline,
        vendorStoreName: state.vendorStoreName,
        vendorBalance: state.vendorBalance,
        vendorPendingSettlement: state.vendorPendingSettlement,
        vendorTotalEarnings: state.vendorTotalEarnings,
        vendorBusinessCategory: state.vendorBusinessCategory,
        vendorBusinessAddress: state.vendorBusinessAddress,
        riderVehicleType: state.riderVehicleType,
        riderPlateNumber: state.riderPlateNumber,
        customerDietaryPrefs: state.customerDietaryPrefs,
        customerFavoriteCategories: state.customerFavoriteCategories,
      }),
    }
  )
);
