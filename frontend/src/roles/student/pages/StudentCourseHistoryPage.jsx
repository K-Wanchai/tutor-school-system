import { useEffect, useMemo, useState } from 'react';
import { getMyCourses } from '../services/studentMyCoursesService.js';
import { resolveFileUrl } from '../../../shared/services/api';
import { formatScheduleDaysTH } from '../../../shared/utils/dateUtils';
import './StudentMyCoursesPage.css';

const PAYMENT_STATUS_LABELS = {
  UNPAID: 'ยังไม่ชำระเงิน',
  PENDING_VERIFICATION: 'รอตรวจสอบสลิป',
  PAID: 'ชำระเงินแล้ว',
  FAILED: 'ชำระเงินไม่สำเร็จ',
};

const PAYMENT_METHOD_LABELS = {
  BANK_TRANSFER: 'โอนผ่านธนาคาร',
  PROMPTPAY: 'พร้อมเพย์',
  CASH: 'เงินสด',
  CREDIT_CARD: 'บัตรเครดิต',
};

function safeText(value) {
  if (value === null || value === undefined || value === '') return '-';
  return value;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '-';
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return '-';
  return `${numberValue.toLocaleString('th-TH')} บาท`;
}

function getPaymentStatusLabel(status) {
  return PAYMENT_STATUS_LABELS[status] || safeText(status);
}

function getPaymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] || safeText(method);
}

function getErrorMessage(err) {
  const status = err?.response?.status;
  if (status === 401) return 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
  if (status === 403) return 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้';
  if (status === 500) return 'เกิดข้อผิดพลาดจากระบบ กรุณาลองใหม่อีกครั้ง';
  return err?.response?.data?.message || err?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}

export default function StudentCourseHistoryPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);

  async function loadHistory() {
    try {
      setLoading(true);
      setError('');
      const data = await getMyCourses();
      const list = Array.isArray(data) ? data : [];
      setCourses(list.filter((item) => item.status === 'COMPLETED'));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadHistory(); }, []);

  const summary = useMemo(() => ({ total: courses.length }), [courses]);

  return (
    <div className="smc-page">
      <section className="smc-hero-card">
        <div>
          <p className="smc-hero-kicker">Course History</p>
          <h1>ประวัติคอร์สเรียน</h1>
          <p>คอร์สที่คุณเรียนจบแล้วทั้งหมด</p>
        </div>

        <button type="button" className="smc-refresh-btn" onClick={loadHistory} disabled={loading}>
          {loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
        </button>
      </section>

      <section className="smc-summary-grid">
        <article className="smc-summary-card">
          <span>คอร์สที่เรียนจบแล้ว</span>
          <strong>{summary.total}</strong>
        </article>
      </section>

      <section className="smc-content-card">
        <div className="smc-section-header">
          <div>
            <h2>รายการคอร์สที่เรียนจบแล้ว</h2>
            <p>ดูรายละเอียดคอร์สที่คุณเรียนจบและประเมินได้จากที่นี่</p>
          </div>
        </div>

        {loading && (
          <div className="smc-loading-box">
            <div className="smc-spinner" />
            <p>กำลังโหลดข้อมูลประวัติคอร์สเรียน...</p>
          </div>
        )}

        {!loading && error && (
          <div className="smc-error-box">
            <h3>ไม่สามารถโหลดข้อมูลได้</h3>
            <p>{error}</p>
            <button type="button" onClick={loadHistory}>ลองใหม่อีกครั้ง</button>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="smc-empty-state">
            <div className="smc-empty-icon">🎓</div>
            <h3>ยังไม่มีประวัติคอร์สเรียน</h3>
            <p>เมื่อคุณเรียนจบคอร์สใด คอร์สนั้นจะย้ายมาแสดงที่นี่</p>
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="smc-table-wrap">
            <table className="smc-table">
              <thead>
                <tr>
                  <th>รหัสสมัคร</th>
                  <th>รหัสคอร์ส</th>
                  <th>ชื่อคอร์ส</th>
                  <th>ผู้สอน</th>
                  <th>วันที่สมัคร</th>
                  <th>วันที่เริ่มเรียน</th>
                  <th>รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td><span className="smc-table-code">{safeText(course.enrollmentCode)}</span></td>
                    <td><span className="smc-table-code">{safeText(course.courseCode)}</span></td>
                    <td className="smc-table-name">{safeText(course.courseName)}</td>
                    <td>{safeText(course.tutorName)}</td>
                    <td>{formatDate(course.enrollmentDate)}</td>
                    <td>{formatDate(course.courseStartDate)}</td>
                    <td>
                      <button type="button" className="smc-table-btn-icon" title="ดูรายละเอียด" onClick={() => setSelectedCourse(course)}>
                        👁
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedCourse && (
        <div className="smc-modal-backdrop" role="presentation" onClick={() => setSelectedCourse(null)}>
          <div
            className="smc-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="smc-history-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="smc-modal-header">
              <div>
                <p>รายละเอียดคอร์สที่เรียนจบแล้ว</p>
                <h2 id="smc-history-modal-title">{safeText(selectedCourse.courseName)}</h2>
              </div>
              <button
                type="button"
                className="smc-modal-close"
                onClick={() => setSelectedCourse(null)}
                aria-label="ปิดหน้าต่างรายละเอียด"
              >
                ×
              </button>
            </div>

            <div className="smc-modal-body">
              <div className="smc-detail-row">
                <span>รหัสการสมัคร</span>
                <strong>{safeText(selectedCourse.enrollmentCode)}</strong>
              </div>
              <div className="smc-detail-row">
                <span>รหัสคอร์ส</span>
                <strong>{safeText(selectedCourse.courseCode)}</strong>
              </div>
              <div className="smc-detail-row">
                <span>ผู้สอน</span>
                <strong>{safeText(selectedCourse.tutorName)}</strong>
              </div>
              <div className="smc-detail-row">
                <span>วันที่สมัคร</span>
                <strong>{formatDateTime(selectedCourse.enrollmentDate)}</strong>
              </div>
              <div className="smc-detail-row">
                <span>วันที่เริ่มเรียน</span>
                <strong>{formatDate(selectedCourse.courseStartDate)}</strong>
              </div>
              <div className="smc-detail-row">
                <span>ตารางเรียน</span>
                <strong className="schedule-multiline">{formatScheduleDaysTH(selectedCourse.scheduleDays)}</strong>
              </div>
              <div className="smc-detail-row">
                <span>สถานะการชำระเงิน</span>
                <strong>{getPaymentStatusLabel(selectedCourse.paymentStatus)}</strong>
              </div>
              <div className="smc-detail-row">
                <span>วิธีชำระเงิน</span>
                <strong>{getPaymentMethodLabel(selectedCourse.paymentMethod)}</strong>
              </div>
              <div className="smc-detail-row">
                <span>ยอดชำระ</span>
                <strong>{formatCurrency(selectedCourse.finalAmount)}</strong>
              </div>
              <div className="smc-detail-row">
                <span>หลักฐานการชำระเงิน</span>
                <strong>
                  {selectedCourse.paymentSlipUrl ? (
                    <a href={resolveFileUrl(selectedCourse.paymentSlipUrl)} target="_blank" rel="noreferrer">
                      ดูหลักฐานการชำระเงิน
                    </a>
                  ) : (
                    '-'
                  )}
                </strong>
              </div>
            </div>

            <div className="smc-modal-footer">
              <button type="button" className="smc-primary-btn" onClick={() => setSelectedCourse(null)}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
