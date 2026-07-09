import { useEffect, useState } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { logout } from '../../../auth/services/authService';
import { getExamInstitutionById } from '../services/examInstitutionService';
import './AdminNavbar.css';

const BREADCRUMB_MAP = {
  '/admin/dashboard':         'แดชบอร์ด',
  '/admin/students':          'นักเรียน',
  '/admin/tutors':            'ติวเตอร์',
  '/admin/courses':           'คอร์สเรียน',
  '/admin/enrollments':       'การสมัครเรียน',
  '/admin/payments':          'การชำระเงิน',
  '/admin/exams':             'ข้อสอบ',
  '/admin/attendance':        'การเข้าเรียน',
  '/admin/notifications':     'การแจ้งเตือน',
  '/admin/reports':           'รายงาน',
  '/admin/exam-institutions': 'สถาบันที่จัดสอบ',
  '/admin/settings':          'ตั้งค่าสถาบัน',
};

export default function AdminNavbar({ onMenuToggle }) {
  const location = useLocation();
  const username  = localStorage.getItem('username') || 'Administrator';
  const [institutionName, setInstitutionName] = useState('');

  const institutionMatch = matchPath('/admin/exam-institutions/:institutionId', location.pathname);
  const institutionId = institutionMatch?.params?.institutionId;

  useEffect(() => {
    if (!institutionId) {
      setInstitutionName('');
      return;
    }
    let cancelled = false;
    getExamInstitutionById(institutionId)
      .then((data) => { if (!cancelled) setInstitutionName(data?.institutionName || ''); })
      .catch(() => { if (!cancelled) setInstitutionName(''); });
    return () => { cancelled = true; };
  }, [institutionId]);

  const breadcrumbSegments = institutionId
    ? ['สถาบันที่จัดสอบ', institutionName || '...']
    : [BREADCRUMB_MAP[location.pathname] || 'แดชบอร์ด'];

  return (
    <header className="admin-navbar">
      <div className="admin-navbar-left">
        <button
          className="admin-navbar-menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="admin-navbar-title">
          <span>TutorSchool</span>
          {breadcrumbSegments.map((seg, i) => (
            <span key={i}>
              <span className="admin-navbar-title-sep">/</span>
              <span className="admin-navbar-breadcrumb">{seg}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="admin-navbar-right">
        <div className="admin-badge">ADMIN</div>

        <div className="admin-navbar-profile">
          <div className="admin-navbar-avatar">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="admin-navbar-user-info">
            <span className="admin-navbar-username">{username}</span>
            <span className="admin-navbar-role">ผู้ดูแลระบบ</span>
          </div>
        </div>

        <button className="admin-navbar-logout-btn" onClick={logout} title="ออกจากระบบ">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </header>
  );
}
