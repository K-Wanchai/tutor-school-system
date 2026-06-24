import { NavLink } from 'react-router-dom';
import './TutorSidebar.css';

const NAV_ITEMS = [
  {
    label: 'แดชบอร์ด',
    path: '/tutor/dashboard',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      </svg>
    ),
  },
  {
    label: 'คอร์สของฉัน',
    path: '/tutor/courses',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
      </svg>
    ),
  },
  {
    label: 'ตารางสอน',
    path: '/tutor/schedule',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
  label: 'การเข้าเรียน/คะแนนสอบ',
  path: '/tutor/attendance-scores',
  icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0z" />
      <path d="M4 14a4 4 0 018 0v2H4v-2z" />
      <path d="M15 8a1 1 0 011 1v6h1a1 1 0 110 2h-5a1 1 0 110-2h1V9a1 1 0 011-1h1z" />
    </svg>
  ),
},
  {
    label: 'ห้องเรียน',
    path: '/tutor/classroom',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: 'การประเมิน',
    path: '/tutor/evaluations',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
  },
  {
    label: 'ข้อสอบ',
    path: '/tutor/exams',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: 'รายงาน',
    path: '/tutor/reports',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export default function TutorSidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="tutor-sidebar-overlay" onClick={onClose} />}
      <aside className={`tutor-sidebar ${isOpen ? 'tutor-sidebar--open' : ''}`}>
        <div className="tutor-sidebar-brand">
          <div className="tutor-sidebar-logo">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#059669" />
              <path d="M16 6L26 11V21L16 26L6 21V11L16 6Z" stroke="white" strokeWidth="1.5" fill="none" />
              <circle cx="16" cy="16" r="3" fill="white" />
            </svg>
          </div>
          <div className="tutor-sidebar-brand-text">
            <span className="tutor-sidebar-brand-name">TutorSchool</span>
            <span className="tutor-sidebar-brand-sub">ระบบติวเตอร์</span>
          </div>
        </div>

        <nav className="tutor-sidebar-nav">
          <ul className="tutor-sidebar-nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.path} className="tutor-sidebar-nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `tutor-sidebar-nav-link${isActive ? ' tutor-sidebar-nav-link--active' : ''}`
                  }
                  onClick={() => { if (onClose) onClose(); }}
                >
                  <span className="tutor-sidebar-nav-icon">{item.icon}</span>
                  <span className="tutor-sidebar-nav-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="tutor-sidebar-footer">
          <div className="tutor-sidebar-version">v1.0.0</div>
        </div>
      </aside>
    </>
  );
}
