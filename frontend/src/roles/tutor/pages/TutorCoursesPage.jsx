import { useEffect, useMemo, useState } from 'react';
import { getTutorCourses } from '../services/tutorDashboardService';
import './TutorCoursesPage.css';

export default function TutorCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      setLoading(true);
      const data = await getTutorCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Load tutor courses error:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const text = `${course.courseName || ''} ${course.courseCode || ''}`.toLowerCase();
      const matchKeyword = text.includes(keyword.toLowerCase());
      const matchStatus = status === 'ALL' || course.status === status;
      return matchKeyword && matchStatus;
    });
  }, [courses, keyword, status]);

  return (
    <div className="tutor-courses-page">
      <div className="tutor-courses-header">
        <div>
          <h1>คอร์สของฉัน</h1>
          <p>แสดงคอร์สเรียนที่ติวเตอร์รับผิดชอบจากฐานข้อมูลจริง</p>
        </div>

        <button className="tutor-courses-refresh-btn" onClick={loadCourses}>
          รีเฟรชข้อมูล
        </button>
      </div>

      <div className="tutor-courses-toolbar">
        <input
          type="text"
          placeholder="ค้นหาชื่อคอร์สหรือรหัสคอร์ส..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">ทุกสถานะ</option>
          <option value="OPEN">OPEN</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="OPEN_FOR_REGISTRATION">OPEN_FOR_REGISTRATION</option>
          <option value="CLOSED">CLOSED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {loading ? (
        <div className="tutor-courses-loading">กำลังโหลดข้อมูลคอร์ส...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="tutor-courses-empty">
          <h2>ยังไม่มีคอร์สเรียน</h2>
          <p>ถ้ามีข้อมูลในฐานข้อมูลแล้ว กรุณาตรวจสอบ tutorId และ API /courses/tutor/{'{tutorId}'}</p>
        </div>
      ) : (
        <div className="tutor-courses-grid">
          {filteredCourses.map((course) => (
            <div className="tutor-course-card" key={course.id}>
              <div className="tutor-course-card-top">
                <span className="tutor-course-code">{course.courseCode || '-'}</span>
                <span className="tutor-course-status">{course.status || 'UNKNOWN'}</span>
              </div>

              <h2>{course.courseName || 'ไม่ระบุชื่อคอร์ส'}</h2>

              <p className="tutor-course-description">
                {course.description || 'ไม่มีรายละเอียดคอร์ส'}
              </p>

              <div className="tutor-course-info">
                <div>
                  <span>ราคา</span>
                  <strong>{Number(course.price || 0).toLocaleString()} บาท</strong>
                </div>

                <div>
                  <span>จำนวนที่นั่ง</span>
                  <strong>{course.maxSeats || 0} คน</strong>
                </div>

                <div>
                  <span>วันที่เริ่ม</span>
                  <strong>{course.startDate || '-'}</strong>
                </div>
              </div>

              <div className="tutor-course-actions">
                <button>ดูรายละเอียด</button>
                <button className="secondary">ตารางสอน</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}