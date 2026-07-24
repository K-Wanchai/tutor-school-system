import { NavLink } from 'react-router-dom';
import { resolveFileUrl } from '../../../shared/services/api';
import useInstitutionProfile from '../../../shared/hooks/useInstitutionProfile';
import './AdminSidebar.css';

const NAV_GROUPS = [
  {
    section: null,
    items: [
      {
        label: 'แดชบอร์ด',
        path: '/admin/dashboard',
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
        ),
      },
    ],
  },
  {
    // จัดกลุ่มเมนู "การจัดการข้อมูลพื้นฐาน" ให้อยู่ใกล้กัน ตาม DFD (นักเรียน/ติวเตอร์/คอร์ส/สถาบัน)
    section: 'การจัดการข้อมูลพื้นฐาน',
    items: [
      {
        label: 'นักเรียน',
        path: '/admin/students',
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        ),
      },
      {
        label: 'ติวเตอร์',
        path: '/admin/tutors',
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        ),
      },
      {
        label: 'คอร์สเรียน',
        path: '/admin/courses',
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        ),
      },
      {
        label: 'สถาบันที่จัดสอบ',
        path: '/admin/exam-institutions',
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    section: null,
    items: [
      {
        label: 'การสมัครเรียน',
        path: '/admin/enrollments',
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        ),
      },
      {
        label: 'ประวัติการชำระเงิน',
        path: '/admin/payments',
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
          </svg>
        ),
      },
      {
        label: 'ข้อสอบ',
        path: '/admin/exams',
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
          </svg>
        ),
      },
      {
        label: 'การเข้าเรียน',
        path: '/admin/attendance',
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        ),
      },
      {
        label: 'การแจ้งเตือน',
        path: '/admin/notifications',
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        ),
      },
      {
        label: 'รายงาน',
        path: '/admin/reports',
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
          </svg>
        ),
      },
    ],
  },
  {
    section: null,
    items: [
      {
        label: 'ตั้งค่าสถาบัน',
        path: '/admin/settings',
        icon: (
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        ),
      },
    ],
  },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const profile = useInstitutionProfile();

  return (
    <>
      {isOpen && <div className="admin-sidebar-overlay" onClick={onClose} />}
      <aside className={`admin-sidebar ${isOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-logo">
            {profile?.logoUrl ? (
              <img src={resolveFileUrl(profile.logoUrl)} alt={profile.institutionName || 'Logo'} />
            ) : (
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="#2563eb" />
                <path d="M16 6L26 11V21L16 26L6 21V11L16 6Z" stroke="white" strokeWidth="1.5" fill="none" />
                <circle cx="16" cy="16" r="3" fill="white" />
              </svg>
            )}
          </div>
          <div className="admin-sidebar-brand-text">
            <span className="admin-sidebar-brand-name">TutorSchool</span>
            <span className="admin-sidebar-brand-sub">Management System</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_GROUPS.map((group, groupIndex) => (
            <ul className="admin-sidebar-nav-list" key={group.section || `group-${groupIndex}`}>
              {group.section && (
                <li className="admin-sidebar-nav-section" aria-hidden="true">
                  {group.section}
                </li>
              )}
              {group.items.map((item) => (
                <li key={item.path} className="admin-sidebar-nav-item">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `admin-sidebar-nav-link${isActive ? ' admin-sidebar-nav-link--active' : ''}`
                    }
                    onClick={() => { if (onClose) onClose(); }}
                  >
                    <span className="admin-sidebar-nav-icon">{item.icon}</span>
                    <span className="admin-sidebar-nav-label">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-version">v1.0.0</div>
        </div>
      </aside>
    </>
  );
}
