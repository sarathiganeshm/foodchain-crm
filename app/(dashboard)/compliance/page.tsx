'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { fadeUp, staggerContainer, scaleIn } from '@/lib/animations';

// ─── Constants ────────────────────────────────────────────────────────────────
const COMPLIANCE_SCORE = 78;
const CIRCUMFERENCE = 2 * Math.PI * 54; // r=54

// ─── Compliance cards data ────────────────────────────────────────────────────
const COMPLIANCE_CARDS = [
  {
    id: 'courtauld',
    title: 'Courtauld Commitment',
    subtitle: 'WRAP — UK Food & Drink Sector',
    progress: 62,
    color: 'amber',
    description: 'The Courtauld 2030 Commitment is a voluntary agreement to make UK food and drink production and consumption more sustainable. Targets include a 50% reduction in food waste by 2030 against a 2015 baseline.',
    details: [
      '62% progress toward 25% reduction milestone (2025)',
      'Food waste intensity reduced by 15.3% since 2015',
      'Water use in supply chain down 11.2%',
      'GHG emissions from food system reduced by 8.7%',
    ],
  },
  {
    id: 'epr',
    title: 'EPR Reform Readiness',
    subtitle: 'Extended Producer Responsibility',
    progress: 85,
    color: 'green',
    description: 'Extended Producer Responsibility (EPR) for packaging requires producers to fund the full net cost of managing household packaging waste. Full fee modulation takes effect April 2026.',
    details: [
      '85% of packaging data captured and reportable',
      'Producer obligation compliance system integrated',
      'Recyclability data mapped for 94% of SKUs',
      'Annual EPR returns automated via supply chain data',
    ],
  },
  {
    id: 'wrap',
    title: 'WRAP Voluntary Agreement',
    subtitle: 'Plastic Pact UK',
    progress: 71,
    color: 'blue',
    description: 'The UK Plastics Pact is a voluntary agreement to eliminate problematic or unnecessary single-use plastic packaging, make all plastic packaging reusable, recyclable or compostable by 2025.',
    details: [
      '71% of plastic packaging now recyclable or compostable',
      'Problematic plastics eliminated in 8 of 12 categories',
      'Recycled content in plastic packaging: 23% average',
      'Consumer-facing recyclability labelling: 89% coverage',
    ],
  },
];

// ─── Timeline milestones ──────────────────────────────────────────────────────
const MILESTONES = [
  { year: '2022', label: 'Courtauld Commitment signed', status: 'past' as const },
  { year: '2023', label: 'Baseline measurement completed', status: 'past' as const },
  { year: '2025', label: '25% reduction milestone', status: 'current' as const },
  { year: '2026', label: 'EPR regulations take effect', status: 'future' as const },
  { year: '2028', label: '37.5% reduction target', status: 'future' as const },
  { year: '2030', label: '50% Courtauld target', status: 'future' as const },
];

// ─── Cosmetic rejection data ──────────────────────────────────────────────────
const REJECTION_DATA = [
  { product: 'Cucumbers', current: 38, reformed: 20 },
  { product: 'Strawberries', current: 42, reformed: 25 },
  { product: 'Carrots', current: 31, reformed: 18 },
  { product: 'Courgettes', current: 35, reformed: 22 },
  { product: 'Apples', current: 28, reformed: 15 },
];

