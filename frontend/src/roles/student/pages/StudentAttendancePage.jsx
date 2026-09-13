import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCourses } from '../services/studentMyCoursesService';
import '../../admin/pages/AdminExamPages.css';

const ACTIVE_ENROLLMENT_STATUSES = new Set(['APPROVED', 'COMPLETED']);

const ENROLLMENT_STATUS_LABEL = {
  APPROVED: 'กำลังเรียน',
  COMPLETED: 'เรียนจบแล้ว',
};

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function StudentAttendancePage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMyCourses()
      .then((data) => {
        if (!active) return;
        const list = (Array.isArray(data) ? data : []).filter((c) => ACTIVE_ENROLLMENT_STATUSES.has(c.status));
        setCourses(list);
        setError('');
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return courses;
    return courses.filter((c) =>
      `${c.courseName || ''} ${c.courseCode || ''}`.toLowerCase().includes(kw)
    );
  }, [courses, keyword]);

  return (
    <div className="aes-page">
      <div className="aes-header">
        <div>
          <h1>การเข้าเรียน</h1>
          <p>เลือกคอร์สเพื่อดูการเข้าเรียนของคุณในแต่ละคาบ (ดูได้อย่างเดียว)</p>
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
          {keyword ? `ไม่พบคอร์สสำหรับ "${keyword}"` : 'คุณยังไม่มีคอร์สที่ลงทะเบียนอนุมัติแล้ว'}
        </div>
      ) : (
        <div className="aes-grid">
          {filtered.map((course) => (
            <button
              key={course.courseId}
              type="button"
              className="aes-card"
              onClick={() => navigate(`/student/attendance/${course.courseId}`)}
            >
              <div className="aes-card-top">
                <span className="aes-code">{course.courseCode || '-'}</span>
                <span className="aes-status">
                  {ENROLLMENT_STATUS_LABEL[course.status] || course.status || '-'}
                </span>
              </div>

              <h2 className="aes-card-title">{course.courseName || 'ไม่ระบุชื่อคอร์ส'}</h2>

              <div className="aes-card-info">
                <div>
                  <span>ผู้สอน</span>
                  <strong>{course.tutorName || '-'}</strong>
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
