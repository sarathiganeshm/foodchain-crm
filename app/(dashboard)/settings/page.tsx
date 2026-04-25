'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, X, Save, ChevronRight,
  Database, Wifi, Activity, MapPin, Download, RotateCcw,
  CheckCircle, AlertTriangle, Thermometer, Droplets, TrendingDown, Zap,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { fadeUp, staggerContainer, drawerVariants, modalVariants } from '@/lib/animations';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Supplier {
  id: string;
  name: string;
  type: string;
  location: string;
  tier: number;
  rating: number;
  active: boolean;
}

interface AlertThreshold {
  id: string;
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  previewFn: (val: number) => string;
}

interface NotificationToggle {
  id: string;
  label: string;
  description: string;
}

// ─── Initial Data ─────────────────────────────────────────────────────────────

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'Yorkshire Fresh Foods', type: 'Produce', location: 'Leeds', tier: 1, rating: 4.8, active: true },
  { id: 's2', name: 'Northern Dairy Co.', type: 'Dairy', location: 'Manchester', tier: 1, rating: 4.5, active: true },
  { id: 's3', name: 'Midland Bakeries Ltd', type: 'Bakery', location: 'Birmingham', tier: 2, rating: 4.2, active: true },
  { id: 's4', name: 'Scottish Highland Meats', type: 'Meat', location: 'Edinburgh', tier: 1, rating: 4.9, active: true },
  { id: 's5', name: 'East Anglia Growers', type: 'Produce', location: 'Norwich', tier: 2, rating: 3.8, active: false },
  { id: 's6', name: 'Welsh Valley Dairy', type: 'Dairy', location: 'Cardiff', tier: 2, rating: 4.1, active: true },
  { id: 's7', name: 'London Metro Bakery', type: 'Bakery', location: 'London', tier: 3, rating: 3.5, active: true },
  { id: 's8', name: 'Humber Seafood Co.', type: 'Seafood', location: 'Hull', tier: 2, rating: 4.3, active: true },
];

const NOTIFICATION_TOGGLES: NotificationToggle[] = [
  { id: 'email', label: 'Email Alerts', description: 'Receive critical alerts via email' },
  { id: 'sms', label: 'SMS Alerts', description: 'Text messages for urgent threshold breaches' },
  { id: 'push', label: 'Dashboard Push', description: 'Live in-app notifications on this dashboard' },
  { id: 'weekly', label: 'Weekly Report', description: 'Automated summary every Monday 08:00' },
  { id: 'supplier', label: 'Supplier Alerts', description: 'Notify when supplier ratings change' },
  { id: 'compliance', label: 'Compliance Reminders', description: 'EPR and Courtauld Commitment deadlines' },
];

const SUPPLIER_TYPES = ['Produce', 'Dairy', 'Bakery', 'Meat', 'Seafood', 'Frozen', 'Ready Meals', 'Other'];

// ─── Framer Motion Toggle ─────────────────────────────────────────────────────

function MotionToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={enabled}
      className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
        enabled ? 'bg-amber-500' : 'bg-[#374151]'
      }`}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm ${
          enabled ? 'left-7' : 'left-1'
        }`}
      />
    </button>
  );
}

// ─── Supplier Drawer ──────────────────────────────────────────────────────────

