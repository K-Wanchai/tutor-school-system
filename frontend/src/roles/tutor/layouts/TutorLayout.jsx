import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TutorSidebar from '../components/TutorSidebar';
import TutorNavbar from '../components/TutorNavbar';
import './TutorLayout.css';

export default function TutorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="tutor-layout">
      <TutorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="tutor-layout-main">
        <TutorNavbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <main className="tutor-layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
