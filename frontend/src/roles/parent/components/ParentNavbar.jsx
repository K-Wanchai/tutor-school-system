import { useLocation } from 'react-router-dom';
import { logout } from '../../../auth/services/authService';
import { getStudentName } from '../../../shared/utils/tokenUtils';
import '../../student/components/StudentNavbar.css';

const PAGE_TITLES = {
  '/parent/dashboard':          'แดชบอร์ด',
  '/parent/enrollment-history': 'ประวัติการสมัครเรียน',
  '/parent/schedule':           'ตารางเรียน',
  '/parent/exam-results':       'ผลสอบของบุตรหลาน',
  '/parent/attendance':         'การเข้าเรียน',
  '/parent/profile':            'โปรไฟล์บุตรหลาน',
};

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }

  const match = Object.keys(PAGE_TITLES)
    .filter((path) => pathname.startsWith(path))
    .sort((a, b) => b.length - a.length)[0];

  return match ? PAGE_TITLES[match] : 'แดชบอร์ด';
}

export default function ParentNavbar({ onMenuToggle }) {
  const childName = getStudentName() || 'บุตรหลาน';
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="student-navbar">
      <div className="student-navbar-left">
        <button className="student-navbar-menu-btn" onClick={onMenuToggle} aria-label="Toggle sidebar">
          <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="student-navbar-title">
          <span>TutorSchool</span>
          <span className="student-navbar-title-sep">/</span>
          <span className="student-navbar-breadcrumb">{pageTitle}</span>
        </div>
      </div>

      <div className="student-navbar-right">
        <div className="student-badge">PARENT</div>
        <div className="student-navbar-profile">
          <div className="student-navbar-avatar">{childName.charAt(0).toUpperCase()}</div>
          <div className="student-navbar-user-info">
            <span className="student-navbar-username">{childName}</span>
            <span className="student-navbar-role">ผู้ปกครอง</span>
          </div>
        </div>
        <button className="student-navbar-logout-btn" onClick={logout} title="ออกจากระบบ">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </header>
  );
}
