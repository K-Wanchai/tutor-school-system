import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMyCourses } from '../services/tutorCourseService';
import { getEnrollmentsByCourse } from '../services/tutorEnrollmentService';
import {
  deleteAttendanceCell,
  getCourseAttendanceGrid,
  getCourseSchedules,
  saveAttendanceCell,
} from '../services/tutorAttendanceGridService';
import RefreshButton from '../components/RefreshButton';
import './TutorAttendanceCoursePage.css';

const ACTIVE_ENROLLMENT_STATUSES = new Set(['APPROVED', 'COMPLETED']);
const cellKey = (scheduleId, studentId) => `${scheduleId}-${studentId}`;

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

function isFuture(iso) {
  if (!iso) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(iso).getTime() > today.getTime();
}

export default function TutorAttendanceCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
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
      const [courseList, scheduleList, recordList, enrollmentList] = await Promise.all([
        getMyCourses(),
        getCourseSchedules(courseId),
        getCourseAttendanceGrid(courseId).catch(() => []),
        getEnrollmentsByCourse(courseId).catch(() => []),
      ]);
      setCourse((Array.isArray(courseList) ? courseList : []).find((c) => String(c.id) === String(courseId)) || null);
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

  const orderedSchedules = useMemo(() => {
    return [...schedules]
      .filter((s) => s.status !== 'CANCELLED')
      .sort((a, b) => {
        const d = String(a.scheduleDate || '').localeCompare(String(b.scheduleDate || ''));
        if (d !== 0) return d;
        return String(a.startTime || '').localeCompare(String(b.startTime || ''));
      });
  }, [schedules]);

  const recordMap = useMemo(() => {
    const map = {};
    records.forEach((r) => { map[cellKey(r.scheduleId, r.studentId)] = r.status; });
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

  async function changeCell(schedule, studentId, nextStatus) {
    const key = cellKey(schedule.id, studentId);
    const current = recordMap[key];
    if ((current || '') === nextStatus) return;

    flashCellState(key, 'saving');
    try {
      if (nextStatus === '') {
        await deleteAttendanceCell(schedule.id, studentId);
        setRecords((prev) => prev.filter(
          (r) => !(String(r.scheduleId) === String(schedule.id) && String(r.studentId) === String(studentId))
        ));
      } else {
        const saved = await saveAttendanceCell({ scheduleId: schedule.id, studentId, status: nextStatus });
        setRecords((prev) => {
          const rest = prev.filter(
            (r) => !(String(r.scheduleId) === String(schedule.id) && String(r.studentId) === String(studentId))
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
    orderedSchedules.forEach((s) => {
      const st = recordMap[cellKey(s.id, studentId)];
      if (st) {
        recorded += 1;
        if (ATTENDED_STATUSES.has(st)) attended += 1;
      }
    });
    return recorded > 0 ? Math.round((attended / recorded) * 100) : null;
  }

  return (
    <div className="tac-page">
      <button type="button" className="tac-back" onClick={() => navigate('/tutor/attendance')}>
        ← กลับไปหน้าการเข้าเรียน
      </button>

      <div className="tac-header">
        <div>
          <div className="tac-title">
            <span className="tac-code">{course?.courseCode || '-'}</span>
            <h1>{course?.courseName || 'การเข้าเรียน'}</h1>
          </div>
          <p className="tac-meta">
            ผู้สอน: <b>{course?.teacherName || '-'}</b> ·
            นักเรียน: <b>{studentRows.length} คน</b> ·
            คาบเรียน: <b>{orderedSchedules.length} คาบ</b> ·
            เริ่มเรียน: <b>{formatDate(course?.courseStartDate)}</b>
          </p>
        </div>
        <RefreshButton onClick={load} loading={loading} />
      </div>

      {error && (
        <div className="tac-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="tac-empty">กำลังโหลดข้อมูล...</div>
      ) : orderedSchedules.length === 0 ? (
        <div className="tac-empty">คอร์สนี้ยังไม่มีตารางสอน — สร้างได้ที่เมนู “ตารางสอน”</div>
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
                  {orderedSchedules.map((s, i) => (
                    <th key={s.id} className="tac-day-th">
                      คาบที่ {i + 1}
                      <span className="tac-day-date">{scheduleDateLabel(s.scheduleDate)}</span>
                      <span className="tac-day-time">{timeRange(s.startTime, s.endTime)}</span>
                      {isFuture(s.scheduleDate) && <span className="tac-lock">🔒 ยังไม่ถึงวันเรียน</span>}
                    </th>
                  ))}
                  <th className="tac-col-rate" rowSpan={2}>อัตราเข้าเรียน</th>
                </tr>
                <tr>
                  {orderedSchedules.map((s) => (
                    <th key={s.id} className="tac-sub-th">{formatDate(s.scheduleDate)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentRows.map((stu, idx) => (
                  <tr key={stu.studentId}>
                    <td className="tac-col-no">{idx + 1}</td>
                    <td className="tac-col-name">{stu.studentName || '-'}</td>
                    {orderedSchedules.map((s) => {
                      const key = cellKey(s.id, stu.studentId);
                      const status = recordMap[key] || '';
                      const locked = isFuture(s.scheduleDate);
                      const state = cellState[key];
                      return (
                        <td key={s.id} className={`tac-cell tac-cell-${status.toLowerCase() || 'none'}${locked ? ' tac-cell-locked' : ''}`}>
                          <select
                            value={status}
                            disabled={locked}
                            onChange={(e) => changeCell(s, stu.studentId, e.target.value)}
                            title={locked ? 'ยังไม่ถึงวันเรียน — บันทึกได้เมื่อถึงวันเรียนแล้ว' : undefined}
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
            <span>เลือกสถานะในช่องเพื่อบันทึกทันที · หัวคอลัมน์คือคาบเรียนจริงตามตารางสอน</span>
          </div>
        </div>
      )}
    </div>
  );
}
