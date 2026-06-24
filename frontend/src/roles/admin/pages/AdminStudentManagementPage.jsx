import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardCard from '../components/DashboardCard';
import {
  getStudents,
  getStudentById,
  updateStudent,
  deactivateStudent,
  getStudentStats,
} from '../services/adminStudentService';
import './AdminStudentManagementPage.css';

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
  '#2563eb', '#7c3aed', '#059669', '#d97706',
  '#dc2626', '#0891b2', '#9333ea', '#16a34a',
];

function avatarColor(name = '') {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function initials(firstName = '', lastName = '') {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
}

// Accepts both `status` string ("ACTIVE"/"INACTIVE") and `enabled` boolean
function isActive(student) {
  if (student.status !== undefined && student.status !== null) {
    return student.status === 'ACTIVE';
  }
  return student.enabled === true;
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ student }) {
  const active = isActive(student);
  return (
    <span className={`sm-status-badge sm-status-badge--${active ? 'success' : 'error'}`}>
      <span className="sm-status-dot" />
      {active ? 'ใช้งาน' : 'ปิดใช้งาน'}
    </span>
  );
}

// ── StudentAvatar ─────────────────────────────────────────────────────────────

function StudentAvatar({ firstName, lastName, size = 36 }) {
  const color = avatarColor(firstName || '');
  return (
    <div
      className="sm-avatar"
      style={{ width: size, height: size, background: color, fontSize: Math.round(size * 0.37) }}
    >
      {initials(firstName, lastName)}
    </div>
  );
}

// ── DetailRow ─────────────────────────────────────────────────────────────────

