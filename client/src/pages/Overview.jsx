import SensorCard from '../components/SensorCard';
import SensorChart from '../components/SensorChart';
import PredictionPanel from '../components/PredictionPanel';
import { SENSORS } from '../config';

const SENSOR_KEYS = Object.keys(SENSORS);

export default function Overview({ 
  latest, history, mlPrediction, mlLoading, mlError, 
  modelType, setModelType 
}) {
  const horizons = mlPrediction?.horizons || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Environmental Overview
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time sensor readings · Last updated:{' '}
            {latest?.timestamp ? new Date(latest.timestamp).toLocaleTimeString() : '—'}
          </p>
        </div>

        {/* Model Selector */}
        <div className="flex items-center bg-slate-800/50 p-1 rounded-lg border border-white/5 self-start sm:self-center">
          <button
            onClick={() => setModelType('standard')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              modelType === 'standard' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-white'
            }`}
          >
            RF (Standard)
          </button>
          <button
            onClick={() => setModelType('advanced')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              modelType === 'advanced' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-white'
            }`}
          >
            XGBoost (Advanced)
          </button>
        </div>
      </div>

      {/* Overall status */}
      {latest?.status?.overall && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border
          ${latest.status.overall === 'SAFE' ? 'border-emerald-500/30 bg-emerald-500/5' :
            latest.status.overall === 'WARNING' ? 'border-amber-500/30 bg-amber-500/5' :
            'border-red-500/30 bg-red-500/5'}`}>
          <span className="text-2xl">
            {latest.status.overall === 'SAFE' ? '✅' : latest.status.overall === 'WARNING' ? '⚠️' : '🚨'}
          </span>
          <div>
            <p className="font-semibold text-white">Overall Status: {latest.status.overall}</p>
            <p className="text-xs text-slate-500">
              T: {latest.labels?.temperature} · H: {latest.labels?.humidity} ·
              AQ: {latest.labels?.airQuality} · R: {latest.labels?.rainfall} ·
              L: {latest.labels?.ldr}
            </p>
          </div>
        </div>
      )}

      {/* Sensor cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {SENSOR_KEYS.map(key => (
          <SensorCard
            key={key}
            sensorKey={key}
            value={latest?.[key]}
            label={latest?.status?.[key]}
            timestamp={latest?.timestamp}
            compact
          />
        ))}
      </div>

      {/* Charts: 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SENSOR_KEYS.map(key => {
          const meta = SENSORS[key];
          return (
            <div key={key} className="p-4 rounded-2xl border border-white/8"
                 style={{ background: 'rgba(15,23,42,0.7)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span>{meta.icon}</span>
                <h3 className="text-sm font-semibold text-white">{meta.label}</h3>
                <span className="text-xs text-slate-500 ml-auto">{meta.unit}</span>
              </div>
              <SensorChart
                sensorKey={key}
                history={history}
                height={160}
                showPredictions={horizons}
              />
            </div>
          );
        })}
      </div>

      {/* ML Prediction Panel */}
      <PredictionPanel
        mlPrediction={mlPrediction}
        mlLoading={mlLoading}
        mlError={mlError}
        modelType={modelType}
      />
    </div>
  );
}
