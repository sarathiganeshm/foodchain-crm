'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, X, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useData } from '@/components/providers/DataProvider';
import { cn } from '@/lib/utils';

function useUKClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function Header({ title }: { title?: string }) {
  const { activeAlerts, acknowledgeAlert } = useData();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [prevCount, setPrevCount] = useState(0);
  const clock = useUKClock();
  const unread = activeAlerts.filter(a => !a.acknowledged).length;

  useEffect(() => {
    if (unread > prevCount) {
      setPrevCount(unread);
    }
  }, [unread, prevCount]);

  const severityIcon = (s: string) => {
    if (s === 'critical') return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    if (s === 'warning') return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    return <Info className="w-3.5 h-3.5 text-blue-400" />;
  };

  return (
    <header className="fixed top-0 right-0 left-[72px] z-40 h-16 glass border-b border-white/5 flex items-center px-6 gap-4">
      {/* Title */}
      <motion.h1
        key={title}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg font-semibold text-white hidden md:block"
      >
        {title ?? 'FoodChain CRM'}
      </motion.h1>

      <div className="flex-1" />

      {/* Search */}
      <motion.div
        animate={{ width: searchOpen ? 240 : 36 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="relative h-9 flex items-center"
      >
        <button
          onClick={() => setSearchOpen(o => !o)}
          className="absolute left-0 w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Search"
        >
          <Search className="w-4 h-4 text-gray-400" />
        </button>
        <AnimatePresence>
          {searchOpen && (
            <motion.input
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              autoFocus
              placeholder="Search sensors, shipments…"
              className="absolute left-0 w-full h-9 bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* UK Clock */}
      <div className="text-sm font-mono text-gray-400 hidden md:block tabular-nums">
        {clock} <span className="text-gray-600">GMT</span>
      </div>

      {/* Notifications */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setNotifOpen(o => !o)}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          aria-label={`Notifications (${unread} unread)`}
        >
          <Bell className="w-4 h-4 text-gray-400" />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500 }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
              >
                {unread > 9 ? '9+' : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute right-0 top-12 w-80 glass border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <span className="text-sm font-semibold text-white">Alerts</span>
                <button onClick={() => setNotifOpen(false)} className="text-gray-500 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {activeAlerts.slice(0, 8).length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-6">No active alerts</p>
                ) : (
                  activeAlerts.slice(0, 8).map(alert => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 border-l-2 hover:bg-white/3 transition-colors',
                        alert.severity === 'critical' ? 'border-l-red-500' :
                        alert.severity === 'warning' ? 'border-l-amber-500' : 'border-l-blue-500'
                      )}
                    >
                      {severityIcon(alert.severity)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{alert.message}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{alert.timestamp.toLocaleTimeString('en-GB')}</p>
                      </div>
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-[10px] text-gray-500 hover:text-amber-400 cursor-pointer shrink-0"
                      >
                        ACK
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