function DetailRow({ label, value }) {
  return (
    <div className="sm-detail-row">
      <span className="sm-detail-row-label">{label}</span>
      <span className="sm-detail-row-value">{value || '—'}</span>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ student, onClose }) {
  if (!student) return null;
  return (
    <div className="sm-modal-overlay" onClick={onClose}>
      <div className="sm-modal sm-modal--detail" onClick={e => e.stopPropagation()}>
        <div className="sm-modal-header">
          <h2 className="sm-modal-title">ข้อมูลนักเรียน</h2>
          <button className="sm-modal-close" onClick={onClose} aria-label="ปิด">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="sm-modal-body">
          {/* Profile + QR */}
          <div className="sm-detail-profile">
            <StudentAvatar firstName={student.firstName} lastName={student.lastName} size={72} />
            <div className="sm-detail-profile-info">
              <div className="sm-detail-name">{student.firstName} {student.lastName}</div>
              <div className="sm-detail-code">{student.studentCode || '—'}</div>
              <StatusBadge student={student} />
            </div>
            <div className="sm-detail-qr">
              <div className="sm-qr-box">
                <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
                  <rect x="2" y="2" width="24" height="24" rx="2" stroke="#111827" strokeWidth="3" fill="none" />
                  <rect x="8" y="8" width="12" height="12" rx="1" fill="#111827" />
                  <rect x="54" y="2" width="24" height="24" rx="2" stroke="#111827" strokeWidth="3" fill="none" />
                  <rect x="60" y="8" width="12" height="12" rx="1" fill="#111827" />
                  <rect x="2" y="54" width="24" height="24" rx="2" stroke="#111827" strokeWidth="3" fill="none" />
                  <rect x="8" y="60" width="12" height="12" rx="1" fill="#111827" />
                  <rect x="32" y="2" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="40" y="2" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="32" y="10" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="48" y="10" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="40" y="18" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="2" y="32" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="10" y="32" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="26" y="32" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="34" y="32" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="50" y="32" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="58" y="32" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="66" y="32" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="74" y="32" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="2" y="40" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="18" y="40" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="34" y="40" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="42" y="40" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="58" y="40" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="74" y="40" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="10" y="48" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="26" y="48" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="50" y="48" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="34" y="56" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="58" y="56" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="74" y="56" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="42" y="64" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="66" y="64" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="58" y="72" width="6" height="6" rx="1" fill="#111827" />
                  <rect x="74" y="72" width="6" height="6" rx="1" fill="#111827" />
                </svg>
              </div>
              <p className="sm-qr-code-text">{student.studentCode || '—'}</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="sm-detail-grid">
            <div className="sm-detail-section">
              <h3 className="sm-detail-section-title">
                <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                ข้อมูลส่วนตัว
              </h3>
              <div className="sm-detail-rows">
                <DetailRow label="ชื่อ" value={student.firstName} />
                <DetailRow label="นามสกุล" value={student.lastName} />
                <DetailRow label="วันเกิด" value={formatDate(student.birthDate)} />
                <DetailRow label="ที่อยู่" value={student.address} />
              </div>
            </div>

            <div className="sm-detail-section">
              <h3 className="sm-detail-section-title">
                <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                ข้อมูลติดต่อ
              </h3>
              <div className="sm-detail-rows">
                <DetailRow label="Username" value={student.username} />
                <DetailRow label="Email" value={student.email} />
                <DetailRow label="เบอร์โทร" value={student.phoneNumber} />
                <DetailRow label="เบอร์ผู้ปกครอง" value={student.guardianPhoneNumber} />
              </div>
            </div>

            <div className="sm-detail-section">
              <h3 className="sm-detail-section-title">
                <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                ข้อมูลบัญชีธนาคาร
              </h3>
              <div className="sm-detail-rows">
                <DetailRow label="ธนาคาร" value={student.bankName} />
                <DetailRow label="ชื่อบัญชี" value={student.bankAccountName} />
                <DetailRow label="เลขบัญชี" value={student.bankAccountNumber} />
              </div>
            </div>

            <div className="sm-detail-section">
              <h3 className="sm-detail-section-title">
                <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                ข้อมูลระบบ
              </h3>
              <div className="sm-detail-rows">
                <DetailRow label="วันที่สมัคร" value={formatDateTime(student.createdAt)} />
                <DetailRow label="แก้ไขล่าสุด" value={formatDateTime(student.updatedAt)} />
                <DetailRow label="สถานะ" value={<StatusBadge student={student} />} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Form Field ────────────────────────────────────────────────────────────────

function FormField({ label, name, value, onChange, type = 'text', error }) {
  return (
    <div className="sm-form-field">
      <label className="sm-form-label">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`sm-form-input${error ? ' sm-form-input--error' : ''}`}
        placeholder={`กรอก${label.replace(' *', '')}...`}
      />
      {error && <span className="sm-form-error">{error}</span>}
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({ student, onClose, onSave, saving, saveError }) {
  const [form, setForm] = useState({
    firstName:          student?.firstName          || '',
    lastName:           student?.lastName           || '',
    phoneNumber:        student?.phoneNumber        || '',
    guardianPhoneNumber:student?.guardianPhoneNumber|| '',
    address:            student?.address            || '',
    birthDate:          student?.birthDate ? String(student.birthDate).split('T')[0] : '',
    bankName:           student?.bankName           || '',
    bankAccountName:    student?.bankAccountName    || '',
    bankAccountNumber:  student?.bankAccountNumber  || '',
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
    if (!form.firstName.trim()) errs.firstName = 'กรุณากรอกชื่อ';
    if (!form.lastName.trim())  errs.lastName  = 'กรุณากรอกนามสกุล';
    if (!form.phoneNumber.trim()) errs.phoneNumber = 'กรุณากรอกเบอร์โทร';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(form);
  }

  if (!student) return null;
  return (
    <div className="sm-modal-overlay" onClick={onClose}>
      <div className="sm-modal sm-modal--edit" onClick={e => e.stopPropagation()}>
        <div className="sm-modal-header">
          <h2 className="sm-modal-title">แก้ไขข้อมูลนักเรียน</h2>
          <button className="sm-modal-close" onClick={onClose} disabled={saving} aria-label="ปิด">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <form className="sm-modal-body" onSubmit={handleSubmit} noValidate>
          <div className="sm-edit-student-label">
            <StudentAvatar firstName={student.firstName} lastName={student.lastName} size={32} />
            <span>{student.firstName} {student.lastName}</span>
            <span className="sm-edit-code">{student.studentCode}</span>
          </div>

          {saveError && (
            <div className="sm-modal-error">
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {saveError}
            </div>
          )}

          <div className="sm-form-grid">
            <FormField label="ชื่อ *"     name="firstName"   value={form.firstName}   onChange={handleChange} error={errors.firstName} />
            <FormField label="นามสกุล *"  name="lastName"    value={form.lastName}    onChange={handleChange} error={errors.lastName} />
            <FormField label="เบอร์โทร *" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} error={errors.phoneNumber} />
            <FormField label="เบอร์โทรผู้ปกครอง" name="guardianPhoneNumber" value={form.guardianPhoneNumber} onChange={handleChange} />
            <FormField label="วันเกิด"   name="birthDate"   type="date" value={form.birthDate} onChange={handleChange} />
            <FormField label="ธนาคาร"    name="bankName"    value={form.bankName}    onChange={handleChange} />
            <FormField label="ชื่อบัญชี" name="bankAccountName"   value={form.bankAccountName}   onChange={handleChange} />
            <FormField label="เลขบัญชี"  name="bankAccountNumber" value={form.bankAccountNumber} onChange={handleChange} />
            <div className="sm-form-field sm-form-field--full">
              <label className="sm-form-label">ที่อยู่</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                className="sm-form-textarea"
                rows={3}
                placeholder="กรอกที่อยู่..."
              />
            </div>
          </div>

          <div className="sm-modal-footer">
            <button type="button" className="sm-btn sm-btn--ghost" onClick={onClose} disabled={saving}>
              ยกเลิก
            </button>
            <button type="submit" className="sm-btn sm-btn--primary" disabled={saving}>
              {saving ? (<><span className="sm-btn-spinner" />กำลังบันทึก...</>) : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function AdminStudentManagementPage() {
  const [students, setStudents]           = useState([]);
  const [stats, setStats]                 = useState({ total: 0, active: 0, inactive: 0, newThisMonth: 0 });
  const [loading, setLoading]             = useState(true);
  const [statsLoading, setStatsLoading]   = useState(true);
  const [error, setError]                 = useState('');
  const [searchTerm, setSearchTerm]       = useState('');
  const [currentPage, setCurrentPage]     = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [detailStudent, setDetailStudent] = useState(null);
  const [editStudent, setEditStudent]     = useState(null);
  const [saving, setSaving]               = useState(false);
  const [saveError, setSaveError]         = useState('');
  const [toast, setToast]                 = useState({ type: '', msg: '' });
  const debounceTimer                     = useRef(null);

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: '', msg: '' }), 3500);
  }

  const loadStudents = useCallback(async (page, keyword) => {
    setLoading(true);
    setError('');
    try {
      const data = await getStudents({ page, size: PAGE_SIZE, keyword });
      if (Array.isArray(data)) {
        setStudents(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setStudents(data?.content ?? []);
        setTotalPages(data?.totalPages ?? 1);
        setTotalElements(data?.totalElements ?? 0);
      }
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลนักเรียนได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setStatsLoading(true);
    getStudentStats()
      .then(setStats)
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    loadStudents(0, '');
  }, [loadStudents]);

  function handleSearchChange(e) {
    const val = e.target.value;
    setSearchTerm(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setCurrentPage(0);
      loadStudents(0, val);
    }, 400);
  }

  function handlePageChange(page) {
    setCurrentPage(page);
    loadStudents(page, searchTerm);
  }

  async function handleViewDetail(student) {
    try {
      const detail = await getStudentById(student.id);
      setDetailStudent(detail);
    } catch {
      setDetailStudent(student);
    }
  }

  function handleEdit(student) {
    setSaveError('');
    setEditStudent(student);
  }

  async function handleSave(formData) {
    setSaving(true);
    setSaveError('');
    try {
      await updateStudent(editStudent.id, formData);
      setEditStudent(null);
      showToast('success', 'บันทึกข้อมูลสำเร็จ');
      loadStudents(currentPage, searchTerm);
      getStudentStats().then(setStats);
    } catch (err) {
      setSaveError(err.message || 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(student) {
    if (!window.confirm(`ยืนยันการปิดใช้งานบัญชี "${student.firstName} ${student.lastName}" ?`)) return;
    try {
      await deactivateStudent(student.id);
      showToast('success', 'ปิดใช้งานบัญชีสำเร็จ');
      loadStudents(currentPage, searchTerm);
      getStudentStats().then(setStats);
    } catch (err) {
      showToast('error', err.message || 'ไม่สามารถปิดใช้งานบัญชีได้');
    }
  }

  function pageNumbers() {
    const pages = [];
    const MAX = 5;
    let start = Math.max(0, currentPage - 2);
    let end = Math.min(totalPages - 1, start + MAX - 1);
    if (end - start < MAX - 1) start = Math.max(0, end - MAX + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  return (
    <div className="sm-page">

      {/* ── Header ── */}
      <div className="sm-header">
        <div>
          <h1 className="sm-title">จัดการนักเรียน</h1>
          <p className="sm-subtitle">จัดการข้อมูลนักเรียนทั้งหมดในระบบ</p>
        </div>
        <div className="sm-header-actions">
          <div className="sm-search-wrap">
            <svg className="sm-search-icon" viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              className="sm-search-input"
              placeholder="ค้นหาชื่อ, รหัส, email..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast.msg && (
        <div className={`sm-toast sm-toast--${toast.type}`}>
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
          <button className="sm-toast-close" onClick={() => setToast({ type: '', msg: '' })}>×</button>
        </div>
      )}

      {/* ── Stats Cards ── */}
      <div className="sm-stats-grid">
        <DashboardCard
          title="นักเรียนทั้งหมด"
          value={statsLoading ? '...' : stats.total}
          subtitle="ผู้เรียนที่ลงทะเบียนในระบบ"
          color="blue"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          }
        />
        <DashboardCard
          title="นักเรียนที่ใช้งานอยู่"
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
          title="สมัครใหม่เดือนนี้"
          value={statsLoading ? '...' : stats.newThisMonth}
          subtitle="นักเรียนที่สมัครเดือนนี้"
          color="teal"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
          }
        />
        <DashboardCard
          title="นักเรียนที่ปิดใช้งาน"
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
      <div className="sm-table-card">
        <div className="sm-table-card-header">
          <div>
            <h2 className="sm-table-card-title">รายชื่อนักเรียน</h2>
            {!loading && (
              <span className="sm-table-card-count">ทั้งหมด {totalElements} คน</span>
            )}
          </div>
        </div>

        {loading && (
          <div className="sm-loading">
            <div className="sm-spinner" />
            <span>กำลังโหลดข้อมูล...</span>
          </div>
        )}

        {!loading && error && (
          <div className="sm-error-card">
            <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" style={{ flexShrink: 0 }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div style={{ flex: 1 }}>
              <p className="sm-error-title">โหลดข้อมูลไม่สำเร็จ</p>
              <p className="sm-error-msg">{error}</p>
            </div>
            <button className="sm-btn sm-btn--ghost" onClick={() => loadStudents(currentPage, searchTerm)}>
              ลองใหม่
            </button>
          </div>
        )}

        {!loading && !error && students.length === 0 && (
          <div className="sm-empty">
            <div className="sm-empty-icon">
              <svg viewBox="0 0 20 20" fill="currentColor" width="36" height="36">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <p className="sm-empty-title">ไม่พบข้อมูลนักเรียน</p>
            <p className="sm-empty-subtitle">
              {searchTerm ? `ไม่พบผลลัพธ์สำหรับ "${searchTerm}"` : 'ยังไม่มีนักเรียนในระบบ'}
            </p>
            <button className="sm-btn sm-btn--ghost" onClick={() => loadStudents(currentPage, searchTerm)}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              โหลดใหม่
            </button>
          </div>
        )}

        {!loading && !error && students.length > 0 && (
          <>
            <div className="sm-table-wrap">
              <table className="sm-table">
                <thead>
                  <tr>
                    <th>นักเรียน</th>
                    <th>รหัสนักเรียน</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>เบอร์โทร</th>
                    <th>วันที่สมัคร</th>
                    <th>สถานะ</th>
                    <th>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id} className="sm-table-row">
                      <td>
                        <div className="sm-student-cell">
                          <StudentAvatar firstName={student.firstName} lastName={student.lastName} />
                          <div className="sm-student-name">
                            {student.firstName} {student.lastName}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="sm-code-badge">{student.studentCode || '—'}</span>
                      </td>
                      <td className="sm-text-mono">{student.username || '—'}</td>
                      <td className="sm-text-email">{student.email || '—'}</td>
                      <td className="sm-text-secondary">{student.phoneNumber || '—'}</td>
                      <td className="sm-text-date">{formatDate(student.createdAt)}</td>
                      <td><StatusBadge student={student} /></td>
                      <td>
                        <div className="sm-row-actions">
                          <button
                            className="sm-row-btn sm-row-btn--icon"
                            onClick={() => handleViewDetail(student)}
                            data-tooltip="ดูรายละเอียด"
                            aria-label="ดูรายละเอียด"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            className="sm-row-btn sm-row-btn--icon"
                            onClick={() => handleEdit(student)}
                            data-tooltip="แก้ไข"
                            aria-label="แก้ไข"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          {isActive(student) && (
                            <button
                              className="sm-row-btn sm-row-btn--danger"
                              onClick={() => handleDeactivate(student)}
                              data-tooltip="ปิดการใช้งานนักเรียน"
                              aria-label="ปิดการใช้งาน"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524L13.477 14.89zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                              </svg>
                              <span>ปิดการใช้งาน</span>
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
              <div className="sm-pagination">
                <span className="sm-pagination-info">
                  หน้า {currentPage + 1} จาก {totalPages} &bull; ทั้งหมด {totalElements} รายการ
                </span>
                <div className="sm-pagination-controls">
                  <button
                    className="sm-page-btn"
                    disabled={currentPage === 0}
                    onClick={() => handlePageChange(currentPage - 1)}
                    aria-label="หน้าก่อนหน้า"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {pageNumbers().map(p => (
                    <button
                      key={p}
                      className={`sm-page-btn${p === currentPage ? ' sm-page-btn--active' : ''}`}
                      onClick={() => handlePageChange(p)}
                    >
                      {p + 1}
                    </button>
                  ))}
                  <button
                    className="sm-page-btn"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => handlePageChange(currentPage + 1)}
                    aria-label="หน้าถัดไป"
                  >
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

      {detailStudent && (
        <DetailModal student={detailStudent} onClose={() => setDetailStudent(null)} />
      )}
      {editStudent && (
        <EditModal
          student={editStudent}
          onClose={() => { setEditStudent(null); setSaveError(''); }}
          onSave={handleSave}
          saving={saving}
          saveError={saveError}
        />
      )}
    </div>
  );
}
