import { NavLink } from 'react-router-dom';
import { resolveFileUrl } from '../../../shared/services/api';
import useInstitutionProfile from '../../../shared/hooks/useInstitutionProfile';
import { NAV_GROUPS } from './adminNavItems.jsx';
import './AdminSidebar.css';

export default function AdminSidebar({ isOpen, onClose }) {
  const profile = useInstitutionProfile();

  return (
    <>
      {isOpen && <div className="admin-sidebar-overlay" onClick={onClose} />}
      <aside className={`admin-sidebar ${isOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-logo">
            {profile?.logoUrl ? (
              <img src={resolveFileUrl(profile.logoUrl)} alt={profile.institutionName || 'Logo'} />
            ) : (
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="#2563eb" />
                <path d="M16 6L26 11V21L16 26L6 21V11L16 6Z" stroke="white" strokeWidth="1.5" fill="none" />
                <circle cx="16" cy="16" r="3" fill="white" />
              </svg>
            )}
          </div>
          <div className="admin-sidebar-brand-text">
            <span className="admin-sidebar-brand-name">TutorSchool</span>
            <span className="admin-sidebar-brand-sub">Management System</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_GROUPS.map((group, groupIndex) => (
            <ul className="admin-sidebar-nav-list" key={group.section || `group-${groupIndex}`}>
              {group.section && (
                <li className="admin-sidebar-nav-section" aria-hidden="true">
                  {group.section}
                </li>
              )}
              {group.items.map((item) => (
                <li key={item.path} className="admin-sidebar-nav-item">
                  <NavLink
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      `admin-sidebar-nav-link${isActive ? ' admin-sidebar-nav-link--active' : ''}`
                    }
                    onClick={() => { if (onClose) onClose(); }}
                  >
                    <span className="admin-sidebar-nav-icon">{item.icon}</span>
                    <span className="admin-sidebar-nav-label">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-version">v1.0.0</div>
        </div>
      </aside>
    </>
  );
}
