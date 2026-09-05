import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyExamSchedule } from '../services/studentExamService';
import './StudentExamSchedulePage.css';

function safeText(value) {
  return value === null || value === undefined || value === '' ? '-' : value;
}

function getErrorMessage(err) {
  const status = err?.response?.status;
  if (status === 401) return 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
  if (status === 403) return 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้';
  if (status === 500) return 'เกิดข้อผิดพลาดจากระบบ กรุณาลองใหม่อีกครั้ง';
  return err?.response?.data?.message || err?.message || 'ไม่สามารถโหลดตารางสอบได้';
}

export default function StudentExamSchedulePage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const data = await getMyExamSchedule();
      setExams(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
      setExams([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // จัดกลุ่มข้อสอบตามคอร์ส — หน้านี้แสดงเป็น card คอร์ส (เหมือนหน้าติวเตอร์) กดเข้าไปดูข้อสอบแต่ละครั้งของคอร์สนั้น
  const courses = useMemo(() => {
    const map = new Map();
    exams.forEach((e) => {
      const key = String(e.courseId);
      if (!map.has(key)) {
        map.set(key, {
          courseId: e.courseId,
          courseName: e.courseName,
          courseCode: e.courseCode,
          tutorName: e.teacherName,
          exams: [],
        });
      }
      map.get(key).exams.push(e);
    });
    return Array.from(map.values());
  }, [exams]);

  const summary = useMemo(() => {
    return {
      totalCourses: courses.length,
      totalExams: exams.length,
      open: exams.filter((e) => e.status === 'OPEN').length,
      upcoming: exams.filter((e) => e.status === 'DRAFT').length,
    };
  }, [courses, exams]);

  return (
    <div className="es-page">
      <section className="es-hero-card">
        <div>
          <p className="es-eyebrow">Student Exam Schedule</p>
          <h1>ตารางสอบของฉัน</h1>
          <p>เลือกคอร์สเพื่อดูกำหนดการสอบของคอร์สนั้น ทั้งที่ยังไม่เปิด กำลังเปิดสอบ และปิดสอบแล้ว</p>
        </div>
        <div className="es-hero-icon" aria-hidden="true">📝</div>
      </section>

      <section className="es-summary-grid">
        <div className="es-summary-card"><span>คอร์สที่มีข้อสอบ</span><strong>{summary.totalCourses}</strong></div>
        <div className="es-summary-card"><span>ข้อสอบทั้งหมด</span><strong>{summary.totalExams}</strong></div>
        <div className="es-summary-card"><span>เปิดสอบอยู่</span><strong>{summary.open}</strong></div>
        <div className="es-summary-card"><span>ยังไม่เปิด</span><strong>{summary.upcoming}</strong></div>
      </section>

      <section className="es-content-card">
        {loading && (
          <div className="es-loading">
            <div className="es-spinner" />
            <p>กำลังโหลดตารางสอบ...</p>
          </div>
        )}

        {!loading && error && (
          <div className="es-error-box">
            <strong>เกิดข้อผิดพลาด</strong>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="es-empty-state">
            <div className="es-empty-icon">🗓️</div>
            <h3>ยังไม่มีข้อสอบ</h3>
            <p>เมื่อติวเตอร์กำหนดวันสอบของคอร์สที่คุณลงทะเบียนไว้ รายการจะแสดงที่นี่</p>
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="es-grid">
            {courses.map((course) => {
              const open = course.exams.filter((e) => e.status === 'OPEN').length;
              return (
                <article
                  key={course.courseId}
                  className="es-card es-card--clickable"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/student/exam-schedule/${course.courseId}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/student/exam-schedule/${course.courseId}`); }}
                >
                  <div className="es-card-top">
                    <div>
                      <p className="es-card-course">{safeText(course.courseCode)}</p>
                      <h3>{safeText(course.courseName)}</h3>
                    </div>
                    {open > 0 && <span className="es-status es-status-open">เปิดสอบอยู่ {open}</span>}
                  </div>

                  <div className="es-info-list">
                    <div>
                      <span>ผู้สอน</span>
                      <strong>{safeText(course.tutorName)}</strong>
                    </div>
                    <div>
                      <span>จำนวนข้อสอบ</span>
                      <strong>{course.exams.length} ชุด</strong>
                    </div>
                    <div>
                      <span>ยังไม่เปิด</span>
                      <strong>{course.exams.filter((e) => e.status === 'DRAFT').length} ชุด</strong>
                    </div>
                  </div>

                  <button type="button" className="es-take-btn">ดูตารางสอบ</button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
