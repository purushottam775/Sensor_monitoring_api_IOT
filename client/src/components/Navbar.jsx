import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
];

export default function Navbar({ connected }) {
  const { pathname } = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/10"
         style={{ background: 'rgba(10,15,30,0.85)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                 style={{ background: 'linear-gradient(135deg,#38bdf8,#6366f1)' }}>
              🌿
            </div>
            <span className="font-bold text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <span className="text-white">Enviro</span>
              <span style={{ color: '#38bdf8' }}>Sense</span>
            </span>
          </Link>

          {/* Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${pathname === to
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                {label}
              </Link>
            ))}
          </div>

          {/* Status pill */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium
            ${connected
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/40 bg-red-500/10 text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            {connected ? 'Live' : 'Offline'}
          </div>
        </div>
      </div>
    </nav>
  );
}
