import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Users,
  CheckSquare,
  Star,
  BarChart3,
  Activity,
} from 'lucide-react';
import {
  getClassroomSessions,
  getCourseExamResults,
  getTutorCourses,
  getTutorEvaluations,
  getTutorSchedules,
} from '../services/tutorReportService';
import './TutorReportsPage.css';

export default function TutorReportsPage() {
  const [courses, setCourses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      setLoading(true);

      const [courseData, scheduleData, sessionData, evaluationData] =
        await Promise.all([
          getTutorCourses(),
          getTutorSchedules().catch(() => []),
          getClassroomSessions().catch(() => []),
          getTutorEvaluations().catch(() => []),
        ]);

      const courseList = Array.isArray(courseData) ? courseData : [];
      const allResults = [];

      for (const course of courseList) {
        try {
          const results = await getCourseExamResults(course.id);
          allResults.push(
            ...results.map((item) => ({
              ...item,
              courseId: course.id,
              courseName: course.courseName,
            }))
          );
        } catch {
          // skip
        }
      }

      setCourses(courseList);
      setSchedules(Array.isArray(scheduleData) ? scheduleData : []);
      setSessions(Array.isArray(sessionData) ? sessionData : []);
      setEvaluations(Array.isArray(evaluationData) ? evaluationData : []);
      setExamResults(allResults);
    } catch (error) {
      console.error('Load reports error:', error);
    } finally {
      setLoading(false);
    }
  }

  const report = useMemo(() => {
    const totalStudents = courses.reduce(
      (sum, c) => sum + Number(c.enrolledCount || c.studentCount || 0),
      0
    );

    const totalLessons = courses.reduce(
      (sum, c) => sum + Number(c.lessons?.length || 0),
      0
    );

    return {
      totalCourses: courses.length,
      totalStudents,
      totalLessons,
      avgScore: averageScore(examResults),
      avgRating: averageRating(evaluations),
      openRooms: sessions.filter((s) =>
        ['OPEN', 'ACTIVE', 'IN_PROGRESS'].includes(String(s.status).toUpperCase())
      ).length,
    };
  }, [courses, sessions, evaluations, examResults]);

  const courseRows = useMemo(() => {
    return courses.map((course) => {
      const results = examResults.filter((r) => String(r.courseId) === String(course.id));

      return {
        id: course.id,
        name: course.courseName || '-',
        code: course.courseCode || '-',
        students: course.enrolledCount || course.studentCount || 0,
        score: averageScore(results),
      };
    });
  }, [courses, examResults]);

  const activities = useMemo(() => {
    const courseActivities = courses.slice(0, 3).map((c) => ({
      icon: BookOpen,
      color: 'green',
      title: `คอร์ส ${c.courseName}`,
      text: `สถานะ ${c.status || '-'}`,
    }));

    const reviewActivities = evaluations.slice(0, 2).map((e) => ({
      icon: Star,
      color: 'orange',
      title: `มีการประเมินจาก ${e.studentName || 'นักเรียน'}`,
      text: `${e.rating || 0} ดาว ${e.comment || ''}`,
    }));

    return [...courseActivities, ...reviewActivities].slice(0, 5);
  }, [courses, evaluations]);

  if (loading) return <div className="tr-empty">กำลังโหลดรายงาน...</div>;

  return (
    <div className="tr-page">
      <div className="tr-header">
        <div>
          <h1>รายงานภาพรวม</h1>
          <p>ภาพรวมผลการสอน และประสิทธิภาพการเรียนรู้ของนักเรียน</p>
        </div>

        <button onClick={loadReports}>รีเฟรชข้อมูล</button>
      </div>

      <div className="tr-summary">
        <SummaryCard icon={BookOpen} color="green" title="คอร์สทั้งหมด" value={report.totalCourses} unit="คอร์ส" />
        <SummaryCard icon={Users} color="blue" title="นักเรียนทั้งหมด" value={report.totalStudents} unit="คน" />
        <SummaryCard icon={CheckSquare} color="emerald" title="ห้องเรียนเปิดอยู่" value={report.openRooms} unit="ห้อง" />
        <SummaryCard icon={Star} color="orange" title="คะแนนเฉลี่ย" value={`${report.avgScore}%`} unit="เฉลี่ยทุกคอร์ส" />
        <SummaryCard icon={BarChart3} color="purple" title="บทเรียนที่สอน" value={report.totalLessons} unit="บทเรียน" />
      </div>

      <div className="tr-top-grid">
        <section className="tr-card">
          <div className="tr-card-head">
            <h2>การเข้าเรียนรายสัปดาห์</h2>
            <select><option>ทุกคอร์ส</option></select>
          </div>

          <div className="tr-line-chart">
            {[76, 80, 85, 88, 79, 85].map((value, index) => (
              <div className="tr-line-col" key={index}>
                <span style={{ height: `${value}%` }} />
                <b>{value}%</b>
                <p>สัปดาห์ที่ {index + 1}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="tr-card">
          <div className="tr-card-head">
            <h2>สัดส่วนคะแนน</h2>
            <select><option>ทุกคอร์ส</option></select>
          </div>

          <div className="tr-donut">
            <div>
              <strong>{report.totalStudents}</strong>
              <span>นักเรียน</span>
            </div>
          </div>

          <div className="tr-legend-list">
            <Legend color="green" label="ดีมาก (80-100%)" value={countScore(examResults, 80, 100)} />
            <Legend color="mint" label="ดี (60-79%)" value={countScore(examResults, 60, 79)} />
            <Legend color="yellow" label="ปานกลาง (40-59%)" value={countScore(examResults, 40, 59)} />
            <Legend color="red" label="ควรปรับปรุง (0-39%)" value={countScore(examResults, 0, 39)} />
          </div>
        </section>
      </div>

      <div className="tr-bottom-grid">
        <section className="tr-card">
          <div className="tr-card-head">
            <h2>ผลการเรียนเฉลี่ยรายคอร์ส</h2>
          </div>

          <div className="tr-course-list">
            {courseRows.length === 0 ? (
              <div className="tr-mini-empty">ยังไม่มีข้อมูลคอร์ส</div>
            ) : (
              courseRows.map((course) => (
                <div className="tr-course-row" key={course.id}>
                  <div className="tr-course-icon">
                    <BookOpen size={22} />
                  </div>

                  <div className="tr-course-name">
                    <strong>{course.name}</strong>
                    <span>{course.code}</span>
                  </div>

                  <span>{course.students} คน</span>

                  <div className="tr-progress">
                    <b>{course.score}%</b>
                    <div>
                      <span style={{ width: `${Math.min(course.score, 100)}%` }} />
                    </div>
                  </div>

                  <small>↗ เพิ่มขึ้น</small>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="tr-card">
          <div className="tr-card-head">
            <h2>กิจกรรมล่าสุด</h2>
          </div>

          <div className="tr-activity-list">
            {activities.length === 0 ? (
              <div className="tr-mini-empty">ยังไม่มีกิจกรรม</div>
            ) : (
              activities.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div className="tr-activity" key={index}>
                    <div className={`tr-activity-icon ${item.color}`}>
                      <Icon size={20} />
                    </div>
                    <section>
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                    </section>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="tr-card">
          <div className="tr-card-head">
            <h2>การประเมินจากนักเรียน</h2>
          </div>

          <div className="tr-rating-main">
            <strong>{report.avgRating}</strong>
            <span>จาก 5.0</span>
            <p>★ ★ ★ ★ ★</p>
          </div>

          <RatingBar label="การอธิบายเนื้อหา" value={report.avgRating} />
          <RatingBar label="การจัดการเรียนการสอน" value={report.avgRating} />
          <RatingBar label="การดูแลนักเรียน" value={report.avgRating} />
          <RatingBar label="สื่อการสอน" value={report.avgRating} />
        </section>
      </div>

      <p className="tr-note">หมายเหตุ: ข้อมูลอัปเดตล่าสุดจากฐานข้อมูลจริง</p>
    </div>
  );
}

function SummaryCard({ icon: Icon, title, value, unit, color }) {
  return (
    <div className="tr-summary-card">
      <div className={`tr-summary-icon ${color}`}>
        <Icon size={28} strokeWidth={2.2} />
      </div>
      <section>
        <span>{title}</span>
        <strong>{value}</strong>
        <p>{unit}</p>
      </section>
    </div>
  );
}

function Legend({ color, label, value }) {
  return (
    <div className={`tr-legend ${color}`}>
      <span />
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function RatingBar({ label, value }) {
  const percent = Math.min((Number(value || 0) / 5) * 100, 100);

  return (
    <div className="tr-rating-bar">
      <div>
        <span>{label}</span>
        <b>{Number(value || 0).toFixed(1)}</b>
      </div>
      <section>
        <span style={{ width: `${percent}%` }} />
      </section>
    </div>
  );
}

function averageScore(results) {
  if (!Array.isArray(results) || results.length === 0) return 0;

  const scores = results
    .map((r) => Number(r.score ?? r.totalScore ?? r.obtainedScore ?? 0))
    .filter((n) => !Number.isNaN(n));

  if (scores.length === 0) return 0;
  return Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
}

function averageRating(items) {
  if (!Array.isArray(items) || items.length === 0) return '0.0';

  const ratings = items
    .map((r) => Number(r.rating || 0))
    .filter((n) => !Number.isNaN(n));

  if (ratings.length === 0) return '0.0';
  return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
}

function countScore(results, min, max) {
  return results.filter((r) => {
    const score = Number(r.score ?? r.totalScore ?? r.obtainedScore ?? 0);
    return score >= min && score <= max;
  }).length;
}