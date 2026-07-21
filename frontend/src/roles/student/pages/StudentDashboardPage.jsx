import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentDashboard } from '../services/studentDashboardService';
import { getMyCourses } from '../services/studentMyCoursesService.js';
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
  PENDING_VERIFICATION: 'รอการยืนยันชำระเงิน',
  PAID: 'ชำระเงินแล้ว',
  FAILED: 'ชำระเงินไม่สำเร็จ',
  REFUNDED: 'คืนเงินแล้ว',
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

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'นักเรียน';

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

  const previewCourses = useMemo(() => {
    return myCourses.slice(0, 3);
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
            ตรวจสอบคอร์สเรียน ตารางเรียน ผลสอบ การเข้าเรียน และการแจ้งเตือนของคุณ
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
        <div className="student-stat-card student-course-stat-card">
          <div className="student-stat-icon">📚</div>

          <div className="student-course-stat-content">
            <p>คอร์สเรียนของฉัน</p>
            <h2>{courseSummary.total}</h2>
            <span>
              ชำระเงินเรียบร้อยแล้ว {courseSummary.approved} คอร์ส · รออนุมัติ {courseSummary.pending} คอร์ส
            </span>

            <div className="student-course-mini-list">
              {previewCourses.length === 0 ? (
                <div className="student-course-mini-empty">
                  ยังไม่มีคอร์สเรียน
                </div>
              ) : (
                previewCourses.map((course) => (
                  <button
                    type="button"
                    className="student-course-mini-item"
                    key={course.id || course.enrollmentCode}
                    onClick={() => navigate('/student/my-courses')}
                  >
                    <div>
                      <strong>{safeText(course.courseName)}</strong>
                      <small>
                        {getEnrollmentStatusLabel(course.status)} · {getPaymentStatusLabel(course.paymentStatus)}
                      </small>
                    </div>

                    <span>{formatCurrency(course.finalAmount || course.amount)}</span>
                  </button>
                ))
              )}
            </div>

            {myCourses.length > 3 && (
              <button
                type="button"
                className="student-view-all-course-btn"
                onClick={() => navigate('/student/my-courses')}
              >
                ดูคอร์สทั้งหมด {myCourses.length} คอร์ส
              </button>
            )}
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">📅</div>
          <div>
            <p>ตารางเรียนวันนี้</p>
            <h2>{dashboard?.todayClasses ?? '-'}</h2>
            <span>คลาสเรียนวันนี้</span>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">📝</div>
          <div>
            <p>คะแนนเฉลี่ย</p>
            <h2>{dashboard?.averageScore != null ? `${dashboard.averageScore}%` : '-'}</h2>
            <span>จากผลสอบทั้งหมด</span>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">✅</div>
          <div>
            <p>การเข้าเรียน</p>
            <h2>{dashboard?.attendanceRate != null ? `${dashboard.attendanceRate}%` : '-'}</h2>
            <span>อัตราการเข้าเรียน</span>
          </div>
        </div>
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
              onClick={() => navigate('/student/my-courses')}
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
                    onClick={() => navigate('/student/my-courses')}
                  >
                    ดูรายละเอียด
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="student-panel">
          <div className="student-panel-header">
            <div>
              <h2>ตารางเรียนวันนี้</h2>
              <p>คลาสที่กำลังจะมาถึง</p>
            </div>
          </div>

          {!dashboard?.todaySchedules?.length ? (
            <EmptyState text="ยังไม่มีตารางเรียนวันนี้" />
          ) : (
            <div className="student-schedule-list">
              {dashboard.todaySchedules.map((item) => (
                <div className="student-schedule-item" key={item.id}>
                  <span>{item.startTime || '-'}</span>
                  <div>
                    <strong>{item.courseName || '-'}</strong>
                    <p>{item.lessonName || '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="student-panel">
          <div className="student-panel-header">
            <div>
              <h2>คะแนนสอบล่าสุด</h2>
              <p>ผลสอบและสถานะ</p>
            </div>
          </div>

          {!dashboard?.latestExams?.length ? (
            <EmptyState text="ยังไม่มีข้อมูลคะแนนสอบ" />
          ) : (
            <div className="student-exam-list">
              {dashboard.latestExams.map((exam) => (
                <div className="student-exam-item" key={exam.id}>
                  <div>
                    <strong>{exam.examName || '-'}</strong>
                    <span>
                      {exam.score != null ? `${exam.score}/${exam.totalScore}` : '-'}
                    </span>
                  </div>
                  <p>{exam.status || '-'}</p>
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