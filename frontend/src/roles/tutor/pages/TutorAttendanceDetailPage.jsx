import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getCourseSessions,
  getSessionAttendance,
  getTutorCourses,
} from '../services/tutorAttendanceScoreService';
import RefreshButton from '../components/RefreshButton';
import './TutorAttendanceDetailPage.css';

export default function TutorAttendanceDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function loadDetail() {
    try {
      setLoading(true);

      const [coursesData, sessionsData] = await Promise.all([
        getTutorCourses(),
        getCourseSessions(courseId).catch(() => []),
      ]);

      const currentCourse = coursesData.find(
        (item) => String(item.id) === String(courseId)
      );
      setCourse(currentCourse || null);

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
      console.error('Load attendance detail error:', error);
    } finally {
      setLoading(false);
    }
  }

  const studentRows = useMemo(() => {
    const map = new Map();

    attendanceRows.forEach((item) => {
      const key = item.studentId || item.studentName;
      if (!map.has(key)) {
        map.set(key, {
          studentId: item.studentId,
          studentName: item.studentName || item.fullName || '-',
          present: 0,
          absent: 0,
          leave: 0,
          late: 0,
          total: 0,
        });
      }

      const row = map.get(key);
      row.total += 1;

      const status = item.attendanceStatus || item.status;
      if (status === 'PRESENT') row.present += 1;
      else if (status === 'ABSENT') row.absent += 1;
      else if (status === 'LEAVE') row.leave += 1;
      else if (status === 'LATE') row.late += 1;
    });

    return Array.from(map.values()).sort((a, b) =>
      (a.studentName || '').localeCompare(b.studentName || '', 'th')
    );
  }, [attendanceRows]);

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
      <button className="tas-back-btn" onClick={() => navigate('/tutor/attendance')}>
        ← กลับ
      </button>

      <section className="tas-detail-hero">
        <div className="tas-course-icon">{(course?.courseName || 'C').charAt(0)}</div>

        <div className="tas-course-main">
          <span>{course?.courseCode || '-'}</span>
          <h1>{course?.courseName || 'รายละเอียดคอร์ส'}</h1>
          <p>ตารางสรุปการเข้าเรียนของนักเรียนในคอร์สนี้</p>
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
                <h2>การเข้าเรียนรายคน</h2>
                <p>รวมทุกคาบเรียนที่เช็กชื่อแล้วของคอร์สนี้</p>
              </div>
              <RefreshButton onClick={loadDetail} loading={loading} />
            </div>

            {studentRows.length === 0 ? (
              <div className="tas-detail-empty">ยังไม่มีข้อมูลการเข้าเรียน</div>
            ) : (
              <AttendanceTable studentRows={studentRows} />
            )}
          </section>
        </>
      )}
    </div>
  );
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

function StatusPill({ rate }) {
  if (rate >= 80) return <span className="tas-status-pill good">ปกติ</span>;
  if (rate >= 60) return <span className="tas-status-pill warning">เฝ้าระวัง</span>;
  return <span className="tas-status-pill danger">เสี่ยง</span>;
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
