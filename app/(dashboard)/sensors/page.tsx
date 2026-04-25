'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useData } from '@/components/providers/DataProvider';
import type { Sensor, Alert } from '@/components/providers/DataProvider';
import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';
import { fadeUp, staggerContainer } from '@/lib/animations';
import { cn } from '@/lib/utils';

// ─── Location groups ───────────────────────────────────────────────────────────
const LOCATION_GROUPS = [
  { key: 'Leeds',      label: 'Farm Gate — Leeds' },
  { key: 'Manchester', label: 'Processing — Manchester' },
  { key: 'Birmingham', label: 'Distribution — Birmingham' },
  { key: 'Fleet',      label: 'Fleet' },
  { key: 'Store',      label: 'Stores' },
];

// ─── Helper: status colours ────────────────────────────────────────────────────
function statusColor(status: Sensor['status']): string {
  if (status === 'CRITICAL') return 'text-red-400';
  if (status === 'WARNING')  return 'text-amber-400';
  return 'text-emerald-400';
}

function statusLineColor(status: Sensor['status']): string {
  if (status === 'CRITICAL') return '#f87171';
  if (status === 'WARNING')  return '#fbbf24';
  return '#34d399';
}

function statusBadgeClass(status: Sensor['status']): string {
  if (status === 'CRITICAL') return 'bg-red-500/20 text-red-400 border border-red-500/30';
  if (status === 'WARNING')  return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
  return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
}

// ─── Alert filter types ────────────────────────────────────────────────────────
type FilterTab = 'All' | 'Critical' | 'Warning' | 'Unacknowledged';

