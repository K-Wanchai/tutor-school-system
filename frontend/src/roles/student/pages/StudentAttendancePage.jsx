import { useEffect, useMemo, useState } from 'react';
import {
  getMyAttendanceHistory,
  getMyClassroomSessions,
  joinClassroomSession,
} from '../services/studentAttendanceService';
import { getMyCourses } from '../services/studentMyCoursesService.js';
import '../../admin/pages/AdminExamPages.css';
import '../../admin/pages/AdminAttendancePages.css';
import './StudentAttendancePage.css';

// เฉพาะคอร์สที่ชำระเงิน/อนุมัติแล้ว หรือเรียนจบแล้ว ที่นักเรียนมีสิทธิ์เข้าเรียนจริง
const ATTENDING_ENROLLMENT_STATUSES = ['APPROVED', 'COMPLETED'];

const SESSION_STATUS_LABELS = {
  OPEN: 'เปิดห้องเรียน',
  ONGOING: 'กำลังเรียน',
  CLOSED: 'ปิดห้องเรียนแล้ว',
  CANCELLED: 'ยกเลิก',
  SCHEDULED: 'รอตารางเรียน',
  COMPLETED: 'เรียนเสร็จแล้ว',
};

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

function getErrorMessage(error) {
  const status = error?.response?.status;
  if (status === 401) return 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
  if (status === 403) return 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้';
  if (status === 404) return 'ไม่พบห้องเรียนนี้';
  if (status === 409) return 'คุณได้เข้าเรียนรายการนี้แล้ว';
  if (status === 500) return 'เกิดข้อผิดพลาดจากระบบ กรุณาลองใหม่อีกครั้ง';
  return error?.response?.data?.message || error?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
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
  if (!timeValue || typeof timeValue !== 'string') return '-';
  return timeValue.slice(0, 5);
}

