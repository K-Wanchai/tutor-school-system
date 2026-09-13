import { useEffect, useMemo, useState } from 'react';
import { getMyCourses } from '../services/studentMyCoursesService';
import { getMyClassAttendance } from '../services/studentAttendanceService';
import './StudentAttendancePage.css';

const ACTIVE_ENROLLMENT_STATUSES = new Set(['APPROVED', 'COMPLETED']);

const STATUS_LABEL = {
  PRESENT: 'มาเรียน',
  LATE: 'มาสาย',
  LEAVE: 'ลา',
  ABSENT: 'ขาด',
};

const ATTENDED_STATUSES = new Set(['PRESENT', 'LATE']);

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function attendanceRate(list) {
  if (!list || list.length === 0) return null;
  const attended = list.filter((r) => ATTENDED_STATUSES.has(r.status)).length;
  return Math.round((attended / list.length) * 100);
}

export default function StudentAttendancePage() {
  const [courses, setCourses] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getMyCourses(), getMyClassAttendance()])
      .then(([courseList, recordList]) => {
        if (!active) return;
        const activeCourses = (Array.isArray(courseList) ? courseList : [])
          .filter((c) => ACTIVE_ENROLLMENT_STATUSES.has(c.status));
        setCourses(activeCourses);
        setRecords(Array.isArray(recordList) ? recordList : []);
        setSelectedCourseId((prev) => prev ?? activeCourses[0]?.courseId ?? null);
        setError('');
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const recordsByCourse = useMemo(() => {
    const map = new Map();
    records.forEach((r) => {
      const key = String(r.courseId);
      const list = map.get(key) || [];
      list.push(r);
      map.set(key, list);
    });
    for (const list of map.values()) {
      list.sort((a, b) => String(a.sessionDate).localeCompare(String(b.sessionDate)));
    }
    return map;
  }, [records]);

  const selectedRecords = recordsByCourse.get(String(selectedCourseId)) || [];
  const selectedCourse = courses.find((c) => String(c.courseId) === String(selectedCourseId));

  return (
    <div className="saa-page">
      <div className="saa-header">
        <h1>การเข้าเรียน</h1>
        <p>ประวัติการเช็คชื่อของคุณในแต่ละคอร์ส (ดูได้อย่างเดียว)</p>
      </div>

      {error && (
        <div className="saa-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="saa-empty">กำลังโหลดข้อมูล...</div>
      ) : courses.length === 0 ? (
        <div className="saa-empty">คุณยังไม่มีคอร์สที่ลงทะเบียนอนุมัติแล้ว</div>
      ) : (
        <div className="saa-layout">
          <div className="saa-course-list">
            {courses.map((c) => {
              const list = recordsByCourse.get(String(c.courseId)) || [];
              const rate = attendanceRate(list);
              return (
                <button
                  key={c.courseId}
                  type="button"
                  className={`saa-course-item${String(c.courseId) === String(selectedCourseId) ? ' saa-course-item-active' : ''}`}
                  onClick={() => setSelectedCourseId(c.courseId)}
                >
                  <span className="saa-course-name">{c.courseName || 'ไม่ระบุชื่อคอร์ส'}</span>
                  <span className="saa-course-code">{c.courseCode || '-'}</span>
                  <span className="saa-course-rate">
                    {rate != null ? `เข้าเรียน ${rate}%` : 'ยังไม่มีการเช็คชื่อ'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="saa-detail">
            {selectedRecords.length === 0 ? (
              <div className="saa-empty">
                {selectedCourse
                  ? `ยังไม่มีการเช็คชื่อสำหรับคอร์ส "${selectedCourse.courseName}"`
                  : 'เลือกคอร์สเพื่อดูประวัติการเข้าเรียน'}
              </div>
            ) : (
              <>
                <div className="saa-detail-header">
                  <h2>{selectedCourse?.courseName || 'ประวัติการเข้าเรียน'}</h2>
                  <span className="saa-detail-rate">
                    อัตราเข้าเรียนรวม: {attendanceRate(selectedRecords)}%
                  </span>
                </div>
                <div className="saa-table-wrap">
                  <table className="saa-table">
                    <thead>
                      <tr>
                        <th>วันที่</th>
                        <th>สถานะ</th>
                        <th>หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecords.map((r) => (
                        <tr key={`${r.sessionDate}-${r.id}`}>
                          <td>{formatDate(r.sessionDate)}</td>
                          <td>
                            <span className={`saa-status saa-status-${(r.status || '').toLowerCase()}`}>
                              {STATUS_LABEL[r.status] || r.status || '-'}
                            </span>
                          </td>
                          <td>{r.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
