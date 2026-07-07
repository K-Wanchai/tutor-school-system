import { useEffect, useMemo, useState } from 'react';
import {
  getMyAttendanceHistory,
  getMyClassroomSessions,
  joinClassroomByCode,
  joinClassroomSession,
} from '../services/studentAttendanceService';
import './StudentAttendancePage.css';

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
  LEFT: 'ออกจากห้องแล้ว',
};

function getErrorMessage(error) {
  const status = error?.response?.status;

  if (status === 401) return 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
  if (status === 403) return 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้';
  if (status === 404) return 'ไม่พบห้องเรียนนี้';
  if (status === 409) return 'คุณได้เข้าเรียนรายการนี้แล้ว';
  if (status === 500) return 'เกิดข้อผิดพลาดจากระบบ กรุณาลองใหม่อีกครั้ง';

  return (
    error?.response?.data?.message ||
    error?.message ||
    'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
  );
}

function safeValue(value) {
  return value === null || value === undefined || value === '' ? '-' : value;
}

function formatDate(dateValue) {
  if (!dateValue) return '-';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(timeValue) {
  if (!timeValue) return '-';

  if (typeof timeValue === 'string') {
    return timeValue.slice(0, 5);
  }

  return '-';
}

function formatDateTime(dateTimeValue) {
  if (!dateTimeValue) return '-';

  const date = new Date(dateTimeValue);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
    lessonId: raw?.lessonId ?? raw?.lesson?.id ?? null,
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
    note: raw?.note ?? null,
    createdAt: raw?.createdAt ?? null,
    updatedAt: raw?.updatedAt ?? null,
  };
}

function mapAttendance(raw) {
  return {
    id: raw?.id ?? raw?.attendanceId ?? null,
    courseId:
      raw?.courseId ??
      raw?.course?.id ??
      raw?.classroomSession?.courseId ??
      raw?.classroomSession?.course?.id ??
      null,
    courseName:
      raw?.courseName ??
      raw?.course?.courseName ??
      raw?.course?.name ??
      raw?.classroomSession?.courseName ??
      '-',
    lessonTitle:
      raw?.lessonTitle ??
      raw?.lesson?.title ??
      raw?.lessonName ??
      raw?.classroomSession?.lessonTitle ??
      '-',
    sessionCode:
      raw?.sessionCode ??
      raw?.classroomSession?.sessionCode ??
      raw?.classroomSessionCode ??
      '-',
    scheduleDate:
      raw?.scheduleDate ??
      raw?.classroomSession?.scheduleDate ??
      raw?.date ??
      null,
    startTime: raw?.startTime ?? raw?.classroomSession?.startTime ?? null,
    endTime: raw?.endTime ?? raw?.classroomSession?.endTime ?? null,
    joinedAt: raw?.joinedAt ?? raw?.joinTime ?? null,
    leftAt: raw?.leftAt ?? raw?.exitTime ?? null,
    status: raw?.status ?? raw?.attendanceStatus ?? '-',
    lateMinutes: raw?.lateMinutes ?? 0,
  };
}

function buildCourseKey(item) {
  if (item.courseId) return `course-${item.courseId}`;
  return `course-name-${item.courseName}`;
}

