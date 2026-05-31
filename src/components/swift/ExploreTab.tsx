'use client';

import { categoryHubItems, popularRetailers, quickActions, formatNaira } from '@/lib/data';
import { motion } from 'framer-motion';

export default function ExploreTab() {
  return (
    <main className="flex-1 overflow-y-auto pb-32">
      {/* Welcome */}
      <div className="px-4 pt-6 pb-2">
        <p className="text-[#13ec13] text-sm font-semibold uppercase tracking-widest mb-1">Welcome back</p>
        <h1 className="text-2xl font-bold">What do you need today?</h1>
      </div>

      {/* Category Grid */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          {categoryHubItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="relative group cursor-pointer overflow-hidden rounded-xl aspect-square flex flex-col justify-end p-4 border border-white/5"
              style={{
                backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.2) 100%), url('${item.image}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <span className="absolute top-2 right-2 bg-[#13ec13] text-[#05070A] text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">
                {item.badge}
              </span>
              <p className="text-white text-lg font-bold">{item.name}</p>
              <p className="text-white/70 text-xs">{item.subtitle}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Seasonal Specials */}
      <div className="pt-6">
        <div className="flex items-center justify-between px-4 mb-4">
          <h2 className="text-xl font-bold">Seasonal Specials</h2>
          <a className="text-[#13ec13] text-sm font-semibold cursor-pointer">View all</a>
        </div>
        <div className="px-4">
          <div className="relative overflow-hidden rounded-xl bg-[#064e3b]/30 border border-[#064e3b]/50 p-1">
            <div
              className="relative w-full aspect-video rounded-lg overflow-hidden bg-center bg-cover"
              style={{
                backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDDF4-GoodOTLUDyQnwOEvYYvl2l51vWw1eYC-Je1fXSKuiYobyjy9Zoi3IIe11uiZvo5_ehJm8r2Q1XnPxIJ3OI1n9mk3BJtSvZjqDFrWMm_x9KONVZ43IOkiHMRWJ9Q-N_u5PdLdRZp31i3-ioWbJLOiO2peOFhDrRmi5G7-WNgYvhGxKFilETsLQuDHTS0XZ7yPSqI92EMm27uldl8SczSgPb78xUST3CjkFC41kRKNKIqWfYWGLyT0wnIzFQfeeh0vg0GMg6LL8")',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#064e3b] to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="inline-block bg-[#f2b90d]/90 text-[#05070A] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mb-2">Ramadan Kareem</span>
                <h3 className="text-2xl font-bold text-white leading-tight">Premium Ramadan Boxes</h3>
              </div>
            </div>
            <div className="p-4 bg-[#05070A]/40 backdrop-blur-sm rounded-b-lg">
              <p className="text-white/80 text-sm mb-4 leading-relaxed">
                Curated Iftar &amp; Sahur boxes filled with dates, fruits, and nutritious meals to keep you energized.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/50 uppercase">Starting from</span>
                  <span className="text-[#f2b90d] font-bold">{formatNaira(15000)}</span>
                </div>
                <button className="bg-[#13ec13] hover:bg-[#13ec13]/90 text-[#05070A] font-bold py-2 px-6 rounded-lg transition-colors text-sm">
                  Shop Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Retailers */}
      <div className="px-4 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-extrabold">Popular Retailers</h3>
          <span className="text-[#13ec13] text-sm font-bold cursor-pointer">Explore All</span>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
          {popularRetailers.map((retailer) => (
            <div key={retailer.id} className="min-w-[160px] bg-[#1A1D26] rounded-2xl p-3 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
              <div
                className="w-full aspect-square bg-center bg-no-repeat bg-cover rounded-xl mb-3"
                style={{ backgroundImage: `url("${retailer.image}")` }}
              />
              <h4 className="text-white text-sm font-bold">{retailer.name}</h4>
              <p className="text-white/40 text-[10px]">{retailer.category} • {retailer.deliveryTime}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-8">
        <h2 className="text-xl font-bold mb-4">Your Favorites</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {quickActions.map((action) => (
            <div key={action.id} className="flex-shrink-0 w-20 flex flex-col items-center gap-2 cursor-pointer">
              <div className="size-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined text-[#f2b90d] text-2xl">{action.icon}</span>
              </div>
              <span className="text-[10px] font-medium text-center text-white/70">{action.name}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
