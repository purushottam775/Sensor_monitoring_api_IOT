import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import sensorRoutes from "./routes/sensorRoutes.js";

dotenv.config();

const app = express();
app.set('json spaces', 2);
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
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ── Middleware ───────────────────────────────────────────────────
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"] }));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────
app.use("/api/sensor", sensorRoutes);
app.get("/", (req, res) => res.send("IoT Backend Running with Socket.io"));

// ── Boot sequence ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const boot = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket ready on ws://localhost:${PORT}`);
  });
};

boot();