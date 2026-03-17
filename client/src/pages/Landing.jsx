import { Link } from 'react-router-dom';
import { SENSORS } from '../config';

const FEATURES = [
  { icon: '⚡', title: 'Real-Time Data', desc: 'WebSocket-powered live sensor streaming via Socket.io from Node.js backend.' },
  { icon: '🔮', title: 'ML Predictions', desc: 'RandomForest multi-horizon forecast (+30s, +1min, +2min, +5min, +10min).' },
  { icon: '🧠', title: 'LSTM Neural Net', desc: 'TF.js LSTM model running inside Node.js for instant next-step predictions.' },
  { icon: '📊', title: 'Visualizations', desc: 'Recharts time-series with forecast overlays, trend arrows, and status badges.' },
  { icon: '🚨', title: 'Anomaly Alerts', desc: 'Automatic DANGER / WARNING / SAFE classification for every sensor reading.' },
  { icon: '🌐', title: 'MongoDB Storage', desc: 'All sensor data persisted in MongoDB with status labels and timestamps.' },
];

const STACK = [
  { src: 'https://cdn.simpleicons.org/nodedotjs/5FA04E', label: 'Node.js' },
  { src: 'https://cdn.simpleicons.org/react/61DAFB', label: 'React' },
  { src: 'https://cdn.simpleicons.org/python/3776AB', label: 'Python' },
  { src: 'https://cdn.simpleicons.org/mongodb/47A248', label: 'MongoDB' },
  { src: 'https://cdn.simpleicons.org/tailwindcss/06B6D4', label: 'Tailwind' },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-4 pt-28 pb-20 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl animate-pulse"
               style={{ background: 'radial-gradient(circle, #38bdf8, #6366f1)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl animate-pulse"
               style={{ background: 'radial-gradient(circle, #a78bfa, #ec4899)', animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            ESP32 · Node.js · Python ML · MongoDB
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight mb-4"
              style={{ fontFamily: 'Outfit, sans-serif' }}>
            Enviro<span style={{ color: '#38bdf8' }}>Sense</span>
            <br />
            <span className="text-2xl sm:text-3xl font-normal text-slate-400">IoT Environmental Monitor</span>
          </h1>

          <p className="text-slate-400 text-lg mt-4 mb-8 leading-relaxed max-w-2xl mx-auto">
            Real-time monitoring of <strong className="text-white">5 environmental sensors</strong> with
            WebSocket live updates, ML-powered multi-horizon forecasts, and intelligent anomaly detection.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard"
                  className="px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:scale-105 hover:brightness-110 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #38bdf8, #6366f1)' }}>
              Open Dashboard →
            </Link>
            <a href="http://localhost:5000/api/sensor" target="_blank" rel="noreferrer"
               className="px-8 py-3 rounded-xl font-semibold border border-white/15 text-slate-300 hover:bg-white/5 hover:text-white transition-all duration-200">
              View API
            </a>
          </div>
        </div>
      </section>

      {/* Sensor pills */}
      <section className="py-10 border-y border-white/5" style={{ background: 'rgba(12,18,36,0.6)' }}>
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-xs text-slate-600 uppercase tracking-widest mb-6">Monitored Sensors</p>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.values(SENSORS).map(s => (
              <div key={s.label} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/8 bg-white/3">
                <span>{s.icon}</span>
                <span className="text-sm font-medium text-slate-300">{s.label}</span>
                <span className="text-xs text-slate-600">{s.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-white text-center mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Everything You Need
        </h2>
        <p className="text-slate-500 text-center mb-10">Built for IoT developers and environmental engineers</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title}
                 className="p-5 rounded-2xl border border-white/8 hover:border-blue-500/30 transition-all duration-300 hover:bg-blue-500/3"
                 style={{ background: 'rgba(15,23,42,0.6)' }}>
              <span className="text-2xl">{f.icon}</span>
              <h3 className="text-white font-semibold mt-3 mb-1">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="py-10 border-t border-white/5" style={{ background: 'rgba(12,18,36,0.4)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-6">Tech Stack</p>
          <div className="flex flex-wrap justify-center gap-6">
            {STACK.map(({ src, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <img src={src} alt={label} className="w-8 h-8 opacity-70 hover:opacity-100 transition-opacity" />
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-4">
        <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Ready to monitor your environment?
        </h2>
        <p className="text-slate-500 mb-8">Start the backend and connect your ESP32 to begin live monitoring.</p>
        <Link to="/dashboard"
              className="inline-block px-10 py-3.5 rounded-xl font-semibold text-white hover:scale-105 transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #38bdf8, #6366f1)' }}>
          Launch Dashboard →
        </Link>
      </section>
    </div>
  );
}
