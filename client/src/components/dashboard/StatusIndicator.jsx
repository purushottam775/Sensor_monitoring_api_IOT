// StatusIndicator - shows sensor health status with colored badge
const StatusIndicator = ({ status = 'normal', label, pulse = false }) => {
  const config = {
    normal:  { dot: 'bg-emerald-400', ring: 'ring-emerald-400/30', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25', label: 'Normal' },
    warning: { dot: 'bg-yellow-400',  ring: 'ring-yellow-400/30',  text: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/25',  label: 'Warning' },
    danger:  { dot: 'bg-red-400',     ring: 'ring-red-400/30',     text: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/25',         label: 'Danger' },
    offline: { dot: 'bg-gray-500',    ring: 'ring-gray-500/30',    text: 'text-gray-500',    bg: 'bg-gray-500/10 border-gray-500/25',        label: 'Offline' },
  };

  const c = config[status] || config.normal;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${pulse || status !== 'normal' ? 'animate-pulse' : ''} ring-2 ${c.ring}`} />
      {label || c.label}
    </span>
  );
};

export default StatusIndicator;
