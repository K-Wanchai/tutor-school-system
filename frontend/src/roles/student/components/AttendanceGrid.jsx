import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCourseSessions, getMyClassAttendance } from '../services/studentAttendanceService';
import '../../admin/pages/AdminExamPages.css';
import '../../admin/pages/AdminAttendancePages.css';

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

// ตารางเช็คชื่อของคอร์สหนึ่ง (อ่านอย่างเดียว) — ใช้ร่วมกันทั้งหน้าเต็ม (StudentAttendanceCoursePage)
// และโมดัลในหน้าประวัติคอร์สเรียน (StudentCourseHistoryPage, ParentCourseHistoryPage) โดย fetchSessions/
// fetchAttendance รับ default เป็นฝั่งนักเรียน (ดูของตัวเอง) — ฝั่งผู้ปกครองส่ง getChildCourseSessions/
// getChildAttendance เข้ามาแทนเพื่อดูของบุตรหลาน
export default function AttendanceGrid({
  courseId,
  fetchSessions = getCourseSessions,
  fetchAttendance = getMyClassAttendance,
  legendNote = 'คุณดูข้อมูลการเข้าเรียนของตัวเองได้เท่านั้น — การเช็คชื่อทำได้ที่บัญชีติวเตอร์',
  fallbackName = 'ฉัน',
}) {
  const [sessions, setSessions] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [sessionR, recordR] = await Promise.allSettled([
      fetchSessions(courseId),
      fetchAttendance(),
    ]);
    const errs = [];
    const take = (r, label) => {
      if (r.status === 'fulfilled') return Array.isArray(r.value) ? r.value : [];
      errs.push(`${label}: ${r.reason?.message || 'โหลดไม่สำเร็จ'}`);
      return [];
    };
    setSessions(take(sessionR, 'ตารางคาบเรียน'));
    setRecords(take(recordR, 'ข้อมูลการเข้าเรียน').filter((r) => String(r.courseId) === String(courseId)));
    setError(errs.join(' · '));
    setLoading(false);
  }, [courseId, fetchSessions, fetchAttendance]);

  useEffect(() => { load(); }, [load]);

  // 1 คอลัมน์ = 1 วันเรียน รวมทั้งวันที่มาจากตารางสอน และวันที่มีการเช็คชื่อบันทึกไว้แล้ว (กันกรณีตารางสอนไม่ครบ)
  const orderedSessions = useMemo(() => {
    const byDate = new Map();
    sessions
      .filter((s) => s.scheduleDate)
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
  }, [sessions, records]);

  const recordByDate = useMemo(() => {
    const map = {};
    records.forEach((r) => { map[String(r.sessionDate)] = r; });
    return map;
  }, [records]);

  const studentName = records[0]?.studentName || fallbackName;

  const attendanceRate = useMemo(() => {
    let attended = 0;
    let recorded = 0;
    orderedSessions.forEach((s) => {
      const status = recordByDate[s.date]?.status;
      if (status) {
        recorded += 1;
        if (ATTENDED_STATUSES.has(status)) attended += 1;
      }
    });
    return recorded > 0 ? Math.round((attended / recorded) * 100) : null;
  }, [orderedSessions, recordByDate]);

  if (loading) {
    return <div className="aes-empty">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <>
      {error && (
        <div className="aes-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {orderedSessions.length === 0 ? (
        <div className="aes-empty">คอร์สนี้ยังไม่มีวันเรียนในตารางสอน</div>
      ) : (
        <div className="aes-table-card">
          <div className="aes-grid-wrap">
            <table className="aes-score-grid">
              <thead>
                <tr>
                  <th className="aes-col-no" rowSpan={2}>#</th>
                  <th className="aes-col-name" rowSpan={2}>ชื่อนักเรียน</th>
                  {orderedSessions.map((s, i) => (
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
                  {orderedSessions.map((s) => (
                    <th key={s.date} className="aes-sub-th">{formatDate(s.date)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="aes-col-no">1</td>
                  <td className="aes-col-name">{studentName}</td>
                  {orderedSessions.map((s) => {
                    const status = recordByDate[s.date]?.status || '';
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
                    {attendanceRate != null ? `${attendanceRate}%` : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="aes-legend">
            <span><i className="aes-swatch aes-att-sw-present" /> มาเรียน</span>
            <span><i className="aes-swatch aes-att-sw-late" /> มาสาย</span>
            <span><i className="aes-swatch aes-att-sw-leave" /> ลา</span>
            <span><i className="aes-swatch aes-att-sw-absent" /> ขาด</span>
            <span>{legendNote}</span>
          </div>
        </div>
      )}
    </>
  );
}
