import Sensor from "../models/Sensor.js";
import { io } from "../server.js";
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

// POST — NodeMCU sends data → compute status → save → broadcast
export const createSensorData = async (req, res) => {
  try {
    const { temperature, humidity, airQuality, rainfall, ldr } = req.body;

    const tempResult = getTempStatus(temperature);
    const humResult  = getHumidityStatus(humidity);
    const airResult  = getAirStatus(airQuality);
    const rainResult = getRainStatus(rainfall);
    const ldrResult  = getLdrStatus(ldr);

    const statusMap = {
      temperature: tempResult.status,
      humidity:    humResult.status,
      airQuality:  airResult.status,
      rainfall:    rainResult.status,
      ldr:         ldrResult.status,
    };

    const overall = getOverallStatus(statusMap);

    const newData = await Sensor.create({
      temperature, humidity, airQuality, rainfall, ldr,
      status: { ...statusMap, overall },
      labels: {
        temperature: tempResult.label,
        humidity:    humResult.label,
        airQuality:  airResult.label,
        rainfall:    rainResult.label,
        ldr:         ldrResult.label,
      },
    });

    // Broadcast to all dashboard clients instantly
    io.emit("sensor:new", { success: true, data: newData });

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

// GET — All sensor data (latest 500)
export const getAllSensorData = async (req, res) => {
  try {
    const data = await Sensor.find().sort({ timestamp: -1 }).limit(500);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET — Latest single reading
export const getLatestSensorData = async (req, res) => {
  try {
    const data = await Sensor.findOne().sort({ timestamp: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching latest sensor data:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};