'use client';

import { motion } from 'framer-motion';
import {
  Bike, Star, DollarSign, CheckCircle, Clock,
  MapPin, Phone, Navigation, ToggleLeft, ToggleRight, ChevronRight,
  Package,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  formatNaira,
  riderActiveDeliveries,
  riderDeliveryRequests,
} from '@/lib/data';
import { toast } from '@/hooks/use-toast';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function RiderDashboard() {
  const {
    riderOnline,
    setRiderOnline,
    riderCompletedToday,
    riderRating,
    riderEarnings,
    riderCurrentDelivery,
    setActiveModal,
  } = useAppStore();

  const activeDelivery = riderCurrentDelivery
    ? riderActiveDeliveries.find(d => d.id === riderCurrentDelivery) || riderActiveDeliveries[0]
    : riderActiveDeliveries[0];

  const handleAccept = (id: string, customer: string) => {
    useAppStore.getState().setRiderCurrentDelivery(id);
    toast({
      title: 'Delivery Accepted! 🎉',
      description: `You accepted ${customer}'s order. Head to pickup!`,
    });
  };

  const handleDecline = (id: string) => {
    toast({
      title: 'Delivery Declined',
      description: `You declined delivery ${id}.`,
    });
  };

  return (
    <motion.main
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="flex-1 overflow-y-auto pb-32 px-4 pt-4"
    >
      {/* Online/Offline Toggle */}
      <motion.div variants={staggerItem} className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setRiderOnline(!riderOnline);
              toast({
                title: riderOnline ? 'You\'re Offline' : 'You\'re Online! 🟢',
                description: riderOnline
                  ? 'You won\'t receive new delivery requests'
                  : 'You\'ll now receive delivery requests',
              });
            }}
            className="relative"
          >
            {riderOnline ? (
              <ToggleRight className="w-12 h-12 text-[#13ec13]" />
            ) : (
              <ToggleLeft className="w-12 h-12 text-white/30" />
            )}
          </button>
          <div>
            <p className={`text-sm font-bold ${riderOnline ? 'text-[#13ec13]' : 'text-white/40'}`}>
              {riderOnline ? 'Online' : 'Offline'}
            </p>
            <p className="text-white/30 text-[10px]">Toggle to receive deliveries</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
          riderOnline ? 'bg-[#13ec13]/10 text-[#13ec13] border border-[#13ec13]/20' : 'bg-white/5 text-white/30 border border-white/5'
        }`}>
          <span className={`size-2 rounded-full ${riderOnline ? 'bg-[#13ec13] animate-pulse' : 'bg-white/20'}`} />
          {riderOnline ? 'Accepting Orders' : 'Not Available'}
        </div>
      </motion.div>

      {/* Profile Header */}
      <motion.div variants={staggerItem} className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#13ec13]/30 to-[#13ec13]/5 flex items-center justify-center border border-[#13ec13]/20 green-glow">
            <Bike className="w-7 h-7 text-[#13ec13]" />
          </div>
          {riderOnline && (
            <span className="absolute -bottom-1 -right-1 size-4 bg-[#13ec13] rounded-full border-2 border-[#05070A] animate-pulse" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-white text-lg font-extrabold">Babatunde Yusuf</h2>
            <span className="material-symbols-outlined text-[#13ec13] text-lg">verified</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="material-symbols-outlined text-[#FFD700] text-sm">workspace_premium</span>
            <span className="text-[#FFD700] text-xs font-bold">Elite Rider</span>
            <span className="text-white/20 text-xs">•</span>
            <span className="text-white/40 text-xs">Lagos Island</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/20" />
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={staggerItem} className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5 text-center">
          <div className="w-10 h-10 bg-[#13ec13]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-5 h-5 text-[#13ec13]" />
          </div>
          <p className="text-white text-xl font-extrabold">{riderCompletedToday}</p>
          <p className="text-white/40 text-[10px] mt-0.5">Completed Today</p>
        </div>
        <div className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5 text-center">
          <div className="w-10 h-10 bg-[#FFD700]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Star className="w-5 h-5 text-[#FFD700]" />
          </div>
          <p className="text-white text-xl font-extrabold">{riderRating}</p>
          <p className="text-white/40 text-[10px] mt-0.5">Rating</p>
        </div>
        <div className="bg-[#1A1D26] rounded-2xl p-4 border border-white/5 text-center">
          <div className="w-10 h-10 bg-[#13ec13]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
            <DollarSign className="w-5 h-5 text-[#13ec13]" />
          </div>
          <p className="text-white text-base font-extrabold">{formatNaira(riderEarnings)}</p>
          <p className="text-white/40 text-[10px] mt-0.5">Earnings</p>
        </div>
      </motion.div>

      {/* Iftar Rush Legend Badge */}
      <motion.div variants={staggerItem} className="mb-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFD700]/10 to-[#FFD700]/5 border border-[#FFD700]/20 p-4 gold-glow">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#FFD700]/5 blur-[80px]" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FFD700]/20 rounded-2xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#FFD700] text-2xl">bedtime</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-[#FFD700] font-extrabold text-sm">Iftar Rush Active</h3>
                <span className="px-2 py-0.5 bg-[#FFD700]/20 rounded-full text-[#FFD700] text-[8px] font-black uppercase tracking-wider">
                  Ramadan Exclusive
                </span>
              </div>
              <p className="text-white/40 text-xs mt-1">2x bonus on all Iftar deliveries until Maghrib</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Active Delivery Card */}
      {activeDelivery && (
        <motion.div variants={staggerItem} className="mb-6">
          <h3 className="text-white text-sm font-extrabold mb-3 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-[#13ec13]" />
            Active Delivery
          </h3>
          <div className="relative overflow-hidden rounded-2xl bg-[#1A1D26] border border-[#13ec13]/20 p-4">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#13ec13]/5 blur-[50px]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-2 bg-[#13ec13] rounded-full animate-pulse" />
                  <span className="text-[#13ec13] text-xs font-bold uppercase tracking-widest">In Progress</span>
                </div>
                <span className="text-white/30 text-[10px] font-mono">{activeDelivery.id}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/5 rounded-full h-2 mb-3">
                <motion.div
                  className="bg-[#13ec13] h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${activeDelivery.progress}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </div>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-bold text-sm">{activeDelivery.customer}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-white/30" />
                    <p className="text-white/40 text-xs">{activeDelivery.address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[#13ec13] text-sm font-bold">ETA {activeDelivery.eta}</p>
                  <p className="text-white/40 text-xs">{activeDelivery.items}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast({ title: 'Calling Customer 📞', description: `Connecting to ${activeDelivery.customer}...` })}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#13ec13]/10 border border-[#13ec13]/20 text-[#13ec13] py-2.5 rounded-xl font-bold text-xs hover:bg-[#13ec13]/20 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call
                </button>
                <button
                  onClick={() => useAppStore.getState().setActiveTab('rider-deliveries')}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-white/10 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Navigate
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* New Delivery Request CTA */}
      {riderOnline && !riderCurrentDelivery && (
        <motion.div variants={staggerItem} className="mb-6">
          <button
            onClick={() => setActiveModal('new-delivery')}
            className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#13ec13]/20 to-[#13ec13]/5 border border-[#13ec13]/30 p-4 flex items-center gap-4 hover:border-[#13ec13]/50 transition-all active:scale-[0.98]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#13ec13]/10 blur-[50px]" />
            <div className="w-12 h-12 bg-[#13ec13]/20 rounded-2xl flex items-center justify-center shrink-0 relative z-10">
              <Package className="w-6 h-6 text-[#13ec13]" />
            </div>
            <div className="flex-1 text-left relative z-10">
              <h3 className="text-white font-extrabold text-sm">New Delivery Request</h3>
              <p className="text-white/40 text-xs mt-0.5">{riderDeliveryRequests.length} deliveries waiting for you</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#13ec13] shrink-0 relative z-10" />
          </button>
        </motion.div>
      )}

      {/* Delivery Requests */}
      <motion.div variants={staggerItem} className="mb-6">
        <h3 className="text-white text-sm font-extrabold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#FFD700]" />
          Delivery Requests
          <span className="ml-auto px-2 py-0.5 bg-[#FFD700]/10 rounded-full text-[#FFD700] text-[10px] font-bold">
            {riderDeliveryRequests.length} new
          </span>
        </h3>
        <div className="space-y-3">
          {riderDeliveryRequests.map((req, i) => (
            <motion.div
              key={req.id}
              variants={staggerItem}
              className="bg-[#1A1D26] rounded-2xl border border-white/5 p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold text-sm">{req.customer}</p>
                    {req.priority === 'iftar' && (
                      <span className="px-1.5 py-0.5 bg-[#FFD700]/15 text-[#FFD700] text-[8px] font-black rounded uppercase">
                        Iftar
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-white/30" />
                    <p className="text-white/40 text-xs">{req.address}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white font-bold text-sm">{formatNaira(req.amount)}</p>
                  <p className="text-[#13ec13] text-[10px] font-bold">+{formatNaira(req.deliveryFee)} fee</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3 text-[10px] text-white/30">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">timer</span>
                  <span className={req.minutesUntilIftar <= 25 ? 'text-red-400 font-bold' : 'text-white/40'}>
                    {req.minutesUntilIftar} min to Iftar
                  </span>
                </div>
                <span>•</span>
                <span>{req.distance}</span>
                <span>•</span>
                <span>{req.items}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAccept(req.id, req.customer)}
                  className="flex-1 bg-[#13ec13] text-[#05070A] py-2.5 rounded-xl font-bold text-xs hover:bg-[#13ec13]/90 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(req.id)}
                  className="flex-1 bg-white/5 border border-white/10 text-white/60 py-2.5 rounded-xl font-bold text-xs hover:bg-white/10 transition-colors"
                >
                  Decline
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.main>
  );
}
