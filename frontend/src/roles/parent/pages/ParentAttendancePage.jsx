import { useEffect, useMemo, useState } from 'react';
import { getChildAttendance, getChildEnrollments } from '../services/parentService';
import '../../admin/pages/AdminExamPages.css';
import '../../admin/pages/AdminAttendancePages.css';
import '../../student/pages/StudentAttendancePage.css';

// เฉพาะคอร์สที่ชำระเงิน/อนุมัติแล้ว หรือเรียนจบแล้ว ที่บุตรหลานมีสิทธิ์เข้าเรียนจริง
const ATTENDING_ENROLLMENT_STATUSES = ['APPROVED', 'COMPLETED'];

const ATTENDANCE_STATUS_LABELS = {
  NOT_JOINED: 'ยังไม่ได้เข้าเรียน',
  PRESENT: 'เข้าเรียนแล้ว',
  LATE: 'มาสาย',
  ABSENT: 'ขาดเรียน',
  LEAVE: 'ลา',
  EXCUSED: 'ลา',
  LEFT: 'ออกจากห้องแล้ว',
};

const ATTENDED_STATUSES = ['PRESENT', 'LATE', 'LEFT'];

function isRealStatus(status) {
  return !!status && status !== 'NOT_JOINED' && status !== '-';
}

function dateKey(value) {
  return value ? String(value).slice(0, 10) : '';
}

function safeValue(value) {
  return value === null || value === undefined || value === '' ? '-' : value;
}

