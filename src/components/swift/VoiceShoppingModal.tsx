'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, ShoppingCart, Plus, Volume2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { allProducts, formatNaira } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

const quickCommands = [
  'Order Jollof Rice',
  'Add dates to cart',
  'Show flash sales',
  'Track my order',
];

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

export default function VoiceShoppingModal() {
  const { activeModal, setActiveModal, isListening, setIsListening, voiceTranscript, setVoiceTranscript, addToCart } = useAppStore();
  const { toast } = useToast();
  const [matchedProducts, setMatchedProducts] = useState<typeof allProducts>([]);
  const [confirmedProduct, setConfirmedProduct] = useState<typeof allProducts[0] | null>(null);
  const [waveformBars] = useState(() => Array.from({ length: 24 }, () => Math.random()));
  const [animBars, setAnimBars] = useState<number[]>(Array(24).fill(0.2));
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const animFrameRef = useRef<number>(0);

  const isOpen = activeModal === 'voice';

  // Animate waveform bars when listening
  useEffect(() => {
    if (!isListening) {
      setAnimBars(Array(24).fill(0.2));
      return;
    }
    let frame = 0;
    const animate = () => {
      frame++;
      setAnimBars(
        Array.from({ length: 24 }, (_, i) => {
          const base = 0.15 + Math.sin(frame * 0.05 + i * 0.7) * 0.3;
          const random = Math.random() * 0.25;
          return Math.max(0.05, Math.min(1, base + random));
        })
      );
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isListening]);

  // Check speech recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Match products from transcript
  useEffect(() => {
    if (!voiceTranscript) {
      setMatchedProducts([]);
      setConfirmedProduct(null);
      return;
    }
    const lower = voiceTranscript.toLowerCase();
    const matches = allProducts.filter((p) => {
      const nameLower = p.name.toLowerCase();
      const words = lower.split(/\s+/);
      return words.some(
        (w) => w.length > 2 && nameLower.includes(w)
      );
    });
    setMatchedProducts(matches.slice(0, 4));
    if (matches.length > 0) {
      setConfirmedProduct(matches[0]);
    } else {
      setConfirmedProduct(null);
    }
  }, [voiceTranscript]);

  const startListening = useCallback(() => {
    if (!speechSupported) {
      toast({ title: 'Not Supported', description: 'Voice recognition is not available in your browser. Try Chrome!' });
      return;
    }

    const SpeechRecognitionClass = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    const recognition = new (SpeechRecognitionClass as new () => SpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');
      setVoiceTranscript(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setVoiceTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setVoiceTranscript('');
    setMatchedProducts([]);
    setConfirmedProduct(null);
  }, [speechSupported, setIsListening, setVoiceTranscript, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, [setIsListening]);

  const handleCommandClick = useCallback((command: string) => {
    setVoiceTranscript(command);
    const lower = command.toLowerCase();
    const matches = allProducts.filter((p) => {
      const nameLower = p.name.toLowerCase();
      const words = lower.split(/\s+/);
      return words.some((w) => w.length > 2 && nameLower.includes(w));
    });
    setMatchedProducts(matches.slice(0, 4));
    if (matches.length > 0) {
      setConfirmedProduct(matches[0]);
    } else {
      setConfirmedProduct(null);
      if (lower.includes('flash sale')) {
        toast({ title: 'Flash Sales 🔥', description: 'Check the Offers tab for current flash sales!' });
      } else if (lower.includes('track')) {
        toast({ title: 'Order Tracking 📦', description: 'Check the Orders tab for live tracking!' });
      }
    }
  }, [allProducts, setVoiceTranscript, toast]);

  const handleConfirmAdd = useCallback((product: typeof allProducts[0]) => {
    const price = product.salePrice || product.price || 0;
    addToCart({
      id: product.id,
      name: product.name,
      price,
      image: product.image,
    });
    toast({
      title: 'Added to Cart! 🛒',
      description: `${product.name} - ${formatNaira(price)}`,
    });
    setVoiceTranscript('');
    setMatchedProducts([]);
    setConfirmedProduct(null);
  }, [addToCart, toast]);

  const handleClose = () => {
    stopListening();
    setVoiceTranscript('');
    setMatchedProducts([]);
    setConfirmedProduct(null);
    setActiveModal(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[90]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#05070A] overflow-y-auto custom-scrollbar"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 glass-effect border-b border-white/5">
              <div className="flex items-center justify-between p-4">
                <h2 className="text-white text-lg font-bold">Voice Shopping</h2>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-32">
              {/* Microphone Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center mt-8 mb-6"
              >
                <button
                  onClick={isListening ? stopListening : startListening}
                  className="relative w-28 h-28 rounded-full flex items-center justify-center transition-all"
                >
                  {/* Pulsing rings */}
                  {isListening && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-[#13ec13]/40"
                        animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-[#13ec13]/20"
                        animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border border-[#13ec13]/10"
                        animate={{ scale: [1, 2.2], opacity: [0.3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                      />
                    </>
                  )}
                  <div className={`relative w-28 h-28 rounded-full flex items-center justify-center ${isListening ? 'bg-[#13ec13]' : 'bg-[#1A1D26] border-2 border-[#13ec13]/30'}`}>
                    {isListening ? (
                      <MicOff className="w-10 h-10 text-[#05070A]" />
                    ) : (
                      <Mic className="w-10 h-10 text-[#13ec13]" />
                    )}
                  </div>
                </button>
                <p className="text-white/50 text-sm mt-4">
                  {isListening ? 'Listening... Tap to stop' : 'Tap to start speaking'}
                </p>
              </motion.div>

              {/* Voice Waveform */}
              <div className="flex items-center justify-center gap-[3px] h-16 mb-6">
                {animBars.map((height, i) => (
                  <motion.div
                    key={i}
                    className={`w-[3px] rounded-full ${isListening ? 'bg-[#13ec13]' : 'bg-white/10'}`}
                    animate={{ height: `${Math.max(4, height * 56)}px` }}
                    transition={{ duration: 0.1 }}
                  />
                ))}
              </div>

              {/* Transcript Display */}
              <div className="bg-[#1A1D26] rounded-2xl border border-white/5 p-5 mb-6 min-h-[60px]">
                {voiceTranscript ? (
                  <p className="text-white text-base font-medium">&quot;{voiceTranscript}&quot;</p>
                ) : (
                  <p className="text-white/30 text-sm">
                    {isListening ? 'Speak now...' : 'Didn\'t catch that? Try again'}
                  </p>
                )}
              </div>

              {/* Quick Voice Commands */}
              <div className="mb-6">
                <h4 className="text-white font-bold text-sm mb-3">Quick Commands</h4>
                <div className="flex flex-wrap gap-2">
                  {quickCommands.map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => handleCommandClick(cmd)}
                      className="px-4 py-2 rounded-full bg-[#1A1D26] border border-white/10 text-white/70 text-xs font-medium hover:border-[#13ec13]/30 hover:text-[#13ec13] transition-colors"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Suggestions / Voice Order Review */}
              {matchedProducts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <h4 className="text-white font-bold text-sm mb-3">Found for you</h4>
                  <div className="space-y-3">
                    {matchedProducts.map((product) => {
                      const price = product.salePrice || product.price || 0;
                      return (
                        <div
                          key={product.id}
                          className={`bg-[#1A1D26] rounded-xl border ${confirmedProduct?.id === product.id ? 'border-[#13ec13]/30' : 'border-white/5'} overflow-hidden`}
                        >
                          <div className="flex gap-3 p-3">
                            <div
                              className="w-20 h-20 rounded-lg bg-cover bg-center shrink-0"
                              style={{ backgroundImage: `url(${product.image})` }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold text-sm truncate">{product.name}</p>
                              <p className="text-[#13ec13] font-black text-lg">{formatNaira(price)}</p>
                              {product.deliveryTime && (
                                <p className="text-white/30 text-xs mt-0.5">{product.deliveryTime}</p>
                              )}
                            </div>
                          </div>
                          {confirmedProduct?.id === product.id && (
                            <button
                              onClick={() => handleConfirmAdd(product)}
                              className="w-full py-3 bg-[#13ec13] text-[#05070A] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#11d411] transition-colors"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              Confirm & Add to Cart
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* No match state */}
              {voiceTranscript && matchedProducts.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-[#1A1D26] rounded-2xl border border-white/5 p-6 text-center mb-6"
                >
                  <Volume2 className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50 text-sm">No products found for &quot;{voiceTranscript}&quot;</p>
                  <p className="text-white/30 text-xs mt-1">Try saying a product name like &quot;Jollof Rice&quot; or &quot;Dates&quot;</p>
                </motion.div>
              )}

              {/* Not supported fallback */}
              {!speechSupported && (
                <div className="bg-[#1A1D26] rounded-2xl border border-amber-500/20 p-6 text-center mb-6">
                  <MicOff className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                  <p className="text-amber-400 font-bold text-sm">Voice Not Supported</p>
                  <p className="text-white/40 text-xs mt-1">Your browser doesn&apos;t support voice recognition. Please use Chrome or try the quick commands below.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
