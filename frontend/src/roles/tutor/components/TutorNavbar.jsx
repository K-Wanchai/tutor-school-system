import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../../../auth/services/authService';
import api from '../../../shared/services/api';
import './TutorNavbar.css';

const PAGE_TITLES = {
  '/tutor/dashboard':        'แดชบอร์ด',
  '/tutor/new-courses':      'คอร์สมาใหม่',
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
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }

  const match = Object.keys(PAGE_TITLES)
    .filter((path) => pathname.startsWith(path))
    .sort((a, b) => b.length - a.length)[0];

  return match ? PAGE_TITLES[match] : 'TutorSchool';
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 00-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function countUnreadNotifications(data) {
  if (typeof data === 'number') return data;
  if (typeof data?.unreadCount === 'number') return data.unreadCount;
  if (typeof data?.count === 'number') return data.count;
  if (typeof data?.totalElements === 'number') return data.totalElements;
  if (typeof data?.total === 'number') return data.total;

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : [];

  const unreadList = list.filter((item) => {
    if (typeof item?.read === 'boolean') return item.read === false;
    if (typeof item?.isRead === 'boolean') return item.isRead === false;
    if ('readAt' in item) return item.readAt === null || item.readAt === '';
    if (item?.status) return item.status === 'UNREAD';
    return false;
  });

  if (unreadList.length === 0 && list.length > 0) {
    return list.length;
  }

  return unreadList.length;
}

export default function TutorNavbar({ onMenuToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const username = localStorage.getItem('username') || 'ติวเตอร์';
  const pageTitle = getPageTitle(location.pathname);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;

    const loadUnreadNotifications = async () => {
      try {
        const res = await api.get('/notifications/me');

        if (res.data?.success === false) {
          throw new Error(res.data?.message || 'โหลดการแจ้งเตือนไม่สำเร็จ');
        }

        const data = res.data?.data ?? res.data;
        const count = countUnreadNotifications(data);

        if (active) {
          setUnreadCount(count);
        }
      } catch {
        if (active) {
          setUnreadCount(0);
        }
      }
    };

    loadUnreadNotifications();

    const timer = setInterval(loadUnreadNotifications, 60000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

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
        <NavLink
          to="/tutor/notifications"
          className={({ isActive }) =>
            `tutor-navbar-notification-btn${
              isActive ? ' tutor-navbar-notification-btn--active' : ''
            }`
          }
          aria-label="การแจ้งเตือน"
          title="การแจ้งเตือน"
        >
          <span className="tutor-navbar-notification-icon">
            <BellIcon />
          </span>

          {unreadCount > 0 && (
            <span className="tutor-navbar-notification-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </NavLink>

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