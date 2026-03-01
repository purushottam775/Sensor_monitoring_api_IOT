import { Lightbulb, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

// Derives AI-like recommendations from current sensor values
const getRecommendations = (latest) => {
  if (!latest) return [];
  const recs = [];
  const { temperature, humidity, airQuality, rainfall, ldr } = latest;

  // Temperature
  if (temperature > 35)
    recs.push({ type: 'danger',  icon: '🌡', message: `Temperature is critically high at ${temperature}°C. Check cooling systems or ventilation immediately.` });
  else if (temperature > 30)
    recs.push({ type: 'warning', icon: '🌡', message: `Temperature is elevated (${temperature}°C). Consider improving air circulation.` });
  else if (temperature < 15)
    recs.push({ type: 'warning', icon: '❄', message: `Temperature is low (${temperature}°C). Risk of condensation on electronics.` });
  else
    recs.push({ type: 'normal',  icon: '✅', message: `Temperature is comfortable at ${temperature}°C. No action needed.` });

  // Humidity
  if (humidity > 80)
    recs.push({ type: 'warning', icon: '💧', message: `High humidity (${humidity}%). Risk of mold and sensor corrosion.` });
  else if (humidity < 30)
    recs.push({ type: 'warning', icon: '🏜', message: `Low humidity (${humidity}%). May cause static discharge issues.` });
  else
    recs.push({ type: 'normal',  icon: '✅', message: `Humidity level is optimal (${humidity}%).` });

  // Air Quality (MQ135: lower is better)
  if (airQuality > 700)
    recs.push({ type: 'danger',  icon: '⚠', message: `Air quality is hazardous (AQI: ${airQuality}). Ventilate immediately!` });
  else if (airQuality > 400)
    recs.push({ type: 'warning', icon: '🌬', message: `Moderate air pollution detected (AQI: ${airQuality}). Open windows.` });
  else
    recs.push({ type: 'normal',  icon: '✅', message: `Air quality is clean (AQI: ${airQuality}).` });

  // Rainfall
  if (rainfall > 70)
    recs.push({ type: 'danger',  icon: '🌧', message: `Heavy rainfall detected (${rainfall}%). Protect outdoor equipment.` });
  else if (rainfall > 30)
    recs.push({ type: 'warning', icon: '🌦', message: `Moderate rainfall (${rainfall}%). Secure sensitive hardware.` });
  else
    recs.push({ type: 'normal',  icon: '☀', message: `No significant rainfall (${rainfall}%).` });

  // LDR (0 = dark, 1023 = bright)
  if (ldr < 100)
    recs.push({ type: 'normal',  icon: '🌙', message: `Low light conditions (LDR: ${ldr}). Night mode recommended.` });
  else if (ldr > 800)
    recs.push({ type: 'warning', icon: '☀', message: `Very bright light (LDR: ${ldr}). Check for direct sunlight on sensors.` });
  else
    recs.push({ type: 'normal',  icon: '✅', message: `Light levels are normal (LDR: ${ldr}).` });

  return recs;
};

const typeStyles = {
  normal:  { bg: 'bg-emerald-500/8 border-emerald-500/20', text: 'text-emerald-300', Icon: CheckCircle, iconColor: 'text-emerald-400' },
  warning: { bg: 'bg-yellow-500/8 border-yellow-500/20',   text: 'text-yellow-200',  Icon: AlertCircle,  iconColor: 'text-yellow-400' },
  danger:  { bg: 'bg-red-500/8 border-red-500/20',         text: 'text-red-200',     Icon: AlertCircle,  iconColor: 'text-red-400' },
};

const RecommendationBox = ({ latest }) => {
  const recs = getRecommendations(latest);

  return (
    <div className="rounded-2xl bg-gray-900/60 border border-white/8 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-semibold text-white">AI Recommendations</h3>
        <span className="ml-auto text-xs text-gray-600">Based on current readings</span>
      </div>
      <div className="space-y-2.5">
        {recs.length === 0 ? (
          <p className="text-xs text-gray-500">No data available yet.</p>
        ) : (
          recs.map((rec, i) => {
            const s = typeStyles[rec.type] || typeStyles.normal;
            const { Icon } = s;
            return (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${s.bg}`}>
                <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${s.iconColor}`} />
                <p className={`text-xs leading-relaxed ${s.text}`}>{rec.message}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecommendationBox;
