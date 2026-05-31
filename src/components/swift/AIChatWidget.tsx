'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: number;
  from: 'user' | 'bot';
  text: string;
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, from: 'bot', text: "Salam! I'm Safa, your SwiftRamadan AI assistant. How can I help you today? 🌙" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: userMessage }]);
    setMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now(), from: 'bot', text: data.reply || "I'm here to help! What would you like to know? 🌟" }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now(), from: 'bot', text: "I'm having trouble connecting right now. Please try again. 🌙" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 w-[calc(100%-2rem)] sm:w-96 h-[60vh] bg-[#0F1117] rounded-2xl border border-white/10 shadow-2xl z-[60] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#13ec13]/20 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#13ec13]" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Safa AI Support</p>
                  <p className="text-[#13ec13] text-[10px] font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#13ec13] rounded-full animate-pulse" />
                    Online &bull; Powered by AI
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] flex gap-2 ${msg.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.from === 'user' ? 'bg-[#13ec13]/20' : 'bg-[#FFD700]/20'}`}>
                      {msg.from === 'user' ? <User className="w-3 h-3 text-[#13ec13]" /> : <Bot className="w-3 h-3 text-[#FFD700]" />}
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                      msg.from === 'user'
                        ? 'bg-[#13ec13] text-[#05070A] font-semibold'
                        : 'bg-[#1A1D26] text-white/80 border border-white/5'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#1A1D26] px-4 py-2.5 rounded-2xl border border-white/5">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5 bg-[#0a0a0a]">
              <div className="flex items-center gap-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about orders, deals..."
                  className="flex-1 bg-[#1A1D26] border border-white/5 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#13ec13]/30"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !message.trim()}
                  className="w-10 h-10 bg-[#13ec13] rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 transition-opacity"
                >
                  <Send className="w-4 h-4 text-[#05070A]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 left-4 w-14 h-14 bg-[#13ec13] rounded-full flex items-center justify-center shadow-lg shadow-[#13ec13]/20 z-[60]"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-[#05070A]" />
        ) : (
          <MessageCircle className="w-6 h-6 text-[#05070A]" />
        )}
      </motion.button>
    </>
  );
}
