'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { useData } from '@/components/providers/DataProvider';
import type { SurplusItem } from '@/components/providers/DataProvider';
import { fadeUp, staggerContainer, scaleIn, cardHover } from '@/lib/animations';

// ─── Types ────────────────────────────────────────────────────────────────────
type RowState = 'idle' | 'markdown-applied' | 'donated' | 'redirected';

interface RowStatus {
  state: RowState;
  flash: 'amber' | 'green' | 'blue' | null;
}

// ─── Chart data ───────────────────────────────────────────────────────────────
const CHART_DATA = [
  { month: 'Nov', Donations: 48, Markdown: 62, Redirect: 31 },
  { month: 'Dec', Donations: 65, Markdown: 78, Redirect: 44 },
  { month: 'Jan', Donations: 53, Markdown: 55, Redirect: 38 },
  { month: 'Feb', Donations: 72, Markdown: 91, Redirect: 52 },
  { month: 'Mar', Donations: 89, Markdown: 104, Redirect: 61 },
  { month: 'Apr', Donations: 94, Markdown: 87, Redirect: 58 },
];

// ─── Partner data ─────────────────────────────────────────────────────────────
const PARTNERS = [
  {
    id: 'fareshare',
    initial: 'F',
    name: 'FareShare UK',
    description: 'The UK\'s largest charity fighting hunger and food waste. Redistributes surplus food to over 8,500 frontline charities.',
    email: 'partnerships@fareshare.org.uk',
    color: 'amber',
  },
  {
    id: 'olio',
    initial: 'O',
    name: 'Olio',
    description: 'Community food sharing platform connecting businesses with neighbours. Zero food waste, zero carbon commitment.',
    email: 'business@olioex.com',
    color: 'green',
  },
  {
    id: 'companyshop',
    initial: 'C',
    name: 'Company Shop',
    description: 'Europe\'s largest re-distributor of surplus food and household products. Converts surplus into social value.',
    email: 'commercial@companyshop.co.uk',
    color: 'blue',
  },
];

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-3 shadow-xl">
      <p className="text-xs font-mono text-gray-400 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-400">{entry.name}:</span>
          <span className="font-mono font-semibold text-white">{entry.value}t</span>
        </div>
      ))}
    </div>
  );
}

