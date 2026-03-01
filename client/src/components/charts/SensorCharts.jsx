import { useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { Minimize2, Maximize2, X, ChevronDown, ChevronUp } from 'lucide-react';

// ── Colors ────────────────────────────────────────────────────────
export const chartColors = {
  temperature: '#f97316',
  humidity:    '#3b82f6',
  airQuality:  '#a855f7',
  rainfall:    '#06b6d4',
  ldr:         '#f59e0b',
};

const formatTime = (ts) => {
  try { return format(new Date(ts), 'HH:mm'); } catch { return ts; }
};

// ── Tooltip ───────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, unit, color }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900/95 border border-white/10 rounded-xl px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-xs text-gray-500 mb-1">{formatTime(label)}</p>
      <p className="text-sm font-bold" style={{ color }}>
        {payload[0].value?.toFixed(1)} <span className="text-xs font-normal text-gray-400">{unit}</span>
      </p>
    </div>
  );
};

// ── Full-screen modal overlay ─────────────────────────────────────
const ChartModal = ({ title, icon, color, onClose, children }) => (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    style={{ background: 'rgba(3,7,18,0.92)', backdropFilter: 'blur(8px)' }}
    onClick={onClose}
  >
    <div
      className="w-full max-w-5xl rounded-2xl bg-gray-900 border border-white/10 shadow-2xl overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Modal header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/8">
        <span className="text-xl">{icon}</span>
        <h2 className="text-base font-bold text-white flex-1">{title}</h2>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10
            border border-white/8 text-gray-400 hover:text-white text-xs transition-all"
        >
          <X className="w-3.5 h-3.5" /> Close
        </button>
      </div>
      {/* Chart — tall */}
      <div className="p-5">
        {children(480)}
      </div>
    </div>
  </div>
);

// ── Reusable chart card wrapper ───────────────────────────────────
const ChartCard = ({ title, icon, color, subtitle, children }) => {
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

  const toggleMin = useCallback((e) => { e.stopPropagation(); setMinimized(v => !v); }, []);
  const openMax   = useCallback((e) => { e.stopPropagation(); setMaximized(true); },  []);
  const closeMax  = useCallback(() => setMaximized(false), []);

  return (
    <>
      <div className={`rounded-2xl bg-gray-900/60 border border-white/8 overflow-hidden
        transition-all duration-300 ${minimized ? 'opacity-80' : ''}`}>

        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/6">
          <span className="text-lg">{icon}</span>
          <h3 className="text-sm font-semibold text-white flex-1">{title}</h3>
          <span className="text-xs text-gray-500 mr-2">{subtitle}</span>

          {/* Minimize button */}
          <button
            onClick={toggleMin}
            title={minimized ? 'Expand chart' : 'Collapse chart'}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500
              hover:text-gray-200 hover:bg-white/8 transition-all"
          >
            {minimized
              ? <ChevronDown className="w-3.5 h-3.5" />
              : <ChevronUp   className="w-3.5 h-3.5" />}
          </button>

          {/* Maximize button */}
          <button
            onClick={openMax}
            title="Expand to full screen"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500
              hover:text-gray-200 hover:bg-white/8 transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Chart body — hidden when minimized */}
        <div
          className={`transition-all duration-300 overflow-hidden ${minimized ? 'max-h-0 py-0' : 'max-h-[400px] py-4 px-5'}`}
        >
          {!minimized && children(200)}
        </div>

        {/* Minimized placeholder */}
        {minimized && (
          <div
            className="flex items-center justify-center gap-2 py-2 cursor-pointer text-gray-600
              hover:text-gray-400 transition-colors text-xs"
            onClick={toggleMin}
          >
            <ChevronDown className="w-3 h-3" />
            Chart collapsed — click to expand
          </div>
        )}
      </div>

      {/* Full-screen modal */}
      {maximized && (
        <ChartModal title={title} icon={icon} color={color} onClose={closeMax}>
          {(h) => children(h)}
        </ChartModal>
      )}
    </>
  );
};

