import { useEffect, useMemo, useState } from 'react';
import { getMyProfile, updateMyProfile } from '../services/studentProfileService';
import './StudentProfilePage.css';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  phoneNumber: '',
  guardianPhoneNumber: '',
  birthDate: '',
  address: '',
  bankName: '',
  bankAccountName: '',
  bankAccountNumber: '',
};

function StudentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', msg: '' });

  const initials = useMemo(() => {
    const first = profile?.firstName?.trim()?.charAt(0) || '';
    const last = profile?.lastName?.trim()?.charAt(0) || '';

    if (first || last) return `${first}${last}`;

    return profile?.fullName?.trim()?.charAt(0) || 'S';
  }, [profile]);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!toast.msg) return;

    const timer = setTimeout(() => {
      setToast({ type: '', msg: '' });
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await getMyProfile();
      setProfile(data);
    } catch (err) {
      showToast(
        'error',
        err?.response?.data?.message ||
          err?.message ||
          'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ'
      );
    } finally {
      setLoading(false);
    }
  }

  function showToast(type, msg) {
    setToast({ type, msg });
  }

  function openEdit() {
    if (!profile) return;

    setForm({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phoneNumber: profile.phoneNumber || '',
      guardianPhoneNumber: profile.guardianPhoneNumber || '',
      birthDate: profile.birthDate ? String(profile.birthDate).split('T')[0] : '',
      address: profile.address || '',
      bankName: profile.bankName || '',
      bankAccountName: profile.bankAccountName || '',
      bankAccountNumber: profile.bankAccountNumber || '',
    });

    setEditOpen(true);
  }

  function closeEdit() {
    if (saving) return;
    setEditOpen(false);
    setForm(EMPTY_FORM);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function validateForm() {
    if (!form.phoneNumber.trim()) {
      showToast('error', 'กรุณากรอกเบอร์โทรศัพท์');
      return false;
    }

    return true;
  }

  async function handleSave(e) {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
      firstName: form.firstName.trim() || null,
      lastName: form.lastName.trim() || null,
      phoneNumber: form.phoneNumber.trim(),
      address: form.address.trim() || null,
      birthDate: form.birthDate || null,
      guardianPhoneNumber: form.guardianPhoneNumber.trim() || null,
      bankName: form.bankName.trim() || null,
      bankAccountName: form.bankAccountName.trim() || null,
      bankAccountNumber: form.bankAccountNumber.trim() || null,
    };

    try {
      setSaving(true);

      const updated = await updateMyProfile(payload);

      setProfile(updated);
      setEditOpen(false);
      showToast('success', 'บันทึกข้อมูลสำเร็จ');

      await loadProfile();
    } catch (err) {
      showToast(
        'error',
        err?.response?.data?.message ||
          err?.message ||
          'บันทึกข้อมูลไม่สำเร็จ'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="sp-page">
        <div className="sp-loading-card">
          <div className="sp-spinner" />
          <p>กำลังโหลดข้อมูลโปรไฟล์...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="sp-page">
        <div className="sp-empty-card">
          <h2>ไม่พบข้อมูลโปรไฟล์</h2>
          <p>กรุณาลองโหลดหน้าใหม่อีกครั้ง</p>
        </div>

        <Toast toast={toast} />
      </div>
    );
  }

  return (
    <div className="sp-page">
      <Toast toast={toast} />

      <section className="sp-hero-card">
        <div className="sp-hero-left">
          <div className="sp-avatar">{initials}</div>

          <div>
            <p className="sp-kicker">Student Profile</p>
            <h1>{profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`}</h1>

            <div className="sp-hero-meta">
              <span>{profile.studentCode || '-'}</span>
            </div>
          </div>
        </div>

        <button type="button" className="sp-primary-btn" onClick={openEdit}>
          แก้ไขโปรไฟล์
        </button>
      </section>

      <div className="sp-grid">
        <InfoCard title="ข้อมูลส่วนตัว" subtitle="ข้อมูลพื้นฐานของนักเรียน">
          <InfoRow label="ชื่อ" value={profile.firstName} />
          <InfoRow label="นามสกุล" value={profile.lastName} />
          <InfoRow label="วันเกิด" value={formatDate(profile.birthDate)} />
          <InfoRow label="ที่อยู่" value={profile.address} full />
        </InfoCard>

        <InfoCard title="ข้อมูลติดต่อ" subtitle="ช่องทางติดต่อและบัญชีผู้ใช้">
          <InfoRow label="ชื่อผู้ใช้" value={profile.username} />
          <InfoRow label="อีเมล" value={profile.email} />
          <InfoRow label="เบอร์โทร" value={profile.phoneNumber} />
          <InfoRow label="เบอร์ผู้ปกครอง" value={profile.guardianPhoneNumber} />
        </InfoCard>

        <InfoCard title="ข้อมูลธนาคาร" subtitle="ข้อมูลบัญชีสำหรับการชำระเงิน">
          <InfoRow label="ธนาคาร" value={profile.bankName} />
          <InfoRow label="ชื่อบัญชี" value={profile.bankAccountName} />
          <InfoRow label="เลขบัญชี" value={profile.bankAccountNumber} />
        </InfoCard>

        <InfoCard title="ข้อมูลระบบ" subtitle="ข้อมูลวันที่ในระบบ">
          <InfoRow label="วันที่สมัคร" value={formatDateTime(profile.createdAt)} />
          <InfoRow label="แก้ไขล่าสุด" value={formatDateTime(profile.updatedAt)} />
          <InfoRow label="User ID" value={profile.userId} />
          <InfoRow label="Student ID" value={profile.id} />
        </InfoCard>
      </div>

      {editOpen && (
        <div className="sp-modal-backdrop" onClick={closeEdit}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sp-modal-header">
              <div>
                <h2>แก้ไขโปรไฟล์</h2>
                <p>แก้ไขข้อมูลส่วนตัวของคุณ</p>
              </div>

              <button type="button" className="sp-icon-btn" onClick={closeEdit}>
                ×
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="sp-form-grid">
                <Field
                  label="รหัสนักเรียน"
                  name="studentCode"
                  value={profile.studentCode || ''}
                  disabled
                />

                <Field
                  label="ชื่อผู้ใช้"
                  name="username"
                  value={profile.username || ''}
                  disabled
                />

                <Field
                  label="อีเมล"
                  name="email"
                  value={profile.email || ''}
                  disabled
                />

                <Field
                  label="ชื่อ"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                />

                <Field
                  label="นามสกุล"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                />

                <Field
                  label="เบอร์โทรศัพท์"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  required
                />

                <Field
                  label="เบอร์โทรผู้ปกครอง"
                  name="guardianPhoneNumber"
                  value={form.guardianPhoneNumber}
                  onChange={handleChange}
                />

                <Field
                  label="วันเกิด"
                  name="birthDate"
                  type="date"
                  value={form.birthDate}
                  onChange={handleChange}
                />

                <Field
                  label="ธนาคาร"
                  name="bankName"
                  value={form.bankName}
                  onChange={handleChange}
                />

                <Field
                  label="ชื่อบัญชีธนาคาร"
                  name="bankAccountName"
                  value={form.bankAccountName}
                  onChange={handleChange}
                />

                <Field
                  label="เลขบัญชีธนาคาร"
                  name="bankAccountNumber"
                  value={form.bankAccountNumber}
                  onChange={handleChange}
                />

                <div className="sp-field sp-field-full">
                  <label htmlFor="address">ที่อยู่</label>
                  <textarea
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    rows="4"
                    placeholder="กรอกที่อยู่"
                  />
                </div>
              </div>

              <div className="sp-modal-actions">
                <button
                  type="button"
                  className="sp-secondary-btn"
                  onClick={closeEdit}
                  disabled={saving}
                >
                  ยกเลิก
                </button>

                <button type="submit" className="sp-primary-btn" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="sp-btn-spinner" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    'บันทึกข้อมูล'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, subtitle, children }) {
  return (
    <section className="sp-card">
      <div className="sp-card-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className="sp-info-list">{children}</div>
    </section>
  );
}

function InfoRow({ label, value, full = false }) {
  return (
    <div className={full ? 'sp-info-row sp-info-row-full' : 'sp-info-row'}>
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  disabled = false,
  type = 'text',
  required = false,
}) {
  return (
    <div className="sp-field">
      <label htmlFor={name}>
        {label}
        {required && <span className="sp-required"> *</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        required={required}
        placeholder={label}
      />
    </div>
  );
}

function Toast({ toast }) {
  if (!toast.msg) return null;

  return (
    <div className={`sp-toast sp-toast-${toast.type}`}>
      {toast.msg}
    </div>
  );
}

function formatDate(value) {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return '-';

  return new Date(value).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default StudentProfilePage;