import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardCard from '../components/DashboardCard';
import {
  getTutors,
  getTutorById,
  createTutor,
  updateTutor,
  deactivateTutor,
  activateTutor,
  getTutorStats,
} from '../services/adminTutorService';
import './AdminTutorManagementPage.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const AVATAR_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706',
  '#dc2626', '#0891b2', '#9333ea', '#c2410c',
];

function avatarColor(name = '') {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function initials(firstName = '', lastName = '') {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
}

function isActive(tutor) {
  if (tutor.status !== undefined && tutor.status !== null) {
    return tutor.status === 'ACTIVE';
  }
  return tutor.enabled === true;
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ tutor }) {
  const active = isActive(tutor);
  return (
    <span className={`tm-status-badge tm-status-badge--${active ? 'success' : 'error'}`}>
      <span className="tm-status-dot" />
      {active ? 'ใช้งาน' : 'ปิดใช้งาน'}
    </span>
  );
}

// ── TutorAvatar ───────────────────────────────────────────────────────────────

function TutorAvatar({ firstName, lastName, size = 36 }) {
  const color = avatarColor(firstName || '');
  return (
    <div
      className="tm-avatar"
      style={{ width: size, height: size, background: color, fontSize: Math.round(size * 0.37) }}
    >
      {initials(firstName, lastName)}
    </div>
  );
}

// ── DetailRow ─────────────────────────────────────────────────────────────────

