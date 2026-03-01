import mongoose from "mongoose";

const sensorSchema = new mongoose.Schema({
  // ── Raw sensor readings ─────────────────────────────────────────
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  airQuality: { type: Number, required: true },  // raw ADC value
  rainfall: { type: Number, required: true },  // raw ADC (lower = more rain)
  ldr: { type: Number, required: true },  // raw ADC (lower = darker)

  // ── Backend-computed status for each sensor ─────────────────────
  // Values: "SAFE" | "WARNING" | "DANGER" | "ERROR"
  status: {
    temperature: { type: String, default: "SAFE" },
    humidity: { type: String, default: "SAFE" },
    airQuality: { type: String, default: "SAFE" },
    rainfall: { type: String, default: "SAFE" },
    ldr: { type: String, default: "SAFE" },
    overall: { type: String, default: "SAFE" },
  },

  // ── Human-readable labels ────────────────────────────────────────
  labels: {
    temperature: { type: String, default: "" },
    humidity: { type: String, default: "" },
    airQuality: { type: String, default: "" },
    rainfall: { type: String, default: "" },
    ldr: { type: String, default: "" },
  },

  timestamp: { type: Date, default: Date.now },
});

const Sensor = mongoose.model("Sensor", sensorSchema);
export default Sensor;