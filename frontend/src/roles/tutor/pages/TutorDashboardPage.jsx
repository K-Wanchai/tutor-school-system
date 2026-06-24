import { useEffect, useMemo, useState } from 'react';
import api from '../../../shared/services/api';
import './TutorDashboardPage.css';

export default function TutorDashboardPage() {
  const username = localStorage.getItem('username') || 'ติวเตอร์';

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [evaluations, setEvaluations] = useState([]);

  const today = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getData = (res) => {
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    return [];
  };

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const requests = [
          api.get('/courses/my-courses').catch(() => ({ data: [] })),
          api.get('/course-schedules/tutor/me').catch(() => ({ data: [] })),
          api.get('/classroom-sessions/tutor/me').catch(() => ({ data: [] })),
          api.get('/course-evaluations/tutor/me').catch(() => ({ data: [] })),
        ];

        const [coursesRes, schedulesRes, sessionsRes, evaluationsRes] = await Promise.all(requests);

        setCourses(getData(coursesRes));
        setSchedules(getData(schedulesRes));
        setSessions(getData(sessionsRes));
        setEvaluations(getData(evaluationsRes));
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const summary = useMemo(() => {
    const activeCourses = courses.filter((c) =>
      ['OPEN', 'ACTIVE', 'OPEN_FOR_REGISTRATION'].includes(c.status)
    ).length;

    const todayText = new Date().toISOString().slice(0, 10);

    const todaySchedules = schedules.filter(
      (s) => s.scheduleDate === todayText
    ).length;

    const openSessions = sessions.filter((s) =>
      ['OPEN', 'ACTIVE', 'IN_PROGRESS'].includes(s.status)
    ).length;

    const avgRating =
      evaluations.length > 0
        ? (
            evaluations.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
            evaluations.length
          ).toFixed(1)
        : '0.0';

    return {
      totalCourses: courses.length,
      activeCourses,
      todaySchedules,
      openSessions,
      totalEvaluations: evaluations.length,
      avgRating,
    };
  }, [courses, schedules, sessions, evaluations]);

  const recentSchedules = schedules.slice(0, 5);
  const recentCourses = courses.slice(0, 5);

  return (
    <div className="tutor-dashboard-page">
      <div className="tutor-dashboard-header">
        <div>
          <h1 className="tutor-dashboard-title">แดชบอร์ดติวเตอร์</h1>
          <p className="tutor-dashboard-date">{today}</p>
        </div>

        <div className="tutor-dashboard-welcome">
          ยินดีต้อนรับ, <strong>{username}</strong>
        </div>
      </div>

      {loading ? (
        <div className="tutor-dashboard-loading">กำลังโหลดข้อมูล...</div>
      ) : (
        <>
          <div className="tutor-dashboard-stats">
            <StatCard title="คอร์สทั้งหมด" value={summary.totalCourses} desc="คอร์สที่รับผิดชอบ" />
            <StatCard title="คอร์สที่เปิดอยู่" value={summary.activeCourses} desc="คอร์สที่กำลังใช้งาน" />
            <StatCard title="ตารางสอนวันนี้" value={summary.todaySchedules} desc="จำนวนคาบวันนี้" />
            <StatCard title="ห้องเรียนเปิดอยู่" value={summary.openSessions} desc="ห้องเรียนที่ใช้งาน" />
            <StatCard title="คะแนนประเมินเฉลี่ย" value={summary.avgRating} desc={`${summary.totalEvaluations} รีวิว`} />
          </div>

          <div className="tutor-dashboard-grid">
            <section className="tutor-dashboard-card">
              <div className="tutor-dashboard-card-head">
                <h2>ตารางสอนล่าสุด</h2>
                <span>{recentSchedules.length} รายการ</span>
              </div>

              {recentSchedules.length === 0 ? (
                <EmptyText text="ยังไม่มีตารางสอน" />
              ) : (
                <div className="tutor-dashboard-list">
                  {recentSchedules.map((item) => (
                    <div className="tutor-dashboard-list-item" key={item.id}>
                      <div>
                        <h3>{item.courseName || 'ไม่ระบุชื่อคอร์ส'}</h3>
                        <p>
                          {item.scheduleDate || '-'} · {item.startTime || '-'} - {item.endTime || '-'}
                        </p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="tutor-dashboard-card">
              <div className="tutor-dashboard-card-head">
                <h2>คอร์สของฉัน</h2>
                <span>{recentCourses.length} รายการ</span>
              </div>

              {recentCourses.length === 0 ? (
                <EmptyText text="ยังไม่มีคอร์ส" />
              ) : (
                <div className="tutor-dashboard-list">
                  {recentCourses.map((item) => (
                    <div className="tutor-dashboard-list-item" key={item.id}>
                      <div>
                        <h3>{item.courseName || 'ไม่ระบุชื่อคอร์ส'}</h3>
                        <p>
                          {item.courseCode || '-'} · {item.maxSeats || 0} ที่นั่ง
                        </p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="tutor-dashboard-card">
            <div className="tutor-dashboard-card-head">
              <h2>รีวิวล่าสุด</h2>
              <span>{evaluations.length} รีวิว</span>
            </div>

            {evaluations.length === 0 ? (
              <EmptyText text="ยังไม่มีผลการประเมินจากนักเรียน" />
            ) : (
              <div className="tutor-dashboard-review-grid">
                {evaluations.slice(0, 3).map((item, index) => (
                  <div className="tutor-dashboard-review" key={index}>
                    <div className="tutor-dashboard-review-rating">★ {item.rating || 0}</div>
                    <p>{item.comment || 'ไม่มีความคิดเห็น'}</p>
                    <strong>{item.studentName || 'นักเรียน'}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, desc }) {
  return (
    <div className="tutor-stat-card">
      <p>{title}</p>
      <h2>{value}</h2>
      <span>{desc}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className="tutor-status-badge">{status || 'UNKNOWN'}</span>;
}

function EmptyText({ text }) {
  return <div className="tutor-empty-text">{text}</div>;
}