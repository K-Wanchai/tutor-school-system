import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getCourseExamResults,
  getCourseSessions,
  getSessionAttendance,
  getTutorCourses,
} from '../services/tutorAttendanceScoreService';
import './TutorAttendanceScoreDetailPage.css';

export default function TutorAttendanceScoreDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [courseTests, setCourseTests] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [activeTab, setActiveTab] = useState('attendance');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, [courseId]);

  async function loadDetail() {
    try {
      setLoading(true);

      const [coursesData, sessionsData, resultsData] = await Promise.all([
        getTutorCourses(),
        getCourseSessions(courseId).catch(() => []),
        getCourseExamResults(courseId).catch(() => []),
      ]);

      const currentCourse = coursesData.find(
        (item) => String(item.id) === String(courseId)
      );

      const testsFromCourse = currentCourse?.tests || [];

      setCourse(currentCourse || null);
      setCourseTests(testsFromCourse);
      setExamResults(Array.isArray(resultsData) ? resultsData : []);

      const attendanceList = [];

      for (const session of sessionsData) {
        try {
          const records = await getSessionAttendance(session.id);

          records.forEach((record) => {
            attendanceList.push({
              ...record,
              sessionId: session.id,
              sessionDate: session.scheduleDate,
              courseName: session.courseName || currentCourse?.courseName,
            });
          });
        } catch {
          // skip session error
        }
      }

      setAttendanceRows(attendanceList);
    } catch (error) {
      console.error('Load attendance score detail error:', error);
    } finally {
      setLoading(false);
    }
  }

  const studentRows = useMemo(() => {
    const map = new Map();

    attendanceRows.forEach((item) => {
      const key = item.studentId || item.studentName;

      if (!map.has(key)) {
        map.set(key, createStudentRow(item));
      }

      const row = map.get(key);
      row.total += 1;

      const status = item.attendanceStatus || item.status;

      if (status === 'PRESENT') row.present += 1;
      else if (status === 'ABSENT') row.absent += 1;
      else if (status === 'LEAVE') row.leave += 1;
      else if (status === 'LATE') row.late += 1;
    });

    examResults.forEach((result) => {
      const key = result.studentId || result.studentName;

      if (!map.has(key)) {
        map.set(key, createStudentRow(result));
      }

      const row = map.get(key);

      const testId =
        result.testId ||
        result.courseTestId ||
        result.examId ||
        result.exam?.id ||
        result.test?.id ||
        result.id;

      row.exams[testId] =
        result.score ??
        result.totalScore ??
        result.obtainedScore ??
        result.point ??
        '-';
    });

    return Array.from(map.values());
  }, [attendanceRows, examResults]);

  const summary = useMemo(() => {
    const totalPresent = studentRows.reduce((sum, row) => sum + row.present, 0);
    const totalAbsent = studentRows.reduce((sum, row) => sum + row.absent, 0);
    const totalLeave = studentRows.reduce((sum, row) => sum + row.leave, 0);
    const totalLate = studentRows.reduce((sum, row) => sum + row.late, 0);
    const total = totalPresent + totalAbsent + totalLeave + totalLate;

    return {
      students: studentRows.length,
      present: totalPresent,
      absent: totalAbsent,
      leave: totalLeave,
      late: totalLate,
      rate: total > 0 ? ((totalPresent / total) * 100).toFixed(2) : '0.00',
    };
  }, [studentRows]);

  return (
    <div className="tas-detail-page">
      <button className="tas-back-btn" onClick={() => navigate('/tutor/attendance-scores')}>
        ← กลับ
      </button>

      <section className="tas-detail-hero">
        <div className="tas-course-icon">
          {(course?.courseName || 'C').charAt(0)}
        </div>

        <div className="tas-course-main">
          <span>{course?.courseCode || '-'}</span>
          <h1>{course?.courseName || 'รายละเอียดคอร์ส'}</h1>

          <div className="tas-course-grade">
            ชั้นเรียน: {course?.gradeLevel || course?.level || course?.classLevel || course?.grade || '-'}
          </div>

          <p>ตารางสรุปการเข้าเรียนและคะแนนสอบของนักเรียนในคอร์สนี้</p>
        </div>

        <div className="tas-rate-box">
          <span>อัตราการเข้าเรียนเฉลี่ย</span>
          <strong>{summary.rate}%</strong>
        </div>
      </section>

      {loading ? (
        <div className="tas-detail-empty">กำลังโหลดข้อมูล...</div>
      ) : (
        <>
          <div className="tas-detail-summary">
            <SummaryCard title="นักเรียนทั้งหมด" value={summary.students} unit="คน" />
            <SummaryCard title="เข้าเรียน" value={summary.present} unit="ครั้ง" />
            <SummaryCard title="ขาดเรียน" value={summary.absent} unit="ครั้ง" />
            <SummaryCard title="ลาเรียน" value={summary.leave} unit="ครั้ง" />
            <SummaryCard title="มาสาย" value={summary.late} unit="ครั้ง" />
          </div>

          <section className="tas-table-card">
            <div className="tas-table-head">
              <div>
                <h2>การเข้าเรียน / คะแนนสอบ</h2>
                <p>คะแนนสอบเชื่อมจากแบบทดสอบที่กำหนดตอนเปิดคอร์สเรียน</p>
              </div>

              <button onClick={loadDetail}>รีเฟรช</button>
            </div>

            <div className="tas-mode-switch">
              <button
                className={activeTab === 'attendance' ? 'active' : ''}
                onClick={() => setActiveTab('attendance')}
              >
                การเข้าเรียน
              </button>

              <button
                className={activeTab === 'score' ? 'active' : ''}
                onClick={() => setActiveTab('score')}
              >
                คะแนนสอบ
              </button>
            </div>

            {studentRows.length === 0 ? (
              <div className="tas-detail-empty">
                ยังไม่มีข้อมูลการเข้าเรียนหรือคะแนนสอบ
              </div>
            ) : activeTab === 'attendance' ? (
              <AttendanceTable studentRows={studentRows} />
            ) : (
              <ScoreTable studentRows={studentRows} courseTests={courseTests} />
            )}
          </section>
        </>
      )}
    </div>
  );
}

