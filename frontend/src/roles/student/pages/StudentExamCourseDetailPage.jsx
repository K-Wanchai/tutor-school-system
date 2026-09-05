import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMyExamResults, getMyExamSchedule } from '../services/studentExamService';
import './StudentExamSchedulePage.css';

const STATUS_LABELS = {
  DRAFT: 'ยังไม่เปิดสอบ',
  OPEN: 'เปิดสอบอยู่',
  CLOSED: 'ปิดสอบแล้ว',
  CANCELLED: 'ยกเลิก',
};

const FILTERS = [
  { key: 'ALL', label: 'ทั้งหมด' },
  { key: 'OPEN', label: 'เปิดสอบอยู่' },
  { key: 'DRAFT', label: 'ยังไม่เปิด' },
  { key: 'CLOSED', label: 'ปิดแล้ว' },
];

function safeText(value) {
  return value === null || value === undefined || value === '' ? '-' : value;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusClass(status) {
  return `es-status es-status-${String(status || 'unknown').toLowerCase()}`;
}

function getErrorMessage(err) {
  const status = err?.response?.status;
  if (status === 401) return 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
  if (status === 403) return 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้';
  if (status === 500) return 'เกิดข้อผิดพลาดจากระบบ กรุณาลองใหม่อีกครั้ง';
  return err?.response?.data?.message || err?.message || 'ไม่สามารถโหลดตารางสอบได้';
}

export default function StudentExamCourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const [examData, resultData] = await Promise.all([
        getMyExamSchedule(),
        getMyExamResults().catch(() => []),
      ]);
      const list = Array.isArray(examData) ? examData : [];
      list.sort((a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return new Date(a.startTime) - new Date(b.startTime);
      });
      setExams(list);
      setResults(Array.isArray(resultData) ? resultData : []);
    } catch (err) {
      setError(getErrorMessage(err));
      setExams([]);
    } finally {
      setLoading(false);
    }
  }

  // คะแนนที่ได้มาจากการยื่นสอบในระบบ (ExamSubmission) — ข้อสอบใหม่ทำผ่านลิงก์ภายนอกจึงไม่มีข้อมูลนี้
  // เลือกครั้งล่าสุดถ้ามีสอบซ้ำได้หลายครั้ง (allowMultipleAttempts)
  function findObtainedScore(examId) {
    const matches = results.filter((r) => String(r.examId) === String(examId));
    if (matches.length === 0) return null;
    matches.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
    return matches[0].obtainedScore;
  }

  useEffect(() => {
    load();
  }, [courseId]);

  const courseExams = useMemo(
    () => exams.filter((e) => String(e.courseId) === String(courseId)),
    [exams, courseId]
  );

  const courseName = courseExams[0]?.courseName;
  const courseCode = courseExams[0]?.courseCode;
  const tutorName = courseExams[0]?.teacherName;

  const summary = useMemo(() => {
    return {
      total: courseExams.length,
      open: courseExams.filter((e) => e.status === 'OPEN').length,
      upcoming: courseExams.filter((e) => e.status === 'DRAFT').length,
      closed: courseExams.filter((e) => e.status === 'CLOSED').length,
    };
  }, [courseExams]);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return courseExams;
    return courseExams.filter((e) => e.status === filter);
  }, [courseExams, filter]);

  if (!loading && !error && courseExams.length === 0) {
    return (
      <div className="es-page">
        <div className="es-error-box">
          <strong>ไม่พบตารางสอบของคอร์สนี้</strong>
          <button type="button" className="es-take-btn" onClick={() => navigate('/student/exam-schedule')}>
            กลับไปหน้าตารางสอบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="es-page">
      <section className="es-hero-card">
        <div>
          <button type="button" className="es-back-link" onClick={() => navigate('/student/exam-schedule')}>
            ‹ กลับไปหน้าตารางสอบ
          </button>
          <p className="es-eyebrow">Student Exam Schedule</p>
          <h1>{safeText(courseCode)} — {safeText(courseName)}</h1>
          <p>ผู้สอน: {safeText(tutorName)}</p>
          <p>ดูกำหนดการสอบของคอร์สนี้ ทั้งที่ยังไม่เปิด กำลังเปิดสอบ และปิดสอบแล้ว</p>
        </div>
        <div className="es-hero-icon" aria-hidden="true">📝</div>
      </section>

      <section className="es-summary-grid">
        <div className="es-summary-card"><span>ข้อสอบทั้งหมด</span><strong>{summary.total}</strong></div>
        <div className="es-summary-card"><span>เปิดสอบอยู่</span><strong>{summary.open}</strong></div>
        <div className="es-summary-card"><span>ยังไม่เปิด</span><strong>{summary.upcoming}</strong></div>
        <div className="es-summary-card"><span>ปิดแล้ว</span><strong>{summary.closed}</strong></div>
      </section>

      <section className="es-content-card">
        <div className="es-filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={filter === f.key ? 'es-filter-active' : ''}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

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

        {!loading && !error && filtered.length === 0 && (
          <div className="es-empty-state">
            <div className="es-empty-icon">🗓️</div>
            <h3>ไม่มีข้อสอบในสถานะนี้</h3>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="es-grid">
            {filtered.map((exam) => (
              <article key={exam.id} className="es-card">
                <div className="es-card-top">
                  <div>
                    <p className="es-card-course">{safeText(exam.examCode)}</p>
                    <h3>{safeText(exam.title)}</h3>
                  </div>
                  <span className={getStatusClass(exam.status)}>
                    {STATUS_LABELS[exam.status] || exam.status}
                  </span>
                </div>

                {exam.description && <p className="es-card-desc">{exam.description}</p>}

                <div className="es-info-list">
                  <div>
                    <span>เวลาเปิดสอบ</span>
                    <strong>{formatDateTime(exam.startTime)}</strong>
                  </div>
                  <div>
                    <span>เวลาปิดสอบ</span>
                    <strong>{formatDateTime(exam.endTime)}</strong>
                  </div>
                  <div>
                    <span>ระยะเวลาทำข้อสอบ</span>
                    <strong>{exam.durationMinutes ? `${exam.durationMinutes} นาที` : '-'}</strong>
                  </div>
                  <div>
                    <span>คะแนนที่ได้ / คะแนนเต็ม</span>
                    <strong>
                      {findObtainedScore(exam.id) ?? '-'} / {exam.totalScore ?? '-'}
                    </strong>
                  </div>
                </div>

                {exam.status === 'OPEN' && (
                  exam.examLink ? (
                    <a
                      className="es-take-btn"
                      href={exam.examLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      เริ่มทำข้อสอบ
                    </a>
                  ) : (
                    <div className="es-take-btn es-take-btn--disabled">
                      ยังไม่มีลิงก์ข้อสอบ ติดต่อติวเตอร์
                    </div>
                  )
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
