import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getEnrollmentsByCourse } from '../services/tutorEnrollmentService';
import {
  deleteAttendanceCell,
  getCourseAttendanceGrid,
  getCourseSchedules,
  saveAttendanceCell,
} from '../services/tutorAttendanceGridService';
import '../pages/TutorAttendanceCoursePage.css';

const ACTIVE_ENROLLMENT_STATUSES = new Set(['APPROVED', 'COMPLETED']);
const cellKey = (sessionDate, studentId) => `${sessionDate}-${studentId}`;

const STATUS_OPTIONS = [
  { value: '', label: '—' },
  { value: 'PRESENT', label: 'มาเรียน' },
  { value: 'LATE', label: 'มาสาย' },
  { value: 'LEAVE', label: 'ลา' },
  { value: 'ABSENT', label: 'ขาด' },
];

const ATTENDED_STATUSES = new Set(['PRESENT', 'LATE']);
const WEEKDAY_TH = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function scheduleDateLabel(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${WEEKDAY_TH[d.getDay()]} ${d.getDate()} ${d.toLocaleDateString('th-TH', { month: 'short' })}`;
}

function timeRange(start, end) {
  const t = (v) => (v ? String(v).slice(0, 5) : '');
  const s = t(start);
  const e = t(end);
  return s && e ? `${s}–${e}` : s || e || '';
}

function isFutureDate(iso) {
  if (!iso) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d.getTime() > today.getTime();
}

// ตารางเช็คชื่อ (แก้ไขได้) ของคอร์สหนึ่ง — ใช้ร่วมกันทั้งหน้าเต็ม (TutorAttendanceCoursePage)
// และโมดัลในหน้าประวัติคอร์สเรียน (TutorCourseHistoryPage)
export default function TutorAttendanceGrid({ courseId }) {
  const [schedules, setSchedules] = useState([]);
  const [records, setRecords] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [cellState, setCellState] = useState({});
  const timers = useRef({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setCellState({});
      const [scheduleList, recordList, enrollmentList] = await Promise.all([
        getCourseSchedules(courseId).catch(() => []),
        getCourseAttendanceGrid(courseId).catch(() => []),
        getEnrollmentsByCourse(courseId).catch(() => []),
      ]);
      setSchedules(Array.isArray(scheduleList) ? scheduleList : []);
      setRecords(Array.isArray(recordList) ? recordList : []);
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

  // 1 คอลัมน์ = 1 วันเรียน (รวมคาบซ้ำวันเดียวกัน) เรียงตามวันที่
  const sessions = useMemo(() => {
    const byDate = new Map();
    schedules
      .filter((s) => s.status !== 'CANCELLED' && s.scheduleDate)
      .forEach((s) => {
        const key = String(s.scheduleDate);
        if (!byDate.has(key)) {
          byDate.set(key, { date: key, startTime: s.startTime, endTime: s.endTime });
        }
      });
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [schedules]);

  const recordMap = useMemo(() => {
    const map = {};
    records.forEach((r) => { map[cellKey(r.sessionDate, r.studentId)] = r.status; });
    return map;
  }, [records]);

  const studentRows = useMemo(() => {
    const byId = {};
    enrollments.forEach((e) => {
      byId[e.studentId] = { studentId: e.studentId, studentName: e.studentName };
    });
    records.forEach((r) => {
      if (!byId[r.studentId]) byId[r.studentId] = { studentId: r.studentId, studentName: r.studentName };
    });
    return Object.values(byId).sort((a, b) =>
      (a.studentName || '').localeCompare(b.studentName || '', 'th')
    );
  }, [enrollments, records]);

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

  async function changeCell(session, studentId, nextStatus) {
    const key = cellKey(session.date, studentId);
    const current = recordMap[key];
    if ((current || '') === nextStatus) return;

    flashCellState(key, 'saving');
    try {
      if (nextStatus === '') {
        await deleteAttendanceCell(courseId, studentId, session.date);
        setRecords((prev) => prev.filter(
          (r) => !(String(r.sessionDate) === String(session.date) && String(r.studentId) === String(studentId))
        ));
      } else {
        const saved = await saveAttendanceCell({
          courseId: Number(courseId),
          studentId,
          sessionDate: session.date,
          status: nextStatus,
        });
        setRecords((prev) => {
          const rest = prev.filter(
            (r) => !(String(r.sessionDate) === String(session.date) && String(r.studentId) === String(studentId))
          );
          return [...rest, saved];
        });
      }
      flashCellState(key, 'saved');
    } catch (err) {
      setError(err.message);
      flashCellState(key, 'error');
    }
  }

  function attendanceRateFor(studentId) {
    let attended = 0;
    let recorded = 0;
    sessions.forEach((s) => {
      const st = recordMap[cellKey(s.date, studentId)];
      if (st) {
        recorded += 1;
        if (ATTENDED_STATUSES.has(st)) attended += 1;
      }
    });
    return recorded > 0 ? Math.round((attended / recorded) * 100) : null;
  }

  function markAll(session, status) {
    studentRows.forEach((stu) => {
      if ((recordMap[cellKey(session.date, stu.studentId)] || '') !== status) {
        changeCell(session, stu.studentId, status);
      }
    });
  }

  if (loading) {
    return <div className="tac-empty">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <>
      {error && (
        <div className="tac-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="tac-empty">คอร์สนี้ยังไม่มีวันเรียนในตารางสอน (ตรวจสอบวันเริ่มเรียนและตารางสอนของคอร์ส)</div>
      ) : studentRows.length === 0 ? (
        <div className="tac-empty">คอร์สนี้ยังไม่มีนักเรียนที่ลงทะเบียนอนุมัติแล้ว</div>
      ) : (
        <div className="tac-card">
          <div className="tac-grid-wrap">
            <table className="tac-grid">
              <thead>
                <tr>
                  <th className="tac-col-no" rowSpan={2}>#</th>
                  <th className="tac-col-name" rowSpan={2}>ชื่อนักเรียน</th>
                  {sessions.map((s, i) => (
                    <th key={s.date} className="tac-day-th">
                      คาบที่ {i + 1}
                      <span className="tac-day-date">{scheduleDateLabel(s.date)}</span>
                      <span className="tac-day-time">{timeRange(s.startTime, s.endTime)}</span>
                      {isFutureDate(s.date) && <span className="tac-lock">🔒 ยังไม่ถึงวันเรียน</span>}
                    </th>
                  ))}
                  <th className="tac-col-rate" rowSpan={2}>อัตราเข้าเรียน</th>
                </tr>
                <tr>
                  {sessions.map((s) => (
                    <th key={s.date} className="tac-sub-th">
                      {isFutureDate(s.date) ? (
                        formatDate(s.date)
                      ) : (
                        <button
                          type="button"
                          className="tac-markall"
                          onClick={() => markAll(s, 'PRESENT')}
                          title="ทำเครื่องหมายว่าทุกคนมาเรียนในคาบนี้"
                        >
                          มาทั้งหมด
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentRows.map((stu, idx) => (
                  <tr key={stu.studentId}>
                    <td className="tac-col-no">{idx + 1}</td>
                    <td className="tac-col-name">{stu.studentName || '-'}</td>
                    {sessions.map((s) => {
                      const key = cellKey(s.date, stu.studentId);
                      const status = recordMap[key] || '';
                      const locked = isFutureDate(s.date);
                      const state = cellState[key];
                      return (
                        <td key={s.date} className={`tac-cell tac-cell-${status.toLowerCase() || 'none'}${locked ? ' tac-cell-locked' : ''}`}>
                          <select
                            value={status}
                            disabled={locked}
                            onChange={(e) => changeCell(s, stu.studentId, e.target.value)}
                            title={locked ? 'ยังไม่ถึงวันเรียน — เช็คชื่อได้เมื่อถึงวันเรียนแล้ว' : undefined}
                          >
                            {STATUS_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                          {state === 'saving' && <i className="tac-dot saving" title="กำลังบันทึก" />}
                          {state === 'saved' && <i className="tac-dot saved" title="บันทึกแล้ว" />}
                          {state === 'error' && <i className="tac-dot error" title="บันทึกไม่สำเร็จ" />}
                        </td>
                      );
                    })}
                    <td className="tac-col-rate">
                      {attendanceRateFor(stu.studentId) != null ? `${attendanceRateFor(stu.studentId)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tac-legend">
            <span><i className="tac-swatch present" /> มาเรียน</span>
            <span><i className="tac-swatch late" /> มาสาย</span>
            <span><i className="tac-swatch leave" /> ลา</span>
            <span><i className="tac-swatch absent" /> ขาด</span>
            <span>เลือกสถานะในช่องเพื่อบันทึกทันที · หัวคอลัมน์คือวันเรียนจริงตามตารางสอน</span>
          </div>
        </div>
      )}
    </>
  );
}
