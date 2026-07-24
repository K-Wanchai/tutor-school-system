import { useEffect, useMemo, useState } from 'react';
import {
  closeClassroomSession,
  getClassroomSessions,
  openClassroomSession,
} from '../services/tutorClassroomService';
import { getMyCourses } from '../services/tutorCourseService';
import TestEditorModal from '../components/TestEditorModal';
import './TutorClassroomsPage.css';

export default function TutorClassroomsPage() {
  const [courses, setCourses] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('ALL');
  const [editingTest, setEditingTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openingSession, setOpeningSession] = useState(null);
  const [meetingLinkInput, setMeetingLinkInput] = useState('');
  const [openError, setOpenError] = useState('');
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    loadClassroomPage();
  }, []);

  async function loadClassroomPage() {
    try {
      setLoading(true);

      const [sessionData, courseData] = await Promise.all([
        getClassroomSessions(),
        getMyCourses(),
      ]);

      const sessions = Array.isArray(sessionData) ? sessionData : [];
      const courseList = Array.isArray(courseData) ? courseData : [];

      const merged = courseList.map((course) => {
        const courseSessions = sessions.filter(
          (session) => String(session.courseId) === String(course.id)
        );

        return {
          ...course,
          sessions: courseSessions,
          lessons: course.lessons || [],
          tests: course.tests || [],
        };
      });

      setCourses(merged);
    } catch (error) {
      console.error('Load classroom page error:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }

  function startOpenSession(session) {
    setOpeningSession(session);
    setMeetingLinkInput('');
    setOpenError('');
  }

  async function confirmOpenSession(e) {
    e.preventDefault();
    if (!meetingLinkInput.trim()) {
      setOpenError('กรุณาใส่ลิงก์ห้องเรียน (Zoom / Google Meet ฯลฯ) ก่อนเปิดห้อง');
      return;
    }
    setOpening(true);
    setOpenError('');
    try {
      await openClassroomSession(openingSession.id, meetingLinkInput.trim());
      setOpeningSession(null);
      await loadClassroomPage();
    } catch (error) {
      setOpenError(error.response?.data?.message || 'เปิดห้องเรียนไม่สำเร็จ');
      console.error(error);
    } finally {
      setOpening(false);
    }
  }

  async function handleClose(sessionId) {
    try {
      await closeClassroomSession(sessionId);
      await loadClassroomPage();
    } catch (error) {
      alert('ปิดห้องเรียนไม่สำเร็จ');
      console.error(error);
    }
  }

  function handleOpenTestEditor(test, course, lesson) {
    setEditingTest({
      ...test,
      courseId: course.id,
      courseName: course.courseName,
      courseCode: course.courseCode,
      lessonTitle: lesson?.lessonTitle,
      lessonOrder: test.lessonOrder || lesson?.lessonOrder,
    });
  }

  function handleCloseTestEditor() {
    setEditingTest(null);
    loadClassroomPage();
  }

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const text = `
        ${course.courseCode || ''}
        ${course.courseName || ''}
        ${course.status || ''}
        ${(course.tests || []).map((t) => t.testTitle).join(' ')}
      `.toLowerCase();

      const matchKeyword = text.includes(keyword.toLowerCase());
      const matchStatus = status === 'ALL' || course.status === status;

      return matchKeyword && matchStatus;
    });
  }, [courses, keyword, status]);

  const summary = useMemo(() => {
    const allSessions = courses.flatMap((course) => course.sessions || []);
    const allTests = courses.flatMap((course) => course.tests || []);

    return {
      courses: courses.length,
      sessions: allSessions.length,
      openSessions: allSessions.filter((s) =>
        ['OPEN', 'ACTIVE', 'IN_PROGRESS'].includes(s.status)
      ).length,
      tests: allTests.length,
    };
  }, [courses]);

  return (
    <div className="tutor-classroom-page">
      <div className="tutor-classroom-header">
        <div>
          <span className="tutor-classroom-kicker">COURSE CLASSROOM PLAN</span>
          <h1>ห้องเรียนและรอบการสอบ</h1>
          <p>แสดงห้องเรียน บทเรียน และแบบทดสอบที่กำหนดไว้ในแต่ละคอร์ส</p>
        </div>

        <button onClick={loadClassroomPage}>รีเฟรชข้อมูล</button>
      </div>

      <div className="tutor-classroom-summary">
        <SummaryCard title="คอร์สทั้งหมด" value={summary.courses} unit="คอร์ส" />
        <SummaryCard title="ห้องเรียนทั้งหมด" value={summary.sessions} unit="ห้อง" />
        <SummaryCard title="ห้องเรียนเปิดอยู่" value={summary.openSessions} unit="ห้อง" />
        <SummaryCard title="รอบสอบ/แบบทดสอบ" value={summary.tests} unit="รอบ" />
      </div>

      <div className="tutor-classroom-toolbar">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="ค้นหาชื่อคอร์ส รหัสคอร์ส หรือชื่อแบบทดสอบ..."
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">ทุกสถานะ</option>
          <option value="OPEN_FOR_REGISTRATION">เปิดรับสมัคร</option>
          <option value="CLOSED">ปิดรับสมัคร</option>
          <option value="ONGOING">กำลังเรียน</option>
          <option value="COMPLETED">สอนจบแล้ว</option>
        </select>
      </div>

      {loading ? (
        <div className="tutor-classroom-empty">กำลังโหลดข้อมูล...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="tutor-classroom-empty">
          <h2>ยังไม่มีข้อมูลห้องเรียน</h2>
          <p>ถ้ามีคอร์สแล้ว ให้ตรวจสอบ API getMyCourses และ /classroom-sessions</p>
        </div>
      ) : (
        <div className="tutor-classroom-course-list">
          {filteredCourses.map((course) => (
            <article className="tutor-classroom-course-card" key={course.id}>
              <div className="tutor-classroom-course-left">
                <div className="tutor-classroom-course-icon">
                  {(course.courseName || 'C').charAt(0)}
                </div>

                <div>
                  <div className="tutor-classroom-course-top">
                    <span>{course.courseCode || '-'}</span>
                    <StatusBadge status={course.status} />
                  </div>

                  <h2>{course.courseName || 'ไม่ระบุชื่อคอร์ส'}</h2>
                  <p>{course.description || 'ไม่มีรายละเอียดคอร์ส'}</p>

                  <div className="tutor-classroom-course-meta">
                    <Info label="วันเริ่มสอน" value={course.courseStartDate || course.startDate || '-'} />
                    <Info label="ที่นั่ง" value={`${course.seatLimit || course.maxSeats || 0} คน`} />
                    <Info label="ชั่วโมงรวม" value={`${course.totalHours || 0} ชม.`} />
                    <Info label="ผู้สมัคร" value={`${course.enrolledCount || 0} คน`} />
                  </div>
                </div>
              </div>

              <div className="tutor-classroom-course-right">
                <section className="tutor-classroom-section">
                  <div className="tutor-classroom-section-head">
                    <h3>ห้องเรียน</h3>
                    <span>{course.sessions?.length || 0} ห้อง</span>
                  </div>

                  {course.sessions?.length === 0 ? (
                    <div className="tutor-classroom-mini-empty">ยังไม่มีห้องเรียน</div>
                  ) : (
                    <div className="tutor-classroom-session-list">
                      {course.sessions.map((session) => (
                        <div className="tutor-classroom-session" key={session.id}>
                          <div>
                            <strong>{session.sessionCode || `SESSION-${session.id}`}</strong>
                            <p>
                              {session.scheduleDate || '-'} · {session.startTime || '-'} - {session.endTime || '-'}
                            </p>
                          </div>

                          <StatusBadge status={session.status} />

                          <div className="tutor-classroom-session-actions">
                            <button
                              className="open"
                              disabled={['OPEN', 'ACTIVE', 'IN_PROGRESS'].includes(session.status)}
                              onClick={() => startOpenSession(session)}
                            >
                              เปิด
                            </button>

                            <button
                              className="close"
                              disabled={['CLOSED', 'COMPLETED', 'CANCELLED'].includes(session.status)}
                              onClick={() => handleClose(session.id)}
                            >
                              ปิด
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="tutor-classroom-section">
                  <div className="tutor-classroom-section-head">
                    <h3>บทเรียนและรอบสอบ</h3>
                    <span>{course.tests?.length || 0} รอบ</span>
                  </div>

                  {course.lessons?.length === 0 && course.tests?.length === 0 ? (
                    <div className="tutor-classroom-mini-empty">ยังไม่มีบทเรียนหรือแบบทดสอบ</div>
                  ) : (
                    <div className="tutor-classroom-exam-timeline">
                      {(course.lessons || []).map((lesson) => {
                        const lessonTests = (course.tests || []).filter(
                          (test) => String(test.lessonOrder) === String(lesson.lessonOrder)
                        );

                        return (
                          <div className="tutor-classroom-lesson-block" key={lesson.id || lesson.lessonOrder}>
                            <div className="tutor-classroom-lesson-title">
                              <span>บทที่ {lesson.lessonOrder}</span>
                              <strong>{lesson.lessonTitle}</strong>
                            </div>

                            {lessonTests.length === 0 ? (
                              <div className="tutor-classroom-test-empty">ไม่มีแบบทดสอบในบทนี้</div>
                            ) : (
                              <div className="tutor-classroom-test-list">
                                {lessonTests.map((test, index) => (
                                  <button
                                    type="button"
                                    className="tutor-classroom-test-card"
                                    key={test.id || index}
                                    onClick={() => handleOpenTestEditor(test, course, lesson)}
                                  >
                                    <span>รอบที่ {index + 1}</span>
                                    <strong>{test.testTitle}</strong>
                                    <p>{test.testDescription || 'ไม่มีคำอธิบาย'}</p>
                                    <small>คลิกเพื่อแก้ไขข้อสอบ</small>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {course.lessons?.length === 0 &&
                        (course.tests || []).map((test, index) => (
                          <button
                            type="button"
                            className="tutor-classroom-test-card"
                            key={test.id || index}
                            onClick={() => handleOpenTestEditor(test, course, null)}
                          >
                            <span>รอบที่ {index + 1}</span>
                            <strong>{test.testTitle}</strong>
                            <p>{test.testDescription || 'ไม่มีคำอธิบาย'}</p>
                            <small>คลิกเพื่อแก้ไขข้อสอบ</small>
                          </button>
                        ))}
                    </div>
                  )}
                </section>
              </div>
            </article>
          ))}
        </div>
      )}

      {editingTest && (
        <TestEditorModal
          test={editingTest}
          onClose={handleCloseTestEditor}
        />
      )}

      {openingSession && (
        <div className="tutor-classroom-modal-backdrop" onClick={() => setOpeningSession(null)}>
          <div className="tutor-classroom-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tutor-classroom-modal-header">
              <h2>เปิดห้องเรียน — {openingSession.sessionCode || `SESSION-${openingSession.id}`}</h2>
              <button type="button" onClick={() => setOpeningSession(null)}>✕</button>
            </div>

            <form className="tutor-classroom-modal-form" onSubmit={confirmOpenSession}>
              <label>
                ลิงก์ห้องเรียน (Zoom / Google Meet ฯลฯ) *
                <input
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  value={meetingLinkInput}
                  onChange={(e) => setMeetingLinkInput(e.target.value)}
                  autoFocus
                />
              </label>
              <p className="tutor-classroom-modal-hint">
                นักเรียนจะเห็นปุ่ม "กดเพื่อเข้าเรียน" ทันทีที่ยืนยันเปิดห้อง กดแล้วจะบันทึกเช็คชื่อและพาไปยังลิงก์นี้โดยตรง
              </p>

              {openError && <div className="tutor-classroom-modal-error">{openError}</div>}

              <div className="tutor-classroom-modal-actions">
                <button type="button" onClick={() => setOpeningSession(null)}>ยกเลิก</button>
                <button type="submit" className="primary" disabled={opening}>
                  {opening ? 'กำลังเปิด...' : 'ยืนยันเปิดห้องเรียน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, unit }) {
  return (
    <div className="tutor-classroom-summary-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{unit}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="tutor-classroom-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`tutor-classroom-status ${String(status || 'unknown').toLowerCase()}`}>
      {status || 'UNKNOWN'}
    </span>
  );
}