import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentDashboard } from '../services/studentDashboardService';
import { getMyCourses } from '../services/studentMyCoursesService.js';
import { getUsername } from '../../../shared/utils/tokenUtils';
import './StudentDashboardPage.css';

const ENROLLMENT_STATUS_LABELS = {
  PENDING: 'รออนุมัติ',
  APPROVED: 'ชำระเงินเรียบร้อยแล้ว',
  REJECTED: 'ถูกปฏิเสธ',
  CANCELLED: 'ยกเลิก',
  COMPLETED: 'เรียนจบแล้ว',
};

const PAYMENT_STATUS_LABELS = {
  UNPAID: 'ยังไม่ชำระเงิน',
  PENDING_VERIFICATION: 'รอตรวจสอบสลิป',
  PAID: 'ชำระเงินแล้ว',
  FAILED: 'ชำระเงินไม่สำเร็จ',
};

function safeText(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return value;
}

function getEnrollmentStatusLabel(status) {
  return ENROLLMENT_STATUS_LABELS[status] || safeText(status);
}

function getPaymentStatusLabel(status) {
  return PAYMENT_STATUS_LABELS[status] || safeText(status);
}

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const username = getUsername() || 'นักเรียน';

  const [dashboard, setDashboard] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const today = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setErrorMessage('');

        const [dashboardData, myCoursesData] = await Promise.all([
          getStudentDashboard(),
          getMyCourses().catch(() => []),
        ]);

        setDashboard(dashboardData);
        setMyCourses(Array.isArray(myCoursesData) ? myCoursesData : []);
      } catch (error) {
        console.error('Student dashboard error:', error);

        setErrorMessage(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้'
        );

        setDashboard(null);
        setMyCourses([]);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const courseSummary = useMemo(() => {
    return {
      total: myCourses.length,
      approved: myCourses.filter((item) => item.status === 'APPROVED').length,
      pending: myCourses.filter((item) => item.status === 'PENDING').length,
      paid: myCourses.filter((item) => item.paymentStatus === 'PAID').length,
    };
  }, [myCourses]);

  if (loading) {
    return (
      <div className="student-dashboard-page">
        <div className="student-dashboard-loading">
          <div className="student-loading-spinner" />
          <p>กำลังโหลดข้อมูลแดชบอร์ด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard-page">
      <section className="student-hero-card">
        <div>
          <p className="student-hero-date">{today}</p>
          <h1>สวัสดี, {dashboard?.fullName || username}</h1>
          <p>
            ตรวจสอบคอร์สเรียนและการชำระเงินของคุณ
          </p>
        </div>

        <div className="student-hero-badge">
          <span>STUDENT</span>
          <strong>{dashboard?.studentCode || 'รอข้อมูล'}</strong>
        </div>
      </section>

      {errorMessage && (
        <div className="student-dashboard-error">
          {errorMessage}
        </div>
      )}

      <section className="student-stat-grid">
        <button
          type="button"
          className="student-stat-card"
          onClick={() => navigate('/student/courses')}
        >
          <div className="student-stat-icon">📚</div>
          <div>
            <p>คอร์สเรียนของฉัน</p>
            <h2>{courseSummary.total}</h2>
            <span>
              ชำระเงินเรียบร้อยแล้ว {courseSummary.approved} คอร์ส · รออนุมัติ {courseSummary.pending} คอร์ส
            </span>
          </div>
        </button>

        <button
          type="button"
          className="student-stat-card"
          onClick={() => navigate('/student/exam-schedule')}
        >
          <div className="student-stat-icon">📝</div>
          <div>
            <p>ตารางสอบ</p>
            <h2>ดูตารางสอบ</h2>
            <span>ตรวจสอบกำหนดการสอบของคอร์สที่เรียนอยู่</span>
          </div>
        </button>

        <button
          type="button"
          className="student-stat-card"
          onClick={() => navigate('/student/payments')}
        >
          <div className="student-stat-icon">💳</div>
          <div>
            <p>การชำระเงิน</p>
            <h2>{courseSummary.paid}</h2>
            <span>คอร์สที่ชำระเงินแล้ว</span>
          </div>
        </button>
      </section>

      <section className="student-dashboard-grid">
        <div className="student-panel student-panel-large">
          <div className="student-panel-header">
            <div>
              <h2>คอร์สของฉัน</h2>
              <p>รายการคอร์สที่ลงทะเบียนเรียนล่าสุด</p>
            </div>

            <button
              type="button"
              className="student-panel-link-btn"
              onClick={() => navigate('/student/courses')}
            >
              ดูทั้งหมด
            </button>
          </div>

          {!myCourses.length ? (
            <EmptyState text="ยังไม่มีข้อมูลคอร์สจากฐานข้อมูล" />
          ) : (
            <div className="student-course-list">
              {myCourses.slice(0, 5).map((course) => (
                <div
                  className="student-course-card"
                  key={course.id || course.enrollmentCode}
                >
                  <div className="student-course-info">
                    <h3>{safeText(course.courseName)}</h3>
                    <p>
                      สถานะสมัคร: {getEnrollmentStatusLabel(course.status)}
                    </p>
                    <span>
                      ชำระเงิน: {getPaymentStatusLabel(course.paymentStatus)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="student-course-btn"
                    onClick={() => navigate('/student/courses')}
                  >
                    ดูรายละเอียด
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="student-empty-state">
      <div>⌛</div>
      <p>{text}</p>
    </div>
  );
}
