'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, stagger } from 'framer-motion';
import { BrainCircuit, X, ChevronDown, Send, RotateCcw } from 'lucide-react';
import { useData } from '@/components/providers/DataProvider';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isProactive?: boolean;
}

const QUICK_PROMPTS = [
  'Why is the Bullwhip risk high?',
  'Explain cold chain breach on SENS-FLT-002',
  "What's causing the waste spike?",
  'Recommend surplus redistribution actions',
  'How do I improve my MAPE score?',
  'What does EPR reform mean for us?',
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1 px-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-amber-400"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function TypewriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed('');
    const id = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else {
        clearInterval(id);
        onComplete?.();
      }
    }, 12);
    return () => clearInterval(id);
  }, [text, onComplete]);

  return <span>{displayed}</span>;
}

export default function ChainBot() {
  const { sensors, activeAlerts, coldChainScore, bullwhipRisk, bullwhipScore, wasteThisWeek, mapeScore } = useData();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasOpened, setHasOpened] = useState(false);
  const [lastCritical, setLastCritical] = useState<string[]>([]);
  const [lastScore, setLastScore] = useState(coldChainScore);
  const [lastRisk, setLastRisk] = useState(bullwhipRisk);
  const [typingMsgId, setTypingMsgId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const idRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const makeId = () => String(++idRef.current);

  const addBotMessage = useCallback((content: string, isProactive = false) => {
    const msg: Message = { id: makeId(), role: 'assistant', content, timestamp: new Date(), isProactive };
    setMessages(prev => [...prev, msg]);
    setTypingMsgId(msg.id);
    if (!open) setUnreadCount(c => c + 1);
    return msg.id;
  }, [open]);

  // Opening message
  useEffect(() => {
    if (open && !hasOpened) {
      setHasOpened(true);
      const content = `Hello! I'm ChainBot, your AI supply chain assistant. I have access to your live sensor data, demand forecasts, and waste analytics.\n\nRight now I can see: **${activeAlerts.length} active alert${activeAlerts.length !== 1 ? 's' : ''}**, cold chain integrity at **${coldChainScore}%**, and Bullwhip risk is **${bullwhipRisk}**.\n\nWhat would you like to explore?`;
      addBotMessage(content);
    }
  }, [open, hasOpened, activeAlerts.length, coldChainScore, bullwhipRisk, addBotMessage]);

  // Proactive: critical sensors
  useEffect(() => {
    const currentCritical = sensors.filter(s => s.status === 'CRITICAL').map(s => s.id);
    const newCritical = currentCritical.filter(id => !lastCritical.includes(id));
    if (newCritical.length > 0) {
      const sensor = sensors.find(s => s.id === newCritical[0]);
      if (sensor) {
        addBotMessage(`🚨 Critical temperature breach detected on **${sensor.id}** at ${sensor.location}. Current reading: **${sensor.currentValue.toFixed(1)}°C** (safe range: ${sensor.safeMin}–${sensor.safeMax}°C). Immediate action recommended: isolate affected stock and contact the distribution supervisor.`, true);
      }
    }
    setLastCritical(currentCritical);
  }, [sensors]);

  // Proactive: cold chain score drops below 70
  useEffect(() => {
    if (coldChainScore < 70 && lastScore >= 70) {
      addBotMessage(`⚠️ Cold chain integrity has dropped to **${coldChainScore}%**. This is below the warning threshold. ${sensors.filter(s => s.status !== 'NORMAL').length} sensors are currently out of safe range. Review the IoT Sensor Dashboard immediately.`, true);
    }
    setLastScore(coldChainScore);
  }, [coldChainScore]);

  // Proactive: bullwhip becomes High
  useEffect(() => {
    if (bullwhipRisk === 'High' && lastRisk !== 'High') {
      addBotMessage(`📊 Bullwhip risk has escalated to **HIGH** (score: ${bullwhipScore}). Demand deviation is significantly above normal — consider sharing POS data with tier 2 suppliers immediately and reviewing your reorder policies.`, true);
    }
    setLastRisk(bullwhipRisk);
  }, [bullwhipRisk]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 96)}px`;
    }
  }, [input]);

  const handleOpen = () => {
    setOpen(true);
    setUnreadCount(0);
  };

  const buildContext = useCallback(() => ({
    currentAlerts: activeAlerts.slice(0, 5).map(a => ({ id: a.id, message: a.message, severity: a.severity })),
    coldChainScore,
    bullwhipRisk,
    bullwhipScore,
    sensorsInWarning: sensors.filter(s => s.status === 'WARNING').length,
    sensorsCritical: sensors.filter(s => s.status === 'CRITICAL').length,
    wasteThisWeek,
    mapeScore,
    timestamp: new Date().toISOString(),
  }), [activeAlerts, coldChainScore, bullwhipRisk, bullwhipScore, sensors, wasteThisWeek, mapeScore]);

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isLoading) return;
    const userMsg: Message = { id: makeId(), role: 'user', content: userText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, context: buildContext() }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      addBotMessage(data.content || 'No response received.');
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name !== 'AbortError') {
        const errMsg: Message = {
          id: makeId(),
          role: 'assistant',
          content: 'ChainBot is temporarily unavailable. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errMsg]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, buildContext, addBotMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const hasUserMessages = messages.some(m => m.role === 'user');

  return (
    <>
      {/* Trigger Button */}
      <div className="fixed bottom-6 right-6 z-[150]">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpen}
          className="relative w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center shadow-2xl glow-amber cursor-pointer transition-colors"
          aria-label="Open ChainBot AI Assistant"
        >
          <BrainCircuit className="w-6 h-6 text-black" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-40" />
          {/* Unread badge */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed bottom-24 right-6 w-96 z-[150] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{ maxHeight: '560px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)' }}
          >
            {/* Amber top border */}
            <div className="h-0.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">ChainBot</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-gray-400">AI Supply Chain Assistant</span>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Minimize ChainBot"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close ChainBot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '340px' }}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${msg.role === 'user'
                    ? 'bg-amber-500/10 border border-amber-500/30 rounded-2xl rounded-tr-sm'
                    : 'bg-[#1F2937] rounded-2xl rounded-tl-sm'
                  } px-3 py-2`}>
                    <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
                      {msg.role === 'assistant' && msg.id === typingMsgId ? (
                        <TypewriterText text={msg.content} onComplete={() => setTypingMsgId(null)} />
                      ) : (
                        msg.content
                      )}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-1">
                      {msg.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="bg-[#1F2937] rounded-2xl rounded-tl-sm px-3 py-2">
                    <TypingDots />
                    <p className="text-[10px] text-gray-600">ChainBot is thinking…</p>
                  </div>
                </motion.div>
              )}

              {/* Quick prompts */}
              <AnimatePresence>
                {!hasUserMessages && messages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex flex-wrap gap-1.5"
                  >
                    {QUICK_PROMPTS.map((p) => (
                      <motion.button
                        key={p}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => sendMessage(p)}
                        className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-amber-500/10 hover:border-amber-500/30 transition-colors cursor-pointer"
                      >
                        {p}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div className="border-t border-white/5 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about waste, sensors, forecasts…"
                  rows={1}
                  className="flex-1 bg-white/5 border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none transition-colors"
                  style={{ minHeight: '36px', maxHeight: '96px' }}
                  aria-label="Chat input"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4 text-black" />
                </motion.button>
              </div>
              <p className="text-[10px] text-gray-700 mt-1.5 text-center">
                ChainBot has access to live sensor and forecast data
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