// ─── Sensor Card ───────────────────────────────────────────────────────────────
function SensorCard({ sensor }: { sensor: Sensor }) {
  const isCritical = sensor.status === 'CRITICAL';
  const isWarning  = sensor.status === 'WARNING';
  const unit       = sensor.type === 'temp' ? '°C' : '%RH';

  const sparkData = sensor.history.map((v, i) => ({ i, v }));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(245,158,11,0.1)' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'gradient-border rounded-xl p-4 relative cursor-default select-none',
        isCritical && 'animate-[critical-pulse_2s_ease-in-out_infinite]',
      )}
      style={isCritical ? { animation: 'critical-pulse 2s ease-in-out infinite' } : undefined}
    >
      {/* Spotlight overlay */}
      <Spotlight size={250} />

      {/* Top row: ID + status badge */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="font-mono text-xs text-gray-500 tracking-widest">{sensor.id}</span>
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', statusBadgeClass(sensor.status))}>
          {sensor.status}
        </span>
      </div>

      {/* Location */}
      <p className="text-[10px] text-gray-600 mb-3 truncate">{sensor.location}</p>

      {/* Value + sparkline row */}
      <div className="flex items-end justify-between gap-2">
        {/* Big value */}
        <div className="flex items-baseline gap-1">
          <motion.span
            className={cn('font-mono text-2xl font-bold leading-none', statusColor(sensor.status))}
            animate={isCritical ? { x: [0, -3, 3, -3, 3, 0] } : {}}
            transition={isCritical ? { duration: 0.5, ease: 'easeInOut' } : {}}
          >
            {sensor.currentValue.toFixed(1)}
          </motion.span>
          <span className="text-xs text-gray-500 font-mono">{unit}</span>
        </div>

        {/* Sparkline */}
        <div style={{ width: 80, height: 30 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={statusLineColor(sensor.status)}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Safe range */}
      <p className="mt-2 text-[10px] text-gray-600 font-mono">
        Safe {sensor.safeMin}{unit} – {sensor.safeMax}{unit}
      </p>

      {/* Critical pulsing border overlay */}
      {isCritical && (
        <div className="absolute inset-0 rounded-xl border border-red-500/60 pointer-events-none"
          style={{ animation: 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite' }} />
      )}
      {isWarning && (
        <div className="absolute inset-0 rounded-xl border border-amber-500/40 pointer-events-none" />
      )}
    </motion.div>
  );
}

// ─── Summary stat pill ─────────────────────────────────────────────────────────
function StatPill({
  label,
  value,
  dot,
}: {
  label: string;
  value: number | string;
  dot?: 'green' | 'amber' | 'red' | 'pulse-red';
}) {
  return (
    <div className="flex items-center gap-2 bg-[#111827] border border-[#1F2937] rounded-full px-4 py-1.5 text-sm">
      {dot && (
        <span className="relative flex h-2 w-2">
          {dot === 'pulse-red' ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </>
          ) : (
            <span
              className={cn(
                'inline-flex rounded-full h-2 w-2',
                dot === 'green' && 'bg-emerald-400',
                dot === 'amber' && 'bg-amber-400',
                dot === 'red'   && 'bg-red-500',
              )}
            />
          )}
        </span>
      )}
      <span className="text-gray-400">{label}</span>
      <span className="font-mono font-semibold text-white">{value}</span>
    </div>
  );
}

// ─── Alert Row ─────────────────────────────────────────────────────────────────
function AlertRow({
  alert,
  onResolve,
}: {
  alert: Alert;
  onResolve: (id: string) => void;
}) {
  const [resolved, setResolved] = useState(false);
  const isCritical = alert.severity === 'critical';

  const handleResolve = () => {
    setResolved(true);
    setTimeout(() => onResolve(alert.id), 400);
  };

  const ts = alert.timestamp instanceof Date
    ? alert.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : String(alert.timestamp);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: resolved ? 0 : 1, x: 0 }}
      exit={{ opacity: 0, x: 40, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 bg-[#111827] rounded-lg border-l-2 border border-[#1F2937]',
        isCritical ? 'border-l-red-500' : 'border-l-amber-500',
      )}
    >
      {/* Severity dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        {isCritical ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </>
        ) : (
          <span className="inline-flex rounded-full h-2 w-2 bg-amber-400" />
        )}
      </span>

      {/* Sensor ID */}
      <span className={cn('font-mono text-xs shrink-0', isCritical ? 'text-red-400' : 'text-amber-400')}>
        {alert.sensorId}
      </span>

      {/* Message */}
      <span className="text-sm text-gray-300 flex-1 min-w-0 truncate">{alert.message}</span>

      {/* Timestamp */}
      <span className="font-mono text-xs text-gray-600 shrink-0">{ts}</span>

      {/* Resolve button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleResolve}
        className="shrink-0 flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-400 border border-[#1F2937] hover:border-emerald-500/40 rounded-md px-2 py-1 transition-colors"
      >
        <motion.svg
          animate={resolved ? { pathLength: 1 } : { pathLength: 0 }}
          className="w-3 h-3"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M2 6 L5 9 L10 3"
            initial={{ pathLength: 0 }}
            animate={resolved ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.svg>
        Resolve
      </motion.button>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SensorsPage() {
  const { sensors, alerts, acknowledgeAlert } = useData();
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  // Summary counts
  const totalCount    = sensors.length;
  const normalCount   = sensors.filter(s => s.status === 'NORMAL').length;
  const warningCount  = sensors.filter(s => s.status === 'WARNING').length;
  const criticalCount = sensors.filter(s => s.status === 'CRITICAL').length;

  // Group sensors by location
  const grouped = useMemo(() => {
    return LOCATION_GROUPS.map(group => ({
      ...group,
      sensors: sensors.filter(s => s.location.includes(group.key)),
    })).filter(g => g.sensors.length > 0);
  }, [sensors]);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    switch (activeTab) {
      case 'Critical':        return alerts.filter(a => a.severity === 'critical');
      case 'Warning':         return alerts.filter(a => a.severity === 'warning');
      case 'Unacknowledged':  return alerts.filter(a => !a.acknowledged);
      default:                return alerts;
    }
  }, [alerts, activeTab]);

  const TABS: FilterTab[] = ['All', 'Critical', 'Warning', 'Unacknowledged'];

  return (
    <div className="space-y-8">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden rounded-2xl bg-[#0F172A] border border-[#1F2937] min-h-[180px] flex flex-col justify-end p-8"
      >
        {/* SplineScene — top-right absolute */}
        <div
          className="absolute top-0 right-0 pointer-events-none"
          style={{ width: 300, height: 300 }}
        >
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            targetOpacity={0.2}
            className="w-full h-full"
          />
        </div>

        {/* Amber gradient overlay fading from left */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 40%, transparent 70%)',
          }}
        />

        {/* Header text */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">IoT Sensor Network</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Sensor Dashboard</h1>
          <p className="text-gray-400 text-sm">Real-time cold chain monitoring across {totalCount} sensors</p>
        </div>
      </motion.div>

      {/* ── Summary Bar ─────────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-3"
      >
        <StatPill label="Total Sensors" value={totalCount} />
        <StatPill label="Normal"    value={normalCount}   dot="green" />
        <StatPill label="Warning"   value={warningCount}  dot="amber" />
        <StatPill label="Critical"  value={criticalCount} dot="pulse-red" />

        {/* Live badge */}
        <div className="ml-auto flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="font-mono text-xs font-bold text-emerald-400 tracking-widest">LIVE</span>
        </div>
      </motion.div>

      {/* ── Sensor Grid (grouped by location) ───────────────────────────────── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {grouped.map((group) => (
          <motion.section key={group.key} variants={fadeUp}>
            {/* Group header */}
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-widest">
                {group.label}
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
              <span className="font-mono text-xs text-gray-600">{group.sensors.length} sensors</span>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {group.sensors.map((sensor) => (
                <SensorCard key={sensor.id} sensor={sensor} />
              ))}
            </div>
          </motion.section>
        ))}
      </motion.div>

      {/* ── Alert Log ───────────────────────────────────────────────────────── */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="bg-[#0F172A] border border-[#1F2937] rounded-2xl p-6 space-y-4"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Alert Log</h2>
          {alerts.length > 0 && (
            <span className="font-mono text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
              {alerts.length}
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="relative flex gap-1 bg-[#111827] border border-[#1F2937] rounded-xl p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'relative z-10 px-4 py-1.5 text-sm rounded-lg font-medium transition-colors duration-200',
                activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300',
              )}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 bg-[#1F2937] rounded-lg"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {tab}
              {tab === 'Critical' && criticalCount > 0 && (
                <span className="ml-1.5 font-mono text-xs text-red-400">{alerts.filter(a => a.severity === 'critical').length}</span>
              )}
              {tab === 'Warning' && warningCount > 0 && (
                <span className="ml-1.5 font-mono text-xs text-amber-400">{alerts.filter(a => a.severity === 'warning').length}</span>
              )}
              {tab === 'Unacknowledged' && (
                <span className="ml-1.5 font-mono text-xs text-gray-400">{alerts.filter(a => !a.acknowledged).length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Alert list */}
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          <AnimatePresence initial={false} mode="popLayout">
            {filteredAlerts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 text-center text-gray-600 text-sm"
              >
                <div className="w-10 h-10 rounded-full bg-[#111827] border border-[#1F2937] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                No alerts in this category
              </motion.div>
            ) : (
              filteredAlerts.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  onResolve={acknowledgeAlert}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </div>
  );
}
