import Sensor from "../models/Sensor.js";
import { io } from "../server.js";
import predictor from "../ml/index.js";
import {
  getTempStatus,
  getHumidityStatus,
  getAirStatus,
  getRainStatus,
  getLdrStatus,
  getOverallStatus
} from "../config/thresholds.js";

// ══════════════════════════════════════════════════════════════════
//  CONTROLLERS
// ══════════════════════════════════════════════════════════════════

// 🔥 POST — NodeMCU sends data → compute status → save → broadcast
export const createSensorData = async (req, res) => {
  try {
    const { temperature, humidity, airQuality, rainfall, ldr } = req.body;

    // Compute status for each sensor using unified logic
    const tempResult = getTempStatus(temperature);
    const humResult = getHumidityStatus(humidity);
    const airResult = getAirStatus(airQuality);
    const rainResult = getRainStatus(rainfall);
    const ldrResult = getLdrStatus(ldr);

    const statusMap = {
      temperature: tempResult.status,
      humidity: humResult.status,
      airQuality: airResult.status,
      rainfall: rainResult.status,
      ldr: ldrResult.status,
    };

    const overall = getOverallStatus(statusMap);

    // Save to MongoDB with computed status + labels
    const newData = await Sensor.create({
      temperature, humidity, airQuality, rainfall, ldr,
      status: { ...statusMap, overall },
      labels: {
        temperature: tempResult.label,
        humidity: humResult.label,
        airQuality: airResult.label,
        rainfall: rainResult.label,
        ldr: ldrResult.label,
      },
    });

    // Broadcast to all dashboard clients instantly
    io.emit("sensor:new", { success: true, data: newData });

    // Run AI prediction (non-blocking)
    predictor.addReading(newData).then((prediction) => {
      if (prediction) {
        io.emit("sensor:prediction", prediction);
      }
    }).catch(err => console.error("[ML] Prediction failed:", err.message));

    res.status(201).json({
      success: true,
      message: "Sensor data stored & broadcast",
      data: newData,
    });
  } catch (error) {
    console.error("Error storing sensor data:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 🔥 GET — All sensor data (latest 500)
export const getAllSensorData = async (req, res) => {
  try {
    const data = await Sensor.find().sort({ timestamp: -1 }).limit(500);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 🔥 GET — Latest single reading
export const getLatestSensorData = async (req, res) => {
  try {
    const data = await Sensor.findOne().sort({ timestamp: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching latest sensor data:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 🔥 GET — Current AI prediction
export const getPrediction = async (req, res) => {
  try {
    const prediction = predictor.getLastPrediction();
    if (!prediction) {
      return res.status(200).json({
        success: false,
        message: predictor.isReady()
          ? "No prediction yet — send sensor data first"
          : "Model is still training",
        modelReady: predictor.isReady(),
      });
    }
    res.status(200).json({ success: true, data: prediction });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};