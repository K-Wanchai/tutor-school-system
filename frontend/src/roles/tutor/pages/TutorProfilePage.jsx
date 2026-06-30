import { useEffect, useMemo, useState } from 'react';
import {
  getMyProfile,
  updateMyProfile,
  changePassword,
} from '../services/tutorProfileService';
import './TutorProfilePage.css';

const initialProfileForm = {
  firstName: '',
  lastName: '',
  phoneNumber: '',
  bio: '',
  specialization: '',
  profileImageUrl: '',
  email: '',
  tutorCode: '',
};

const initialPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function TutorProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialProfileForm);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [toast, setToast] = useState(null);

  const fullName = useMemo(() => {
    const name = `${form.firstName || ''} ${form.lastName || ''}`.trim();
    return name || 'Tutor Profile';
  }, [form.firstName, form.lastName]);

  const initials = useMemo(() => {
    const first = form.firstName?.trim()?.[0] || '';
    const last = form.lastName?.trim()?.[0] || '';
    const email = form.email?.trim()?.[0] || 'T';
    return `${first}${last}`.trim().toUpperCase() || email.toUpperCase();
  }, [form.firstName, form.lastName, form.email]);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3200);

    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const normalizeProfile = (data) => ({
    firstName: data?.firstName ?? '',
    lastName: data?.lastName ?? '',
    phoneNumber: data?.phoneNumber ?? '',
    bio: data?.bio ?? '',
    specialization: data?.specialization ?? '',
    profileImageUrl: data?.profileImageUrl ?? '',
    email: data?.email ?? '',
    tutorCode: data?.tutorCode ?? '',
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getMyProfile();

      if (!data) {
        setProfile(null);
        setForm(initialProfileForm);
        return;
      }

      const normalized = normalizeProfile(data);
      setProfile(normalized);
      setForm(normalized);
    } catch (err) {
      setError(err?.message || 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setPasswordErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const validateProfile = () => {
    const errors = {};

    if (!form.firstName.trim()) {
      errors.firstName = 'กรุณากรอกชื่อ';
    }

    if (!form.lastName.trim()) {
      errors.lastName = 'กรุณากรอกนามสกุล';
    }

    if (form.phoneNumber.trim()) {
      const phonePattern = /^[0-9+\-\s()]{8,20}$/;
      if (!phonePattern.test(form.phoneNumber.trim())) {
        errors.phoneNumber = 'รูปแบบเบอร์โทรไม่ถูกต้อง';
      }
    }

    if (form.specialization.trim().length > 120) {
      errors.specialization = 'ความเชี่ยวชาญต้องไม่เกิน 120 ตัวอักษร';
    }

    if (form.bio.trim().length > 1000) {
      errors.bio = 'แนะนำตัวต้องไม่เกิน 1000 ตัวอักษร';
    }

    if (form.profileImageUrl.trim()) {
      try {
        const url = new URL(form.profileImageUrl.trim());
        if (!['http:', 'https:'].includes(url.protocol)) {
          errors.profileImageUrl = 'URL รูปโปรไฟล์ต้องขึ้นต้นด้วย http หรือ https';
        }
      } catch {
        errors.profileImageUrl = 'URL รูปโปรไฟล์ไม่ถูกต้อง';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors = {};

    if (!passwordForm.currentPassword.trim()) {
      errors.currentPassword = 'กรุณากรอกรหัสผ่านปัจจุบัน';
    }

    if (!passwordForm.newPassword.trim()) {
      errors.newPassword = 'กรุณากรอกรหัสผ่านใหม่';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร';
    }

    if (!passwordForm.confirmPassword.trim()) {
      errors.confirmPassword = 'กรุณายืนยันรหัสผ่านใหม่';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน';
    }

    if (
      passwordForm.currentPassword &&
      passwordForm.newPassword &&
      passwordForm.currentPassword === passwordForm.newPassword
    ) {
      errors.newPassword = 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitProfile = async (event) => {
    event.preventDefault();

    if (!validateProfile()) {
      showToast('error', 'กรุณาตรวจสอบข้อมูลในฟอร์ม');
      return;
    }

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      bio: form.bio.trim(),
      specialization: form.specialization.trim(),
      profileImageUrl: form.profileImageUrl.trim(),
    };

    try {
      setSaving(true);

      const updated = await updateMyProfile(payload);
      const normalized = normalizeProfile({
        ...form,
        ...updated,
      });

      setProfile(normalized);
      setForm(normalized);
      showToast('success', 'บันทึกข้อมูลโปรไฟล์สำเร็จ');
    } catch (err) {
      showToast('error', err?.message || 'ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitPassword = async (event) => {
    event.preventDefault();

    if (!validatePassword()) {
      showToast('error', 'กรุณาตรวจสอบข้อมูลรหัสผ่าน');
      return;
    }

    const payload = {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword,
    };

    try {
      setChangingPassword(true);

      await changePassword(payload);
      setPasswordForm(initialPasswordForm);
      showToast('success', 'เปลี่ยนรหัสผ่านสำเร็จ');
    } catch (err) {
      showToast('error', err?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <main className="tp-page">
        <section className="tp-state-card">
          <div className="tp-loader" />
          <h2>กำลังโหลดข้อมูลโปรไฟล์</h2>
          <p>กรุณารอสักครู่ ระบบกำลังดึงข้อมูลติวเตอร์ที่เข้าสู่ระบบ</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="tp-page">
        <section className="tp-state-card tp-state-card-error">
          <div className="tp-state-icon">!</div>
          <h2>โหลดข้อมูลไม่สำเร็จ</h2>
          <p>{error}</p>
          <button type="button" className="tp-primary-button" onClick={loadProfile}>
            โหลดใหม่อีกครั้ง
          </button>
        </section>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="tp-page">
        <section className="tp-state-card">
          <div className="tp-state-icon">?</div>
          <h2>ไม่พบข้อมูลโปรไฟล์</h2>
          <p>ยังไม่มีข้อมูลติวเตอร์สำหรับบัญชีที่เข้าสู่ระบบ</p>
          <button type="button" className="tp-primary-button" onClick={loadProfile}>
            ตรวจสอบอีกครั้ง
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="tp-page">
      {toast && (
        <div className={`tp-toast tp-toast-${toast.type}`} role="status">
          {toast.message}
        </div>
      )}

      <section className="tp-hero">
        <div className="tp-hero-left">
          <div className="tp-avatar">
            <span>{initials}</span>
            {form.profileImageUrl && (
              <img
                src={form.profileImageUrl}
                alt={fullName}
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>

          <div>
            <p className="tp-eyebrow">Tutor Profile</p>
            <h1>{fullName}</h1>
            <p className="tp-hero-subtitle">
              จัดการข้อมูลส่วนตัว ข้อมูลติดต่อ และความเชี่ยวชาญของติวเตอร์
            </p>
          </div>
        </div>

        <div className="tp-hero-meta">
          <div>
            <span>รหัสติวเตอร์</span>
            <strong>{form.tutorCode || '-'}</strong>
          </div>
          <div>
            <span>อีเมล</span>
            <strong>{form.email || '-'}</strong>
          </div>
        </div>
      </section>

      <section className="tp-content-grid">
        <form className="tp-card tp-profile-card" onSubmit={handleSubmitProfile}>
          <div className="tp-card-header">
            <div>
              <h2>ข้อมูลส่วนตัว</h2>
              <p>แก้ไขข้อมูลที่ใช้แสดงในระบบ Tutor School System</p>
            </div>
          </div>

          <div className="tp-readonly-grid">
            <div className="tp-readonly-item">
              <span>Email</span>
              <strong>{form.email || '-'}</strong>
            </div>
            <div className="tp-readonly-item">
              <span>Tutor Code</span>
              <strong>{form.tutorCode || '-'}</strong>
            </div>
          </div>

          <div className="tp-form-grid">
            <div className="tp-form-group">
              <label htmlFor="firstName">ชื่อ</label>
              <input
                id="firstName"
                name="firstName"
                value={form.firstName}
                onChange={handleProfileChange}
                placeholder="กรอกชื่อ"
                className={fieldErrors.firstName ? 'tp-input-error' : ''}
              />
              {fieldErrors.firstName && (
                <small className="tp-error-text">{fieldErrors.firstName}</small>
              )}
            </div>

            <div className="tp-form-group">
              <label htmlFor="lastName">นามสกุล</label>
              <input
                id="lastName"
                name="lastName"
                value={form.lastName}
                onChange={handleProfileChange}
                placeholder="กรอกนามสกุล"
                className={fieldErrors.lastName ? 'tp-input-error' : ''}
              />
              {fieldErrors.lastName && (
                <small className="tp-error-text">{fieldErrors.lastName}</small>
              )}
            </div>

            <div className="tp-form-group">
              <label htmlFor="phoneNumber">เบอร์โทร</label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleProfileChange}
                placeholder="เช่น 0812345678"
                className={fieldErrors.phoneNumber ? 'tp-input-error' : ''}
              />
              {fieldErrors.phoneNumber && (
                <small className="tp-error-text">{fieldErrors.phoneNumber}</small>
              )}
            </div>

            <div className="tp-form-group">
              <label htmlFor="specialization">วิชาที่เชี่ยวชาญ</label>
              <input
                id="specialization"
                name="specialization"
                value={form.specialization}
                onChange={handleProfileChange}
                placeholder="เช่น Mathematics, English, Science"
                className={fieldErrors.specialization ? 'tp-input-error' : ''}
              />
              {fieldErrors.specialization && (
                <small className="tp-error-text">{fieldErrors.specialization}</small>
              )}
            </div>

            <div className="tp-form-group tp-form-group-full">
              <label htmlFor="profileImageUrl">URL รูปโปรไฟล์</label>
              <input
                id="profileImageUrl"
                name="profileImageUrl"
                value={form.profileImageUrl}
                onChange={handleProfileChange}
                placeholder="https://example.com/profile.jpg"
                className={fieldErrors.profileImageUrl ? 'tp-input-error' : ''}
              />
              {fieldErrors.profileImageUrl && (
                <small className="tp-error-text">{fieldErrors.profileImageUrl}</small>
              )}
            </div>

            <div className="tp-form-group tp-form-group-full">
              <label htmlFor="bio">แนะนำตัวเอง</label>
              <textarea
                id="bio"
                name="bio"
                value={form.bio}
                onChange={handleProfileChange}
                placeholder="เขียนแนะนำตัว ประสบการณ์การสอน หรือแนวทางการสอนของคุณ"
                rows="6"
                className={fieldErrors.bio ? 'tp-input-error' : ''}
              />
              <div className="tp-textarea-footer">
                {fieldErrors.bio ? (
                  <small className="tp-error-text">{fieldErrors.bio}</small>
                ) : (
                  <small>{form.bio.length}/1000 ตัวอักษร</small>
                )}
              </div>
            </div>
          </div>

          <div className="tp-card-actions">
            <button
              type="submit"
              className="tp-primary-button"
              disabled={saving}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </form>

        <aside className="tp-side-column">
          <section className="tp-card tp-preview-card">
            <div className="tp-card-header">
              <div>
                <h2>ตัวอย่างโปรไฟล์</h2>
                <p>ข้อมูลที่นักเรียนอาจเห็นจากโปรไฟล์ของคุณ</p>
              </div>
            </div>

            <div className="tp-preview-profile">
              <div className="tp-preview-avatar">
                <span>{initials}</span>
                {form.profileImageUrl && (
                  <img
                    src={form.profileImageUrl}
                    alt={fullName}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>

              <h3>{fullName}</h3>
              <p className="tp-preview-specialization">
                {form.specialization || 'ยังไม่ได้ระบุความเชี่ยวชาญ'}
              </p>
              <p className="tp-preview-bio">
                {form.bio || 'ยังไม่มีข้อมูลแนะนำตัว'}
              </p>
            </div>
          </section>

          <form className="tp-card tp-password-card" onSubmit={handleSubmitPassword}>
            <div className="tp-card-header">
              <div>
                <h2>เปลี่ยนรหัสผ่าน</h2>
                <p>อัปเดตรหัสผ่านเพื่อความปลอดภัยของบัญชี</p>
              </div>
            </div>

            <div className="tp-form-stack">
              <div className="tp-form-group">
                <label htmlFor="currentPassword">รหัสผ่านปัจจุบัน</label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="กรอกรหัสผ่านปัจจุบัน"
                  className={passwordErrors.currentPassword ? 'tp-input-error' : ''}
                />
                {passwordErrors.currentPassword && (
                  <small className="tp-error-text">
                    {passwordErrors.currentPassword}
                  </small>
                )}
              </div>

              <div className="tp-form-group">
                <label htmlFor="newPassword">รหัสผ่านใหม่</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  className={passwordErrors.newPassword ? 'tp-input-error' : ''}
                />
                {passwordErrors.newPassword && (
                  <small className="tp-error-text">
                    {passwordErrors.newPassword}
                  </small>
                )}
              </div>

              <div className="tp-form-group">
                <label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  className={passwordErrors.confirmPassword ? 'tp-input-error' : ''}
                />
                {passwordErrors.confirmPassword && (
                  <small className="tp-error-text">
                    {passwordErrors.confirmPassword}
                  </small>
                )}
              </div>
            </div>

            <div className="tp-card-actions">
              <button
                type="submit"
                className="tp-secondary-button"
                disabled={changingPassword}
              >
                {changingPassword ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'เปลี่ยนรหัสผ่าน'}
              </button>
            </div>
          </form>
        </aside>
      </section>
    </main>
  );
}

export default TutorProfilePage;