'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AlertTriangle, TrendingUp, RefreshCw, Trash2, ChevronRight } from 'lucide-react';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { Spotlight } from '@/components/ui/spotlight';
import { useData } from '@/components/providers/DataProvider';
import { staggerContainer, fadeUp, scaleIn, slideLeft } from '@/lib/animations';

/* ─── Tooltip style ─── */
const TOOLTIP_STYLE = {
  backgroundColor: '#111827',
  border: '1px solid #374151',
  borderRadius: '8px',
  color: '#F9FAFB',
  fontSize: '12px',
};

/* ─── Animated counter hook ─── */
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  const start = () => {
    if (started.current) return;
    started.current = true;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      setValue(Math.round(current));
      if (current >= target) clearInterval(timer);
    }, duration / steps);
  };

  return { value, start };
}

/* ─── Waste by stage data ─── */
const WASTE_BY_STAGE = [
  { stage: 'Retail', pct: 35 },
  { stage: 'Distribution', pct: 35 },
  { stage: 'Processing', pct: 18 },
  { stage: 'Farm', pct: 12 },
];

/* ─── Supply chain stages ─── */
const SC_STAGES = ['Farm', 'Processing', 'Distribution', 'Retail'];

/* ─── Stat card ─── */
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  pulse,
  colorClass = 'text-amber-400',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  pulse?: boolean;
  colorClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      className="gradient-border rounded-2xl p-5 relative overflow-hidden cursor-default"
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <Spotlight size={300} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Icon className={`w-4 h-4 ${colorClass}`} aria-hidden="true" />
        </div>
        {pulse && (
          <div className="relative flex items-center justify-center w-5 h-5">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 pulse-ring" />
          </div>
        )}
      </div>
      <div className={`text-2xl font-mono font-bold ${colorClass} leading-none`}>
        {inView ? value : '—'}
      </div>
      <div className="mt-1 text-xs text-gray-500 font-medium">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-gray-600">{sub}</div>}
    </motion.div>
  );
}

/* ─── Cold Chain Arc ─── */
function ColdChainArc({ score }: { score: number }) {
  const controls = useAnimation();
  const ref = useRef<SVGCircleElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const inView = useInView(divRef, { once: true });
  const R = 54;
  const circumference = Math.PI * R; // half circle
  const offset = circumference * (1 - score / 100);

  const color =
    score > 80 ? '#10B981' : score > 60 ? '#F59E0B' : '#EF4444';
  const glowClass =
    score > 80 ? 'glow-green' : score > 60 ? 'glow-amber' : 'glow-red';

  useEffect(() => {
    if (inView) {
      controls.start({ pathLength: score / 100, transition: { duration: 1.4, ease: 'easeOut' } });
    }
  }, [inView, score, controls]);

  return (
    <div ref={divRef} className="flex flex-col items-center">
      <svg width="140" height="80" viewBox="0 0 140 80" aria-label={`Cold chain health ${score}%`}>
        {/* Track */}
        <path
          d="M 10 75 A 60 60 0 0 1 130 75"
          fill="none"
          stroke="#1F2937"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Animated arc */}
        <motion.path
          d="M 10 75 A 60 60 0 0 1 130 75"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={inView ? { strokeDashoffset: offset } : {}}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          className={glowClass}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        {/* Score text */}
        <text x="70" y="68" textAnchor="middle" fill={color} fontSize="20" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
          {score}%
        </text>
      </svg>
    </div>
  );
}