function SupplierDrawer({
  open,
  supplier,
  onClose,
  onSave,
}: {
  open: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onSave: (s: Supplier) => void;
}) {
  const [form, setForm] = useState<Omit<Supplier, 'id'>>({
    name: '',
    type: 'Produce',
    location: '',
    tier: 1,
    rating: 4.0,
    active: true,
  });

  useEffect(() => {
    if (supplier) {
      const { id: _id, ...rest } = supplier;
      void _id;
      setForm(rest);
    } else {
      setForm({ name: '', type: 'Produce', location: '', tier: 1, rating: 4.0, active: true });
    }
  }, [supplier, open]);

  function handleSave() {
    if (!form.name.trim() || !form.location.trim()) return;
    onSave({ id: supplier?.id ?? `s${Date.now()}`, ...form });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            key="drawer-panel"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 h-full w-[420px] bg-[#111827] border-l border-[#1F2937] z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#1F2937]">
              <div>
                <h2 className="text-base font-semibold text-white">
                  {supplier ? 'Edit Supplier' : 'Add Supplier'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {supplier ? `Editing ${supplier.name}` : 'Register a new UK supplier'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-[#1F2937] flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Supplier Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Yorkshire Fresh Foods"
                  className="w-full bg-[#0F172A] border border-[#1F2937] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Supplier Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-[#0F172A] border border-[#1F2937] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                >
                  {SUPPLIER_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Leeds"
                  className="w-full bg-[#0F172A] border border-[#1F2937] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Tier */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Supplier Tier</label>
                <div className="flex gap-2">
                  {[1, 2, 3].map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, tier: t })}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                        form.tier === t
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                          : 'bg-[#0F172A] border-[#1F2937] text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      Tier {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="text-xs font-medium text-gray-400 mb-3 block">
                  Rating — <span className="text-amber-400 font-mono">{form.rating.toFixed(1)}</span>
                </label>
                <Slider
                  min={1}
                  max={5}
                  step={0.1}
                  value={[form.rating]}
                  onValueChange={(vals) => setForm({ ...form, rating: Array.isArray(vals) ? (vals[0] ?? form.rating) : vals })}
                  className="[&_[data-slot=slider-thumb]]:glow-amber [&_[data-slot=slider-thumb]]:border-amber-500 [&_[data-slot=slider-range]]:bg-amber-500 [&_[data-slot=slider-track]]:bg-[#1F2937]"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>1.0</span>
                  <span>5.0</span>
                </div>
              </div>

              {/* Active */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-white font-medium">Active Supplier</p>
                  <p className="text-xs text-gray-500">Include in procurement workflows</p>
                </div>
                <MotionToggle enabled={form.active} onToggle={() => setForm({ ...form, active: !form.active })} />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#1F2937] flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[#1F2937] text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleSave}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer glow-amber"
              >
                <Save className="w-4 h-4" />
                Save Supplier
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteModal({
  open,
  supplierName,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  supplierName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="delete-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm flex items-center justify-center"
            onClick={onCancel}
          />
          <motion.div
            key="delete-modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 w-[360px] pointer-events-auto shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Remove Supplier</h3>
                  <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                Are you sure you want to remove <span className="text-white font-medium">{supplierName}</span> from the supplier registry?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-2.5 rounded-xl border border-[#1F2937] text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={onConfirm}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold cursor-pointer hover:bg-red-600 transition-colors"
                >
                  Remove
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Reset Confirmation Modal ─────────────────────────────────────────────────

function ResetModal({
  open,
  resetting,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  resetting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="reset-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
            onClick={!resetting ? onCancel : undefined}
          />
          <motion.div
            key="reset-modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 w-[380px] pointer-events-auto shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Reset Demo Data</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Restore all defaults</p>
                </div>
              </div>
              {resetting ? (
                <div className="py-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-amber-400 text-sm font-medium">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </motion.div>
                    Resetting demo data...
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-400 mb-6">
                    This will restore all sensor readings, shipment data, alerts, and forecasts to their default demo state.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={onCancel}
                      className="flex-1 py-2.5 rounded-xl border border-[#1F2937] text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      onClick={onConfirm}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold cursor-pointer"
                    >
                      Reset
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Alert Threshold Card ─────────────────────────────────────────────────────

function ThresholdCard({ threshold, value, onChange }: {
  threshold: AlertThreshold;
  value: number;
  onChange: (v: number) => void;
}) {
  const Icon = threshold.icon;
  const isWarning = value < (threshold.max * 0.5);

  return (
    <motion.div variants={fadeUp} className="gradient-border rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Icon className={`w-4 h-4 ${threshold.color}`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{threshold.label}</p>
          <p className="text-xs text-gray-500">{threshold.description}</p>
        </div>
        <span className="ml-auto font-mono text-amber-400 text-sm font-bold">
          {value}{threshold.unit}
        </span>
      </div>

      <Slider
        min={threshold.min}
        max={threshold.max}
        step={1}
        value={[value]}
        onValueChange={(vals) => onChange(Array.isArray(vals) ? (vals[0] ?? 0) : vals)}
        className="mb-4 [&_[data-slot=slider-thumb]]:border-amber-500 [&_[data-slot=slider-thumb]]:ring-amber-500/30 [&_[data-slot=slider-range]]:bg-amber-500 [&_[data-slot=slider-track]]:bg-[#1F2937]"
      />

      <div className="flex justify-between text-xs text-gray-600 mb-4">
        <span>{threshold.min}{threshold.unit}</span>
        <span>{threshold.max}{threshold.unit}</span>
      </div>

      {/* Live Preview Card */}
      <div className={`rounded-xl border p-3 transition-all duration-300 ${
        isWarning
          ? 'bg-red-500/5 border-red-500/30'
          : 'bg-amber-500/5 border-amber-500/30'
      }`}>
        <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wider">Live Preview</p>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isWarning ? 'bg-red-500' : 'bg-amber-500'}`} />
          <p className={`text-xs font-medium ${isWarning ? 'text-red-400' : 'text-amber-400'}`}>
            {threshold.previewFn(value)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Status Dot ───────────────────────────────────────────────────────────────

function StatusDot({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#1F2937] last:border-0">
      <div className="relative w-3 h-3 flex-shrink-0">
        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
        <div className="relative w-3 h-3 rounded-full bg-emerald-500" />
      </div>
      <span className="text-sm text-gray-300">{label}</span>
      <span className="ml-auto text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">Online</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  // ── Supplier State ──
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

  // ── Alert Thresholds State ──
  const [thresholds, setThresholds] = useState({
    tempWarning: 8,
    tempCritical: 12,
    humidityWarning: 80,
    coldChainAlert: 70,
    bullwhipAlert: 60,
  });

  const THRESHOLDS: AlertThreshold[] = [
    {
      id: 'tempWarning',
      label: 'Temperature Warning',
      description: 'Alert when sensor temp exceeds this threshold',
      value: thresholds.tempWarning,
      min: 0,
      max: 20,
      unit: '°C',
      icon: Thermometer,
      color: 'text-amber-400',
      previewFn: (v) => `Warning fires when temperature reaches ${v}°C — "SENS-MAN-001: ${v}°C approaching threshold"`,
    },
    {
      id: 'tempCritical',
      label: 'Temperature Critical',
      description: 'Critical breach fires above this temperature',
      value: thresholds.tempCritical,
      min: 5,
      max: 30,
      unit: '°C',
      icon: Zap,
      color: 'text-red-400',
      previewFn: (v) => `Critical breach fires at ${v}°C — "Critical: ${v}°C detected on Fleet sensor"`,
    },
    {
      id: 'humidityWarning',
      label: 'Humidity Warning',
      description: 'Alert when relative humidity exceeds safe range',
      value: thresholds.humidityWarning,
      min: 50,
      max: 100,
      unit: '%RH',
      icon: Droplets,
      color: 'text-blue-400',
      previewFn: (v) => `Humidity alert triggers at ${v}%RH — "SENS-LDS-002: ${v}%RH above safe max"`,
    },
    {
      id: 'coldChainAlert',
      label: 'Cold Chain Score Alert',
      description: 'Alert when integrity score drops below this level',
      value: thresholds.coldChainAlert,
      min: 40,
      max: 95,
      unit: '%',
      icon: Activity,
      color: 'text-cyan-400',
      previewFn: (v) => `Dashboard alert fires when Cold Chain Score falls below ${v}% integrity`,
    },
    {
      id: 'bullwhipAlert',
      label: 'Bullwhip Risk Alert',
      description: 'Notify when demand amplification index passes this',
      value: thresholds.bullwhipAlert,
      min: 20,
      max: 100,
      unit: '',
      icon: TrendingDown,
      color: 'text-purple-400',
      previewFn: (v) => `Bullwhip alert triggers when risk score exceeds ${v} — escalates to "High Risk"`,
    },
  ];

  // ── Notification Toggles State ──
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {
      email: true, sms: false, push: true, weekly: true, supplier: true, compliance: false,
    };
    return defaults;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('foodchain-notification-toggles');
      if (saved) setToggleStates(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('foodchain-notification-toggles', JSON.stringify(toggleStates));
    } catch {}
  }, [toggleStates]);

  // ── Export State ──
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [exportDone, setExportDone] = useState(false);
  const exportTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Reset State ──
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // ── Supplier handlers ──
  function handleSaveSupplier(s: Supplier) {
    setSuppliers((prev) => {
      const idx = prev.findIndex((x) => x.id === s.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = s;
        return next;
      }
      return [...prev, s];
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setSuppliers((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  // ── Export handler ──
  function handleExport() {
    if (exportProgress !== null) return;
    setExportDone(false);
    setExportProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += 2;
      setExportProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setExportProgress(100);
        setTimeout(() => {
          setExportDone(true);
          setExportProgress(null);
          setTimeout(() => setExportDone(false), 3000);
        }, 300);
      }
    }, 40);
    exportTimerRef.current = interval;
  }

  // ── Reset handler ──
  function handleResetConfirm() {
    setResetting(true);
    setTimeout(() => {
      setResetting(false);
      setResetModalOpen(false);
      setSuppliers(INITIAL_SUPPLIERS);
      setThresholds({ tempWarning: 8, tempCritical: 12, humidityWarning: 80, coldChainAlert: 70, bullwhipAlert: 60 });
    }, 2000);
  }

  return (
    <div className="min-h-full pb-16">
      {/* ── Header ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-sm text-gray-500">Manage suppliers, alert thresholds, notifications, and system configuration</p>
      </motion.div>

      {/* ════════════════════════════════════════════
          SECTION 1 — SUPPLIER MANAGEMENT
      ════════════════════════════════════════════ */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mb-10"
        aria-label="Supplier Management"
      >
        <motion.div variants={fadeUp} className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Supplier Management</h2>
            <p className="text-xs text-gray-500 mt-0.5">{suppliers.length} registered UK suppliers</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { setEditingSupplier(null); setDrawerOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-sm font-semibold cursor-pointer glow-amber"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </motion.button>
        </motion.div>

        <motion.div variants={fadeUp} className="gradient-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1F2937]">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Location</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Tier</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Rating</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">Actions</th>
                </tr>
              </thead>
              <AnimatePresence mode="popLayout">
                <tbody>
                  {suppliers.map((supplier) => (
                    <motion.tr
                      key={supplier.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-b border-[#1F2937]/50 hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-white font-medium text-xs">{supplier.name}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-400">{supplier.type}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-600" />
                          {supplier.location}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                          supplier.tier === 1
                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                            : supplier.tier === 2
                            ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                            : 'text-gray-400 bg-gray-500/10 border-gray-500/20'
                        }`}>
                          T{supplier.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs text-white">
                          {'★'.repeat(Math.round(supplier.rating))} <span className="text-gray-500">{supplier.rating.toFixed(1)}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          supplier.active
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-gray-500 bg-gray-500/10 border-gray-500/20'
                        }`}>
                          {supplier.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingSupplier(supplier); setDrawerOpen(true); }}
                            className="w-7 h-7 rounded-lg bg-[#1F2937] flex items-center justify-center text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"
                            aria-label={`Edit ${supplier.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(supplier)}
                            className="w-7 h-7 rounded-lg bg-[#1F2937] flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                            aria-label={`Delete ${supplier.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </AnimatePresence>
            </table>
          </div>
        </motion.div>
      </motion.section>

      {/* ════════════════════════════════════════════
          SECTION 2 — ALERT THRESHOLDS
      ════════════════════════════════════════════ */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="mb-10"
        aria-label="Alert Thresholds"
      >
        <motion.div variants={fadeUp} className="mb-4">
          <h2 className="text-base font-semibold text-white">Alert Thresholds</h2>
          <p className="text-xs text-gray-500 mt-0.5">Configure when alerts fire — preview updates in real time</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {THRESHOLDS.map((t) => (
            <ThresholdCard
              key={t.id}
              threshold={t}
              value={thresholds[t.id as keyof typeof thresholds]}
              onChange={(v) => setThresholds((prev) => ({ ...prev, [t.id]: v }))}
            />
          ))}
        </div>
      </motion.section>

      {/* ════════════════════════════════════════════
          SECTION 3 — NOTIFICATION TOGGLES
      ════════════════════════════════════════════ */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="mb-10"
        aria-label="Notification Settings"
      >
        <motion.div variants={fadeUp} className="mb-4">
          <h2 className="text-base font-semibold text-white">Notification Preferences</h2>
          <p className="text-xs text-gray-500 mt-0.5">Settings are saved automatically to your browser</p>
        </motion.div>

        <motion.div variants={fadeUp} className="gradient-border rounded-2xl overflow-hidden">
          {NOTIFICATION_TOGGLES.map((toggle, i) => (
            <div
              key={toggle.id}
              className={`flex items-center justify-between px-5 py-4 ${
                i < NOTIFICATION_TOGGLES.length - 1 ? 'border-b border-[#1F2937]/60' : ''
              } hover:bg-white/[0.015] transition-colors`}
            >
              <div>
                <p className="text-sm font-medium text-white">{toggle.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{toggle.description}</p>
              </div>
              <MotionToggle
                enabled={toggleStates[toggle.id] ?? false}
                onToggle={() =>
                  setToggleStates((prev) => ({ ...prev, [toggle.id]: !prev[toggle.id] }))
                }
              />
            </div>
          ))}
        </motion.div>
      </motion.section>

      {/* ════════════════════════════════════════════
          SECTION 4 — SYSTEM OVERVIEW
      ════════════════════════════════════════════ */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        aria-label="System Overview"
      >
        <motion.div variants={fadeUp} className="mb-4">
          <h2 className="text-base font-semibold text-white">System Overview</h2>
          <p className="text-xs text-gray-500 mt-0.5">Live system status and data management</p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Status Panel */}
          <motion.div variants={fadeUp} className="gradient-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              System Status
            </h3>
            <div>
              <StatusDot label="Database Online" />
              <StatusDot label="API Connected" />
              <StatusDot label="IoT Feed Active" />
              <StatusDot label="GPS Tracking Active" />
            </div>
          </motion.div>

          {/* Actions Panel */}
          <motion.div variants={fadeUp} className="gradient-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-amber-400" />
              Data Management
            </h3>

            {/* Export Report */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-white">Export Report</p>
                  <p className="text-xs text-gray-500 mt-0.5">Download full system PDF report</p>
                </div>
                <motion.button
                  onClick={handleExport}
                  whileHover={{ scale: exportProgress !== null ? 1 : 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  disabled={exportProgress !== null}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    exportDone
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : exportProgress !== null
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 cursor-not-allowed'
                      : 'bg-amber-500 text-black glow-amber'
                  }`}
                >
                  {exportDone ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Downloaded!
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      {exportProgress !== null ? `${exportProgress}%` : 'Export'}
                    </>
                  )}
                </motion.button>
              </div>

              <AnimatePresence>
                {exportProgress !== null && !exportDone && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="w-full h-1.5 bg-[#1F2937] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-amber-500 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: `${exportProgress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">Generating report... {exportProgress}%</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reset Demo Data */}
            <div className="border-t border-[#1F2937] pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Reset Demo Data</p>
                  <p className="text-xs text-gray-500 mt-0.5">Restore all defaults to demo state</p>
                </div>
                <motion.button
                  onClick={() => setResetModalOpen(true)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1F2937] text-sm font-medium text-gray-400 hover:text-amber-400 hover:border-amber-500/30 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── Modals & Drawer ── */}
      <SupplierDrawer
        open={drawerOpen}
        supplier={editingSupplier}
        onClose={() => { setDrawerOpen(false); setEditingSupplier(null); }}
        onSave={handleSaveSupplier}
      />

      <DeleteModal
        open={deleteTarget !== null}
        supplierName={deleteTarget?.name ?? ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <ResetModal
        open={resetModalOpen}
        resetting={resetting}
        onConfirm={handleResetConfirm}
        onCancel={() => setResetModalOpen(false)}
      />
    </div>
  );
}
