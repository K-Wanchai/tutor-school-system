import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/authService';
import { resolveFileUrl } from '../../shared/services/api';
import useInstitutionProfile from '../../shared/hooks/useInstitutionProfile';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const profile = useInstitutionProfile();
  const [form, setForm] = useState({ usernameOrEmail: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    // ใช้ functional update (ไม่ใช่ {...form, ...} ที่ closure ค้างค่าเดิม) เพราะถ้าอีเมล/รหัสผ่านถูกเติม
    // เกือบพร้อมกัน (เช่น browser autofill) React อาจ batch สอง onChange ก่อน re-render จะทัน ทำให้ field
    // แรกที่เพิ่งตั้งค่าไปถูกเขียนทับกลับเป็นค่าเก่าโดยไม่ตั้งใจ
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(form, rememberMe);
      const role = data.role;
      if (role === 'ADMIN') navigate('/admin/dashboard');
      else if (role === 'TUTOR') navigate('/tutor/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-login-page">
      <div className="auth-login-brand">
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <div className="auth-logo-icon">
              {profile?.logoUrl ? (
                <img src={resolveFileUrl(profile.logoUrl)} alt={profile.institutionName || 'Logo'} />
              ) : (
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="40" height="40" rx="10" fill="white" fillOpacity="0.15" />
                  <path d="M20 8L32 14V26L20 32L8 26V14L20 8Z" stroke="white" strokeWidth="2" fill="none" />
                  <path d="M20 14L26 17V23L20 26L14 23V17L20 14Z" fill="white" fillOpacity="0.3" />
                  <circle cx="20" cy="20" r="3" fill="white" />
                </svg>
              )}
            </div>
            <span className="auth-brand-name">KruPuk Tutor</span>
          </div>
          <h1 className="auth-brand-title">Tutor School Management System</h1>
          <p className="auth-brand-subtitle">
            ยกระดับการบริหารจัดการสถาบันการศึกษาของคุณให้มีประสิทธิภาพยิ่งขึ้นด้วยแพลตฟอร์มการจัดการที่ครอบคลุมของเรา จัดการนักเรียน ครูผู้สอน หลักสูตร และอื่นๆ อีกมากมายได้ในที่เดียว
          </p>
          <div className="auth-brand-features">
            <div className="auth-feature-item">
              <span className="auth-feature-dot"></span>
              <span>การจัดการนักเรียนและผู้สอน</span>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-dot"></span>
              <span>การจัดตารางเรียนและการลงทะเบียน</span>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-dot"></span>
              <span>การสอบ การเข้าเรียน และรายงาน</span>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-dot"></span>
              <span>ระบบชำระเงิน & การแจ้งเตือน</span>
            </div>
          </div>

          {profile?.address && (
            <div className="auth-brand-footer">
              <span>{profile.institutionName}</span>
              <span>{profile.address}</span>
            </div>
          )}
        </div>
      </div>

      <div className="auth-login-form-section">
        <div className="auth-login-card">
          <div className="auth-login-card-header">
            <h2 className="auth-login-title">Welcome back</h2>
            <p className="auth-login-subtitle">ลงชื่อเข้าใช้บัญชีของคุณเพื่อดำเนินการต่อ</p>
          </div>

          {error && (
            <div className="auth-error-alert">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form className="auth-login-form" onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label className="auth-form-label" htmlFor="usernameOrEmail">
                Username or Email
              </label>
              <input
                id="usernameOrEmail"
                type="text"
                name="usernameOrEmail"
                className="auth-form-input"
                placeholder="Enter your username or email"
                value={form.usernameOrEmail}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-form-label" htmlFor="password">
                Password
              </label>
              <div className="auth-password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="auth-form-input"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                      <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
                      <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.147.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="auth-form-options">
              <label className="auth-remember-label">
                <input
                  type="checkbox"
                  className="auth-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>จดจำฉันไว้</span>
              </label>
              <Link to="/forgot-password" className="auth-link">ลืมรหัสผ่าน?</Link>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="auth-spinner"></span>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-login-footer">
            <p>
              ยังไม่มีบัญชีใช่ไหม?{' '}
              <Link to="/register" className="auth-link">
                สมัครสมาชิก
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
