import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getChildAttendance,
  getChildEnrollments,
  getChildExamResults,
  getChildSchedules,
  getMyChildProfile,
} from '../services/parentService';
import {
  ATTENDANCE_STATUS_TH,
  ENROLLMENT_STATUS_TH,
  EXAM_STATUS_TH,
  PAYMENT_STATUS_TH,
  SCHEDULE_STATUS_TH,
  statusLabelTH,
} from '../../../shared/utils/statusLabels';
import './ParentTrackingPage.css';

const TABS = [
  { key: 'ENROLLMENTS', label: 'ประวัติการสมัครเรียน' },
  { key: 'SCHEDULE', label: 'ตารางเรียน' },
  { key: 'EXAMS', label: 'ผลสอบ' },
  { key: 'ATTENDANCE', label: 'การเข้าเรียน' },
];

const ATT_STATUS_CLASS = {
  PRESENT: 'present',
  LATE: 'late',
  ABSENT: 'absent',
  LEAVE: 'leave',
  EXCUSED: 'leave',
};

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

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

function formatTime(value) {
  if (!value) return '-';
  return String(value).slice(0, 5);
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '-';
  const n = Number(value);
  return Number.isNaN(n) ? '-' : `${n.toLocaleString('th-TH')} บาท`;
}

function getErrorMessage(err) {
  return err?.response?.data?.message || err?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}

function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} className="pt-empty-cell">
        {text}
      </td>
    </tr>
  );
}

