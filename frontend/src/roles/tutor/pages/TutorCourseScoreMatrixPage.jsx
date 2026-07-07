import { useEffect, useMemo, useState } from 'react';
import { getMyCourses } from '../services/tutorCourseService';
import { getExamsByCourse, getResultsByCourse } from '../services/tutorExamService';
import { getEnrollmentsByCourse } from '../services/tutorEnrollmentService';
import './TutorCourseScoreMatrixPage.css';

const ACTIVE_ENROLLMENT_STATUSES = new Set(['APPROVED', 'COMPLETED']);

export default function TutorCourseScoreMatrixPage() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyCourses()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setCourses(list);
        if (list.length > 0) setCourseId(String(list[0].id));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingCourses(false));
  }, []);

  useEffect(() => {
    if (!courseId) return;
    let active = true;

    async function load() {
      try {
        setLoadingData(true);
        setError('');
        const [examList, resultList, enrollmentList] = await Promise.all([
          getExamsByCourse(courseId),
          getResultsByCourse(courseId),
          getEnrollmentsByCourse(courseId),
        ]);
        if (!active) return;
        setExams(examList);
        setResults(resultList);
        setEnrollments(enrollmentList.filter((e) => ACTIVE_ENROLLMENT_STATUSES.has(e.status)));
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoadingData(false);
      }
    }

    load();
    return () => { active = false; };
  }, [courseId]);

  const selectedCourse = courses.find((c) => String(c.id) === String(courseId));
  const lessonOrderByLessonId = useMemo(() => {
    const map = {};
    (selectedCourse?.lessons || []).forEach((l) => { map[l.id] = l.lessonOrder; });
    return map;
  }, [selectedCourse]);

  // เรียงข้อสอบตามลำดับบทเรียน (ถ้าไม่มีบทให้ต่อท้าย) เพื่อให้ดูแนวโน้มคะแนนเทียบกับข้อสอบก่อนหน้าได้
  const orderedExams = useMemo(() => {
    return [...exams].sort((a, b) => {
      const orderA = lessonOrderByLessonId[a.lessonId] ?? 999;
      const orderB = lessonOrderByLessonId[b.lessonId] ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.startTime ? new Date(a.startTime).getTime() : 0) - (b.startTime ? new Date(b.startTime).getTime() : 0);
    });
  }, [exams, lessonOrderByLessonId]);

  // แถวนักเรียน = นักเรียนที่ลงทะเบียนอนุมัติแล้ว/เรียนจบแล้วของคอร์สนี้ทั้งหมด (ไม่ใช่แค่คนที่เคยสอบ)
  // ใครสอบแล้วจะมีคะแนนในตาราง ใครยังไม่สอบ/ส่งไม่ทันจะโชว่าง "-"
  // matrix[studentId-examId] = ExamResultResponse ล่าสุด (เผื่อทำหลายครั้ง เอา attempt สูงสุด)
  const { studentRows, matrix } = useMemo(() => {
    const byStudent = {};

    enrollments.forEach((e) => {
      byStudent[e.studentId] = { studentId: e.studentId, studentName: e.studentName, studentCode: null };
    });

    const cellMap = {};
    results.forEach((r) => {
      if (!byStudent[r.studentId]) {
        byStudent[r.studentId] = { studentId: r.studentId, studentName: r.studentName, studentCode: r.studentCode };
      } else if (r.studentCode) {
        byStudent[r.studentId].studentCode = r.studentCode;
      }
      const key = `${r.studentId}-${r.examId}`;
      const existing = cellMap[key];
      if (!existing || (r.attemptNumber || 1) > (existing.attemptNumber || 1)) {
        cellMap[key] = r;
      }
    });

    const rows = Object.values(byStudent).sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
    return { studentRows: rows, matrix: cellMap };
  }, [enrollments, results]);

  function cellFor(studentId, examId) {
    return matrix[`${studentId}-${examId}`];
  }

  function percentOf(cell) {
    if (!cell || !cell.totalScore) return null;
    return (cell.obtainedScore / cell.totalScore) * 100;
  }

  function trendFor(studentId, examIndex) {
    if (examIndex === 0) return null;
    const current = cellFor(studentId, orderedExams[examIndex].id);
    const previous = cellFor(studentId, orderedExams[examIndex - 1].id);
    const currentPct = percentOf(current);
    const previousPct = percentOf(previous);
    if (currentPct === null || previousPct === null) return null;
    if (currentPct > previousPct) return 'up';
    if (currentPct < previousPct) return 'down';
    return 'same';
  }

  function averageFor(studentId) {
    const cells = orderedExams.map((e) => cellFor(studentId, e.id)).filter(Boolean);
    if (cells.length === 0) return null;
    const pct = cells.map(percentOf).filter((p) => p !== null);
    if (pct.length === 0) return null;
    return pct.reduce((sum, p) => sum + p, 0) / pct.length;
  }

  return (
    <div className="tcm-page">
      <div className="tcm-header">
        <div>
          <h1>คะแนนรวมรายคอร์ส</h1>
          <p>ดูคะแนนสอบของนักเรียนทุกคน เรียงตามลำดับบทเรียน เพื่อดูแนวโน้มเทียบกับข้อสอบก่อนหน้า</p>
        </div>

        <select
          className="tcm-course-select"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          disabled={loadingCourses || courses.length === 0}
        >
          {courses.length === 0 && <option value="">ไม่มีคอร์ส</option>}
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.courseName}</option>
          ))}
        </select>
      </div>

      {loadingData && <div className="tcm-loading">กำลังโหลดคะแนน...</div>}

      {!loadingData && error && (
        <div className="tcm-error-box"><strong>เกิดข้อผิดพลาด</strong><p>{error}</p></div>
      )}

      {!loadingData && !error && courseId && orderedExams.length === 0 && (
        <div className="tcm-empty">คอร์สนี้ยังไม่มีข้อสอบ</div>
      )}

      {!loadingData && !error && orderedExams.length > 0 && studentRows.length === 0 && (
        <div className="tcm-empty">คอร์สนี้ยังไม่มีนักเรียนที่ลงทะเบียนอนุมัติแล้ว</div>
      )}

      {!loadingData && !error && orderedExams.length > 0 && studentRows.length > 0 && (
        <div className="tcm-table-wrap">
          <table className="tcm-table">
            <thead>
              <tr>
                <th className="tcm-sticky-col">นักเรียน</th>
                {orderedExams.map((exam) => (
                  <th key={exam.id}>
                    {exam.lessonTitle && <div className="tcm-th-lesson">บท: {exam.lessonTitle}</div>}
                    <div>{exam.title}</div>
                  </th>
                ))}
                <th>เฉลี่ย</th>
              </tr>
            </thead>
            <tbody>
              {studentRows.map((student) => (
                <tr key={student.studentId}>
                  <td className="tcm-sticky-col">
                    <strong>{student.studentName}</strong>
                    {student.studentCode && <div className="tcm-muted">{student.studentCode}</div>}
                  </td>

                  {orderedExams.map((exam, idx) => {
                    const cell = cellFor(student.studentId, exam.id);
                    const trend = trendFor(student.studentId, idx);
                    return (
                      <td key={exam.id} className="tcm-cell">
                        {cell ? (
                          <>
                            <span className={cell.isPassed === false ? 'tcm-score-fail' : 'tcm-score-pass'}>
                              {cell.obtainedScore ?? '-'}/{cell.totalScore ?? '-'}
                            </span>
                            {trend === 'up' && <span className="tcm-trend-up" title="ดีขึ้นจากข้อสอบก่อนหน้า">▲</span>}
                            {trend === 'down' && <span className="tcm-trend-down" title="แย่ลงจากข้อสอบก่อนหน้า">▼</span>}
                            {trend === 'same' && <span className="tcm-trend-same" title="เท่าเดิม">—</span>}
                          </>
                        ) : (
                          <span className="tcm-no-data">-</span>
                        )}
                      </td>
                    );
                  })}

                  <td className="tcm-cell tcm-avg-cell">
                    {averageFor(student.studentId) !== null ? `${averageFor(student.studentId).toFixed(0)}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
