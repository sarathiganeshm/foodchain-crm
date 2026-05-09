'use client';

import { useState, useEffect, useRef, Component, type ReactNode } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';

// ─── Error Boundary ────────────────────────────────────────────────────────────

interface ErrorBoundaryState { hasError: boolean }

class PageErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#030712] flex items-center justify-center">
          <div className="text-center">
            <div className="text-amber-400 text-4xl mb-4">⚠</div>
            <h2 className="text-white text-lg font-semibold mb-2">Cold Chain Dashboard Unavailable</h2>
            <p className="text-gray-400 text-sm mb-4">An error occurred loading this page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-amber-500 text-black text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { SplineScene } from '@/components/ui/splite';
import { useData, Shipment } from '@/components/providers/DataProvider';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NodePopover {
  node: string;
  x: number;
  y: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTempColor(temp: number): string {
  if (temp < 0) return 'text-blue-400';
  if (temp < 6) return 'text-emerald-400';
  if (temp < 8) return 'text-amber-400';
  return 'text-red-400';
}

function getTempBg(temp: number): string {
  if (temp < 0) return 'bg-blue-500/10 border border-blue-500/20';
  if (temp < 6) return 'bg-emerald-500/10 border border-emerald-500/20';
  if (temp < 8) return 'bg-amber-500/10 border border-amber-500/20';
  return 'bg-red-500/10 border border-red-500/20';
}

function getScoreColor(score: number): string {
  if (score > 80) return '#10B981';
  if (score > 60) return '#F59E0B';
  return '#EF4444';
}


function getNodeGlow(score: number): string {
  if (score > 80) return 'shadow-[0_0_20px_rgba(16,185,129,0.35)]';
  if (score > 60) return 'shadow-[0_0_20px_rgba(245,158,11,0.35)]';
  return 'shadow-[0_0_20px_rgba(239,68,68,0.35)]';
}

function getStatusBadge(status: Shipment['status']): string {
  switch (status) {
    case 'In Transit': return 'bg-blue-500/15 text-blue-300 border border-blue-500/25';
    case 'Delayed':    return 'bg-amber-500/15 text-amber-300 border border-amber-500/25';
    case 'Delivered':  return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25';
    case 'At Risk':    return 'bg-red-500/15 text-red-300 border border-red-500/25';
    default:           return 'bg-gray-500/15 text-gray-300 border border-gray-500/25';
  }
}

function generateTempHistory(base: number): { t: string; v: number }[] {
  return Array.from({ length: 12 }, (_, i) => ({
    t: `${i * 5}m`,
    v: parseFloat((base + Math.sin(i * 0.7) * 0.6 + (Math.random() - 0.5) * 0.3).toFixed(1)),
  }));
}

// ─── Animated Count-Up Number ─────────────────────────────────────────────────

function CountUp({ target, decimals = 0 }: { target: number; decimals?: number }) {
  const motionVal = useMotionValue(0);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const controls = animate(motionVal, target, { duration: 1.5, ease: 'easeOut' });
    const unsub = motionVal.on('change', (v) => setDisplay(v.toFixed(decimals)));
    return () => { controls.stop(); unsub(); };
  }, [target, decimals, motionVal]);

  return <span>{display}</span>;
}

