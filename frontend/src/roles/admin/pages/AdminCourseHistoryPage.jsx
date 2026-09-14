import { useCallback, useEffect, useState } from 'react';
import { getEnrollmentsByCourse } from '../services/adminEnrollmentService';
import { getCourses } from '../services/adminCourseService';
import { DAYS, DAY_LABEL_TH, scheduleDaysArrayToSlots } from '../utils/courseScheduleUtils';
import './AdminCourseManagementPage.css';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

const ENROLLMENT_STATUS_LABEL = {
  PENDING:   { label: 'รอดำเนินการ', cls: 'cm-badge-draft' },
  APPROVED:  { label: 'ยืนยันการชำระเงินแล้ว', cls: 'cm-badge-open' },
  REJECTED:  { label: 'ปฏิเสธการชำระเงินแล้ว',  cls: 'cm-badge-closed' },
  CANCELLED: { label: 'ยกเลิก',      cls: 'cm-badge-closed' },
  COMPLETED: { label: 'เรียนจบ',     cls: 'cm-badge-completed' },
};

const PAYMENT_STATUS_LABEL_TH = {
  UNPAID: 'ยังไม่ชำระ',
  PENDING_VERIFICATION: 'รอการยืนยันชำระเงิน',
  PAID: 'ชำระแล้ว',
  FAILED: 'ไม่สำเร็จ',
};

function EnrollmentStatusBadge({ status }) {
  const s = ENROLLMENT_STATUS_LABEL[status] || { label: status, cls: '' };
  return <span className={`cm-badge ${s.cls}`}>{s.label}</span>;
}

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`cm-toast cm-toast-${type}`}>
      <span>{msg}</span>
      <button onClick={onClose}>✕</button>
    </div>
  );
}