function StudentAttendancePage() {
  const [sessions, setSessions] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [toast, setToast] = useState({ type: '', msg: '' });

  const showToast = (type, msg) => {
    setToast({ type, msg });

    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      setToast({ type: '', msg: '' });
    }, 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [sessionData, historyData] = await Promise.all([
        getMyClassroomSessions(),
        getMyAttendanceHistory(),
      ]);

      const mappedSessions = Array.isArray(sessionData)
        ? sessionData.map(mapSession)
        : [];

      const mappedHistory = Array.isArray(historyData)
        ? historyData.map(mapAttendance)
        : [];

      setSessions(mappedSessions);
      setAttendanceHistory(mappedHistory);
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
    const courseMap = new Map();

    sessions.forEach((session) => {
      const key = buildCourseKey(session);

      if (!courseMap.has(key)) {
        courseMap.set(key, {
          key,
          courseId: session.courseId,
          courseName: session.courseName,
          tutorName: session.tutorName,
          sessions: [],
          history: [],
        });
      }

      courseMap.get(key).sessions.push(session);
    });

    attendanceHistory.forEach((history) => {
      const key = buildCourseKey(history);

      if (!courseMap.has(key)) {
        courseMap.set(key, {
          key,
          courseId: history.courseId,
          courseName: history.courseName,
          tutorName: '-',
          sessions: [],
          history: [],
        });
      }

      courseMap.get(key).history.push(history);
    });

    return Array.from(courseMap.values()).map((course) => {
      const joinedCount =
        course.sessions.filter((item) =>
          ['PRESENT', 'LATE', 'LEFT'].includes(item.attendanceStatus)
        ).length +
        course.history.filter((item) =>
          ['PRESENT', 'LATE', 'LEFT'].includes(item.status)
        ).length;

      const lateCount =
        course.sessions.filter((item) => item.attendanceStatus === 'LATE').length +
        course.history.filter((item) => item.status === 'LATE').length;

      const notJoinedCount = course.sessions.filter(
        (item) =>
          !item.attendanceStatus ||
          item.attendanceStatus === 'NOT_JOINED' ||
          item.attendanceStatus === '-'
      ).length;

      const availableCount = course.sessions.filter(canJoinSession).length;

      const nextSession = [...course.sessions]
        .filter((item) => item.scheduleDate)
        .sort((a, b) => {
          const first = `${a.scheduleDate || ''} ${a.startTime || ''}`;
          const second = `${b.scheduleDate || ''} ${b.startTime || ''}`;
          return first.localeCompare(second);
        })[0];

      return {
        ...course,
        joinedCount,
        lateCount,
        notJoinedCount,
        availableCount,
        totalSessions: course.sessions.length,
        totalHistory: course.history.length,
        nextSession,
      };
    });
  }, [sessions, attendanceHistory]);

  const summary = useMemo(() => {
    return {
      totalCourses: courses.length,
      totalSessions: sessions.length,
      joined:
        sessions.filter((item) =>
          ['PRESENT', 'LATE', 'LEFT'].includes(item.attendanceStatus)
        ).length +
        attendanceHistory.filter((item) =>
          ['PRESENT', 'LATE', 'LEFT'].includes(item.status)
        ).length,
      late:
        sessions.filter((item) => item.attendanceStatus === 'LATE').length +
        attendanceHistory.filter((item) => item.status === 'LATE').length,
    };
  }, [courses, sessions, attendanceHistory]);

  const handleJoinByCode = async (event) => {
    event.preventDefault();

    const code = sessionCode.trim();

    if (!code) {
      showToast('error', 'กรุณากรอกรหัสห้องเรียน');
      return;
    }

    try {
      setJoining(true);
      const result = await joinClassroomByCode(code, sessions);
      showToast('success', 'บันทึกการเข้าเรียนสำเร็จ กำลังพาไปยังห้องเรียน...');
      setSessionCode('');
      await loadData();
      redirectToMeeting(result);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setJoining(false);
    }
  };

  // กดครั้งเดียว: บันทึกเช็คชื่อ + พาไปยังลิงก์ห้องเรียนทันที (ไม่ต้องกดลิงก์แยกอีกปุ่ม)
  const handleJoinSession = async (session) => {
    if (!session.id) {
      showToast('error', 'ไม่พบข้อมูลสำหรับเข้าเรียน');
      return;
    }

    try {
      setJoining(true);
      const result = await joinClassroomSession(session.id, session.joinCode);
      showToast('success', 'บันทึกการเข้าเรียนสำเร็จ กำลังพาไปยังห้องเรียน...');
      await loadData();
      redirectToMeeting(result, session.meetingUrl);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setJoining(false);
    }
  };

  const redirectToMeeting = (joinResult, fallbackUrl) => {
    const url = joinResult?.meetingLink || fallbackUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenMeeting = (meetingUrl) => {
    if (!meetingUrl) return;
    window.open(meetingUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="sap-page">
        <div className="sap-loading-card">
          <div className="sap-spinner" />
          <p>กำลังโหลดข้อมูลการเข้าเรียน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sap-page">
      {toast.msg && (
        <div className={`sap-toast sap-toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      <section className="sap-hero-card">
        <div>
          <p className="sap-hero-eyebrow">Student Attendance</p>
          <h1>การเข้าเรียนของฉัน</h1>
          <p>เลือกคอร์สของคุณ แล้วดูข้อมูลการเข้าเรียนของแต่ละคอร์สได้ทันที</p>
        </div>
      </section>

      {error && (
        <div className="sap-error-box">
          <strong>ไม่สามารถโหลดข้อมูลได้</strong>
          <p>{error}</p>
          <button type="button" onClick={loadData}>
            โหลดใหม่
          </button>
        </div>
      )}

      <section className="sap-summary-grid">
        <div className="sap-summary-card">
          <span>คอร์สของฉัน</span>
          <strong>{summary.totalCourses}</strong>
        </div>

        <div className="sap-summary-card">
          <span>คาบเรียนทั้งหมด</span>
          <strong>{summary.totalSessions}</strong>
        </div>

        <div className="sap-summary-card">
          <span>เข้าเรียนแล้ว</span>
          <strong>{summary.joined}</strong>
        </div>

        <div className="sap-summary-card">
          <span>มาสาย</span>
          <strong>{summary.late}</strong>
        </div>
      </section>

      <section className="sap-code-box">
        <div>
          <h2>เข้าห้องเรียนด้วยรหัส</h2>
          <p>กรอกรหัสห้องเรียน เช่น CLS-00000001 เพื่อบันทึกการเข้าเรียน</p>
        </div>

        <form className="sap-code-form" onSubmit={handleJoinByCode}>
          <input
            type="text"
            value={sessionCode}
            onChange={(event) => setSessionCode(event.target.value)}
            placeholder="กรอกรหัสห้องเรียน"
            disabled={joining}
          />
          <button type="submit" disabled={joining}>
            {joining ? 'กำลังบันทึก...' : 'เข้าเรียน'}
          </button>
        </form>
      </section>

      <section className="sap-course-section">
        <div className="sap-section-heading">
          <div>
            <p>My Courses</p>
            <h2>รายการคอร์สของฉัน</h2>
          </div>
          <button type="button" className="sap-refresh-btn" onClick={loadData}>
            รีเฟรชข้อมูล
          </button>
        </div>

        {courses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="sap-course-grid">
            {courses.map((course) => (
              <article className="sap-course-card" key={course.key}>
                <div className="sap-course-top">
                  <div className="sap-course-icon">
                    {course.courseName?.charAt(0) || 'C'}
                  </div>

                  <div>
                    <h3>{safeValue(course.courseName)}</h3>
                    <p>ติวเตอร์: {safeValue(course.tutorName)}</p>
                  </div>
                </div>

                <div className="sap-course-stats">
                  <div>
                    <span>คาบเรียน</span>
                    <strong>{course.totalSessions}</strong>
                  </div>
                  <div>
                    <span>เข้าแล้ว</span>
                    <strong>{course.joinedCount}</strong>
                  </div>
                  <div>
                    <span>ยังไม่เข้า</span>
                    <strong>{course.notJoinedCount}</strong>
                  </div>
                  <div>
                    <span>มาสาย</span>
                    <strong>{course.lateCount}</strong>
                  </div>
                </div>

                <div className="sap-next-session">
                  <span>คาบเรียนถัดไป</span>
                  {course.nextSession ? (
                    <p>
                      {formatDate(course.nextSession.scheduleDate)} เวลา{' '}
                      {formatTime(course.nextSession.startTime)} -{' '}
                      {formatTime(course.nextSession.endTime)}
                    </p>
                  ) : (
                    <p>-</p>
                  )}
                </div>

                <div className="sap-course-footer">
                  <span
                    className={
                      course.availableCount > 0
                        ? 'sap-course-badge sap-course-badge-open'
                        : 'sap-course-badge'
                    }
                  >
                    {course.availableCount > 0
                      ? `เข้าเรียนได้ ${course.availableCount} ห้อง`
                      : 'ยังไม่มีห้องที่เปิด'}
                  </span>

                  <button
                    type="button"
                    className="sap-btn sap-btn-primary"
                    onClick={() => setSelectedCourse(course)}
                  >
                    ดูข้อมูลการเข้าเรียน
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedCourse && (
        <CourseAttendanceModal
          course={selectedCourse}
          joining={joining}
          onClose={() => setSelectedCourse(null)}
          onJoin={handleJoinSession}
          onOpenMeeting={handleOpenMeeting}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="sap-empty-state">
      <h3>ยังไม่มีข้อมูลการเข้าเรียน</h3>
      <p>เมื่อมีห้องเรียนหรือมีการบันทึกเข้าเรียน รายการจะแสดงที่หน้านี้</p>
    </div>
  );
}

function CourseAttendanceModal({
  course,
  joining,
  onClose,
  onJoin,
  onOpenMeeting,
}) {
  return (
    <div className="sap-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sap-modal sap-course-modal"
        role="dialog"
        aria-modal="true"
        aria-label="ข้อมูลการเข้าเรียนของคอร์ส"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sap-modal-header">
          <div>
            <p>ข้อมูลการเข้าเรียน</p>
            <h2>{safeValue(course.courseName)}</h2>
            <span>ติวเตอร์: {safeValue(course.tutorName)}</span>
          </div>

          <button type="button" onClick={onClose} aria-label="ปิดหน้าต่าง">
            ×
          </button>
        </div>

        <div className="sap-modal-summary">
          <div>
            <span>คาบเรียนทั้งหมด</span>
            <strong>{course.totalSessions}</strong>
          </div>
          <div>
            <span>เข้าเรียนแล้ว</span>
            <strong>{course.joinedCount}</strong>
          </div>
          <div>
            <span>ยังไม่ได้เข้า</span>
            <strong>{course.notJoinedCount}</strong>
          </div>
          <div>
            <span>มาสาย</span>
            <strong>{course.lateCount}</strong>
          </div>
        </div>

        <div className="sap-modal-content">
          <section>
            <div className="sap-modal-section-title">
              <h3>รายการห้องเรียน / คาบเรียน</h3>
              <p>กดเข้าเรียนได้เมื่อห้องเรียนเปิดอยู่</p>
            </div>

            {course.sessions.length === 0 ? (
              <div className="sap-mini-empty">ยังไม่มีห้องเรียนในคอร์สนี้</div>
            ) : (
              <div className="sap-session-list">
                {course.sessions.map((session) => (
                  <article
                    className="sap-session-row"
                    key={session.id || session.sessionCode}
                  >
                    <div className="sap-session-row-main">
                      <div>
                        <h4>{safeValue(session.lessonTitle)}</h4>
                        <p>
                          {formatDate(session.scheduleDate)} |{' '}
                          {formatTime(session.startTime)} -{' '}
                          {formatTime(session.endTime)}
                        </p>
                      </div>

                      <div className="sap-session-code">
                        รหัส: {safeValue(session.sessionCode)}
                      </div>
                    </div>

                    <div className="sap-session-row-info">
                      <span className={`sap-status sap-session-${session.status}`}>
                        {getSessionStatusLabel(session.status)}
                      </span>

                      <span
                        className={`sap-status sap-attendance-${session.attendanceStatus}`}
                      >
                        {getAttendanceStatusLabel(session.attendanceStatus)}
                      </span>
                    </div>

                    <div className="sap-session-detail-grid">
                      <DetailItem label="สถานที่" value={safeValue(session.location)} />
                      <DetailItem
                        label="เวลาเข้าเรียน"
                        value={formatDateTime(session.joinedAt)}
                      />
                      <DetailItem
                        label="เวลาออกจากห้อง"
                        value={formatDateTime(session.leftAt)}
                      />
                      <DetailItem label="หมายเหตุ" value={safeValue(session.note)} />
                    </div>

                    <div className="sap-session-actions">
                      {canJoinSession(session) ? (
                        <button
                          type="button"
                          className="sap-btn sap-btn-primary"
                          disabled={joining}
                          onClick={() => onJoin(session)}
                        >
                          {joining ? 'กำลังบันทึก...' : 'กดเพื่อเข้าเรียน'}
                        </button>
                      ) : (
                        session.meetingUrl && (
                          <button
                            type="button"
                            className="sap-btn sap-btn-outline"
                            onClick={() => onOpenMeeting(session.meetingUrl)}
                          >
                            เปิดลิงก์เรียนออนไลน์อีกครั้ง
                          </button>
                        )
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="sap-modal-section-title">
              <h3>ประวัติการเข้าเรียน</h3>
              <p>รายการบันทึกการเข้าเรียนของคอร์สนี้</p>
            </div>

            {course.history.length === 0 ? (
              <div className="sap-mini-empty">ยังไม่มีประวัติการเข้าเรียน</div>
            ) : (
              <div className="sap-history-list">
                {course.history.map((item) => (
                  <article
                    className="sap-history-card"
                    key={item.id || item.sessionCode}
                  >
                    <div className="sap-history-main">
                      <h3>{safeValue(item.lessonTitle)}</h3>
                      <p>รหัสห้องเรียน: {safeValue(item.sessionCode)}</p>
                    </div>

                    <div className="sap-history-info">
                      <p>
                        <strong>วันที่:</strong> {formatDate(item.scheduleDate)}
                      </p>
                      <p>
                        <strong>เวลา:</strong> {formatTime(item.startTime)} -{' '}
                        {formatTime(item.endTime)}
                      </p>
                      <p>
                        <strong>เข้าเรียน:</strong> {formatDateTime(item.joinedAt)}
                      </p>
                      <p>
                        <strong>ออกจากห้อง:</strong> {formatDateTime(item.leftAt)}
                      </p>
                      <p>
                        <strong>มาสาย:</strong> {item.lateMinutes || 0} นาที
                      </p>
                    </div>

                    <span className={`sap-status sap-attendance-${item.status}`}>
                      {getAttendanceStatusLabel(item.status)}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="sap-detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default StudentAttendancePage;