// ─── Cold Chain Score Circle ──────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeColor = getScoreColor(score);

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Pulse ring */}
      <div
        className="pulse-ring absolute w-[160px] h-[160px] rounded-full"
        style={{ color: strokeColor }}
      />
      <svg width="160" height="160" className="-rotate-90">
        {/* Background track */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        {/* Animated progress arc */}
        <motion.circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${strokeColor})` }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-4xl font-bold text-white">
          <CountUp target={score} />
        </span>
        <span className="text-xs text-gray-400 mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="glass rounded-xl px-4 py-2.5 flex flex-col items-center gap-0.5 animate-float">
      <span className={`font-mono text-sm font-bold ${accent}`}>{value}</span>
      <span className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ─── Supply Chain Node ────────────────────────────────────────────────────────

const CHAIN_NODES = [
  { id: 'farm',         label: 'Farm',         icon: '🌱', detail: 'Origin quality checks', location: 'Leeds, UK' },
  { id: 'processing',   label: 'Processing',   icon: '⚙️',  detail: 'HACCP certified plant',  location: 'Manchester, UK' },
  { id: 'distribution', label: 'Distribution', icon: '🏭', detail: 'Cold DC — 4000 pallets',  location: 'Birmingham, UK' },
  { id: 'retail',       label: 'Retail',       icon: '🛒', detail: 'Multi-site UK network',   location: 'Nationwide' },
];

interface ChainNodeProps {
  node: typeof CHAIN_NODES[0];
  index: number;
  score: number;
  activeShipments: number;
  avgTemp: number;
  onClick: (id: string, e: React.MouseEvent) => void;
}

function ChainNode({ node, index, score, activeShipments, avgTemp, onClick }: ChainNodeProps) {
  const glow = getNodeGlow(score);

  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -6, scale: 1.03 }}
      onClick={(e) => onClick(node.id, e)}
      className={`
        relative flex flex-col items-center gap-3 p-5 rounded-2xl
        bg-[#111827] border border-[#1F2937] cursor-pointer
        transition-all duration-300 ${glow}
        focus:outline-none focus:ring-2 focus:ring-amber-500/40
      `}
      style={{ perspective: '800px' }}
    >
      {/* Icon */}
      <div className="text-3xl">{node.icon}</div>
      <div className="text-sm font-semibold text-white">{node.label}</div>

      {/* Mini stats */}
      <div className="flex flex-col items-center gap-1 w-full">
        <div className="text-[11px] text-gray-500">Active shipments</div>
        <div className="font-mono text-xs font-bold text-amber-400">{activeShipments}</div>
        <div className="text-[11px] text-gray-500 mt-1">Avg temp</div>
        <div className={`font-mono text-xs font-bold ${getTempColor(avgTemp)}`}>
          {avgTemp.toFixed(1)}°C
        </div>
      </div>

      {/* Score dot */}
      <div
        className="absolute top-3 right-3 w-2 h-2 rounded-full"
        style={{ background: getScoreColor(score), boxShadow: `0 0 6px ${getScoreColor(score)}` }}
      />
    </motion.button>
  );
}

// ─── Animated Connector ───────────────────────────────────────────────────────

function FlowConnector({ index }: { index: number }) {
  return (
    <div className="flex-1 flex items-center relative min-w-[40px]">
      <svg
        className="w-full h-6"
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
      >
        {/* Static track */}
        <line
          x1="0" y1="12" x2="100" y2="12"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="2"
        />
        {/* Animated flow line */}
        <motion.line
          x1="0" y1="12" x2="100" y2="12"
          stroke="#F59E0B"
          strokeWidth="2"
          strokeDasharray="12 8"
          initial={{ strokeDashoffset: 40 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
            delay: index * 0.3,
          }}
          style={{ opacity: 0.6 }}
        />
        {/* Traveling dot */}
        <motion.circle
          r="4"
          cy="12"
          fill="#F59E0B"
          initial={{ cx: 0 }}
          animate={{ cx: 100 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
            delay: index * 0.5,
          }}
          style={{ filter: 'drop-shadow(0 0 4px #F59E0B)' }}
        />
      </svg>
    </div>
  );
}

// ─── Node Popover ─────────────────────────────────────────────────────────────

function NodePopoverPanel({
  popover,
  onClose,
  score,
}: {
  popover: NodePopover;
  onClose: () => void;
  score: number;
}) {
  const node = CHAIN_NODES.find((n) => n.id === popover.node);
  if (!node) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 8 }}
      transition={{ duration: 0.18 }}
      className="fixed z-50 glass rounded-xl p-4 shadow-xl border border-[#1F2937] w-56"
      style={{ top: popover.y + 16, left: popover.x - 80 }}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-semibold text-white text-sm">{node.label}</div>
          <div className="text-[11px] text-gray-500">{node.location}</div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-base leading-none">×</button>
      </div>
      <div className="text-[11px] text-gray-400 mb-3">{node.detail}</div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-500">Chain score</span>
        <span
          className="font-mono text-xs font-bold"
          style={{ color: getScoreColor(score) }}
        >
          {score}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Temperature History Chart ─────────────────────────────────────────────────

function TempChart({ data }: { data: { t: string; v: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <XAxis
          dataKey="t"
          tick={{ fontSize: 10, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={false}
          tickLine={false}
          domain={['auto', 'auto']}
        />
        <Tooltip
          contentStyle={{
            background: '#111827',
            border: '1px solid #1F2937',
            borderRadius: 8,
            fontSize: 11,
            color: '#F9FAFB',
          }}
          formatter={(val) => [`${Number(val ?? 0).toFixed(1)}°C`, 'Temp'] as [string, string]}
        />
        <Line
          type="monotone"
          dataKey="v"
          stroke="#F59E0B"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#F59E0B' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Journey Timeline ─────────────────────────────────────────────────────────

const JOURNEY_STAGES = ['Farm', 'Processing', 'Distribution', 'Retail'];

function JourneyTimeline({ progress }: { progress: number }) {
  const stageIndex = Math.floor((progress / 100) * JOURNEY_STAGES.length);

  return (
    <div className="flex items-center gap-0">
      {JOURNEY_STAGES.map((stage, i) => {
        const done = i < stageIndex;
        const current = i === stageIndex;
        return (
          <div key={stage} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${done    ? 'bg-emerald-500 border-emerald-500 text-white'
                  : current ? 'bg-amber-500 border-amber-500 text-white'
                  :           'bg-transparent border-[#374151] text-gray-600'}
                `}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] whitespace-nowrap ${current ? 'text-amber-400 font-semibold' : done ? 'text-emerald-400' : 'text-gray-600'}`}>
                {stage}
              </span>
            </div>
            {i < JOURNEY_STAGES.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-4 rounded ${done ? 'bg-emerald-500' : 'bg-[#1F2937]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Shipment Detail Modal ─────────────────────────────────────────────────────

function ShipmentModal({
  shipment,
  onClose,
}: {
  shipment: Shipment;
  onClose: () => void;
}) {
  const [tempHistory] = useState(() => generateTempHistory(shipment.temp));

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Panel */}
      <motion.div
        className="relative z-10 w-full max-w-xl bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F2937]">
          <div>
            <div className="font-mono text-sm text-amber-400 font-bold">{shipment.id}</div>
            <div className="text-lg font-semibold text-white">{shipment.product}</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#0F172A] hover:bg-[#1F2937] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Route + Driver */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0F172A] rounded-xl p-3 border border-[#1F2937]">
              <div className="text-[11px] text-gray-500 mb-1">Route</div>
              <div className="text-sm text-white font-medium">{shipment.from}</div>
              <div className="text-[11px] text-gray-500 my-0.5">→</div>
              <div className="text-sm text-white font-medium">{shipment.to}</div>
            </div>
            <div className="bg-[#0F172A] rounded-xl p-3 border border-[#1F2937]">
              <div className="text-[11px] text-gray-500 mb-1">Driver</div>
              <div className="text-sm text-white font-semibold">{shipment.driver}</div>
              <div className="text-[11px] text-gray-500 mt-2 mb-1">ETA</div>
              <div className="font-mono text-sm text-amber-300 font-bold">{shipment.eta}</div>
            </div>
          </div>

          {/* Temp + Status */}
          <div className="flex items-center gap-3">
            <div className={`rounded-xl px-4 py-2.5 flex-1 text-center ${getTempBg(shipment.temp)}`}>
              <div className="text-[10px] text-gray-500 uppercase mb-0.5">Live Temp</div>
              <div className={`font-mono text-2xl font-bold ${getTempColor(shipment.temp)}`}>
                {shipment.temp.toFixed(1)}°C
              </div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-[10px] text-gray-500 uppercase mb-1">Status</div>
              <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${getStatusBadge(shipment.status)}`}>
                {shipment.status}
              </span>
            </div>
          </div>

          {/* Temperature history */}
          <div className="bg-[#0F172A] rounded-xl p-3 border border-[#1F2937]">
            <div className="text-xs text-gray-400 font-semibold mb-2">Temperature History (last 12 readings)</div>
            <TempChart data={tempHistory} />
          </div>

          {/* Journey timeline */}
          <div className="bg-[#0F172A] rounded-xl p-4 border border-[#1F2937]">
            <div className="text-xs text-gray-400 font-semibold mb-4">Journey Timeline</div>
            <JourneyTimeline progress={shipment.progress} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Alert Panel ──────────────────────────────────────────────────────────────

