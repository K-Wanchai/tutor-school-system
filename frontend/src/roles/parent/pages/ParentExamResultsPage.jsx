import { useEffect, useMemo, useState } from 'react';
import { getChildExamResults, getChildEnrollments, getChildSubmissionById } from '../services/parentService';
import '../../admin/pages/AdminExamPages.css';
import '../../student/pages/StudentExamResultsPage.css';

// เฉพาะคอร์สที่ชำระเงิน/อนุมัติแล้ว หรือเรียนจบแล้ว
const ATTENDING_ENROLLMENT_STATUSES = ['APPROVED', 'COMPLETED'];

function safeValue(value) {
  return value === null || value === undefined || value === '' ? '-' : value;
}

function courseKey(item) {
  return item.courseId ? `course-${item.courseId}` : `course-name-${item.courseName}`;
}

function mapEnrolledCourse(raw) {
  return {
    courseId: raw?.courseId ?? raw?.course?.id ?? null,
    courseName: raw?.courseName ?? raw?.course?.courseName ?? '-',
    courseCode: raw?.courseCode ?? raw?.course?.courseCode ?? null,
    tutorName: raw?.tutorName ?? raw?.teacherName ?? raw?.tutor?.fullName ?? '-',
    studentName: raw?.studentName ?? raw?.student?.fullName ?? null,
    status: raw?.status ?? null,
  };
}

// เรียงผลสอบของคอร์ส + กำหนด "การสอบครั้งที่" ตามลำดับข้อสอบ (เรียงตามเวลาเริ่มสอบ)
function decorateCourse(course) {
  const examOrder = [...new Set(
    [...course.results]
      .sort((a, b) => new Date(a.examStartTime || 0) - new Date(b.examStartTime || 0))
      .map((r) => String(r.examId))
  )];
  const examNumber = new Map(examOrder.map((id, i) => [id, i + 1]));
  const rows = [...course.results].sort(
    (a, b) => new Date(b.submittedAt || b.examStartTime || 0) - new Date(a.submittedAt || a.examStartTime || 0)
  );

  const graded = rows.filter((r) => r.status !== 'IN_PROGRESS');
  const scored = graded.filter((r) => r.obtainedScore != null);
  const sumObtained = scored.reduce((s, r) => s + Number(r.obtainedScore), 0);
  const sumTotal = scored.reduce((s, r) => s + Number(r.totalScore || 0), 0);

  const pcts = scored
    .filter((r) => r.totalScore)
    .map((r) => (Number(r.obtainedScore) / Number(r.totalScore)) * 100);
  const avgPct = pcts.length ? Math.round(pcts.reduce((s, v) => s + v, 0) / pcts.length) : null;

  // หนึ่งคอลัมน์ต่อหนึ่งข้อสอบ (dedupe ตาม examId เก็บผลล่าสุด) เรียงตามการสอบครั้งที่ — เหมือนตารางฝั่งแอดมิน/นักเรียน
  const byExam = new Map();
  rows.forEach((r) => {
    if (!byExam.has(String(r.examId))) byExam.set(String(r.examId), r);
  });
  const examColumns = [...byExam.values()].sort(
    (a, b) => (examNumber.get(String(a.examId)) ?? 0) - (examNumber.get(String(b.examId)) ?? 0)
  );
  const examTotalSum = examColumns.reduce((s, r) => s + Number(r.totalScore || 0), 0);

  return {
    ...course,
    rows,
    examNumber,
    examColumns,
    examTotalSum,
    studentName: course.studentName || rows.find((r) => r.studentName)?.studentName || null,
    taken: graded.length,
    scoredCount: scored.length,
    sumObtained,
    sumTotal,
    avgPct,
  };
}

