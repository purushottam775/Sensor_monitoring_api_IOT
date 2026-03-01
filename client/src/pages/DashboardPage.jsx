import { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Dashboard from '../components/dashboard/Dashboard';

const DashboardPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />
      <main
        className="flex-1 transition-all duration-300 pt-6 pb-10 px-4 sm:px-6"
        style={{ marginLeft: sidebarCollapsed ? '4rem' : '15rem' }}
      >
        <Dashboard />
      </main>
    </div>
  );
};

export default DashboardPage;
