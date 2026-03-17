import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

export default function DashboardLayout({ latest, connected }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar connected={connected} />

      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <div className="hidden md:flex fixed left-0 top-16 bottom-0 w-60">
          <Sidebar latest={latest} connected={connected} />
        </div>

        {/* Main content */}
        <main className="flex-1 md:ml-60 overflow-y-auto min-h-full">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
