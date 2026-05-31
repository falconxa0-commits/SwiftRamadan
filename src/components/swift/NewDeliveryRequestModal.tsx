'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Package, Navigation, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatNaira, riderDeliveryRequests } from '@/lib/data';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

function CountdownTimer({ minutes, isUrgent }: { minutes: number; isUrgent: boolean }) {
  const [countdown, setCountdown] = useState(minutes);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
      isUrgent ? 'bg-red-500/15' : 'bg-[#13ec13]/10'
    }`}>
      <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-400' : 'text-[#13ec13]'}`} />
      <span className={`text-sm font-black ${isUrgent ? 'text-red-400' : 'text-[#13ec13]'}`}>
        {countdown} min
      </span>
    </div>
  );
}

export default function NewDeliveryRequestModal() {
  const { activeModal, setActiveModal, setRiderCurrentDelivery } = useAppStore();
  const isOpen = activeModal === 'new-delivery';

  const request = riderDeliveryRequests[0];

  const handleAccept = () => {
    if (request) {
      setRiderCurrentDelivery(request.id);
      toast({
        title: 'Delivery Accepted! 🎉',
        description: `Head to ${request.pickupAddress} for pickup.`,
      });
    }
    setActiveModal(null);
  };

  const handleDecline = () => {
    toast({
      title: 'Delivery Declined',
      description: 'You declined this delivery request.',
    });
    setActiveModal(null);
  };

  if (!request) return null;

  const isUrgent = request.minutesUntilIftar <= 25;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Full-screen Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            onClick={() => setActiveModal(null)}
          />

          {/* Modal - Slide-up Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[100] max-h-[85vh]"
          >
            <div className="bg-[#1A1D26] rounded-t-3xl border-t border-white/10 overflow-hidden">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-white/10 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-[#13ec13]/10 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#13ec13] text-xl">moped</span>
                  </div>
                  <div>
                    <h2 className="text-white text-base font-extrabold">New Delivery Request</h2>
                    <p className="text-white/30 text-[10px]">{request.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>

              {/* Content */}
              <div className="px-5 pb-6 overflow-y-auto max-h-[65vh] custom-scrollbar">
                {/* Iftar Countdown */}
                <div className={`rounded-2xl p-4 mb-4 border ${
                  isUrgent
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-[#13ec13]/5 border-[#13ec13]/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg" style={{ color: isUrgent ? '#ef4444' : '#13ec13' }}>
                        timer
                      </span>
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        isUrgent ? 'text-red-400' : 'text-[#13ec13]'
                      }`}>
                        {isUrgent ? 'Urgent - Iftar Delivery' : 'Iftar Delivery'}
                      </span>
                    </div>
                    <CountdownTimer minutes={request.minutesUntilIftar} isUrgent={isUrgent} />
                  </div>
                  <p className="text-white/30 text-[10px] mt-2">
                    Iftar at {request.iftarDeadline} &bull; Deliver before Maghrib
                  </p>
                </div>

                {/* Customer Info */}
                <div className="bg-[#05070A]/50 rounded-2xl p-4 mb-3 border border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 bg-[#13ec13]/10 rounded-full flex items-center justify-center border border-[#13ec13]/20">
                      <span className="material-symbols-outlined text-[#13ec13] text-lg">person</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-bold">{request.customer}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-white/30" />
                        <p className="text-white/40 text-xs">{request.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Ordered */}
                <div className="bg-[#05070A]/50 rounded-2xl p-4 mb-3 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-white/30" />
                    <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Items Ordered</span>
                  </div>
                  <p className="text-white text-sm">{request.items}</p>
                </div>

                {/* Pickup Address */}
                <div className="bg-[#05070A]/50 rounded-2xl p-4 mb-3 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="w-4 h-4 text-[#13ec13]" />
                    <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Pickup</span>
                  </div>
                  <p className="text-white text-sm">{request.pickupAddress}</p>
                  <p className="text-white/30 text-[10px] mt-1">{request.distance} from your location</p>
                </div>

                {/* Payment Summary */}
                <div className="bg-[#05070A]/50 rounded-2xl p-4 mb-5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/40 text-xs">Order Total</span>
                    <span className="text-white text-sm font-bold">{formatNaira(request.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/40 text-xs">Delivery Fee</span>
                    <span className="text-[#13ec13] text-sm font-bold">+{formatNaira(request.deliveryFee)}</span>
                  </div>
                  <div className="h-px bg-white/5 my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs font-bold">You Earn</span>
                    <span className="text-[#FFD700] text-lg font-black">{formatNaira(request.deliveryFee)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDecline}
                    className="flex-1 bg-white/5 border border-white/10 text-white/60 py-4 rounded-2xl font-bold text-sm hover:bg-white/10 transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleAccept}
                    className="flex-1 bg-[#13ec13] text-[#05070A] py-4 rounded-2xl font-black text-sm hover:bg-[#13ec13]/90 transition-colors green-glow flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">moped</span>
                    Accept Delivery
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
