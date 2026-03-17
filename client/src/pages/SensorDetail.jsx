import { useParams, Navigate } from 'react-router-dom';
import SensorCard from '../components/SensorCard';
import SensorChart from '../components/SensorChart';
import { SENSORS } from '../config';

export default function SensorDetail({ latest, history, mlPrediction }) {
  const { sensorKey } = useParams();
  const meta = SENSORS[sensorKey];

  if (!meta) return <Navigate to="/dashboard" replace />;

  const horizons = mlPrediction?.horizons || [];
  const value = latest?.[sensorKey];

  // Stats from history
  const vals = history.map(r => r[sensorKey]).filter(v => typeof v === 'number');
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  const min = vals.length ? Math.min(...vals) : null;
  const max = vals.length ? Math.max(...vals) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-4xl">{meta.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {meta.label}
          </h1>
          <p className="text-slate-500 text-sm">{meta.description}</p>
        </div>
      </div>

      {/* Main card + stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SensorCard
          sensorKey={sensorKey}
          value={value}
          label={latest?.status?.[sensorKey]}
          timestamp={latest?.timestamp}
        />

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Average', value: avg, suffix: meta.unit, color: meta.color },
            { label: 'Min', value: min, suffix: meta.unit, color: '#38bdf8' },
            { label: 'Max', value: max, suffix: meta.unit, color: '#f97316' },
          ].map(({ label, value: v, suffix, color }) => (
            <div key={label} className="p-4 rounded-2xl border border-white/8 flex flex-col justify-center"
                 style={{ background: 'rgba(15,23,42,0.7)' }}>
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className="text-xl font-mono font-bold" style={{ color }}>
                {typeof v === 'number' ? v.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-slate-600">{suffix}</p>
            </div>
          ))}

          <div className="col-span-3 p-4 rounded-2xl border border-white/8"
               style={{ background: 'rgba(15,23,42,0.7)' }}>
            <p className="text-xs text-slate-500 mb-1">Total readings</p>
            <p className="text-xl font-mono font-bold text-white">{history.length}</p>
            <p className="text-xs text-slate-600">in rolling buffer</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-5 rounded-2xl border border-white/8"
           style={{ background: 'rgba(15,23,42,0.7)' }}>
        <h3 className="text-sm font-semibold text-white mb-4">
          {meta.icon} {meta.label} History + Forecast
        </h3>
        <SensorChart
          sensorKey={sensorKey}
          history={history}
          height={280}
          showPredictions={horizons}
          type="area"
        />
      </div>

      {/* ML horizons for this sensor */}
      {horizons.length > 0 && (
        <div className="p-5 rounded-2xl border border-purple-500/20"
             style={{ background: 'rgba(15,23,42,0.8)' }}>
          <h3 className="text-sm font-semibold text-purple-300 mb-4">🔮 ML Forecast — {meta.label}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {horizons.map((h, i) => {
              const val = h[sensorKey];
              const st = (h.status?.[sensorKey] || 'safe').toUpperCase();
              const colorMap = { SAFE: '#10b981', WARNING: '#f59e0b', DANGER: '#ef4444' };
              const c = colorMap[st] || '#64748b';
              return (
                <div key={i} className="p-3 rounded-xl bg-white/3 border border-white/8 text-center">
                  <p className="text-xs text-blue-400 font-mono font-bold mb-2">{h.horizon_label}</p>
                  <p className="text-xl font-mono font-bold" style={{ color: meta.color }}>
                    {typeof val === 'number' ? val.toFixed(1) : '—'}
                  </p>
                  <p className="text-xs text-slate-600">{meta.unit}</p>
                  <p className="text-xs mt-1 font-semibold" style={{ color: c }}>{st}</p>
                  {h.anomaly && <p className="text-xs text-red-400 mt-1">⚠ Alert</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
