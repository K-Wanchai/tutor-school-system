import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMyCourses } from '../services/studentMyCoursesService';
import { getCourseScores, getMyExamSchedule } from '../services/studentExamService';
import '../../admin/pages/AdminExamPages.css';

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

export default function StudentExamResultsCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [exams, setExams] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [courseR, examR, scoreR] = await Promise.allSettled([
      getMyCourses(),
      getMyExamSchedule(),
      getCourseScores(courseId),
    ]);
    const errs = [];
    const take = (r, label) => {
      if (r.status === 'fulfilled') return Array.isArray(r.value) ? r.value : [];
      errs.push(`${label}: ${r.reason?.message || 'โหลดไม่สำเร็จ'}`);
      return [];
    };
    const courseList = take(courseR, 'คอร์ส');
    setCourse(courseList.find((c) => String(c.courseId) === String(courseId)) || null);
    setExams(take(examR, 'ข้อสอบ').filter((e) => String(e.courseId) === String(courseId)));
    setScores(take(scoreR, 'คะแนนสอบ'));
    setError(errs.join(' · '));
    setLoading(false);
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const orderedExams = useMemo(() => {
    return [...exams]
      .filter((e) => e.status !== 'CANCELLED')
      .sort((a, b) =>
        (a.startTime ? new Date(a.startTime).getTime() : 0) -
        (b.startTime ? new Date(b.startTime).getTime() : 0));
  }, [exams]);

  const scoreByExam = useMemo(() => {
    const map = {};
    scores.forEach((s) => { map[String(s.examId)] = s.score; });
    return map;
  }, [scores]);

  const studentName = scores[0]?.studentName || course?.studentName || 'ฉัน';

  const averagePct = useMemo(() => {
    let sum = 0;
    let count = 0;
    orderedExams.forEach((e) => {
      const v = scoreByExam[String(e.id)];
      if (v != null && e.totalScore) {
        sum += (Number(v) / e.totalScore) * 100;
        count += 1;
      }
    });
    return count > 0 ? Math.round(sum / count) : null;
  }, [orderedExams, scoreByExam]);

  const totalMax = orderedExams.reduce((s, e) => s + (e.totalScore || 0), 0);

  return (
    <div className="aes-page">
      <button type="button" className="aes-back" onClick={() => navigate('/student/exam-results')}>
        ← กลับไปหน้าผลการสอบ
      </button>

      <div className="aes-header">
        <div>
          <div className="aes-detail-title">
            <span className="aes-code">{course?.courseCode || '-'}</span>
            <h1>{course?.courseName || 'ผลการสอบ'}</h1>
          </div>
          <p className="aes-detail-meta">
            ผู้สอน: <b>{course?.tutorName || '-'}</b> ·
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
                <tr>
                  <td className="aes-col-no">1</td>
                  <td className="aes-col-name">{studentName}</td>
                  {orderedExams.map((exam) => {
                    const saved = scoreByExam[String(exam.id)];
                    return (
                      <td key={exam.id} className="aes-cell">
                        {saved != null && saved !== '' ? saved : '—'}
                      </td>
                    );
                  })}
                  <td className="aes-col-avg">
                    {averagePct != null ? `${averagePct}%` : '-'}
                  </td>
                </tr>
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
            <span>คุณดูคะแนนสอบของตัวเองได้เท่านั้น — การกรอกคะแนนทำได้ที่บัญชีติวเตอร์</span>
          </div>
        </div>
      )}
    </div>
  );
}
