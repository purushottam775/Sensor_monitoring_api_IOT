// SensorCard - displays a single sensor reading with animated ring gauge
const SensorCard = ({
  label,
  value,
  unit,
  icon,
  color,        // tailwind color key e.g. "cyan", "emerald", "yellow", "blue", "orange"
  min = 0,
  max = 100,
  status = 'normal', // "normal" | "warning" | "danger"
  description,
}) => {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const circumference = 2 * Math.PI * 36; // r=36
  const strokeDash = (pct / 100) * circumference;

  const colorMap = {
    cyan:    { ring: '#06b6d4', bg: 'from-cyan-500/10 to-cyan-600/5',    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
    emerald: { ring: '#10b981', bg: 'from-emerald-500/10 to-emerald-600/5', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    yellow:  { ring: '#f59e0b', bg: 'from-yellow-500/10 to-yellow-600/5',  badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
    blue:    { ring: '#3b82f6', bg: 'from-blue-500/10 to-blue-600/5',     badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    orange:  { ring: '#f97316', bg: 'from-orange-500/10 to-orange-600/5', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
    purple:  { ring: '#a855f7', bg: 'from-purple-500/10 to-purple-600/5', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  };

  const statusColors = {
    normal:  { ring: colorMap[color]?.ring || '#06b6d4', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    warning: { ring: '#f59e0b', text: 'text-yellow-400', dot: 'bg-yellow-400 animate-pulse' },
    danger:  { ring: '#ef4444', text: 'text-red-400',    dot: 'bg-red-400 animate-pulse' },
  };

  const sc = statusColors[status] || statusColors.normal;
  const cc = colorMap[color] || colorMap.cyan;

  return (
    <div className={`relative rounded-2xl bg-gradient-to-br ${cc.bg} border border-white/8
      backdrop-blur-sm p-5 hover:border-white/15 hover:shadow-lg transition-all duration-300 group overflow-hidden`}>

      {/* Subtle background glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `radial-gradient(circle at 50% 0%, ${sc.ring}10, transparent 70%)` }} />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
          </div>
          {description && <p className="text-xs text-gray-600 mt-0.5">{description}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>

      {/* Ring Gauge + Value */}
      <div className="flex items-center justify-between relative">
        <div>
          <div className="text-3xl font-bold text-white tabular-nums">
            {value !== null && value !== undefined ? value : '--'}
            <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
          </div>
          <div className={`mt-1 text-xs font-semibold capitalize ${sc.text}`}>
            {status === 'normal' ? '✓ Normal' : status === 'warning' ? '⚠ Warning' : '✗ Critical'}
          </div>
        </div>

        {/* SVG Ring */}
        <div className="w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
            {/* Track */}
            <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
            {/* Progress */}
            <circle
              cx="44" cy="44" r="36" fill="none"
              stroke={sc.ring} strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              style={{ filter: `drop-shadow(0 0 4px ${sc.ring}99)`, transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-end">
            <div className="w-20 h-20 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-400 mt-0">{Math.round(pct)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini progress bar */}
      <div className="mt-4 h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${sc.ring}88, ${sc.ring})` }}
        />
      </div>
    </div>
  );
};

export default SensorCard;
