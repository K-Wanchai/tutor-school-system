import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCourses } from '../services/tutorCourseService';
import RefreshButton from '../components/RefreshButton';
import './TutorAttendancePage.css';

const COURSE_STATUS_LABEL = {
  PENDING: 'รอเปิดรับสมัคร',
  OPEN_FOR_REGISTRATION: 'เปิดรับสมัคร',
  CLOSED: 'ปิดรับสมัคร',
  ONGOING: 'กำลังเรียน',
  COMPLETED: 'สอนจบแล้ว',
  CANCELLED: 'ยกเลิก',
};

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TutorAttendancePage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMyCourses()
      .then((data) => {
        if (!active) return;
        setCourses(Array.isArray(data) ? data : []);
        setError('');
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return courses;
    return courses.filter((c) =>
      `${c.courseName || ''} ${c.courseCode || ''}`.toLowerCase().includes(kw)
    );
  }, [courses, keyword]);

  return (
    <div className="tan-page">
      <div className="tan-header">
        <div>
          <h1>การเข้าเรียน</h1>
          <p>เลือกคอร์สเพื่อเข้าไปบันทึกและดูการเข้าเรียนของนักเรียนในแต่ละคาบ</p>
        </div>
        <RefreshButton onClick={() => setReloadKey((k) => k + 1)} loading={loading} />
      </div>

      <div className="tan-toolbar">
        <input
          type="text"
          placeholder="ค้นหาชื่อคอร์ส หรือรหัสคอร์ส..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {error && (
        <div className="tan-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="tan-empty">กำลังโหลดคอร์ส...</div>
      ) : filtered.length === 0 ? (
        <div className="tan-empty">ยังไม่มีคอร์สที่รับผิดชอบ</div>
      ) : (
        <div className="tan-grid">
          {filtered.map((course) => (
            <button
              key={course.id}
              type="button"
              className="tan-card"
              onClick={() => navigate(`/tutor/attendance/${course.id}`)}
            >
              <div className="tan-card-top">
                <span className="tan-code">{course.courseCode || '-'}</span>
                <span className="tan-status">{COURSE_STATUS_LABEL[course.status] || course.status || '-'}</span>
              </div>

              <h2 className="tan-card-title">{course.courseName || 'ไม่ระบุชื่อคอร์ส'}</h2>
              <p className="tan-card-desc">{course.description || 'ไม่มีรายละเอียดคอร์ส'}</p>

              <div className="tan-card-info">
                <div>
                  <span>ผู้สอน</span>
                  <strong>{course.teacherName || '-'}</strong>
                </div>
                <div>
                  <span>จำนวนนักเรียน</span>
                  <strong>{course.enrolledCount || 0}/{course.seatLimit || 0} คน</strong>
                </div>
                <div>
                  <span>เริ่มเรียน</span>
                  <strong>{formatDate(course.courseStartDate)}</strong>
                </div>
              </div>

              <span className="tan-card-cta">บันทึกการเข้าเรียน →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
