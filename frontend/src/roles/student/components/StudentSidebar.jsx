import { NavLink } from 'react-router-dom';
import useInstitutionProfile from '../../../shared/hooks/useInstitutionProfile';
import './StudentSidebar.css';

const NAV_ITEMS = [
  {
    label: 'แดชบอร์ด',
    path: '/student/dashboard',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      </svg>
    ),
  },
  {
    label: 'คอร์สของฉัน',
    path: '/student/courses',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
      </svg>
    ),
  },
  {
    label: 'การสมัครเรียน',
    path: '/student/enrollments',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
        <path
          fillRule="evenodd"
          d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    label: 'ตารางเรียน',
    path: '/student/schedule',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path
          fillRule="evenodd"
          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    label: 'การชำระเงิน',
    path: '/student/payments',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
        <path
          fillRule="evenodd"
          d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    label: 'ประวัติการลงทะเบียน',
    path: '/student/enrollment-history',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path
          fillRule="evenodd"
          d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    label: 'การเข้าเรียน',
    path: '/student/attendance',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    label: 'การแจ้งเตือน',
    path: '/student/notifications',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    label: 'โปรไฟล์',
    path: '/student/profile',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path d="M10 10a4 4 0 100-8 4 4 0 000 8z" />
        <path
          fillRule="evenodd"
          d="M2 18a8 8 0 1116 0H2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

export default function StudentSidebar({ isOpen, onClose }) {
  const profile = useInstitutionProfile();

  return (
    <>
      {isOpen && <div className="student-sidebar-overlay" onClick={onClose} />}

      <aside className={`student-sidebar ${isOpen ? 'student-sidebar--open' : ''}`}>
        <div className="student-sidebar-brand">
          <div className="student-sidebar-logo">
            {profile?.logoUrl ? (
              <img src={profile.logoUrl} alt={profile.institutionName || 'Logo'} />
            ) : (
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="#7c3aed" />
                <path
                  d="M16 6L26 11V21L16 26L6 21V11L16 6Z"
                  stroke="white"
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle cx="16" cy="16" r="3" fill="white" />
              </svg>
            )}
          </div>

          <div className="student-sidebar-brand-text">
            <span className="student-sidebar-brand-name">TutorSchool</span>
            <span className="student-sidebar-brand-sub">ระบบนักเรียน</span>
          </div>
        </div>

        <nav className="student-sidebar-nav">
          <ul className="student-sidebar-nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.path} className="student-sidebar-nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `student-sidebar-nav-link${
                      isActive ? ' student-sidebar-nav-link--active' : ''
                    }`
                  }
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                >
                  <span className="student-sidebar-nav-icon">{item.icon}</span>
                  <span className="student-sidebar-nav-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="student-sidebar-footer">
          <div className="student-sidebar-version">v1.0.0</div>
        </div>
      </aside>
    </>
  );
}