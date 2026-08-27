import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getAllEnrollments,
  updatePayment,
  approveEnrollment,
  returnForSlipRevision,
  rejectEnrollment,
  cancelEnrollment,
} from '../services/adminEnrollmentService';
import { getInstitutionProfile, updateInstitutionProfile } from '../services/adminSettingsService';
import { parseDaySlots } from '../utils/courseScheduleUtils';
import { resolveFileUrl } from '../../../shared/services/api';
import { getUsername } from '../../../shared/utils/tokenUtils';
import { useConfirm } from '../../../shared/components/ConfirmDialog';
import './AdminEnrollmentManagementPage.css';

// แปลงข้อมูลสถาบันทั้งชุดให้เป็น payload สำหรับ PUT /institution-profile (endpoint ต้องการฟิลด์ครบทุกตัว)
// ใช้ตอนแก้ไขแค่บางฟิลด์จากหน้านี้ เพื่อไม่ให้ฟิลด์อื่นที่ตั้งค่าไว้ในหน้าอื่นถูกเขียนทับ
function toInstitutionPayload(profile, overrides = {}) {
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
    promptPayId: profile?.promptPayId || '',
    enrollmentPaymentDeadlineMinutes: profile?.enrollmentPaymentDeadlineMinutes ?? 15,
    slipRevisionDeadlineMinutes: profile?.slipRevisionDeadlineMinutes ?? 15,
    allowedTimeSlots: parseDaySlots(profile?.allowedTimeSlots),
    ...overrides,
  };
}

function validDeadline(n) {
  return Number.isInteger(n) && n >= 1 && n <= 1440;
}

// ── Settings Modal (ระยะเวลาชำระเงินก่อนที่นั่งถูกปล่อยคืน + ระยะเวลาแก้ไขสลิป) ──