/* ─── Bullwhip Gauge ─── */
function BullwhipGauge({ score, risk }: { score: number; risk: string }) {
  const divRef = useRef<HTMLDivElement>(null);
  const inView = useInView(divRef, { once: true });
  // needle rotation: 0 score = -90deg (left), 100 = +90deg (right)
  const needleDeg = -90 + score * 1.8;

  return (
    <div ref={divRef} className="flex flex-col items-center">
      <svg width="160" height="90" viewBox="0 0 160 90" aria-label={`Bullwhip risk gauge ${risk}`}>
        {/* Green zone (Low) */}
        <path d="M 15 80 A 65 65 0 0 1 70 15" fill="none" stroke="#10B981" strokeWidth="12" strokeLinecap="round" opacity="0.7" />
        {/* Amber zone (Medium) */}
        <path d="M 70 15 A 65 65 0 0 1 110 24" fill="none" stroke="#F59E0B" strokeWidth="12" strokeLinecap="round" opacity="0.7" />
        {/* Red zone (High) */}
        <path d="M 110 24 A 65 65 0 0 1 145 80" fill="none" stroke="#EF4444" strokeWidth="12" strokeLinecap="round" opacity="0.7" />

        {/* Needle */}
        <motion.g
          initial={{ rotate: -90, originX: '80px', originY: '80px' }}
          animate={inView ? { rotate: needleDeg } : {}}
          transition={{ duration: 1.2, type: 'spring', stiffness: 80, damping: 18 }}
          style={{ transformOrigin: '80px 80px' }}
        >
          <line x1="80" y1="80" x2="80" y2="22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="80" cy="80" r="5" fill="white" />
        </motion.g>

        {/* Labels */}
        <text x="18" y="88" fill="#10B981" fontSize="9" fontFamily="JetBrains Mono, monospace">Low</text>
        <text x="70" y="10" fill="#F59E0B" fontSize="9" fontFamily="JetBrains Mono, monospace" textAnchor="middle">Med</text>
        <text x="132" y="88" fill="#EF4444" fontSize="9" fontFamily="JetBrains Mono, monospace" textAnchor="end">High</text>
      </svg>
      <div className="text-center">
        <span
          className={`font-mono font-bold text-base ${
            risk === 'Low' ? 'text-emerald-400' : risk === 'Medium' ? 'text-amber-400' : 'text-red-400'
          }`}
        >
          {risk} Risk
        </span>
        <span className="ml-2 text-gray-500 text-xs font-mono">score: {score}</span>
      </div>
    </div>
  );
}

/* ─── Alert Item ─── */
function AlertItem({ alert, onAck }: { alert: { id: string; message: string; severity: string; location: string; timestamp: Date }; onAck: (id: string) => void }) {
  const color =
    alert.severity === 'critical' ? 'border-red-500/40 bg-red-500/5' :
    alert.severity === 'warning' ? 'border-amber-500/40 bg-amber-500/5' :
    'border-blue-500/40 bg-blue-500/5';
  const dot =
    alert.severity === 'critical' ? 'bg-red-500' :
    alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500';

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } } }}
      className={`flex items-start gap-3 p-3 rounded-xl border ${color} group`}
    >
      <div className={`mt-1 w-2 h-2 rounded-full ${dot} flex-shrink-0 relative pulse-ring`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-300 leading-snug truncate">{alert.message}</p>
        <p className="text-xs text-gray-600 mt-0.5">{alert.location}</p>
      </div>
      <button
        onClick={() => onAck(alert.id)}
        aria-label={`Acknowledge alert ${alert.id}`}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-amber-400 cursor-pointer text-xs font-mono flex-shrink-0"
      >
        ACK
      </button>
    </motion.div>
  );
}

