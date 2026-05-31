import { create } from 'zustand';

export type TabId = 'home' | 'explore' | 'cart' | 'orders' | 'profile';

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
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
  showWelcome: true,
  setShowWelcome: (show) => set({ showWelcome: show }),
  cartCount: 2,
  setCartCount: (count) => set({ cartCount: count }),
  activeModal: null,
  setActiveModal: (modal) => set({ activeModal: modal }),
  selectedProduct: null,
  setSelectedProduct: (id) => set({ selectedProduct: id }),
}));
