import { useLocation } from 'react-router-dom';
import { logout } from '../../../auth/services/authService';
import './TutorNavbar.css';

const PAGE_TITLES = {
  '/tutor/dashboard':        'แดชบอร์ด',
  '/tutor/courses':          'คอร์สของฉัน',
  '/tutor/notifications':    'การแจ้งเตือน',
  '/tutor/schedule':         'ตารางสอน',
  '/tutor/attendance-scores':'การเข้าเรียน/คะแนนสอบ',
  '/tutor/classroom':        'ห้องเรียน',
  '/tutor/evaluations':      'การประเมิน',
  '/tutor/reports':          'รายงาน',
  '/tutor/students':         'นักเรียน',
};

function getPageTitle(pathname) {
  // exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // prefix match for nested routes (e.g. /tutor/attendance-scores/123)
  const match = Object.keys(PAGE_TITLES)
    .filter(p => pathname.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_TITLES[match] : 'TutorSchool';
}

export default function TutorNavbar({ onMenuToggle }) {
  const username = localStorage.getItem('username') || 'ติวเตอร์';
  const { pathname } = useLocation();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="tutor-navbar">
      <div className="tutor-navbar-left">
        <button className="tutor-navbar-menu-btn" onClick={onMenuToggle} aria-label="Toggle sidebar">
          <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="tutor-navbar-title">
          <span>TutorSchool</span>
          <span className="tutor-navbar-title-sep">/</span>
          <span className="tutor-navbar-breadcrumb">{pageTitle}</span>
        </div>
      </div>

      <div className="tutor-navbar-right">
        <div className="tutor-badge">TUTOR</div>
        <div className="tutor-navbar-profile">
          <div className="tutor-navbar-avatar">{username.charAt(0).toUpperCase()}</div>
          <div className="tutor-navbar-user-info">
            <span className="tutor-navbar-username">{username}</span>
            <span className="tutor-navbar-role">ติวเตอร์</span>
          </div>
        </div>
        <button className="tutor-navbar-logout-btn" onClick={logout} title="ออกจากระบบ">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </header>
  );
}