export default function AdminCourseHistoryPage() {
  const [courses, setCourses]       = useState([]);
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState(null);

  const [showDetail, setShowDetail]   = useState(false);
  const [selected, setSelected]       = useState(null);
  const [courseEnrollments, setCourseEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

  const PAGE_SIZE = 10;
  const notify = useCallback((msg, type = 'error') => setToast({ msg, type }), []);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const data = await getCourses({ page: p, size: PAGE_SIZE, status: 'COMPLETED' });
      const list = Array.isArray(data) ? data : (data?.content ?? []);
      setCourses(list);
      setTotalPages(data?.totalPages ?? 1);
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(0); }, [load]);

  function openDetail(c) {
    setSelected(c);
    setShowDetail(true);
    setCourseEnrollments([]);
    setEnrollmentsLoading(true);
    getEnrollmentsByCourse(c.id)
      .then((list) => setCourseEnrollments((list || []).filter((e) => e.status === 'COMPLETED')))
      .catch((ex) => notify(ex.message, 'error'))
      .finally(() => setEnrollmentsLoading(false));
  }

  return (
    <div className="cm-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="cm-header">
        <div>
          <h1>ประวัติคอร์สเรียน</h1>
          <p>คอร์สที่ติวเตอร์ปิดจบการสอนแล้วทั้งหมด</p>
        </div>
      </div>

      <div className="cm-table-wrap">
        {loading ? (
          <div className="cm-loading">กำลังโหลดข้อมูล...</div>
        ) : courses.length === 0 ? (
          <div className="cm-empty">ยังไม่มีคอร์สที่สอนจบ</div>
        ) : (
          <table className="cm-table">
            <thead>
              <tr>
                <th>รหัสคอร์ส</th>
                <th>ชื่อคอร์ส</th>
                <th>ผู้สอน</th>
                <th>ที่นั่ง</th>
                <th>ราคา</th>
                <th>วันเริ่มสอน</th>
                <th>รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td><span className="cm-code">{c.courseCode}</span></td>
                  <td className="cm-name-cell">{c.courseName}</td>
                  <td>
                    <div className="cm-tutor-cell">
                      <span>{c.teacherName || '—'}</span>
                      <small>{c.tutorEmail || ''}</small>
                    </div>
                  </td>
                  <td>{c.enrolledCount}/{c.seatLimit}</td>
                  <td>{c.price != null && Number(c.price) > 0 ? Number(c.price).toLocaleString() + ' ฿' : '—'}</td>
                  <td>{formatDate(c.courseStartDate)}</td>
                  <td>
                    <div className="cm-actions">
                      <button className="cm-btn-icon" title="ดูรายละเอียด" onClick={() => openDetail(c)}>👁</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="cm-pagination">
          <button disabled={page === 0} onClick={() => { setPage((p) => p - 1); load(page - 1); }}>‹ ก่อน</button>
          <span>หน้า {page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => { setPage((p) => p + 1); load(page + 1); }}>ถัดไป ›</button>
        </div>
      )}

      {showDetail && selected && (
        <div className="cm-overlay" onClick={() => setShowDetail(false)}>
          <div className="cm-modal cm-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h2>รายละเอียดคอร์ส</h2>
              <button className="cm-modal-close" onClick={() => setShowDetail(false)}>✕</button>
            </div>
            <div className="cm-detail">
              <div className="cm-detail-top">
                <span className="cm-code">{selected.courseCode}</span>
                <span className="cm-badge cm-badge-completed">สอนจบแล้ว</span>
              </div>
              <h3>{selected.courseName}</h3>
              <p className="cm-detail-desc">{selected.description || 'ไม่มีรายละเอียด'}</p>

              <div className="cm-detail-grid">
                <div><label>ติวเตอร์</label><span>{selected.teacherName || '—'}</span></div>
                <div><label>อีเมลติวเตอร์</label><span>{selected.tutorEmail || '—'}</span></div>
                <div><label>ราคา</label><span>{selected.price != null && Number(selected.price) > 0 ? Number(selected.price).toLocaleString() + ' บาท' : '—'}</span></div>
                <div><label>ชั่วโมงรวม</label><span>{selected.totalHours} ชั่วโมง</span></div>
                <div><label>ที่นั่ง</label><span>{selected.enrolledCount}/{selected.seatLimit} คน</span></div>
                <div><label>วันเริ่มสอน</label><span>{formatDate(selected.courseStartDate)}</span></div>
              </div>

              {selected.scheduleDays?.length > 0 && (
                <div className="cm-schedule-info-box">
                  <div className="cm-schedule-info-title">📅 ตารางสอน</div>
                  <div className="cm-per-day-slots cm-per-day-slots--readonly">
                    {DAYS.map((d) => d.key)
                      .filter((key) => key in scheduleDaysArrayToSlots(selected.scheduleDays))
                      .map((key) => {
                        const { start, end } = scheduleDaysArrayToSlots(selected.scheduleDays)[key];
                        return (
                          <div key={key} className="cm-per-day-row">
                            <span className="cm-per-day-label">{DAY_LABEL_TH[key]}</span>
                            <span className="cm-per-day-time-display">
                              {start && end ? `${start} – ${end} น.` : 'ยังไม่ระบุเวลา'}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {selected.tutorRemark && (
                <div className="cm-remark-box">
                  <strong>หมายเหตุจากติวเตอร์:</strong> {selected.tutorRemark}
                </div>
              )}

              <div className="cm-enrolled-students">
                <h4>นักเรียนที่เรียนจบคอร์สนี้ ({courseEnrollments.length} คน)</h4>
                {enrollmentsLoading ? (
                  <div className="cm-enrolled-loading">กำลังโหลดรายชื่อนักเรียน...</div>
                ) : courseEnrollments.length === 0 ? (
                  <div className="cm-enrolled-empty">ไม่มีนักเรียนที่เรียนจบคอร์สนี้</div>
                ) : (
                  <div className="cm-enrolled-table-wrap">
                    <table className="cm-enrolled-table">
                      <thead>
                        <tr>
                          <th>รหัสสมัคร</th>
                          <th>ชื่อนักเรียน</th>
                          <th>วันที่สมัคร</th>
                          <th>สถานะ</th>
                          <th>สถานะชำระเงิน</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseEnrollments.map((en) => (
                          <tr key={en.id}>
                            <td>{en.enrollmentCode || '—'}</td>
                            <td>{en.studentName || '—'}</td>
                            <td>{en.enrollmentDate ? formatDate(en.enrollmentDate) : '—'}</td>
                            <td><EnrollmentStatusBadge status={en.status} /></td>
                            <td>{PAYMENT_STATUS_LABEL_TH[en.paymentStatus] || en.paymentStatus || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
