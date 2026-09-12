import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import ParentSidebar from '../components/ParentSidebar';
import ParentNavbar from '../components/ParentNavbar';
import '../../student/layouts/StudentLayout.css';
import '../components/ParentTheme.css';

export default function ParentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="student-layout parent-theme">
      <ParentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="student-layout-main">
        <ParentNavbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <main className="student-layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