function DetailRow({ label, value }) {
  return (
    <div className="tm-detail-row">
      <span className="tm-detail-row-label">{label}</span>
      <span className="tm-detail-row-value">{value || '—'}</span>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ tutor, onClose }) {
  if (!tutor) return null;
  return (
    <div className="tm-modal-overlay" onClick={onClose}>
      <div className="tm-modal tm-modal--detail" onClick={e => e.stopPropagation()}>
        <div className="tm-modal-header">
          <h2 className="tm-modal-title">ข้อมูลติวเตอร์</h2>
          <button className="tm-modal-close" onClick={onClose} aria-label="ปิด">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="tm-modal-body">
          <div className="tm-detail-profile">
            <TutorAvatar firstName={tutor.firstName} lastName={tutor.lastName} size={72} />
            <div className="tm-detail-profile-info">
              <div className="tm-detail-name">{tutor.firstName} {tutor.lastName}</div>
              <div className="tm-detail-code">{tutor.tutorCode || '—'}</div>
              <StatusBadge tutor={tutor} />
            </div>
          </div>

          <div className="tm-detail-grid">
            <div className="tm-detail-section">
              <h3 className="tm-detail-section-title">
                <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                ข้อมูลส่วนตัว
              </h3>
              <div className="tm-detail-rows">
                <DetailRow label="ชื่อ" value={tutor.firstName} />
                <DetailRow label="นามสกุล" value={tutor.lastName} />
                <DetailRow label="เบอร์โทร" value={tutor.phoneNumber} />
              </div>
            </div>

            <div className="tm-detail-section">
              <h3 className="tm-detail-section-title">
                <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                ข้อมูลติดต่อ
              </h3>
              <div className="tm-detail-rows">
                <DetailRow label="Username" value={tutor.username} />
                <DetailRow label="Email" value={tutor.email} />
              </div>
            </div>

            <div className="tm-detail-section tm-detail-section--full">
              <h3 className="tm-detail-section-title">
                <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                ข้อมูลระบบ
              </h3>
              <div className="tm-detail-rows">
                <DetailRow label="รหัสติวเตอร์" value={tutor.tutorCode} />
                <DetailRow label="วันที่เพิ่ม" value={formatDateTime(tutor.createdAt)} />
                <DetailRow label="แก้ไขล่าสุด" value={formatDateTime(tutor.updatedAt)} />
                <DetailRow label="สถานะ" value={<StatusBadge tutor={tutor} />} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FormField ─────────────────────────────────────────────────────────────────

function FormField({ label, name, value, onChange, type = 'text', error, placeholder, required }) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="tm-form-field">
      <label className="tm-form-label">{label}{required && ' *'}</label>
      <div className={isPassword ? 'tm-form-pw-wrap' : undefined}>
        <input
          type={isPassword ? (showPw ? 'text' : 'password') : type}
          name={name}
          value={value}
          onChange={onChange}
          className={`tm-form-input${error ? ' tm-form-input--error' : ''}`}
          placeholder={placeholder || `กรอก${label.replace(' *', '')}...`}
        />
        {isPassword && (
          <button type="button" className="tm-pw-toggle" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
            {showPw ? (
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <span className="tm-form-error">{error}</span>}
    </div>
  );
}

// ── Create Modal ──────────────────────────────────────────────────────────────

const CREATE_INIT = {
  firstName: '', lastName: '', username: '', email: '',
  password: '', phoneNumber: '',
};

function CreateModal({ onClose, onSave, saving, saveError }) {
  const [form, setForm] = useState(CREATE_INIT);
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.firstName.trim())  errs.firstName  = 'กรุณากรอกชื่อ';
    if (!form.lastName.trim())   errs.lastName   = 'กรุณากรอกนามสกุล';
    if (!form.username.trim())   errs.username   = 'กรุณากรอก Username';
    else if (form.username.trim().length < 3) errs.username = 'Username อย่างน้อย 3 ตัวอักษร';
    if (!form.email.trim())      errs.email      = 'กรุณากรอก Email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'รูปแบบ Email ไม่ถูกต้อง';
    if (!form.password)          errs.password   = 'กรุณากรอกรหัสผ่าน';
    else if (form.password.length < 8) errs.password = 'รหัสผ่านอย่างน้อย 8 ตัวอักษร';
    if (!form.phoneNumber.trim())          errs.phoneNumber = 'กรุณากรอกเบอร์โทร';
    else if (!/^[0-9]{10}$/.test(form.phoneNumber.trim())) errs.phoneNumber = 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(form);
  }

  return (
    <div className="tm-modal-overlay" onClick={onClose}>
      <div className="tm-modal tm-modal--create" onClick={e => e.stopPropagation()}>
        <div className="tm-modal-header">
          <div className="tm-modal-header-left">
            <div className="tm-modal-icon">
              <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
            </div>
            <h2 className="tm-modal-title">เพิ่มติวเตอร์</h2>
          </div>
          <button className="tm-modal-close" onClick={onClose} disabled={saving} aria-label="ปิด">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <form className="tm-modal-body" onSubmit={handleSubmit} noValidate>
          {saveError && (
            <div className="tm-modal-error">
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style={{ flexShrink: 0 }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {saveError}
            </div>
          )}

          <div className="tm-form-section">
            <p className="tm-form-section-label">
              <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              ข้อมูลบัญชี
            </p>
            <div className="tm-form-grid">
              <FormField label="Username" name="username" value={form.username} onChange={handleChange} error={errors.username} required />
              <FormField label="Email" name="email" value={form.email} onChange={handleChange} type="email" error={errors.email} required />
              <div className="tm-form-field tm-form-field--full">
                <FormField label="รหัสผ่าน" name="password" value={form.password} onChange={handleChange} type="password" error={errors.password} required placeholder="อย่างน้อย 8 ตัวอักษร" />
              </div>
            </div>
          </div>

          <div className="tm-form-section">
            <p className="tm-form-section-label">
              <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              ข้อมูลส่วนตัว
            </p>
            <div className="tm-form-grid">
              <FormField label="ชื่อ" name="firstName" value={form.firstName} onChange={handleChange} error={errors.firstName} required />
              <FormField label="นามสกุล" name="lastName" value={form.lastName} onChange={handleChange} error={errors.lastName} required />
              <FormField label="เบอร์โทร" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} error={errors.phoneNumber} required />
            </div>
          </div>

          <div className="tm-modal-footer">
            <button type="button" className="tm-btn tm-btn--ghost" onClick={onClose} disabled={saving}>ยกเลิก</button>
            <button type="submit" className="tm-btn tm-btn--primary" disabled={saving}>
              {saving ? (<><span className="tm-btn-spinner" />กำลังบันทึก...</>) : (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  เพิ่มติวเตอร์
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({ tutor, onClose, onSave, saving, saveError }) {
  const [form, setForm] = useState({
    firstName:   tutor?.firstName   || '',
    lastName:    tutor?.lastName    || '',
    phoneNumber: tutor?.phoneNumber || '',
  });
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.firstName.trim())   errs.firstName   = 'กรุณากรอกชื่อ';
    if (!form.lastName.trim())    errs.lastName    = 'กรุณากรอกนามสกุล';
    if (!form.phoneNumber.trim()) errs.phoneNumber = 'กรุณากรอกเบอร์โทร';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(form);
  }

  if (!tutor) return null;
  return (
    <div className="tm-modal-overlay" onClick={onClose}>
      <div className="tm-modal tm-modal--edit" onClick={e => e.stopPropagation()}>
        <div className="tm-modal-header">
          <h2 className="tm-modal-title">แก้ไขข้อมูลติวเตอร์</h2>
          <button className="tm-modal-close" onClick={onClose} disabled={saving} aria-label="ปิด">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <form className="tm-modal-body" onSubmit={handleSubmit} noValidate>
          <div className="tm-edit-label">
            <TutorAvatar firstName={tutor.firstName} lastName={tutor.lastName} size={32} />
            <span>{tutor.firstName} {tutor.lastName}</span>
            <span className="tm-edit-code">{tutor.tutorCode}</span>
          </div>

          {saveError && (
            <div className="tm-modal-error">
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style={{ flexShrink: 0 }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {saveError}
            </div>
          )}

          <div className="tm-form-grid">
            <FormField label="ชื่อ" name="firstName" value={form.firstName} onChange={handleChange} error={errors.firstName} required />
            <FormField label="นามสกุล" name="lastName" value={form.lastName} onChange={handleChange} error={errors.lastName} required />
            <FormField label="เบอร์โทร" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} error={errors.phoneNumber} required />
          </div>

          <div className="tm-modal-footer">
            <button type="button" className="tm-btn tm-btn--ghost" onClick={onClose} disabled={saving}>ยกเลิก</button>
            <button type="submit" className="tm-btn tm-btn--primary" disabled={saving}>
              {saving ? (<><span className="tm-btn-spinner" />กำลังบันทึก...</>) : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({ title, message, confirmLabel, confirmClass, onConfirm, onCancel }) {
  return (
    <div className="tm-modal-overlay" onClick={onCancel}>
      <div className="tm-confirm" onClick={e => e.stopPropagation()}>
        <p className="tm-confirm-title">{title}</p>
        <p className="tm-confirm-msg">{message}</p>
        <div className="tm-confirm-actions">
          <button className="tm-btn tm-btn--ghost" onClick={onCancel}>ยกเลิก</button>
          <button className={`tm-btn ${confirmClass}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function AdminTutorManagementPage() {
  const [tutors, setTutors]               = useState([]);
  const [stats, setStats]                 = useState({ total: 0, active: 0, inactive: 0, newThisMonth: 0 });
  const [loading, setLoading]             = useState(true);
  const [statsLoading, setStatsLoading]   = useState(true);
  const [error, setError]                 = useState('');
  const [searchTerm, setSearchTerm]       = useState('');
  const [currentPage, setCurrentPage]     = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [detailTutor, setDetailTutor]     = useState(null);
  const [editTutor, setEditTutor]         = useState(null);
  const [showCreate, setShowCreate]       = useState(false);
  const [confirm, setConfirm]             = useState(null);
  const [saving, setSaving]               = useState(false);
  const [saveError, setSaveError]         = useState('');
  const [toast, setToast]                 = useState({ type: '', msg: '' });
  const debounceTimer                     = useRef(null);

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: '', msg: '' }), 3500);
  }

  const loadTutors = useCallback(async (page, keyword) => {
    setLoading(true);
    setError('');
    try {
      const data = await getTutors({ page, size: PAGE_SIZE, keyword });
      if (Array.isArray(data)) {
        setTutors(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setTutors(data?.content ?? []);
        setTotalPages(data?.totalPages ?? 1);
        setTotalElements(data?.totalElements ?? 0);
      }
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลติวเตอร์ได้');
    } finally {
      setLoading(false);
    }
  }, []);

  const reloadStats = () => {
    setStatsLoading(true);
    getTutorStats().then(setStats).finally(() => setStatsLoading(false));
  };

  useEffect(() => { reloadStats(); }, []);
  useEffect(() => { loadTutors(0, ''); }, [loadTutors]);

  function handleSearchChange(e) {
    const val = e.target.value;
    setSearchTerm(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setCurrentPage(0);
      loadTutors(0, val);
    }, 400);
  }

  function handlePageChange(page) {
    setCurrentPage(page);
    loadTutors(page, searchTerm);
  }

  async function handleViewDetail(tutor) {
    try {
      const detail = await getTutorById(tutor.id);
      setDetailTutor(detail);
    } catch {
      setDetailTutor(tutor);
    }
  }

  async function handleCreate(formData) {
    setSaving(true); setSaveError('');
    try {
      await createTutor(formData);
      setShowCreate(false);
      showToast('success', 'เพิ่มติวเตอร์สำเร็จ');
      loadTutors(currentPage, searchTerm);
      reloadStats();
    } catch (err) {
      setSaveError(err.message || 'ไม่สามารถเพิ่มติวเตอร์ได้');
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(formData) {
    setSaving(true); setSaveError('');
    try {
      await updateTutor(editTutor.id, formData);
      setEditTutor(null);
      showToast('success', 'บันทึกข้อมูลสำเร็จ');
      loadTutors(currentPage, searchTerm);
      reloadStats();
    } catch (err) {
      setSaveError(err.message || 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSaving(false);
    }
  }

  function askDeactivate(tutor) {
    setConfirm({
      title: 'ปิดการใช้งานติวเตอร์',
      message: `ยืนยันการปิดใช้งานบัญชี "${tutor.firstName} ${tutor.lastName}" ?`,
      confirmLabel: 'ปิดการใช้งาน',
      confirmClass: 'tm-btn--danger',
      onConfirm: async () => {
        setConfirm(null);
        try {
          await deactivateTutor(tutor.id);
          showToast('success', 'ปิดใช้งานบัญชีสำเร็จ');
          loadTutors(currentPage, searchTerm); reloadStats();
        } catch (err) {
          showToast('error', err.message || 'ไม่สามารถปิดใช้งานบัญชีได้');
        }
      },
    });
  }

  function askActivate(tutor) {
    setConfirm({
      title: 'เปิดการใช้งานติวเตอร์',
      message: `ยืนยันการเปิดใช้งานบัญชี "${tutor.firstName} ${tutor.lastName}" ?`,
      confirmLabel: 'เปิดการใช้งาน',
      confirmClass: 'tm-btn--success',
      onConfirm: async () => {
        setConfirm(null);
        try {
          await activateTutor(tutor.id);
          showToast('success', 'เปิดใช้งานบัญชีสำเร็จ');
          loadTutors(currentPage, searchTerm); reloadStats();
        } catch (err) {
          showToast('error', err.message || 'ไม่สามารถเปิดใช้งานบัญชีได้');
        }
      },
    });
  }

  function pageNumbers() {
    const pages = [];
    const MAX = 5;
    let start = Math.max(0, currentPage - 2);
    let end   = Math.min(totalPages - 1, start + MAX - 1);
    if (end - start < MAX - 1) start = Math.max(0, end - MAX + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  return (
    <div className="tm-page">

      {/* ── Header ── */}
      <div className="tm-header">
        <div>
          <h1 className="tm-title">จัดการติวเตอร์</h1>
          <p className="tm-subtitle">จัดการข้อมูลติวเตอร์ทั้งหมดในระบบ</p>
        </div>
        <div className="tm-header-actions">
          <div className="tm-search-wrap">
            <svg className="tm-search-icon" viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              className="tm-search-input"
              placeholder="ค้นหาชื่อ, รหัส, email..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <button className="tm-btn tm-btn--primary" onClick={() => { setSaveError(''); setShowCreate(true); }}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            เพิ่มติวเตอร์
          </button>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast.msg && (
        <div className={`tm-toast tm-toast--${toast.type}`}>
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
          <button className="tm-toast-close" onClick={() => setToast({ type: '', msg: '' })}>×</button>
        </div>
      )}

      {/* ── Stats Cards ── */}
      <div className="tm-stats-grid">
        <DashboardCard
          title="ติวเตอร์ทั้งหมด"
          value={statsLoading ? '...' : stats.total}
          subtitle="ติวเตอร์ที่ลงทะเบียนในระบบ"
          color="blue"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          }
        />
        <DashboardCard
          title="ติวเตอร์ที่ใช้งานอยู่"
          value={statsLoading ? '...' : stats.active}
          subtitle="บัญชีที่ Active อยู่"
          color="green"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          }
        />
        <DashboardCard
          title="เพิ่มใหม่เดือนนี้"
          value={statsLoading ? '...' : stats.newThisMonth}
          subtitle="ติวเตอร์ที่เพิ่มเดือนนี้"
          color="teal"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
          }
        />
        <DashboardCard
          title="ติวเตอร์ที่ปิดใช้งาน"
          value={statsLoading ? '...' : stats.inactive}
          subtitle="บัญชีที่ถูกปิดใช้งาน"
          color="orange"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524L13.477 14.89zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
          }
        />
      </div>

      {/* ── Table Card ── */}
      <div className="tm-table-card">
        <div className="tm-table-card-header">
          <div>
            <h2 className="tm-table-card-title">รายชื่อติวเตอร์</h2>
            {!loading && <span className="tm-table-card-count">ทั้งหมด {totalElements} คน</span>}
          </div>
        </div>

        {loading && (
          <div className="tm-loading">
            <div className="tm-spinner" />
            <span>กำลังโหลดข้อมูล...</span>
          </div>
        )}

        {!loading && error && (
          <div className="tm-error-card">
            <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" style={{ flexShrink: 0 }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div style={{ flex: 1 }}>
              <p className="tm-error-title">โหลดข้อมูลไม่สำเร็จ</p>
              <p className="tm-error-msg">{error}</p>
            </div>
            <button className="tm-btn tm-btn--ghost" onClick={() => loadTutors(currentPage, searchTerm)}>ลองใหม่</button>
          </div>
        )}

        {!loading && !error && tutors.length === 0 && (
          <div className="tm-empty">
            <div className="tm-empty-icon">
              <svg viewBox="0 0 20 20" fill="currentColor" width="36" height="36">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="tm-empty-title">ไม่พบข้อมูลติวเตอร์</p>
            <p className="tm-empty-subtitle">
              {searchTerm ? `ไม่พบผลลัพธ์สำหรับ "${searchTerm}"` : 'ยังไม่มีติวเตอร์ในระบบ'}
            </p>
            {!searchTerm && (
              <button className="tm-btn tm-btn--primary" onClick={() => { setSaveError(''); setShowCreate(true); }}>
                เพิ่มติวเตอร์คนแรก
              </button>
            )}
          </div>
        )}

        {!loading && !error && tutors.length > 0 && (
          <>
            <div className="tm-table-wrap">
              <table className="tm-table">
                <thead>
                  <tr>
                    <th>ติวเตอร์</th>
                    <th>รหัสติวเตอร์</th>
                    <th>USERNAME</th>
                    <th>EMAIL</th>
                    <th>เบอร์โทร</th>
                    <th>วันที่เพิ่ม</th>
                    <th>สถานะ</th>
                    <th>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {tutors.map(tutor => (
                    <tr key={tutor.id} className="tm-table-row">
                      <td>
                        <div className="tm-tutor-cell">
                          <TutorAvatar firstName={tutor.firstName} lastName={tutor.lastName} />
                          <div className="tm-tutor-name">{tutor.firstName} {tutor.lastName}</div>
                        </div>
                      </td>
                      <td>
                        <span className="tm-code-badge">{tutor.tutorCode || '—'}</span>
                      </td>
                      <td className="tm-text-mono">{tutor.username || '—'}</td>
                      <td className="tm-text-email">{tutor.email || '—'}</td>
                      <td className="tm-text-secondary">{tutor.phoneNumber || '—'}</td>
                      <td className="tm-text-date">{formatDate(tutor.createdAt)}</td>
                      <td><StatusBadge tutor={tutor} /></td>
                      <td>
                        <div className="tm-row-actions">
                          <button
                            className="tm-row-btn tm-row-btn--icon"
                            onClick={() => handleViewDetail(tutor)}
                            data-tooltip="ดูรายละเอียด"
                            aria-label="ดูรายละเอียด"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            className="tm-row-btn tm-row-btn--icon"
                            onClick={() => { setSaveError(''); setEditTutor(tutor); }}
                            data-tooltip="แก้ไข"
                            aria-label="แก้ไข"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          {isActive(tutor) ? (
                            <button
                              className="tm-row-btn tm-row-btn--danger"
                              onClick={() => askDeactivate(tutor)}
                              data-tooltip="ปิดการใช้งาน"
                              aria-label="ปิดการใช้งาน"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524L13.477 14.89zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                              </svg>
                              <span>ปิดการใช้งาน</span>
                            </button>
                          ) : (
                            <button
                              className="tm-row-btn tm-row-btn--activate"
                              onClick={() => askActivate(tutor)}
                              data-tooltip="เปิดการใช้งาน"
                              aria-label="เปิดการใช้งาน"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>เปิดการใช้งาน</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="tm-pagination">
                <span className="tm-pagination-info">
                  หน้า {currentPage + 1} จาก {totalPages} &bull; ทั้งหมด {totalElements} รายการ
                </span>
                <div className="tm-pagination-controls">
                  <button className="tm-page-btn" disabled={currentPage === 0} onClick={() => handlePageChange(currentPage - 1)}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {pageNumbers().map(p => (
                    <button key={p} className={`tm-page-btn${p === currentPage ? ' tm-page-btn--active' : ''}`} onClick={() => handlePageChange(p)}>
                      {p + 1}
                    </button>
                  ))}
                  <button className="tm-page-btn" disabled={currentPage >= totalPages - 1} onClick={() => handlePageChange(currentPage + 1)}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {detailTutor && <DetailModal tutor={detailTutor} onClose={() => setDetailTutor(null)} />}

      {showCreate && (
        <CreateModal
          onClose={() => { setShowCreate(false); setSaveError(''); }}
          onSave={handleCreate}
          saving={saving}
          saveError={saveError}
        />
      )}

      {editTutor && (
        <EditModal
          tutor={editTutor}
          onClose={() => { setEditTutor(null); setSaveError(''); }}
          onSave={handleSave}
          saving={saving}
          saveError={saveError}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          confirmClass={confirm.confirmClass}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
