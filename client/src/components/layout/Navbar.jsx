import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Wifi, WifiOff, Menu, X, Activity, Home, BarChart2,
  Bell, Settings, ChevronDown
} from 'lucide-react';

const Navbar = ({ isLive, latest }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-cyan-500/20 shadow-lg shadow-cyan-500/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-all">
              <Activity className="w-5 h-5 text-white" />
              {isLive && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-gray-950 animate-pulse" />
              )}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-white tracking-wide">IoT Sense Pro</div>
              <div className="text-xs text-cyan-400 tracking-wider">Environmental Monitor</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${location.pathname === to
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Live Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
              ${isLive
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
              {isLive ? (
                <><Wifi className="w-3 h-3" /><span className="hidden sm:inline">LIVE</span></>
              ) : (
                <><WifiOff className="w-3 h-3" /><span className="hidden sm:inline">DEMO</span></>
              )}
            </div>

            {/* Temp Quick View */}
            {latest && (
              <div className="hidden lg:flex items-center gap-1.5 bg-gray-800/60 border border-gray-700/50 px-3 py-1.5 rounded-lg">
                <span className="text-yellow-400 text-sm">🌡</span>
                <span className="text-white text-sm font-bold">{latest.temperature}°C</span>
              </div>
            )}

            {/* Notification bell */}
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <Bell className="w-5 h-5" />
              {isLive && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full" />}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-950/95 border-t border-gray-800/50 px-4 py-3 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                ${location.pathname === to
                  ? 'bg-cyan-500/15 text-cyan-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