function AlertPanel({
  shipments,
  acknowledged,
  onAcknowledge,
}: {
  shipments: Shipment[];
  acknowledged: Set<string>;
  onAcknowledge: (id: string) => void;
}) {
  const alerts = shipments.filter(
    (s) => (s.status === 'At Risk' || s.status === 'Delayed') && !acknowledged.has(s.id)
  );

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-white">Transit Alerts</h3>
        {alerts.length > 0 && (
          <span className="text-[11px] font-mono bg-red-500/15 text-red-300 border border-red-500/25 px-2 py-0.5 rounded-full">
            {alerts.length} active
          </span>
        )}
      </div>

      <AnimatePresence>
        {alerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 text-center"
          >
            <div className="text-emerald-400 text-xl mb-1">✓</div>
            <div className="text-xs text-gray-500">No active alerts</div>
          </motion.div>
        ) : (
          alerts.map((s) => {
            const isAtRisk = s.status === 'At Risk';
            return (
              <motion.div
                key={s.id}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 30, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`
                  bg-[#111827] rounded-xl p-4 border-l-4
                  ${isAtRisk ? 'border-l-red-500' : 'border-l-amber-500'}
                  border border-[#1F2937]
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] text-gray-400">{s.id}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${getStatusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </div>
                    <div className="text-xs text-white font-medium truncate">{s.product}</div>
                    <div className="text-[11px] text-gray-500 truncate">{s.from} → {s.to}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`font-mono text-xs font-bold ${getTempColor(s.temp)}`}>
                        {s.temp.toFixed(1)}°C
                      </span>
                      <span className="text-[11px] text-gray-500">Driver: {s.driver}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onAcknowledge(s.id)}
                  className="mt-3 w-full text-[11px] font-semibold rounded-lg py-1.5 px-3
                    bg-[#0F172A] hover:bg-[#1F2937] text-gray-300 hover:text-white
                    border border-[#1F2937] transition-colors"
                >
                  Acknowledge
                </button>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Shipment Row ─────────────────────────────────────────────────────────────

function ShipmentRow({
  shipment,
  index,
  onView,
}: {
  shipment: Shipment;
  index: number;
  onView: (s: Shipment) => void;
}) {
  const prevTempRef = useRef(shipment.temp);
  const [tempPulse, setTempPulse] = useState(false);

  useEffect(() => {
    if (Math.abs(shipment.temp - prevTempRef.current) > 0.01) {
      prevTempRef.current = shipment.temp;
      setTempPulse(true);
      const t = setTimeout(() => setTempPulse(false), 500);
      return () => clearTimeout(t);
    }
  }, [shipment.temp]);

  return (
    <motion.tr
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="border-b border-[#1F2937]/60 hover:bg-[#0F172A]/40 transition-colors group"
    >
      {/* ID */}
      <td className="px-4 py-3">
        <span className="font-mono text-[11px] text-amber-400 font-bold">{shipment.id}</span>
      </td>

      {/* Route */}
      <td className="px-4 py-3 max-w-[160px]">
        <div className="text-xs text-white font-medium truncate">{shipment.from}</div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500">→</span>
          <div className="text-[11px] text-gray-400 truncate">{shipment.to}</div>
        </div>
      </td>

      {/* Product */}
      <td className="px-4 py-3">
        <span className="text-xs text-gray-300">{shipment.product}</span>
      </td>

      {/* Driver */}
      <td className="px-4 py-3">
        <span className="text-xs text-gray-400">{shipment.driver}</span>
      </td>

      {/* Temp */}
      <td className="px-4 py-3">
        <motion.span
          animate={tempPulse ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.4 }}
          className={`font-mono text-xs font-bold inline-block ${getTempColor(shipment.temp)}`}
        >
          {shipment.temp.toFixed(1)}°C
        </motion.span>
      </td>

      {/* Progress */}
      <td className="px-4 py-3 min-w-[100px]">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-[#1F2937] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-amber-500"
              initial={{ width: '0%' }}
              animate={{ width: `${shipment.progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className="font-mono text-[10px] text-gray-500 w-8 text-right">
            {Math.round(shipment.progress)}%
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`text-[10px] px-2 py-1 rounded-full font-semibold whitespace-nowrap inline-flex items-center gap-1 ${getStatusBadge(shipment.status)}`}
        >
          {shipment.status === 'At Risk' && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
          )}
          {shipment.status}
        </span>
      </td>

      {/* ETA */}
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-gray-400">{shipment.eta}</span>
      </td>

      {/* Action */}
      <td className="px-4 py-3">
        <button
          onClick={() => onView(shipment)}
          className="text-[11px] px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-amber-500/10 hover:text-amber-300 text-gray-400 border border-[#1F2937] hover:border-amber-500/30 transition-all font-medium"
        >
          View
        </button>
      </td>
    </motion.tr>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

function ColdChainContent() {
  const { shipments, coldChainScore } = useData();
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [nodePopover, setNodePopover] = useState<NodePopover | null>(null);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());

  // Build per-node stats from shipments
  const nodeStatsMap: Record<string, { count: number; temps: number[] }> = {
    farm:         { count: 0, temps: [] },
    processing:   { count: 0, temps: [] },
    distribution: { count: 0, temps: [] },
    retail:       { count: 0, temps: [] },
  };

  shipments.forEach((s) => {
    const from = s.from.toLowerCase();
    const key = from.includes('farm')       ? 'farm'
              : from.includes('proc')       ? 'processing'
              : from.includes('dc') || from.includes('birmingham') ? 'distribution'
              : 'retail';
    if (nodeStatsMap[key]) {
      nodeStatsMap[key].count += 1;
      if (s.status !== 'Delivered') nodeStatsMap[key].temps.push(s.temp);
    }
  });

  const nodeStats = Object.entries(nodeStatsMap).map(([id, data]) => ({
    id,
    activeShipments: data.count,
    avgTemp: data.temps.length > 0
      ? data.temps.reduce((a, b) => a + b, 0) / data.temps.length
      : 0,
  }));

  const inTransitCount = shipments.filter((s) => s.status !== 'Delivered').length;
  const alertCount = shipments.filter((s) => s.status === 'At Risk' || s.status === 'Delayed').length;
  const avgTemp = shipments
    .filter((s) => s.status !== 'Delivered')
    .reduce((sum, s, _, arr) => sum + s.temp / arr.length, 0);

  function handleNodeClick(id: string, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setNodePopover(
      nodePopover?.node === id
        ? null
        : { node: id, x: rect.left + rect.width / 2, y: rect.bottom }
    );
  }

  function acknowledgeAlert(id: string) {
    setAcknowledgedAlerts((prev) => new Set([...prev, id]));
  }

  return (
    <div className="min-h-screen bg-[#030712] -m-6 pb-8">
      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <div className="relative w-full" style={{ height: 280 }}>
        {/* Spline background */}
        <SplineScene
          scene="https://prod.spline.design/uHjFi7hHNMTRBFp2/scene.splinecode"
          className="absolute inset-0 w-full h-full pointer-events-none"
          targetOpacity={0.2}
        />

        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/30 via-transparent to-[#030712]" />

        {/* Hero content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-10">
            {/* Left stats */}
            <div className="flex flex-col gap-3">
              <StatPill label="In Transit" value={String(inTransitCount)} accent="text-amber-400" />
              <StatPill label="Avg Temp" value={`${avgTemp.toFixed(1)}°C`} accent="text-blue-400" />
            </div>

            {/* Score circle */}
            <div className="flex flex-col items-center gap-2">
              <ScoreCircle score={coldChainScore} />
              <div className="text-xs text-gray-500 tracking-widest uppercase mt-1">
                Cold Chain Integrity
              </div>
            </div>

            {/* Right stats */}
            <div className="flex flex-col gap-3">
              <StatPill label="Alerts" value={String(alertCount)} accent="text-red-400" />
              <StatPill label="Delivered" value={String(shipments.filter((s) => s.status === 'Delivered').length)} accent="text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Page title top-left */}
        <div className="absolute top-5 left-6">
          <h1 className="text-lg font-bold text-white">Cold Chain Live Tracking</h1>
          <p className="text-xs text-gray-500 mt-0.5">Real-time temperature & logistics monitoring</p>
        </div>
      </div>

      {/* ── Supply Chain Flow ─────────────────────────────────────────── */}
      <div className="px-6 mt-2">
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
            Supply Chain Flow
          </h2>
          <div className="flex items-start gap-0">
            {CHAIN_NODES.map((node, i) => {
              const stats = nodeStats.find((n) => n.id === node.id) ?? { activeShipments: 0, avgTemp: 0 };
              return (
                <div key={node.id} className="flex items-center flex-1">
                  <div className="flex-1">
                    <ChainNode
                      node={node}
                      index={i}
                      score={coldChainScore}
                      activeShipments={stats.activeShipments}
                      avgTemp={stats.avgTemp}
                      onClick={handleNodeClick}
                    />
                  </div>
                  {i < CHAIN_NODES.length - 1 && <FlowConnector index={i} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Content: Table + Alerts ──────────────────────────────── */}
      <div className="px-6 mt-6 grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">

        {/* Shipment Table */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F2937]">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-white">Active Shipments</h2>
              <span className="font-mono text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                {shipments.length}
              </span>
            </div>
            <div className="text-[11px] text-gray-500 font-mono">
              Updates every 3s
            </div>
          </div>

          {/* Scrollable table */}
          <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
            <table className="w-full min-w-[700px]">
              <thead className="sticky top-0 z-10 bg-[#0F172A] border-b border-[#1F2937]">
                <tr>
                  {['ID', 'From → To', 'Product', 'Driver', 'Temp', 'Progress', 'Status', 'ETA', ''].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {shipments.map((s, i) => (
                    <ShipmentRow
                      key={s.id}
                      shipment={s}
                      index={i}
                      onView={setSelectedShipment}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Alert Panel */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5">
          <AlertPanel
            shipments={shipments}
            acknowledged={acknowledgedAlerts}
            onAcknowledge={acknowledgeAlert}
          />
        </div>
      </div>

      {/* ── Node Popover ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {nodePopover && (
          <NodePopoverPanel
            popover={nodePopover}
            onClose={() => setNodePopover(null)}
            score={coldChainScore}
          />
        )}
      </AnimatePresence>

      {/* ── Shipment Detail Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedShipment && (
          <ShipmentModal
            shipment={selectedShipment}
            onClose={() => setSelectedShipment(null)}
          />
        )}
      </AnimatePresence>

      {/* Backdrop click to close popover */}
      {nodePopover && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setNodePopover(null)}
        />
      )}
    </div>
  );
}

export default function ColdChainPage() {
  return (
    <PageErrorBoundary>
      <ColdChainContent />
    </PageErrorBoundary>
  );
}
