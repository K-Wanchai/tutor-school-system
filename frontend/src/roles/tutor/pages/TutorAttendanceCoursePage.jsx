import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMyCourses } from '../services/tutorCourseService';
import RefreshButton from '../components/RefreshButton';
import TutorAttendanceGrid from '../components/TutorAttendanceGrid';
import './TutorAttendanceCoursePage.css';

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TutorAttendanceCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const list = await getMyCourses();
      setCourse((Array.isArray(list) ? list : []).find((c) => String(c.id) === String(courseId)) || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load, reloadKey]);

  // คอร์สที่สอนจบแล้วไม่อยู่ในรายการหน้า "การเข้าเรียน" อีกต่อไป — ถ้าเข้ามาจากคอร์สที่จบแล้ว ให้กลับไปหน้า "ประวัติคอร์สเรียน" แทน
  const backTo = course?.status === 'COMPLETED' ? '/tutor/course-history' : '/tutor/attendance';
  const backLabel = course?.status === 'COMPLETED' ? '← กลับไปหน้าประวัติคอร์สเรียน' : '← กลับไปหน้าการเข้าเรียน';

  return (
    <div className="tac-page">
      <button type="button" className="tac-back" onClick={() => navigate(backTo)}>
        {backLabel}
      </button>

      <div className="tac-header">
        <div>
          <div className="tac-title">
            <span className="tac-code">{course?.courseCode || '-'}</span>
            <h1>{course?.courseName || 'การเข้าเรียน'}</h1>
          </div>
          <p className="tac-meta">
            ผู้สอน: <b>{course?.teacherName || '-'}</b> ·
            เริ่มเรียน: <b>{formatDate(course?.courseStartDate)}</b>
          </p>
        </div>
        <RefreshButton onClick={() => setReloadKey((k) => k + 1)} loading={loading} />
      </div>

      {error && (
        <div className="tac-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="tac-empty">กำลังโหลดข้อมูล...</div>
      ) : (
        <TutorAttendanceGrid key={reloadKey} courseId={courseId} />
      )}
    </div>
  );
}