function EnrollmentSettingsModal({ onClose, onSaved, notify }) {
  const [profile, setProfile] = useState(null);
  const [deadline, setDeadline] = useState('');
  const [revisionDeadline, setRevisionDeadline] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    getInstitutionProfile()
      .then((data) => {
        setProfile(data);
        setDeadline(String(data?.enrollmentPaymentDeadlineMinutes ?? 15));
        setRevisionDeadline(String(data?.slipRevisionDeadlineMinutes ?? 15));
      })
      .catch((err) => setLoadError(err.message || 'ไม่สามารถโหลดข้อมูลได้'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    const n = Number(deadline);
    const rn = Number(revisionDeadline);
    if (!deadline || !validDeadline(n)) {
      setSaveError('กรุณากรอกระยะเวลาชำระเงินเป็นจำนวนเต็มระหว่าง 1-1440 นาที');
      return;
    }
    if (!revisionDeadline || !validDeadline(rn)) {
      setSaveError('กรุณากรอกระยะเวลาแก้ไขสลิปเป็นจำนวนเต็มระหว่าง 1-1440 นาที');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await updateInstitutionProfile(toInstitutionPayload(profile, {
        enrollmentPaymentDeadlineMinutes: n,
        slipRevisionDeadlineMinutes: rn,
      }));
      notify('success', 'บันทึกการตั้งค่าสำเร็จ');
      onSaved();
    } catch (err) {
      setSaveError(err.message || 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="em-modal-overlay" onClick={onClose}>
      <div className="em-modal em-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="em-modal-header">
          <div>
            <h2 className="em-modal-title">การสมัครเรียนและการชำระเงิน</h2>
          </div>
          <button className="em-modal-close" onClick={onClose} aria-label="ปิด">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="em-modal-body">
          {loading && <p className="em-empty-text">กำลังโหลดข้อมูล...</p>}
          {!loading && loadError && <p className="em-form-error">{loadError}</p>}
          {!loading && !loadError && (
            <>
              <div className="em-settings-field">
                <label className="em-form-label">ระยะเวลาชำระเงิน (นาที)</label>
                <input
                  type="number"
                  className="em-form-input"
                  value={deadline}
                  onChange={(e) => { setDeadline(e.target.value); setSaveError(''); }}
                />
                <p className="em-hint">
                  นับตั้งแต่นักเรียนกดสมัครเรียน หากไม่ชำระเงินภายในเวลานี้ ที่นั่งจะถูกยกเลิกอัตโนมัติ
                </p>
              </div>
              <div className="em-settings-field">
                <label className="em-form-label">ระยะเวลาแก้ไขสลิป (นาที)</label>
                <input
                  type="number"
                  className="em-form-input"
                  value={revisionDeadline}
                  onChange={(e) => { setRevisionDeadline(e.target.value); setSaveError(''); }}
                />
                <p className="em-hint">
                  นับตั้งแต่แอดมินตีกลับให้นักเรียนแก้ไขสลิป หากไม่อัปโหลดสลิปใหม่ภายในเวลานี้ ใบสมัครจะถูกยกเลิกและคืนที่นั่งอัตโนมัติ
                </p>
              </div>
              {saveError && <p className="em-form-error">{saveError}</p>}
              <div className="em-settings-actions">
                <button className="em-btn em-btn--ghost" onClick={onClose} disabled={saving}>ยกเลิก</button>
                <button className="em-btn em-btn--info" onClick={handleSave} disabled={saving}>
                  {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Labels & Badge Maps ─────────────────────────────────────────────────────

const PAYMENT_STATUS_LABEL = {
  UNPAID: 'ยังไม่ชำระ',
  PENDING_VERIFICATION: 'รอการยืนยันชำระเงิน',
  PAID: 'ชำระแล้ว',
  FAILED: 'ไม่สำเร็จ',
};

const PAYMENT_STATUS_TONE = {
  UNPAID: 'default',
  PENDING_VERIFICATION: 'warning',
  PAID: 'success',
  FAILED: 'error',
};

const PAYMENT_METHOD_LABEL = {
  BANK_TRANSFER: 'โอนเงินผ่านธนาคาร',
  PROMPTPAY: 'พร้อมเพย์',
  CASH: 'เงินสด',
  CREDIT_CARD: 'บัตรเครดิต',
};

const PAGE_SIZE = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatCurrency(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' บาท';
}

function Badge({ value, labelMap, toneMap }) {
  const tone = toneMap[value] || 'default';
  return (
    <span className={`em-badge em-badge--${tone}`}>
      <span className="em-badge-dot" />
      {labelMap[value] || value || '—'}
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="em-detail-row">
      <span className="em-detail-row-label">{label}</span>
      <span className="em-detail-row-value">{value ?? '—'}</span>
    </div>
  );
}

// ── Detail / Action Modal ─────────────────────────────────────────────────────

function DetailModal({ enrollment, onClose, onAction, actionPending }) {
  const [note, setNote] = useState('');

  if (!enrollment) return null;

  return (
    <div className="em-modal-overlay" onClick={onClose}>
      <div className="em-modal" onClick={(e) => e.stopPropagation()}>
        <div className="em-modal-header">
          <div>
            <h2 className="em-modal-title">รายละเอียดการสมัครเรียน</h2>
            <span className="em-modal-code">{enrollment.enrollmentCode || '—'}</span>
          </div>
          <button className="em-modal-close" onClick={onClose} aria-label="ปิด">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="em-modal-body">
          <div className="em-status-row">
            <Badge value={enrollment.paymentStatus} labelMap={PAYMENT_STATUS_LABEL} toneMap={PAYMENT_STATUS_TONE} />
          </div>

          <div className="em-detail-grid">
            <div className="em-detail-section">
              <h3 className="em-detail-section-title">ข้อมูลการสมัคร</h3>
              <div className="em-detail-rows">
                <DetailRow label="นักเรียน" value={enrollment.studentName} />
                <DetailRow label="คอร์ส" value={enrollment.courseName} />
                <DetailRow label="ติวเตอร์" value={enrollment.tutorName} />
                <DetailRow label="อีเมลติวเตอร์" value={enrollment.tutorEmail} />
                <DetailRow label="วันที่สมัคร" value={formatDateTime(enrollment.enrollmentDate)} />
                <DetailRow label="หมายเหตุ" value={enrollment.note} />
              </div>
            </div>

            <div className="em-detail-section">
              <h3 className="em-detail-section-title">ข้อมูลการชำระเงิน</h3>
              <div className="em-detail-rows">
                <DetailRow label="ยอดเต็ม" value={formatCurrency(enrollment.amount)} />
                <DetailRow label="ยอดสุทธิ" value={formatCurrency(enrollment.finalAmount)} />
                <DetailRow label="ช่องทางชำระ" value={PAYMENT_METHOD_LABEL[enrollment.paymentMethod] || '—'} />
              </div>
            </div>

            <div className="em-detail-section em-detail-section--full">
              <h3 className="em-detail-section-title">หลักฐานการชำระเงิน</h3>
              {enrollment.paymentSlipUrl ? (
                <a href={resolveFileUrl(enrollment.paymentSlipUrl)} target="_blank" rel="noreferrer" className="em-slip-link">
                  <img src={resolveFileUrl(enrollment.paymentSlipUrl)} alt="สลิปการชำระเงิน" className="em-slip-thumb" />
                  <span>เปิดดูรูปเต็ม</span>
                </a>
              ) : (
                <p className="em-empty-text">ยังไม่มีการอัปโหลดสลิป</p>
              )}
            </div>
          </div>

          <div className="em-action-panel">
            <label className="em-form-label">หมายเหตุ {note.trim() ? '' : '(จำเป็นต้องระบุก่อนส่งกลับแก้ไขสลิป)'}</label>
            <textarea
              className="em-form-textarea"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น สลิปไม่ชัดเจน / ยอดเงินไม่ตรง / รายการไม่ใช่ของคอร์สนี้..."
            />
            <div className="em-action-buttons">
              <button
                className="em-btn em-btn--success"
                disabled={actionPending}
                onClick={() => onAction('approve', enrollment, note)}
              >
                อนุมัติ
              </button>
              <button
                className="em-btn em-btn--warning"
                disabled={actionPending || !note.trim()}
                title={!note.trim() ? 'กรุณาระบุเหตุผลก่อนส่งกลับให้นักเรียนแก้ไขสลิป' : undefined}
                onClick={() => onAction('return', enrollment, note)}
              >
                ส่งกลับไปให้นักเรียนแก้ไขสลิป
              </button>
              <button
                className="em-btn em-btn--danger"
                disabled={actionPending || !note.trim()}
                title={!note.trim() ? 'กรุณาระบุเหตุผลก่อนปฏิเสธการสมัคร' : undefined}
                onClick={() => onAction('reject', enrollment, note)}
              >
                ปฏิเสธการสมัคร
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminEnrollmentManagementPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [detailEnrollment, setDetailEnrollment] = useState(null);
  const [actionPending, setActionPending] = useState(false);
  const [toast, setToast] = useState({ type: '', msg: '' });
  const [showSettings, setShowSettings] = useState(false);
  const { confirm, confirmDialog } = useConfirm();

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: '', msg: '' }), 3500);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllEnrollments();
      const list = Array.isArray(data) ? data : [];
      // This page is the review inbox — once an application is decided
      // (approved/rejected/cancelled/completed) it belongs on the history page.
      // Applications with no slip uploaded yet (paymentStatus UNPAID/FAILED) still
      // belong to the student — they only land here once there's something to review.
      setEnrollments(list.filter((e) => e.status === 'PENDING' && e.paymentStatus === 'PENDING_VERIFICATION'));
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลการสมัครเรียนได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    total: enrollments.length,
  }), [enrollments]);

  const filtered = useMemo(() => {
    let list = enrollments;
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter((e) =>
        (e.studentName || '').toLowerCase().includes(term) ||
        (e.courseName || '').toLowerCase().includes(term) ||
        (e.enrollmentCode || '').toLowerCase().includes(term)
      );
    }
    return [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [enrollments, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
  }

  async function handleAction(action, enrollment, note) {
    setActionPending(true);
    try {
      const hasPendingSlip = enrollment.paymentStatus === 'PENDING_VERIFICATION';

      if (action === 'approve') {
        if (hasPendingSlip) {
          await updatePayment(enrollment.id, { paymentStatus: 'PAID', note: note || null });
        }
        const approvedBy = getUsername() || 'admin';
        await approveEnrollment(enrollment.id, approvedBy, note);
        showToast('success', 'อนุมัติการสมัครเรียนสำเร็จ');
      } else if (action === 'return') {
        if (!note.trim()) {
          showToast('error', 'กรุณาระบุเหตุผลก่อนส่งกลับให้นักเรียนแก้ไขสลิป');
          setActionPending(false);
          return;
        }
        await returnForSlipRevision(enrollment.id, note.trim());
        showToast('success', 'ส่งกลับให้นักเรียนแก้ไขสลิปแล้ว');
      } else if (action === 'reject') {
        if (!note.trim()) {
          showToast('error', 'กรุณาระบุเหตุผลก่อนปฏิเสธการสมัคร');
          setActionPending(false);
          return;
        }
        const okReject = await confirm({
          title: 'ยืนยันการปฏิเสธการสมัคร',
          message: `ปฏิเสธการสมัครเรียนของ "${enrollment.studentName}" ? ที่นั่งจะถูกคืนกลับเข้าระบบ`,
          confirmText: 'ปฏิเสธการสมัคร',
          danger: true,
        });
        if (!okReject) {
          setActionPending(false);
          return;
        }
        await rejectEnrollment(enrollment.id, note.trim());
        showToast('success', 'ปฏิเสธการสมัครเรียนและคืนที่นั่งแล้ว');
      } else if (action === 'cancel') {
        const okCancel = await confirm({
          title: 'ยืนยันการยกเลิกการสมัคร',
          message: `ยกเลิกการสมัครเรียนของ "${enrollment.studentName}" ?`,
          confirmText: 'ยกเลิกการสมัคร',
          danger: true,
        });
        if (!okCancel) {
          setActionPending(false);
          return;
        }
        await cancelEnrollment(enrollment.id);
        showToast('success', 'ยกเลิกการสมัครเรียนแล้ว');
      }

      // Decided applications move to the payment history page — drop it here right away.
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollment.id));
      setDetailEnrollment(null);
      load();
    } catch (err) {
      showToast('error', err.message || 'ดำเนินการไม่สำเร็จ');
    } finally {
      setActionPending(false);
    }
  }

  return (
    <div className="em-page">
      {confirmDialog}

      {/* ── Header ── */}
      <div className="em-header">
        <div>
          <h1 className="em-title">การสมัครเรียน</h1>
          <p className="em-subtitle">ตรวจสอบใบสมัครที่ส่งสลิปการชำระเงินแล้ว — อนุมัติ ส่งกลับให้นักเรียนแก้ไขสลิปหากไม่ถูกต้อง หรือปฏิเสธการสมัคร (ที่นั่งจะถูกคืนกลับเข้าระบบอัตโนมัติ)</p>
        </div>
        <div className="em-header-actions">
          <button className="em-btn em-btn--ghost" onClick={() => setShowSettings(true)}>
            ⚙️ ตั้งค่าการสมัครเรียนและการชำระเงิน
          </button>
          <div className="em-search-wrap">
            <svg className="em-search-icon" viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text" className="em-search-input"
              placeholder="ค้นหาชื่อนักเรียน, คอร์ส, รหัสการสมัคร..."
              value={searchTerm} onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      {toast.msg && (
        <div className={`em-toast em-toast--${toast.type}`}>
          <span>{toast.msg}</span>
          <button className="em-toast-close" onClick={() => setToast({ type: '', msg: '' })}>×</button>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="em-stats-grid">
        <div className="em-stat-card em-stat-card--warning">
          <span className="em-stat-value">{loading ? '...' : stats.total}</span>
          <span className="em-stat-label">รอการยืนยันชำระเงิน</span>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="em-table-card">
        {loading && (
          <div className="em-loading">
            <div className="em-spinner" />
            <span>กำลังโหลดข้อมูล...</span>
          </div>
        )}

        {!loading && error && (
          <div className="em-error-card">
            <p className="em-error-title">โหลดข้อมูลไม่สำเร็จ</p>
            <p className="em-error-msg">{error}</p>
            <button className="em-btn em-btn--ghost" onClick={load}>ลองใหม่</button>
          </div>
        )}

        {!loading && !error && pageItems.length === 0 && (
          <div className="em-empty">
            <p className="em-empty-title">ไม่พบใบสมัครที่รอตรวจสอบ</p>
            <p className="em-empty-subtitle">
              {searchTerm ? `ไม่พบผลลัพธ์สำหรับ "${searchTerm}"` : 'ยังไม่มีใบสมัครที่ส่งสลิปการชำระเงินเข้ามารอตรวจสอบ'}
            </p>
          </div>
        )}

        {!loading && !error && pageItems.length > 0 && (
          <>
            <div className="em-table-wrap">
              <table className="em-table">
                <thead>
                  <tr>
                    <th>รหัสการสมัคร</th>
                    <th>นักเรียน</th>
                    <th>คอร์ส</th>
                    <th>วันที่สมัคร</th>
                    <th>ยอดสุทธิ</th>
                    <th>สถานะการชำระเงิน</th>
                    <th>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((e) => (
                    <tr key={e.id} className="em-table-row">
                      <td><span className="em-code-badge">{e.enrollmentCode || '—'}</span></td>
                      <td className="em-text-name">{e.studentName || '—'}</td>
                      <td>{e.courseName || '—'}</td>
                      <td className="em-text-date">{formatDate(e.enrollmentDate)}</td>
                      <td className="em-text-amount">{formatCurrency(e.finalAmount)}</td>
                      <td><Badge value={e.paymentStatus} labelMap={PAYMENT_STATUS_LABEL} toneMap={PAYMENT_STATUS_TONE} /></td>
                      <td>
                        <button className="em-row-btn" onClick={() => setDetailEnrollment(e)}>
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="em-pagination">
                <span className="em-pagination-info">
                  หน้า {currentPage + 1} จาก {totalPages} &bull; ทั้งหมด {filtered.length} รายการ
                </span>
                <div className="em-pagination-controls">
                  <button
                    className="em-page-btn" disabled={currentPage === 0}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    className="em-page-btn" disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {detailEnrollment && (
        <DetailModal
          enrollment={detailEnrollment}
          onClose={() => setDetailEnrollment(null)}
          onAction={handleAction}
          actionPending={actionPending}
        />
      )}

      {showSettings && (
        <EnrollmentSettingsModal
          onClose={() => setShowSettings(false)}
          onSaved={() => setShowSettings(false)}
          notify={showToast}
        />
      )}
    </div>
  );
}
