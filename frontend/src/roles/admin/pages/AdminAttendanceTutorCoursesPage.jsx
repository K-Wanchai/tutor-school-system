import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTutorById } from '../services/adminTutorService';
import { getCoursesByTutorId } from '../services/adminExamService';
import './AdminExamPages.css';

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

export default function AdminAttendanceTutorCoursesPage() {
  const { tutorId } = useParams();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      getTutorById(tutorId).catch(() => null),
      getCoursesByTutorId(tutorId),
    ])
      .then(([t, list]) => {
        if (!active) return;
        setTutor(t);
        setCourses(Array.isArray(list) ? list : []);
        setError('');
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tutorId]);

  const tutorName = tutor
    ? (tutor.fullName || `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim())
    : (courses[0]?.teacherName || '');

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return courses;
    return courses.filter((c) =>
      `${c.courseName || ''} ${c.courseCode || ''}`.toLowerCase().includes(kw)
    );
  }, [courses, keyword]);

  return (
    <div className="aes-page">
      <button type="button" className="aes-back" onClick={() => navigate('/admin/attendance')}>
        ← กลับไปหน้ารายชื่อติวเตอร์
      </button>

      <div className="aes-header">
        <div>
          <h1>การเข้าเรียน · {tutorName || 'ติวเตอร์'}</h1>
          <p>
            {tutor?.tutorCode ? `${tutor.tutorCode} · ` : ''}
            เลือกคอร์สเพื่อดูการเข้าเรียนของนักเรียนในคอร์สนั้น (ดูได้อย่างเดียว)
          </p>
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
          <button type="button" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="aes-empty">กำลังโหลดคอร์ส...</div>
      ) : filtered.length === 0 ? (
        <div className="aes-empty">
          {keyword ? `ไม่พบคอร์สสำหรับ "${keyword}"` : 'ติวเตอร์คนนี้ยังไม่มีคอร์สที่รับผิดชอบ'}
        </div>
      ) : (
        <div className="aes-grid">
          {filtered.map((course) => (
            <button
              key={course.id}
              type="button"
              className="aes-card"
              onClick={() => navigate(`/admin/attendance/tutors/${tutorId}/courses/${course.id}`)}
            >
              <div className="aes-card-top">
                <span className="aes-code">{course.courseCode || '-'}</span>
                <span className="aes-status">
                  {COURSE_STATUS_LABEL[course.status] || course.status || '-'}
                </span>
              </div>

              <h2 className="aes-card-title">{course.courseName || 'ไม่ระบุชื่อคอร์ส'}</h2>
              <p className="aes-card-desc">{course.description || 'ไม่มีรายละเอียดคอร์ส'}</p>

              <div className="aes-card-info">
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

              <span className="aes-card-cta">ดูการเข้าเรียน →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
