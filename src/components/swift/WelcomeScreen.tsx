'use client';

import { useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Clock, Users, ChevronRight } from 'lucide-react';

export default function WelcomeScreen() {
  const { setShowWelcome, setShowAuth } = useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#064e3b] flex flex-col justify-between"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(#ffffff20 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }} />

      {/* Background Image */}
      <div className="absolute inset-0">
        <div className="w-full h-full bg-center bg-cover" style={{
          backgroundImage: 'url("/swiftramadan-hero.png")',
        }} />
        <div className="w-full h-full" style={{ background: 'linear-gradient(to bottom, rgba(6, 78, 59, 0.3) 0%, rgba(6, 78, 59, 0.85) 60%, #064e3b 100%)' }} />
      </div>

      {/* Content */}
      <div className="relative flex flex-col min-h-screen justify-between pt-12 pb-8 px-6">
        {/* Logo */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg shadow-[#f4c025]/20 overflow-hidden border-2 border-[#f4c025]/30">
            <img src="/swiftramadan-logo.png" alt="SwiftRamadan" className="w-full h-full object-cover" />
          </div>
          <span className="text-white text-xl font-extrabold tracking-tight uppercase">SwiftRamadan</span>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-6 text-center"
        >
          <div>
            <h1 className="text-white text-[38px] font-extrabold leading-tight tracking-tight">
              Elevate Your <br /><span className="text-[#f4c025]">Ramadan</span>
            </h1>
          </div>

          <div className="flex flex-col gap-4 bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="flex items-start gap-4 text-left">
              <Clock className="w-6 h-6 text-[#f4c025] shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold text-lg">Scheduled Iftar Deliveries</h3>
                <p className="text-white/80 text-sm leading-relaxed">Hot gourmet meals from top Lagos kitchens, timed perfectly for Maghrib.</p>
              </div>
            </div>
            <div className="h-px bg-white/10 w-full" />
            <div className="flex items-start gap-4 text-left">
              <Users className="w-6 h-6 text-[#f4c025] shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold text-lg">Group Buy Savings</h3>
                <p className="text-white/80 text-sm leading-relaxed">Enjoy premium Ramadan staples at wholesale prices through community pooling.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col gap-6"
        >
          <div className="flex w-full flex-row items-center justify-center gap-2">
            <div className="h-1.5 w-6 rounded-full bg-[#f4c025]" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => { setShowWelcome(false); setShowAuth('role'); }}
              className="flex w-full items-center justify-center rounded-xl h-14 px-5 bg-[#f4c025] text-[#064e3b] text-lg font-extrabold tracking-wide shadow-xl active:scale-[0.98] transition-transform"
            >
              Get Started
            </button>
            <button
              onClick={() => { setShowWelcome(false); setShowAuth('login'); }}
              className="flex w-full items-center justify-center py-2 text-white/90 text-sm font-medium"
            >
              Already have an account? <span className="text-[#f4c025] ml-1 font-bold underline underline-offset-4">Sign In</span>
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
