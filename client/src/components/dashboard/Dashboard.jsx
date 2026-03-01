import { useState } from 'react';
import { RefreshCw, Clock, Database, Zap, BarChart2, Brain } from 'lucide-react';
import { useSensorData } from '../../hooks/useSensorData';
import SensorCard from './SensorCard';
import StatusIndicator from './StatusIndicator';
import RecommendationBox from './RecommendationBox';
import AlertManager from './AlertManager';
import PredictionPanel from './PredictionPanel';
import {
  TemperatureChart, HumidityChart, AirQualityChart,
  RainfallChart, LDRChart
} from '../charts/SensorCharts';

// ── Use backend-computed status (SAFE/WARNING/DANGER/ERROR)
// Map backend terms → frontend display terms
const mapStatus = (backendStatus) => {
  switch (backendStatus) {
    case 'SAFE':    return 'normal';
    case 'WARNING': return 'warning';
    case 'DANGER':  return 'danger';
    case 'ERROR':   return 'offline';
    default:        return 'offline';
  }
};

const getSensorStatus = (key, latest) => {
  // If backend has status, use it
  if (latest?.status?.[key]) return mapStatus(latest.status[key]);
  // Fallback: offline
  return 'offline';
};

const getOverallStatus = (latest) => {
  if (!latest) return 'offline';
  if (latest?.status?.overall) return mapStatus(latest.status.overall);
  return 'offline';
};

const formatTime = (ts) => {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// ── Section header ────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, iconColor, title, subtitle, right }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2.5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
    {right}
  </div>
);

// ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { history, latest, loading, error, isLive, socketId, refetch } = useSensorData();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 600);
  };

  const overallStatus = getOverallStatus(latest);

  const sensorCards = [
    { key: 'temperature', label: 'Temperature', icon: '🌡', unit: '°C',  color: 'orange', min: -10, max: 50,   description: 'DHT11 Sensor' },
    { key: 'humidity',    label: 'Humidity',    icon: '💧', unit: '%',   color: 'blue',   min: 0,   max: 100,  description: 'DHT11 Sensor' },
    { key: 'airQuality',  label: 'Air Quality', icon: '🌬', unit: 'AQI', color: 'purple', min: 0,   max: 4095, description: 'MQ135 Sensor' },
    { key: 'rainfall',    label: 'Rainfall',    icon: '🌧', unit: 'ADC', color: 'cyan',   min: 0,   max: 4095, description: 'Raindrop Sensor' },
    { key: 'ldr',         label: 'Light (LDR)', icon: '☀', unit: 'ADC', color: 'yellow', min: 0,   max: 4095, description: 'LDR Sensor' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-gray-400">Connecting to IoT backend...</p>
          <p className="text-xs text-gray-600">Establishing WebSocket connection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">

      {/* ── ① Dashboard Header ───────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Sensor Dashboard</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <StatusIndicator
              status={overallStatus}
              label={`System ${overallStatus === 'normal' ? 'Healthy' : overallStatus === 'warning' ? 'Warning' : overallStatus === 'danger' ? 'Critical' : 'Offline'}`}
              pulse
            />
            {latest && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Updated {formatTime(latest.timestamp)}</span>
              </div>
            )}
            {error && (
              <span className="text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                {error}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border
            ${isLive
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
              : 'bg-gray-800/60 border-gray-700/50 text-gray-500'}`}>
            <Zap className="w-3 h-3" />
            <span>{isLive ? `WS Live · ${socketId?.slice(0, 6)}…` : 'WS Offline'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/60 border border-gray-700/50 rounded-lg text-xs text-gray-400">
            <Database className="w-3 h-3" />
            <span>{history.length} records</span>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/15 border border-cyan-500/30
              text-cyan-400 rounded-lg text-xs font-semibold hover:bg-cyan-500/25 transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── AI Voice & Alert Manager ─────────────────────────────── */}
      <section>
        <AlertManager latest={latest} />
      </section>

      {/* ── ② Live Sensor Cards ──────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={Zap}
          iconColor="bg-cyan-500/15 border border-cyan-500/20 text-cyan-400"
          title="Live Sensor Readings"
          subtitle="Real-time data from NodeMCU ESP8266 — status computed by backend"
          right={<span className="text-xs text-gray-600">Auto-updates via WebSocket</span>}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {sensorCards.map(({ key, label, icon, unit, color, min, max, description }) => (
            <SensorCard
              key={key}
              label={label}
              icon={icon}
              unit={unit}
              color={color}
              min={min}
              max={max}
              value={latest?.[key]}
              status={getSensorStatus(key, latest)}
              label2={latest?.labels?.[key] || ''}
              description={description}
            />
          ))}
        </div>

        {/* Backend status label strip */}
        {latest?.status && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(latest.labels || {}).map(([key, lbl]) => {
              const st = mapStatus(latest.status[key]);
              const colorMap = { normal: 'text-emerald-400 bg-emerald-500/8 border-emerald-500/15', warning: 'text-yellow-400 bg-yellow-500/8 border-yellow-500/15', danger: 'text-red-400 bg-red-500/8 border-red-500/15', offline: 'text-gray-500 bg-gray-500/8 border-gray-700/30' };
              return lbl ? (
                <span key={key} className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${colorMap[st]}`}>
                  {key === 'temperature' ? '🌡' : key === 'humidity' ? '💧' : key === 'airQuality' ? '🌬' : key === 'rainfall' ? '🌧' : '☀'} {lbl}
                </span>
              ) : null;
            })}
            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${mapStatus(latest.status.overall) === 'normal' ? 'text-emerald-400 bg-emerald-500/8 border-emerald-500/15' : mapStatus(latest.status.overall) === 'warning' ? 'text-yellow-400 bg-yellow-500/8 border-yellow-500/15' : 'text-red-400 bg-red-500/8 border-red-500/15'}`}>
              Overall: {latest.status.overall}
            </span>
          </div>
        )}
      </section>

      {/* ── ③ All Sensor Charts — Unified Frame ─────────────────── */}
      <section>
        <SectionHeader
          icon={BarChart2}
          iconColor="bg-blue-500/15 border border-blue-500/20 text-blue-400"
          title="Sensor History Charts"
          subtitle="Last 50 readings — click ▲ to minimize · ⤢ to expand full-screen"
          right={<span className="text-xs text-gray-600">{history.length} data points</span>}
        />
        <div className="rounded-2xl bg-gray-900/40 border border-white/7 p-5 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TemperatureChart data={history} />
            <HumidityChart data={history} />
          </div>
          <div className="h-px bg-white/5" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AirQualityChart data={history} />
            <RainfallChart data={history} />
          </div>
          <div className="h-px bg-white/5" />
          <LDRChart data={history} />
        </div>
      </section>

      {/* ── ④ AI Prediction Panel ───────────────────────────────── */}
      <section>
        <SectionHeader
          icon={Brain}
          iconColor="bg-purple-500/15 border border-purple-500/20 text-purple-400"
          title="AI Predictive Analytics"
          subtitle="TensorFlow.js LSTM — forecasts next sensor values"
          right={<span className="text-xs text-gray-600">Auto-retrains every 5 readings</span>}
        />
        <PredictionPanel />
      </section>

      {/* ── ⑤ Recommendations ───────────────────────────────────── */}
      <section>
        <RecommendationBox latest={latest} />
      </section>

      {/* ── ⑥ Data Table ────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">Recent Readings</h2>
          <span className="text-xs text-gray-500">Latest 10 entries — status from backend</span>
        </div>
        <div className="rounded-2xl bg-gray-900/60 border border-white/8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Time', 'Temp', 'Humidity', 'Air Quality', 'Rainfall', 'LDR', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().slice(0, 10).map((row, i) => {
                  const rowOverall = row?.status?.overall || 'SAFE';
                  const overallCls = rowOverall === 'DANGER' ? 'text-red-400' : rowOverall === 'WARNING' ? 'text-yellow-400' : 'text-emerald-400';
                  return (
                    <tr
                      key={row._id || i}
                      className={`border-b border-white/4 hover:bg-white/3 transition-colors
                        ${i === 0 ? 'bg-gradient-to-r from-cyan-500/5 to-transparent' : ''}`}
                    >
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{formatTime(row.timestamp)}</td>
                      <td className="px-4 py-3 text-xs font-mono font-semibold text-orange-400">{row.temperature?.toFixed(1)}°C</td>
                      <td className="px-4 py-3 text-xs font-mono font-semibold text-blue-400">{row.humidity?.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-xs font-mono font-semibold text-purple-400">{row.airQuality}</td>
                      <td className="px-4 py-3 text-xs font-mono font-semibold text-cyan-400">{row.rainfall}</td>
                      <td className="px-4 py-3 text-xs font-mono font-semibold text-yellow-400">{row.ldr}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${overallCls}
                          ${rowOverall === 'DANGER' ? 'bg-red-500/10 border-red-500/20' : rowOverall === 'WARNING' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                          {rowOverall}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Dashboard;
