import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getChildEnrollments, getChildExams, getChildCourseScores } from '../services/parentService';
import { getStudentName } from '../../../shared/utils/tokenUtils';
import ExamScoreGrid from '../../student/components/ExamScoreGrid';
import '../../admin/pages/AdminExamPages.css';

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ParentExamResultsCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getChildEnrollments();
      const list = Array.isArray(data) ? data : [];
      setCourse(list.find((c) => String(c.courseId) === String(courseId)) || null);
    } catch (err) {
      setError(err.message || 'โหลดข้อมูลคอร์สไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  // คอร์สที่สอนจบแล้วไม่อยู่ในรายการหน้า "ผลการสอบ" อีกต่อไป — ถ้าเข้ามาจากคอร์สที่จบแล้ว ให้กลับไปหน้า "ประวัติคอร์สเรียน" แทน
  const backTo = course?.status === 'COMPLETED' ? '/parent/course-history' : '/parent/exam-results';
  const backLabel = course?.status === 'COMPLETED' ? '← กลับไปหน้าประวัติคอร์สเรียน' : '← กลับไปหน้าผลการสอบ';

  return (
    <div className="aes-page">
      <button type="button" className="aes-back" onClick={() => navigate(backTo)}>
        {backLabel}
      </button>

      <div className="aes-header">
        <div>
          <div className="aes-detail-title">
            <span className="aes-code">{course?.courseCode || '-'}</span>
            <h1>{course?.courseName || 'ผลการสอบ'}</h1>
          </div>
          <p className="aes-detail-meta">
            ผู้สอน: <b>{course?.tutorName || '-'}</b> ·
            เริ่มเรียน: <b>{formatDate(course?.courseStartDate)}</b>
          </p>
        </div>
        <span className="aes-readonly-badge">โหมดดูอย่างเดียว</span>
      </div>

      {error && (
        <div className="aes-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="aes-empty">กำลังโหลดคะแนน...</div>
      ) : (
        <ExamScoreGrid
          courseId={courseId}
          fetchExams={getChildExams}
          fetchScores={getChildCourseScores}
          legendNote="คุณดูคะแนนสอบของบุตรหลานได้เท่านั้น — การกรอกคะแนนทำได้ที่บัญชีติวเตอร์"
          fallbackName={getStudentName() || 'บุตรหลาน'}
        />
      )}
    </div>
  );
}
