import { SENSORS, STATUS_COLORS } from '../config';

function getStatus(key, val) {
  if (val === null || val === undefined) return 'ERROR';
  const s = SENSORS[key];
  if (key === 'airQuality') {
    if (val < 1200) return 'SAFE';
    if (val < 2000) return 'WARNING';
    return 'DANGER';
  }
  if (key === 'rainfall') {
    if (val > 3500) return 'SAFE';
    if (val > 1000) return 'WARNING';
    return 'DANGER';
  }
  if (key === 'ldr') {
    if (val < 800) return 'WARNING';
    return 'SAFE';
  }
  if (key === 'temperature') {
    if (val < 10) return 'WARNING';
    if (val <= 35) return 'SAFE';
    if (val <= 45) return 'WARNING';
    return 'DANGER';
  }
  if (key === 'humidity') {
    if (val < 30) return 'WARNING';
    if (val <= 70) return 'SAFE';
    if (val <= 85) return 'WARNING';
    return 'DANGER';
  }
  return 'SAFE';
}

function getLabel(key, val) {
  if (key === 'airQuality') {
    if (val < 1200) return 'GOOD'; if (val < 2000) return 'MODERATE'; return 'HAZARDOUS';
  }
  if (key === 'rainfall') {
    if (val > 3500) return 'DRY'; if (val > 2000) return 'LIGHT'; if (val > 1000) return 'MODERATE'; return 'HEAVY';
  }
  if (key === 'ldr') { return val < 800 ? 'DARK' : val <= 2000 ? 'NORMAL' : 'BRIGHT'; }
  if (key === 'temperature') {
    if (val < 10) return 'COLD'; if (val <= 35) return 'NORMAL'; if (val <= 45) return 'HOT'; return 'EXTREME';
  }
  if (key === 'humidity') {
    if (val < 30) return 'DRY'; if (val <= 70) return 'NORMAL'; if (val <= 85) return 'HUMID'; return 'EXTREME';
  }
  return 'OK';
}

function GaugeBar({ value, min, max, color }) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return (
    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mt-2">
      <div className="h-full rounded-full transition-all duration-700"
           style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function SensorCard({ sensorKey, value, label, timestamp, compact = false }) {
  const meta = SENSORS[sensorKey];
  if (!meta) return null;

  const status = label || getStatus(sensorKey, value);
  const statusLabel = getLabel(sensorKey, value);
  const sc = STATUS_COLORS[status] || STATUS_COLORS['SAFE'];
  const displayVal = typeof value === 'number' ? value.toFixed(1) : '—';

  if (compact) {
    return (
      <div className={`relative p-4 rounded-xl border ${sc.border} ${sc.bg} transition-all duration-500`}>
        <div className="flex items-start justify-between mb-1">
          <span className="text-xl">{meta.icon}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sc.bg} ${sc.text} border ${sc.border}`}>
            {statusLabel}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">{meta.label}</p>
        <p className="text-2xl font-bold font-mono mt-0.5" style={{ color: meta.color }}>
          {displayVal} <span className="text-xs font-normal text-slate-500">{meta.unit}</span>
        </p>
        <GaugeBar value={value ?? 0} min={meta.min} max={meta.max} color={meta.color} />
      </div>
    );
  }

  return (
    <div className={`relative p-5 rounded-2xl border ${sc.border} transition-all duration-500 overflow-hidden`}
         style={{ background: 'rgba(15,23,42,0.7)' }}>
      {/* Glow */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 blur-2xl"
           style={{ background: meta.color }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{meta.icon}</span>
            <div>
              <p className="text-sm font-semibold text-white">{meta.label}</p>
              <p className="text-xs text-slate-500">{meta.description}</p>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
            {statusLabel}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-4xl font-bold font-mono tabular-nums" style={{ color: meta.color }}>
            {displayVal}
            <span className="text-lg font-normal text-slate-500 ml-1">{meta.unit}</span>
          </p>
        </div>

        <GaugeBar value={value ?? 0} min={meta.min} max={meta.max} color={meta.color} />

        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-slate-600">{meta.min}{meta.unit}</span>
          <span className="text-xs text-slate-500">
            {timestamp ? new Date(timestamp).toLocaleTimeString() : '—'}
          </span>
          <span className="text-xs text-slate-600">{meta.max}{meta.unit}</span>
        </div>
      </div>
    </div>
  );
}