// ─── Email Modal ──────────────────────────────────────────────────────────────
function EmailModal({
  partner,
  onClose,
}: {
  partner: typeof PARTNERS[0];
  onClose: () => void;
}) {
  const [subject, setSubject] = useState(`Surplus Redistribution Partnership — FoodChain CRM`);
  const [body, setBody] = useState(
    `Dear ${partner.name} team,\n\nI am reaching out regarding potential surplus redistribution partnership opportunities with our supply chain.\n\nWe currently have several items flagged for redistribution and would like to discuss how we can work together to reduce food waste while supporting your mission.\n\nKind regards,\nFoodChain CRM`
  );

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(3,7,18,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        variants={modalVariants}
        className="bg-[#111827] border border-[#1F2937] rounded-2xl w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1F2937]">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
              ${partner.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                partner.color === 'green' ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-blue-500/20 text-blue-400'}`}>
              {partner.initial}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{partner.name}</p>
              <p className="text-gray-500 text-xs font-mono">{partner.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#1F2937] hover:bg-[#374151] transition-colors flex items-center justify-center text-gray-400 hover:text-white"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">To</label>
            <div className="bg-[#0F172A] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-gray-300 font-mono">
              {partner.email}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full bg-[#0F172A] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-amber-500/50 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-[#1F2937]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className={`px-5 py-2 rounded-lg text-sm font-semibold text-black transition-all
              ${partner.color === 'amber' ? 'bg-amber-400 hover:bg-amber-300' :
                partner.color === 'green' ? 'bg-emerald-400 hover:bg-emerald-300' :
                'bg-blue-400 hover:bg-blue-300'}`}
          >
            Send Email
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Partner Card ─────────────────────────────────────────────────────────────
function PartnerCard({ partner }: { partner: typeof PARTNERS[0] }) {
  const [showModal, setShowModal] = useState(false);

  const glowClass =
    partner.color === 'amber' ? 'glow-amber' :
    partner.color === 'green' ? 'glow-green' : '';

  const accentClass =
    partner.color === 'amber' ? { bg: 'bg-amber-500/20', text: 'text-amber-400', btn: 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30' } :
    partner.color === 'green' ? { bg: 'bg-emerald-500/20', text: 'text-emerald-400', btn: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' } :
    { bg: 'bg-blue-500/20', text: 'text-blue-400', btn: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30' };

  return (
    <>
      <motion.div
        variants={scaleIn}
        initial="rest"
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`gradient-border rounded-xl p-5 flex flex-col gap-4 cursor-default hover:${glowClass} transition-shadow`}
        style={{ transitionDuration: '0.3s' }}
        onMouseEnter={(e) => {
          if (partner.color === 'amber') {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(245,158,11,0.3), 0 0 40px rgba(245,158,11,0.1)';
          } else if (partner.color === 'green') {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(16,185,129,0.3)';
          } else {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(59,130,246,0.3)';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = '';
        }}
      >
        {/* Logo initial */}
        <div className={`w-14 h-14 rounded-xl ${accentClass.bg} flex items-center justify-center`}>
          <span className={`text-2xl font-bold ${accentClass.text}`}>{partner.initial}</span>
        </div>

        {/* Name & description */}
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">{partner.name}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{partner.description}</p>
        </div>

        {/* Contact button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowModal(true)}
          className={`self-start flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${accentClass.btn}`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Contact
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <EmailModal partner={partner} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Surplus Table Row ────────────────────────────────────────────────────────
function SurplusRow({
  item,
  selected,
  onSelect,
  rowStatus,
  onAction,
}: {
  item: SurplusItem;
  selected: boolean;
  onSelect: (id: string) => void;
  rowStatus: RowStatus;
  onAction: (id: string, action: 'markdown' | 'donate' | 'redirect') => void;
}) {
  const daysColor =
    item.daysRemaining < 2 ? 'text-red-400' :
    item.daysRemaining <= 3 ? 'text-amber-400' : 'text-white';

  const flashBg =
    rowStatus.flash === 'amber' ? 'rgba(245,158,11,0.12)' :
    rowStatus.flash === 'green' ? 'rgba(16,185,129,0.12)' :
    rowStatus.flash === 'blue'  ? 'rgba(59,130,246,0.12)' :
    'transparent';

  const isMarkdownApplied = rowStatus.state === 'markdown-applied';

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        backgroundColor: flashBg,
        x: rowStatus.state === 'redirected' ? 60 : 0,
      }}
      exit={{
        opacity: 0,
        scale: rowStatus.state === 'donated' ? 0.95 : 1,
        x: rowStatus.state === 'redirected' ? 60 : 0,
        height: 0,
        transition: { duration: 0.35, ease: 'easeIn' },
      }}
      transition={{ duration: 0.25 }}
      className="border-b border-[#1F2937] hover:bg-white/[0.02] transition-colors"
    >
      {/* Checkbox */}
      <td className="px-4 py-3 w-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(item.id)}
          className="w-4 h-4 rounded border-[#374151] bg-[#1F2937] accent-amber-500 cursor-pointer"
        />
      </td>

      {/* Product */}
      <td className="px-4 py-3">
        <span className="text-white text-sm font-medium">{item.product}</span>
      </td>

      {/* Location */}
      <td className="px-4 py-3">
        <span className="text-gray-400 text-sm">{item.location}</span>
      </td>

      {/* Qty */}
      <td className="px-4 py-3">
        <span className="font-mono text-sm text-white">{item.quantity} {item.unit}</span>
      </td>

      {/* Days remaining */}
      <td className="px-4 py-3">
        <motion.span
          className={`font-mono text-sm font-semibold ${daysColor}`}
          animate={
            item.daysRemaining < 2
              ? { opacity: [1, 0.4, 1] }
              : { opacity: 1 }
          }
          transition={
            item.daysRemaining < 2
              ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
              : {}
          }
        >
          {item.daysRemaining}d
        </motion.span>
      </td>

      {/* Cause */}
      <td className="px-4 py-3">
        <span className="text-xs bg-[#1F2937] text-gray-400 rounded-full px-2 py-0.5">{item.cause}</span>
      </td>

      {/* Value */}
      <td className="px-4 py-3">
        <span
          className={`font-mono text-sm text-amber-400 transition-all duration-500 ${isMarkdownApplied ? 'line-through text-gray-600' : ''}`}
        >
          £{item.value}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Markdown button */}
          {isMarkdownApplied ? (
            <span className="px-2 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Applied
            </span>
          ) : (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => onAction(item.id, 'markdown')}
              className="px-2 py-1 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
            >
              Markdown
            </motion.button>
          )}

          {/* Donate button */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => onAction(item.id, 'donate')}
            className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
          >
            Donate
          </motion.button>

          {/* Redirect DC button */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => onAction(item.id, 'redirect')}
            className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors whitespace-nowrap"
          >
            Redirect DC
          </motion.button>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SurplusPage() {
  const { surplusItems } = useData();

  // Row state map
  const [rowStatuses, setRowStatuses] = useState<Record<string, RowStatus>>(() =>
    Object.fromEntries(surplusItems.map((item) => [item.id, { state: 'idle', flash: null }]))
  );

  // Visible items (for AnimatePresence)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  // Selected checkboxes
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const visibleItems = surplusItems.filter((item) => !hiddenIds.has(item.id));

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === visibleItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleItems.map((i) => i.id)));
    }
  }, [selectedIds, visibleItems]);

  const handleAction = useCallback((id: string, action: 'markdown' | 'donate' | 'redirect') => {
    if (action === 'markdown') {
      setRowStatuses((prev) => ({
        ...prev,
        [id]: { state: 'idle', flash: 'amber' },
      }));
      setTimeout(() => {
        setRowStatuses((prev) => ({
          ...prev,
          [id]: { state: 'markdown-applied', flash: null },
        }));
      }, 400);
    } else if (action === 'donate') {
      setRowStatuses((prev) => ({
        ...prev,
        [id]: { state: 'idle', flash: 'green' },
      }));
      setTimeout(() => {
        setRowStatuses((prev) => ({
          ...prev,
          [id]: { state: 'donated', flash: 'green' },
        }));
        setTimeout(() => {
          setHiddenIds((prev) => new Set([...prev, id]));
          setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
        }, 400);
      }, 300);
    } else {
      setRowStatuses((prev) => ({
        ...prev,
        [id]: { state: 'idle', flash: 'blue' },
      }));
      setTimeout(() => {
        setRowStatuses((prev) => ({
          ...prev,
          [id]: { state: 'redirected', flash: 'blue' },
        }));
        setTimeout(() => {
          setHiddenIds((prev) => new Set([...prev, id]));
          setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
        }, 400);
      }, 300);
    }
  }, []);

  const bulkAction = useCallback((action: 'donate' | 'markdown' | 'redirect') => {
    selectedIds.forEach((id) => handleAction(id, action));
    setSelectedIds(new Set());
  }, [selectedIds, handleAction]);

  const anySelected = selectedIds.size > 0;

  return (
    <div className="space-y-8">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden rounded-2xl bg-[#0F172A] border border-[#1F2937] p-8"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to right, rgba(245,158,11,0.1) 0%, transparent 60%)' }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M4 6h16M4 10h16M4 14h8M4 18h8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">Surplus Management</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Surplus Redistribution</h1>
          <p className="text-gray-400 text-sm">Identify, action, and track surplus stock across all supply chain nodes</p>
        </div>
      </motion.div>

      {/* ── Summary Cards ────────────────────────────────────────────────────── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total Surplus Value */}
        <motion.div variants={fadeUp} className="gradient-border rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Total Surplus Value</p>
          <p className="font-mono text-3xl font-bold text-amber-400 glow-amber">£3,093</p>
          <p className="text-xs text-gray-600 mt-2">Across all locations</p>
        </motion.div>

        {/* Items to Action */}
        <motion.div variants={fadeUp} className="gradient-border rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Items to Action</p>
          <p className="font-mono text-3xl font-bold text-white">{visibleItems.length}</p>
          <p className="text-xs text-gray-600 mt-2">Require redistribution</p>
        </motion.div>

        {/* CO₂ Saved */}
        <motion.div variants={fadeUp} className="gradient-border rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">CO₂ Saved Today</p>
          <p className="font-mono text-3xl font-bold text-emerald-400 glow-green">1.2t</p>
          <p className="text-xs text-gray-600 mt-2">Carbon equivalent avoided</p>
        </motion.div>

        {/* Meals Donated */}
        <motion.div variants={fadeUp} className="gradient-border rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Meals Donated This Week</p>
          <p className="font-mono text-3xl font-bold text-white">4,240</p>
          <p className="text-xs text-gray-600 mt-2">Via charity partners</p>
        </motion.div>
      </motion.div>

      {/* ── Surplus Table ─────────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.15 }}
        className="bg-[#0F172A] border border-[#1F2937] rounded-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-[#1F2937] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Surplus Stock</h2>
            <p className="text-xs text-gray-500 mt-0.5">{visibleItems.length} items flagged for action</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Critical (&lt;2d)
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Urgent (2–3d)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1F2937] bg-[#111827] sticky top-0 z-10">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={anySelected && selectedIds.size === visibleItems.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-[#374151] bg-[#1F2937] accent-amber-500 cursor-pointer"
                  />
                </th>
                {['Product', 'Location', 'Qty', 'Days Left', 'Cause', 'Value', 'Action'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false} mode="popLayout">
                {visibleItems.map((item) => (
                  <SurplusRow
                    key={item.id}
                    item={item}
                    selected={selectedIds.has(item.id)}
                    onSelect={handleSelect}
                    rowStatus={rowStatuses[item.id] ?? { state: 'idle', flash: null }}
                    onAction={handleAction}
                  />
                ))}
              </AnimatePresence>
              {visibleItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-600 text-sm">
                    All surplus items have been actioned
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Bulk Action Bar ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {anySelected && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass rounded-2xl border border-[#1F2937] px-6 py-4 flex items-center gap-4 shadow-2xl"
          >
            <span className="text-sm text-gray-400 font-mono mr-1">
              {selectedIds.size} selected — Bulk:
            </span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => bulkAction('donate')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 text-sm font-medium transition-colors"
            >
              Donate
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => bulkAction('markdown')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 text-sm font-medium transition-colors"
            >
              Markdown
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => bulkAction('redirect')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 text-sm font-medium transition-colors"
            >
              Redirect
            </motion.button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-2 text-gray-600 hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Redistribution Chart ──────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.25 }}
        className="bg-[#0F172A] border border-[#1F2937] rounded-2xl p-6"
      >
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">Redistribution by Channel</h2>
          <p className="text-sm text-gray-500 mt-1">Last 6 months · tonnes redistributed</p>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={CHART_DATA} barCategoryGap="30%" barGap={4}>
            <XAxis
              dataKey="month"
              tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={{ stroke: '#1F2937' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}t`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend
              wrapperStyle={{ paddingTop: '16px', fontSize: '12px', color: '#9CA3AF' }}
            />
            <Bar dataKey="Donations" fill="#10B981" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} animationBegin={200} />
            <Bar dataKey="Markdown" fill="#F59E0B" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} animationBegin={350} />
            <Bar dataKey="Redirect" fill="#3B82F6" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} animationBegin={500} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── Partner Cards ─────────────────────────────────────────────────────── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp} className="mb-5">
          <h2 className="text-lg font-semibold text-white">Redistribution Partners</h2>
          <p className="text-sm text-gray-500 mt-1">Approved charity and commercial partners for surplus redistribution</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PARTNERS.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      </motion.div>

      {/* Bottom padding for bulk action bar */}
      <div className="h-8" />
    </div>
  );
}
