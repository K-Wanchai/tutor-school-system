import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMyCourses } from '../services/tutorCourseService';
import RefreshButton from '../components/RefreshButton';
import { formatScheduleDaysTH } from '../../../shared/utils/dateUtils';
import './TutorCoursesPage.css';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TutorCourseHistoryPage() {
  const [courses, setCourses] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailCourse, setDetailCourse] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyCourses();
      const list = Array.isArray(data) ? data : [];
      setCourses(list.filter((c) => c.status === 'COMPLETED'));
    } catch (error) {
      console.error(error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const kw = keyword.toLowerCase();
    return courses.filter((course) =>
      `${course.courseName || ''} ${course.courseCode || ''}`.toLowerCase().includes(kw)
    );
  }, [courses, keyword]);

  return (
    <div className="tc-page">
      <div className="tc-header">
        <div>
          <h1>ประวัติคอร์สเรียน</h1>
          <p>คอร์สที่คุณปิดจบการสอนแล้วทั้งหมด</p>
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
          <div className="tc-empty-icon">🎓</div>
          <h3>ยังไม่มีประวัติคอร์สเรียน</h3>
          <p>เมื่อคุณปิดจบการสอนคอร์สใด คอร์สนั้นจะย้ายมาแสดงที่นี่</p>
        </div>
      ) : (
        <div className="tc-table-wrap">
          <table className="tc-table">
            <thead>
              <tr>
                <th>รหัสคอร์ส</th>
                <th>ชื่อคอร์ส</th>
                <th>ชั่วโมงเรียน</th>
                <th>จำนวนนักเรียน</th>
                <th>วันเริ่มเรียน</th>
                <th>รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((course) => (
                <tr key={course.id}>
                  <td><span className="tc-table-code">{course.courseCode}</span></td>
                  <td className="tc-table-name">{course.courseName}</td>
                  <td>{course.totalHours || 0} ชั่วโมง</td>
                  <td>{course.enrolledCount || 0}/{course.seatLimit || 0} คน</td>
                  <td>{formatDate(course.courseStartDate)}</td>
                  <td>
                    <button className="tc-table-btn-icon" title="ดูรายละเอียด" onClick={() => setDetailCourse(course)}>
                      👁
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailCourse && (
        <div className="tc-modal-overlay" onClick={() => setDetailCourse(null)}>
          <div className="tc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tc-modal-header">
              <h2>รายละเอียดคอร์ส — {detailCourse.courseName}</h2>
              <button className="tc-modal-close" onClick={() => setDetailCourse(null)}>✕</button>
            </div>

            <div className="tc-modal-section">
              <h3>ข้อมูลทั่วไป</h3>
              <p className="tc-modal-hint">{detailCourse.description || 'ไม่มีรายละเอียดคอร์ส'}</p>

              <div className="tc-card-info">
                <div>
                  <span>รหัสคอร์ส</span>
                  <strong>{detailCourse.courseCode}</strong>
                </div>
                <div>
                  <span>สถานะ</span>
                  <strong><span className="tc-badge tc-badge-completed">สอนจบแล้ว</span></strong>
                </div>
                <div>
                  <span>ชั่วโมงเรียน</span>
                  <strong>{detailCourse.totalHours || 0} ชั่วโมง</strong>
                </div>
                <div>
                  <span>จำนวนนักเรียน</span>
                  <strong>{detailCourse.enrolledCount || 0}/{detailCourse.seatLimit || 0} คน</strong>
                </div>
                <div>
                  <span>วันเริ่มเรียน</span>
                  <strong>{formatDate(detailCourse.courseStartDate)}</strong>
                </div>
                <div>
                  <span>ตารางสอน</span>
                  <strong className="schedule-multiline">{formatScheduleDaysTH(detailCourse.scheduleDays)}</strong>
                </div>
              </div>

              {detailCourse.tutorRemark && (
                <p className="tc-modal-hint">หมายเหตุ: {detailCourse.tutorRemark}</p>
              )}
            </div>

            <div className="tc-modal-footer">
              <button onClick={() => setDetailCourse(null)}>ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
