'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Wheat, LayoutDashboard, BrainCircuit, Thermometer, Truck,
  BarChart3, PackageOpen, Shield, Settings, ChevronRight,
  ChevronLeft, User, Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/forecasting', label: 'AI Forecasting', icon: BrainCircuit },
  { href: '/sensors', label: 'IoT Sensors', icon: Thermometer },
  { href: '/cold-chain', label: 'Cold Chain', icon: Truck },
  { href: '/waste', label: 'Waste Analytics', icon: BarChart3 },
  { href: '/surplus', label: 'Surplus Hub', icon: PackageOpen },
  { href: '/compliance', label: 'Policy & Compliance', icon: Shield },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: expanded ? 260 : 72 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      className="fixed left-0 top-0 h-screen z-50 flex flex-col bg-[#0F172A] border-r border-white/5 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <motion.div
          className="relative w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 glow-amber"
          whileHover={{ scale: 1.05 }}
        >
          <Wheat className="w-5 h-5 text-amber-400" />
        </motion.div>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-white font-bold text-lg tracking-tight">FoodChain</span>
              <span className="block text-amber-500/70 text-[10px] font-medium uppercase tracking-widest -mt-0.5">CRM</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 group',
                  active
                    ? 'gradient-border bg-amber-500/5 text-amber-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <div className={cn(
                  'shrink-0 w-5 h-5 relative',
                  active && 'text-amber-400',
                )}>
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -left-3 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-amber-400 rounded-full"
                    />
                  )}
                  <Icon className="w-5 h-5" />
                </div>
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-white/5 p-3">
        <div className={cn('flex items-center gap-3 px-2 py-2 rounded-lg', expanded && 'bg-white/3')}>
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <User className="w-4 h-4 text-black" />
            </div>
            <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-emerald-400 fill-emerald-400" />
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                <p className="text-sm font-semibold text-white truncate">Sarah Mitchell</p>
                <p className="text-xs text-gray-500 truncate">Supply Chain Manager</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="absolute top-5 -right-3 z-10 w-6 h-6 rounded-full bg-[#1F2937] border border-white/10 flex items-center justify-center cursor-pointer hover:bg-amber-500/20 hover:border-amber-500/50 transition-colors"
        aria-label="Toggle sidebar"
      >
        {expanded ? <ChevronLeft className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
      </button>
    </motion.aside>
  );
}
