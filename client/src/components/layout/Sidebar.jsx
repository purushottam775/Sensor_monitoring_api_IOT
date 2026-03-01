import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Thermometer, Droplets, Wind, CloudRain,
  Sun, BarChart2, Settings, ChevronLeft, ChevronRight,
  Activity, AlertTriangle, Info
} from 'lucide-react';

const navItems = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Temperature', to: '/dashboard?sensor=temperature', icon: Thermometer },
  { label: 'Humidity', to: '/dashboard?sensor=humidity', icon: Droplets },
  { label: 'Air Quality', to: '/dashboard?sensor=airquality', icon: Wind },
  { label: 'Rainfall', to: '/dashboard?sensor=rainfall', icon: CloudRain },
  { label: 'Light (LDR)', to: '/dashboard?sensor=ldr', icon: Sun },
  { label: 'Analytics', to: '/dashboard?view=analytics', icon: BarChart2 },
  { label: 'Alerts', to: '/dashboard?view=alerts', icon: AlertTriangle },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();

  return (
    <aside className={`fixed left-0 top-16 bottom-0 z-40 flex flex-col bg-gray-950/95 border-r border-cyan-500/15
      transition-all duration-300 ease-in-out
      ${collapsed ? 'w-16' : 'w-60'}`}>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-gray-800 border border-cyan-500/30
          flex items-center justify-center text-cyan-400 hover:bg-gray-700 hover:border-cyan-400 transition-all z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Device Status */}
      {!collapsed && (
        <div className="mx-3 mt-4 p-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">NodeMCU Device</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-gray-400">WebSocket Push</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map(({ label, to, icon: Icon }) => {
          const isActive = location.pathname + location.search === to || 
            (to === '/dashboard' && location.pathname === '/dashboard' && !location.search);
          return (
            <Link
              key={label}
              to={to}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                ${isActive
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 shadow-sm shadow-cyan-500/10'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
              {!collapsed && <span className="truncate">{label}</span>}
              {isActive && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg
                  opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg border border-gray-700">
                  {label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom - System Info */}
      <div className="p-3 border-t border-gray-800/50">
        {collapsed ? (
          <div className="flex justify-center">
            <Info className="w-4 h-4 text-gray-600" />
          </div>
        ) : (
          <div className="text-xs text-gray-600 space-y-0.5">
            <div className="text-gray-500 font-medium">IoT Sense Pro v1.0</div>
            <div>NodeMCU ESP8266 Based</div>
            <div>API: localhost:5000</div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
