import { NavLink } from 'react-router-dom';
import { SENSORS } from '../config';

const sensorKeys = Object.keys(SENSORS);

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: '▦', exact: true },
  ...sensorKeys.map(key => ({
    to: `/dashboard/${key}`,
    label: SENSORS[key].label,
    icon: SENSORS[key].icon,
  })),
  { to: '/dashboard/predictions', label: 'Predictions', icon: '🔮' },
];

export default function Sidebar({ latest, connected }) {
  return (
    <aside className="w-60 shrink-0 flex flex-col border-r border-white/5 h-full overflow-y-auto"
           style={{ background: 'rgba(12,18,36,0.8)' }}>

      {/* Header */}
      <div className="px-4 py-5 border-b border-white/5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Navigation</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon, exact }) => (
          <NavLink key={to} to={to} end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
               ${isActive
                 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/25'
                 : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`
            }>
            <span className="text-base leading-none">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Live sensor mini-values */}
      {latest && (
        <div className="px-3 pb-4 border-t border-white/5 pt-3">
          <p className="text-xs text-slate-600 uppercase tracking-wider mb-2 px-1">Live</p>
          <div className="space-y-1">
            {sensorKeys.map(key => {
              const s = SENSORS[key];
              const val = latest[key];
              return (
                <div key={key} className="flex items-center justify-between px-2 py-1.5 rounded-md bg-white/3">
                  <span className="text-xs text-slate-500">{s.icon} {s.label}</span>
                  <span className="text-xs font-mono font-semibold" style={{ color: s.color }}>
                    {typeof val === 'number' ? val.toFixed(1) : '—'} <span className="text-slate-600">{s.unit}</span>
                  </span>
                </div>
              );
            })}
          </div>
          <div className={`mt-3 flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs
            ${connected ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            {connected ? 'Live stream active' : 'Disconnected'}
          </div>
        </div>
      )}
    </aside>
  );
}
