'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KingdomCheckoutModal } from '@/kingdom-ui/pages/CheckoutModal';
import { useAppStore } from '@/lib/store';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Open the checkout modal on mount (preserves the same store hook
    // semantics as the legacy CartTab's "Proceed to Checkout" flow).
    useAppStore.getState().setCheckoutStep(0);
    useAppStore.getState().setActiveModal('checkout');
    return () => {
      // Cleanup store state on unmount so the modal doesn't re-open
      // when navigating back here from a sibling route.
      useAppStore.getState().setActiveModal(null);
    };
  }, []);

  return (
    <KingdomCheckoutModal
      onClosed={() => router.push('/kingdom/cart')}
    />
  );
}
