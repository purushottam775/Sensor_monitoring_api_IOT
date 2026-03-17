import { SENSORS, STATUS_COLORS } from '../config';

const SENSOR_KEYS = Object.keys(SENSORS);

function HorizonRow({ horizon }) {
  const time = horizon.horizon_label;
  return (
    <div className="flex items-center gap-2 py-2 border-b border-white/5 last:border-0">
      <div className="w-14 shrink-0">
        <span className="text-xs font-mono font-bold text-blue-400">{time}</span>
      </div>
      <div className="flex-1 grid grid-cols-5 gap-2">
        {SENSOR_KEYS.map(key => {
          const meta = SENSORS[key];
          const val = horizon[key];
          const st = (horizon.status?.[key] || 'safe').toUpperCase();
          const sc = STATUS_COLORS[st] || STATUS_COLORS['SAFE'];
          return (
            <div key={key} className="text-center">
              <p className={`text-xs font-mono font-semibold ${sc.text}`}>
                {typeof val === 'number' ? val.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-slate-600">{meta.unit}</p>
            </div>
          );
        })}
      </div>
      <div className="shrink-0">
        {horizon.anomaly
          ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">⚠ Alert</span>
          : <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">OK</span>}
      </div>
    </div>
  );
}

export default function PredictionPanel({ mlPrediction, mlLoading, mlError, modelType }) {
  if (mlLoading) {
    return (
      <div className="p-5 rounded-2xl border border-white/10"
           style={{ background: 'rgba(15,23,42,0.7)' }}>
        <div className="flex items-center gap-3 text-blue-400">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Fetching ML predictions…</p>
        </div>
      </div>
    );
  }

  if (mlError) {
    return (
      <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5">
        <p className="text-amber-400 text-sm font-medium mb-1">⚠ {modelType?.toUpperCase()} ML backend unavailable</p>
        <p className="text-slate-500 text-xs">{mlError}</p>
        <p className="text-slate-600 text-xs mt-2">Check if port {modelType === 'advanced' ? '5002' : '5001'} is running.</p>
      </div>
    );
  }

  if (!mlPrediction?.horizons) {
    return (
      <div className="p-5 rounded-2xl border border-white/10 text-slate-600 text-sm"
           style={{ background: 'rgba(15,23,42,0.7)' }}>
        No ML predictions yet — send sensor data to the backend first.
      </div>
    );
  }

  const { horizons, sensor_interval_seconds } = mlPrediction;
  const hasAlerts = horizons.some(h => h.anomaly);

  return (
    <div className="p-5 rounded-2xl border border-purple-500/20"
         style={{ background: 'rgba(15,23,42,0.8)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔮</span>
          <div>
            <h3 className="text-white font-semibold text-sm">ML Multi-Horizon Forecast</h3>
            <p className="text-slate-500 text-xs">Python {modelType === 'advanced' ? 'XGBoost' : 'RandomForest' } · interval: {sensor_interval_seconds}s</p>
          </div>
        </div>
        {hasAlerts && (
          <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
            ⚠ Anomaly Detected
          </span>
        )}
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-2 pb-2 border-b border-white/10 mb-1">
        <div className="w-14 shrink-0">
          <span className="text-xs text-slate-600 uppercase tracking-wider">Time</span>
        </div>
        <div className="flex-1 grid grid-cols-5 gap-2">
          {SENSOR_KEYS.map(key => (
            <div key={key} className="text-center">
              <p className="text-xs text-slate-500">{SENSORS[key].icon}</p>
              <p className="text-xs text-slate-600">{SENSORS[key].label.split(' ')[0]}</p>
            </div>
          ))}
        </div>
        <div className="shrink-0 w-16" />
      </div>

      {/* Horizon rows */}
      <div>
        {horizons.map((h, i) => <HorizonRow key={i} horizon={h} />)}
      </div>

      {/* AQI info */}
      {horizons[0]?.aqi_category && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-xs text-slate-600">AQI Forecast:</p>
          <div className="flex gap-2 mt-1 flex-wrap">
            {horizons.map((h, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                {h.horizon_label}: {h.aqi_category}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
