// API base URLs
export const NODE_API = 'http://localhost:5000/api';
export const ML_API = 'http://localhost:5001';
export const ADVANCED_ML_API = 'http://localhost:5002';
export const SOCKET_URL = 'http://localhost:5000';

// Node.js REST endpoints
export const ENDPOINTS = {
  sensorData: `${NODE_API}/sensor`,          // GET all (latest 500)
  latestSensor: `${NODE_API}/sensor/latest`, // GET latest reading
  createSensor: `${NODE_API}/sensor`,        // POST new reading
};

// Python ML REST endpoints
export const ML_ENDPOINTS = {
  health: `${ML_API}/health`,
  modelInfo: `${ML_API}/model-info`,
  predict: `${ML_API}/predict`,          // POST multi-horizon
  predictSingle: `${ML_API}/predict/single`, // POST single step
  train: `${ML_API}/train`,
};

// Advanced XGBoost ML REST endpoints
export const ADVANCED_ML_ENDPOINTS = {
  health: `${ADVANCED_ML_API}/health`,
  predict: `${ADVANCED_ML_API}/predict`,
  train: `${ADVANCED_ML_API}/train`,
};

// Sensor metadata
export const SENSORS = {
  temperature: {
    label: 'Temperature', unit: '°C', icon: '🌡️',
    color: '#f97316', gradientFrom: '#f97316', gradientTo: '#dc2626',
    min: -20, max: 60, warningMin: 10, warningMax: 35, dangerMax: 45,
    description: 'Ambient air temperature measured by DHT22 sensor',
  },
  humidity: {
    label: 'Humidity', unit: '%', icon: '💧',
    color: '#38bdf8', gradientFrom: '#38bdf8', gradientTo: '#2563eb',
    min: 0, max: 100, warningMin: 30, warningMax: 70, dangerMax: 85,
    description: 'Relative humidity measured by DHT22 sensor',
  },
  airQuality: {
    label: 'Air Quality', unit: 'AQI', icon: '🌫️',
    color: '#a78bfa', gradientFrom: '#a78bfa', gradientTo: '#7c3aed',
    min: 0, max: 4095, warningMin: 0, warningMax: 1200, dangerMin: 2000,
    description: 'Raw ADC air quality index from MQ-135 gas sensor',
  },
  rainfall: {
    label: 'Rainfall', unit: 'ADC', icon: '🌧️',
    color: '#34d399', gradientFrom: '#34d399', gradientTo: '#059669',
    min: 0, max: 4095, warningMin: 1000, warningMax: 2000, dangerMin: 0,
    description: 'Raindrop sensor raw ADC (lower = heavier rain)',
    invertScale: true,
  },
  ldr: {
    label: 'Light Level', unit: 'ADC', icon: '☀️',
    color: '#fbbf24', gradientFrom: '#fbbf24', gradientTo: '#d97706',
    min: 0, max: 4095, warningMin: 800, warningMax: 2000, dangerMin: 0,
    description: 'Light intensity from LDR photoresistor (0=dark, 4095=bright)',
  },
};

// Status colours
export const STATUS_COLORS = {
  SAFE: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', dot: '#10b981' },
  safe: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', dot: '#10b981' },
  WARNING: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', dot: '#f59e0b' },
  warning: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', dot: '#f59e0b' },
  DANGER: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40', dot: '#ef4444' },
  danger: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40', dot: '#ef4444' },
  ERROR: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/40', dot: '#94a3b8' },
};
