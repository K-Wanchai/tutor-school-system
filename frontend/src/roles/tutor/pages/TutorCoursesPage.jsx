import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getMyCourses,
  respondToCourse,
} from '../services/tutorCourseService';

import RefreshButton from '../components/RefreshButton';

import './TutorCoursesPage.css';

const STATUS_LABEL = {
  DRAFT: {
    label: 'รอการตอบรับ',
    cls: 'tc-badge-draft',
  },

  OPEN_FOR_REGISTRATION: {
    label: 'เปิดรับสมัคร',
    cls: 'tc-badge-open',
  },

  CLOSED: {
    label: 'ปิดรับสมัคร',
    cls: 'tc-badge-closed',
  },

  ONGOING: {
    label: 'กำลังสอน',
    cls: 'tc-badge-ongoing',
  },

  COMPLETED: {
    label: 'สอนจบ',
    cls: 'tc-badge-completed',
  },

  CANCELLED: {
    label: 'ถูกยกเลิก',
    cls: 'tc-badge-cancelled',
  },
};

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] || {
    label: status,
    cls: '',
  };

  return (
    <span className={`tc-badge ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function TutorCoursesPage() {
  const [courses, setCourses] = useState([]);

  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState('ALL');

  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getMyCourses();

      setCourses(Array.isArray(data) ? data : []);
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
      const text =
        `${course.courseName || ''} ${course.courseCode || ''}`.toLowerCase();

      return (
        text.includes(keyword.toLowerCase()) &&
        (filter === 'ALL' || course.status === filter)
      );
    });
  }, [courses, keyword, filter]);

  const pendingCount = courses.filter(
    (c) => c.status === 'DRAFT'
  ).length;

  async function handleAccept(courseId) {
    try {
      await respondToCourse({
        courseId,
        accepted: true,
      });

      load();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleReject(courseId) {
    try {
      await respondToCourse({
        courseId,
        accepted: false,
      });

      load();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="tc-page">
      {/* Header */}
      <div className="tc-header">
        <div>
          <h1>คอร์สของฉัน</h1>

          <p>
            จัดการคอร์สที่ได้รับมอบหมาย
            ตอบรับ หรือปฏิเสธคอร์ส
          </p>
        </div>

        <div className="tc-header-right">
          {pendingCount > 0 && (
            <div className="tc-pending-badge">
              ⏳ รอการตอบรับ {pendingCount} คอร์ส
            </div>
          )}

          <RefreshButton
            onClick={load}
            loading={loading}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="tc-toolbar">
        <input
          type="text"
          placeholder="ค้นหาชื่อคอร์ส หรือรหัสคอร์ส..."
          value={keyword}
          onChange={(e) =>
            setKeyword(e.target.value)
          }
        />

        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
        >
          <option value="ALL">
            ทุกสถานะ
          </option>

          <option value="DRAFT">
            รอการตอบรับ
          </option>

          <option value="OPEN_FOR_REGISTRATION">
            เปิดรับสมัคร
          </option>

          <option value="ONGOING">
            กำลังสอน
          </option>

          <option value="COMPLETED">
            สอนจบ
          </option>

          <option value="CANCELLED">
            ถูกยกเลิก
          </option>
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="tc-loading">
          กำลังโหลดข้อมูล...
        </div>
      ) : filtered.length === 0 ? (
        <div className="tc-empty">
          <div className="tc-empty-icon">
            📚
          </div>

          <h3>ยังไม่มีคอร์ส</h3>

          <p>
            ไม่มีข้อมูลคอร์สที่ได้รับมอบหมาย
          </p>
        </div>
      ) : (
        <div className="tc-grid">
          {filtered.map((course) => (
            <div
              key={course.id}
              className={`tc-card ${
                course.status === 'DRAFT'
                  ? 'tc-card-pending'
                  : ''
              }`}
            >
              <div className="tc-card-top">
                <span className="tc-code">
                  {course.courseCode}
                </span>

                <StatusBadge
                  status={course.status}
                />
              </div>

              <h2 className="tc-card-title">
                {course.courseName}
              </h2>

              <p className="tc-card-desc">
                {course.description ||
                  'ไม่มีรายละเอียดคอร์ส'}
              </p>

              <div className="tc-card-info">
                <div>
                  <span>ราคา</span>

                  <strong>
                    {Number(
                      course.price || 0
                    ).toLocaleString()}{' '}
                    บาท
                  </strong>
                </div>

                <div>
                  <span>ชั่วโมงเรียน</span>

                  <strong>
                    {course.totalHours || 0}{' '}
                    ชั่วโมง
                  </strong>
                </div>

                <div>
                  <span>จำนวนนักเรียน</span>

                  <strong>
                    {course.enrolledCount || 0}{' '}
                    คน
                  </strong>
                </div>

                <div>
                  <span>เริ่มเรียน</span>

                  <strong>
                    {course.startDate || '-'}
                  </strong>
                </div>
              </div>

              <div className="tc-card-actions">
                <button className="tc-btn-detail">
                  ดูรายละเอียด
                </button>

                {course.status ===
                  'DRAFT' && (
                  <>
                    <button
                      className="tc-btn-accept"
                      onClick={() =>
                        handleAccept(course.id)
                      }
                    >
                      ตอบรับ
                    </button>

                    <button
                      className="tc-btn-reject"
                      onClick={() =>
                        handleReject(course.id)
                      }
                    >
                      ปฏิเสธ
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}