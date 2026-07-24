import { useEffect, useMemo, useState } from 'react';
import { getMyCourses } from '../services/studentMyCoursesService.js';
import { resolveFileUrl } from '../../../shared/services/api';
import './StudentMyCoursesPage.css';

const ENROLLMENT_STATUS_LABELS = {
  PENDING: 'รออนุมัติ',
  APPROVED: 'ชำระเงินเรียบร้อยแล้ว',
  REJECTED: 'ถูกปฏิเสธ',
  CANCELLED: 'ยกเลิก',
  COMPLETED: 'เรียนจบแล้ว',
};

const PAYMENT_STATUS_LABELS = {
  UNPAID: 'ยังไม่ชำระเงิน',
  PENDING_VERIFICATION: 'รอการยืนยันชำระเงิน',
  PAID: 'ชำระเงินแล้ว',
  FAILED: 'ชำระเงินไม่สำเร็จ',
  REFUNDED: 'คืนเงินแล้ว',
};

const PAYMENT_METHOD_LABELS = {
  BANK_TRANSFER: 'โอนผ่านธนาคาร',
  PROMPTPAY: 'พร้อมเพย์',
  CASH: 'เงินสด',
  CREDIT_CARD: 'บัตรเครดิต',
};

const FILTERS = [
  {
    key: 'ALL',
    label: 'ทั้งหมด',
  },
  {
    key: 'PENDING',
    label: 'กำลังรออนุมัติ',
  },
  {
    key: 'APPROVED',
    label: 'ชำระเงินเรียบร้อยแล้ว',
  },
  {
    key: 'COMPLETED',
    label: 'เรียนจบแล้ว',
  },
];

function safeText(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return value;
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return '-';
  }

  return `${numberValue.toLocaleString('th-TH')} บาท`;
}

function getEnrollmentStatusLabel(status) {
  return ENROLLMENT_STATUS_LABELS[status] || safeText(status);
}

function getPaymentStatusLabel(status) {
  return PAYMENT_STATUS_LABELS[status] || safeText(status);
}

function getPaymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] || safeText(method);
}

function getErrorMessage(err) {
  const status = err?.response?.status;

  if (status === 401) {
    return 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
  }

  if (status === 403) {
    return 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้';
  }

  if (status === 500) {
    return 'เกิดข้อผิดพลาดจากระบบ กรุณาลองใหม่อีกครั้ง';
  }

  return err?.response?.data?.message || err?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}

function StudentMyCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [toast, setToast] = useState({ type: '', msg: '' });

  function showToast(type, msg) {
    setToast({ type, msg });

    window.setTimeout(() => {
      setToast({ type: '', msg: '' });
    }, 3000);
  }

  async function loadMyCourses() {
    try {
      setLoading(true);
      setError('');

      const data = await getMyCourses();

      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMyCourses();
  }, []);

  // ยกเลิก/ถูกปฏิเสธ ไม่แสดงในหน้านี้ — ไปดูได้ที่หน้า "ประวัติการลงทะเบียน" แทน
  const activeCourses = useMemo(() => {
    return courses.filter(
      (item) => item.status !== 'CANCELLED' && item.status !== 'REJECTED'
    );
  }, [courses]);

  const summary = useMemo(() => {
    return {
      total: activeCourses.length,
      pending: activeCourses.filter((item) => item.status === 'PENDING').length,
      approved: activeCourses.filter((item) => item.status === 'APPROVED').length,
      paid: activeCourses.filter((item) => item.paymentStatus === 'PAID').length,
    };
  }, [activeCourses]);

  const filteredCourses = useMemo(() => {
    if (activeFilter === 'ALL') {
      return activeCourses;
    }

    return activeCourses.filter((item) => item.status === activeFilter);
  }, [activeCourses, activeFilter]);

  function handleEnterClassroom(course) {
    showToast('success', 'ฟีเจอร์ห้องเรียนจะพัฒนาในขั้นตอนถัดไป');
    alert(`ฟีเจอร์ห้องเรียนจะพัฒนาในขั้นตอนถัดไป\nคอร์ส: ${course.courseName || '-'}`);
  }

  return (
    <div className="smc-page">
      {toast.msg && (
        <div className={`smc-toast smc-toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      <section className="smc-hero-card">
        <div>
          <p className="smc-hero-kicker">Student Courses</p>
          <h1>คอร์สของฉัน</h1>
          <p>
            ดูรายการคอร์สที่สมัครไว้ สถานะการอนุมัติ และสถานะการชำระเงินของคุณ
          </p>
        </div>

        <button
          type="button"
          className="smc-refresh-btn"
          onClick={loadMyCourses}
          disabled={loading}
        >
          {loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
        </button>
      </section>

      <section className="smc-summary-grid">
        <article className="smc-summary-card">
          <span>คอร์สทั้งหมด</span>
          <strong>{summary.total}</strong>
        </article>

        <article className="smc-summary-card">
          <span>รออนุมัติ</span>
          <strong>{summary.pending}</strong>
        </article>

        <article className="smc-summary-card">
          <span>ชำระเงินเรียบร้อยแล้ว</span>
          <strong>{summary.approved}</strong>
        </article>

        <article className="smc-summary-card">
          <span>ชำระเงินแล้ว</span>
          <strong>{summary.paid}</strong>
        </article>
      </section>

      <section className="smc-content-card">
        <div className="smc-section-header">
          <div>
            <h2>รายการคอร์ส</h2>
            <p>กรองและตรวจสอบรายละเอียดคอร์สที่คุณสมัครไว้</p>
          </div>
        </div>

        <div className="smc-filter-tabs">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={activeFilter === filter.key ? 'active' : ''}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="smc-loading-box">
            <div className="smc-spinner" />
            <p>กำลังโหลดข้อมูลคอร์สของฉัน...</p>
          </div>
        )}

        {!loading && error && (
          <div className="smc-error-box">
            <h3>ไม่สามารถโหลดข้อมูลได้</h3>
            <p>{error}</p>
            <button type="button" onClick={loadMyCourses}>
              ลองใหม่อีกครั้ง
            </button>
          </div>
        )}

        {!loading && !error && filteredCourses.length === 0 && (
          <div className="smc-empty-state">
            <div className="smc-empty-icon">📚</div>
            <h3>ยังไม่มีคอร์สของฉัน</h3>
            <p>เมื่อสมัครคอร์สแล้ว รายการจะแสดงที่หน้านี้</p>
          </div>
        )}

        {!loading && !error && filteredCourses.length > 0 && (
          <div className="smc-course-grid">
            {filteredCourses.map((course) => (
              <article key={course.id} className="smc-course-card">
                <div className="smc-card-top">
                  <div>
                    <p className="smc-enrollment-code">
                      {safeText(course.enrollmentCode)}
                    </p>
                    <h3>
                      {safeText(course.courseName)}
                      {course.courseCode && (
                        <span className="smc-course-code">{course.courseCode}</span>
                      )}
                    </h3>
                  </div>

                  <span className={`smc-status smc-status-${course.status || 'DEFAULT'}`}>
                    {getEnrollmentStatusLabel(course.status)}
                  </span>
                </div>

                <div className="smc-info-list">
                  <div>
                    <span>วันที่สมัคร</span>
                    <strong>{formatDate(course.enrollmentDate)}</strong>
                  </div>

                  <div>
                    <span>วันที่เริ่มเรียน</span>
                    <strong>{formatDate(course.courseStartDate)}</strong>
                  </div>

                  <div>
                    <span>สถานะชำระเงิน</span>
                    <strong>{getPaymentStatusLabel(course.paymentStatus)}</strong>
                  </div>

                  <div>
                    <span>วิธีชำระเงิน</span>
                    <strong>{getPaymentMethodLabel(course.paymentMethod)}</strong>
                  </div>

                  <div>
                    <span>ราคาคอร์ส</span>
                    <strong>{formatCurrency(course.amount)}</strong>
                  </div>

                  <div>
                    <span>ส่วนลด</span>
                    <strong>{formatCurrency(course.discountAmount)}</strong>
                  </div>

                  <div>
                    <span>ยอดชำระ</span>
                    <strong className="smc-final-price">
                      {formatCurrency(course.finalAmount)}
                    </strong>
                  </div>

                  <div>
                    <span>ผู้อนุมัติ</span>
                    <strong>{safeText(course.approvedBy)}</strong>
                  </div>

                  <div>
                    <span>วันที่อนุมัติ</span>
                    <strong>{formatDate(course.approvedAt)}</strong>
                  </div>
                </div>

                <div className="smc-card-actions">
                  <button
                    type="button"
                    className="smc-outline-btn"
                    onClick={() => setSelectedCourse(course)}
                  >
                    ดูรายละเอียด
                  </button>

                  {course.status === 'APPROVED' && course.paymentStatus === 'PAID' && (
                    <button
                      type="button"
                      className="smc-primary-btn"
                      onClick={() => handleEnterClassroom(course)}
                    >
                      เข้าเรียน
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedCourse && (
        <div
          className="smc-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedCourse(null)}
        >
          <div
            className="smc-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="smc-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="smc-modal-header">
              <div>
                <p>รายละเอียดการสมัคร</p>
                <h2 id="smc-modal-title">
                  {safeText(selectedCourse.courseName)}
                </h2>
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
                <span>ชื่อคอร์ส</span>
                <strong>{safeText(selectedCourse.courseName)}</strong>
              </div>

              <div className="smc-detail-row">
                <span>รหัสคอร์ส</span>
                <strong>{safeText(selectedCourse.courseCode)}</strong>
              </div>

              <div className="smc-detail-row">
                <span>ชื่อนักเรียน</span>
                <strong>{safeText(selectedCourse.studentName)}</strong>
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
                <span>สถานะการสมัคร</span>
                <strong>{getEnrollmentStatusLabel(selectedCourse.status)}</strong>
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
                <span>ราคาคอร์ส</span>
                <strong>{formatCurrency(selectedCourse.amount)}</strong>
              </div>

              <div className="smc-detail-row">
                <span>ส่วนลด</span>
                <strong>{formatCurrency(selectedCourse.discountAmount)}</strong>
              </div>

              <div className="smc-detail-row">
                <span>ยอดชำระ</span>
                <strong>{formatCurrency(selectedCourse.finalAmount)}</strong>
              </div>

              <div className="smc-detail-row">
                <span>หมายเหตุ</span>
                <strong>{safeText(selectedCourse.note)}</strong>
              </div>

              <div className="smc-detail-row">
                <span>ผู้อนุมัติ</span>
                <strong>{safeText(selectedCourse.approvedBy)}</strong>
              </div>

              <div className="smc-detail-row">
                <span>วันที่อนุมัติ</span>
                <strong>{formatDateTime(selectedCourse.approvedAt)}</strong>
              </div>

              <div className="smc-detail-row">
                <span>วันที่สร้างข้อมูล</span>
                <strong>{formatDateTime(selectedCourse.createdAt)}</strong>
              </div>

              <div className="smc-detail-row">
                <span>วันที่อัปเดตล่าสุด</span>
                <strong>{formatDateTime(selectedCourse.updatedAt)}</strong>
              </div>

              <div className="smc-detail-row">
                <span>หลักฐานการชำระเงิน</span>
                <strong>
                  {selectedCourse.paymentSlipUrl ? (
                    <a
                      href={resolveFileUrl(selectedCourse.paymentSlipUrl)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      ดูหลักฐานการชำระเงิน
                    </a>
                  ) : (
                    '-'
                  )}
                </strong>
              </div>
            </div>

            <div className="smc-modal-footer">
              <button
                type="button"
                className="smc-primary-btn"
                onClick={() => setSelectedCourse(null)}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentMyCoursesPage;