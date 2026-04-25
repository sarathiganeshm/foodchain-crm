'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { fadeUp, staggerContainer, scaleIn } from '@/lib/animations';

// ─── Types ──────────────────────────────────────────────────────────────────

interface MonthlyWaste {
  month: string;
  fresh: number;
  dairy: number;
  bakery: number;
  meat: number;
  total: number;
}

interface WasteStage {
  name: string;
  value: number;
  pct: number;
  color: string;
}

interface TrajectoryPoint {
  year: number;
  target: number | null;
  actual: number | null;
}

interface KPIRow {
  category: string;
  waste: number;
  target: number;
  variance: number;
  status: 'On Target' | 'At Risk' | 'Off Target';
  trend: number[];
}

interface ProductRow {
  product: string;
  category: string;
  waste: number;
  pctOfCategory: number;
  cause: 'Cosmetic' | 'Overstock' | 'Spoilage' | 'Forecast';
}

// ─── Hardcoded Data ──────────────────────────────────────────────────────────

const MONTHLY_WASTE: MonthlyWaste[] = [
  { month: 'Jan', fresh: 180, dairy: 120, bakery: 95,  meat: 145, total: 540  },
  { month: 'Feb', fresh: 165, dairy: 115, bakery: 88,  meat: 132, total: 500  },
  { month: 'Mar', fresh: 190, dairy: 125, bakery: 102, meat: 158, total: 575  },
  { month: 'Apr', fresh: 210, dairy: 130, bakery: 108, meat: 168, total: 616  },
  { month: 'May', fresh: 175, dairy: 118, bakery: 91,  meat: 141, total: 525  },
  { month: 'Jun', fresh: 200, dairy: 122, bakery: 99,  meat: 155, total: 576  },
  { month: 'Jul', fresh: 225, dairy: 128, bakery: 105, meat: 172, total: 630  },
  { month: 'Aug', fresh: 215, dairy: 135, bakery: 112, meat: 178, total: 640  },
  { month: 'Sep', fresh: 195, dairy: 120, bakery: 96,  meat: 149, total: 560  },
  { month: 'Oct', fresh: 185, dairy: 117, bakery: 89,  meat: 143, total: 534  },
  { month: 'Nov', fresh: 220, dairy: 132, bakery: 107, meat: 175, total: 634  },
  { month: 'Dec', fresh: 245, dairy: 140, bakery: 118, meat: 192, total: 695  },
];

const WASTE_BY_STAGE: WasteStage[] = [
  { name: 'Farm',         value: 180, pct: 12, color: '#F59E0B' },
  { name: 'Processing',   value: 270, pct: 18, color: '#3B82F6' },
  { name: 'Distribution', value: 525, pct: 35, color: '#8B5CF6' },
  { name: 'Retail',       value: 525, pct: 35, color: '#EF4444' },
];

const TRAJECTORY: TrajectoryPoint[] = [
  { year: 2024, target: 1500, actual: 1510 },
  { year: 2025, target: 1350, actual: 1490 },
  { year: 2026, target: 1200, actual: null  },
  { year: 2027, target: 1050, actual: null  },
  { year: 2028, target: 900,  actual: null  },
  { year: 2029, target: 800,  actual: null  },
  { year: 2030, target: 750,  actual: null  },
];

const KPI_ROWS: KPIRow[] = [
  { category: 'Fresh Produce', waste: 612,  target: 540,  variance: 13.3,  status: 'Off Target', trend: [180, 165, 190, 210, 175, 200] },
  { category: 'Dairy',         waste: 392,  target: 380,  variance: 3.2,   status: 'At Risk',    trend: [120, 115, 125, 130, 118, 122] },
  { category: 'Bakery',        waste: 298,  target: 310,  variance: -3.9,  status: 'On Target',  trend: [95, 88, 102, 108, 91, 99]    },
  { category: 'Meat',          waste: 495,  target: 460,  variance: 7.6,   status: 'At Risk',    trend: [145, 132, 158, 168, 141, 155] },
  { category: 'Frozen',        waste: 182,  target: 190,  variance: -4.2,  status: 'On Target',  trend: [32, 28, 35, 38, 26, 31]      },
  { category: 'Ready Meals',   waste: 248,  target: 220,  variance: 12.7,  status: 'Off Target', trend: [38, 44, 51, 47, 40, 52]      },
];