// ── Temperature ───────────────────────────────────────────────────
export const TemperatureChart = ({ data = [] }) => {
  const color = chartColors.temperature;
  const chart = (height) => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip unit="°C" color={color} />} />
        <ReferenceLine y={35} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'Danger', fill: '#ef4444', fontSize: 9 }} />
        <ReferenceLine y={15} stroke="#3b82f6" strokeDasharray="4 4" strokeOpacity={0.4} />
        <Area type="monotone" dataKey="temperature" stroke={color} strokeWidth={2} fill="url(#tempGrad)" dot={false} activeDot={{ r: 4, fill: color }} />
      </AreaChart>
    </ResponsiveContainer>
  );
  return (
    <ChartCard title="Temperature" icon="🌡" color={color} subtitle="Last 20 readings · °C">
      {chart}
    </ChartCard>
  );
};

// ── Humidity ──────────────────────────────────────────────────────
export const HumidityChart = ({ data = [] }) => {
  const color = chartColors.humidity;
  const chart = (height) => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip content={<CustomTooltip unit="%" color={color} />} />
        <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'Danger', fill: '#ef4444', fontSize: 9 }} />
        <Area type="monotone" dataKey="humidity" stroke={color} strokeWidth={2} fill="url(#humGrad)" dot={false} activeDot={{ r: 4, fill: color }} />
      </AreaChart>
    </ResponsiveContainer>
  );
  return (
    <ChartCard title="Humidity" icon="💧" color={color} subtitle="Last 20 readings · %">
      {chart}
    </ChartCard>
  );
};

// ── Air Quality ───────────────────────────────────────────────────
export const AirQualityChart = ({ data = [] }) => {
  const color = chartColors.airQuality;
  const chart = (height) => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
        <defs>
          <linearGradient id="aqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1023]} />
        <Tooltip content={<CustomTooltip unit="AQI" color={color} />} />
        <ReferenceLine y={700} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'Hazardous', fill: '#ef4444', fontSize: 9 }} />
        <ReferenceLine y={400} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'Warning', fill: '#f59e0b', fontSize: 9 }} />
        <Area type="monotone" dataKey="airQuality" stroke={color} strokeWidth={2} fill="url(#aqGrad)" dot={false} activeDot={{ r: 4, fill: color }} />
      </AreaChart>
    </ResponsiveContainer>
  );
  return (
    <ChartCard title="Air Quality (MQ135)" icon="🌬" color={color} subtitle="Last 20 readings · AQI">
      {chart}
    </ChartCard>
  );
};

// ── Rainfall ──────────────────────────────────────────────────────
export const RainfallChart = ({ data = [] }) => {
  const color = chartColors.rainfall;
  const chart = (height) => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip content={<CustomTooltip unit="%" color={color} />} />
        <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'Heavy', fill: '#ef4444', fontSize: 9 }} />
        <Area type="monotone" dataKey="rainfall" stroke={color} strokeWidth={2} fill="url(#rainGrad)" dot={false} activeDot={{ r: 4, fill: color }} />
      </AreaChart>
    </ResponsiveContainer>
  );
  return (
    <ChartCard title="Rainfall Sensor" icon="🌧" color={color} subtitle="Last 20 readings · %">
      {chart}
    </ChartCard>
  );
};

// ── LDR ───────────────────────────────────────────────────────────
export const LDRChart = ({ data = [] }) => {
  const color = chartColors.ldr;
  const chart = (height) => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
        <defs>
          <linearGradient id="ldrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1023]} />
        <Tooltip content={<CustomTooltip unit="lux" color={color} />} />
        <Area type="monotone" dataKey="ldr" stroke={color} strokeWidth={2} fill="url(#ldrGrad)" dot={false} activeDot={{ r: 4, fill: color }} />
      </AreaChart>
    </ResponsiveContainer>
  );
  return (
    <ChartCard title="Light Intensity (LDR)" icon="☀" color={color} subtitle="Last 20 readings · 0-1023">
      {chart}
    </ChartCard>
  );
};
