import { create } from 'zustand';

export type TabId = 'home' | 'explore' | 'cart' | 'orders' | 'offers' | 'profile';

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

interface AppState {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;
  cartCount: number;
  setCartCount: (count: number) => void;
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  selectedProduct: number | null;
  setSelectedProduct: (id: number | null) => void;

  // Cart
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, qty: number) => void;
  clearCart: () => void;

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
}

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
  showWelcome: true,
  setShowWelcome: (show) => set({ showWelcome: show }),
  cartCount: 0,
  setCartCount: (count) => set({ cartCount: count }),
  activeModal: null,
  setActiveModal: (modal) => set({ activeModal: modal }),
  selectedProduct: null,
  setSelectedProduct: (id) => set({ selectedProduct: id }),

  // Cart
  cartItems: [],
  addToCart: (item) => {
    const { cartItems } = get();
    const existing = cartItems.find(ci => ci.id === item.id);
    let newItems: CartItem[];
    if (existing) {
      newItems = cartItems.map(ci =>
        ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
      );
    } else {
      newItems = [...cartItems, { ...item, quantity: 1 }];
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
}));
