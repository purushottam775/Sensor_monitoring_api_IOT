import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import sensorRoutes from "./routes/sensorRoutes.js";
import predictor from "./ml/index.js";
import Sensor from "./models/Sensor.js";

dotenv.config();

const app = express();
app.set('json spaces', 2); // Enable pretty-printed JSON for browser viewing
const httpServer = createServer(app);

// ── Socket.io ────────────────────────────────────────────────────
export const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Send latest prediction immediately to newly connected client
  const latestPred = predictor.getLastPrediction();
  if (latestPred) socket.emit("sensor:prediction", latestPred);

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ── Middleware ───────────────────────────────────────────────────
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"] }));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────
app.use("/api/sensor", sensorRoutes);
app.get("/", (req, res) => res.send("IoT Backend Running with Socket.io + TF.js LSTM"));

// ── Boot sequence ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const boot = async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Load historical data + seed LSTM model
  try {
    const history = await Sensor.find()
      .sort({ timestamp: 1 })
      .limit(50)
      .lean();

    await predictor.init(history);
  } catch (err) {
    console.error("[ML] Could not init predictor:", err.message);
  }

  // 3. Start HTTP + WebSocket server
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket ready on ws://localhost:${PORT}`);
    console.log(`TF.js LSTM predictor ready`);
  });
};

boot();