function formatDate(dateValue) {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(timeValue) {
  if (!timeValue) return '-';
  const value = String(timeValue);
  // รองรับทั้ง "HH:mm:ss" และ ISO datetime — ตัดเอาเฉพาะเวลา
  const match = value.match(/T?(\d{2}:\d{2})/);
  return match ? match[1] : value.slice(0, 5);
}

function getAttendanceStatusLabel(status) {
  return ATTENDANCE_STATUS_LABELS[status] || safeValue(status);
}

function mapAttendance(raw) {
  return {
    id: raw?.id ?? null,
    courseId: raw?.courseId ?? null,
    courseName: raw?.courseName ?? '-',
    lessonTitle: raw?.lessonTitle ?? '-',
    sessionCode: raw?.sessionCode ?? '-',
    scheduleDate: dateKey(raw?.checkInTime || raw?.createdAt),
    checkInTime: raw?.checkInTime ?? raw?.createdAt ?? null,
    status: raw?.status ?? '-',
    lateMinutes: raw?.lateMinutes ?? 0,
  };
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

function courseKey(item) {
  return item.courseId ? `course-${item.courseId}` : `course-name-${item.courseName}`;
}

// รวมข้อมูลของคอร์ส ให้เหลือ "หนึ่งแถวต่อหนึ่งคาบเรียน (ต่อวัน)" — เรียงตามวันที่
function buildCourseSessions(course) {
  const byDate = new Map();
  course.records.forEach((r) => {
    const k = r.scheduleDate;
    if (!k) return;
    byDate.set(k, r);
  });
  return [...byDate.values()].sort((a, b) => a.scheduleDate.localeCompare(b.scheduleDate));
}

function summarizeCourse(course) {
  const rows = buildCourseSessions(course);
  const attended = rows.filter((r) => ATTENDED_STATUSES.includes(r.status)).length;
  const recorded = rows.filter((r) => isRealStatus(r.status)).length;
  return {
    totalUnits: rows.length,
    attended,
    late: rows.filter((r) => r.status === 'LATE').length,
    recorded,
    attendanceRate: recorded > 0 ? Math.round((attended / recorded) * 100) : null,
  };
}

function SessionStrip({ rows }) {
  if (!rows.length) {
    return <div className="sap-strip sap-strip--empty">ยังไม่มีข้อมูลการเข้าเรียน</div>;
  }
  return (
    <div className="sap-strip">
      {rows.map((r) => {
        const st = String(r.status || '').toLowerCase();
        const label = isRealStatus(r.status) ? getAttendanceStatusLabel(r.status) : 'ยังไม่เช็คชื่อ';
        return (
          <span
            key={r.scheduleDate}
            className={`sap-strip-cell aes-att-${st || 'none'}`}
            title={`${formatDate(r.scheduleDate)} · ${label}`}
          />
        );
      })}
    </div>
  );
}

export default function ParentAttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const [attData, courseData] = await Promise.all([
        getChildAttendance(),
        getChildEnrollments().catch(() => []),
      ]);
      setAttendance((Array.isArray(attData) ? attData : []).map(mapAttendance));
      setEnrolledCourses(
        (Array.isArray(courseData) ? courseData : [])
          .filter((en) => !en.status || ATTENDING_ENROLLMENT_STATUSES.includes(en.status))
          .map(mapEnrolledCourse)
          .filter((c) => c.courseId || c.courseName !== '-')
      );
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'ไม่สามารถโหลดข้อมูลการเข้าเรียนได้');
    } finally {
      setLoading(false);
    }
  }

  const courses = useMemo(() => {
    const map = new Map();

    const ensure = (key, seed) => {
      if (!map.has(key)) {
        map.set(key, {
          key, courseId: null, courseName: '-', courseCode: null, tutorName: '-',
          studentName: null, records: [], ...seed,
        });
      }
      return map.get(key);
    };

    enrolledCourses.forEach((c) => {
      ensure(courseKey(c), {
        courseId: c.courseId, courseName: c.courseName, courseCode: c.courseCode,
        tutorName: c.tutorName, studentName: c.studentName,
      });
    });

    attendance.forEach((r) => {
      ensure(courseKey(r), { courseId: r.courseId, courseName: r.courseName }).records.push(r);
    });

    return Array.from(map.values()).map((course) => ({
      ...course,
      ...summarizeCourse(course),
      timeline: buildCourseSessions(course),
    }));
  }, [enrolledCourses, attendance]);

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
        <div className="aes-empty">กำลังโหลดข้อมูลการเข้าเรียน...</div>
      </div>
    );
  }

  // ── มุมมองรายละเอียดคอร์ส: การเช็คชื่อรายคาบ เฉพาะของบุตรหลานคนนี้ ──
  if (selectedCourse) {
    const rows = selectedCourse.timeline || [];
    const attended = rows.filter((r) => ATTENDED_STATUSES.includes(r.status)).length;
    const recorded = rows.filter((r) => isRealStatus(r.status)).length;
    const rate = recorded > 0 ? Math.round((attended / recorded) * 100) : null;
    const studentName = selectedCourse.studentName || 'บุตรหลาน';

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
              คาบเรียน: <b>{rows.length} คาบ</b> ·
              เข้าเรียนแล้ว: <b>{attended}</b> ·
              มาสาย: <b>{rows.filter((r) => r.status === 'LATE').length}</b> ·
              อัตราเข้าเรียน: <b>{rate != null ? `${rate}%` : '-'}</b>
            </p>
          </div>
          <span className="aes-readonly-badge">การเข้าเรียนของบุตรหลาน</span>
        </div>

        {error && (
          <div className="aes-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')}>✕</button>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="aes-empty">คอร์สนี้ยังไม่มีข้อมูลการเข้าเรียน</div>
        ) : (
          <div className="aes-table-card">
            <div className="aes-grid-wrap">
              <table className="aes-score-grid">
                <thead>
                  <tr>
                    <th className="aes-col-no">คาบที่</th>
                    <th className="aes-col-name">นักเรียน</th>
                    {rows.map((r, i) => (
                      <th key={r.scheduleDate} className="aes-att-day-th">
                        คาบที่ {i + 1}
                        <span className="aes-att-day-date">{formatDate(r.scheduleDate)}</span>
                        <span className="aes-att-day-time">{formatTime(r.checkInTime)}</span>
                      </th>
                    ))}
                    <th className="aes-col-avg">อัตราเข้าเรียน</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="aes-col-no">1</td>
                    <td className="aes-col-name">{studentName}</td>
                    {rows.map((r) => {
                      const st = String(r.status || '').toLowerCase();
                      return (
                        <td key={r.scheduleDate} className={`aes-att-cell aes-att-${st || 'none'}`}>
                          {isRealStatus(r.status) ? getAttendanceStatusLabel(r.status) : '—'}
                          {r.status === 'LATE' && r.lateMinutes ? ` (${r.lateMinutes} นาที)` : ''}
                        </td>
                      );
                    })}
                    <td className="aes-col-avg">{rate != null ? `${rate}%` : '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="aes-legend">
              <span><i className="aes-swatch aes-att-sw-present" /> เข้าเรียน</span>
              <span><i className="aes-swatch aes-att-sw-late" /> มาสาย</span>
              <span><i className="aes-swatch aes-att-sw-leave" /> ลา</span>
              <span><i className="aes-swatch aes-att-sw-absent" /> ขาดเรียน</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── มุมมองรายการคอร์ส (การ์ด) ──
  return (
    <div className="aes-page">
      <div className="aes-header">
        <div>
          <h1>การเข้าเรียนของบุตรหลาน</h1>
          <p>เลือกคอร์สเพื่อดูข้อมูลการเข้าเรียนของบุตรหลานในคอร์สนั้น</p>
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
                <span className="aes-status">คอร์สของบุตรหลาน</span>
              </div>

              <h2 className="aes-card-title">{safeValue(course.courseName)}</h2>
              <p className="aes-card-desc">ผู้สอน: {safeValue(course.tutorName)}</p>

              <div className="aes-card-info">
                <div>
                  <span>คาบเรียน</span>
                  <strong>{course.totalUnits} คาบ</strong>
                </div>
                <div>
                  <span>เข้าเรียนแล้ว</span>
                  <strong>{course.attended}</strong>
                </div>
                <div>
                  <span>อัตราเข้าเรียน</span>
                  <strong>{course.attendanceRate != null ? `${course.attendanceRate}%` : '-'}</strong>
                </div>
              </div>

              <SessionStrip rows={course.timeline || []} />

              <span className="aes-card-cta">ดูการเข้าเรียน →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
