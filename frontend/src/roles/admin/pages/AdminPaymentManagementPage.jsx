import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllEnrollments } from '../services/adminEnrollmentService';
import './AdminPaymentManagementPage.css';

// ── Labels & Badge Maps ─────────────────────────────────────────────────────

const PAYMENT_STATUS_LABEL = {
  UNPAID: 'ยังไม่ชำระ',
  PENDING_VERIFICATION: 'รอตรวจสอบ',
  PAID: 'ชำระแล้ว',
  FAILED: 'ไม่สำเร็จ',
  REFUNDED: 'คืนเงินแล้ว',
};

const PAYMENT_STATUS_TONE = {
  UNPAID: 'default',
  PENDING_VERIFICATION: 'warning',
  PAID: 'success',
  FAILED: 'error',
  REFUNDED: 'info',
};

const ENROLLMENT_STATUS_LABEL = {
  PENDING: 'รอดำเนินการ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ปฏิเสธ',
  CANCELLED: 'ยกเลิก',
  COMPLETED: 'เสร็จสิ้น',
};

const ENROLLMENT_STATUS_TONE = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'default',
  COMPLETED: 'info',
};

const PAYMENT_METHOD_LABEL = {
  BANK_TRANSFER: 'โอนเงินผ่านธนาคาร',
  PROMPTPAY: 'พร้อมเพย์',
  CASH: 'เงินสด',
  CREDIT_CARD: 'บัตรเครดิต',
};

const PAYMENT_TABS = ['ALL', 'PENDING_VERIFICATION', 'PAID', 'FAILED', 'UNPAID', 'REFUNDED'];
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
            <Badge value={enrollment.paymentStatus} labelMap={PAYMENT_STATUS_LABEL} toneMap={PAYMENT_STATUS_TONE} />
            <Badge value={enrollment.status} labelMap={ENROLLMENT_STATUS_LABEL} toneMap={ENROLLMENT_STATUS_TONE} />
          </div>

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
                <DetailRow label="หมายเหตุเดิม" value={enrollment.note} />
              </div>
            </div>

            <div className="pm-detail-section pm-detail-section--full">
              <h3 className="pm-detail-section-title">หลักฐานการชำระเงิน</h3>
              <div className="pm-slip-panel">
                {enrollment.paymentSlipUrl ? (
                  <a href={enrollment.paymentSlipUrl} target="_blank" rel="noreferrer" className="pm-slip-link">
                    <img src={enrollment.paymentSlipUrl} alt="สลิปการชำระเงิน" className="pm-slip-img" />
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
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [reviewEnrollment, setReviewEnrollment] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllEnrollments();
      const list = Array.isArray(data) ? data : [];
      // History only shows applications that have already been decided —
      // still-pending ones live on the enrollment review page instead.
      setEnrollments(list.filter((e) => e.status !== 'PENDING'));
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลการชำระเงินได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const paid = enrollments.filter((e) => e.paymentStatus === 'PAID');
    return {
      pendingVerification: enrollments.filter((e) => e.paymentStatus === 'PENDING_VERIFICATION').length,
      paid: paid.length,
      failed: enrollments.filter((e) => e.paymentStatus === 'FAILED').length,
      revenue: paid.reduce((sum, e) => sum + (Number(e.finalAmount) || 0), 0),
    };
  }, [enrollments]);

  const filtered = useMemo(() => {
    let list = enrollments;
    if (activeTab !== 'ALL') list = list.filter((e) => e.paymentStatus === activeTab);
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
  }, [enrollments, activeTab, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function handleTabChange(tab) {
    setActiveTab(tab);
    setCurrentPage(0);
  }

  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
  }

  return (
    <div className="pm-page">

      {/* ── Header ── */}
      <div className="pm-header">
        <div>
          <h1 className="pm-title">ประวัติการชำระเงิน</h1>
          <p className="pm-subtitle">
            หน้านี้สำหรับดูข้อมูลเท่านั้น — สถานะจะเปลี่ยนไปตามการดำเนินการที่หน้าการสมัครเรียน
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
        <div className="pm-stat-card pm-stat-card--warning">
          <span className="pm-stat-value">{loading ? '...' : stats.pendingVerification}</span>
          <span className="pm-stat-label">รอตรวจสอบ</span>
        </div>
        <div className="pm-stat-card pm-stat-card--success">
          <span className="pm-stat-value">{loading ? '...' : stats.paid}</span>
          <span className="pm-stat-label">ชำระแล้ว</span>
        </div>
        <div className="pm-stat-card pm-stat-card--error">
          <span className="pm-stat-value">{loading ? '...' : stats.failed}</span>
          <span className="pm-stat-label">ไม่สำเร็จ</span>
        </div>
        <div className="pm-stat-card">
          <span className="pm-stat-value">{loading ? '...' : formatCurrency(stats.revenue)}</span>
          <span className="pm-stat-label">รายรับที่ยืนยันแล้ว</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="pm-tabs">
        {PAYMENT_TABS.map((tab) => (
          <button
            key={tab}
            className={`pm-tab${activeTab === tab ? ' pm-tab--active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab === 'ALL' ? 'ทั้งหมด' : PAYMENT_STATUS_LABEL[tab]}
          </button>
        ))}
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
                    <th>รหัสคอร์ส</th>
                    <th>นักเรียน</th>
                    <th>คอร์ส</th>
                    <th>ผู้สอน</th>
                    <th>ราคา</th>
                    <th>ช่องทางชำระ</th>
                    <th>สลิป</th>
                    <th>สถานะ</th>
                    <th>รายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((e) => (
                    <tr key={e.id} className="pm-table-row">
                      <td><span className="pm-code-badge">{e.courseCode || '—'}</span></td>
                      <td className="pm-text-name">{e.studentName || '—'}</td>
                      <td>{e.courseName || '—'}</td>
                      <td>{e.tutorName || '—'}</td>
                      <td className="pm-text-amount">{formatCurrency(e.finalAmount)}</td>
                      <td className="pm-text-secondary">{PAYMENT_METHOD_LABEL[e.paymentMethod] || '—'}</td>
                      <td>
                        {e.paymentSlipUrl ? (
                          <img src={e.paymentSlipUrl} alt="สลิป" className="pm-slip-thumb-sm" />
                        ) : (
                          <span className="pm-text-secondary">—</span>
                        )}
                      </td>
                      <td><Badge value={e.paymentStatus} labelMap={PAYMENT_STATUS_LABEL} toneMap={PAYMENT_STATUS_TONE} /></td>
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
