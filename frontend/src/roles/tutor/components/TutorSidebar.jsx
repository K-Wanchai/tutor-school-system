import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import api, { resolveFileUrl } from '../../../shared/services/api';
import useInstitutionProfile from '../../../shared/hooks/useInstitutionProfile';
import { getMyCourses } from '../services/tutorCourseService';
import { NAV_ITEMS } from './tutorNavItems.jsx';
import './TutorSidebar.css';

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

export default function TutorSidebar({ isOpen, onClose }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [newCoursesCount, setNewCoursesCount] = useState(0);
  const profile = useInstitutionProfile();

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

  // นับคอร์สที่แอดมินมอบหมายมาแล้วแต่ติวเตอร์ยังไม่เคยเปิดดู ไว้โชว์เป็น badge บนเมนู "คอร์สของฉัน"
  useEffect(() => {
    let active = true;

    const loadNewCourses = async () => {
      try {
        const courses = await getMyCourses();
        const count = Array.isArray(courses)
          ? courses.filter((c) => !c.tutorViewed).length
          : 0;

        if (active) {
          setNewCoursesCount(count);
        }
      } catch {
        if (active) {
          setNewCoursesCount(0);
        }
      }
    };

    loadNewCourses();

    const timer = setInterval(loadNewCourses, 60000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="tutor-sidebar-overlay"
          onClick={onClose}
          role="button"
          tabIndex={0}
          aria-label="ปิดเมนู"
        />
      )}

      <aside className={`tutor-sidebar ${isOpen ? 'tutor-sidebar--open' : ''}`}>
        <div className="tutor-sidebar-brand">
          <div className="tutor-sidebar-brand-main">
            <div className="tutor-sidebar-logo">
              {profile?.logoUrl ? (
                <img src={resolveFileUrl(profile.logoUrl)} alt={profile.institutionName || 'Logo'} />
              ) : (
                <svg
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="32" height="32" rx="8" fill="#059669" />
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

            <div className="tutor-sidebar-brand-text">
              <span className="tutor-sidebar-brand-name">TutorSchool</span>
              <span className="tutor-sidebar-brand-sub">ระบบติวเตอร์</span>
            </div>
          </div>

          <NavLink
            to="/tutor/notifications"
            className={({ isActive }) =>
              `tutor-sidebar-notification-btn${
                isActive ? ' tutor-sidebar-notification-btn--active' : ''
              }`
            }
            onClick={handleNavClick}
            aria-label="การแจ้งเตือน"
            title="การแจ้งเตือน"
          >
            <span className="tutor-sidebar-notification-icon">
              <BellIcon />
            </span>

            {unreadCount > 0 && (
              <span className="tutor-sidebar-notification-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        </div>

        <nav className="tutor-sidebar-nav">
          <ul className="tutor-sidebar-nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.path} className="tutor-sidebar-nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `tutor-sidebar-nav-link${
                      isActive ? ' tutor-sidebar-nav-link--active' : ''
                    }`
                  }
                  onClick={handleNavClick}
                >
                  <span className="tutor-sidebar-nav-icon">{item.icon}</span>
                  <span className="tutor-sidebar-nav-label">{item.label}</span>
                  {item.path === '/tutor/courses' && newCoursesCount > 0 && (
                    <span className="tutor-sidebar-nav-badge">
                      {newCoursesCount > 99 ? '99+' : newCoursesCount}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

    <div className="tutor-sidebar-help-card">
  <div className="tutor-sidebar-help-text">
    <h4>สอนอย่างมืออาชีพ</h4>
    <p>
      ติดตามผลการเรียน
      <br />
      ได้อย่างไร้ขีดจำกัด
    </p>
  </div>

  <div className="tutor-help-person">
    <div className="tutor-help-head" />
    <div className="tutor-help-hair" />
    <div className="tutor-help-body" />
    <div className="tutor-help-arm" />
    <div className="tutor-help-hand" />
    <div className="tutor-help-tablet" />
  </div>
</div>

        

        <div className="tutor-sidebar-footer">
          <div className="tutor-sidebar-version">v1.0.0</div>
        </div>
      </aside>
    </>
  );
}

