import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCourseScores, getMyExamSchedule } from '../services/studentExamService';
import '../../admin/pages/AdminExamPages.css';

function isExamDue(exam) {
  if (exam.status === 'OPEN' || exam.status === 'CLOSED') return true;
  if (exam.startTime && new Date(exam.startTime).getTime() <= Date.now()) return true;
  return false;
}

// ตารางคะแนนสอบของคอร์สหนึ่ง (อ่านอย่างเดียว) — ใช้ร่วมกันทั้งหน้าเต็ม (StudentExamResultsCoursePage)
// และโมดัลในหน้าประวัติคอร์สเรียน (StudentCourseHistoryPage, ParentCourseHistoryPage) โดย fetchExams/
// fetchScores รับ default เป็นฝั่งนักเรียน (ดูของตัวเอง) — ฝั่งผู้ปกครองส่ง getChildExams/getChildCourseScores
// เข้ามาแทนเพื่อดูของบุตรหลาน
export default function ExamScoreGrid({
  courseId,
  fetchExams = getMyExamSchedule,
  fetchScores = getCourseScores,
  legendNote = 'คุณดูคะแนนสอบของตัวเองได้เท่านั้น — การกรอกคะแนนทำได้ที่บัญชีติวเตอร์',
  fallbackName = 'ฉัน',
}) {
  const [exams, setExams] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [examR, scoreR] = await Promise.allSettled([
      fetchExams(),
      fetchScores(courseId),
    ]);
    const errs = [];
    const take = (r, label) => {
      if (r.status === 'fulfilled') return Array.isArray(r.value) ? r.value : [];
      errs.push(`${label}: ${r.reason?.message || 'โหลดไม่สำเร็จ'}`);
      return [];
    };
    setExams(take(examR, 'ข้อสอบ').filter((e) => String(e.courseId) === String(courseId)));
    setScores(take(scoreR, 'คะแนนสอบ'));
    setError(errs.join(' · '));
    setLoading(false);
  }, [courseId, fetchExams, fetchScores]);

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

  const studentName = scores[0]?.studentName || fallbackName;

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

  if (loading) {
    return <div className="aes-empty">กำลังโหลดคะแนน...</div>;
  }

  return (
    <>
      {error && (
        <div className="aes-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {orderedExams.length === 0 ? (
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
            <span>{legendNote}</span>
          </div>
        </div>
      )}
    </>
  );
}
