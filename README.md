# IoT Sensor Dashboard with ML Prediction

This project is a comprehensive IoT solution that collects real-time sensor data, processes it through a Node.js backend using a TensorFlow.js LSTM model for predictive analytics, and visualizes the data on a React-based frontend dashboard. 

The system tracks Temperature, Humidity, Air Quality, Rainfall, and Light Level (LDR), providing real-time forecasting and "time-to-danger" alerts.

## Project Structure

- **`backend/`**: Node.js & Express server.
  - Handles API requests and real-time WebSocket (`Socket.io`) connections.
  - Integrates with MongoDB (`mongoose`) to store historical sensor data.
  - Uses TensorFlow.js (`@tensorflow/tfjs`) for an LSTM model that trains on historical data and predicts future sensor values (Trends & Time-to-danger).
- **`client/`**: React & Vite frontend application.
  - Displays real-time sensor metrics using `Recharts`.
  - Styled with TailwindCSS.
  - Receives live data and ML predictions via `Socket.io-client`.
- **`arduino_firmware/`**: Firmware for the IoT hardware device responsible for capturing physical sensor readings and transmitting them.

## Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose)
- **Real-time:** Socket.io
- **Machine Learning:** TensorFlow.js (`@tensorflow/tfjs` - LSTM Sequential Model)

### Frontend
- **Framework:** React 19 (via Vite)
- **Styling:** TailwindCSS 4
- **Real-time:** Socket.io-client
- **Charting:** Recharts
- **Icons:** Lucide React

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (Running locally or a MongoDB Atlas URI)

### 1. Setup the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Environment Setup:
   - Ensure the `.env` file exists and contains the required environment variables:
     ```env
     PORT=5000
     MONGO_URI=your_mongodb_connection_string
     ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:5000` (or your configured port) and the ML model will initialize with historical data.*

### 2. Setup the Frontend (Client)

1. Open a new terminal and navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will be accessible at `http://localhost:5173`. It will automatically connect to the backend WebSocket.*

### 3. Arduino Firmware
- Flash the `.ino` firmware file (if available in the `backend/arduino_firmware` or hardware directory) to your microcontroller (e.g., Arduino/ESP32).
- Ensure the hardware is configured to send POST requests with JSON sensor data to the backend API (`/api/sensor`).

---

## Developer Notes
- **Machine Learning**: The LSTM predictor in `backend/ml/SensorPredictor.js` uses a sliding window (10 timesteps) of historical readings to predict future states. It automatically retrains itself on the fly as new data streams in (every 5 readings).
- **WebSockets**: Real-time communication is facilitated by Socket.io. The backend broadcasts `sensor:prediction` events to all connected clients containing both the current readings, computed trends, time-to-danger metrics, and ML prediction confidence.
- **Status Thresholds**: Sensor warning/danger thresholds are centrally defined in the backend and use predictions to alert the UI ahead of time.
