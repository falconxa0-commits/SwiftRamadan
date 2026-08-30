'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useIsLoggedIn, useAppStore } from '@/lib/store-selectors';

/**
 * Floating AI Agent button — visible for ALL roles (customer, rider, vendor)
 * Opens the SafaAgentHub modal with role-appropriate agents
 */
export default function AIAgentButton() {
  const isLoggedIn = useIsLoggedIn();
  const setActiveModal = useAppStore(s => s.setActiveModal);

  if (!isLoggedIn) return null;

  return (
    <motion.button
      onClick={() => setActiveModal('agent-hub')}
      className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-[#10E07A] to-[#0ea05a] shadow-lg shadow-[#10E07A]/25 flex items-center justify-center group"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
      aria-label="Open AI Agent Hub"
    >
      <Sparkles className="w-5 h-5 text-black group-hover:animate-pulse" />
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full bg-[#10E07A]/30 animate-ping" />
    </motion.button>
  );
}
