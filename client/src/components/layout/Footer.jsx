import { Activity, Github, Twitter, Mail, Heart, Cpu, Zap } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-950 border-t border-gray-800/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">IoT Sense Pro</div>
                <div className="text-xs text-cyan-400">Environmental Monitor</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
              Intelligent IoT-based environmental sensing and predictive analytics system powered by NodeMCU with real-time web dashboard.
            </p>
          </div>

          {/* Sensors */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Monitored Sensors</h4>
            <ul className="space-y-2">
              {['🌡 Temperature (DHT11)', '💧 Humidity (DHT11)', '🌬 Air Quality (MQ135)', '🌧 Rainfall Sensor', '☀ Light Intensity (LDR)'].map(s => (
                <li key={s} className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-cyan-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Tech Stack</h4>
            <div className="flex flex-wrap gap-2">
              {['NodeMCU', 'Node.js', 'MongoDB', 'React', 'Vite', 'Recharts', 'Tailwind CSS'].map(tech => (
                <span key={tech} className="px-2 py-1 text-xs rounded-md bg-gray-800/80 text-gray-400 border border-gray-700/50">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800/50 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500 fill-current" /> for IoT & Embedded Systems
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Cpu className="w-3 h-3 text-cyan-600" />
            <span>NodeMCU ESP8266</span>
            <span className="mx-2 text-gray-700">·</span>
            <Zap className="w-3 h-3 text-yellow-600" />
            <span>Real-time Data</span>
          </div>
          <p className="text-xs text-gray-700">© 2026 IoT Sense Pro</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
