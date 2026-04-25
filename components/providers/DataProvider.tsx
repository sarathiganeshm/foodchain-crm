'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export type SensorStatus = 'NORMAL' | 'WARNING' | 'CRITICAL';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Sensor {
  id: string;
  location: string;
  type: 'temp' | 'humidity';
  safeMin: number;
  safeMax: number;
  warnAt?: number;
  currentValue: number;
  status: SensorStatus;
  history: number[];
}

export interface Alert {
  id: string;
  sensorId: string;
  location: string;
  message: string;
  severity: AlertSeverity;
  timestamp: Date;
  acknowledged: boolean;
  value?: number;
}

export interface Shipment {
  id: string;
  from: string;
  to: string;
  product: string;
  status: 'In Transit' | 'Delayed' | 'Delivered' | 'At Risk';
  temp: number;
  driver: string;
  eta: string;
  progress: number;
}

export interface ForecastPoint {
  date: string;
  forecast: number;
  upper: number;
  lower: number;
  actual?: number | null;
}

export interface SurplusItem {
  id: string;
  product: string;
  quantity: number;
  unit: string;
  location: string;
  daysRemaining: number;
  cause: string;
  value: number;
  suggestedAction: string;
}

export interface DataContextType {
  sensors: Sensor[];
  alerts: Alert[];
  shipments: Shipment[];
  forecast: ForecastPoint[];
  coldChainScore: number;
  bullwhipRisk: 'Low' | 'Medium' | 'High';
  bullwhipScore: number;
  wasteThisWeek: number;
  mapeScore: number;
  redistributedToday: number;
  surplusItems: SurplusItem[];
  activeAlerts: Alert[];
  acknowledgeAlert: (id: string) => void;
  forecastCategory: string;
  setForecastCategory: (cat: string) => void;
}

const SENSOR_CONFIG = [
  { id: 'SENS-LDS-001', location: 'Farm Gate — Leeds', type: 'temp' as const, safeMin: 2, safeMax: 8, warnAt: 9 },
  { id: 'SENS-LDS-002', location: 'Farm Gate — Leeds', type: 'humidity' as const, safeMin: 55, safeMax: 80 },
  { id: 'SENS-LDS-003', location: 'Farm Gate — Leeds', type: 'temp' as const, safeMin: 2, safeMax: 8 },
  { id: 'SENS-MAN-001', location: 'Processing — Manchester', type: 'temp' as const, safeMin: 1, safeMax: 6 },
  { id: 'SENS-MAN-002', location: 'Processing — Manchester', type: 'temp' as const, safeMin: 1, safeMax: 6 },
  { id: 'SENS-MAN-003', location: 'Processing — Manchester', type: 'humidity' as const, safeMin: 50, safeMax: 70 },
  { id: 'SENS-BHM-001', location: 'Distribution — Birmingham', type: 'temp' as const, safeMin: 1, safeMax: 5 },
  { id: 'SENS-BHM-002', location: 'Distribution — Birmingham', type: 'temp' as const, safeMin: 1, safeMax: 5 },
  { id: 'SENS-BHM-003', location: 'Distribution — Birmingham', type: 'humidity' as const, safeMin: 55, safeMax: 75 },
  { id: 'SENS-FLT-001', location: 'Fleet — M1 Corridor', type: 'temp' as const, safeMin: 1, safeMax: 8 },
  { id: 'SENS-FLT-002', location: 'Fleet — A1 North', type: 'temp' as const, safeMin: 1, safeMax: 8 },
  { id: 'SENS-FLT-003', location: 'Fleet — M6 Midlands', type: 'temp' as const, safeMin: 1, safeMax: 8 },
  { id: 'SENS-LON-001', location: 'Store — London Brixton', type: 'temp' as const, safeMin: 2, safeMax: 7 },
  { id: 'SENS-LON-002', location: 'Store — London Brixton', type: 'temp' as const, safeMin: -22, safeMax: -18 },
  { id: 'SENS-LON-003', location: 'Store — London Brixton', type: 'humidity' as const, safeMin: 45, safeMax: 65 },
  { id: 'SENS-SHF-001', location: 'Store — Sheffield North', type: 'temp' as const, safeMin: 2, safeMax: 7 },
  { id: 'SENS-SHF-002', location: 'Store — Sheffield North', type: 'temp' as const, safeMin: -22, safeMax: -18 },
  { id: 'SENS-LIV-001', location: 'Store — Liverpool Central', type: 'temp' as const, safeMin: 2, safeMax: 7 },
  { id: 'SENS-NCL-001', location: 'Store — Newcastle Eldon', type: 'temp' as const, safeMin: 2, safeMax: 7 },
  { id: 'SENS-NCL-002', location: 'Store — Newcastle Eldon', type: 'humidity' as const, safeMin: 45, safeMax: 65 },
];