export default function ParentExamResultsPage() {
  const [results, setResults] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const [resultData, courseData] = await Promise.all([
        getChildExamResults(),
        getChildEnrollments().catch(() => []),
      ]);
      setResults(Array.isArray(resultData) ? resultData : []);
      setEnrolledCourses(
        (Array.isArray(courseData) ? courseData : [])
          .filter((en) => !en.status || ATTENDING_ENROLLMENT_STATUSES.includes(en.status))
          .map(mapEnrolledCourse)
          .filter((c) => c.courseId || c.courseName !== '-')
      );
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดผลสอบได้');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const courses = useMemo(() => {
    const map = new Map();

    enrolledCourses.forEach((c) => {
      const key = courseKey(c);
      if (!map.has(key)) {
        map.set(key, {
          key,
          courseId: c.courseId,
          courseName: c.courseName,
          courseCode: c.courseCode,
          tutorName: c.tutorName,
          studentName: c.studentName,
          results: [],
        });
      }
    });

    results.forEach((r) => {
      const key = courseKey(r);
      if (!map.has(key)) {
        map.set(key, {
          key,
          courseId: r.courseId,
          courseName: r.courseName,
          courseCode: r.courseCode,
          tutorName: r.tutorName,
          results: [],
        });
      }
      const course = map.get(key);
      if (!course.courseCode && r.courseCode) course.courseCode = r.courseCode;
      if ((!course.tutorName || course.tutorName === '-') && r.tutorName) course.tutorName = r.tutorName;
      if (!course.studentName && r.studentName) course.studentName = r.studentName;
      course.results.push(r);
    });

    return Array.from(map.values()).map(decorateCourse);
  }, [enrolledCourses, results]);

  const filteredCourses = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return courses;
    return courses.filter((c) =>
      `${c.courseName || ''} ${c.courseCode || ''}`.toLowerCase().includes(kw)
    );
  }, [courses, keyword]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.key === selectedKey) || null,
    [courses, selectedKey]
  );

  if (loading) {
    return (
      <div className="aes-page">
        <div className="aes-empty">กำลังโหลดผลสอบ...</div>
      </div>
    );
  }

  // ── มุมมองรายละเอียดคอร์ส: ผลสอบเฉพาะของบุตรหลานคนนี้ ──
  if (selectedCourse) {
    return (
      <div className="aes-page">
        <button type="button" className="aes-back" onClick={() => setSelectedKey(null)}>
          ← กลับไปหน้ารายการคอร์ส
        </button>

        <div className="aes-header">
          <div>
            <div className="aes-detail-title">
              <span className="aes-code">{selectedCourse.courseCode || '-'}</span>
              <h1>{safeValue(selectedCourse.courseName)}</h1>
            </div>
            <p className="aes-detail-meta">
              ผู้สอน: <b>{safeValue(selectedCourse.tutorName)}</b> ·
              สอบไปแล้ว: <b>{selectedCourse.taken} ครั้ง</b> ·
              คะแนนรวม: <b>{selectedCourse.sumObtained} / {selectedCourse.sumTotal || '-'}</b> ·
              คะแนนเฉลี่ย: <b>{selectedCourse.avgPct != null ? `${selectedCourse.avgPct}%` : '-'}</b>
            </p>
          </div>
          <span className="aes-readonly-badge">ผลสอบของบุตรหลาน</span>
        </div>

        {selectedCourse.examColumns.length === 0 ? (
          <div className="aes-empty">คอร์สนี้ยังไม่มีผลสอบของบุตรหลาน</div>
        ) : (
          <div className="aes-table-card">
            <div className="aes-grid-wrap">
              <table className="aes-score-grid">
                <thead>
                  <tr>
                    <th className="aes-col-no" rowSpan={2}>#</th>
                    <th className="aes-col-name" rowSpan={2}>ชื่อนักเรียน</th>
                    {selectedCourse.examColumns.map((r, i) => {
                      const notDue = r.examStartTime && new Date(r.examStartTime).getTime() > Date.now();
                      return (
                        <th key={r.examId} className="aes-exam-th">
                          การสอบครั้งที่ {i + 1}
                          <span className="aes-exam-title">{r.examTitle}</span>
                          {notDue && <span className="aes-lock">ยังไม่ถึงกำหนดสอบ</span>}
                        </th>
                      );
                    })}
                    <th className="aes-col-avg" rowSpan={2}>คะแนนเฉลี่ย</th>
                  </tr>
                  <tr>
                    {selectedCourse.examColumns.map((r) => (
                      <th key={r.examId} className="aes-sub-th">
                        <span className="aes-sub-got">คะแนนที่ได้</span>
                        <span className="aes-sub-max">คะแนนเต็ม {r.totalScore ?? '-'}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="aes-col-no">1</td>
                    <td className="aes-col-name">{safeValue(selectedCourse.studentName || 'บุตรหลาน')}</td>
                    {selectedCourse.examColumns.map((r) => {
                      const clickable = r.submissionId != null;
                      return (
                        <td
                          key={r.examId}
                          className={`aes-cell${clickable ? ' ser-clickable-row' : ''}`}
                          title={clickable ? 'แตะเพื่อดูรายละเอียดคำตอบรายข้อ' : undefined}
                          onClick={clickable ? () => setSelectedId(r.submissionId) : undefined}
                        >
                          {r.obtainedScore != null && r.obtainedScore !== '' ? r.obtainedScore : '—'}
                        </td>
                      );
                    })}
                    <td className="aes-col-avg">
                      {selectedCourse.avgPct != null ? `${selectedCourse.avgPct}%` : '-'}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td className="aes-foot-label" colSpan={2}>คะแนนเต็ม</td>
                    {selectedCourse.examColumns.map((r) => (
                      <td key={r.examId} className="aes-foot-max">{r.totalScore ?? '-'}</td>
                    ))}
                    <td className="aes-col-avg">{selectedCourse.examTotalSum || '-'}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="aes-legend">
              <span>แตะที่ช่องคะแนนของข้อสอบที่ทำผ่านระบบ เพื่อดูรายละเอียดคำตอบรายข้อ</span>
            </div>
          </div>
        )}

        {selectedId && (
          <ResultDetailModal submissionId={selectedId} onClose={() => setSelectedId(null)} />
        )}
      </div>
    );
  }

  // ── มุมมองรายการคอร์ส (การ์ด) ──
  return (
    <div className="aes-page">
      <div className="aes-header">
        <div>
          <h1>ผลสอบของบุตรหลาน</h1>
          <p>เลือกคอร์สเพื่อดูคะแนนและผลสอบของบุตรหลานในคอร์สนั้น</p>
        </div>
      </div>

      <div className="aes-toolbar">
        <input
          type="text"
          placeholder="ค้นหาชื่อคอร์ส หรือรหัสคอร์ส..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {error && (
        <div className="aes-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={load}>ลองใหม่</button>
        </div>
      )}

      {filteredCourses.length === 0 ? (
        <div className="aes-empty">
          {keyword
            ? `ไม่พบคอร์สสำหรับ "${keyword}"`
            : 'ยังไม่มีคอร์สของบุตรหลาน — เมื่อสมัครเรียนและได้รับการอนุมัติแล้ว คอร์สจะแสดงที่นี่'}
        </div>
      ) : (
        <div className="aes-grid">
          {filteredCourses.map((course) => (
            <button
              key={course.key}
              type="button"
              className="aes-card"
              onClick={() => setSelectedKey(course.key)}
            >
              <div className="aes-card-top">
                <span className="aes-code">{course.courseCode || '-'}</span>
                <span className="aes-status">
                  {course.taken > 0 ? `สอบแล้ว ${course.taken}` : 'ยังไม่มีผลสอบ'}
                </span>
              </div>

              <h2 className="aes-card-title">{safeValue(course.courseName)}</h2>
              <p className="aes-card-desc">ผู้สอน: {safeValue(course.tutorName)}</p>

              <div className="aes-card-info">
                <div>
                  <span>สอบไปแล้ว</span>
                  <strong>{course.taken} ครั้ง</strong>
                </div>
                <div>
                  <span>คะแนนรวม</span>
                  <strong>{course.sumObtained}{course.sumTotal ? ` / ${course.sumTotal}` : ''}</strong>
                </div>
                <div>
                  <span>คะแนนเฉลี่ย</span>
                  <strong>{course.avgPct != null ? `${course.avgPct}%` : '-'}</strong>
                </div>
              </div>

              <span className="aes-card-cta">ดูผลสอบ →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultDetailModal({ submissionId, onClose }) {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getChildSubmissionById(submissionId)
      .then((data) => { if (active) setSubmission(data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [submissionId]);

  return (
    <div className="ser-modal-backdrop" onClick={onClose}>
      <div className="ser-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ser-modal-header">
          <h2>{submission ? submission.examTitle : 'รายละเอียดผลสอบ'}</h2>
          <button type="button" onClick={onClose}>✕</button>
        </div>

        {loading && <div className="ser-loading">กำลังโหลด...</div>}
        {error && <div className="ser-error-box"><p>{error}</p></div>}

        {!loading && submission && (
          <div className="ser-modal-body">
            <div className="ser-submission-summary">
              คะแนนรวม {submission.obtainedScore ?? 0} / {submission.totalScore ?? 0}
              {' · '}ถูก {submission.correctCount} · ผิด {submission.wrongCount} · ไม่ตอบ {submission.unansweredCount}
            </div>

            {(submission.answers || []).map((a) => (
              <div key={a.questionId} className="ser-answer-card">
                <p className="ser-answer-question">{a.questionText}</p>
                <p className="ser-answer-given">
                  คำตอบของบุตรหลาน: {a.selectedOptionText || a.studentAnswerText || <em>ไม่ได้ตอบ</em>}
                </p>
                <p className="ser-answer-score">
                  {a.scoreAwarded ?? 0} / {a.questionScore} คะแนน
                  {a.isCorrect === true && <span className="ser-pass"> ถูก</span>}
                  {a.isCorrect === false && <span className="ser-fail"> ผิด</span>}
                  {a.isCorrect === null && <span className="ser-pending"> รอตรวจ</span>}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="ser-modal-footer">
          <button type="button" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </div>
  );
}