const PRODUCT_ROWS: ProductRow[] = [
  { product: 'Bagged Salad Leaves',   category: 'Fresh Produce', waste: 148, pctOfCategory: 24.2, cause: 'Cosmetic'  },
  { product: 'Strawberries (punnet)',  category: 'Fresh Produce', waste: 112, pctOfCategory: 18.3, cause: 'Spoilage'  },
  { product: 'Semi-Skimmed Milk 2L',  category: 'Dairy',         waste: 98,  pctOfCategory: 25.0, cause: 'Overstock' },
  { product: 'Greek Yoghurt 500g',    category: 'Dairy',         waste: 74,  pctOfCategory: 18.9, cause: 'Forecast'  },
  { product: 'Sliced White Bread 800g', category: 'Bakery',      waste: 96,  pctOfCategory: 32.2, cause: 'Overstock' },
  { product: 'Croissants (4-pack)',    category: 'Bakery',        waste: 62,  pctOfCategory: 20.8, cause: 'Spoilage'  },
  { product: 'Diced Chicken Breast',  category: 'Meat',          waste: 134, pctOfCategory: 27.1, cause: 'Forecast'  },
  { product: 'Beef Mince 500g',       category: 'Meat',          waste: 118, pctOfCategory: 23.8, cause: 'Cosmetic'  },
];

// ─── Cause Badge ─────────────────────────────────────────────────────────────

const CAUSE_COLORS: Record<ProductRow['cause'], string> = {
  Cosmetic:  'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  Overstock: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  Spoilage:  'bg-red-500/20 text-red-400 border border-red-500/30',
  Forecast:  'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

// ─── Count-Up Hook ───────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1.4, prefix = '', suffix = '') {
  const [display, setDisplay] = useState('0');
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(v) {
        const formatted = v >= 1000
          ? v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
          : v.toFixed(target % 1 !== 0 ? 1 : 0);
        setDisplay(prefix + formatted + suffix);
      },
    });
    return () => controls.stop();
  }, [inView, target, duration, prefix, suffix]);

  return { ref, display };
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 shadow-xl border border-white/10">
      <p className="text-xs text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-300 capitalize">{p.name}:</span>
          <span className="font-mono font-semibold text-white">{p.value.toLocaleString()}t</span>
        </div>
      ))}
    </div>
  );
};

// ─── Tiny Sparkline ───────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const sparkData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width={80} height={32}>
      <LineChart data={sparkData}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={true}
          animationDuration={800}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  color: string;
  glowClass?: string;
  icon: React.ReactNode;
  sub?: string;
  delay?: number;
}

