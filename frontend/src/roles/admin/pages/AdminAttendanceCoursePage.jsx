import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCoursesByTutorId, getEnrollmentsByCourse } from '../services/adminExamService';
import { getCourseAttendanceGrid, getCourseSchedules } from '../services/adminAttendanceService';
import './AdminExamPages.css';
import './AdminAttendancePages.css';

const ACTIVE_ENROLLMENT_STATUSES = new Set(['APPROVED', 'COMPLETED']);
const cellKey = (sessionDate, studentId) => `${sessionDate}-${studentId}`;

const STATUS_LABEL = {
  PRESENT: 'มาเรียน',
  LATE: 'มาสาย',
  LEAVE: 'ลา',
  ABSENT: 'ขาด',
};

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

export default function AdminAttendanceCoursePage() {
  const { tutorId, courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [records, setRecords] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [courseR, scheduleR, recordR, enrollR] = await Promise.allSettled([
      getCoursesByTutorId(tutorId),
      getCourseSchedules(courseId),
      getCourseAttendanceGrid(courseId),
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
    setSchedules(take(scheduleR, 'ตารางคาบเรียน'));
    setRecords(take(recordR, 'ข้อมูลการเข้าเรียน'));
    setEnrollments(take(enrollR, 'รายชื่อนักเรียน').filter((e) => ACTIVE_ENROLLMENT_STATUSES.has(e.status)));
    setError(errs.join(' · '));
    setLoading(false);
  }, [tutorId, courseId]);

  useEffect(() => { load(); }, [load]);

  // 1 คอลัมน์ = 1 วันเรียน (รวมคาบซ้ำวันเดียวกัน) เรียงตามวันที่
  // รวมทั้งวันที่มาจากตารางสอน และวันที่มีการเช็คชื่อบันทึกไว้แล้ว (กันกรณีตารางสอนไม่ครบ)
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
    records.forEach((r) => {
      const key = String(r.sessionDate || '');
      if (key && !byDate.has(key)) {
        byDate.set(key, { date: key, startTime: null, endTime: null });
      }
    });
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [schedules, records]);

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

  return (
    <div className="aes-page">
      <button
        type="button"
        className="aes-back"
        onClick={() => navigate(`/admin/attendance/tutors/${tutorId}`)}
      >
        ← กลับไปหน้าคอร์สของติวเตอร์
      </button>

      <div className="aes-header">
        <div>
          <div className="aes-detail-title">
            <span className="aes-code">{course?.courseCode || '-'}</span>
            <h1>{course?.courseName || 'การเข้าเรียน'}</h1>
          </div>
          <p className="aes-detail-meta">
            ผู้สอน: <b>{course?.teacherName || '-'}</b> ·
            นักเรียน: <b>{studentRows.length} คน</b> ·
            คาบเรียน: <b>{sessions.length} คาบ</b> ·
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
        <div className="aes-empty">กำลังโหลดข้อมูล...</div>
      ) : sessions.length === 0 ? (
        <div className="aes-empty">คอร์สนี้ยังไม่มีวันเรียนในตารางสอน</div>
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
                  {sessions.map((s, i) => (
                    <th key={s.date} className="aes-att-day-th">
                      คาบที่ {i + 1}
                      <span className="aes-att-day-date">{scheduleDateLabel(s.date)}</span>
                      <span className="aes-att-day-time">{timeRange(s.startTime, s.endTime)}</span>
                      {isFutureDate(s.date) && <span className="aes-lock">ยังไม่ถึงวันเรียน</span>}
                    </th>
                  ))}
                  <th className="aes-col-avg" rowSpan={2}>อัตราเข้าเรียน</th>
                </tr>
                <tr>
                  {sessions.map((s) => (
                    <th key={s.date} className="aes-sub-th">{formatDate(s.date)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentRows.map((stu, idx) => (
                  <tr key={stu.studentId}>
                    <td className="aes-col-no">{idx + 1}</td>
                    <td className="aes-col-name">{stu.studentName || '-'}</td>
                    {sessions.map((s) => {
                      const status = recordMap[cellKey(s.date, stu.studentId)] || '';
                      return (
                        <td
                          key={s.date}
                          className={`aes-att-cell aes-att-${status.toLowerCase() || 'none'}`}
                        >
                          {STATUS_LABEL[status] || '—'}
                        </td>
                      );
                    })}
                    <td className="aes-col-avg">
                      {attendanceRateFor(stu.studentId) != null ? `${attendanceRateFor(stu.studentId)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="aes-legend">
            <span><i className="aes-swatch aes-att-sw-present" /> มาเรียน</span>
            <span><i className="aes-swatch aes-att-sw-late" /> มาสาย</span>
            <span><i className="aes-swatch aes-att-sw-leave" /> ลา</span>
            <span><i className="aes-swatch aes-att-sw-absent" /> ขาด</span>
            <span>แอดมินดูข้อมูลการเข้าเรียนได้เท่านั้น — การเช็คชื่อทำได้ที่บัญชีติวเตอร์</span>
          </div>
        </div>
      )}
    </div>
  );
}
