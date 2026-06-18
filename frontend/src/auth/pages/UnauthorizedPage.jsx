import { useNavigate } from 'react-router-dom';
import './UnauthorizedPage.css';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="auth-unauthorized-page">
      <div className="auth-unauthorized-card">
        <div className="auth-unauthorized-icon">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" stroke="#e5e7eb" strokeWidth="2" />
            <path d="M32 16V34" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            <circle cx="32" cy="44" r="2.5" fill="#ef4444" />
          </svg>
        </div>
        <h1 className="auth-unauthorized-title">Access Denied</h1>
        <p className="auth-unauthorized-subtitle">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <div className="auth-unauthorized-actions">
          <button className="auth-unauthorized-btn-primary" onClick={() => navigate(-1)}>
            Go Back
          </button>
          <button className="auth-unauthorized-btn-secondary" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
