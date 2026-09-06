import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getMyCourses } from '../services/tutorCourseService';
import { getExamsByCourse, getResultsByCourse } from '../services/tutorExamService';
import { getEnrollmentsByCourse } from '../services/tutorEnrollmentService';
import {
  deleteManualScore,
  getManualScoresByCourse,
  saveManualScore,
} from '../services/tutorExamScoreService';
import RefreshButton from '../components/RefreshButton';
import './TutorExamScoresPage.css';

const ACTIVE_ENROLLMENT_STATUSES = new Set(['APPROVED', 'COMPLETED']);

const COURSE_STATUS_LABEL = {
  DRAFT: 'ร่าง',
  OPEN: 'เปิดรับสมัคร',
  ONGOING: 'กำลังเรียน',
  COMPLETED: 'จบคอร์ส',
  CANCELLED: 'ยกเลิก',
};

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

export default function TutorExamScoresPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMyCourses()
      .then((data) => {
        if (!active) return;
        setCourses(Array.isArray(data) ? data : []);
        setError('');
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  return (
    <div className="tes2-page">
      <div className="tes2-header">
        <div>
          <h1>คะแนนสอบ</h1>
          <p>เลือกคอร์สเพื่อดูตารางคะแนนสอบของนักเรียน แล้วกรอกคะแนนที่ได้ในช่องได้เลย</p>
        </div>
        <RefreshButton onClick={() => setReloadKey((k) => k + 1)} loading={loading} />
      </div>

      {error && (
        <div className="tes2-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {loading && <div className="tes2-empty">กำลังโหลดคอร์ส...</div>}

      {!loading && courses.length === 0 && (
        <div className="tes2-empty">ยังไม่มีคอร์สที่รับผิดชอบ</div>
      )}

      {!loading && courses.map((course) => (
        <CourseScoreCard key={`${course.id}-${reloadKey}`} course={course} onError={setError} />
      ))}
    </div>
  );
}

function CourseScoreCard({ course, onError }) {
  const [expanded, setExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [manualScores, setManualScores] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  const [edits, setEdits] = useState({});
  const [cellState, setCellState] = useState({});
  const timers = useRef({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setEdits({});
      setCellState({});
      const [examList, resultList, manualList, enrollmentList] = await Promise.all([
        getExamsByCourse(course.id),
        getResultsByCourse(course.id).catch(() => []),
        getManualScoresByCourse(course.id).catch(() => []),
        getEnrollmentsByCourse(course.id).catch(() => []),
      ]);
      setExams(Array.isArray(examList) ? examList : []);
      setResults(Array.isArray(resultList) ? resultList : []);
      setManualScores(Array.isArray(manualList) ? manualList : []);
      setEnrollments(
        (Array.isArray(enrollmentList) ? enrollmentList : []).filter((e) =>
          ACTIVE_ENROLLMENT_STATUSES.has(e.status)
        )
      );
      setHasLoaded(true);
    } catch (err) {
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  }, [course.id, onError]);

  useEffect(() => {
    if (expanded && !hasLoaded && !loading) load();
  }, [expanded, hasLoaded, loading, load]);

  const lessonOrderByLessonId = useMemo(() => {
    const map = {};
    (course.lessons || []).forEach((l) => { map[l.id] = l.lessonOrder; });
    return map;
  }, [course.lessons]);

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
        onError?.(err.message);
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
      onError?.(`คะแนนของ "${exam.title}" ต้องไม่เกินคะแนนเต็ม ${exam.totalScore}`);
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
      onError?.(err.message);
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
    <article className={`esc-card${expanded ? ' esc-card-open' : ''}`}>
      <button
        type="button"
        className="esc-card-head"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="esc-chevron" aria-hidden="true">▸</span>
        <span className="esc-card-title">
          <span className="esc-code">{course.courseCode || '-'}</span>
          <span className="esc-name">{course.courseName || 'ไม่ระบุชื่อคอร์ส'}</span>
        </span>
        <span className="esc-card-meta">
          <span>ผู้สอน: <b>{course.teacherName || '-'}</b></span>
          <span>นักเรียน: <b>{course.enrolledCount ?? 0} คน</b></span>
          <span>สถานะ: <b>{COURSE_STATUS_LABEL[course.status] || course.status || '-'}</b></span>
          <span>เริ่มเรียน: <b>{formatDate(course.courseStartDate)}</b></span>
        </span>
      </button>

      {expanded && (
        loading ? (
          <div className="esc-card-empty">กำลังโหลดคะแนน...</div>
        ) : orderedExams.length === 0 ? (
          <div className="esc-card-empty">คอร์สนี้ยังไม่มีการสอบ</div>
        ) : studentRows.length === 0 ? (
          <div className="esc-card-empty">คอร์สนี้ยังไม่มีนักเรียนที่ลงทะเบียนอนุมัติแล้ว</div>
        ) : (
          <div className="esc-grid-wrap">
            <table className="esc-grid">
              <thead>
                <tr>
                  <th className="esc-col-no" rowSpan={2}>#</th>
                  <th className="esc-col-name" rowSpan={2}>ชื่อนักเรียน</th>
                  {orderedExams.map((exam, i) => (
                    <th key={exam.id} className="esc-exam-th">
                      การสอบครั้งที่ {i + 1}
                      <span className="esc-exam-title">{exam.title}</span>
                      {!isExamGradable(exam) && (
                        <span className="esc-lock">🔒 ยังไม่ถึงกำหนดสอบ</span>
                      )}
                    </th>
                  ))}
                  <th className="esc-col-avg" rowSpan={2}>คะแนนเฉลี่ย</th>
                </tr>
                <tr>
                  {orderedExams.map((exam) => (
                    <th key={exam.id} className="esc-sub-th">
                      <span className="esc-sub-got">คะแนนที่ได้</span>
                      <span className="esc-sub-max">คะแนนเต็ม {exam.totalScore ?? '-'}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentRows.map((stu, idx) => (
                  <tr key={stu.studentId}>
                    <td className="esc-col-no">{idx + 1}</td>
                    <td className="esc-col-name">{stu.studentName || '-'}</td>
                    {orderedExams.map((exam) => {
                      const key = cellKey(exam.id, stu.studentId);
                      const saved = savedScoreFor(exam.id, stu.studentId);
                      const fromSystem = !(key in manualScoreMap) && systemScoreMap[key];
                      const locked = !isExamGradable(exam);
                      const value = key in edits ? edits[key] : (saved != null ? saved : '');
                      const state = cellState[key];
                      return (
                        <td key={exam.id} className={`esc-cell${fromSystem ? ' esc-cell-system' : ''}${locked ? ' esc-cell-locked' : ''}`}>
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
                          {state === 'saving' && <i className="esc-dot saving" title="กำลังบันทึก" />}
                          {state === 'saved' && <i className="esc-dot saved" title="บันทึกแล้ว" />}
                          {state === 'error' && <i className="esc-dot error" title="บันทึกไม่สำเร็จ" />}
                        </td>
                      );
                    })}
                    <td className="esc-col-avg">
                      {averagePctFor(stu.studentId) != null ? `${averagePctFor(stu.studentId)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="esc-foot-label" colSpan={2}>คะแนนเต็ม</td>
                  {orderedExams.map((exam) => (
                    <td key={exam.id} className="esc-foot-max">{exam.totalScore ?? '-'}</td>
                  ))}
                  <td className="esc-col-avg">{totalMax || '-'}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )
      )}
    </article>
  );
}