function initSensorValue(cfg: typeof SENSOR_CONFIG[0]): number {
  const mid = (cfg.safeMin + cfg.safeMax) / 2;
  const range = (cfg.safeMax - cfg.safeMin) * 0.4;
  return parseFloat((mid + (Math.random() - 0.5) * range).toFixed(1));
}

function getSensorStatus(value: number, cfg: typeof SENSOR_CONFIG[0]): SensorStatus {
  const warnAt = cfg.warnAt ?? cfg.safeMax + 1;
  if (value > warnAt || value < cfg.safeMin - 1) return 'CRITICAL';
  if (value > cfg.safeMax || value < cfg.safeMin) return 'WARNING';
  return 'NORMAL';
}

function generateForecast(days: number, category: string): ForecastPoint[] {
  const seeds: Record<string, number> = {
    'Fresh Produce': 1200, 'Dairy': 800, 'Bakery': 600,
    'Frozen': 450, 'Meat': 900, 'Ready Meals': 700,
  };
  const base = seeds[category] ?? 800;
  return Array.from({ length: days }, (_, i) => {
    const forecast = Math.round(base + base * 0.3 * Math.sin(i * 0.4) + (Math.random() - 0.5) * base * 0.1);
    return {
      date: new Date(Date.now() + i * 86400000).toLocaleDateString('en-GB'),
      forecast,
      upper: Math.round(forecast * 1.15),
      lower: Math.round(forecast * 0.85),
      actual: i < 7 ? Math.round(forecast * (0.9 + Math.random() * 0.2)) : null,
    };
  });
}

const INITIAL_SHIPMENTS: Shipment[] = [
  { id: 'SHP-001', from: 'Leeds Farm', to: 'Birmingham DC', product: 'Fresh Produce', status: 'In Transit', temp: 4.2, driver: 'J. Walsh', eta: '14:30', progress: 65 },
  { id: 'SHP-002', from: 'Manchester Proc.', to: 'London Brixton', product: 'Dairy', status: 'At Risk', temp: 8.1, driver: 'S. Patel', eta: '16:15', progress: 45 },
  { id: 'SHP-003', from: 'Birmingham DC', to: 'Sheffield Store', product: 'Bakery', status: 'In Transit', temp: 3.8, driver: 'M. Brown', eta: '13:00', progress: 80 },
  { id: 'SHP-004', from: 'Leeds Farm', to: 'Liverpool Central', product: 'Meat', status: 'Delayed', temp: 2.9, driver: 'R. Ahmed', eta: '17:45', progress: 30 },
  { id: 'SHP-005', from: 'Manchester Proc.', to: 'Newcastle Eldon', product: 'Ready Meals', status: 'In Transit', temp: 5.1, driver: 'C. Jones', eta: '18:20', progress: 55 },
  { id: 'SHP-006', from: 'Birmingham DC', to: 'London Brixton', product: 'Frozen', status: 'Delivered', temp: -20.2, driver: 'A. Smith', eta: 'Done', progress: 100 },
  { id: 'SHP-007', from: 'Leeds Farm', to: 'Sheffield North', product: 'Fresh Produce', status: 'In Transit', temp: 3.5, driver: 'P. Kumar', eta: '15:00', progress: 70 },
  { id: 'SHP-008', from: 'Manchester Proc.', to: 'Birmingham DC', product: 'Dairy', status: 'In Transit', temp: 4.8, driver: 'L. Chen', eta: '12:30', progress: 88 },
  { id: 'SHP-009', from: 'Birmingham DC', to: 'Liverpool Central', product: 'Meat', status: 'In Transit', temp: 2.1, driver: 'T. Williams', eta: '16:00', progress: 40 },
  { id: 'SHP-010', from: 'Leeds Farm', to: 'Newcastle Eldon', product: 'Bakery', status: 'In Transit', temp: 6.3, driver: 'D. Taylor', eta: '19:00', progress: 25 },
];

