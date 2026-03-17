export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-auto"
            style={{ background: 'rgba(10,15,30,0.9)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
                   style={{ background: 'linear-gradient(135deg,#38bdf8,#6366f1)' }}>
                🌿
              </div>
              <span className="font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <span className="text-white">Enviro</span>
                <span style={{ color: '#38bdf8' }}>Sense</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Real-time IoT environmental monitoring powered by ESP32 sensors,
              Node.js backend, and Python ML predictions.
            </p>
          </div>

          {/* Sensors */}
          <div>
            <h4 className="text-slate-300 font-semibold mb-3 text-sm uppercase tracking-wider">Sensors</h4>
            <ul className="space-y-1.5 text-slate-500 text-sm">
              {['🌡️ Temperature (DHT22)', '💧 Humidity (DHT22)', '🌫️ Air Quality (MQ-135)', '🌧️ Rainfall Sensor', '☀️ Light Level (LDR)'].map(s => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>

          {/* API Endpoints */}
          <div>
            <h4 className="text-slate-300 font-semibold mb-3 text-sm uppercase tracking-wider">API Endpoints</h4>
            <ul className="space-y-1.5 text-xs font-mono">
              {[
                ['GET', '/api/sensor', 'All readings'],
                ['GET', '/api/sensor/latest', 'Latest reading'],
                ['POST', ':5001/predict', 'ML multi-horizon'],
              ].map(([method, path, desc]) => (
                <li key={path} className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold
                    ${method === 'GET' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-amber-900/50 text-amber-400'}`}>
                    {method}
                  </span>
                  <span className="text-slate-400">{path}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-600 text-sm">© 2026 EnviroSense IoT Dashboard</p>
          <p className="text-slate-600 text-xs">Node.js :5000 · Python ML :5001 · WebSocket · MongoDB</p>
        </div>
      </div>
    </footer>
  );
}
