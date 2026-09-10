import { useCallback, useEffect, useMemo, useState } from 'react';
import { getChildAttendance, getMyChildProfile } from '../services/parentAttendanceService';
import { ATTENDANCE_STATUS_TH, statusLabelTH } from '../../../shared/utils/statusLabels';
import './ParentAttendancePage.css';

const STATUS_CLASS = {
  PRESENT: 'present',
  LATE: 'late',
  ABSENT: 'absent',
  LEAVE: 'leave',
  EXCUSED: 'leave',
};

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
  );
}

export default function ParentAttendancePage() {
  const [child, setChild] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [childData, attendanceData] = await Promise.all([
        getMyChildProfile().catch(() => null),
        getChildAttendance(),
      ]);
      setChild(childData);
      setRecords(attendanceData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sortedRecords = useMemo(() => {
    return [...records].sort(
      (a, b) =>
        new Date(b.checkInTime || b.createdAt || 0) -
        new Date(a.checkInTime || a.createdAt || 0)
    );
  }, [records]);

  const summary = useMemo(() => {
    const total = records.length;
    const count = (status) => records.filter((r) => r.status === status).length;
    const present = count('PRESENT');
    const late = count('LATE');
    const absent = count('ABSENT');
    const leave = count('LEAVE') + count('EXCUSED');
    const attended = present + late;
    return {
      total,
      present,
      late,
      absent,
      leave,
      rate: total > 0 ? Math.round((attended / total) * 100) : 0,
    };
  }, [records]);

  return (
    <div className="pa-page">
      <section className="pa-hero">
        <div>
          <p className="pa-hero-kicker">Attendance Tracking</p>
          <h1>การเข้าเรียนของบุตรหลาน</h1>
          {child && (
            <p className="pa-hero-child">
              {child.fullName}
              {child.studentCode ? ` · ${child.studentCode}` : ''}
              {child.currentSchool ? ` · ${child.currentSchool}` : ''}
            </p>
          )}
        </div>
        <button type="button" className="pa-refresh" onClick={load} disabled={loading}>
          {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
        </button>
      </section>

      {loading && (
        <div className="pa-state">
          <div className="pa-spinner" />
          <p>กำลังโหลดข้อมูลการเข้าเรียน...</p>
        </div>
      )}

      {!loading && error && (
        <div className="pa-state pa-state--error">
          <p>{error}</p>
          <button type="button" onClick={load}>
            ลองใหม่อีกครั้ง
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="pa-summary">
            <article className="pa-summary-card">
              <span>อัตราการเข้าเรียน</span>
              <strong>{summary.rate}%</strong>
            </article>
            <article className="pa-summary-card">
              <span>เข้าเรียน</span>
              <strong>{summary.present}</strong>
            </article>
            <article className="pa-summary-card">
              <span>มาสาย</span>
              <strong>{summary.late}</strong>
            </article>
            <article className="pa-summary-card">
              <span>ขาดเรียน</span>
              <strong>{summary.absent}</strong>
            </article>
            <article className="pa-summary-card">
              <span>ลา</span>
              <strong>{summary.leave}</strong>
            </article>
          </section>

          <section className="pa-card">
            <h2>ประวัติการเข้าเรียน ({summary.total} ครั้ง)</h2>

            {sortedRecords.length === 0 ? (
              <p className="pa-empty">ยังไม่มีข้อมูลการเข้าเรียน</p>
            ) : (
              <div className="pa-table-wrap">
                <table className="pa-table">
                  <thead>
                    <tr>
                      <th>วันที่/เวลา</th>
                      <th>คอร์ส</th>
                      <th>หัวข้อ/คาบเรียน</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRecords.map((rec) => (
                      <tr key={rec.id}>
                        <td>{formatDateTime(rec.checkInTime || rec.createdAt)}</td>
                        <td>{rec.courseName || '-'}</td>
                        <td>
                          {rec.lessonTitle || rec.sessionCode || '-'}
                          {rec.status === 'LATE' && rec.lateMinutes
                            ? ` (สาย ${rec.lateMinutes} นาที)`
                            : ''}
                        </td>
                        <td>
                          <span
                            className={`pa-badge pa-badge--${STATUS_CLASS[rec.status] || 'leave'}`}
                          >
                            {statusLabelTH(rec.status, ATTENDANCE_STATUS_TH)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
