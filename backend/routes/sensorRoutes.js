import express from "express";
import {
  createSensorData,
  getAllSensorData,
  getLatestSensorData,
} from "../controllers/sensorController.js";

const router = express.Router();

// NodeMCU → POST data
router.post("/", createSensorData);

// Dashboard → GET all data (latest 500)
router.get("/", getAllSensorData);

// Dashboard → GET latest single reading
router.get("/latest", getLatestSensorData);

export default router;