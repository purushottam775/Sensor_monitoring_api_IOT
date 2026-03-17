import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Overview from './pages/Overview';
import SensorDetail from './pages/SensorDetail';
import Predictions from './pages/Predictions';
import { useSensorData, useMLPrediction } from './hooks/useSensorData';

function LandingPage({ connected }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar connected={connected} />
      <main className="flex-1 pt-16"><Landing /></main>
      <Footer />
    </div>
  );
}

function DashboardShell({ 
  latest, history, connected, mlPrediction, mlLoading, mlError, 
  modelType, setModelType 
}) {
  const sharedProps = { 
    latest, history, connected, mlPrediction, mlLoading, mlError,
    modelType, setModelType
  };
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar connected={connected} />
      <div className="flex flex-1 pt-16">
        {/* Sidebar — fixed on desktop */}
        <div className="hidden md:block fixed left-0 top-16 bottom-0 w-60 overflow-y-auto"
             style={{ borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(12,18,36,0.9)' }}>
          <Sidebar latest={latest} connected={connected} />
        </div>
        {/* Main content */}
        <main className="flex-1 md:ml-60 flex flex-col min-h-full">
          <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
            <Routes>
              <Route path="/" element={<Overview {...sharedProps} />} />
              <Route path="/:sensorKey" element={<SensorDetail latest={latest} history={history} mlPrediction={mlPrediction} modelType={modelType} />} />
              <Route path="/predictions" element={<Predictions {...sharedProps} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [modelType, setModelType] = useState('standard');
  const { latest, history, connected, loading } = useSensorData();
  const { mlPrediction, mlLoading, mlError } = useMLPrediction(latest, modelType);

  const dashProps = { 
    latest, history, connected, mlPrediction, mlLoading, mlError, 
    modelType, setModelType 
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage connected={connected} />} />
        <Route path="/dashboard/*" element={<DashboardShell {...dashProps} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
