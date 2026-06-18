import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminNavbar from '../components/AdminNavbar';
import './AdminLayout.css';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="admin-layout-main">
        <AdminNavbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <main className="admin-layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
