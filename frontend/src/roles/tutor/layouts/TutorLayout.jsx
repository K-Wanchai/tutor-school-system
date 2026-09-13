import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TutorSidebar from '../components/TutorSidebar';
import { NAV_ITEMS } from '../components/tutorNavItems.jsx';
import TutorNavbar from '../components/TutorNavbar';
import useDocumentTitle from '../../../shared/hooks/useDocumentTitle';
import './TutorLayout.css';

export default function TutorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useDocumentTitle(NAV_ITEMS);

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
