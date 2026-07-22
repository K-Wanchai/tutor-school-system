import { useEffect, useState } from 'react';
import { getMyEnrollments } from '../services/studentEnrollmentService';
import api from '../../../shared/services/api';
import './StudentEnrollmentHistoryPage.css';

const STATUS_MAP = {
  APPROVED:             { label: 'ชำระเงินเรียบร้อยแล้ว', cls: 'hist-badge--approved' },
  REJECTED:             { label: 'ปฏิเสธ',          cls: 'hist-badge--rejected' },
  CANCELLED:            { label: 'ยกเลิก',          cls: 'hist-badge--cancelled' },
  PENDING_VERIFICATION: { label: 'รอการยืนยันชำระเงิน', cls: 'hist-badge--pending' },
};

const FILTERS = [
  { key: 'ALL',                  label: 'ทั้งหมด' },
  { key: 'PENDING_VERIFICATION', label: 'รอการยืนยันชำระเงิน' },
  { key: 'APPROVED',             label: 'ชำระเงินเรียบร้อยแล้ว' },
  { key: 'REJECTED',             label: 'ปฏิเสธ' },
  { key: 'CANCELLED',            label: 'ยกเลิก' },
];

function getDisplayStatus(en) {
  if (en.status === 'APPROVED') return 'APPROVED';
  if (en.status === 'REJECTED') return 'REJECTED';
  if (en.status === 'CANCELLED') return 'CANCELLED';
  return 'PENDING_VERIFICATION';
}

export default function StudentEnrollmentHistoryPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [modal, setModal] = useState(null);
  const [courseDetails, setCourseDetails] = useState({});

  useEffect(() => {
    load(true);
    // Polling ทุก 30 วินาที เพื่ออัพเดตสถานะ
    const id = setInterval(() => load(false), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setModal(null); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function load(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const data = await getMyEnrollments().catch(() => []);
      // ยกเลิก/ถูกปฏิเสธ แสดงในประวัติเสมอ ไม่ว่าจะเคยชำระเงินหรือไม่
      // ส่วนรายการที่ยังไม่ส่งสลิป (UNPAID/FAILED) และยังไม่ถูกยกเลิก จะไปแสดงที่หน้าชำระเงินแทน
      const submitted = (Array.isArray(data) ? data : []).filter(
        (e) => e.status === 'CANCELLED' || e.status === 'REJECTED'
          || (e.paymentStatus !== 'UNPAID' && e.paymentStatus !== 'FAILED')
      );
      setEnrollments(submitted);
      // ถ้า modal เปิดอยู่ อัพเดตข้อมูลใน modal ด้วย
      setModal((prev) => {
        if (!prev) return null;
        return submitted.find((e) => e.id === prev.id) || null;
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function openModal(enrollment) {
    setModal(enrollment);
    if (!courseDetails[enrollment.courseId]) {
      try {
        const res = await api.get(`/courses/${enrollment.courseId}`);
        setCourseDetails((p) => ({ ...p, [enrollment.courseId]: res.data.data }));
      } catch {
        setCourseDetails((p) => ({ ...p, [enrollment.courseId]: 'error' }));
      }
    }
  }

  function fmt(val) {
    if (val == null) return '-';
    return `${Number(val).toLocaleString('th-TH')} บาท`;
  }

  function fmtDate(val) {
    if (!val) return '-';
    return new Date(val).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  const filtered = filter === 'ALL'
    ? enrollments
    : enrollments.filter((e) => getDisplayStatus(e) === filter);

  if (loading) return (
    <div className="hist-page">
      <div className="hist-loading"><div className="hist-spinner" /><p>กำลังโหลด...</p></div>
    </div>
  );

  return (
    <div className="hist-page">
      <div className="hist-header">
        <div>
          <h1>ประวัติการลงทะเบียน</h1>
          <p>รายการคอร์สที่ยืนยันการชำระเงินแล้ว — สถานะอัพเดตอัตโนมัติ</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="hist-filters">
        {FILTERS.map((f) => {
          const count = f.key === 'ALL'
            ? enrollments.length
            : enrollments.filter((e) => getDisplayStatus(e) === f.key).length;
          return (
            <button
              key={f.key}
              className={`hist-filter-btn ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="hist-filter-count">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="hist-empty">
          <h2>ไม่มีรายการ</h2>
          <p>ยังไม่มีการสมัครเรียนในหมวดนี้</p>
        </div>
      ) : (
        <div className="hist-table-wrap">
          <table className="hist-table">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>คอร์ส</th>
                <th>วันที่ยืนยัน</th>
                <th>ยอดชำระ</th>
                <th>สถานะ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((en) => {
                const ds = getDisplayStatus(en);
                const badge = STATUS_MAP[ds];
                return (
                  <tr key={en.id}>
                    <td><span className="hist-code">{en.enrollmentCode}</span></td>
                    <td className="hist-td-course">
                      <strong>{en.courseName}</strong>
                      {en.courseCode && <span className="hist-course-code">{en.courseCode}</span>}
                    </td>
                    <td className="hist-td-date">{fmtDate(en.enrollmentDate)}</td>
                    <td className="hist-td-amount">{fmt(en.finalAmount)}</td>
                    <td>
                      <span className={`hist-badge ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td>
                      <button className="hist-detail-btn" onClick={() => openModal(en)}>
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {modal && (
        <div className="hist-modal-overlay" onClick={() => setModal(null)}>
          <div className="hist-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hist-modal-header">
              <div>
                <span className="hist-code">{modal.enrollmentCode}</span>
                <h2>
                  {modal.courseName}
                  {modal.courseCode && <span className="hist-course-code">{modal.courseCode}</span>}
                </h2>
              </div>
              <button className="hist-modal-close" onClick={() => setModal(null)}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="hist-modal-body">
              {/* Status summary */}
              <div className="hist-modal-status-row">
                <div className="hist-modal-status-item">
                  <span>สถานะ</span>
                  {(() => {
                    const ds = getDisplayStatus(modal);
                    const b = STATUS_MAP[ds];
                    return <span className={`hist-badge ${b.cls}`}>{b.label}</span>;
                  })()}
                </div>
                <div className="hist-modal-status-item">
                  <span>ยอดชำระ</span>
                  <strong>{fmt(modal.finalAmount)}</strong>
                </div>
                <div className="hist-modal-status-item">
                  <span>วันที่ยืนยันชำระ</span>
                  <strong>{fmtDate(modal.enrollmentDate)}</strong>
                </div>
                {modal.approvedAt && (
                  <div className="hist-modal-status-item">
                    <span>วันที่อนุมัติ</span>
                    <strong>{fmtDate(modal.approvedAt)}</strong>
                  </div>
                )}
                {modal.paymentSlipUrl && (
                  <div className="hist-modal-status-item">
                    <span>สลิปการชำระ</span>
                    <a href={modal.paymentSlipUrl} target="_blank" rel="noreferrer" className="hist-slip-link">ดูสลิป</a>
                  </div>
                )}
              </div>

              <div className="hist-modal-divider" />

              {/* Course details */}
              {(() => {
                const detail = courseDetails[modal.courseId];
                if (!detail) return <div className="hist-modal-loading"><div className="hist-spinner" /><p>กำลังโหลด...</p></div>;
                if (detail === 'error') return <p className="hist-modal-error">ไม่สามารถโหลดข้อมูลคอร์สได้</p>;
                return (
                  <>
                    <div className="hist-modal-info-grid">
                      <div><span>ผู้สอน</span><strong>{detail.teacherName || '-'}</strong></div>
                      <div><span>จำนวนชั่วโมง</span><strong>{detail.totalHours != null ? `${detail.totalHours} ชั่วโมง` : '-'}</strong></div>
                      <div>
                        <span>ตารางเรียน</span>
                        <strong>{detail.scheduleDays ? `${detail.scheduleDays} ${detail.scheduleStartTime || ''} - ${detail.scheduleEndTime || ''}`.trim() : '-'}</strong>
                      </div>
                      <div>
                        <span>วันเริ่มเรียน</span>
                        <strong>{detail.courseStartDate ? new Date(detail.courseStartDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</strong>
                      </div>
                    </div>

                    {detail.description && <div className="hist-modal-desc"><p>{detail.description}</p></div>}

                    <div className="hist-modal-section">
                      <h3>บทเรียน ({detail.lessons?.length || 0} บท)</h3>
                      {detail.lessons?.length > 0 ? (
                        <ul className="hist-modal-list">
                          {detail.lessons.map((l) => (
                            <li key={l.id}>
                              <span className="hist-order">บทที่ {l.lessonOrder}</span>
                              <div><strong>{l.lessonTitle}</strong>{l.lessonContent && <p>{l.lessonContent}</p>}</div>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="hist-empty-text">ยังไม่มีบทเรียน</p>}
                    </div>

                    <div className="hist-modal-section">
                      <h3>การทดสอบ ({detail.tests?.length || 0} รายการ)</h3>
                      {detail.tests?.length > 0 ? (
                        <ul className="hist-modal-list">
                          {detail.tests.map((t) => (
                            <li key={t.id}>
                              <span className="hist-order">ครั้งที่ {t.testOrder}</span>
                              <div><strong>{t.testTitle}</strong>{t.testDescription && <p>{t.testDescription}</p>}</div>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="hist-empty-text">ยังไม่มีการทดสอบ</p>}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
