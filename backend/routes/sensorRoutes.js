import express from "express";
import {
  createSensorData,
  getAllSensorData,
  getLatestSensorData,
  getPrediction,
} from "../controllers/sensorController.js";

const router = express.Router();

// NodeMCU → POST data
router.post("/", createSensorData);

// Dashboard → GET all data (latest 50)
router.get("/", getAllSensorData);

// Dashboard → GET latest single reading
router.get("/latest", getLatestSensorData);

// Dashboard → GET current AI prediction
router.get("/prediction", getPrediction);

export default router;