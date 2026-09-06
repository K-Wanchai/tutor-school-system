import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getCoursesByTutorId,
  getEnrollmentsByCourse,
  getExamsByCourse,
  getManualScoresByCourse,
  getResultsByCourse,
} from '../services/adminExamService';
import './AdminExamPages.css';

const ACTIVE_ENROLLMENT_STATUSES = new Set(['APPROVED', 'COMPLETED']);
const cellKey = (examId, studentId) => `${examId}-${studentId}`;

function isExamDue(exam) {
  if (exam.status === 'OPEN' || exam.status === 'CLOSED') return true;
  if (exam.startTime && new Date(exam.startTime).getTime() <= Date.now()) return true;
  return false;
}

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminExamCourseScoresPage() {
  const { tutorId, courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [manualScores, setManualScores] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [courseR, examR, resultR, manualR, enrollR] = await Promise.allSettled([
      getCoursesByTutorId(tutorId),
      getExamsByCourse(courseId),
      getResultsByCourse(courseId),
      getManualScoresByCourse(courseId),
      getEnrollmentsByCourse(courseId),
    ]);
    const errs = [];
    const take = (r, label) => {
      if (r.status === 'fulfilled') return Array.isArray(r.value) ? r.value : [];
      errs.push(`${label}: ${r.reason?.message || 'โหลดไม่สำเร็จ'}`);
      return [];
    };
    const courseList = take(courseR, 'คอร์ส');
    setCourse(courseList.find((c) => String(c.id) === String(courseId)) || null);
    setExams(take(examR, 'ข้อสอบ'));
    setResults(take(resultR, 'ผลสอบจากระบบ'));
    setManualScores(take(manualR, 'คะแนนที่กรอกเอง'));
    setEnrollments(take(enrollR, 'รายชื่อนักเรียน').filter((e) => ACTIVE_ENROLLMENT_STATUSES.has(e.status)));
    setError(errs.join(' · '));
    setLoading(false);
  }, [tutorId, courseId]);

  useEffect(() => { load(); }, [load]);

  const lessonOrderByLessonId = useMemo(() => {
    const map = {};
    (course?.lessons || []).forEach((l) => { map[l.id] = l.lessonOrder; });
    return map;
  }, [course]);

  const orderedExams = useMemo(() => {
    return [...exams]
      .filter((e) => e.status !== 'CANCELLED')
      .sort((a, b) => {
        const oa = lessonOrderByLessonId[a.lessonId] ?? 999;
        const ob = lessonOrderByLessonId[b.lessonId] ?? 999;
        if (oa !== ob) return oa - ob;
        return (a.startTime ? new Date(a.startTime).getTime() : 0) -
          (b.startTime ? new Date(b.startTime).getTime() : 0);
      });
  }, [exams, lessonOrderByLessonId]);

  const systemScoreMap = useMemo(() => {
    const map = {};
    results.forEach((r) => {
      const key = cellKey(r.examId, r.studentId);
      const cur = map[key];
      if (!cur || (r.attemptNumber || 1) >= (cur.attemptNumber || 1)) {
        map[key] = { score: r.obtainedScore, attemptNumber: r.attemptNumber || 1 };
      }
    });
    return map;
  }, [results]);

  const manualScoreMap = useMemo(() => {
    const map = {};
    manualScores.forEach((m) => { map[cellKey(m.examId, m.studentId)] = m.score; });
    return map;
  }, [manualScores]);

  const studentRows = useMemo(() => {
    const byId = {};
    enrollments.forEach((e) => {
      byId[e.studentId] = { studentId: e.studentId, studentName: e.studentName };
    });
    results.forEach((r) => {
      if (!byId[r.studentId]) byId[r.studentId] = { studentId: r.studentId, studentName: r.studentName };
    });
    manualScores.forEach((m) => {
      if (!byId[m.studentId]) byId[m.studentId] = { studentId: m.studentId, studentName: m.studentName };
    });
    return Object.values(byId).sort((a, b) =>
      (a.studentName || '').localeCompare(b.studentName || '', 'th')
    );
  }, [enrollments, results, manualScores]);

  const savedScoreFor = useCallback((examId, studentId) => {
    const key = cellKey(examId, studentId);
    if (key in manualScoreMap) return manualScoreMap[key];
    const sys = systemScoreMap[key];
    return sys ? sys.score : undefined;
  }, [manualScoreMap, systemScoreMap]);

  function averagePctFor(studentId) {
    let sum = 0;
    let count = 0;
    orderedExams.forEach((e) => {
      const v = savedScoreFor(e.id, studentId);
      if (v != null && e.totalScore) {
        sum += (Number(v) / e.totalScore) * 100;
        count += 1;
      }
    });
    return count > 0 ? Math.round(sum / count) : null;
  }

  const totalMax = orderedExams.reduce((s, e) => s + (e.totalScore || 0), 0);

  return (
    <div className="aes-page">
      <button
        type="button"
        className="aes-back"
        onClick={() => navigate(`/admin/exams/tutors/${tutorId}`)}
      >
        ← กลับไปหน้าคอร์สของติวเตอร์
      </button>

      <div className="aes-header">
        <div>
          <div className="aes-detail-title">
            <span className="aes-code">{course?.courseCode || '-'}</span>
            <h1>{course?.courseName || 'คะแนนสอบ'}</h1>
          </div>
          <p className="aes-detail-meta">
            ผู้สอน: <b>{course?.teacherName || '-'}</b> ·
            นักเรียน: <b>{studentRows.length} คน</b> ·
            การสอบ: <b>{orderedExams.length} ครั้ง</b> ·
            เริ่มเรียน: <b>{formatDate(course?.courseStartDate)}</b>
          </p>
        </div>
        <span className="aes-readonly-badge">โหมดดูอย่างเดียว</span>
      </div>

      {error && (
        <div className="aes-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="aes-empty">กำลังโหลดคะแนน...</div>
      ) : orderedExams.length === 0 ? (
        <div className="aes-empty">คอร์สนี้ยังไม่มีการสอบ</div>
      ) : studentRows.length === 0 ? (
        <div className="aes-empty">คอร์สนี้ยังไม่มีนักเรียนที่ลงทะเบียนอนุมัติแล้ว</div>
      ) : (
        <div className="aes-table-card">
          <div className="aes-grid-wrap">
            <table className="aes-score-grid">
              <thead>
                <tr>
                  <th className="aes-col-no" rowSpan={2}>#</th>
                  <th className="aes-col-name" rowSpan={2}>ชื่อนักเรียน</th>
                  {orderedExams.map((exam, i) => (
                    <th key={exam.id} className="aes-exam-th">
                      การสอบครั้งที่ {i + 1}
                      <span className="aes-exam-title">{exam.title}</span>
                      {!isExamDue(exam) && <span className="aes-lock">ยังไม่ถึงกำหนดสอบ</span>}
                    </th>
                  ))}
                  <th className="aes-col-avg" rowSpan={2}>คะแนนเฉลี่ย</th>
                </tr>
                <tr>
                  {orderedExams.map((exam) => (
                    <th key={exam.id} className="aes-sub-th">
                      <span className="aes-sub-got">คะแนนที่ได้</span>
                      <span className="aes-sub-max">คะแนนเต็ม {exam.totalScore ?? '-'}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentRows.map((stu, idx) => (
                  <tr key={stu.studentId}>
                    <td className="aes-col-no">{idx + 1}</td>
                    <td className="aes-col-name">{stu.studentName || '-'}</td>
                    {orderedExams.map((exam) => {
                      const key = cellKey(exam.id, stu.studentId);
                      const saved = savedScoreFor(exam.id, stu.studentId);
                      const fromSystem = !(key in manualScoreMap) && systemScoreMap[key];
                      return (
                        <td
                          key={exam.id}
                          className={`aes-cell${fromSystem ? ' aes-cell-system' : ''}`}
                          title={fromSystem ? 'คะแนนจากการทำข้อสอบในระบบ' : undefined}
                        >
                          {saved != null && saved !== '' ? saved : '—'}
                        </td>
                      );
                    })}
                    <td className="aes-col-avg">
                      {averagePctFor(stu.studentId) != null ? `${averagePctFor(stu.studentId)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="aes-foot-label" colSpan={2}>คะแนนเต็ม</td>
                  {orderedExams.map((exam) => (
                    <td key={exam.id} className="aes-foot-max">{exam.totalScore ?? '-'}</td>
                  ))}
                  <td className="aes-col-avg">{totalMax || '-'}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="aes-legend">
            <span><i className="aes-swatch system" /> คะแนนจากการทำข้อสอบในระบบ</span>
            <span>แอดมินสามารถดูคะแนนได้เท่านั้น ไม่สามารถแก้ไขได้ — การแก้ไขทำได้ที่บัญชีติวเตอร์</span>
          </div>
        </div>
      )}
    </div>
  );
}