const INITIAL_SURPLUS: SurplusItem[] = [
  { id: 'S001', product: 'Strawberries — Class II', quantity: 240, unit: 'kg', location: 'Birmingham DC', daysRemaining: 1, cause: 'Cosmetic rejection', value: 480, suggestedAction: 'Donate' },
  { id: 'S002', product: 'Mixed Salad Leaves', quantity: 180, unit: 'bags', location: 'London Brixton', daysRemaining: 2, cause: 'Overstock', value: 270, suggestedAction: 'Markdown' },
  { id: 'S003', product: 'Crusty Bread Loaves', quantity: 95, unit: 'units', location: 'Sheffield North', daysRemaining: 1, cause: 'End of day', value: 142, suggestedAction: 'Donate' },
  { id: 'S004', product: 'Whole Milk 2L', quantity: 320, unit: 'units', location: 'Manchester DC', daysRemaining: 3, cause: 'Forecast error', value: 384, suggestedAction: 'Redirect DC' },
  { id: 'S005', product: 'Chicken Breast 500g', quantity: 75, unit: 'packs', location: 'Leeds Farm', daysRemaining: 2, cause: 'Size rejection', value: 562, suggestedAction: 'Markdown' },
  { id: 'S006', product: 'Courgettes — Wonky', quantity: 510, unit: 'kg', location: 'Leeds Farm', daysRemaining: 4, cause: 'Cosmetic rejection', value: 255, suggestedAction: 'Wonky Box' },
];

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [sensors, setSensors] = useState<Sensor[]>(() =>
    SENSOR_CONFIG.map(cfg => ({
      ...cfg,
      currentValue: initSensorValue(cfg),
      status: 'NORMAL' as SensorStatus,
      history: Array.from({ length: 20 }, () => initSensorValue(cfg)),
    }))
  );

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>(INITIAL_SHIPMENTS);
  const [forecastCategory, setForecastCategory] = useState('Fresh Produce');
  const [forecast, setForecast] = useState<ForecastPoint[]>(() => generateForecast(30, 'Fresh Produce'));
  const [wasteThisWeek] = useState(847);
  const [mapeScore] = useState(94.2);
  const [redistributedToday] = useState(2340);
  const alertIdRef = useRef(0);

  const addAlert = useCallback((sensor: Sensor, value: number, status: SensorStatus) => {
    const id = `ALT-${String(++alertIdRef.current).padStart(4, '0')}`;
    const severity: AlertSeverity = status === 'CRITICAL' ? 'critical' : 'warning';
    const unit = sensor.type === 'temp' ? '°C' : '%RH';
    const message = status === 'CRITICAL'
      ? `Critical breach on ${sensor.id}: ${value}${unit} (safe: ${sensor.safeMin}–${sensor.safeMax}${unit})`
      : `Warning on ${sensor.id}: ${value}${unit} approaching threshold`;

    setAlerts(prev => [
      {
        id,
        sensorId: sensor.id,
        location: sensor.location,
        message,
        severity,
        timestamp: new Date(),
        acknowledged: false,
        value,
      },
      ...prev.slice(0, 49),
    ]);

    setTimeout(() => {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    }, 30000 + Math.random() * 30000);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSensors(prev => prev.map(sensor => {
        const cfg = SENSOR_CONFIG.find(c => c.id === sensor.id)!;
        const drift = (Math.random() - 0.5) * 0.6;
        const breach = Math.random() < 0.05;
        const mid = (cfg.safeMin + cfg.safeMax) / 2;
        const breachValue = parseFloat((cfg.safeMax + 1 + Math.random() * 2).toFixed(1));
        const newValue = breach
          ? breachValue
          : parseFloat(Math.max(cfg.safeMin - 2, Math.min(cfg.safeMax + 3, sensor.currentValue + drift)).toFixed(1));
        const newStatus = getSensorStatus(newValue, cfg);

        if (newStatus !== 'NORMAL' && sensor.status === 'NORMAL') {
          setTimeout(() => addAlert({ ...sensor, currentValue: newValue, status: newStatus }, newValue, newStatus), 0);
        }

        return {
          ...sensor,
          currentValue: newValue,
          status: newStatus,
          history: [...sensor.history.slice(1), newValue],
        };
      }));

      setShipments(prev => prev.map(s => ({
        ...s,
        temp: parseFloat((s.temp + (Math.random() - 0.5) * 0.3).toFixed(1)),
        progress: s.status === 'Delivered' ? 100 : Math.min(100, s.progress + Math.random() * 2),
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, [addAlert]);

  useEffect(() => {
    setForecast(generateForecast(30, forecastCategory));
  }, [forecastCategory]);

  const coldChainScore = Math.round(
    (sensors.filter(s => s.status === 'NORMAL').length / sensors.length) * 100
  );

  const lastForecastValues = forecast.slice(0, 7).map(f => f.forecast);
  const mean = lastForecastValues.reduce((a, b) => a + b, 0) / lastForecastValues.length;
  const variance = lastForecastValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lastForecastValues.length;
  const cv = Math.sqrt(variance) / mean;
  const bullwhipScore = Math.min(100, Math.round(cv * 400));
  const bullwhipRisk: 'Low' | 'Medium' | 'High' = bullwhipScore < 30 ? 'Low' : bullwhipScore < 60 ? 'Medium' : 'High';

  const activeAlerts = alerts.filter(a => !a.acknowledged);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  }, []);

  return (
    <DataContext.Provider value={{
      sensors,
      alerts,
      shipments,
      forecast,
      coldChainScore,
      bullwhipRisk,
      bullwhipScore,
      wasteThisWeek,
      mapeScore,
      redistributedToday,
      surplusItems: INITIAL_SURPLUS,
      activeAlerts,
      acknowledgeAlert,
      forecastCategory,
      setForecastCategory,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
