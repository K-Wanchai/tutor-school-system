import { useEffect, useMemo, useState } from 'react';
import RefreshButton from '../components/RefreshButton';
import {
  BookOpen,
  Users,
  Star,
} from 'lucide-react';
import {
  getTutorCourses,
  getTutorEvaluations,
} from '../services/tutorReportService';
import './TutorReportsPage.css';

export default function TutorReportsPage() {
  const [courses, setCourses] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      setLoading(true);

      const [courseData, evaluationData] = await Promise.all([
        getTutorCourses(),
        getTutorEvaluations().catch(() => []),
      ]);

      setCourses(Array.isArray(courseData) ? courseData : []);
      setEvaluations(Array.isArray(evaluationData) ? evaluationData : []);
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

    return {
      totalCourses: courses.length,
      totalStudents,
      avgRating: averageRating(evaluations),
    };
  }, [courses, evaluations]);

  const courseRows = useMemo(() => {
    return courses.map((course) => ({
      id: course.id,
      name: course.courseName || '-',
      code: course.courseCode || '-',
      students: course.enrolledCount || course.studentCount || 0,
      status: course.status || '-',
    }));
  }, [courses]);

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
          <p>ภาพรวมคอร์สและการประเมินจากนักเรียน</p>
        </div>

        <RefreshButton onClick={loadReports} loading={loading} />
      </div>

      <div className="tr-summary">
        <SummaryCard icon={BookOpen} color="green" title="คอร์สทั้งหมด" value={report.totalCourses} unit="คอร์ส" />
        <SummaryCard icon={Users} color="blue" title="นักเรียนทั้งหมด" value={report.totalStudents} unit="คน" />
        <SummaryCard icon={Star} color="orange" title="คะแนนประเมินเฉลี่ย" value={report.avgRating} unit="จาก 5.0" />
      </div>

      <div className="tr-bottom-grid">
        <section className="tr-card">
          <div className="tr-card-head">
            <h2>คอร์สที่สอนอยู่</h2>
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
                  <small>{course.status}</small>
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

          <RatingBar label="คะแนนประเมินเฉลี่ยรวม" value={report.avgRating} />
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

function averageRating(items) {
  if (!Array.isArray(items) || items.length === 0) return '0.0';

  const ratings = items
    .map((r) => Number(r.rating || 0))
    .filter((n) => !Number.isNaN(n));

  if (ratings.length === 0) return '0.0';
  return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
}
