import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCourses } from '../services/tutorCourseService';
import { getMyExamSchedule } from '../services/tutorExamService';
import RefreshButton from '../components/RefreshButton';
import './TutorCoursesPage.css';

// จัดตารางสอบได้เฉพาะคอร์สที่สถานะ ONGOING (เปิดทำการเรียนการสอนแล้ว) — ต้องตรงกับ
// CourseStatus.java ฝั่ง backend และ validateCourseIsOngoing() ใน ExamServiceImpl
const EXAM_ELIGIBLE_COURSE_STATUS = 'ONGOING';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TutorExamSchedulePage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [courseData, examData] = await Promise.all([getMyCourses(), getMyExamSchedule()]);
      setCourses(Array.isArray(courseData) ? courseData : []);
      setExams(Array.isArray(examData) ? examData : []);
    } catch (error) {
      console.error(error);
      setCourses([]);
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // เฉพาะคอร์สที่กำลังเรียนเท่านั้นที่จัดตารางสอบได้ — คอร์สอื่นไม่แสดงในหน้านี้เลย
  const eligibleCourses = useMemo(
    () => courses.filter((c) => c.status === EXAM_ELIGIBLE_COURSE_STATUS),
    [courses]
  );

  const examCountByCourse = useMemo(() => {
    const map = new Map();
    exams.forEach((e) => {
      const key = String(e.courseId);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [exams]);

  const filtered = useMemo(() => {
    return eligibleCourses.filter((course) => {
      const text = `${course.courseName || ''} ${course.courseCode || ''}`.toLowerCase();
      return text.includes(keyword.toLowerCase());
    });
  }, [eligibleCourses, keyword]);

  function goToCourse(courseId) {
    navigate(`/tutor/exam-schedule/${courseId}`);
  }

  return (
    <div className="tc-page">
      <div className="tc-header">
        <div>
          <h1>ตารางสอบ</h1>
          <p>เลือกคอร์สที่กำลังเรียนเพื่อจัดตารางสอบของคอร์สนั้น</p>
        </div>

        <div className="tc-header-right">
          <RefreshButton onClick={load} loading={loading} />
        </div>
      </div>

      <div className="tc-toolbar">
        <input
          type="text"
          placeholder="ค้นหาชื่อคอร์ส หรือรหัสคอร์ส..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="tc-loading">กำลังโหลดข้อมูล...</div>
      ) : filtered.length === 0 ? (
        <div className="tc-empty">
          <div className="tc-empty-icon">📝</div>
          <h3>ยังไม่มีคอร์สที่กำลังเรียน</h3>
          <p>จัดตารางสอบได้เฉพาะคอร์สที่ขึ้นสถานะ "กำลังเรียน" เท่านั้น — รอให้คอร์สที่คุณสอนถึงวันเริ่มเรียนก่อน</p>
        </div>
      ) : (
        <div className="tc-grid">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="tc-card tc-card-clickable"
              role="button"
              tabIndex={0}
              onClick={() => goToCourse(course.id)}
              onKeyDown={(e) => { if (e.key === 'Enter') goToCourse(course.id); }}
            >
              <div className="tc-card-top">
                <span className="tc-code">{course.courseCode}</span>
                <span className="tc-badge tc-badge-ongoing">กำลังเรียน</span>
              </div>

              <h2 className="tc-card-title">{course.courseName}</h2>

              <p className="tc-card-desc">
                {course.description || 'ไม่มีรายละเอียดคอร์ส'}
              </p>

              <div className="tc-card-info">
                <div>
                  <span>เริ่มเรียน</span>
                  <strong>{formatDate(course.courseStartDate)}</strong>
                </div>
                <div>
                  <span>จำนวนข้อสอบ</span>
                  <strong>{examCountByCourse.get(String(course.id)) || 0} ชุด</strong>
                </div>
              </div>

              <div className="tc-card-actions">
                <button
                  type="button"
                  className="tc-btn-detail"
                  onClick={(e) => { e.stopPropagation(); goToCourse(course.id); }}
                >
                  📝 จัดตารางสอบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
