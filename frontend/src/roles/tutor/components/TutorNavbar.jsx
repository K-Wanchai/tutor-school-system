import { useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../../../auth/services/authService';
import { getUsername } from '../../../shared/utils/tokenUtils';
import './TutorNavbar.css';

const PAGE_TITLES = {
  '/tutor/dashboard':        'แดชบอร์ด',
  '/tutor/courses':          'คอร์สของฉัน',
  '/tutor/notifications':    'การแจ้งเตือน',
  '/tutor/schedule':         'ตารางสอน',
  '/tutor/exam-schedule':    'ตารางสอบ',
  '/tutor/exams':            'จัดการข้อสอบ',
  '/tutor/course-scores':    'คะแนนรวมรายคอร์ส',
  '/tutor/attendance-scores':'การเข้าเรียน/คะแนนสอบ',
  '/tutor/evaluations':      'การประเมิน',
  '/tutor/reports':          'รายงาน',
  '/tutor/students':         'นักเรียน',
};

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }

  const match = Object.keys(PAGE_TITLES)
    .filter((path) => pathname.startsWith(path))
    .sort((a, b) => b.length - a.length)[0];

  return match ? PAGE_TITLES[match] : 'TutorSchool';
}

export default function TutorNavbar({ onMenuToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const username = getUsername() || 'ติวเตอร์';
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="tutor-navbar">
      <div className="tutor-navbar-left">
        <button
          type="button"
          className="tutor-navbar-menu-btn"
          onClick={onMenuToggle}
          aria-label="เปิดเมนู"
        >
          ☰
        </button>

        <div className="tutor-navbar-title">
          <span>TutorSchool</span>
          <span className="tutor-navbar-title-sep">/</span>
          <span className="tutor-navbar-breadcrumb">{pageTitle}</span>
        </div>
      </div>

      <div className="tutor-navbar-right">

        <button
          type="button"
          className="tutor-navbar-profile-click"
          onClick={() => navigate('/tutor/profile')}
        >
          <div className="tutor-badge">TUTOR</div>

          <div className="tutor-navbar-profile">
            <div className="tutor-navbar-avatar">
              {username.charAt(0).toUpperCase()}
            </div>

            <div className="tutor-navbar-user-info">
              <span className="tutor-navbar-username">{username}</span>
              <span className="tutor-navbar-role">ติวเตอร์</span>
            </div>
          </div>
        </button>

        <button
          type="button"
          className="tutor-navbar-logout-btn"
          onClick={logout}
        >
          ออกจากระบบ
        </button>
      </div>
    </header>
  );
}