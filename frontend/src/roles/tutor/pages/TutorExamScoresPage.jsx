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

const EXAM_STATUS_LABEL = {
  DRAFT: 'ยังไม่เปิด',
  OPEN: 'เปิดสอบอยู่',
  CLOSED: 'ปิดสอบแล้ว',
  CANCELLED: 'ยกเลิก',
};

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

const cellKey = (examId, studentId) => `${examId}-${studentId}`;

export default function TutorExamScoresPage() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [manualScores, setManualScores] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');

  // การแก้ไขในช่องตาราง: key -> string ที่กำลังพิมพ์
  const [edits, setEdits] = useState({});
  const [cellState, setCellState] = useState({}); // key -> 'saving' | 'saved' | 'error'
  const cellStateTimers = useRef({});

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

  const loadCourseData = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoadingData(true);
      setError('');
      setEdits({});
      setCellState({});
      const [examList, resultList, manualList, enrollmentList] = await Promise.all([
        getExamsByCourse(courseId),
        getResultsByCourse(courseId).catch(() => []),
        getManualScoresByCourse(courseId).catch(() => []),
        getEnrollmentsByCourse(courseId),
      ]);
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
      setLoadingData(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  const selectedCourse = courses.find((c) => String(c.id) === String(courseId));

  const lessonOrderByLessonId = useMemo(() => {
    const map = {};
    (selectedCourse?.lessons || []).forEach((l) => { map[l.id] = l.lessonOrder; });
    return map;
  }, [selectedCourse]);

  // เรียงข้อสอบตามลำดับบทเรียน แล้วตามเวลาเริ่มสอบ
  const orderedExams = useMemo(() => {
    return [...exams].sort((a, b) => {
      const oa = lessonOrderByLessonId[a.lessonId] ?? 999;
      const ob = lessonOrderByLessonId[b.lessonId] ?? 999;
      if (oa !== ob) return oa - ob;
      return (a.startTime ? new Date(a.startTime).getTime() : 0) -
        (b.startTime ? new Date(b.startTime).getTime() : 0);
    });
  }, [exams, lessonOrderByLessonId]);

  // คะแนนจากการยื่นข้อสอบในระบบ: key -> obtainedScore (เอา attempt สูงสุด)
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

  // คะแนนที่ติวเตอร์กรอกเอง: key -> score
  const manualScoreMap = useMemo(() => {
    const map = {};
    manualScores.forEach((m) => { map[cellKey(m.examId, m.studentId)] = m.score; });
    return map;
  }, [manualScores]);

  // แถวนักเรียน = ผู้ลงทะเบียนอนุมัติแล้ว + ใครก็ตามที่มีคะแนนอยู่แล้ว
  const studentRows = useMemo(() => {
    const byId = {};
    enrollments.forEach((e) => {
      byId[e.studentId] = { studentId: e.studentId, studentName: e.studentName, studentCode: null };
    });
    results.forEach((r) => {
      if (!byId[r.studentId]) {
        byId[r.studentId] = { studentId: r.studentId, studentName: r.studentName, studentCode: r.studentCode };
      } else if (r.studentCode) {
        byId[r.studentId].studentCode = r.studentCode;
      }
    });
    manualScores.forEach((m) => {
      if (!byId[m.studentId]) {
        byId[m.studentId] = { studentId: m.studentId, studentName: m.studentName, studentCode: m.studentCode };
      } else if (m.studentCode) {
        byId[m.studentId].studentCode = m.studentCode;
      }
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
    clearTimeout(cellStateTimers.current[key]);
    if (state === 'saved' || state === 'error') {
      cellStateTimers.current[key] = setTimeout(() => {
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
    const saved = savedScoreFor(exam.id, studentId);
    const hasManual = cellKey(exam.id, studentId) in manualScoreMap;

    setEdits((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    // เคลียร์ช่อง -> ลบคะแนนที่กรอกเอง (ถ้ามี)
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
    if (saved != null && Number(saved) === num && hasManual) return;

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

  const summary = useMemo(() => {
    const openable = orderedExams.filter((e) => e.status !== 'CANCELLED');
    const opened = orderedExams.filter((e) => e.status === 'OPEN' || e.status === 'CLOSED');
    let pctSum = 0;
    let pctCount = 0;
    studentRows.forEach((s) => {
      orderedExams.forEach((e) => {
        const v = savedScoreFor(e.id, s.studentId);
        if (v != null && e.totalScore) {
          pctSum += (Number(v) / e.totalScore) * 100;
          pctCount += 1;
        }
      });
    });
    return {
      students: studentRows.length,
      exams: openable.length,
      opened: opened.length,
      avg: pctCount > 0 ? Math.round(pctSum / pctCount) : null,
    };
  }, [orderedExams, studentRows, savedScoreFor]);

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

  function exportCsv() {
    const header = ['รหัสนักเรียน', 'ชื่อนักเรียน',
      ...orderedExams.map((e) => `${e.title} (/${e.totalScore ?? ''})`), 'เฉลี่ย %'];
    const lines = [header];
    studentRows.forEach((s) => {
      const row = [s.studentCode || '', s.studentName || ''];
      orderedExams.forEach((e) => {
        const v = savedScoreFor(e.id, s.studentId);
        row.push(v != null ? v : '');
      });
      const avg = averagePctFor(s.studentId);
      row.push(avg != null ? avg : '');
      lines.push(row);
    });
    const csv = '﻿' + lines.map((r) =>
      r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `คะแนนสอบ-${selectedCourse?.courseCode || courseId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="tes2-page">
      <div className="tes2-header">
        <div>
          <h1>คะแนนสอบ</h1>
          <p>เลือกคอร์สเพื่อดูและกรอกคะแนนสอบของนักเรียนทุกคน เทียบรายการสอบแต่ละครั้ง</p>
        </div>
        <div className="tes2-header-actions">
          <select
            className="tes2-course-select"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            disabled={loadingCourses || courses.length === 0}
          >
            {courses.length === 0 && <option value="">ไม่มีคอร์ส</option>}
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.courseCode} · {c.courseName}</option>
            ))}
          </select>
          <RefreshButton onClick={loadCourseData} loading={loadingData} />
        </div>
      </div>

      {selectedCourse && (
        <div className="tes2-course-meta">
          <div><span>รหัสคอร์ส</span><b>{selectedCourse.courseCode || '-'}</b></div>
          <div><span>ผู้สอน</span><b>{selectedCourse.teacherName || '-'}</b></div>
          <div><span>นักเรียนลงทะเบียน</span><b>{selectedCourse.enrolledCount ?? studentRows.length} คน</b></div>
          <div><span>สถานะ</span><b>{selectedCourse.status || '-'}</b></div>
          <div><span>เริ่มเรียน</span><b>{formatDate(selectedCourse.courseStartDate)}</b></div>
        </div>
      )}

      <div className="tes2-tiles">
        <div className="tes2-tile"><span>นักเรียนในคอร์ส</span><strong>{summary.students}</strong><small>คน</small></div>
        <div className="tes2-tile"><span>การสอบทั้งหมด</span><strong>{summary.exams}</strong><small>ครั้ง (เปิดสอบแล้ว {summary.opened})</small></div>
        <div className="tes2-tile accent"><span>คะแนนเฉลี่ยรวม</span><strong>{summary.avg != null ? `${summary.avg}%` : '-'}</strong><small>ของคะแนนเต็ม</small></div>
      </div>

      {error && (
        <div className="tes2-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {loadingData && <div className="tes2-empty">กำลังโหลดข้อมูล...</div>}

      {!loadingData && courseId && orderedExams.length === 0 && (
        <div className="tes2-empty">คอร์สนี้ยังไม่มีการสอบ — เพิ่มได้ที่เมนู “ตารางสอบ”</div>
      )}

      {!loadingData && orderedExams.length > 0 && (
        <>
          <section className="tes2-card">
            <h2>ตารางสอบของคอร์สนี้</h2>
            <div className="tes2-rail">
              {orderedExams.map((exam, i) => (
                <article key={exam.id} className="tes2-exam-card">
                  <span className="tes2-exam-n">การสอบครั้งที่ {i + 1}</span>
                  <span className="tes2-exam-t">{exam.title}</span>
                  {exam.lessonTitle && <span className="tes2-exam-lesson">บท: {exam.lessonTitle}</span>}
                  <span className="tes2-exam-d">{formatDateTime(exam.startTime)}</span>
                  <div className="tes2-exam-foot">
                    <span className="tes2-exam-pts">เต็ม <b>{exam.totalScore ?? '-'}</b></span>
                    <span className={`tes2-pill ${String(exam.status || '').toLowerCase()}`}>
                      {EXAM_STATUS_LABEL[exam.status] || exam.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="tes2-card">
            <div className="tes2-card-head">
              <div>
                <h2>คะแนนรายคน × รายการสอบ</h2>
                <p>พิมพ์คะแนนในช่องแล้วคลิกออกเพื่อบันทึก · เว้นว่างเพื่อลบคะแนนที่กรอกไว้</p>
              </div>
              <button type="button" className="tes2-export" onClick={exportCsv} disabled={studentRows.length === 0}>
                ส่งออก CSV
              </button>
            </div>

            {studentRows.length === 0 ? (
              <div className="tes2-empty">คอร์สนี้ยังไม่มีนักเรียนที่ลงทะเบียนอนุมัติแล้ว</div>
            ) : (
              <div className="tes2-table-wrap">
                <table className="tes2-table">
                  <thead>
                    <tr>
                      <th className="tes2-sticky">นักเรียน</th>
                      {orderedExams.map((exam, i) => (
                        <th key={exam.id}>
                          <span className="tes2-th-n">ครั้งที่ {i + 1}</span>
                          <span className="tes2-th-t">{exam.title}</span>
                          <span className="tes2-th-max">เต็ม {exam.totalScore ?? '-'}</span>
                        </th>
                      ))}
                      <th className="tes2-avg-col">เฉลี่ย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentRows.map((stu) => (
                      <tr key={stu.studentId}>
                        <td className="tes2-sticky">
                          <strong>{stu.studentName}</strong>
                          {stu.studentCode && <span>{stu.studentCode}</span>}
                        </td>
                        {orderedExams.map((exam) => {
                          const key = cellKey(exam.id, stu.studentId);
                          const saved = savedScoreFor(exam.id, stu.studentId);
                          const fromSystem = !(key in manualScoreMap) && systemScoreMap[key];
                          const value = key in edits
                            ? edits[key]
                            : (saved != null ? saved : '');
                          const state = cellState[key];
                          return (
                            <td key={exam.id} className={`tes2-cell${fromSystem ? ' tes2-cell-system' : ''}`}>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                inputMode="decimal"
                                value={value}
                                disabled={exam.status === 'CANCELLED'}
                                onChange={(e) => setEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                                onBlur={() => commitCell(exam, stu.studentId)}
                                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                title={fromSystem ? 'คะแนนจากการทำข้อสอบในระบบ' : undefined}
                              />
                              {state === 'saving' && <i className="tes2-dot saving" title="กำลังบันทึก" />}
                              {state === 'saved' && <i className="tes2-dot saved" title="บันทึกแล้ว" />}
                              {state === 'error' && <i className="tes2-dot error" title="บันทึกไม่สำเร็จ" />}
                            </td>
                          );
                        })}
                        <td className="tes2-avg-col">
                          {averagePctFor(stu.studentId) != null ? `${averagePctFor(stu.studentId)}%` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="tes2-legend">
              <span><i className="tes2-swatch system" /> คะแนนจากการทำข้อสอบในระบบ (แก้ทับได้)</span>
              <span><i className="tes2-dot saved" /> บันทึกแล้ว</span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