// ─── Circular Score ───────────────────────────────────────────────────────────
function CircularScore() {
  const dashOffset = CIRCUMFERENCE * (1 - COMPLIANCE_SCORE / 100);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <svg width="160" height="160" viewBox="0 0 160 160">
          {/* Background track */}
          <circle
            cx="80" cy="80" r="54"
            fill="none"
            stroke="#1F2937"
            strokeWidth="10"
          />
          {/* Score arc */}
          <motion.circle
            cx="80" cy="80" r="54"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            transform="rotate(-90 80 80)"
            style={{ filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.6))' }}
          />
          {/* Score text */}
          <text x="80" y="75" textAnchor="middle" fill="white" fontSize="28" fontWeight="700" fontFamily="JetBrains Mono, monospace">
            {COMPLIANCE_SCORE}
          </text>
          <text x="80" y="94" textAnchor="middle" fill="#6B7280" fontSize="12" fontFamily="Inter, sans-serif">
            / 100
          </text>
        </svg>
      </div>

      {/* Status badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="relative flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-full"
      >
        <motion.span
          className="w-2 h-2 rounded-full bg-amber-400"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="text-amber-400 font-semibold text-sm">Partially Compliant</span>
      </motion.div>

      <div className="text-center max-w-xs">
        <p className="text-gray-400 text-sm leading-relaxed">
          Overall compliance score across Courtauld, EPR, and WRAP frameworks. Three areas require attention before next regulatory review.
        </p>
      </div>
    </div>
  );
}

// ─── Animated Progress Bar ────────────────────────────────────────────────────
function ProgressBar({ value, color }: { value: number; color: string }) {
  const barColor =
    color === 'amber' ? '#F59E0B' :
    color === 'green' ? '#10B981' : '#3B82F6';

  return (
    <div className="w-full h-2 bg-[#1F2937] rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: barColor, boxShadow: `0 0 8px ${barColor}60` }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      />
    </div>
  );
}

// ─── Compliance Card ──────────────────────────────────────────────────────────
function ComplianceCard({ card }: { card: typeof COMPLIANCE_CARDS[0] }) {
  const [expanded, setExpanded] = useState(false);

  const accentColor =
    card.color === 'amber' ? { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', badge: 'bg-amber-500/20' } :
    card.color === 'green' ? { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', badge: 'bg-emerald-500/20' } :
    { text: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10', badge: 'bg-blue-500/20' };

  return (
    <motion.div
      variants={scaleIn}
      className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-white font-semibold">{card.title}</h3>
            <p className="text-gray-500 text-xs mt-0.5">{card.subtitle}</p>
          </div>
          <span className={`shrink-0 font-mono text-lg font-bold ${accentColor.text}`}>
            {card.progress}%
          </span>
        </div>

        {/* Progress bar */}
        <ProgressBar value={card.progress} color={card.color} />

        {/* Description */}
        <p className="text-gray-400 text-sm mt-4 leading-relaxed">{card.description}</p>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className={`mt-4 flex items-center gap-2 text-xs font-medium ${accentColor.text} hover:opacity-80 transition-opacity`}
        >
          {expanded ? 'Show less' : 'Show details'}
          <motion.svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
          >
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </button>
      </div>

      {/* Expandable details */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className={`px-5 pb-5 border-t border-[#1F2937] pt-4 ${accentColor.bg}`}>
              <ul className="space-y-2">
                {card.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                      card.color === 'amber' ? 'bg-amber-400' :
                      card.color === 'green' ? 'bg-emerald-400' : 'bg-blue-400'
                    }`} />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Timeline Milestone ───────────────────────────────────────────────────────
function TimelineMilestone({
  milestone,
  index,
  isLast,
}: {
  milestone: typeof MILESTONES[0];
  index: number;
  isLast: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const isPast = milestone.status === 'past';
  const isCurrent = milestone.status === 'current';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-center gap-4 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {/* Content card */}
      <div className={`flex-1 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block bg-[#111827] border rounded-xl px-4 py-3 ${
          isPast ? 'border-emerald-500/30' :
          isCurrent ? 'border-amber-500/30' :
          'border-[#1F2937]'
        }`}>
          <p className={`text-xs font-mono font-bold mb-0.5 ${
            isPast ? 'text-emerald-400' :
            isCurrent ? 'text-amber-400' :
            'text-gray-600'
          }`}>{milestone.year}</p>
          <p className={`text-sm font-medium ${
            isPast ? 'text-white' :
            isCurrent ? 'text-white' :
            'text-gray-500'
          }`}>{milestone.label}</p>
        </div>
      </div>

      {/* Center column: dot + line */}
      <div className="flex flex-col items-center w-8 shrink-0">
        {/* Top line */}
        {index > 0 && (
          <div className="w-px flex-1 min-h-[24px]">
            {isPast ? (
              <svg width="2" height="32" viewBox="0 0 2 32" className="w-full h-full">
                <motion.line
                  x1="1" y1="0" x2="1" y2="32"
                  stroke="#10B981"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 + 0.1 }}
                />
              </svg>
            ) : (
              <div className="w-px bg-[#1F2937] h-full mx-auto" />
            )}
          </div>
        )}

        {/* Dot */}
        <div className="relative">
          {isPast && (
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <motion.path
                  d="M5 12l5 5L20 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
                />
              </svg>
            </div>
          )}
          {isCurrent && (
            <div className="relative w-7 h-7 flex items-center justify-center">
              <motion.span
                className="absolute w-7 h-7 rounded-full bg-amber-400/30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="relative w-3.5 h-3.5 rounded-full bg-amber-400" />
            </div>
          )}
          {milestone.status === 'future' && (
            <div className="w-7 h-7 rounded-full bg-[#1F2937] border border-[#374151] flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-[#374151]" />
            </div>
          )}
        </div>

        {/* Bottom line */}
        {!isLast && (
          <div className="w-px flex-1 min-h-[24px]">
            {isPast ? (
              <svg width="2" height="32" viewBox="0 0 2 32" className="w-full h-full">
                <motion.line
                  x1="1" y1="0" x2="1" y2="32"
                  stroke="#10B981"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 + 0.15 }}
                />
              </svg>
            ) : (
              <div className="w-px bg-[#1F2937] h-full mx-auto" />
            )}
          </div>
        )}
      </div>

      {/* Spacer for alternating layout */}
      <div className="flex-1" />
    </motion.div>
  );
}

// ─── Rejection Chart Tooltip ──────────────────────────────────────────────────
function RejectionTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const current = payload.find((p) => p.name === 'Current Rate');
  const reformed = payload.find((p) => p.name === 'Reformed Threshold');
  const saving = current && reformed ? current.value - reformed.value : 0;

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 shadow-xl">
      <p className="text-xs font-mono text-gray-400 mb-3">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs mb-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: entry.color }} />
          <span className="text-gray-400">{entry.name}:</span>
          <span className="font-mono font-semibold text-white">{entry.value}%</span>
        </div>
      ))}
      {saving > 0 && (
        <div className="mt-3 pt-3 border-t border-[#1F2937]">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400/40" />
            <span className="text-emerald-400 font-semibold">Potential saving: {saving}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CompliancePage() {
  return (
    <div className="space-y-10">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden rounded-2xl bg-[#0F172A] border border-[#1F2937] p-8"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to right, rgba(245,158,11,0.08) 0%, transparent 60%)' }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">Regulatory</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Policy & Compliance</h1>
          <p className="text-gray-400 text-sm">UK food waste regulations, voluntary commitments, and reform readiness</p>
        </div>
      </motion.div>

      {/* ── Compliance Score Hero ─────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="bg-[#0F172A] border border-[#1F2937] rounded-2xl p-10 flex flex-col items-center"
      >
        <h2 className="text-lg font-semibold text-white mb-2">Overall Compliance Score</h2>
        <p className="text-sm text-gray-500 mb-8">Aggregated across Courtauld, EPR, and WRAP frameworks</p>
        <CircularScore />
      </motion.div>

      {/* ── Compliance Cards ──────────────────────────────────────────────────── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp} className="mb-5">
          <h2 className="text-lg font-semibold text-white">Framework Status</h2>
          <p className="text-sm text-gray-500 mt-1">Progress against key voluntary and regulatory commitments</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COMPLIANCE_CARDS.map((card) => (
            <ComplianceCard key={card.id} card={card} />
          ))}
        </div>
      </motion.div>

      {/* ── Regulatory Timeline ───────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="bg-[#0F172A] border border-[#1F2937] rounded-2xl p-8"
      >
        <div className="mb-8 text-center">
          <h2 className="text-lg font-semibold text-white">Regulatory Milestone Timeline</h2>
          <p className="text-sm text-gray-500 mt-1">Courtauld 2030 Commitment journey — 2022 to 2030</p>
        </div>

        <div className="max-w-xl mx-auto space-y-1">
          {MILESTONES.map((milestone, index) => (
            <TimelineMilestone
              key={milestone.year}
              milestone={milestone}
              index={index}
              isLast={index === MILESTONES.length - 1}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 flex items-center justify-center gap-6 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            Completed
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-4 h-4 rounded-full bg-amber-400/30 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
            Current milestone
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-4 h-4 rounded-full bg-[#1F2937] border border-[#374151] flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-[#374151]" />
            </div>
            Upcoming
          </div>
        </div>
      </motion.div>

      {/* ── Cosmetic Rejection Analysis ───────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="bg-[#0F172A] border border-[#1F2937] rounded-2xl p-6"
      >
        {/* Header */}
        <div className="mb-2">
          <h2 className="text-lg font-semibold text-white">Cosmetic Rejection Standards — Reform Impact</h2>
          <p className="text-sm text-gray-500 mt-1">
            Current industry rejection rates vs. proposed reformed thresholds under WRAP cosmetic standards reform
          </p>
        </div>

        {/* Summary callout */}
        <div className="mt-4 mb-6 flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-xs text-gray-400 leading-relaxed">
            Relaxing cosmetic standards could reduce produce rejection rates by an average of <span className="text-emerald-400 font-semibold">15–17 percentage points</span>, recovering an estimated{' '}
            <span className="text-emerald-400 font-semibold">£420k/year</span> in previously wasted product value across our supply chain.
          </p>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={REJECTION_DATA}
            layout="vertical"
            barCategoryGap="25%"
            barGap={4}
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={{ stroke: '#1F2937' }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 50]}
            />
            <YAxis
              type="category"
              dataKey="product"
              tick={{ fill: '#9CA3AF', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip content={<RejectionTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Legend
              wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#9CA3AF' }}
              formatter={(value) => <span style={{ color: '#9CA3AF' }}>{value}</span>}
            />
            <Bar
              dataKey="current"
              name="Current Rate"
              fill="#EF4444"
              radius={[0, 4, 4, 0]}
              isAnimationActive
              animationDuration={900}
              animationBegin={200}
            />
            <Bar
              dataKey="reformed"
              name="Reformed Threshold"
              fill="#10B981"
              radius={[0, 4, 4, 0]}
              isAnimationActive
              animationDuration={900}
              animationBegin={400}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Product breakdown */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {REJECTION_DATA.map((item) => {
            const saving = item.current - item.reformed;
            return (
              <div key={item.product} className="bg-[#111827] border border-[#1F2937] rounded-xl p-3 text-center group hover:border-emerald-500/30 transition-colors">
                <p className="text-xs text-gray-500 mb-2">{item.product}</p>
                <p className="font-mono text-sm font-bold text-red-400">{item.current}%</p>
                <div className="flex items-center justify-center gap-1 my-1">
                  <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="font-mono text-xs text-emerald-400">{item.reformed}%</span>
                </div>
                <div className="mt-2 pt-2 border-t border-[#1F2937]">
                  <span className="font-mono text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    -{saving}pp saved
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

    </div>
  );
}
