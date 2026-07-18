'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, MapPin, Clock, Fuel, Battery, Navigation, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const chargingStations = [
  {
    id: 1,
    name: 'Lekki EV Hub',
    distance: '0.8 km',
    type: 'EV Charging' as const,
    availability: 4,
    totalSlots: 6,
    estimatedWait: '0 min',
    connectorTypes: ['Type 2', 'CCS'],
    isOpen: true,
  },
  {
    id: 2,
    name: 'TotalEnergies Victoria Island',
    distance: '1.5 km',
    type: 'Fuel Station' as const,
    availability: null,
    totalSlots: null,
    estimatedWait: '2 min',
    connectorTypes: ['Petrol', 'Diesel'],
    isOpen: true,
  },
  {
    id: 3,
    name: 'Ikoyi Charging Point',
    distance: '2.3 km',
    type: 'EV Charging' as const,
    availability: 1,
    totalSlots: 4,
    estimatedWait: '15 min',
    connectorTypes: ['Type 2'],
    isOpen: true,
  },
  {
    id: 4,
    name: 'NNPC Mega Station',
    distance: '3.1 km',
    type: 'Fuel Station' as const,
    availability: null,
    totalSlots: null,
    estimatedWait: '5 min',
    connectorTypes: ['Petrol', 'Diesel', 'CNG'],
    isOpen: true,
  },
  {
    id: 5,
    name: 'Surulere Fast Charge',
    distance: '4.7 km',
    type: 'EV Charging' as const,
    availability: 0,
    totalSlots: 3,
    estimatedWait: '30 min',
    connectorTypes: ['CCS', 'CHAdeMO'],
    isOpen: false,
  },
  {
    id: 6,
    name: 'Oando Service Station',
    distance: '5.2 km',
    type: 'Fuel Station' as const,
    availability: null,
    totalSlots: null,
    estimatedWait: '3 min',
    connectorTypes: ['Petrol'],
    isOpen: true,
  },
];

export default function RiderPowerFinderModal() {
  const { activeModal, setActiveModal } = useAppStore();
  const isOpen = activeModal === 'rider-power-finder';

  const handleClose = () => {
    setActiveModal(null);
  };

  const evStations = chargingStations.filter(s => s.type === 'EV Charging');
  const fuelStations = chargingStations.filter(s => s.type === 'Fuel Station');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[90]"
            onClick={handleClose}
          />
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#0F1117] rounded-t-3xl z-[100] flex flex-col overflow-hidden border-t border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F5C451]/10 flex items-center justify-center border border-[#F5C451]/20">
                  <Zap className="w-5 h-5 text-[#F5C451]" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Power Finder</h2>
                  <p className="text-white/40 text-xs mt-0.5">Charging & fuel near you</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-8 custom-scrollbar">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-[#10E07A]/5 border border-[#10E07A]/20 rounded-xl p-3 text-center">
                  <p className="text-[#10E07A] text-xl font-black">{evStations.filter(s => (s.availability ?? 0) > 0).length}</p>
                  <p className="text-white/40 text-[10px] font-bold uppercase">EV Available</p>
                </div>
                <div className="bg-[#F5C451]/5 border border-[#F5C451]/20 rounded-xl p-3 text-center">
                  <p className="text-[#F5C451] text-xl font-black">{fuelStations.filter(s => s.isOpen).length}</p>
                  <p className="text-white/40 text-[10px] font-bold uppercase">Fuel Open</p>
                </div>
              </div>

              {/* EV Charging Stations */}
              <div className="mt-5">
                <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <Battery className="w-4 h-4 text-[#10E07A]" />
                  EV Charging Stations
                </h4>
                <div className="space-y-2">
                  {evStations.map((station, i) => (
                    <motion.div
                      key={station.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + i * 0.06 }}
                      className={`bg-[#1A1D26] rounded-2xl p-4 border transition-all ${
                        station.availability !== null && station.availability > 0
                          ? 'border-[#10E07A]/20'
                          : 'border-white/5 opacity-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Station Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          station.availability !== null && station.availability > 0
                            ? 'bg-[#10E07A]/10 border border-[#10E07A]/20'
                            : 'bg-white/5 border border-white/10'
                        }`}>
                          <Battery className={`w-5 h-5 ${station.availability !== null && station.availability > 0 ? 'text-[#10E07A]' : 'text-white/20'}`} />
                        </div>

                        {/* Station Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-bold text-sm truncate">{station.name}</p>
                            {!station.isOpen && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                                CLOSED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <MapPin className="w-3 h-3 text-white/20" />
                            <span className="text-white/40 text-xs">{station.distance}</span>
                          </div>

                          {/* Availability */}
                          {station.availability !== null && (
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex gap-1">
                                {Array.from({ length: station.totalSlots ?? 0 }).map((_, slot) => (
                                  <div
                                    key={slot}
                                    className={`w-3 h-3 rounded-sm ${
                                      slot < (station.availability ?? 0)
                                        ? 'bg-[#10E07A]'
                                        : 'bg-white/10'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-white/30 text-[10px]">
                                {station.availability}/{station.totalSlots} available
                              </span>
                            </div>
                          )}

                          {/* Meta Row */}
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-white/20" />
                              <span className="text-white/40 text-[10px]">~{station.estimatedWait} wait</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {station.connectorTypes.map(ct => (
                                <span key={ct} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-white/30 border border-white/5">
                                  {ct}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Navigate Button */}
                        {station.isOpen && (station.availability ?? 0) > 0 && (
                          <button
                            className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center shrink-0 hover:bg-[#38BDF8]/20 transition-colors"
                            aria-label={`Navigate to ${station.name}`}
                          >
                            <Navigation className="w-4 h-4 text-[#38BDF8]" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Fuel Stations */}
              <div className="mt-5">
                <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-[#F5C451]" />
                  Fuel Stations
                </h4>
                <div className="space-y-2">
                  {fuelStations.map((station, i) => (
                    <motion.div
                      key={station.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className={`bg-[#1A1D26] rounded-2xl p-4 border transition-all ${
                        station.isOpen
                          ? 'border-[#F5C451]/20'
                          : 'border-white/5 opacity-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Station Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          station.isOpen
                            ? 'bg-[#F5C451]/10 border border-[#F5C451]/20'
                            : 'bg-white/5 border border-white/10'
                        }`}>
                          <Fuel className={`w-5 h-5 ${station.isOpen ? 'text-[#F5C451]' : 'text-white/20'}`} />
                        </div>

                        {/* Station Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-bold text-sm truncate">{station.name}</p>
                            {!station.isOpen && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                                CLOSED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <MapPin className="w-3 h-3 text-white/20" />
                            <span className="text-white/40 text-xs">{station.distance}</span>
                            <span className="text-white/10 text-xs">•</span>
                            <Clock className="w-3 h-3 text-white/20" />
                            <span className="text-white/40 text-xs">~{station.estimatedWait} wait</span>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            {station.connectorTypes.map(ct => (
                              <span key={ct} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#F5C451]/5 text-[#F5C451]/50 border border-[#F5C451]/10">
                                {ct}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Navigate Button */}
                        {station.isOpen && (
                          <button
                            className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center shrink-0 hover:bg-[#38BDF8]/20 transition-colors"
                            aria-label={`Navigate to ${station.name}`}
                          >
                            <Navigation className="w-4 h-4 text-[#38BDF8]" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
