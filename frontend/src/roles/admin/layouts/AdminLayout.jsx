import { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { NAV_GROUPS } from '../components/adminNavItems.jsx';
import AdminNavbar from '../components/AdminNavbar';
import useDocumentTitle from '../../../shared/hooks/useDocumentTitle';
import './AdminLayout.css';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = useMemo(() => NAV_GROUPS.flatMap((group) => group.items), []);
  useDocumentTitle(navItems);

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
