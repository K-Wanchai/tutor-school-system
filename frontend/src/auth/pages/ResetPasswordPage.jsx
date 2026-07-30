import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/authService';
import './LoginPage.css';
import './ForgotPasswordPage.css';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validate = () => {
    if (form.newPassword.length < 8) {
      setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');
      return false;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');
    try {
      await resetPassword({ token, newPassword: form.newPassword, confirmPassword: form.confirmPassword });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'ไม่สามารถตั้งรหัสผ่านใหม่ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-simple-page">
        <div className="auth-simple-card">
          <div className="auth-login-card-header">
            <h2 className="auth-login-title">ลิงก์ไม่ถูกต้อง</h2>
            <p className="auth-login-subtitle">
              ลิงก์ตั้งรหัสผ่านใหม่นี้ไม่ถูกต้องหรือไม่สมบูรณ์ กรุณาขอลิงก์ใหม่อีกครั้ง
            </p>
          </div>
          <div className="auth-login-footer">
            <p>
              <Link to="/forgot-password" className="auth-link">ขอลิงก์รีเซ็ตรหัสผ่านใหม่</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-simple-page">
        <div className="auth-simple-card">
          <div className="auth-login-card-header">
            <h2 className="auth-login-title">ตั้งรหัสผ่านใหม่สำเร็จ</h2>
            <p className="auth-login-subtitle">คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที</p>
          </div>
          <Link to="/login" className="auth-submit-btn" style={{ display: 'flex', textDecoration: 'none' }}>
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-simple-page">
      <div className="auth-simple-card">
        <div className="auth-login-card-header">
          <h2 className="auth-login-title">ตั้งรหัสผ่านใหม่</h2>
          <p className="auth-login-subtitle">กรอกรหัสผ่านใหม่ของคุณ</p>
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
            <label className="auth-form-label" htmlFor="newPassword">รหัสผ่านใหม่</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className="auth-form-input"
              placeholder="อย่างน้อย 8 ตัวอักษร"
              value={form.newPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-form-label" htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="auth-form-input"
              placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="auth-btn-loading">
                <span className="auth-spinner"></span>
                กำลังบันทึก...
              </span>
            ) : (
              'ตั้งรหัสผ่านใหม่'
            )}
          </button>
        </form>

        <div className="auth-login-footer">
          <p>
            <Link to="/login" className="auth-link">← กลับไปหน้าเข้าสู่ระบบ</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
