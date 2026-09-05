import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllEnrollments } from '../services/adminEnrollmentService';
import { resolveFileUrl } from '../../../shared/services/api';
import {
  ENROLLMENT_HISTORY_STATUS_LABEL,
  getEnrollmentHistoryStatus,
} from '../../../shared/utils/enrollmentHistoryStatus';
import './AdminPaymentManagementPage.css';

// ── Labels & Badge Maps ─────────────────────────────────────────────────────
// สถานะที่แสดง (badge เดียว) ใช้ชุดเดียวกับหน้าประวัติของนักเรียน — ดู shared/utils/enrollmentHistoryStatus
// หน้านี้คือ "ประวัติ" ของทุกใบสมัครที่แอดมินตรวจสอบแล้ว (ไม่ว่าผลจะเป็นอนุมัติ/ปฏิเสธ/ส่งกลับแก้ไขสลิป) —
// พอแอดมินกดปุ่มใดปุ่มหนึ่งในหน้า "การสมัครเรียน" (คิวตรวจสอบ) แล้ว แค่สถานะของ enrollment เปลี่ยน
// รายการก็จะหลุดจากคิวและมาโผล่ที่นี่ทันทีโดยอัตโนมัติ ไม่ต้องมี logic บันทึกประวัติแยกต่างหาก
// ส่วนสถิติรายรับ (revenue) นับเฉพาะ APPROVED เท่านั้น ส่วนที่ยกเลิก (CANCELLED จากนักเรียน/หมดเวลา)
// ยังไม่ถือเป็นผลการตรวจสอบของแอดมิน จึงไม่แสดงในหน้านี้

const STATUS_TONE = {
  APPROVED: 'success',
  REJECTED: 'error',
  NEEDS_REVISION: 'warning',
};

const REVIEWED_STATUSES = ['APPROVED', 'REJECTED', 'NEEDS_REVISION'];

const FILTERS = [
  { key: 'ALL', label: 'ทั้งหมด' },
  ...REVIEWED_STATUSES.map((key) => ({ key, label: ENROLLMENT_HISTORY_STATUS_LABEL[key] })),
];

const PAYMENT_METHOD_LABEL = {
  BANK_TRANSFER: 'โอนเงินผ่านธนาคาร',
  PROMPTPAY: 'พร้อมเพย์',
  CASH: 'เงินสด',
  CREDIT_CARD: 'บัตรเครดิต',
};

const PAGE_SIZE = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    <span className={`pm-badge pm-badge--${tone}`}>
      <span className="pm-badge-dot" />
      {labelMap[value] || value || '—'}
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="pm-detail-row">
      <span className="pm-detail-row-label">{label}</span>
      <span className="pm-detail-row-value">{value || '—'}</span>
    </div>
  );
}

// ── Transaction Detail Modal ──────────────────────────────────────────────────

