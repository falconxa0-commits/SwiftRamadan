'use client';

import { User, Settings, CreditCard, Bell, Heart, Shield, Leaf, ChevronRight, Award, Gift, Users, MapPin } from 'lucide-react';
import { loyaltyData, charityItems, formatNaira } from '@/lib/data';

const menuItems = [
  { icon: CreditCard, label: 'Pay Small-Small (BNPL)', subtitle: 'Buy now, pay later', color: 'text-[#13ec13]' },
  { icon: Gift, label: 'SwiftRewards', subtitle: `${loyaltyData.points.toLocaleString()} points`, color: 'text-[#FFD700]' },
  { icon: Users, label: 'Refer & Earn', subtitle: 'Get ₦2,000 per referral', color: 'text-cyan-400' },
  { icon: Heart, label: 'Charity & Zakat', subtitle: 'Make a difference', color: 'text-rose-400' },
  { icon: Leaf, label: 'Eco-Impact Report', subtitle: 'Your green footprint', color: 'text-emerald-400' },
  { icon: Bell, label: 'Notifications', subtitle: '3 unread', color: 'text-amber-400' },
  { icon: MapPin, label: 'Delivery Addresses', subtitle: '2 saved locations', color: 'text-purple-400' },
  { icon: Shield, label: 'Security & Privacy', subtitle: 'Biometric access', color: 'text-blue-400' },
  { icon: Settings, label: 'Settings', subtitle: 'App preferences', color: 'text-white/50' },
];

export default function ProfileTab() {
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/30 to-[#05070A] border border-emerald-500/20 p-5">
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
      </div>

      {/* Menu Items */}
      <div className="px-4 mt-6">
        <div className="space-y-2">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-[#1A1D26]/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{item.label}</p>
                  <p className="text-white/40 text-xs">{item.subtitle}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20" />
              </div>
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
            <div key={item.id} className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
              <span className="material-symbols-outlined text-[#FFD700] text-2xl mb-2">{item.icon}</span>
              <p className="text-white font-bold text-sm">{item.name}</p>
              <p className="text-white/40 text-[10px] mt-0.5">{item.description}</p>
              <p className="text-[#13ec13] text-xs font-bold mt-2">From {formatNaira(item.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
