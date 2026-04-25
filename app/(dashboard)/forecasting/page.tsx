'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useData } from '@/components/providers/DataProvider';
import { SplineScene } from '@/components/ui/splite';
import { fadeUp, staggerContainer, scaleIn, slideLeft } from '@/lib/animations';

// ─── Types ────────────────────────────────────────────────────────────────────

type RunState = 'idle' | 'loading' | 'success';
type BullwhipRisk = 'Low' | 'Medium' | 'High';

interface OrderRow {
  id: number;
  product: string;
  currentStock: number;
  recommendedOrder: number;
  unit: string;
  status: 'Pending' | 'Approved';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['Fresh Produce', 'Dairy', 'Bakery', 'Frozen', 'Meat', 'Ready Meals'] as const;
const HORIZONS = ['7d', '14d', '30d'] as const;

const INITIAL_ORDERS: OrderRow[] = [
  { id: 1, product: 'Organic Tomatoes', currentStock: 240, recommendedOrder: 480, unit: 'kg', status: 'Pending' },
  { id: 2, product: 'Whole Milk', currentStock: 180, recommendedOrder: 360, unit: 'L', status: 'Pending' },
  { id: 3, product: 'Sourdough Loaves', currentStock: 95, recommendedOrder: 200, unit: 'units', status: 'Pending' },
  { id: 4, product: 'Frozen Peas', currentStock: 310, recommendedOrder: 150, unit: 'kg', status: 'Pending' },
  { id: 5, product: 'Chicken Breast', currentStock: 88, recommendedOrder: 320, unit: 'kg', status: 'Pending' },
  { id: 6, product: 'Pasta Bake (Ready)', currentStock: 55, recommendedOrder: 180, unit: 'units', status: 'Pending' },
];

const BULLWHIP_TIERS = [
  { label: 'Retail', key: 'retail', widthClass: 'w-[25%]' },
  { label: 'Distribution', key: 'distribution', widthClass: 'w-[35%]' },
  { label: 'Processing', key: 'processing', widthClass: 'w-[45%]' },
  { label: 'Farm', key: 'farm', widthClass: 'w-[55%]' },
] as const;

const BULLWHIP_RECOMMENDATIONS: Record<BullwhipRisk, string> = {
  Low: '',
  Medium:
    'Moderate demand amplification detected across the supply chain. Consider sharing point-of-sale data upstream and aligning order cycles with distribution partners to dampen volatility.',
  High:
    'Severe bullwhip effect detected. Immediate action recommended: freeze discretionary orders, establish vendor-managed inventory at distribution tier, and initiate emergency demand-signal sharing across all upstream partners.',
};

const riskColor: Record<BullwhipRisk, { border: string; bg: string; text: string; badge: string }> = {
  Low: {
    border: 'border-emerald-500',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-400',
  },
  Medium: {
    border: 'border-amber-500',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-400',
  },
  High: {
    border: 'border-red-500',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-400',
  },
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  name: string;
  value: number | null;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomForecastTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const forecast = payload.find((p) => p.name === 'forecast')?.value;
  const upper = payload.find((p) => p.name === 'upper')?.value;
  const lower = payload.find((p) => p.name === 'lower')?.value;
  const actual = payload.find((p) => p.name === 'actual')?.value;

  return (
    <div
      style={{
        backgroundColor: '#111827',
        border: '1px solid #374151',
        borderRadius: '8px',
        color: '#F9FAFB',
        fontSize: '12px',
        padding: '10px 14px',
        minWidth: '160px',
      }}
    >
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {forecast != null && (
        <p className="flex justify-between gap-4">
          <span className="text-amber-400">Forecast</span>
          <span className="font-mono font-medium">{forecast.toLocaleString()} units</span>
        </p>
      )}
      {upper != null && lower != null && (
        <p className="flex justify-between gap-4 text-gray-400">
          <span>Confidence</span>
          <span className="font-mono">
            {lower.toLocaleString()} – {upper.toLocaleString()}
          </span>
        </p>
      )}
      {actual != null && (
        <p className="flex justify-between gap-4 mt-1 border-t border-[#374151] pt-1">
          <span className="text-white">Actual</span>
          <span className="font-mono font-medium text-white">{actual.toLocaleString()} units</span>
        </p>
      )}
    </div>
  );
}

// ─── Spinner / Check icons ─────────────────────────────────────────────────────

function Spinner() {
  return (
    <motion.svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </motion.svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── Info tooltip ─────────────────────────────────────────────────────────────

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="w-4 h-4 rounded-full bg-[#1F2937] text-gray-400 text-[10px] flex items-center justify-center hover:bg-[#374151] transition-colors"
        aria-label="More information"
      >
        i
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-6 top-0 z-50 w-64 p-3 bg-[#111827] border border-[#374151] rounded-lg text-xs text-gray-300 shadow-xl"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ForecastingPage() {
  const { forecast, forecastCategory, setForecastCategory, bullwhipRisk, bullwhipScore, mapeScore } = useData();

  const [horizon, setHorizon] = useState<(typeof HORIZONS)[number]>('14d');
  const [runState, setRunState] = useState<RunState>('idle');
  const [orders, setOrders] = useState<OrderRow[]>(INITIAL_ORDERS);
  const [flashingRow, setFlashingRow] = useState<number | null>(null);

  const handleRunForecast = useCallback(() => {
    if (runState !== 'idle') return;
    setRunState('loading');
    setTimeout(() => {
      setRunState('success');
      setTimeout(() => setRunState('idle'), 2500);
    }, 1500);
  }, [runState]);

  const handleApprove = useCallback((id: number) => {
    setFlashingRow(id);
    setTimeout(() => {
      setOrders((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status: 'Approved' } : row))
      );
      setFlashingRow(null);
    }, 600);
  }, []);

  const risk = (bullwhipRisk ?? 'Low') as BullwhipRisk;
  const colors = riskColor[risk];

  // MAPE badge
  const mapeBadge =
    mapeScore < 5
      ? { label: 'Excellent', cls: 'bg-emerald-500/20 text-emerald-400' }
      : mapeScore <= 10
      ? { label: 'Acceptable', cls: 'bg-amber-500/20 text-amber-400' }
      : { label: 'Review Required', cls: 'bg-red-500/20 text-red-400' };

  return (
    <motion.div
      key="forecasting"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative space-y-6 pb-10"
    >
      {/* ── SplineScene decoration ─────────────────────────────────── */}
      <div
        className="absolute top-0 right-0 pointer-events-none z-0"
        style={{ width: 200, height: 200 }}
        aria-hidden="true"
      >
        <SplineScene
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          targetOpacity={0.15}
          className="w-full h-full"
        />
      </div>

      {/* ── Control bar ────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="glass rounded-xl p-4 flex flex-wrap items-center gap-4 relative z-10"
      >
        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = forecastCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setForecastCategory(cat)}
                className="relative px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 cursor-pointer"
                style={{ color: active ? '#030712' : '#9CA3AF' }}
              >
                {active && (
                  <motion.span
                    layoutId="categoryPill"
                    className="absolute inset-0 bg-amber-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            );
          })}
        </div>

        <div className="w-px h-6 bg-[#1F2937] hidden sm:block" />

        {/* Horizon pills */}
        <div className="flex gap-1 bg-[#1F2937] rounded-full p-1">
          {HORIZONS.map((h) => {
            const active = horizon === h;
            return (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className="relative px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors duration-200"
                style={{ color: active ? '#030712' : '#9CA3AF' }}
              >
                {active && (
                  <motion.span
                    layoutId="horizonPill"
                    className="absolute inset-0 bg-amber-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{h}</span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto">
          <motion.button
            onClick={handleRunForecast}
            disabled={runState !== 'idle'}
            whileHover={runState === 'idle' ? { scale: 1.04 } : {}}
            whileTap={runState === 'idle' ? { scale: 0.96 } : {}}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer ${
              runState === 'success'
                ? 'bg-emerald-500 text-white'
                : runState === 'loading'
                ? 'bg-amber-500/70 text-[#030712] cursor-not-allowed'
                : 'bg-amber-500 text-[#030712] hover:bg-amber-400'
            }`}
          >
            {runState === 'loading' && <Spinner />}
            {runState === 'success' && <CheckIcon />}
            {runState === 'idle' && (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            )}
            {runState === 'loading' ? 'Running…' : runState === 'success' ? 'Complete!' : 'Run Forecast'}
          </motion.button>
        </div>
      </motion.div>

      {/* ── Main forecast chart ─────────────────────────────────────── */}
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 relative z-10"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Demand Forecast</h2>
            <p className="text-xs text-gray-500 mt-0.5">{forecastCategory} · {horizon} horizon</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-6 h-0.5 bg-amber-400 inline-block rounded" />
              Forecast
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-6 h-0.5 inline-block rounded"
                style={{
                  background: 'repeating-linear-gradient(90deg,#fff 0,#fff 4px,transparent 4px,transparent 6px)',
                }}
              />
              Actual
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-6 h-3 bg-amber-400/10 border border-amber-400/30 inline-block rounded" />
              Confidence
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={forecast} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6B7280', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#1F2937' }}
            />
            <YAxis
              tick={{ fill: '#6B7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={55}
              tickFormatter={(v: number) => v.toLocaleString()}
            />
            <Tooltip content={<CustomForecastTooltip />} />

            {/* Confidence band — upper */}
            <Area
              dataKey="upper"
              fill="#F59E0B"
              fillOpacity={0.08}
              stroke="none"
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
            />
            {/* Confidence band — lower (fills between lower and upper) */}
            <Area
              dataKey="lower"
              fill="#030712"
              fillOpacity={1}
              stroke="none"
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
            />

            {/* Actual line */}
            <Line
              dataKey="actual"
              stroke="#F9FAFB"
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={false}
              connectNulls={false}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
            />

            {/* Forecast line */}
            <Line
              dataKey="forecast"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
            />

            {/* Today reference line */}
            <ReferenceLine
              x={forecast[7]?.date}
              stroke="#F59E0B"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              label={{
                value: 'Today',
                position: 'top',
                fill: '#F59E0B',
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── Metrics row ────────────────────────────────────────────── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10"
      >
        {/* MAPE */}
        <motion.div variants={fadeUp} className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">MAPE Score</p>
          <div className="flex items-end gap-2">
            <span className="font-mono text-2xl font-bold text-white">{mapeScore.toFixed(1)}%</span>
            <span className={`mb-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${mapeBadge.cls}`}>
              {mapeBadge.label}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">Mean Absolute Percentage Error</p>
        </motion.div>

        {/* Forecast Bias */}
        <motion.div variants={fadeUp} className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Forecast Bias</p>
          <span className="font-mono text-2xl font-bold text-white">−2.3%</span>
          <p className="text-xs text-gray-600 mt-1">Slight under-forecast tendency</p>
        </motion.div>

        {/* Confidence Band */}
        <motion.div variants={fadeUp} className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Confidence Band</p>
          <span className="font-mono text-2xl font-bold text-white">±15%</span>
          <p className="text-xs text-gray-600 mt-1">95% prediction interval width</p>
        </motion.div>

        {/* Next Peak */}
        <motion.div variants={fadeUp} className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Next Demand Peak</p>
          <div className="flex items-end gap-2">
            <span className="font-mono text-2xl font-bold text-white">Thursday</span>
            <span className="mb-1 text-amber-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">+18% above weekly average</p>
        </motion.div>
      </motion.div>

      {/* ── Bullwhip Effect Visualiser ──────────────────────────────── */}
      <motion.div
        variants={slideLeft}
        initial="hidden"
        animate="visible"
        className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 relative z-10"
      >
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-base font-semibold text-white">Bullwhip Effect Analysis</h2>
          <InfoTooltip text="The bullwhip effect describes how small fluctuations in retail demand can cause increasingly large variance in orders upstream, amplifying instability throughout the supply chain." />
          <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors.badge}`}>
            {risk} Risk
          </span>
          <span className={`font-mono text-sm font-bold ml-1 ${colors.text}`}>
            Score: {bullwhipScore.toFixed(1)}
          </span>
        </div>

        {/* Tier blocks */}
        <div className="flex items-end justify-center gap-3 mb-6">
          {BULLWHIP_TIERS.map((tier, idx) => (
            <div key={tier.key} className="flex flex-col items-center gap-2">
              {/* Connecting arrow (not on first) */}
              {idx > 0 && (
                <div className="flex items-center mb-1 h-3 overflow-hidden">
                  {[0, 1, 2].map((dot) => (
                    <motion.div
                      key={dot}
                      className={`w-1.5 h-1.5 rounded-full ${colors.text.replace('text-', 'bg-')}`}
                      animate={{ x: [8, -8] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: dot * 0.25,
                        ease: 'linear',
                      }}
                    />
                  ))}
                </div>
              )}

              <motion.div
                whileHover={{ scale: 1.04, rotateX: -4 }}
                transition={{ duration: 0.2 }}
                style={{ perspective: 600 }}
                className={`${tier.widthClass} min-w-[90px] rounded-xl border-2 ${colors.border} ${colors.bg} p-4 flex flex-col items-center gap-1 cursor-default`}
              >
                <span className={`text-[10px] font-semibold uppercase tracking-widest ${colors.text}`}>
                  {tier.label}
                </span>
                <span className={`font-mono text-lg font-bold ${colors.text}`}>
                  {bullwhipScore.toFixed(1)}
                </span>
                <div className={`w-full h-1 rounded-full ${colors.bg} mt-1`}>
                  <motion.div
                    className={`h-full rounded-full ${colors.text.replace('text-', 'bg-')}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(bullwhipScore * 10, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: idx * 0.1 }}
                  />
                </div>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Recommendation card */}
        <AnimatePresence>
          {(risk === 'Medium' || risk === 'High') && (
            <motion.div
              key="bullwhip-rec"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={`rounded-xl border ${colors.border} ${colors.bg} p-4 flex gap-3`}
            >
              <div className={`mt-0.5 ${colors.text} flex-shrink-0`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <p className={`text-sm font-semibold ${colors.text} mb-1`}>
                  {risk === 'High' ? 'Urgent Action Required' : 'Recommendation'}
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">{BULLWHIP_RECOMMENDATIONS[risk]}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Order Recommendations table ─────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden relative z-10"
      >
        <div className="p-5 border-b border-[#1F2937]">
          <h2 className="text-base font-semibold text-white">Order Recommendations</h2>
          <p className="text-xs text-gray-500 mt-0.5">AI-generated reorder suggestions based on forecast</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="sticky top-0 bg-[#0F172A] text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Product</th>
                <th className="text-right px-5 py-3 font-semibold">Current Stock</th>
                <th className="text-right px-5 py-3 font-semibold">Recommended Order</th>
                <th className="text-left px-4 py-3 font-semibold">Unit</th>
                <th className="text-center px-5 py-3 font-semibold">Status</th>
                <th className="text-center px-5 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
              {orders.map((row, idx) => {
                const isFlashing = flashingRow === row.id;
                const isApproved = row.status === 'Approved';
                return (
                  <motion.tr
                    key={row.id}
                    variants={fadeUp}
                    custom={idx}
                    className={`border-t border-[#1F2937] transition-colors duration-300 ${
                      isFlashing ? 'bg-emerald-500/10' : 'hover:bg-[#0F172A]'
                    }`}
                  >
                    <td className="px-5 py-3.5 text-white font-medium">{row.product}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-mono text-gray-300">{row.currentStock.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-mono font-semibold ${isApproved ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {row.recommendedOrder.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{row.unit}</td>
                    <td className="px-5 py-3.5 text-center">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={row.status}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isApproved
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {row.status}
                        </motion.span>
                      </AnimatePresence>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <motion.button
                        whileHover={!isApproved ? { scale: 1.08 } : {}}
                        whileTap={!isApproved ? { scale: 0.94 } : {}}
                        onClick={() => !isApproved && handleApprove(row.id)}
                        disabled={isApproved}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                          isApproved
                            ? 'bg-emerald-500/10 text-emerald-500 cursor-default'
                            : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500 hover:text-[#030712]'
                        }`}
                      >
                        {isApproved ? 'Approved ✓' : 'Approve'}
                      </motion.button>
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