function formatDateTime(dateTimeValue) {
  if (!dateTimeValue) return '-';
  const date = new Date(dateTimeValue);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function getSessionStatusLabel(status) {
  return SESSION_STATUS_LABELS[status] || safeValue(status);
}

function getAttendanceStatusLabel(status) {
  return ATTENDANCE_STATUS_LABELS[status] || safeValue(status);
}

function canJoinSession(session) {
  const isOpen = session.status === 'OPEN' || session.status === 'ONGOING';
  const notJoined =
    !session.attendanceStatus ||
    session.attendanceStatus === 'NOT_JOINED' ||
    session.attendanceStatus === '-';
  return isOpen && notJoined;
}

function mapSession(raw) {
  return {
    id: raw?.id ?? raw?.classroomSessionId ?? raw?.sessionId ?? null,
    sessionCode: raw?.sessionCode ?? raw?.code ?? '-',
    courseId: raw?.courseId ?? raw?.course?.id ?? null,
    courseName: raw?.courseName ?? raw?.course?.courseName ?? raw?.course?.name ?? '-',
    lessonTitle: raw?.lessonTitle ?? raw?.lesson?.title ?? raw?.lessonName ?? '-',
    tutorName: raw?.tutorName ?? raw?.tutor?.fullName ?? raw?.teacherName ?? '-',
    scheduleDate: raw?.scheduleDate ?? raw?.date ?? null,
    startTime: raw?.startTime ?? null,
    endTime: raw?.endTime ?? null,
    status: raw?.status ?? '-',
    attendanceStatus: raw?.attendanceStatus ?? raw?.studentAttendanceStatus ?? 'NOT_JOINED',
    joinedAt: raw?.joinedAt ?? raw?.joinTime ?? null,
    leftAt: raw?.leftAt ?? raw?.exitTime ?? null,
    meetingUrl: raw?.meetingUrl ?? raw?.onlineUrl ?? raw?.meetingLink ?? null,
    joinCode: raw?.joinCode ?? null,
    location: raw?.location ?? raw?.roomName ?? '-',
    lateMinutes: raw?.lateMinutes ?? 0,
    note: raw?.note ?? null,
  };
}

function mapAttendance(raw) {
  return {
    id: raw?.id ?? raw?.attendanceId ?? null,
    courseId:
      raw?.courseId ?? raw?.course?.id ??
      raw?.classroomSession?.courseId ?? raw?.classroomSession?.course?.id ?? null,
    courseName:
      raw?.courseName ?? raw?.course?.courseName ?? raw?.course?.name ??
      raw?.classroomSession?.courseName ?? '-',
    lessonTitle:
      raw?.lessonTitle ?? raw?.lesson?.title ?? raw?.lessonName ??
      raw?.classroomSession?.lessonTitle ?? '-',
    sessionCode:
      raw?.sessionCode ?? raw?.classroomSession?.sessionCode ?? raw?.classroomSessionCode ?? '-',
    scheduleDate:
      raw?.scheduleDate ?? raw?.classroomSession?.scheduleDate ?? raw?.date ?? null,
    startTime: raw?.startTime ?? raw?.classroomSession?.startTime ?? null,
    endTime: raw?.endTime ?? raw?.classroomSession?.endTime ?? null,
    joinedAt: raw?.joinedAt ?? raw?.joinTime ?? null,
    leftAt: raw?.leftAt ?? raw?.exitTime ?? null,
    status: raw?.status ?? raw?.attendanceStatus ?? '-',
    lateMinutes: raw?.lateMinutes ?? 0,
  };
}

function mapEnrolledCourse(raw) {
  return {
    courseId: raw?.courseId ?? raw?.course?.id ?? null,
    courseName: raw?.courseName ?? raw?.course?.courseName ?? '-',
    courseCode: raw?.courseCode ?? raw?.course?.courseCode ?? null,
    tutorName: raw?.tutorName ?? raw?.teacherName ?? raw?.tutor?.fullName ?? '-',
    status: raw?.status ?? null,
    courseStartDate: raw?.courseStartDate ?? null,
  };
}

function courseKey(item) {
  return item.courseId ? `course-${item.courseId}` : `course-name-${item.courseName}`;
}

// รวมคาบเรียน (session ปัจจุบัน) + ประวัติการเข้าเรียน เป็นรายการเดียว เรียงตามวันที่ล่าสุดก่อน
function buildTimeline(course) {
  const rows = [];
  course.sessions.forEach((s) => {
    rows.push({
      key: `s-${s.id ?? s.sessionCode}`,
      lessonTitle: s.lessonTitle,
      sessionCode: s.sessionCode,
      scheduleDate: s.scheduleDate,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.attendanceStatus,
      sessionStatus: s.status,
      joinedAt: s.joinedAt,
      leftAt: s.leftAt,
      lateMinutes: s.lateMinutes,
      session: s,
    });
  });
  course.history.forEach((h) => {
    // กันซ้ำกับ session ที่มี sessionCode เดียวกัน
    if (rows.some((r) => r.sessionCode && r.sessionCode === h.sessionCode)) return;
    rows.push({
      key: `h-${h.id ?? h.sessionCode}`,
      lessonTitle: h.lessonTitle,
      sessionCode: h.sessionCode,
      scheduleDate: h.scheduleDate,
      startTime: h.startTime,
      endTime: h.endTime,
      status: h.status,
      sessionStatus: null,
      joinedAt: h.joinedAt,
      leftAt: h.leftAt,
      lateMinutes: h.lateMinutes,
      session: null,
    });
  });
  return rows.sort((a, b) => {
    const first = `${b.scheduleDate || ''} ${b.startTime || ''}`;
    const second = `${a.scheduleDate || ''} ${a.startTime || ''}`;
    return first.localeCompare(second);
  });
}

export default function StudentAttendancePage() {
  const [sessions, setSessions] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);
  const [toast, setToast] = useState({ type: '', msg: '' });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast({ type: '', msg: '' }), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [sessionData, historyData, courseData] = await Promise.all([
        getMyClassroomSessions(),
        getMyAttendanceHistory(),
        getMyCourses().catch(() => []),
      ]);

      setSessions(Array.isArray(sessionData) ? sessionData.map(mapSession) : []);
      setAttendanceHistory(Array.isArray(historyData) ? historyData.map(mapAttendance) : []);
      setEnrolledCourses(
        (Array.isArray(courseData) ? courseData : [])
          .filter((en) => !en.status || ATTENDING_ENROLLMENT_STATUSES.includes(en.status))
          .map(mapEnrolledCourse)
          .filter((c) => c.courseId || c.courseName !== '-')
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const courses = useMemo(() => {
    const map = new Map();

    // เริ่มจาก "คอร์สของฉัน" (ที่ลงทะเบียนไว้) — แสดงเป็นการ์ดเสมอ แม้ยังไม่มีคาบเรียน/ประวัติ
    enrolledCourses.forEach((c) => {
      const key = courseKey(c);
      if (!map.has(key)) {
        map.set(key, {
          key,
          courseId: c.courseId,
          courseName: c.courseName,
          courseCode: c.courseCode,
          tutorName: c.tutorName,
          courseStatus: c.status,
          sessions: [],
          history: [],
        });
      }
    });

    sessions.forEach((s) => {
      const key = courseKey(s);
      if (!map.has(key)) {
        map.set(key, {
          key, courseId: s.courseId, courseName: s.courseName, courseCode: null,
          tutorName: s.tutorName, courseStatus: null, sessions: [], history: [],
        });
      }
      map.get(key).sessions.push(s);
    });

    attendanceHistory.forEach((h) => {
      const key = courseKey(h);
      if (!map.has(key)) {
        map.set(key, {
          key, courseId: h.courseId, courseName: h.courseName, courseCode: null,
          tutorName: '-', courseStatus: null, sessions: [], history: [],
        });
      }
      map.get(key).history.push(h);
    });

    return Array.from(map.values()).map((course) => {
      const attended =
        course.sessions.filter((i) => ATTENDED_STATUSES.includes(i.attendanceStatus)).length +
        course.history.filter((i) => ATTENDED_STATUSES.includes(i.status)).length;
      const late =
        course.sessions.filter((i) => i.attendanceStatus === 'LATE').length +
        course.history.filter((i) => i.status === 'LATE').length;
      const recorded =
        course.sessions.filter((i) => i.attendanceStatus && i.attendanceStatus !== 'NOT_JOINED' && i.attendanceStatus !== '-').length +
        course.history.length;
      const totalUnits = course.sessions.length + course.history.length;
      const availableCount = course.sessions.filter(canJoinSession).length;
      return {
        ...course,
        attended,
        late,
        recorded,
        totalUnits,
        availableCount,
        attendanceRate: recorded > 0 ? Math.round((attended / recorded) * 100) : null,
      };
    });
  }, [enrolledCourses, sessions, attendanceHistory]);

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

  const handleJoinSession = async (session) => {
    if (!session?.id) {
      showToast('error', 'ไม่พบข้อมูลสำหรับเข้าเรียน');
      return;
    }
    try {
      setJoining(true);
      const result = await joinClassroomSession(session.id, session.joinCode);
      showToast('success', 'บันทึกการเข้าเรียนสำเร็จ กำลังพาไปยังห้องเรียน...');
      await loadData();
      const url = result?.meetingLink || session.meetingUrl;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="aes-page">
        <div className="aes-empty">กำลังโหลดข้อมูลการเข้าเรียน...</div>
      </div>
    );
  }

  // ── มุมมองรายละเอียดคอร์ส: การเข้าเรียนเฉพาะของนักเรียนคนนี้ ──
  if (selectedCourse) {
    const timeline = buildTimeline(selectedCourse);
    return (
      <div className="aes-page">
        {toast.msg && <div className={`sap-toast sap-toast-${toast.type}`}>{toast.msg}</div>}

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
              คาบเรียน: <b>{timeline.length} คาบ</b> ·
              เข้าเรียนแล้ว: <b>{selectedCourse.attended}</b> ·
              มาสาย: <b>{selectedCourse.late}</b> ·
              อัตราเข้าเรียน: <b>{selectedCourse.attendanceRate != null ? `${selectedCourse.attendanceRate}%` : '-'}</b>
            </p>
          </div>
          <span className="aes-readonly-badge">การเข้าเรียนของฉัน</span>
        </div>

        {error && (
          <div className="aes-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')}>✕</button>
          </div>
        )}

        {timeline.length === 0 ? (
          <div className="aes-empty">คอร์สนี้ยังไม่มีคาบเรียนหรือประวัติการเข้าเรียน</div>
        ) : (
          <div className="aes-table-card">
            <div className="aes-grid-wrap">
              <table className="aes-score-grid">
                <thead>
                  <tr>
                    <th className="aes-col-no">#</th>
                    <th className="aes-col-name">บทเรียน / คาบเรียน</th>
                    <th>วันที่</th>
                    <th>เวลา</th>
                    <th>เวลาเข้า</th>
                    <th>เวลาออก</th>
                    <th>สถานะการเข้าเรียน</th>
                    <th>การเข้าเรียน</th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.map((row, idx) => {
                    const st = String(row.status || '').toLowerCase();
                    return (
                      <tr key={row.key}>
                        <td className="aes-col-no">{idx + 1}</td>
                        <td className="aes-col-name">
                          {safeValue(row.lessonTitle)}
                          <span className="sap-row-sub">{safeValue(row.sessionCode)}</span>
                        </td>
                        <td>{formatDate(row.scheduleDate)}</td>
                        <td>{formatTime(row.startTime)} - {formatTime(row.endTime)}</td>
                        <td>{formatDateTime(row.joinedAt)}</td>
                        <td>{formatDateTime(row.leftAt)}</td>
                        <td className={`aes-att-cell aes-att-${st || 'none'}`}>
                          {getAttendanceStatusLabel(row.status)}
                          {row.status === 'LATE' && row.lateMinutes ? ` (${row.lateMinutes} นาที)` : ''}
                        </td>
                        <td>
                          {row.session && canJoinSession(row.session) ? (
                            <button
                              type="button"
                              className="aes-back sap-join-btn"
                              disabled={joining}
                              onClick={() => handleJoinSession(row.session)}
                            >
                              {joining ? 'กำลังบันทึก...' : 'กดเพื่อเข้าเรียน'}
                            </button>
                          ) : row.session?.meetingUrl ? (
                            <button
                              type="button"
                              className="aes-back sap-join-btn"
                              onClick={() => window.open(row.session.meetingUrl, '_blank', 'noopener,noreferrer')}
                            >
                              เปิดลิงก์เรียน
                            </button>
                          ) : row.sessionStatus ? (
                            <span className="sap-row-sub">{getSessionStatusLabel(row.sessionStatus)}</span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
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
      {toast.msg && <div className={`sap-toast sap-toast-${toast.type}`}>{toast.msg}</div>}

      <div className="aes-header">
        <div>
          <h1>การเข้าเรียนของฉัน</h1>
          <p>เลือกคอร์สเพื่อดูข้อมูลการเข้าเรียนของคุณในคอร์สนั้น</p>
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
          <button type="button" onClick={loadData}>ลองใหม่</button>
        </div>
      )}

      {filteredCourses.length === 0 ? (
        <div className="aes-empty">
          {keyword
            ? `ไม่พบคอร์สสำหรับ "${keyword}"`
            : 'ยังไม่มีคอร์สของฉัน — เมื่อสมัครเรียนและได้รับการอนุมัติแล้ว คอร์สจะแสดงที่นี่'}
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
                  {course.availableCount > 0 ? `มีห้องเปิด ${course.availableCount}` : 'คอร์สของฉัน'}
                </span>
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

              <span className="aes-card-cta">
                {course.availableCount > 0
                  ? `เข้าเรียนได้ ${course.availableCount} ห้อง →`
                  : 'ดูการเข้าเรียน →'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
