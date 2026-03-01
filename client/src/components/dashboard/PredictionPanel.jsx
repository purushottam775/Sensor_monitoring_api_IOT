import { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle, Clock, Zap, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { usePrediction } from '../../hooks/usePrediction';

// ── Sensor display meta ───────────────────────────────────────────
const SENSOR_META = {
  temperature: { label: 'Temperature', icon: '🌡', unit: '°C',   color: '#f97316', bg: 'from-orange-500/10 to-orange-600/5', border: 'border-orange-500/20' },
  humidity:    { label: 'Humidity',    icon: '💧', unit: '%',    color: '#3b82f6', bg: 'from-blue-500/10 to-blue-600/5',    border: 'border-blue-500/20'   },
  airQuality:  { label: 'Air Quality', icon: '🌬', unit: 'AQI',  color: '#a855f7', bg: 'from-purple-500/10 to-purple-600/5', border: 'border-purple-500/20' },
  rainfall:    { label: 'Rainfall',    icon: '🌧', unit: '%',    color: '#06b6d4', bg: 'from-cyan-500/10 to-cyan-600/5',   border: 'border-cyan-500/20'   },
  ldr:         { label: 'Light (LDR)', icon: '☀', unit: 'lux', color: '#f59e0b', bg: 'from-yellow-500/10 to-yellow-600/5', border: 'border-yellow-500/20' },
};

const STATUS_CFG = {
  safe:    { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25', dot: 'bg-emerald-400', label: 'Safe' },
  warning: { color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/25',  dot: 'bg-yellow-400 animate-pulse',  label: 'Warning' },
  danger:  { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/25',        dot: 'bg-red-400 animate-pulse',     label: 'Danger'  },
  error:   { color: 'text-gray-400',    bg: 'bg-white/5 border-white/10',             dot: 'bg-gray-400',                 label: 'Error'  },
};

// ── Countdown timer hook ──────────────────────────────────────────
const useCountdown = (minutesAhead) => {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    if (!minutesAhead) { setDisplay(''); return; }
    const totalSec = Math.round(minutesAhead * 60);
    let remaining  = totalSec;
    const tick = () => {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      if (remaining >= 0) {
        setDisplay(`${m}m ${s.toString().padStart(2, '0')}s`);
        remaining--;
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [minutesAhead]);
  return display;
};

// ── Single sensor prediction card ────────────────────────────────
const SensorPredCard = ({ sensorKey, data }) => {
  const meta   = SENSOR_META[sensorKey];
  // Map 'safe'/'normal' to STATUS_CFG
  const statusKey = data.status === 'normal' ? 'safe' : data.status;
  const status = STATUS_CFG[statusKey] || STATUS_CFG.safe;
  const dangerCountdown = useCountdown(data.timeToDanger);

  const trendIcon = data.trend === 'rising'
    ? <TrendingUp  className="w-3.5 h-3.5 text-red-400" />
    : data.trend === 'falling'
    ? <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
    : <Minus className="w-3.5 h-3.5 text-gray-400" />;

  const delta     = (data.predicted - data.current).toFixed(1);
  const deltaSign = delta > 0 ? '+' : '';

  // Calculate percentage for progress bar (use 4095 for raw ADC, 100 for percentage/temp)
  const rangeMax = (sensorKey === 'airQuality' || sensorKey === 'rainfall' || sensorKey === 'ldr') ? 4095 : 100;
  const progressPercent = Math.min(100, Math.max(5, (data.predicted / rangeMax) * 100));

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${meta.bg} border ${meta.border} p-4 relative overflow-hidden group hover:scale-[1.01] transition-all duration-200`}>
      {/* Glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${meta.color}18, transparent 70%)` }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{meta.icon}</span>
          <span className="text-xs font-semibold text-gray-300">{meta.label}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.bg} ${status.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {data.label || status.label}
          </span>
        </div>
      </div>

      {/* Current → Predicted */}
      <div className="flex items-end justify-between gap-2 mb-3">
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Current</div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {data.current}<span className="text-xs text-gray-500 ml-0.5">{meta.unit}</span>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center px-2 pb-1 text-center">
          {trendIcon}
          <span className={`text-[10px] font-semibold mt-0.5 ${delta > 0 ? 'text-red-400' : delta < 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
            {deltaSign}{delta}
          </span>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Predicted</div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: meta.color }}>
            {data.predicted}<span className="text-xs ml-0.5" style={{ color: `${meta.color}99` }}>{meta.unit}</span>
          </div>
        </div>
      </div>

      {/* Progress bar — current vs predicted within range */}
      <div className="h-1 rounded-full bg-white/5 overflow-hidden mb-3">
        <div
          className="h-full rounded-full"
          style={{
            width: `${progressPercent}%`,
            background: `linear-gradient(90deg, ${meta.color}55, ${meta.color})`,
            transition: 'width 1s ease'
          }}
        />
      </div>

      {/* Status Footer */}
      <div className="min-h-[22px]">
        {dangerCountdown && (
          <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1">
            <Clock className="w-3 h-3 text-red-400 flex-shrink-0" />
            <span className="text-[11px] text-red-300 font-medium">Danger in <span className="font-bold font-mono">{dangerCountdown}</span></span>
          </div>
        )}
        {!dangerCountdown && (data.status === 'safe' || data.status === 'normal') && (
          <div className="flex items-center gap-1.5 opacity-60">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px] text-emerald-400">Safe — stable zone</span>
          </div>
        )}
        {!dangerCountdown && data.status === 'danger' && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-[11px] text-red-400 font-bold uppercase tracking-tight">IN DANGER ZONE</span>
          </div>
        )}
        {!dangerCountdown && data.status === 'warning' && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-yellow-500" />
            <span className="text-[11px] text-yellow-500 font-semibold">Elevated Risk</span>
          </div>
        )}
        {data.status === 'error' && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-gray-400" />
            <span className="text-[11px] text-gray-400">Check Sensor Connection</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Confidence Meter ──────────────────────────────────────────────
const ConfidenceMeter = ({ confidence }) => {
  const pct   = Math.min(100, Math.max(0, confidence));
  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
  const label = pct >= 70 ? 'High Confidence' : pct >= 40 ? 'Moderate' : 'Low (needs more data)';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 8px ${color}55` }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>{pct.toFixed(0)}%</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
};

// ── Main PredictionPanel ──────────────────────────────────────────
const PredictionPanel = () => {
  const { prediction, loading } = usePrediction();
  const [collapsed, setCollapsed] = useState(false);

  const hasDanger  = prediction && Object.values(prediction.sensors || {}).some(s => s.status === 'danger');
  const hasWarning = prediction && Object.values(prediction.sensors || {}).some(s => s.status === 'warning');

  const panelStatus = hasDanger ? 'danger' : hasWarning ? 'warning' : 'normal';
  const panelColors = {
    normal:  { border: 'border-purple-500/20', glow: 'from-purple-500/8 to-indigo-600/5', badge: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' },
    warning: { border: 'border-yellow-500/25', glow: 'from-yellow-500/8 to-orange-600/5', badge: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400' },
    danger:  { border: 'border-red-500/25',    glow: 'from-red-500/8 to-red-600/5',       badge: 'bg-red-500/10 border-red-500/25 text-red-400' },
  };
  const pc = panelColors[panelStatus];

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${pc.glow} border ${pc.border} overflow-hidden`}>

      {/* ── Panel Header ─────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Brain icon with pulse */}
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
              <Brain className="w-4 h-4 text-purple-400" />
            </div>
            {!loading && prediction?.modelReady && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-400 border-2 border-gray-950 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">AI Predictions</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/20 font-semibold">LSTM</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              TensorFlow.js · {prediction?.dataPoints || 0} training points
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Overall alert badge */}
          {panelStatus !== 'normal' && (
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${pc.badge}`}>
              <AlertTriangle className="w-3 h-3" />
              {panelStatus === 'danger' ? 'DANGER PREDICTED' : 'WARNING AHEAD'}
            </span>
          )}

          {/* Model ready indicator */}
          <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border
            ${prediction?.modelReady
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-gray-800/60 border-gray-700/50 text-gray-500'
            }`}>
            <Zap className="w-3 h-3" />
            {prediction?.modelReady ? 'Model Ready' : 'Training...'}
          </span>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-5 space-y-5">

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
                <div className="absolute inset-0 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              </div>
              <p className="text-sm text-gray-400">LSTM model initializing...</p>
              <p className="text-xs text-gray-600">Waiting for backend to train on sensor history</p>
            </div>
          )}

          {/* Not ready yet */}
          {!loading && !prediction?.modelReady && (
            <div className="flex flex-col items-center justify-center py-8 space-y-2 text-center">
              <Activity className="w-10 h-10 text-purple-400/40" />
              <p className="text-sm text-gray-400">Model needs more data</p>
              <p className="text-xs text-gray-600 max-w-xs">
                Send at least 11 sensor readings to the backend so the LSTM can train and start predicting.
              </p>
            </div>
          )}

          {/* Predictions grid */}
          {!loading && prediction?.modelReady && prediction?.sensors && (
            <>
              {/* Confidence */}
              <div className="rounded-xl bg-black/20 border border-white/5 px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Model Confidence</span>
                  <span className="text-[10px] text-gray-600">loss: {prediction.trainLoss?.toFixed(4) ?? '—'}</span>
                </div>
                <ConfidenceMeter confidence={prediction.confidence} />
              </div>

              {/* 5-card grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3">
                {Object.entries(prediction.sensors).map(([key, data]) => (
                  <SensorPredCard key={key} sensorKey={key} data={data} />
                ))}
              </div>

              {/* Footer meta */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span>Predicted: {prediction.timestamp
                    ? new Date(prediction.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-[11px] text-gray-600">
                    <TrendingUp className="w-3 h-3 text-red-400" /> Rising
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-gray-600">
                    <TrendingDown className="w-3 h-3 text-emerald-400" /> Falling
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-gray-600">
                    <Minus className="w-3 h-3 text-gray-500" /> Stable
                  </span>
                </div>
                <div className="text-[11px] text-gray-600">
                  Auto-retrains every 5 new readings
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PredictionPanel;
