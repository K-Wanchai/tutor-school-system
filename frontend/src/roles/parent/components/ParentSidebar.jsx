import { NavLink } from 'react-router-dom';
import { resolveFileUrl } from '../../../shared/services/api';
import useInstitutionProfile from '../../../shared/hooks/useInstitutionProfile';
import '../../student/components/StudentSidebar.css';

// เมนูของผู้ปกครอง — เหมือนหน้านักเรียนทั้งหมด แต่แสดงเฉพาะส่วนที่ backend เปิดให้ผู้ปกครองดูได้ (อ่านอย่างเดียว)
const NAV_ITEMS = [
  {
    label: 'แดชบอร์ดการเรียน',
    path: '/parent/dashboard',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      </svg>
    ),
  },
  {
    label: 'ประวัติการสมัครเรียน',
    path: '/parent/enrollment-history',
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
    label: 'ตารางเรียน',
    path: '/parent/schedule',
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
    label: 'ผลสอบของบุตรหลาน',
    path: '/parent/exam-results',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
  },
  {
    label: 'การเข้าเรียน',
    path: '/parent/attendance',
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
    label: 'โปรไฟล์บุตรหลาน',
    path: '/parent/profile',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
        <path d="M10 10a4 4 0 100-8 4 4 0 000 8z" />
        <path fillRule="evenodd" d="M2 18a8 8 0 1116 0H2z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export default function ParentSidebar({ isOpen, onClose }) {
  const profile = useInstitutionProfile();

  return (
    <>
      {isOpen && <div className="student-sidebar-overlay" onClick={onClose} />}

      <aside className={`student-sidebar ${isOpen ? 'student-sidebar--open' : ''}`}>
        <div className="student-sidebar-brand">
          <div className="student-sidebar-logo">
            {profile?.logoUrl ? (
              <img src={resolveFileUrl(profile.logoUrl)} alt={profile.institutionName || 'Logo'} />
            ) : (
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="#0f766e" />
                <path d="M16 6L26 11V21L16 26L6 21V11L16 6Z" stroke="white" strokeWidth="1.5" fill="none" />
                <circle cx="16" cy="16" r="3" fill="white" />
              </svg>
            )}
          </div>

          <div className="student-sidebar-brand-text">
            <span className="student-sidebar-brand-name">TutorSchool</span>
            <span className="student-sidebar-brand-sub">ระบบผู้ปกครอง</span>
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