/* ─── Supply Chain Flow Node ─── */
function FlowNode({ label, index, total, healthColor }: { label: string; index: number; total: number; healthColor: string }) {
  return (
    <motion.div
      variants={scaleIn}
      className="flex flex-col items-center gap-2"
    >
      <div
        className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center relative`}
        style={{ borderColor: healthColor, boxShadow: `0 0 16px ${healthColor}40` }}
      >
        <span className="text-xs font-bold text-white text-center leading-tight px-1">{label}</span>
        {/* Pulse dot */}
        <div
          className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full"
          style={{ backgroundColor: healthColor }}
        />
      </div>
      <span className="text-xs text-gray-500 font-mono">Stage {index + 1}</span>
    </motion.div>
  );
}

/* ─── Page ─── */
export default function DashboardPage() {
  const {
    forecast,
    wasteThisWeek,
    mapeScore,
    activeAlerts,
    redistributedToday,
    coldChainScore,
    bullwhipRisk,
    bullwhipScore,
    acknowledgeAlert,
  } = useData();

  // Slice forecast for chart (14 points for readability)
  const chartData = forecast.slice(0, 14).map((f) => ({
    date: f.date,
    Forecast: f.forecast,
    Actual: f.actual ?? undefined,
    Upper: f.upper,
    Lower: f.lower,
  }));

  // Node color based on coldChainScore
  const nodeColor =
    coldChainScore > 80 ? '#10B981' : coldChainScore > 60 ? '#F59E0B' : '#EF4444';

  const alertsToShow = activeAlerts.slice(0, 5);

  return (
    <div className="min-h-full pb-12">
      {/* ── Hero: ContainerScroll ── */}
      <ContainerScroll
        titleComponent={
          <div className="space-y-3">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xs font-mono text-amber-400 uppercase tracking-[0.3em]"
            >
              FoodChain CRM — Live Intelligence
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-4xl md:text-5xl font-extrabold leading-tight"
            >
              <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-white bg-clip-text text-transparent">
                Supply Chain
              </span>
              <br />
              <span className="text-white">Intelligence</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-gray-400 max-w-lg mx-auto"
            >
              Real-time demand forecasting · Cold chain monitoring · Waste analytics
            </motion.p>
          </div>
        }
      >
        {/* Preview chart inside ContainerScroll */}
        <div className="w-full h-full p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">Demand Forecast Preview</span>
            <span className="text-xs font-mono text-gray-500">{forecast[0]?.date} — {forecast[13]?.date}</span>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#9CA3AF' }} />
                <Line type="monotone" dataKey="Forecast" stroke="#F59E0B" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Actual" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ContainerScroll>

      {/* ── Top stats ── */}
      <section aria-label="Key metrics" className="px-0 mb-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 xl:grid-cols-4 gap-4"
        >
          <StatCard
            label="Waste This Week"
            value={`${wasteThisWeek}t`}
            sub="↓ 8.2% vs last week"
            icon={Trash2}
          />
          <StatCard
            label="Forecast Accuracy"
            value={`${mapeScore}%`}
            sub="MAPE score"
            icon={TrendingUp}
            colorClass="text-emerald-400"
          />
          <StatCard
            label="Active Alerts"
            value={String(activeAlerts.length)}
            sub="Unacknowledged"
            icon={AlertTriangle}
            pulse={activeAlerts.length > 3}
            colorClass={activeAlerts.length > 3 ? 'text-red-400' : 'text-amber-400'}
          />
          <StatCard
            label="Redistributed Today"
            value={`${redistributedToday.toLocaleString()}kg`}
            sub="to partner charities"
            icon={RefreshCw}
            colorClass="text-emerald-400"
          />
        </motion.div>
      </section>

      {/* ── Main chart row ── */}
      <section aria-label="Analytics charts" className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Demand vs Actuals */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="gradient-border rounded-2xl p-5 relative overflow-hidden"
        >
          <Spotlight size={400} />
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Demand vs Actuals</h2>
              <p className="text-xs text-gray-500 mt-0.5">14-day rolling window</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-amber-400 inline-block rounded" /> Forecast</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-px bg-white/40 inline-block rounded border-dashed border-t border-white/40" /> Actual</span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#9CA3AF' }} />
                <Line
                  type="monotone"
                  dataKey="Forecast"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={1200}
                />
                <Line
                  type="monotone"
                  dataKey="Actual"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false}
                  animationDuration={1400}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Waste by Stage */}
        <motion.div
          variants={slideLeft}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="gradient-border rounded-2xl p-5 relative overflow-hidden"
        >
          <Spotlight size={400} />
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">Waste by Stage</h2>
            <p className="text-xs text-gray-500 mt-0.5">% share of total supply chain waste</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={WASTE_BY_STAGE}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 40]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="stage"
                  tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [`${value}%`, 'Waste share']}
                />
                <Bar
                  dataKey="pct"
                  fill="#F59E0B"
                  radius={[0, 6, 6, 0]}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </section>

      {/* ── Second row: Cold Chain, Bullwhip, Alerts ── */}
      <section aria-label="Health monitors and alerts" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Cold Chain Health */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="gradient-border rounded-2xl p-5 relative overflow-hidden flex flex-col items-center"
        >
          <Spotlight size={300} />
          <div className="w-full mb-4">
            <h2 className="text-sm font-semibold text-white">Cold Chain Health</h2>
            <p className="text-xs text-gray-500 mt-0.5">% sensors in safe range</p>
          </div>
          <ColdChainArc score={coldChainScore} />
          <div className="mt-3 w-full grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Optimal', color: 'text-emerald-400', threshold: '>80%' },
              { label: 'Caution', color: 'text-amber-400', threshold: '>60%' },
              { label: 'Critical', color: 'text-red-400', threshold: '<60%' },
            ].map((z) => (
              <div key={z.label} className="text-xs">
                <div className={`font-mono font-bold ${z.color}`}>{z.threshold}</div>
                <div className="text-gray-600">{z.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bullwhip Risk */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="gradient-border rounded-2xl p-5 relative overflow-hidden flex flex-col items-center"
        >
          <Spotlight size={300} />
          <div className="w-full mb-4">
            <h2 className="text-sm font-semibold text-white">Bullwhip Risk Monitor</h2>
            <p className="text-xs text-gray-500 mt-0.5">Demand amplification index</p>
          </div>
          <BullwhipGauge score={bullwhipScore} risk={bullwhipRisk} />
          <div className="mt-3 w-full text-center text-xs text-gray-500">
            Coefficient of variation ×400
          </div>
        </motion.div>

        {/* Live Alert Feed */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="gradient-border rounded-2xl p-5 relative overflow-hidden flex flex-col"
        >
          <Spotlight size={300} />
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Live Alert Feed</h2>
              <p className="text-xs text-gray-500 mt-0.5">Last 5 unacknowledged</p>
            </div>
            {activeAlerts.length > 0 && (
              <span className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">
                {activeAlerts.length} live
              </span>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            <AnimatePresence mode="popLayout">
              {alertsToShow.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex items-center justify-center text-gray-600 text-xs font-mono"
                >
                  No active alerts
                </motion.div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-2"
                >
                  {alertsToShow.map((alert) => (
                    <AlertItem key={alert.id} alert={alert} onAck={acknowledgeAlert} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {activeAlerts.length > 5 && (
            <button
              aria-label="View all alerts"
              className="mt-3 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              View all {activeAlerts.length} alerts <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </motion.div>
      </section>

      {/* ── Supply Chain Flow ── */}
      <section aria-label="Supply chain flow" className="mb-4">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="gradient-border rounded-2xl p-6 relative overflow-hidden"
        >
          <Spotlight size={600} />
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-white">Supply Chain Flow</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              End-to-end health — node colour reflects cold chain score
            </p>
          </div>

          <div className="relative flex items-center justify-around">
            {/* Connecting SVG lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              aria-hidden="true"
              preserveAspectRatio="none"
            >
              {SC_STAGES.slice(0, -1).map((_, i) => {
                const pct = (i + 1) / SC_STAGES.length;
                const x1 = `${(i / (SC_STAGES.length - 1)) * 100}%`;
                const x2 = `${((i + 1) / (SC_STAGES.length - 1)) * 100}%`;
                return (
                  <g key={i}>
                    {/* Track */}
                    <line
                      x1={x1} y1="50%"
                      x2={x2} y2="50%"
                      stroke="#1F2937"
                      strokeWidth="2"
                    />
                    {/* Animated flow */}
                    <line
                      x1={x1} y1="50%"
                      x2={x2} y2="50%"
                      stroke={nodeColor}
                      strokeWidth="2"
                      strokeDasharray="8 6"
                      className="animate-flow"
                      style={{ animationDelay: `${i * 0.4}s`, opacity: 0.7 }}
                    />
                  </g>
                );
              })}
            </svg>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex items-center justify-around w-full relative z-10"
            >
              {SC_STAGES.map((stage, i) => (
                <FlowNode
                  key={stage}
                  label={stage}
                  index={i}
                  total={SC_STAGES.length}
                  healthColor={nodeColor}
                />
              ))}
            </motion.div>
          </div>

          {/* Legend */}
          <div className="mt-5 flex items-center gap-6 justify-center text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />Optimal (&gt;80%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />Caution (60–80%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />Critical (&lt;60%)
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              Current: <span
                className="font-bold"
                style={{ color: nodeColor }}
              >{coldChainScore}%</span>
            </span>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