function createStudentRow(item) {
  return {
    studentId: item.studentId,
    studentName: item.studentName || item.fullName || '-',
    present: 0,
    absent: 0,
    leave: 0,
    late: 0,
    total: 0,
    exams: {},
  };
}

function AttendanceTable({ studentRows }) {
  return (
    <div className="tas-table-wrap">
      <table className="tas-score-table">
        <thead>
          <tr>
            <th>#</th>
            <th>ชื่อนักเรียน</th>
            <th>เข้าเรียน</th>
            <th>ขาดเรียน</th>
            <th>ลาเรียน</th>
            <th>มาสาย</th>
            <th>อัตราเข้าเรียน</th>
            <th>สถานะ</th>
          </tr>
        </thead>

        <tbody>
          {studentRows.map((row, index) => {
            const attendRate =
              row.total > 0 ? ((row.present / row.total) * 100).toFixed(2) : '0.00';

            return (
              <tr key={row.studentId || row.studentName}>
                <td>{index + 1}</td>
                <td>
                  <strong>{row.studentName}</strong>
                  <span>{row.studentId ? `รหัส ${row.studentId}` : ''}</span>
                </td>
                <td className="present">{row.present}</td>
                <td className="absent">{row.absent}</td>
                <td className="leave">{row.leave}</td>
                <td className="late">{row.late}</td>
                <td>
                  <b>{attendRate}%</b>
                </td>
                <td>
                  <StatusPill rate={Number(attendRate)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ScoreTable({ studentRows, courseTests }) {
  return (
    <div className="tas-table-wrap">
      <table className="tas-score-table">
        <thead>
          <tr>
            <th>#</th>
            <th>ชื่อนักเรียน</th>
            {courseTests.map((test, index) => (
              <th key={test.id || index}>
                {test.testTitle || test.title || `สอบรอบที่ ${index + 1}`}
                <small>{test.testDescription || ''}</small>
              </th>
            ))}
            <th>รวมคะแนน</th>
            <th>เกรด</th>
          </tr>
        </thead>

        <tbody>
          {studentRows.map((row, index) => {
            const totalScore = courseTests.reduce((sum, test) => {
              const score = Number(row.exams[test.id] || 0);
              return sum + score;
            }, 0);

            return (
              <tr key={row.studentId || row.studentName}>
                <td>{index + 1}</td>
                <td>
                  <strong>{row.studentName}</strong>
                  <span>{row.studentId ? `รหัส ${row.studentId}` : ''}</span>
                </td>

                {courseTests.map((test, testIndex) => (
                  <td key={test.id || testIndex}>
                    {row.exams[test.id] ?? '-'}
                  </td>
                ))}

                <td>
                  <strong className="total-score">{totalScore}</strong>
                </td>

                <td>
                  <GradeBadge score={totalScore} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ rate }) {
  if (rate >= 80) return <span className="tas-status-pill good">ปกติ</span>;
  if (rate >= 60) return <span className="tas-status-pill warning">เฝ้าระวัง</span>;
  return <span className="tas-status-pill danger">เสี่ยง</span>;
}

function GradeBadge({ score }) {
  let grade = 'F';
  let cls = 'danger';

  if (score >= 80) {
    grade = 'A';
    cls = 'good';
  } else if (score >= 70) {
    grade = 'B';
    cls = 'normal';
  } else if (score >= 60) {
    grade = 'C';
    cls = 'warning';
  } else if (score >= 50) {
    grade = 'D';
    cls = 'orange';
  }

  return <span className={`tas-grade-badge ${cls}`}>{grade}</span>;
}

function SummaryCard({ title, value, unit }) {
  return (
    <div className="tas-summary-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{unit}</p>
    </div>
  );
}