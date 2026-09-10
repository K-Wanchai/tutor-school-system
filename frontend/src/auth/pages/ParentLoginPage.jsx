import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { parentLogin } from '../services/authService';
import { resolveFileUrl } from '../../shared/services/api';
import useInstitutionProfile from '../../shared/hooks/useInstitutionProfile';
import './LoginPage.css';

export default function ParentLoginPage() {
  const navigate = useNavigate();
  const profile = useInstitutionProfile();
  const [nationalId, setNationalId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    // อนุญาตเฉพาะตัวเลข สูงสุด 13 หลัก
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 13);
    setNationalId(digitsOnly);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (nationalId.length !== 13) {
      setError('กรุณากรอกเลขบัตรประชาชนของนักเรียนให้ครบ 13 หลัก');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await parentLogin(nationalId);
      navigate('/parent');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'ไม่พบนักเรียนที่มีเลขบัตรประชาชนนี้ กรุณาตรวจสอบอีกครั้ง'
      );
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
                  <circle cx="20" cy="20" r="3" fill="white" />
                </svg>
              )}
            </div>
            <span className="auth-brand-name">KruPuk Tutor</span>
          </div>
          <h1 className="auth-brand-title">ระบบติดตามการเข้าเรียนสำหรับผู้ปกครอง</h1>
          <p className="auth-brand-subtitle">
            ผู้ปกครองสามารถเข้าสู่ระบบด้วยเลขบัตรประชาชนของนักเรียน
            เพื่อติดตามการเข้าเรียนของบุตรหลานได้ตลอดเวลา
          </p>
        </div>
      </div>

      <div className="auth-login-form-section">
        <div className="auth-login-card">
          <div className="auth-login-card-header">
            <h2 className="auth-login-title">เข้าสู่ระบบสำหรับผู้ปกครอง</h2>
            <p className="auth-login-subtitle">กรอกเลขบัตรประชาชนของนักเรียนเพื่อดำเนินการต่อ</p>
          </div>

          {error && (
            <div className="auth-error-alert">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form className="auth-login-form" onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label className="auth-form-label" htmlFor="nationalId">
                เลขบัตรประชาชนของนักเรียน
              </label>
              <input
                id="nationalId"
                type="text"
                inputMode="numeric"
                name="nationalId"
                className="auth-form-input"
                placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
                value={nationalId}
                onChange={handleChange}
                required
                autoComplete="off"
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="auth-spinner" />
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>
          </form>

          <div className="auth-login-footer">
            <p>
              เป็นนักเรียน ติวเตอร์ หรือผู้ดูแลระบบ?{' '}
              <Link to="/login" className="auth-link">
                เข้าสู่ระบบปกติ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
