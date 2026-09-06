import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTutorCourses } from '../services/tutorAttendanceScoreService';
import './TutorAttendancePage.css';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TutorAttendancePage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [keyword, setKeyword] = useState('');
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
      console.error(error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const text = `${course.courseName || ''} ${course.courseCode || ''}`.toLowerCase();
      return text.includes(keyword.toLowerCase());
    });
  }, [courses, keyword]);

  return (
    <div className="tas-page">
      <div className="tas-header">
        <div>
          <h1>การเข้าเรียน</h1>
          <p>เลือกคอร์สเพื่อดูตารางการขาด ลา มาสาย และอัตราการเข้าเรียนของนักเรียน</p>
        </div>

        
      </div>

      <div className="tas-toolbar">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="ค้นหารหัสคอร์สหรือชื่อคอร์ส..."
        />
      </div>

      {loading ? (
        <div className="tas-empty">กำลังโหลดข้อมูล...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="tas-empty">ยังไม่มีคอร์สเรียน</div>
      ) : (
        <div className="tas-course-grid">
          {filteredCourses.map((course) => (
            <div className="tas-course-card" key={course.id}>
              <div className="tas-course-top">
                <span>{course.courseCode || '-'}</span>
                <b>{course.status || 'UNKNOWN'}</b>
              </div>

              <h2>{course.courseName || 'ไม่ระบุชื่อคอร์ส'}</h2>
              <p>{course.description || 'ไม่มีรายละเอียดคอร์ส'}</p>

              <div className="tas-course-meta">
                <div>
                  <span>ราคา</span>
                  <strong>{Number(course.price || 0).toLocaleString()} บาท</strong>
                </div>

                <div>
                  <span>ที่นั่ง</span>
                  <strong>{course.maxSeats || 0} คน</strong>
                </div>

                <div>
                  <span>เริ่มเรียน</span>
                  <strong>{formatDate(course.startDate)}</strong>
                </div>
              </div>

              <button
                className="tas-detail-btn"
                onClick={() => navigate(`/tutor/attendance/${course.id}`)}
              >
                ดูการเข้าเรียน
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}