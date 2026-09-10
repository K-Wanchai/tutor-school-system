import { useEffect, useMemo, useState } from 'react';
import {
  getCourseSchedules,
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

function isRealStatus(status) {
  return !!status && status !== 'NOT_JOINED' && status !== '-';
}

// key เป็นวันที่ล้วน (ตัดเวลา) ใช้จับคู่คาบเรียนข้ามแหล่งข้อมูล
function dateKey(value) {
  return value ? String(value).slice(0, 10) : '';
}

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
    studentName: raw?.studentName ?? raw?.student?.fullName ?? null,
    status: raw?.status ?? null,
    courseStartDate: raw?.courseStartDate ?? null,
  };
}

function courseKey(item) {
  return item.courseId ? `course-${item.courseId}` : `course-name-${item.courseName}`;
}

// รวมทุกแหล่งข้อมูลของคอร์สให้เหลือ "หนึ่งแถวต่อหนึ่งคาบเรียน (ต่อวัน)" ของนักเรียนคนนี้:
//  1) ตารางคาบเรียนจริง (schedules) = รายการคาบที่แน่นอน รวมคาบที่ยังไม่ถึง
//  2) classroom sessions ของฉัน = สถานะสด + ลิงก์เข้าเรียน
//  3) attendance records = สถานะที่ติวเตอร์เช็คชื่อยืนยันแล้ว (ถือเป็นค่าจริงสุด)
function buildCourseSessions(course, schedules) {
  const byDate = new Map();

  (schedules || [])
    .filter((s) => s.status !== 'CANCELLED' && s.scheduleDate)
    .forEach((s) => {
      const k = dateKey(s.scheduleDate);
      if (!byDate.has(k)) {
        byDate.set(k, {
          date: k,
          startTime: s.startTime ?? null,
          endTime: s.endTime ?? null,
          lessonTitle: s.lessonTitle || s.title || null,
          status: null,
        });
      }
    });

  course.sessions.forEach((s) => {
    const k = dateKey(s.scheduleDate);
    const e = byDate.get(k) || { date: k, status: null };
    byDate.set(k, {
      ...e,
      startTime: e.startTime ?? s.startTime,
      endTime: e.endTime ?? s.endTime,
      lessonTitle: e.lessonTitle && e.lessonTitle !== '-' ? e.lessonTitle : s.lessonTitle,
      sessionCode: s.sessionCode,
      joinedAt: s.joinedAt,
      leftAt: s.leftAt,
      lateMinutes: s.lateMinutes,
      session: s,
      sessionStatus: s.status,
      status: isRealStatus(s.attendanceStatus) ? s.attendanceStatus : e.status,
    });
  });

  course.history.forEach((h) => {
    const k = dateKey(h.scheduleDate);
    const e = byDate.get(k) || { date: k };
    byDate.set(k, {
      ...e,
      startTime: e.startTime ?? h.startTime,
      endTime: e.endTime ?? h.endTime,
      lessonTitle: e.lessonTitle && e.lessonTitle !== '-' ? e.lessonTitle : h.lessonTitle,
      sessionCode: e.sessionCode || h.sessionCode,
      joinedAt: e.joinedAt ?? h.joinedAt,
      leftAt: e.leftAt ?? h.leftAt,
      lateMinutes: h.lateMinutes || e.lateMinutes,
      status: h.status,
    });
  });

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// สรุปตัวเลขบนการ์ด — รวมตารางคาบเรียนจริงเข้าไปด้วย เพื่อให้ "คาบเรียน" ตรงกับหน้ารายละเอียด
function summarizeCourse(course, schedules) {
  const rows = buildCourseSessions(course, schedules);
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

export default function StudentAttendancePage() {
  const [sessions, setSessions] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);
  const [schedulesByCourse, setSchedulesByCourse] = useState({});
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

      const mappedSessions = Array.isArray(sessionData) ? sessionData.map(mapSession) : [];
      const mappedHistory = Array.isArray(historyData) ? historyData.map(mapAttendance) : [];
      const mappedCourses = (Array.isArray(courseData) ? courseData : [])
        .filter((en) => !en.status || ATTENDING_ENROLLMENT_STATUSES.includes(en.status))
        .map(mapEnrolledCourse)
        .filter((c) => c.courseId || c.courseName !== '-');

      setSessions(mappedSessions);
      setAttendanceHistory(mappedHistory);
      setEnrolledCourses(mappedCourses);

      // ดึงตารางคาบเรียนจริงของทุกคอร์ส เพื่อให้ "คาบเรียน" บนการ์ดตรงกับจำนวนคาบจริง
      const courseIds = [
        ...new Set(
          [...mappedCourses, ...mappedSessions, ...mappedHistory]
            .map((c) => c.courseId)
            .filter(Boolean)
        ),
      ];
      const scheduleEntries = await Promise.all(
        courseIds.map((id) =>
          getCourseSchedules(id)
            .then((s) => [id, Array.isArray(s) ? s : []])
            .catch(() => [id, []])
        )
      );
      setSchedulesByCourse(Object.fromEntries(scheduleEntries));
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
          studentName: c.studentName,
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
          tutorName: s.tutorName, studentName: null, sessions: [], history: [],
        });
      }
      map.get(key).sessions.push(s);
    });

    attendanceHistory.forEach((h) => {
      const key = courseKey(h);
      if (!map.has(key)) {
        map.set(key, {
          key, courseId: h.courseId, courseName: h.courseName, courseCode: null,
          tutorName: '-', studentName: null, sessions: [], history: [],
        });
      }
      map.get(key).history.push(h);
    });

    return Array.from(map.values()).map((course) => ({
      ...course,
      ...summarizeCourse(course, schedulesByCourse[course.courseId] || []),
      availableCount: course.sessions.filter(canJoinSession).length,
    }));
  }, [enrolledCourses, sessions, attendanceHistory, schedulesByCourse]);

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

  // ── มุมมองรายละเอียดคอร์ส: ตารางการเช็คชื่อรายคาบ เฉพาะของนักเรียนคนนี้ ──
  if (selectedCourse) {
    const rows = buildCourseSessions(selectedCourse, schedulesByCourse[selectedCourse.courseId] || []);
    const attended = rows.filter((r) => ATTENDED_STATUSES.includes(r.status)).length;
    const recorded = rows.filter((r) => isRealStatus(r.status)).length;
    const rate = recorded > 0 ? Math.round((attended / recorded) * 100) : null;
    const studentName = selectedCourse.studentName || 'ฉัน';
    const openSessions = rows.filter((r) => r.session && canJoinSession(r.session));

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
              คาบเรียน: <b>{rows.length} คาบ</b> ·
              เข้าเรียนแล้ว: <b>{attended}</b> ·
              มาสาย: <b>{rows.filter((r) => r.status === 'LATE').length}</b> ·
              อัตราเข้าเรียน: <b>{rate != null ? `${rate}%` : '-'}</b>
            </p>
          </div>
          <span className="aes-readonly-badge">การเช็คชื่อของฉัน</span>
        </div>

        {error && (
          <div className="aes-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')}>✕</button>
          </div>
        )}

        {openSessions.length > 0 && (
          <div className="sap-open-sessions">
            {openSessions.map((r) => (
              <div key={r.date} className="sap-open-row">
                <span>
                  <b>ห้องเรียนเปิดอยู่</b> — {safeValue(r.lessonTitle)} · {formatDate(r.date)}{' '}
                  {formatTime(r.startTime)}-{formatTime(r.endTime)}
                </span>
                <button
                  type="button"
                  className="sap-join-btn"
                  disabled={joining}
                  onClick={() => handleJoinSession(r.session)}
                >
                  {joining ? 'กำลังบันทึก...' : 'กดเพื่อเข้าเรียน'}
                </button>
              </div>
            ))}
          </div>
        )}

        {rows.length === 0 ? (
          <div className="aes-empty">คอร์สนี้ยังไม่มีคาบเรียนหรือประวัติการเช็คชื่อ</div>
        ) : (
          <div className="aes-table-card">
            <div className="aes-grid-wrap">
              <table className="aes-score-grid">
                <thead>
                  <tr>
                    <th className="aes-col-no">คาบที่</th>
                    <th className="aes-col-name">นักเรียน</th>
                    {rows.map((r, i) => (
                      <th key={r.date} className="aes-att-day-th">
                        คาบที่ {i + 1}
                        <span className="aes-att-day-date">{formatDate(r.date)}</span>
                        <span className="aes-att-day-time">{formatTime(r.startTime)}-{formatTime(r.endTime)}</span>
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
                        <td key={r.date} className={`aes-att-cell aes-att-${st || 'none'}`}>
                          {isRealStatus(r.status)
                            ? getAttendanceStatusLabel(r.status)
                            : (r.sessionStatus ? getSessionStatusLabel(r.sessionStatus) : '—')}
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
