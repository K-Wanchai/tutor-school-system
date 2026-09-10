import { Outlet } from 'react-router-dom';
import { logout } from '../../../auth/services/authService';
import { getStudentName } from '../../../shared/utils/tokenUtils';
import useInstitutionProfile from '../../../shared/hooks/useInstitutionProfile';
import { resolveFileUrl } from '../../../shared/services/api';
import './ParentLayout.css';

export default function ParentLayout() {
  const profile = useInstitutionProfile();
  const childName = getStudentName();

  return (
    <div className="parent-layout">
      <header className="parent-header">
        <div className="parent-header-brand">
          <div className="parent-header-logo">
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
          <div className="parent-header-text">
            <span className="parent-header-title">{profile?.institutionName || 'TutorSchool'}</span>
            <span className="parent-header-sub">ระบบผู้ปกครอง</span>
          </div>
        </div>

        <div className="parent-header-right">
          {childName && (
            <span className="parent-header-child">
              นักเรียน: <strong>{childName}</strong>
            </span>
          )}
          <button type="button" className="parent-logout-btn" onClick={logout}>
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="parent-layout-content">
        <Outlet />
      </main>
    </div>
  );
}