function TransactionDetailModal({ enrollment, onClose }) {
  if (!enrollment) return null;

  const hasDiscount = Number(enrollment.discountAmount) > 0;
  const historyStatus = getEnrollmentHistoryStatus(enrollment);
  const hasReasonBox = historyStatus === 'REJECTED' || historyStatus === 'NEEDS_REVISION';

  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pm-modal-header">
          <div>
            <h2 className="pm-modal-title">รายละเอียดธุรกรรม</h2>
            <span className="pm-modal-code">{enrollment.enrollmentCode || '—'}</span>
          </div>
          <button className="pm-modal-close" onClick={onClose} aria-label="ปิด">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="pm-modal-body">
          <div className="pm-status-row">
            <Badge value={getEnrollmentHistoryStatus(enrollment)} labelMap={ENROLLMENT_HISTORY_STATUS_LABEL} toneMap={STATUS_TONE} />
          </div>

          {hasReasonBox && enrollment.note && (
            <div className="pm-modal-reason">
              <strong>{historyStatus === 'REJECTED' ? 'เหตุผลที่ปฏิเสธ' : 'เหตุผลที่ส่งกลับแก้ไขสลิป'}</strong>
              <p>{enrollment.note}</p>
            </div>
          )}

          <div className="pm-detail-grid">
            <div className="pm-detail-section">
              <h3 className="pm-detail-section-title">ข้อมูลคอร์สและผู้สอน</h3>
              <div className="pm-detail-rows">
                <DetailRow label="รหัสคอร์ส" value={enrollment.courseCode} />
                <DetailRow label="คอร์ส" value={enrollment.courseName} />
                <DetailRow label="ผู้สอน" value={enrollment.tutorName} />
                <DetailRow label="อีเมลผู้สอน" value={enrollment.tutorEmail} />
              </div>
            </div>

            <div className="pm-detail-section">
              <h3 className="pm-detail-section-title">ข้อมูลนักเรียน</h3>
              <div className="pm-detail-rows">
                <DetailRow label="นักเรียน" value={enrollment.studentName} />
                <DetailRow label="วันที่สมัคร" value={formatDateTime(enrollment.enrollmentDate)} />
                <DetailRow label="อัปเดตล่าสุด" value={formatDateTime(enrollment.updatedAt)} />
              </div>
            </div>

            <div className="pm-detail-section pm-detail-section--full">
              <h3 className="pm-detail-section-title">ข้อมูลการชำระเงิน</h3>
              <div className="pm-detail-rows">
                <DetailRow label="ช่องทางชำระ" value={PAYMENT_METHOD_LABEL[enrollment.paymentMethod]} />
                <DetailRow label="ยอดเต็ม" value={formatCurrency(enrollment.amount)} />
                {hasDiscount && <DetailRow label="ส่วนลด" value={formatCurrency(enrollment.discountAmount)} />}
                <DetailRow label="ยอดสุทธิ" value={formatCurrency(enrollment.finalAmount)} />
                {!hasReasonBox && <DetailRow label="หมายเหตุเดิม" value={enrollment.note} />}
              </div>
            </div>

            <div className="pm-detail-section pm-detail-section--full">
              <h3 className="pm-detail-section-title">หลักฐานการชำระเงิน</h3>
              <div className="pm-slip-panel">
                {enrollment.paymentSlipUrl ? (
                  <a href={resolveFileUrl(enrollment.paymentSlipUrl)} target="_blank" rel="noreferrer" className="pm-slip-link">
                    <img src={resolveFileUrl(enrollment.paymentSlipUrl)} alt="สลิปการชำระเงิน" className="pm-slip-img" />
                    <span className="pm-slip-link-text">คลิกเพื่อดูรูปเต็ม</span>
                  </a>
                ) : (
                  <div className="pm-no-slip">ยังไม่มีการอัปโหลดสลิป</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminPaymentManagementPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [reviewEnrollment, setReviewEnrollment] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllEnrollments();
      const list = Array.isArray(data) ? data : [];
      // แสดงทุกใบสมัครที่แอดมินตรวจสอบแล้ว ไม่ว่าผลจะเป็นอนุมัติ/ปฏิเสธ/ส่งกลับแก้ไขสลิป —
      // รอตรวจสอบอยู่ที่หน้าคิวตรวจสอบ (การสมัครเรียน) ส่วนยกเลิกเอง (CANCELLED) ไม่ถือเป็นผลตรวจสอบของแอดมิน
      setEnrollments(list.filter((e) => REVIEWED_STATUSES.includes(getEnrollmentHistoryStatus(e))));
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลการชำระเงินได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const approved = enrollments.filter((e) => getEnrollmentHistoryStatus(e) === 'APPROVED');
    const rejected = enrollments.filter((e) => getEnrollmentHistoryStatus(e) === 'REJECTED');
    const needsRevision = enrollments.filter((e) => getEnrollmentHistoryStatus(e) === 'NEEDS_REVISION');
    return {
      count: approved.length,
      revenue: approved.reduce((sum, e) => sum + (Number(e.finalAmount) || 0), 0),
      rejected: rejected.length,
      needsRevision: needsRevision.length,
    };
  }, [enrollments]);

  const filtered = useMemo(() => {
    let list = enrollments;
    if (statusFilter !== 'ALL') {
      list = list.filter((e) => getEnrollmentHistoryStatus(e) === statusFilter);
    }
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter((e) =>
        (e.studentName || '').toLowerCase().includes(term) ||
        (e.courseName || '').toLowerCase().includes(term) ||
        (e.courseCode || '').toLowerCase().includes(term) ||
        (e.tutorName || '').toLowerCase().includes(term) ||
        (e.enrollmentCode || '').toLowerCase().includes(term)
      );
    }
    return [...list].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }, [enrollments, statusFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
  }

  function handleFilterChange(key) {
    setStatusFilter(key);
    setCurrentPage(0);
  }

  return (
    <div className="pm-page">

      {/* ── Header ── */}
      <div className="pm-header">
        <div>
          <h1 className="pm-title">ประวัติการชำระเงิน</h1>
          <p className="pm-subtitle">
            บันทึกรายการที่ตรวจสอบแล้ว (ชำระเงินเรียบร้อย/ปฏิเสธ/ส่งกลับแก้ไขสลิป) — สำหรับตรวจสอบใบสมัครที่รอดำเนินการ ไปที่หน้าการสมัครเรียน
          </p>
        </div>
        <div className="pm-search-wrap">
          <svg className="pm-search-icon" viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text" className="pm-search-input"
            placeholder="ค้นหาชื่อนักเรียน, คอร์ส, ผู้สอน, รหัส..."
            value={searchTerm} onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="pm-stats-grid">
        <div className="pm-stat-card pm-stat-card--success">
          <span className="pm-stat-value">{loading ? '...' : stats.count}</span>
          <span className="pm-stat-label">ชำระเงินเรียบร้อยแล้ว</span>
        </div>
        <div className="pm-stat-card">
          <span className="pm-stat-value">{loading ? '...' : formatCurrency(stats.revenue)}</span>
          <span className="pm-stat-label">รายรับที่ยืนยันแล้ว</span>
        </div>
        <div className="pm-stat-card pm-stat-card--error">
          <span className="pm-stat-value">{loading ? '...' : stats.rejected}</span>
          <span className="pm-stat-label">ปฏิเสธ</span>
        </div>
        <div className="pm-stat-card pm-stat-card--warning">
          <span className="pm-stat-value">{loading ? '...' : stats.needsRevision}</span>
          <span className="pm-stat-label">ส่งกลับแก้ไขสลิป</span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="pm-filters">
        {FILTERS.map((f) => {
          const count = f.key === 'ALL'
            ? enrollments.length
            : enrollments.filter((e) => getEnrollmentHistoryStatus(e) === f.key).length;
          return (
            <button
              key={f.key}
              className={`pm-filter-btn ${statusFilter === f.key ? 'active' : ''}`}
              onClick={() => handleFilterChange(f.key)}
            >
              {f.label}
              <span className="pm-filter-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Table Card ── */}
      <div className="pm-table-card">
        {loading && (
          <div className="pm-loading">
            <div className="pm-spinner" />
            <span>กำลังโหลดข้อมูล...</span>
          </div>
        )}

        {!loading && error && (
          <div className="pm-error-card">
            <p className="pm-error-title">โหลดข้อมูลไม่สำเร็จ</p>
            <p className="pm-error-msg">{error}</p>
            <button className="pm-btn pm-btn--ghost" onClick={load}>ลองใหม่</button>
          </div>
        )}

        {!loading && !error && pageItems.length === 0 && (
          <div className="pm-empty">
            <p className="pm-empty-title">ไม่พบรายการชำระเงิน</p>
            <p className="pm-empty-subtitle">
              {searchTerm ? `ไม่พบผลลัพธ์สำหรับ "${searchTerm}"` : 'ยังไม่มีรายการในหมวดนี้'}
            </p>
          </div>
        )}

        {!loading && !error && pageItems.length > 0 && (
          <>
            <div className="pm-table-wrap">
              <table className="pm-table">
                <thead>
                  <tr>
                    <th>รหัสการสมัครเรียน</th>
                    <th>นักเรียน</th>
                    <th>รหัสคอร์ส</th>
                    <th>คอร์ส</th>
                    <th>ผู้สอน</th>
                    <th>ราคา</th>
                    <th>สลิป</th>
                    <th>สถานะ</th>
                    <th>รายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((e) => (
                    <tr key={e.id} className="pm-table-row">
                      <td><span className="pm-code-badge">{e.enrollmentCode || '—'}</span></td>
                      <td className="pm-text-name">{e.studentName || '—'}</td>
                      <td><span className="pm-code-badge">{e.courseCode || '—'}</span></td>
                      <td>{e.courseName || '—'}</td>
                      <td>{e.tutorName || '—'}</td>
                      <td className="pm-text-amount">{formatCurrency(e.finalAmount)}</td>
                      
                      <td>
                        {e.paymentSlipUrl ? (
                          <img src={resolveFileUrl(e.paymentSlipUrl)} alt="สลิป" className="pm-slip-thumb-sm" />
                        ) : (
                          <span className="pm-text-secondary">—</span>
                        )}
                      </td>
                      <td><Badge value={getEnrollmentHistoryStatus(e)} labelMap={ENROLLMENT_HISTORY_STATUS_LABEL} toneMap={STATUS_TONE} /></td>
                      <td>
                        <button className="pm-row-btn" onClick={() => setReviewEnrollment(e)}>
                          ดูรายละเอียดทั้งหมด
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pm-pagination">
                <span className="pm-pagination-info">
                  หน้า {currentPage + 1} จาก {totalPages} &bull; ทั้งหมด {filtered.length} รายการ
                </span>
                <div className="pm-pagination-controls">
                  <button
                    className="pm-page-btn" disabled={currentPage === 0}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    className="pm-page-btn" disabled={currentPage >= totalPages - 1}
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

      {reviewEnrollment && (
        <TransactionDetailModal
          enrollment={reviewEnrollment}
          onClose={() => setReviewEnrollment(null)}
        />
      )}
    </div>
  );
}
