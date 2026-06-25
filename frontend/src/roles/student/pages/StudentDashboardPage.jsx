import { useEffect, useState } from 'react';
import './StudentDashboardPage.css';

export default function StudentDashboardPage() {
  const username = localStorage.getItem('username') || 'นักเรียน';

  const [dashboard, setDashboard] = useState(null);
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

        /*
          TODO: ต่อ API จริงภายหลัง เช่น
          const response = await getStudentDashboard();
          setDashboard(response.data);

          ตอนนี้ยังไม่ใช้ mock data
          จึงปล่อย dashboard = null เพื่อรอ backend จริง
        */

        setDashboard(null);
      } catch (error) {
        setErrorMessage(
          error?.response?.data?.message || 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้'
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

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
        <div className="student-stat-card">
          <div className="student-stat-icon">📚</div>
          <div>
            <p>คอร์สที่กำลังเรียน</p>
            <h2>{dashboard?.totalCourses ?? '-'}</h2>
            <span>ข้อมูลจากฐานข้อมูล</span>
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
              <p>คอร์สที่ลงทะเบียนเรียน</p>
            </div>
          </div>

          {!dashboard?.courses?.length ? (
            <EmptyState text="ยังไม่มีข้อมูลคอร์สจากฐานข้อมูล" />
          ) : (
            <div className="student-course-list">
              {dashboard.courses.map((course) => (
                <div className="student-course-card" key={course.id}>
                  <div className="student-course-info">
                    <h3>{course.courseName}</h3>
                    <p>ผู้สอน: {course.tutorName || '-'}</p>
                    <span>สถานะ: {course.status || '-'}</span>
                  </div>

                  <button className="student-course-btn">
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
                    <span>{exam.score != null ? `${exam.score}/${exam.totalScore}` : '-'}</span>
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