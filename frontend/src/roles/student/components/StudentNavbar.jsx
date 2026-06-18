import { logout } from '../../../auth/services/authService';
import './StudentNavbar.css';

export default function StudentNavbar({ onMenuToggle }) {
  const username = localStorage.getItem('username') || 'นักเรียน';

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
          <span className="student-navbar-breadcrumb">แดชบอร์ด</span>
        </div>
      </div>

      <div className="student-navbar-right">
        <div className="student-badge">STUDENT</div>
        <div className="student-navbar-profile">
          <div className="student-navbar-avatar">{username.charAt(0).toUpperCase()}</div>
          <div className="student-navbar-user-info">
            <span className="student-navbar-username">{username}</span>
            <span className="student-navbar-role">นักเรียน</span>
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
