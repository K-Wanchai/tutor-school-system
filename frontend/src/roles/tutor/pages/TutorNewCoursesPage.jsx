import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMyCourses, respondToCourse } from '../services/tutorCourseService';
import RefreshButton from '../components/RefreshButton';
import './TutorCoursesPage.css';

export default function TutorNewCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getMyCourses();
      const list = Array.isArray(data) ? data : [];

      // แสดงเฉพาะคอร์สที่ยังไม่ได้ตอบรับ/ปฏิเสธ — พอกดตอบรับหรือปฏิเสธแล้วจะหายจากหน้านี้ทันที
      // ไปโชว์ที่หน้า "คอร์สของฉัน" แทน เพื่อไม่ให้ปนกัน
      setCourses(list.filter((c) => c.status === 'DRAFT'));
    } catch (error) {
      console.error(error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return courses.filter((course) => {
      const text = `${course.courseName || ''} ${course.courseCode || ''}`.toLowerCase();
      return text.includes(keyword.toLowerCase());
    });
  }, [courses, keyword]);

  async function handleAccept(courseId) {
    try {
      await respondToCourse({ courseId, accepted: true });
      load();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleReject(courseId) {
    try {
      await respondToCourse({ courseId, accepted: false });
      load();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="tc-page">
      <div className="tc-header">
        <div>
          <h1>คอร์สมาใหม่</h1>
          <p>คอร์สที่แอดมินมอบหมายให้คุณ รอการตอบรับหรือปฏิเสธ</p>
        </div>

        <div className="tc-header-right">
          {filtered.length > 0 && (
            <div className="tc-pending-badge">
              ⏳ รอการตอบรับ {filtered.length} คอร์ส
            </div>
          )}

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
          <div className="tc-empty-icon">📭</div>
          <h3>ไม่มีคอร์สใหม่ตอนนี้</h3>
          <p>เมื่อแอดมินมอบหมายคอร์สใหม่ให้คุณ รายการจะแสดงที่หน้านี้</p>
        </div>
      ) : (
        <div className="tc-grid">
          {filtered.map((course) => (
            <div key={course.id} className="tc-card tc-card-pending">
              <div className="tc-card-top">
                <span className="tc-code">{course.courseCode}</span>
                <span className="tc-badge tc-badge-draft">รอการตอบรับ</span>
              </div>

              <h2 className="tc-card-title">{course.courseName}</h2>

              <p className="tc-card-desc">{course.description || 'ไม่มีรายละเอียดคอร์ส'}</p>

              <div className="tc-card-info">
                <div>
                  <span>ราคา</span>
                  <strong>{Number(course.price || 0).toLocaleString()} บาท</strong>
                </div>

                <div>
                  <span>ชั่วโมงเรียน</span>
                  <strong>{course.totalHours || 0} ชั่วโมง</strong>
                </div>

                <div>
                  <span>จำนวนที่นั่ง</span>
                  <strong>{course.seatLimit || 0} คน</strong>
                </div>

                <div>
                  <span>วันเริ่มเรียน</span>
                  <strong>{course.courseStartDate || '-'}</strong>
                </div>

                <div>
                  <span>ตารางสอน</span>
                  <strong>{course.scheduleDays || 'ยังไม่ได้จัด'}</strong>
                </div>
              </div>

              <div className="tc-card-actions">
                <button className="tc-btn-accept" onClick={() => handleAccept(course.id)}>
                  ตอบรับ
                </button>

                <button className="tc-btn-reject" onClick={() => handleReject(course.id)}>
                  ปฏิเสธ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
