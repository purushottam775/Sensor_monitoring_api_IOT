import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, AlertTriangle, Activity, Settings2 } from 'lucide-react';
import { speak, playAlarm } from '../../utils/voiceUtils';

const COOLDOWN_MS = 3000; // 3-second cooldown to prevent spam

export const AlertManager = ({ latest }) => {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechRate, setSpeechRate] = useState(0.95);
  const [showSettings, setShowSettings] = useState(false);
  const [alertHistory, setAlertHistory] = useState([]);
  
  const lastSpokeAt = useRef(0);
  
  // Store previous labels to detect transitions
  const prevLabels = useRef({
    airQuality: null,
    rainfall: null,
    temperature: null,
    humidity: null,
  });

  const addLog = (msg, type = 'info') => {
    setAlertHistory(prev => [{ time: new Date(), msg, type }, ...prev].slice(0, 10)); // Keep last 10
  };

  useEffect(() => {
    if (!latest || !latest.labels) return;
    
    // Compare labels
    const curr = latest.labels;
    const prev = prevLabels.current;
    
    let messagesToSpeak = [];
    let shouldAlarm = false;

    // --- AIR QUALITY ---
    if (curr.airQuality !== prev.airQuality && curr.airQuality) {
      if (curr.airQuality === 'MODERATE') {
        messagesToSpeak.push("Air quality is moderate. Consider ventilation.");
      } else if (curr.airQuality === 'POOR') {
        messagesToSpeak.push("Air quality is poor. Please open windows.");
      } else if (curr.airQuality === 'HAZARDOUS') {
        messagesToSpeak.push("Warning. Air quality is dangerous. Immediate ventilation required.");
        shouldAlarm = true;
      }
    }

    // --- RAINFALL ---
    if (curr.rainfall !== prev.rainfall && curr.rainfall) {
      if (curr.rainfall === 'LIGHT RAIN') {
        messagesToSpeak.push("Light rain has started.");
      } else if (curr.rainfall === 'MODERATE RAIN') {
        messagesToSpeak.push("Moderate rainfall detected.");
      } else if (curr.rainfall === 'HEAVY RAIN') {
        messagesToSpeak.push("Heavy rainfall detected. Please take precautions.");
        shouldAlarm = true;
      }
    }

    // --- TEMPERATURE ---
    if (curr.temperature !== prev.temperature && curr.temperature) {
      if (curr.temperature === 'COLD') {
        messagesToSpeak.push("Temperature is very low.");
      } else if (curr.temperature === 'HOT') {
        messagesToSpeak.push("Temperature is high.");
      } else if (curr.temperature === 'EXTREME') {
        messagesToSpeak.push("Temperature is extremely high. Please take precautions.");
        shouldAlarm = true;
      }
    }

    // --- HUMIDITY ---
    if (curr.humidity !== prev.humidity && curr.humidity) {
      if (curr.humidity === 'DRY') {
        messagesToSpeak.push("Humidity level is very low.");
      } else if (curr.humidity === 'HUMID') {
        messagesToSpeak.push("Humidity level is high.");
      } else if (curr.humidity === 'EXTREME') {
        messagesToSpeak.push("Humidity level is critically high.");
        shouldAlarm = true; // Alarm for critical humidity
      }
    }

    // Update refs to current state
    prevLabels.current = {
      airQuality: curr.airQuality,
      rainfall: curr.rainfall,
      temperature: curr.temperature,
      humidity: curr.humidity,
    };

    if (messagesToSpeak.length > 0) {
      const finalMessage = messagesToSpeak.join(" ");
      
      // Cooldown check (bypass cooldown for DANGER/Alarm to ensure immediate response)
      const now = Date.now();
      if (!shouldAlarm && now - lastSpokeAt.current < COOLDOWN_MS) {
         // Skip to prevent spam
      } else {
        if (voiceEnabled) {
          if (shouldAlarm) playAlarm();
          speak(finalMessage, { rate: speechRate });
        }
        lastSpokeAt.current = now;
        addLog(finalMessage, shouldAlarm ? 'danger' : 'warning');
      }
    }

  }, [latest, voiceEnabled, speechRate]);

  // Determine overall UX state from the backend's exact status
  const isDanger = latest?.status?.overall === 'DANGER' || latest?.status?.overall === 'ERROR';
  const isWarning = latest?.status?.overall === 'WARNING';
  
  const uiTheme = isDanger 
    ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] bg-gradient-to-r from-red-500/10 to-transparent" 
    : isWarning
    ? "border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.1)] bg-gradient-to-r from-yellow-500/10 to-transparent"
    : "border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-transparent";

  return (
    <div className={`p-4 rounded-xl border transition-all duration-500 ${uiTheme}`}>
      <div className="flex items-center justify-between">
        
        {/* Header Title */}
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isDanger ? 'bg-red-500/20 text-red-500 animate-pulse' : 
            isWarning ? 'bg-yellow-500/20 text-yellow-500' : 
            'bg-emerald-500/20 text-emerald-500'
          }`}>
            {isDanger ? <AlertTriangle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Voice Assistant</h3>
            <p className="text-xs text-gray-500 tracking-wide">
              {isDanger ? 'Critical alert active' : isWarning ? 'Monitoring elevated risk' : 'Environment stable'}
            </p>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
            title="Speech Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              if (!voiceEnabled) speak("Voice alerts enabled.", { rate: speechRate });
              else window.speechSynthesis.cancel();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              voiceEnabled 
                ? 'bg-purple-500/15 border-purple-500/30 text-purple-400 hover:bg-purple-500/25' 
                : 'bg-gray-800 border-gray-700 text-gray-500 hover:bg-gray-700'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {voiceEnabled ? 'Voice On' : 'Voice Off'}
          </button>
        </div>
      </div>

      {/* Optional Settings Panel */}
      {showSettings && (
        <div className="mt-4 p-3 rounded-lg bg-black/40 border border-white/5 flex items-center gap-3">
          <span className="text-xs text-gray-400">Speech Rate</span>
          <input 
            type="range" 
            min="0.5" max="2" step="0.1" 
            value={speechRate} 
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-400 font-mono w-6">{speechRate}x</span>
        </div>
      )}

      {/* Visual Alert Log */}
      <div className="mt-4 space-y-1.5 max-h-[100px] overflow-y-auto pr-1 custom-scrollbar">
        {alertHistory.length === 0 ? (
          <div className="text-xs text-center py-2 text-gray-600 italic border border-dashed border-gray-700/50 rounded-lg">
            No alerts logged since session started.
          </div>
        ) : (
          alertHistory.map((log, i) => (
            <div key={i} className={`flex gap-3 text-xs px-2.5 py-1.5 rounded border ${
              log.type === 'danger' 
                ? 'bg-red-500/10 border-red-500/20 text-red-300' 
                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
            }`}>
              <span className="opacity-50 shrink-0 font-mono">[{log.time.toLocaleTimeString()}]</span>
              <span className="font-medium">{log.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertManager;
