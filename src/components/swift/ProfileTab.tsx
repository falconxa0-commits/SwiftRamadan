'use client';

import { User, Settings, CreditCard, Bell, Heart, Shield, Leaf, ChevronRight, Award, Gift, Users, MapPin, X } from 'lucide-react';
import { loyaltyData, charityItems, formatNaira } from '@/lib/data';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const menuItems = [
  { icon: CreditCard, label: 'Pay Small-Small (BNPL)', subtitle: 'Buy now, pay later', color: 'text-[#13ec13]', action: 'bnpl' },
  { icon: Gift, label: 'SwiftRewards', subtitle: `${loyaltyData.points.toLocaleString()} points`, color: 'text-[#FFD700]', action: 'rewards' },
  { icon: Users, label: 'Refer & Earn', subtitle: 'Get ₦2,000 per referral', color: 'text-cyan-400', action: 'refer' },
  { icon: Heart, label: 'Charity & Zakat', subtitle: 'Make a difference', color: 'text-rose-400', action: 'charity' },
  { icon: Leaf, label: 'Eco-Impact Report', subtitle: 'Your green footprint', color: 'text-emerald-400', action: 'eco' },
  { icon: Bell, label: 'Notifications', subtitle: '3 unread', color: 'text-amber-400', action: 'notifications' },
  { icon: MapPin, label: 'Delivery Addresses', subtitle: '2 saved locations', color: 'text-purple-400', action: 'addresses' },
  { icon: Shield, label: 'Security & Privacy', subtitle: 'Biometric access', color: 'text-blue-400', action: 'security' },
  { icon: Settings, label: 'Settings', subtitle: 'App preferences', color: 'text-white/50', action: 'settings' },
];

interface ModalContent {
  title: string;
  content: React.ReactNode;
}

