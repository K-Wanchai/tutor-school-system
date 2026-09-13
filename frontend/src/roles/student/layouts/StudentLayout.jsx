import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import StudentSidebar from '../components/StudentSidebar';
import { NAV_ITEMS } from '../components/studentNavItems.jsx';
import StudentNavbar from '../components/StudentNavbar';
import useDocumentTitle from '../../../shared/hooks/useDocumentTitle';
import './StudentLayout.css';

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useDocumentTitle(NAV_ITEMS);

  return (
    <div className="student-layout">
      <StudentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="student-layout-main">
        <StudentNavbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <main className="student-layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