export default function ParentTrackingPage() {
  const [tab, setTab] = useState('ATTENDANCE');
  const [child, setChild] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [childData, enrollData, scheduleData, examData, attendanceData] = await Promise.all([
        getMyChildProfile().catch(() => null),
        getChildEnrollments(),
        getChildSchedules(),
        getChildExamResults(),
        getChildAttendance(),
      ]);
      setChild(childData);
      setEnrollments(enrollData);
      setSchedules(scheduleData);
      setExamResults(examData);
      setAttendance(attendanceData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sortedSchedules = useMemo(
    () =>
      [...schedules].sort(
        (a, b) =>
          new Date(`${a.scheduleDate}T${a.startTime || '00:00'}`) -
          new Date(`${b.scheduleDate}T${b.startTime || '00:00'}`)
      ),
    [schedules]
  );

  const sortedAttendance = useMemo(
    () =>
      [...attendance].sort(
        (a, b) =>
          new Date(b.checkInTime || b.createdAt || 0) -
          new Date(a.checkInTime || a.createdAt || 0)
      ),
    [attendance]
  );

  const attendanceSummary = useMemo(() => {
    const total = attendance.length;
    const count = (s) => attendance.filter((r) => r.status === s).length;
    const present = count('PRESENT');
    const late = count('LATE');
    const attended = present + late;
    return {
      total,
      present,
      late,
      absent: count('ABSENT'),
      leave: count('LEAVE') + count('EXCUSED'),
      rate: total > 0 ? Math.round((attended / total) * 100) : 0,
    };
  }, [attendance]);

  const counts = {
    ENROLLMENTS: enrollments.length,
    SCHEDULE: schedules.length,
    EXAMS: examResults.length,
    ATTENDANCE: attendance.length,
  };

  return (
    <div className="pt-page">
      <section className="pt-hero">
        <div>
          <p className="pt-hero-kicker">Parent Tracking</p>
          <h1>ติดตามการเรียนของบุตรหลาน</h1>
          {child && (
            <p className="pt-hero-child">
              {child.fullName}
              {child.studentCode ? ` · ${child.studentCode}` : ''}
              {child.currentSchool ? ` · ${child.currentSchool}` : ''}
            </p>
          )}
        </div>
        <button type="button" className="pt-refresh" onClick={load} disabled={loading}>
          {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
        </button>
      </section>

      {loading && (
        <div className="pt-state">
          <div className="pt-spinner" />
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {!loading && error && (
        <div className="pt-state pt-state--error">
          <p>{error}</p>
          <button type="button" onClick={load}>
            ลองใหม่อีกครั้ง
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="pt-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={tab === t.key ? 'active' : ''}
                onClick={() => setTab(t.key)}
              >
                {t.label} ({counts[t.key]})
              </button>
            ))}
          </div>

          {tab === 'ENROLLMENTS' && (
            <section className="pt-card">
              <div className="pt-table-wrap">
                <table className="pt-table">
                  <thead>
                    <tr>
                      <th>คอร์ส</th>
                      <th>ผู้สอน</th>
                      <th>วันที่สมัคร</th>
                      <th>สถานะสมัคร</th>
                      <th>การชำระเงิน</th>
                      <th className="pt-num">ยอดชำระ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.length === 0 ? (
                      <EmptyRow colSpan={6} text="ยังไม่มีประวัติการสมัครเรียน" />
                    ) : (
                      enrollments.map((e) => (
                        <tr key={e.id}>
                          <td>
                            <strong>{e.courseName || '-'}</strong>
                            <span className="pt-sub">{e.courseCode || ''}</span>
                          </td>
                          <td>{e.tutorName || '-'}</td>
                          <td>{formatDate(e.enrollmentDate)}</td>
                          <td>{statusLabelTH(e.status, ENROLLMENT_STATUS_TH)}</td>
                          <td>{statusLabelTH(e.paymentStatus, PAYMENT_STATUS_TH)}</td>
                          <td className="pt-num">{formatCurrency(e.finalAmount ?? e.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === 'SCHEDULE' && (
            <section className="pt-card">
              <div className="pt-table-wrap">
                <table className="pt-table">
                  <thead>
                    <tr>
                      <th>วันที่</th>
                      <th>เวลา</th>
                      <th>คอร์ส</th>
                      <th>หัวข้อ</th>
                      <th>รูปแบบ/สถานที่</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSchedules.length === 0 ? (
                      <EmptyRow colSpan={6} text="ยังไม่มีตารางเรียน" />
                    ) : (
                      sortedSchedules.map((s, i) => (
                        <tr key={s.id || `${s.scheduleDate}-${i}`}>
                          <td>{formatDate(s.scheduleDate)}</td>
                          <td>
                            {formatTime(s.startTime)} - {formatTime(s.endTime)}
                          </td>
                          <td>{s.courseName || '-'}</td>
                          <td>{s.lessonTitle || s.title || '-'}</td>
                          <td>{s.location || s.meetingLink || '-'}</td>
                          <td>{s.status ? statusLabelTH(s.status, SCHEDULE_STATUS_TH) : 'ตามกำหนดการ'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === 'EXAMS' && (
            <section className="pt-card">
              <div className="pt-table-wrap">
                <table className="pt-table">
                  <thead>
                    <tr>
                      <th>ข้อสอบ</th>
                      <th>คอร์ส</th>
                      <th>วันที่ส่ง</th>
                      <th className="pt-num">คะแนน</th>
                      <th>ผล</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examResults.length === 0 ? (
                      <EmptyRow colSpan={6} text="ยังไม่มีผลสอบ" />
                    ) : (
                      examResults.map((r) => (
                        <tr key={r.submissionId}>
                          <td>
                            <strong>{r.examTitle || '-'}</strong>
                            <span className="pt-sub">{r.examCode || ''}</span>
                          </td>
                          <td>{r.courseName || '-'}</td>
                          <td>{formatDateTime(r.submittedAt)}</td>
                          <td className="pt-num">
                            {r.obtainedScore != null && r.totalScore != null
                              ? `${r.obtainedScore}/${r.totalScore}`
                              : '-'}
                          </td>
                          <td>
                            {r.isPassed == null ? (
                              '-'
                            ) : (
                              <span className={`pt-badge pt-badge--${r.isPassed ? 'present' : 'absent'}`}>
                                {r.isPassed ? 'ผ่าน' : 'ไม่ผ่าน'}
                              </span>
                            )}
                          </td>
                          <td>{statusLabelTH(r.status, EXAM_STATUS_TH)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === 'ATTENDANCE' && (
            <>
              <section className="pt-summary">
                <article className="pt-summary-card">
                  <span>อัตราการเข้าเรียน</span>
                  <strong>{attendanceSummary.rate}%</strong>
                </article>
                <article className="pt-summary-card">
                  <span>เข้าเรียน</span>
                  <strong>{attendanceSummary.present}</strong>
                </article>
                <article className="pt-summary-card">
                  <span>มาสาย</span>
                  <strong>{attendanceSummary.late}</strong>
                </article>
                <article className="pt-summary-card">
                  <span>ขาดเรียน</span>
                  <strong>{attendanceSummary.absent}</strong>
                </article>
                <article className="pt-summary-card">
                  <span>ลา</span>
                  <strong>{attendanceSummary.leave}</strong>
                </article>
              </section>

              <section className="pt-card">
                <div className="pt-table-wrap">
                  <table className="pt-table">
                    <thead>
                      <tr>
                        <th>วันที่/เวลา</th>
                        <th>คอร์ส</th>
                        <th>หัวข้อ/คาบเรียน</th>
                        <th>สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAttendance.length === 0 ? (
                        <EmptyRow colSpan={4} text="ยังไม่มีข้อมูลการเข้าเรียน" />
                      ) : (
                        sortedAttendance.map((rec) => (
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
                                className={`pt-badge pt-badge--${ATT_STATUS_CLASS[rec.status] || 'leave'}`}
                              >
                                {statusLabelTH(rec.status, ATTENDANCE_STATUS_TH)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
