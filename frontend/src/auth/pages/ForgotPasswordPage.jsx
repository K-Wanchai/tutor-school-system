import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/authService';
import './LoginPage.css';
import './ForgotPasswordPage.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await forgotPassword(email.trim());
      setSuccessMessage(res?.message || 'หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว');
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'ไม่สามารถส่งคำขอได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-simple-page">
      <div className="auth-simple-card">
        <div className="auth-login-card-header">
          <h2 className="auth-login-title">ลืมรหัสผ่าน?</h2>
          <p className="auth-login-subtitle">
            กรอกอีเมลที่ใช้ลงทะเบียน เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้
          </p>
        </div>

        {error && (
          <div className="auth-error-alert">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {sent ? (
          <div className="auth-success-alert">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
            <span>{successMessage}</span>
          </div>
        ) : (
          <form className="auth-login-form" onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label className="auth-form-label" htmlFor="email">อีเมล</label>
              <input
                id="email"
                type="email"
                className="auth-form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="auth-spinner"></span>
                  กำลังส่ง...
                </span>
              ) : (
                'ส่งลิงก์รีเซ็ตรหัสผ่าน'
              )}
            </button>
          </form>
        )}

        <div className="auth-login-footer">
          <p>
            <Link to="/login" className="auth-link">← กลับไปหน้าเข้าสู่ระบบ</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