function KpiCard({ title, value, prefix = '', suffix = '', color, glowClass, icon, sub, delay = 0 }: KpiCardProps) {
  const { ref, display } = useCountUp(value, 1.4, prefix, suffix);

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
      className={`gradient-border rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden cursor-default ${glowClass ?? ''}`}
    >
      {/* Spotlight glow */}
      <div
        className="absolute inset-0 opacity-10 rounded-2xl pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${color}55 0%, transparent 70%)` }}
      />

      <div className="flex items-start justify-between relative z-10">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">{title}</p>
        <span className="text-lg">{icon}</span>
      </div>

      <span
        ref={ref}
        className="font-mono text-3xl font-bold tracking-tight relative z-10"
        style={{ color }}
      >
        {display}
      </span>

      {sub && <p className="text-xs text-gray-500 relative z-10">{sub}</p>}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WasteAnalyticsPage() {
  const tableRef = useRef<HTMLDivElement>(null);
  const tableInView = useInView(tableRef, { once: true, margin: '-80px' });

  const productRef = useRef<HTMLDivElement>(null);
  const productInView = useInView(productRef, { once: true, margin: '-80px' });

  const progressRef = useRef<HTMLDivElement>(null);
  const progressInView = useInView(progressRef, { once: true, margin: '-80px' });

  // Progress = 18% of the 50% reduction journey achieved (based on spec).
  // 1847t current vs 2023 baseline ~2105t → −12.4% reduction → 12.4/50 = 24.8% of journey.
  // Spec places bar at ~18% to reflect being behind schedule.
  const PROGRESS_PCT = 18;

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 p-6 space-y-8">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Waste Analytics</h1>
            <p className="text-gray-400 mt-1 text-sm">
              UK Retail Food Waste · FY 2025 · Courtauld Commitment Tracking
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Live data · Updated 09:41
          </div>
        </div>
      </motion.div>

      {/* ── Hero KPI Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Waste YTD"
          value={1847}
          suffix="t"
          color="#F59E0B"
          glowClass="glow-amber"
          icon="♻️"
          sub="Tonnes of food wasted year-to-date"
          delay={0}
        />
        <KpiCard
          title="CO₂ Equivalent"
          value={4617}
          suffix="t CO₂e"
          color="#94A3B8"
          icon="🌫️"
          sub="Carbon footprint of waste generated"
          delay={0.08}
        />
        <KpiCard
          title="Economic Value"
          value={2.3}
          prefix="£"
          suffix="M"
          color="#EF4444"
          glowClass="glow-red"
          icon="💷"
          sub="Estimated retail value of wasted stock"
          delay={0.16}
        />
        <KpiCard
          title="Reduction vs 2023"
          value={12.4}
          prefix="−"
          suffix="%"
          color="#10B981"
          glowClass="glow-green"
          icon="↓"
          sub="Year-on-year improvement achieved"
          delay={0.24}
        />
      </div>

      {/* ── Main Charts Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Left: 12-month stacked area */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
          className="gradient-border rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Monthly Waste by Category</h2>
              <p className="text-xs text-gray-500 mt-0.5">12-month rolling · tonnes</p>
            </div>
            <div className="flex gap-3 text-xs">
              {[
                { label: 'Fresh', color: '#F59E0B' },
                { label: 'Dairy', color: '#10B981' },
                { label: 'Bakery', color: '#3B82F6' },
                { label: 'Meat',  color: '#8B5CF6' },
              ].map(({ label, color }) => (
                <span key={label} className="flex items-center gap-1.5 text-gray-400">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={MONTHLY_WASTE} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="gradFresh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradDairy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradBakery" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradMeat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone" dataKey="fresh" stackId="1"
                stroke="#F59E0B" fill="url(#gradFresh)" strokeWidth={1.5}
                isAnimationActive={true} animationBegin={0} animationDuration={1200}
              />
              <Area
                type="monotone" dataKey="dairy" stackId="1"
                stroke="#10B981" fill="url(#gradDairy)" strokeWidth={1.5}
                isAnimationActive={true} animationBegin={200} animationDuration={1200}
              />
              <Area
                type="monotone" dataKey="bakery" stackId="1"
                stroke="#3B82F6" fill="url(#gradBakery)" strokeWidth={1.5}
                isAnimationActive={true} animationBegin={400} animationDuration={1200}
              />
              <Area
                type="monotone" dataKey="meat" stackId="1"
                stroke="#8B5CF6" fill="url(#gradMeat)" strokeWidth={1.5}
                isAnimationActive={true} animationBegin={600} animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Right: Donut – Waste by Stage */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="gradient-border rounded-2xl p-6 space-y-4"
        >
          <div>
            <h2 className="text-base font-semibold text-white">Waste by Supply-Chain Stage</h2>
            <p className="text-xs text-gray-500 mt-0.5">Total 1,500t · annual</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie
                    data={WASTE_BY_STAGE}
                    innerRadius={60}
                    outerRadius={100}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive={true}
                    animationBegin={200}
                    animationDuration={1400}
                  >
                    {WASTE_BY_STAGE.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as WasteStage;
                      return (
                        <div className="glass rounded-xl px-4 py-3 shadow-xl border border-white/10 text-xs">
                          <p className="font-medium text-white">{d.name}</p>
                          <p className="font-mono text-gray-300 mt-1">{d.value}t · {d.pct}%</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-mono text-xl font-bold text-white">1,500t</span>
                <span className="text-xs text-gray-500 mt-0.5">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-3 flex-1">
              {WASTE_BY_STAGE.map((s) => (
                <div key={s.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-sm text-gray-300">{s.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-semibold text-white">{s.value}t</span>
                    <span className="font-mono text-xs text-gray-500 ml-1.5">{s.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── KPI Table ────────────────────────────────────────────── */}
      <motion.div
        ref={tableRef}
        variants={scaleIn}
        initial="hidden"
        animate={tableInView ? 'visible' : 'hidden'}
        className="gradient-border rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-base font-semibold text-white">Category KPI Summary</h2>
          <p className="text-xs text-gray-500 mt-0.5">Performance vs annual targets · YTD 2025</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0F172A] z-10">
              <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="text-left px-6 py-3 font-medium">Category</th>
                <th className="text-right px-4 py-3 font-medium">Waste</th>
                <th className="text-right px-4 py-3 font-medium">Target</th>
                <th className="text-right px-4 py-3 font-medium">Variance</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {KPI_ROWS.map((row, i) => (
                <motion.tr
                  key={row.category}
                  variants={fadeUp}
                  initial="hidden"
                  animate={tableInView ? 'visible' : 'hidden'}
                  transition={{ delay: i * 0.07 }}
                  className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-white">{row.category}</td>
                  <td className="px-4 py-4 text-right font-mono text-gray-200">{row.waste}t</td>
                  <td className="px-4 py-4 text-right font-mono text-gray-400">{row.target}t</td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className={`font-mono text-sm font-semibold inline-flex items-center gap-1 ${
                        row.variance > 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {row.variance > 0 ? '↑' : '↓'}
                      {Math.abs(row.variance).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        row.status === 'On Target'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                          : row.status === 'At Risk'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                          : 'bg-red-500/15 text-red-400 border border-red-500/25'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          row.status === 'On Target'
                            ? 'bg-emerald-400'
                            : row.status === 'At Risk'
                            ? 'bg-amber-400'
                            : 'bg-red-400'
                        }`}
                      />
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <Sparkline
                        data={row.trend}
                        color={
                          row.status === 'On Target'
                            ? '#10B981'
                            : row.status === 'At Risk'
                            ? '#F59E0B'
                            : '#EF4444'
                        }
                      />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── 2030 Target Progress ─────────────────────────────────── */}
      <motion.div
        ref={progressRef}
        variants={scaleIn}
        initial="hidden"
        animate={progressInView ? 'visible' : 'hidden'}
        className="gradient-border rounded-2xl p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">
              Courtauld Commitment 2030 — 50% Reduction Target
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Baseline year 2018 · Target: ≤1,500t by 2030 · Current: 1,847t
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            Behind Target
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-gray-500 font-mono">
            <span>0%</span>
            <span className="text-amber-400 font-semibold">{PROGRESS_PCT}% achieved</span>
            <span>50% (2030 goal)</span>
          </div>

          <div className="relative h-5 bg-[#1F2937] rounded-full overflow-hidden">
            {/* Fill */}
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, #D97706, #F59E0B, #FDE68A)',
              }}
              initial={{ width: '0%' }}
              animate={progressInView ? { width: `${PROGRESS_PCT}%` } : { width: '0%' }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            >
              {/* Glow on leading edge */}
              <div className="absolute right-0 top-0 bottom-0 w-6 bg-amber-300/60 blur-sm rounded-full" />
            </motion.div>

            {/* Milestone markers */}
            {[
              { pct: 25,   label: '2025' },
              { pct: 37.5, label: '2027' },
              { pct: 50,   label: '2030' },
            ].map(({ pct, label }) => (
              <div
                key={label}
                className="absolute top-0 bottom-0 flex flex-col items-center"
                style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-px h-full bg-white/20" />
              </div>
            ))}
          </div>

          {/* Milestone labels */}
          <div className="relative h-4">
            {[
              { pct: 25,   label: '2025 (25%)' },
              { pct: 37.5, label: '2027 (37.5%)' },
              { pct: 50,   label: '2030 (50%)' },
            ].map(({ pct, label }) => (
              <span
                key={label}
                className="absolute text-[10px] text-gray-500 font-mono"
                style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Trajectory Chart */}
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-5 h-0.5 bg-red-400 inline-block rounded" /> Current Trajectory
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-5 h-0.5 bg-emerald-400 inline-block rounded" /> Required Trajectory
            </span>
            <span className="flex items-center gap-1.5 text-red-400/60">
              <span className="w-4 h-3 bg-red-400/20 inline-block rounded border border-red-400/30" /> Gap
            </span>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={TRAJECTORY} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="gradGap" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="year" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[600, 1600]} tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="glass rounded-xl px-4 py-3 shadow-xl border border-white/10 text-xs space-y-1">
                      <p className="text-gray-400 font-medium">{label}</p>
                      {payload.map((p) => p.value != null && (
                        <div key={p.name} className="flex gap-2 font-mono">
                          <span style={{ color: p.color }}>{p.name}:</span>
                          <span className="text-white font-semibold">{Number(p.value).toLocaleString()}t</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <ReferenceLine y={750} stroke="#10B981" strokeDasharray="4 4" strokeOpacity={0.4} />
              {/* Gap area between actual and target */}
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#EF4444"
                strokeWidth={2.5}
                fill="url(#gradGap)"
                name="Current Trajectory"
                dot={{ fill: '#EF4444', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 5 }}
                isAnimationActive={true}
                animationBegin={100}
                animationDuration={1400}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#10B981"
                strokeWidth={2.5}
                name="Required Trajectory"
                dot={{ fill: '#10B981', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 5 }}
                isAnimationActive={true}
                animationBegin={300}
                animationDuration={1400}
                connectNulls={true}
                strokeDasharray="0"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── Product Breakdown Table ───────────────────────────────── */}
      <motion.div
        ref={productRef}
        variants={scaleIn}
        initial="hidden"
        animate={productInView ? 'visible' : 'hidden'}
        className="gradient-border rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-base font-semibold text-white">Product Waste Breakdown</h2>
          <p className="text-xs text-gray-500 mt-0.5">Top wasted SKUs by volume · primary cause analysis</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0F172A]">
              <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="text-left px-6 py-3 font-medium">Product</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-right px-4 py-3 font-medium">Waste</th>
                <th className="text-right px-4 py-3 font-medium">% of Cat.</th>
                <th className="text-left px-4 py-3 font-medium">Primary Cause</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCT_ROWS.map((row, i) => (
                <motion.tr
                  key={row.product}
                  variants={fadeUp}
                  initial="hidden"
                  animate={productInView ? 'visible' : 'hidden'}
                  transition={{ delay: i * 0.06 }}
                  className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-white">{row.product}</td>
                  <td className="px-4 py-4 text-gray-400 text-xs">{row.category}</td>
                  <td className="px-4 py-4 text-right font-mono text-gray-200">{row.waste}t</td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-mono text-sm text-gray-300">{row.pctOfCategory}%</span>
                    <div className="mt-1.5 h-1 bg-[#1F2937] rounded-full overflow-hidden w-20 ml-auto">
                      <motion.div
                        className="h-full rounded-full bg-amber-500"
                        initial={{ width: 0 }}
                        animate={productInView ? { width: `${row.pctOfCategory}%` } : { width: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.06, ease: 'easeOut' }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${CAUSE_COLORS[row.cause]}`}>
                      {row.cause}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        <div className="px-6 py-4 border-t border-white/5 flex flex-wrap gap-4 text-xs text-gray-500">
          {(['Cosmetic', 'Overstock', 'Spoilage', 'Forecast'] as const).map((cause) => {
            const count = PRODUCT_ROWS.filter((r) => r.cause === cause).length;
            return (
              <span key={cause} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded ${CAUSE_COLORS[cause]}`}>
                {cause}: {count} SKU{count !== 1 ? 's' : ''}
              </span>
            );
          })}
        </div>
      </motion.div>

    </div>
  );
}
