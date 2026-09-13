import { NavLink } from 'react-router-dom';
import { resolveFileUrl } from '../../../shared/services/api';
import useInstitutionProfile from '../../../shared/hooks/useInstitutionProfile';
import { NAV_ITEMS } from './studentNavItems.jsx';
import './StudentSidebar.css';

export default function StudentSidebar({ isOpen, onClose }) {
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