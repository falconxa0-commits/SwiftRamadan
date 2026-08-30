import { useAppStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';

// Re-export the raw store so callers can use single-arg selectors
// (`useAppStore(s => s.field)`) without a second import line.
export { useAppStore };

// Pre-built selectors for common patterns
export const useAuth = () => useAppStore(
  useShallow((s) => ({
    isLoggedIn: s.isLoggedIn,
    userName: s.userName,
    userRole: s.userRole,
    userEmail: s.userEmail,
    userAvatar: s.userAvatar,
    userArea: s.userArea,
    userPhone: s.userPhone,
    setUserRole: s.setUserRole,
    setShowAuth: s.setShowAuth,
    logout: s.logout,
    setIsLoggedIn: s.setIsLoggedIn,
    setUserName: s.setUserName,
    setUserEmail: s.setUserEmail,
    setUserArea: s.setUserArea,
    setUserPhone: s.setUserPhone,
    setUserAvatar: s.setUserAvatar,
  }))
);

export const useCart = () => useAppStore(
  useShallow((s) => ({
    cartItems: s.cartItems,
    cartCount: s.cartCount,
    addToCart: s.addToCart,
    removeFromCart: s.removeFromCart,
    updateQuantity: s.updateQuantity,
    clearCart: s.clearCart,
  }))
);

export const useNavigation = () => useAppStore(
  useShallow((s) => ({
    activeTab: s.activeTab,
    setActiveTab: s.setActiveTab,
    activeModal: s.activeModal,
    setActiveModal: s.setActiveModal,
    showSearch: s.showSearch,
    setShowSearch: s.setShowSearch,
    searchQuery: s.searchQuery,
    setSearchQuery: s.setSearchQuery,
  }))
);

export const useLoyalty = () => useAppStore(
  useShallow((s) => ({
    hasanatPoints: s.hasanatPoints,
    setHasanatPoints: s.setHasanatPoints,
    swiftPoints: s.swiftPoints,
    setSwiftPoints: s.setSwiftPoints,
    loyaltyTier: s.loyaltyTier,
    dailyStreak: s.dailyStreak,
    claimDailyPoints: s.claimDailyPoints,
  }))
);

export const useNotifications = () => useAppStore(
  useShallow((s) => ({
    notifications: s.notifications,
    unreadCount: s.unreadCount,
    setNotifications: s.setNotifications,
    setUnreadCount: s.setUnreadCount,
  }))
);

// Single-field selectors (most efficient)
export const useActiveTab = () => useAppStore(s => s.activeTab);
export const useCartCount = () => useAppStore(s => s.cartCount);
export const useIsLoggedIn = () => useAppStore(s => s.isLoggedIn);
export const useUserName = () => useAppStore(s => s.userName);
export const useUserRole = () => useAppStore(s => s.userRole);
export const useActiveModal = () => useAppStore(s => s.activeModal);

// Orders slice (orders + setter + addOrder — setters are stable, so this is re-render safe)
export const useOrders = () => useAppStore(
  useShallow((s) => ({
    orders: s.orders,
    setOrders: s.setOrders,
    addOrder: s.addOrder,
  }))
);

// Onboarding slice (visibility flags + setters)
export const useOnboarding = () => useAppStore(
  useShallow((s) => ({
    showWelcome: s.showWelcome,
    setShowWelcome: s.setShowWelcome,
    showAuth: s.showAuth,
    setShowAuth: s.setShowAuth,
    showOnboarding: s.showOnboarding,
    setShowOnboarding: s.setShowOnboarding,
    onboardingComplete: s.onboardingComplete,
    setOnboardingComplete: s.setOnboardingComplete,
    onboardingStep: s.onboardingStep,
    setOnboardingStep: s.setOnboardingStep,
    userRole: s.userRole,
  }))
);

// Vendor slice (with all live setters — covers both static info and live balance updates)
export const useVendor = () => useAppStore(
  useShallow((s) => ({
    vendorStoreName: s.vendorStoreName,
    vendorBusinessCategory: s.vendorBusinessCategory,
    vendorBusinessAddress: s.vendorBusinessAddress,
    vendorOnline: s.vendorOnline,
    setVendorOnline: s.setVendorOnline,
    vendorBalance: s.vendorBalance,
    setVendorBalance: s.setVendorBalance,
    vendorTotalEarnings: s.vendorTotalEarnings,
    setVendorTotalEarnings: s.setVendorTotalEarnings,
    vendorPendingSettlement: s.vendorPendingSettlement,
    setVendorPendingSettlement: s.setVendorPendingSettlement,
    vendorOpenTime: s.vendorOpenTime,
    vendorCloseTime: s.vendorCloseTime,
    vendorBankName: s.vendorBankName,
    vendorAccountNumber: s.vendorAccountNumber,
    setVendorStoreName: s.setVendorStoreName,
    setVendorBusinessCategory: s.setVendorBusinessCategory,
    setVendorBusinessAddress: s.setVendorBusinessAddress,
    setVendorOpenTime: s.setVendorOpenTime,
    setVendorCloseTime: s.setVendorCloseTime,
    setVendorBankName: s.setVendorBankName,
    setVendorAccountNumber: s.setVendorAccountNumber,
  }))
);

// Rider slice (with online toggle + earnings setters)
export const useRider = () => useAppStore(
  useShallow((s) => ({
    riderOnline: s.riderOnline,
    setRiderOnline: s.setRiderOnline,
    riderEarnings: s.riderEarnings,
    setRiderEarnings: s.setRiderEarnings,
    riderCompletedToday: s.riderCompletedToday,
    setRiderCompletedToday: s.setRiderCompletedToday,
    riderRating: s.riderRating,
    setRiderRating: s.setRiderRating,
    riderVehicleType: s.riderVehicleType,
    riderVehicleColor: s.riderVehicleColor,
    riderPlateNumber: s.riderPlateNumber,
    riderLicenseNumber: s.riderLicenseNumber,
    riderBankName: s.riderBankName,
    riderAccountNumber: s.riderAccountNumber,
    setRiderVehicleType: s.setRiderVehicleType,
    setRiderVehicleColor: s.setRiderVehicleColor,
    setRiderPlateNumber: s.setRiderPlateNumber,
    setRiderLicenseNumber: s.setRiderLicenseNumber,
    setRiderBankName: s.setRiderBankName,
    setRiderAccountNumber: s.setRiderAccountNumber,
  }))
);

// Customer onboarding slice
export const useCustomerOnboarding = () => useAppStore(
  useShallow((s) => ({
    customerDietaryPrefs: s.customerDietaryPrefs,
    setCustomerDietaryPrefs: s.setCustomerDietaryPrefs,
    customerFavoriteCategories: s.customerFavoriteCategories,
    setCustomerFavoriteCategories: s.setCustomerFavoriteCategories,
  }))
);

// Checkout slice (delivery + scheduling + payment + order placement)
export const useCheckout = () => useAppStore(
  useShallow((s) => ({
    checkoutStep: s.checkoutStep,
    setCheckoutStep: s.setCheckoutStep,
    deliveryAddress: s.deliveryAddress,
    setDeliveryAddress: s.setDeliveryAddress,
    deliveryInstructions: s.deliveryInstructions,
    setDeliveryInstructions: s.setDeliveryInstructions,
    iftarPrecision: s.iftarPrecision,
    setIftarPrecision: s.setIftarPrecision,
    sahurAlarm: s.sahurAlarm,
    setSahurAlarm: s.setSahurAlarm,
    paymentMethod: s.paymentMethod,
    setPaymentMethod: s.setPaymentMethod,
  }))
);

// Single-field misc selectors
export const useReferralCount = () => useAppStore(s => s.referralCount);
export const useSetActiveCategory = () => useAppStore(s => s.setActiveCategory);
export const useSetSelectedProduct = () => useAppStore(s => s.setSelectedProduct);
export const useSelectedProduct = () => useAppStore(s => s.selectedProduct);
export const useSetIsLoggedIn = () => useAppStore(s => s.setIsLoggedIn);
export const useSetUserName = () => useAppStore(s => s.setUserName);
export const useSetUserEmail = () => useAppStore(s => s.setUserEmail);
export const useUserEmail = () => useAppStore(s => s.userEmail);
export const useUserPhone = () => useAppStore(s => s.userPhone);
export const useUserAvatar = () => useAppStore(s => s.userAvatar);
export const useUserArea = () => useAppStore(s => s.userArea);
export const useSetUserPhone = () => useAppStore(s => s.setUserPhone);
export const useSetUserAvatar = () => useAppStore(s => s.setUserAvatar);
export const useSetShowAuth = () => useAppStore(s => s.setShowAuth);
export const useSetActiveModal = () => useAppStore(s => s.setActiveModal);
export const useSetActiveTab = () => useAppStore(s => s.setActiveTab);
export const useSetShowSearch = () => useAppStore(s => s.setShowSearch);
export const useSetOnboardingStep = () => useAppStore(s => s.setOnboardingStep);
export const useSetShowOnboarding = () => useAppStore(s => s.setShowOnboarding);
export const useSetOnboardingComplete = () => useAppStore(s => s.setOnboardingComplete);
export const useShowAuth = () => useAppStore(s => s.showAuth);
export const useActiveCategory = () => useAppStore(s => s.activeCategory);
export const useLastSpinDate = () => useAppStore(s => s.lastSpinDate);

// Adhan Sync + theme slice (prayer-time syncing)
export const useAdhanSync = () => useAppStore(
  useShallow((s) => ({
    adhanSyncEnabled: s.adhanSyncEnabled,
    setAdhanSyncEnabled: s.setAdhanSyncEnabled,
    appTheme: s.appTheme,
    setAppTheme: s.setAppTheme,
  }))
);

// Wishlist slice
export const useWishlist = () => useAppStore(
  useShallow((s) => ({
    wishlist: s.wishlist,
    toggleWishlist: s.toggleWishlist,
  }))
);

// Spin-wheel slice
export const useSpinWheel = () => useAppStore(
  useShallow((s) => ({
    lastSpinDate: s.lastSpinDate,
    setLastSpinDate: s.setLastSpinDate,
    spinStreak: s.spinStreak,
    setSpinStreak: s.setSpinStreak,
    pendingRewards: s.pendingRewards,
    addPendingReward: s.addPendingReward,
    claimReward: s.claimReward,
  }))
);

// Voice / speech slice
export const useVoice = () => useAppStore(
  useShallow((s) => ({
    isListening: s.isListening,
    setIsListening: s.setIsListening,
    voiceTranscript: s.voiceTranscript,
    setVoiceTranscript: s.setVoiceTranscript,
  }))
);

// Sahur alarm slice
export const useSahurAlarm = () => useAppStore(
  useShallow((s) => ({
    sahurAlarmTime: s.sahurAlarmTime,
    setSahurAlarmTime: s.setSahurAlarmTime,
    sahurAlarmEnabled: s.sahurAlarmEnabled,
    setSahurAlarmEnabled: s.setSahurAlarmEnabled,
  }))
);

// Referral slice
export const useReferral = () => useAppStore(
  useShallow((s) => ({
    referralCode: s.referralCode,
    setReferralCode: s.setReferralCode,
    referralCount: s.referralCount,
    incrementReferral: s.incrementReferral,
  }))
);

// Wallet & KYC slice
export const useWallet = () => useAppStore(
  useShallow((s) => ({
    walletBalance: s.walletBalance,
    setWalletBalance: s.setWalletBalance,
    kycStatus: s.kycStatus,
    setKycStatus: s.setKycStatus,
  }))
);

// Group buy slice
export const useGroupBuy = () => useAppStore(
  useShallow((s) => ({
    groupBuySlots: s.groupBuySlots,
    joinGroupBuy: s.joinGroupBuy,
  }))
);

// Challenge board slice
export const useChallenges = () => useAppStore(
  useShallow((s) => ({
    challengeProgress: s.challengeProgress,
    completeChallenge: s.completeChallenge,
  }))
);

// Cook-along slice
export const useCookAlong = () => useAppStore(
  useShallow((s) => ({
    activeRecipe: s.activeRecipe,
    setActiveRecipe: s.setActiveRecipe,
    setSmartKitchenInitialTab: s.setSmartKitchenInitialTab,
  }))
);

// Dua slice
export const useDailyDua = () => useAppStore(
  useShallow((s) => ({
    dailyDua: s.dailyDua,
    setDailyDua: s.setDailyDua,
  }))
);

// Gift-a-meal slice
export const useGiftAMeal = () => useAppStore(
  useShallow((s) => ({
    giftChainCount: s.giftChainCount,
    setGiftChainCount: s.setGiftChainCount,
  }))
);

// Mood / taste slice
export const useMood = () => useAppStore(
  useShallow((s) => ({
    currentMood: s.currentMood,
    setCurrentMood: s.setCurrentMood,
    tasteProfile: s.tasteProfile,
    setTasteProfile: s.setTasteProfile,
  }))
);

// Post-Ramadan slice
export const usePostRamadan = () => useAppStore(
  useShallow((s) => ({
    isPostRamadan: s.isPostRamadan,
    setIsPostRamadan: s.setIsPostRamadan,
  }))
);

// Diary slice
export const useDiary = () => useAppStore(
  useShallow((s) => ({
    diaryEntries: s.diaryEntries,
    addDiaryEntry: s.addDiaryEntry,
  }))
);

// Subscription slice
export const useSubscriptions = () => useAppStore(
  useShallow((s) => ({
    activeSubscription: s.activeSubscription,
    setActiveSubscription: s.setActiveSubscription,
  }))
);

// Gift card slice
export const useGiftCard = () => useAppStore(
  useShallow((s) => ({
    giftCardStep: s.giftCardStep,
    setGiftCardStep: s.setGiftCardStep,
    giftCardTheme: s.giftCardTheme,
    setGiftCardTheme: s.setGiftCardTheme,
    giftCardAmount: s.giftCardAmount,
    setGiftCardAmount: s.setGiftCardAmount,
    giftCardRecipient: s.giftCardRecipient,
    setGiftCardRecipient: s.setGiftCardRecipient,
    giftCardMessage: s.giftCardMessage,
    setGiftCardMessage: s.setGiftCardMessage,
    giftCardDeliveryMethod: s.giftCardDeliveryMethod,
    setGiftCardDeliveryMethod: s.setGiftCardDeliveryMethod,
    giftCardMood: s.giftCardMood,
    setGiftCardMood: s.setGiftCardMood,
    resetGiftCard: s.resetGiftCard,
  }))
);

// Rider live state slice (online flag + earnings + current delivery)
export const useRiderLive = () => useAppStore(
  useShallow((s) => ({
    riderOnline: s.riderOnline,
    setRiderOnline: s.setRiderOnline,
    riderCurrentDelivery: s.riderCurrentDelivery,
    setRiderCurrentDelivery: s.setRiderCurrentDelivery,
    riderEarnings: s.riderEarnings,
    setRiderEarnings: s.setRiderEarnings,
    riderCompletedToday: s.riderCompletedToday,
    setRiderCompletedToday: s.setRiderCompletedToday,
    riderRating: s.riderRating,
    setRiderRating: s.setRiderRating,
  }))
);

// Vendor live state slice (online flag + store + balance)
export const useVendorLive = () => useAppStore(
  useShallow((s) => ({
    vendorOnline: s.vendorOnline,
    setVendorOnline: s.setVendorOnline,
    vendorStoreName: s.vendorStoreName,
    setVendorStoreName: s.setVendorStoreName,
    vendorBalance: s.vendorBalance,
    setVendorBalance: s.setVendorBalance,
    vendorPendingSettlement: s.vendorPendingSettlement,
    setVendorPendingSettlement: s.setVendorPendingSettlement,
    vendorTotalEarnings: s.vendorTotalEarnings,
    setVendorTotalEarnings: s.setVendorTotalEarnings,
  }))
);
