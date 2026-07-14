import { useState, useEffect, useRef } from 'react';
import {
  getInstitutionProfile,
  updateInstitutionProfile,
  uploadInstitutionImage,
} from '../services/adminSettingsService';
import './AdminSettingsPage.css';

const THAI_BANKS = [
  'กสิกรไทย', 'กรุงเทพ', 'กรุงไทย', 'กรุงศรีอยุธยา', 'ไทยพาณิชย์',
  'ทหารไทยธนชาต', 'ออมสิน', 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร',
  'ซีไอเอ็มบีไทย', 'ยูโอบี', 'ธนาคารอาคารสงเคราะห์',
];

function toForm(profile) {
  return {
    institutionName: profile?.institutionName || '',
    address: profile?.address || '',
    phoneNumber: profile?.phoneNumber || '',
    email: profile?.email || '',
    logoUrl: profile?.logoUrl || '',
    bankName: profile?.bankName || '',
    bankAccountName: profile?.bankAccountName || '',
    bankAccountNumber: profile?.bankAccountNumber || '',
    bankQrCode: profile?.bankQrCode || '',
  };
}

function formatDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Form Field ────────────────────────────────────────────────────────────────

function FormField({ label, name, value, onChange, error, required, type = 'text', disabled }) {
  return (
    <div className="is-form-field">
      <label className="is-form-label">
        {label}{required && <span className="is-required"> *</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`is-form-input${error ? ' is-form-input--error' : ''}`}
        placeholder={disabled ? '' : `กรอก${label}...`}
      />
      {error && <span className="is-form-error">{error}</span>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [profile, setProfile]       = useState(null);
  const [form, setForm]             = useState(toForm(null));
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState('');
  const [errors, setErrors]         = useState({});
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState('');
  const [toast, setToast]           = useState({ type: '', msg: '' });
  const [logoUploading, setLogoUploading] = useState(false);
  const [qrUploading, setQrUploading]     = useState(false);
  const logoInputRef = useRef(null);
  const qrInputRef   = useRef(null);

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: '', msg: '' }), 3500);
  }

  function load() {
    setLoading(true);
    setLoadError('');
    getInstitutionProfile()
      .then((data) => {
        setProfile(data);
        setForm(toForm(data));
      })
      .catch((err) => setLoadError(err.message || 'ไม่สามารถโหลดข้อมูลสถาบันได้'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const isDirty = profile ? JSON.stringify(toForm(profile)) !== JSON.stringify(form) : false;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function handleReset() {
    if (profile) setForm(toForm(profile));
    setErrors({});
    setSaveError('');
  }

  async function handleLogoFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setLogoUploading(true);
    try {
      const url = await uploadInstitutionImage(file);
      setForm((prev) => ({ ...prev, logoUrl: url }));
    } catch (err) {
      showToast('error', err.message || 'อัปโหลดโลโก้ไม่สำเร็จ');
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleQrFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setQrUploading(true);
    try {
      const url = await uploadInstitutionImage(file);
      setForm((prev) => ({ ...prev, bankQrCode: url }));
    } catch (err) {
      showToast('error', err.message || 'อัปโหลด QR Code ไม่สำเร็จ');
    } finally {
      setQrUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.institutionName.trim()) errs.institutionName = 'กรุณากรอกชื่อสถาบัน';
    if (!form.phoneNumber.trim()) errs.phoneNumber = 'กรุณากรอกเบอร์โทรศัพท์';
    if (!form.email.trim()) errs.email = 'กรุณากรอกอีเมล';
    else if (!EMAIL_RE.test(form.email.trim())) errs.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    setSaveError('');
    try {
      const updated = await updateInstitutionProfile(form);
      setProfile(updated);
      setForm(toForm(updated));
      showToast('success', 'บันทึกข้อมูลสถาบันสำเร็จ');
    } catch (err) {
      setSaveError(err.message || 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="is-page">

      {/* ── Header ── */}
      <div className="is-header">
        <div>
          <h1 className="is-title">ตั้งค่าสถาบัน</h1>
          <p className="is-subtitle">จัดการข้อมูลสถาบัน ช่องทางติดต่อ และบัญชีธนาคารสำหรับรับชำระเงิน</p>
        </div>
        {profile && (
          <div className="is-header-meta">
            <span className="is-meta-text">แก้ไขล่าสุด {formatDateTime(profile.updatedAt)}</span>
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast.msg && (
        <div className={`is-toast is-toast--${toast.type}`}>
          {toast.type === 'success' ? (
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          <span>{toast.msg}</span>
          <button className="is-toast-close" onClick={() => setToast({ type: '', msg: '' })}>×</button>
        </div>
      )}

      {loading && (
        <div className="is-loading">
          <div className="is-spinner" />
          <span>กำลังโหลดข้อมูลสถาบัน...</span>
        </div>
      )}

      {!loading && loadError && (
        <div className="is-error-card">
          <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" style={{ flexShrink: 0 }}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div style={{ flex: 1 }}>
            <p className="is-error-title">โหลดข้อมูลไม่สำเร็จ</p>
            <p className="is-error-msg">{loadError}</p>
          </div>
          <button className="is-btn is-btn--ghost" onClick={load}>ลองใหม่</button>
        </div>
      )}

      {!loading && !loadError && (
        <form className="is-form" onSubmit={handleSubmit} noValidate>
          {saveError && (
            <div className="is-form-banner">
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {saveError}
            </div>
          )}

          <div className="is-grid">

            {/* ── General Info Card ── */}
            <div className="is-card">
              <div className="is-card-header">
                <h2 className="is-card-title">ข้อมูลทั่วไป</h2>
                <p className="is-card-subtitle">ชื่อ โลโก้ และช่องทางติดต่อของสถาบัน</p>
              </div>
              <div className="is-card-body">
                <div className="is-logo-row">
                  <div className="is-logo-preview">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="โลโก้สถาบัน" />
                    ) : (
                      <span className="is-logo-placeholder">
                        {(form.institutionName || 'S').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="is-media-actions">
                    <input
                      type="file" accept="image/*" hidden
                      ref={logoInputRef} onChange={handleLogoFile}
                    />
                    <div className="is-media-buttons">
                      <button
                        type="button" className="is-btn is-btn--ghost is-btn--sm"
                        onClick={() => logoInputRef.current?.click()} disabled={logoUploading}
                      >
                        {logoUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดโลโก้'}
                      </button>
                      {form.logoUrl && (
                        <button
                          type="button" className="is-btn is-btn--ghost is-btn--sm is-btn--danger-text"
                          onClick={() => setForm((prev) => ({ ...prev, logoUrl: '' }))}
                        >
                          ลบโลโก้
                        </button>
                      )}
                    </div>
                    <p className="is-hint">รองรับไฟล์รูปภาพ JPG, PNG</p>
                  </div>
                </div>

                <div className="is-form-grid">
                  <FormField
                    label="ชื่อสถาบัน" name="institutionName" required
                    value={form.institutionName} onChange={handleChange} error={errors.institutionName}
                  />
                  <FormField
                    label="อีเมล" name="email" type="email" required
                    value={form.email} onChange={handleChange} error={errors.email}
                  />
                  <FormField
                    label="เบอร์โทรศัพท์" name="phoneNumber" required
                    value={form.phoneNumber} onChange={handleChange} error={errors.phoneNumber}
                  />
                  <div className="is-form-field is-form-field--full">
                    <label className="is-form-label">ที่อยู่</label>
                    <textarea
                      name="address" value={form.address} onChange={handleChange}
                      className="is-form-textarea" rows={3} placeholder="กรอกที่อยู่สถาบัน..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Bank Account Card ── */}
            <div className="is-card">
              <div className="is-card-header">
                <h2 className="is-card-title">บัญชีธนาคารสำหรับรับชำระเงิน</h2>
                <p className="is-card-subtitle">ข้อมูลนี้จะแสดงให้นักเรียนใช้สำหรับโอนค่าเรียน</p>
              </div>
              <div className="is-card-body">
                <div className="is-form-grid">
                  <div className="is-form-field">
                    <label className="is-form-label">ธนาคาร</label>
                    <input
                      className="is-form-input" name="bankName" list="is-bank-options"
                      value={form.bankName} onChange={handleChange}
                      placeholder="เลือกหรือพิมพ์ชื่อธนาคาร..."
                    />
                    <datalist id="is-bank-options">
                      {THAI_BANKS.map((b) => <option key={b} value={b} />)}
                    </datalist>
                  </div>
                  <FormField
                    label="ชื่อบัญชี" name="bankAccountName"
                    value={form.bankAccountName} onChange={handleChange}
                  />
                  <FormField
                    label="เลขบัญชี" name="bankAccountNumber"
                    value={form.bankAccountNumber} onChange={handleChange}
                  />
                </div>

                <div className="is-logo-row">
                  <div className="is-qr-preview">
                    {form.bankQrCode ? (
                      <img src={form.bankQrCode} alt="QR พร้อมเพย์" />
                    ) : (
                      <span className="is-qr-placeholder">ไม่มี QR Code</span>
                    )}
                  </div>
                  <div className="is-media-actions">
                    <input
                      type="file" accept="image/*" hidden
                      ref={qrInputRef} onChange={handleQrFile}
                    />
                    <div className="is-media-buttons">
                      <button
                        type="button" className="is-btn is-btn--ghost is-btn--sm"
                        onClick={() => qrInputRef.current?.click()} disabled={qrUploading}
                      >
                        {qrUploading ? 'กำลังอัปโหลด...' : 'อัปโหลด QR Code'}
                      </button>
                      {form.bankQrCode && (
                        <button
                          type="button" className="is-btn is-btn--ghost is-btn--sm is-btn--danger-text"
                          onClick={() => setForm((prev) => ({ ...prev, bankQrCode: '' }))}
                        >
                          ลบ QR Code
                        </button>
                      )}
                    </div>
                    <p className="is-hint">รูป QR พร้อมเพย์สำหรับให้นักเรียนสแกนชำระเงิน</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Action Bar ── */}
          <div className="is-action-bar">
            <span className="is-action-bar-status">
              {isDirty ? 'มีการเปลี่ยนแปลงที่ยังไม่บันทึก' : 'ข้อมูลล่าสุดถูกบันทึกแล้ว'}
            </span>
            <div className="is-action-bar-buttons">
              <button
                type="button" className="is-btn is-btn--ghost"
                onClick={handleReset} disabled={!isDirty || saving}
              >
                ยกเลิกการแก้ไข
              </button>
              <button
                type="submit" className="is-btn is-btn--primary"
                disabled={!isDirty || saving}
              >
                {saving ? (<><span className="is-btn-spinner" />กำลังบันทึก...</>) : 'บันทึกการเปลี่ยนแปลง'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