export default function ProfileTab() {
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContent>({ title: '', content: null });
  const { toast } = useToast();

  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'bnpl':
        useAppStore.getState().setActiveModal('bnpl');
        break;
      case 'refer':
        useAppStore.getState().setActiveModal('refer');
        break;
      case 'charity':
        useAppStore.getState().setActiveModal('charity');
        break;
      case 'rewards':
        useAppStore.getState().setActiveModal('rewards');
        break;
      case 'eco':
        setModalContent({
          title: 'Eco-Impact Report',
          content: (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#1A1D26] p-3 rounded-xl border border-white/5 text-center">
                  <p className="text-emerald-400 text-xl font-black">8.2kg</p>
                  <p className="text-white/40 text-[10px]">CO₂ Saved</p>
                </div>
                <div className="bg-[#1A1D26] p-3 rounded-xl border border-white/5 text-center">
                  <p className="text-white text-xl font-black">15</p>
                  <p className="text-white/40 text-[10px]">Eco Orders</p>
                </div>
                <div className="bg-[#1A1D26] p-3 rounded-xl border border-white/5 text-center">
                  <p className="text-white text-xl font-black">₦3K</p>
                  <p className="text-white/40 text-[10px]">Donated</p>
                </div>
              </div>
              <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/20">
                <p className="text-emerald-400 font-bold text-sm mb-2">🌱 Your Impact</p>
                <p className="text-white/60 text-xs leading-relaxed">
                  By choosing eco-friendly packaging and delivery options, you&apos;ve saved the equivalent of planting 3 trees this Ramadan!
                </p>
              </div>
            </div>
          ),
        });
        setShowModal(true);
        break;
      case 'notifications':
        toast({ title: 'Notifications 🔔', description: 'Tap the bell icon in the top right to see your notifications' });
        break;
      case 'addresses':
        setModalContent({
          title: 'Delivery Addresses',
          content: (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#1A1D26] rounded-xl border border-[#13ec13]/20">
                <MapPin className="w-5 h-5 text-[#13ec13] shrink-0" />
                <div>
                  <p className="text-white font-bold text-sm">Home</p>
                  <p className="text-white/40 text-xs">12 Admiralty Way, Lekki Phase 1</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#1A1D26] rounded-xl border border-white/5">
                <MapPin className="w-5 h-5 text-white/30 shrink-0" />
                <div>
                  <p className="text-white font-bold text-sm">Office</p>
                  <p className="text-white/40 text-xs">15 Marina Street, Lagos Island</p>
                </div>
              </div>
              <button className="w-full p-3 border border-dashed border-white/10 rounded-xl text-white/40 text-sm hover:border-[#13ec13]/20 hover:text-[#13ec13] transition-colors">
                + Add New Address
              </button>
            </div>
          ),
        });
        setShowModal(true);
        break;
      case 'security':
        setModalContent({
          title: 'Security & Privacy',
          content: (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-[#1A1D26] rounded-xl border border-white/5">
                <div>
                  <p className="text-white font-bold text-sm">Biometric Login</p>
                  <p className="text-white/40 text-xs">Use fingerprint or Face ID</p>
                </div>
                <span className="text-[#13ec13] text-xs font-bold">Enabled</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#1A1D26] rounded-xl border border-white/5">
                <div>
                  <p className="text-white font-bold text-sm">Two-Factor Auth</p>
                  <p className="text-white/40 text-xs">Extra security for your account</p>
                </div>
                <span className="text-[#13ec13] text-xs font-bold">Enabled</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#1A1D26] rounded-xl border border-white/5">
                <div>
                  <p className="text-white font-bold text-sm">Data Encryption</p>
                  <p className="text-white/40 text-xs">End-to-end encryption</p>
                </div>
                <span className="text-[#13ec13] text-xs font-bold">Active</span>
              </div>
            </div>
          ),
        });
        setShowModal(true);
        break;
      case 'settings':
        toast({ title: 'Settings ⚙️', description: 'App preferences panel coming soon!' });
        break;
    }
  };

  const handleCharityClick = (item: typeof charityItems[0]) => {
    if (item.amount > 0) {
      useAppStore.getState().addToCart({
        id: 500 + item.id,
        name: `Donation: ${item.name}`,
        price: item.amount,
        image: '',
      });
      toast({ title: `${item.name} 💚`, description: `Donation of ${formatNaira(item.amount)} added to cart` });
    } else {
      toast({ title: 'Zakat Calculator 🧮', description: 'Calculate your Zakat based on your assets' });
    }
  };

  return (
    <main className="flex-1 overflow-y-auto pb-32">
      {/* Profile Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#13ec13]/20 rounded-full flex items-center justify-center border border-[#13ec13]/30 green-glow">
            <User className="w-8 h-8 text-[#13ec13]" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">Bolaji Ahmed</h2>
            <p className="text-white/50 text-sm">Lekki Phase 1, Lagos</p>
            <div className="flex items-center gap-1 mt-1">
              <Award className="w-3 h-3 text-[#FFD700] fill-[#FFD700]" />
              <span className="text-[#FFD700] text-xs font-bold">{loyaltyData.tier}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1A1D26] rounded-2xl p-4 text-center border border-white/5">
            <p className="text-[#13ec13] text-xl font-black">{loyaltyData.points.toLocaleString()}</p>
            <p className="text-white/40 text-[10px] font-bold uppercase">Points</p>
          </div>
          <div className="bg-[#1A1D26] rounded-2xl p-4 text-center border border-white/5">
            <p className="text-[#FFD700] text-xl font-black">12</p>
            <p className="text-white/40 text-[10px] font-bold uppercase">Orders</p>
          </div>
          <div className="bg-[#1A1D26] rounded-2xl p-4 text-center border border-white/5">
            <p className="text-white text-xl font-black">3</p>
            <p className="text-white/40 text-[10px] font-bold uppercase">Referrals</p>
          </div>
        </div>
      </div>

      {/* Eco Impact */}
      <div className="px-4 mt-6">
        <button
          onClick={() => handleMenuClick('eco')}
          className="w-full text-left"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/30 to-[#05070A] border border-emerald-500/20 p-5 hover:border-emerald-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-[40px]" />
            <div className="flex items-center gap-3 mb-3">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Eco Impact</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-white text-lg font-black">8.2kg</p>
                <p className="text-white/40 text-[10px]">CO₂ Saved</p>
              </div>
              <div className="text-center">
                <p className="text-white text-lg font-black">15</p>
                <p className="text-white/40 text-[10px]">Eco Orders</p>
              </div>
              <div className="text-center">
                <p className="text-white text-lg font-black">₦3K</p>
                <p className="text-white/40 text-[10px]">Donated</p>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Menu Items */}
      <div className="px-4 mt-6">
        <div className="space-y-2">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={i}
                onClick={() => handleMenuClick(item.action)}
                className="flex items-center gap-4 p-4 bg-[#1A1D26]/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors w-full text-left"
              >
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{item.label}</p>
                  <p className="text-white/40 text-xs">{item.subtitle}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Charity Quick Actions */}
      <div className="px-4 mt-6 mb-6">
        <h3 className="text-white text-lg font-extrabold mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-400" />
          Give Back This Ramadan
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {charityItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => handleCharityClick(item)}
              className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5 cursor-pointer hover:border-white/10 transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[#FFD700] text-2xl mb-2">{item.icon}</span>
              <p className="text-white font-bold text-sm">{item.name}</p>
              <p className="text-white/40 text-[10px] mt-0.5">{item.description}</p>
              {item.amount > 0 && (
                <p className="text-[#13ec13] text-xs font-bold mt-2">From {formatNaira(item.amount)}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-[70]"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-h-[70vh] bg-[#0F1117] rounded-t-3xl z-[80] flex flex-col overflow-hidden border-t border-white/10"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h2 className="text-white font-bold">{modalContent.title}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {modalContent.content}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
