import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMyCourses } from '../services/tutorCourseService';
import RefreshButton from '../components/RefreshButton';
import TutorExamScoreGrid from '../components/TutorExamScoreGrid';
import './TutorExamScoreCoursePage.css';

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TutorExamScoreCoursePage() {
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

  // คอร์สที่สอนจบแล้วไม่อยู่ในรายการหน้า "คะแนนสอบ" อีกต่อไป — ถ้าเข้ามาจากคอร์สที่จบแล้ว ให้กลับไปหน้า "ประวัติคอร์สเรียน" แทน
  const backTo = course?.status === 'COMPLETED' ? '/tutor/course-history' : '/tutor/exam-scores';
  const backLabel = course?.status === 'COMPLETED' ? '← กลับไปหน้าประวัติคอร์สเรียน' : '← กลับไปหน้าคะแนนสอบ';

  return (
    <div className="escd-page">
      <button type="button" className="escd-back" onClick={() => navigate(backTo)}>
        {backLabel}
      </button>

      <div className="escd-header">
        <div>
          <div className="escd-title">
            <span className="escd-code">{course?.courseCode || '-'}</span>
            <h1>{course?.courseName || 'คะแนนสอบ'}</h1>
          </div>
          <p className="escd-meta">
            ผู้สอน: <b>{course?.teacherName || '-'}</b> ·
            เริ่มเรียน: <b>{formatDate(course?.courseStartDate)}</b>
          </p>
        </div>
        <RefreshButton onClick={() => setReloadKey((k) => k + 1)} loading={loading} />
      </div>

      {error && (
        <div className="escd-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="escd-empty">กำลังโหลดคะแนน...</div>
      ) : (
        <TutorExamScoreGrid key={reloadKey} courseId={courseId} />
      )}
    </div>
  );
}
