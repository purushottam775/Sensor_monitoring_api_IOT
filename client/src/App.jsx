import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSensorData } from './hooks/useSensorData';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import DashboardPage from './pages/DashboardPage';

function AppContent() {
  const { latest, isLive } = useSensorData();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar isLive={isLive} latest={latest} />
      <div className="flex-1 pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
