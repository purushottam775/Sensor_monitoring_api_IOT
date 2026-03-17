import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine, Area, AreaChart
} from 'recharts';
import { SENSORS } from '../config';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 p-3 text-xs"
         style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)' }}>
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono font-semibold">
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value} {p.unit}
        </p>
      ))}
    </div>
  );
};

export default function SensorChart({ sensorKey, history, height = 220, showPredictions = [], type = 'area' }) {
  const meta = SENSORS[sensorKey];
  if (!meta || !history?.length) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
        No data yet — waiting for sensor readings…
      </div>
    );
  }

  // Build chart data
  const data = history.map((r, i) => ({
    time: r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : `t${i}`,
    value: typeof r[sensorKey] === 'number' ? parseFloat(r[sensorKey].toFixed(2)) : null,
  })).filter(d => d.value !== null);

  // Append ML predictions as future points
  const predData = showPredictions.map(p => ({
    time: p.horizon_label || (p.horizon_seconds ? `+${p.horizon_seconds}s` : 'Future'),
    value: null,
    predicted: typeof p[sensorKey] === 'number' ? parseFloat(p[sensorKey].toFixed(2)) : null,
  }));

  const chartData = [...data, ...predData];

  const Chart = type === 'line' ? LineChart : AreaChart;
  const DataLine = type === 'line' ? Line : Area;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${sensorKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={meta.color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={meta.color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false}
               interval="preserveStartEnd" />
        <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false}
               domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip />} />

        {/* Actual readings */}
        <DataLine type="monotone" dataKey="value" name={meta.label}
          unit={` ${meta.unit}`}
          stroke={meta.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }}
          fill={type === 'area' ? `url(#grad-${sensorKey})` : undefined}
          connectNulls={false}
        />

        {/* Predicted values */}
        {predData.length > 0 && (
          <Line type="monotone" dataKey="predicted" name="Predicted"
            unit={` ${meta.unit}`}
            stroke={meta.color} strokeWidth={1.5} strokeDasharray="4 4"
            dot={{ fill: meta.color, r: 3 }} activeDot={{ r: 5 }}
          />
        )}
      </Chart>
    </ResponsiveContainer>
  );
}
