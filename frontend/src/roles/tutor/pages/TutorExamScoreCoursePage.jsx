import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMyCourses } from '../services/tutorCourseService';
import { getExamsByCourse, getResultsByCourse } from '../services/tutorExamService';
import { getEnrollmentsByCourse } from '../services/tutorEnrollmentService';
import {
  deleteManualScore,
  getManualScoresByCourse,
  saveManualScore,
} from '../services/tutorExamScoreService';
import RefreshButton from '../components/RefreshButton';
import './TutorExamScoreCoursePage.css';

const ACTIVE_ENROLLMENT_STATUSES = new Set(['APPROVED', 'COMPLETED']);
const cellKey = (examId, studentId) => `${examId}-${studentId}`;

// กรอกคะแนนได้เมื่อถึงกำหนดสอบแล้วเท่านั้น (เปิด/ปิดสอบแล้ว หรือเลยเวลาเริ่มสอบ)
function isExamGradable(exam) {
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

export default function TutorExamScoreCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [manualScores, setManualScores] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [edits, setEdits] = useState({});
  const [cellState, setCellState] = useState({});
  const timers = useRef({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setEdits({});
      setCellState({});
      const [courseList, examList, resultList, manualList, enrollmentList] = await Promise.all([
        getMyCourses(),
        getExamsByCourse(courseId),
        getResultsByCourse(courseId).catch(() => []),
        getManualScoresByCourse(courseId).catch(() => []),
        getEnrollmentsByCourse(courseId).catch(() => []),
      ]);
      setCourse((Array.isArray(courseList) ? courseList : []).find((c) => String(c.id) === String(courseId)) || null);
      setExams(Array.isArray(examList) ? examList : []);
      setResults(Array.isArray(resultList) ? resultList : []);
      setManualScores(Array.isArray(manualList) ? manualList : []);
      setEnrollments(
        (Array.isArray(enrollmentList) ? enrollmentList : []).filter((e) =>
          ACTIVE_ENROLLMENT_STATUSES.has(e.status)
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

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

  function flashCellState(key, state) {
    setCellState((prev) => ({ ...prev, [key]: state }));
    clearTimeout(timers.current[key]);
    if (state === 'saved' || state === 'error') {
      timers.current[key] = setTimeout(() => {
        setCellState((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }, 2500);
    }
  }

  async function commitCell(exam, studentId) {
    const key = cellKey(exam.id, studentId);
    if (!(key in edits)) return;
    const raw = String(edits[key]).trim();
    const hasManual = key in manualScoreMap;
    const saved = savedScoreFor(exam.id, studentId);

    setEdits((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    if (raw === '') {
      if (!hasManual) return;
      flashCellState(key, 'saving');
      try {
        await deleteManualScore(exam.id, studentId);
        setManualScores((prev) => prev.filter(
          (m) => !(String(m.examId) === String(exam.id) && String(m.studentId) === String(studentId))
        ));
        flashCellState(key, 'saved');
      } catch (err) {
        setError(err.message);
        flashCellState(key, 'error');
      }
      return;
    }

    const num = Number(raw);
    if (Number.isNaN(num) || num < 0) {
      flashCellState(key, 'error');
      return;
    }
    if (exam.totalScore != null && num > exam.totalScore) {
      setError(`คะแนนของ "${exam.title}" ต้องไม่เกินคะแนนเต็ม ${exam.totalScore}`);
      flashCellState(key, 'error');
      return;
    }
    if (hasManual && saved != null && Number(saved) === num) return;

    flashCellState(key, 'saving');
    try {
      const savedRow = await saveManualScore({ examId: exam.id, studentId, score: num });
      setManualScores((prev) => {
        const rest = prev.filter(
          (m) => !(String(m.examId) === String(exam.id) && String(m.studentId) === String(studentId))
        );
        return [...rest, savedRow];
      });
      flashCellState(key, 'saved');
    } catch (err) {
      setError(err.message);
      flashCellState(key, 'error');
    }
  }

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
    <div className="escd-page">
      <button type="button" className="escd-back" onClick={() => navigate('/tutor/exam-scores')}>
        ← กลับไปหน้าคะแนนสอบ
      </button>

      <div className="escd-header">
        <div>
          <div className="escd-title">
            <span className="escd-code">{course?.courseCode || '-'}</span>
            <h1>{course?.courseName || 'คะแนนสอบ'}</h1>
          </div>
          <p className="escd-meta">
            ผู้สอน: <b>{course?.teacherName || '-'}</b> ·
            นักเรียน: <b>{studentRows.length} คน</b> ·
            การสอบ: <b>{orderedExams.length} ครั้ง</b> ·
            เริ่มเรียน: <b>{formatDate(course?.courseStartDate)}</b>
          </p>
        </div>
        <RefreshButton onClick={load} loading={loading} />
      </div>

      {error && (
        <div className="escd-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="escd-empty">กำลังโหลดคะแนน...</div>
      ) : orderedExams.length === 0 ? (
        <div className="escd-empty">คอร์สนี้ยังไม่มีการสอบ — เพิ่มได้ที่เมนู “ตารางสอบ”</div>
      ) : studentRows.length === 0 ? (
        <div className="escd-empty">คอร์สนี้ยังไม่มีนักเรียนที่ลงทะเบียนอนุมัติแล้ว</div>
      ) : (
        <div className="escd-card">
          <div className="escd-grid-wrap">
            <table className="escd-grid">
              <thead>
                <tr>
                  <th className="escd-col-no" rowSpan={2}>#</th>
                  <th className="escd-col-name" rowSpan={2}>ชื่อนักเรียน</th>
                  {orderedExams.map((exam, i) => (
                    <th key={exam.id} className="escd-exam-th">
                      การสอบครั้งที่ {i + 1}
                      <span className="escd-exam-title">{exam.title}</span>
                      {!isExamGradable(exam) && <span className="escd-lock">🔒 ยังไม่ถึงกำหนดสอบ</span>}
                    </th>
                  ))}
                  <th className="escd-col-avg" rowSpan={2}>คะแนนเฉลี่ย</th>
                </tr>
                <tr>
                  {orderedExams.map((exam) => (
                    <th key={exam.id} className="escd-sub-th">
                      <span className="escd-sub-got">คะแนนที่ได้</span>
                      <span className="escd-sub-max">คะแนนเต็ม {exam.totalScore ?? '-'}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentRows.map((stu, idx) => (
                  <tr key={stu.studentId}>
                    <td className="escd-col-no">{idx + 1}</td>
                    <td className="escd-col-name">{stu.studentName || '-'}</td>
                    {orderedExams.map((exam) => {
                      const key = cellKey(exam.id, stu.studentId);
                      const saved = savedScoreFor(exam.id, stu.studentId);
                      const fromSystem = !(key in manualScoreMap) && systemScoreMap[key];
                      const locked = !isExamGradable(exam);
                      const value = key in edits ? edits[key] : (saved != null ? saved : '');
                      const state = cellState[key];
                      return (
                        <td key={exam.id} className={`escd-cell${fromSystem ? ' escd-cell-system' : ''}${locked ? ' escd-cell-locked' : ''}`}>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            inputMode="decimal"
                            value={value}
                            disabled={locked}
                            onChange={(e) => setEdits((p) => ({ ...p, [key]: e.target.value }))}
                            onBlur={() => commitCell(exam, stu.studentId)}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                            title={
                              locked
                                ? 'ยังไม่ถึงกำหนดสอบ — กรอกคะแนนได้เมื่อถึงเวลาสอบแล้ว'
                                : fromSystem
                                  ? 'คะแนนจากการทำข้อสอบในระบบ (แก้ทับได้)'
                                  : undefined
                            }
                          />
                          {state === 'saving' && <i className="escd-dot saving" title="กำลังบันทึก" />}
                          {state === 'saved' && <i className="escd-dot saved" title="บันทึกแล้ว" />}
                          {state === 'error' && <i className="escd-dot error" title="บันทึกไม่สำเร็จ" />}
                        </td>
                      );
                    })}
                    <td className="escd-col-avg">
                      {averagePctFor(stu.studentId) != null ? `${averagePctFor(stu.studentId)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="escd-foot-label" colSpan={2}>คะแนนเต็ม</td>
                  {orderedExams.map((exam) => (
                    <td key={exam.id} className="escd-foot-max">{exam.totalScore ?? '-'}</td>
                  ))}
                  <td className="escd-col-avg">{totalMax || '-'}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="escd-legend">
            <span><i className="escd-swatch system" /> คะแนนจากการทำข้อสอบในระบบ (แก้ทับได้)</span>
            <span><i className="escd-swatch locked" /> ยังไม่ถึงกำหนดสอบ กรอกไม่ได้</span>
            <span>พิมพ์คะแนนแล้วคลิกออกเพื่อบันทึก · เว้นว่างเพื่อลบ</span>
          </div>
        </div>
      )}
    </div>
  );
}
