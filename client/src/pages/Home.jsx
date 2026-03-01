import { Link } from 'react-router-dom';
import { Activity, Thermometer, Droplets, Wind, CloudRain, Sun, ArrowRight, Zap, Shield, RefreshCw } from 'lucide-react';

const stats = [
  { label: 'Sensors', value: '5', icon: Activity, color: 'cyan' },
  { label: 'Uptime', value: '99.9%', icon: Shield, color: 'emerald' },
  { label: 'Poll Rate', value: '5s', icon: RefreshCw, color: 'blue' },
  { label: 'Platform', value: 'NodeMCU', icon: Zap, color: 'yellow' },
];

const sensors = [
  { icon: Thermometer, label: 'Temperature', desc: 'DHT11 — real-time °C', color: '#f97316' },
  { icon: Droplets,    label: 'Humidity',    desc: 'DHT11 — relative %',    color: '#3b82f6' },
  { icon: Wind,        label: 'Air Quality', desc: 'MQ135 — gas index',      color: '#a855f7' },
  { icon: CloudRain,   label: 'Rainfall',    desc: 'Raindrop sensor %',      color: '#06b6d4' },
  { icon: Sun,         label: 'Light (LDR)', desc: 'Ambient light 0-1023',   color: '#f59e0b' },
];

const colorMap = {
  cyan: 'from-cyan-500 to-cyan-600', emerald: 'from-emerald-500 to-emerald-600',
  blue: 'from-blue-500 to-blue-600', yellow: 'from-yellow-500 to-yellow-600',
};

const Home = () => {
  return (
    <div className="min-h-screen">

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-cyan-500/8 blur-3xl animate-pulse" />
        <div className="absolute top-40 right-1/4 w-72 h-72 rounded-full bg-blue-500/8 blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute bottom-10 left-1/2 w-80 h-80 rounded-full bg-purple-500/6 blur-3xl animate-pulse [animation-delay:2s]" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-semibold mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            NodeMCU ESP8266 · Real-time IoT Monitoring
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
            Intelligent{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              IoT Environmental
            </span>
            <br />Sensing Dashboard
          </h1>

          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Real-time monitoring of temperature, humidity, air quality, rainfall, and light intensity
            using NodeMCU with predictive analytics and smart alerts.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600
                text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40
                hover:scale-105 transition-all duration-200"
            >
              Open Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="http://localhost:5000/api/sensor"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-gray-700/80
                text-gray-300 font-semibold text-sm hover:border-gray-500 hover:text-white transition-all"
            >
              <Activity className="w-4 h-4 text-cyan-400" /> View API
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats Row ──────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl bg-gray-900/60 border border-white/8 p-5 text-center hover:border-white/15 transition-all group">
              <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${colorMap[color]} shadow-lg mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-2xl font-extrabold text-white">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sensor Grid ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <h2 className="text-xl font-bold text-white mb-2 text-center">Integrated Sensors</h2>
        <p className="text-sm text-gray-500 text-center mb-8">All data transmitted wirelessly via NodeMCU to MongoDB</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="rounded-2xl bg-gray-900/60 border border-white/8 p-5 flex items-start gap-4 hover:border-white/15 hover:bg-gray-800/40 transition-all group">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
          {/* 6th card - system */}
          <div className="rounded-2xl bg-gradient-to-br from-cyan-500/8 to-blue-600/8 border border-cyan-500/20 p-5 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">System Health</div>
              <div className="text-xs text-gray-500 mt-0.5">Real-time uptime · alerts · voice</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 py-8 pb-20">
        <div className="rounded-2xl bg-gradient-to-br from-cyan-500/12 to-blue-600/12 border border-cyan-500/20 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5" />
          <h2 className="text-xl font-bold text-white mb-2 relative">Ready to monitor your environment?</h2>
          <p className="text-sm text-gray-400 mb-6 relative">Connect your NodeMCU and start streaming sensor data in real time.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600
              text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all relative"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
