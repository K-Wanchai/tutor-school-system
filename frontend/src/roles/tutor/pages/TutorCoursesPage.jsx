import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addLesson,
  addTest,
  deleteLesson,
  getMyCourses,
  markCourseViewed,
  updateLesson,
} from '../services/tutorCourseService';

import RefreshButton from '../components/RefreshButton';

import './TutorCoursesPage.css';

const STATUS_LABEL = {
  OPEN_FOR_REGISTRATION: {
    label: 'เปิดรับสมัคร',
    cls: 'tc-badge-open',
  },

  CLOSED: {
    label: 'ปิดรับสมัคร',
    cls: 'tc-badge-closed',
  },

  ONGOING: {
    label: 'กำลังเรียน',
    cls: 'tc-badge-ongoing',
  },

  COMPLETED: {
    label: 'สอนจบแล้ว',
    cls: 'tc-badge-completed',
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
  const [manageCourse, setManageCourse] = useState(null);
  const [detailCourse, setDetailCourse] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getMyCourses();
      const list = Array.isArray(data) ? data : [];

      setCourses(list);

      // แอดมินมอบหมายคอร์สมาแล้วถือว่าติวเตอร์ได้รับทันที — เข้าหน้านี้ครั้งแรกถือว่าเปิดดูแล้ว ล้าง badge แจ้งเตือนที่เมนู
      const unviewed = list.filter((c) => !c.tutorViewed);
      if (unviewed.length > 0) {
        await Promise.all(unviewed.map((c) => markCourseViewed(c.id).catch(() => {})));
      }
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

  function openManage(course) {
    setManageCourse(course);
  }

  function openDetail(course) {
    setDetailCourse(course);
  }

  async function refreshManageCourse() {
    const data = await getMyCourses();
    const list = Array.isArray(data) ? data : [];
    setCourses(list);
    setManageCourse((prev) => (prev ? list.find((c) => c.id === prev.id) || null : null));
  }

  return (
    <div className="tc-page">
      {/* Header */}
      <div className="tc-header">
        <div>
          <h1>คอร์สของฉัน</h1>

          <p>
            คอร์สทั้งหมดของคุณ จัดการบทเรียนและข้อสอบได้ที่นี่
          </p>
        </div>

        <div className="tc-header-right">
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

          <option value="CLOSED">
            ปิดรับสมัคร
          </option>

          <option value="OPEN_FOR_REGISTRATION">
            เปิดรับสมัคร
          </option>

          <option value="ONGOING">
            กำลังเรียน
          </option>

          <option value="COMPLETED">
            สอนจบแล้ว
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
            เมื่อแอดมินมอบหมายคอร์สให้คุณ รายการจะแสดงที่นี่ทันที
          </p>
        </div>
      ) : (
        <div className="tc-grid">
          {filtered.map((course) => (
            <div key={course.id} className="tc-card">
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
                    {course.courseStartDate || '-'}
                  </strong>
                </div>
              </div>

              <div className="tc-card-actions">
                <button className="tc-btn-detail" onClick={() => openDetail(course)}>
                  ดูรายละเอียด
                </button>

                {['CLOSED', 'OPEN_FOR_REGISTRATION', 'ONGOING'].includes(course.status) && (
                  <button className="tc-btn-accept" onClick={() => openManage(course)}>
                    📚 จัดการบทเรียน
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {manageCourse && (
        <LessonManagerModal
          course={manageCourse}
          onClose={() => setManageCourse(null)}
          onChanged={refreshManageCourse}
        />
      )}

      {detailCourse && (
        <CourseDetailModal
          course={detailCourse}
          onClose={() => setDetailCourse(null)}
        />
      )}
    </div>
  );
}

function CourseDetailModal({ course, onClose }) {
  const lessons = [...(course.lessons || [])].sort((a, b) => (a.lessonOrder || 0) - (b.lessonOrder || 0));
  const tests = [...(course.tests || [])].sort((a, b) => (a.testOrder || 0) - (b.testOrder || 0));

  function formatDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <div className="tc-modal-overlay" onClick={onClose}>
      <div className="tc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tc-modal-header">
          <h2>รายละเอียดคอร์ส — {course.courseName}</h2>
          <button className="tc-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="tc-modal-section">
          <h3>ข้อมูลทั่วไป</h3>

          <p className="tc-modal-hint">{course.description || 'ไม่มีรายละเอียดคอร์ส'}</p>

          <div className="tc-card-info">
            <div>
              <span>รหัสคอร์ส</span>
              <strong>{course.courseCode}</strong>
            </div>

            <div>
              <span>สถานะ</span>
              <strong><StatusBadge status={course.status} /></strong>
            </div>

            <div>
              <span>ชั่วโมงเรียน</span>
              <strong>{course.totalHours || 0} ชั่วโมง</strong>
            </div>

            <div>
              <span>จำนวนนักเรียน</span>
              <strong>{course.enrolledCount || 0}/{course.seatLimit || 0} คน</strong>
            </div>

            <div>
              <span>ช่วงรับสมัคร</span>
              <strong>{formatDate(course.registrationStartDate)} - {formatDate(course.registrationEndDate)}</strong>
            </div>

            <div>
              <span>วันเริ่มเรียน</span>
              <strong>{formatDate(course.courseStartDate)}</strong>
            </div>

            <div>
              <span>ตารางสอน</span>
              <strong>{course.scheduleDays || '-'}</strong>
            </div>
          </div>

          {course.tutorRemark && (
            <p className="tc-modal-hint">หมายเหตุ: {course.tutorRemark}</p>
          )}
        </div>

        <div className="tc-modal-section">
          <h3>บทเรียน ({lessons.length})</h3>

          {lessons.length === 0 && <p className="tc-modal-hint">ยังไม่มีบทเรียน</p>}

          {lessons.map((lesson) => (
            <div key={lesson.id} className="tc-lesson-row tc-lesson-row--column">
              <div className="tc-lesson-row-top">
                <div>
                  <strong>บทที่ {lesson.lessonOrder}: {lesson.lessonTitle}</strong>
                  {lesson.lessonContent && <p>{lesson.lessonContent}</p>}
                </div>
              </div>

              {tests.filter((t) => t.lessonOrder === lesson.lessonOrder).length > 0 && (
                <ul className="tc-lesson-test-list">
                  {tests.filter((t) => t.lessonOrder === lesson.lessonOrder).map((test) => (
                    <li key={test.id}>
                      <strong>สอบ: {test.testTitle}</strong>
                      {test.testDescription && <span> — {test.testDescription}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="tc-modal-footer">
          <button onClick={onClose}>ปิด</button>
        </div>
      </div>
    </div>
  );
}

function LessonManagerModal({ course, onClose, onChanged }) {
  const lessonsEditable = course.status === 'CLOSED' || course.status === 'OPEN_FOR_REGISTRATION';
  const testsAddable = ['CLOSED', 'OPEN_FOR_REGISTRATION', 'ONGOING'].includes(course.status);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonForm, setLessonForm] = useState({ lessonTitle: '', lessonContent: '', lessonOrder: '' });

  // แบบฟอร์มเพิ่มหัวข้อสอบ แยกตามบทเรียน (key = lessonOrder ของบทนั้น)
  const [testFormByLesson, setTestFormByLesson] = useState({});

  // ลำดับบทเรียนนับจากลำดับที่เพิ่มครั้งแรก ไม่ให้ติวเตอร์กรอกเอง
  const lessons = [...(course.lessons || [])].sort((a, b) => (a.lessonOrder || 0) - (b.lessonOrder || 0));
  const tests = [...(course.tests || [])].sort((a, b) => (a.testOrder || 0) - (b.testOrder || 0));

  function nextLessonOrder() {
    return lessons.length > 0 ? Math.max(...lessons.map((l) => l.lessonOrder || 0)) + 1 : 1;
  }

  function testsForLesson(lessonOrder) {
    return tests.filter((t) => t.lessonOrder === lessonOrder);
  }

  function startAddLesson() {
    setEditingLessonId(null);
    setLessonForm({ lessonTitle: '', lessonContent: '', lessonOrder: String(nextLessonOrder()) });
  }

  function startEditLesson(lesson) {
    setEditingLessonId(lesson.id);
    setLessonForm({
      lessonTitle: lesson.lessonTitle || '',
      lessonContent: lesson.lessonContent || '',
      lessonOrder: String(lesson.lessonOrder ?? ''),
    });
  }

  async function submitLesson(e) {
    e.preventDefault();
    if (!lessonForm.lessonTitle.trim()) {
      setError('กรุณากรอกชื่อบทเรียน');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const payload = {
        lessonTitle: lessonForm.lessonTitle.trim(),
        lessonContent: lessonForm.lessonContent.trim(),
        lessonOrder: Number(lessonForm.lessonOrder) || nextLessonOrder(),
      };
      if (editingLessonId) {
        await updateLesson(course.id, editingLessonId, payload);
      } else {
        await addLesson(course.id, payload);
      }
      setEditingLessonId(null);
      setLessonForm({ lessonTitle: '', lessonContent: '', lessonOrder: '' });
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteLesson(lessonId) {
    setBusy(true);
    setError('');
    try {
      await deleteLesson(course.id, lessonId);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function setTestField(lessonOrder, field, value) {
    setTestFormByLesson((prev) => ({
      ...prev,
      [lessonOrder]: { ...prev[lessonOrder], [field]: value },
    }));
  }

  async function submitTestForLesson(e, lesson) {
    e.preventDefault();
    const formState = testFormByLesson[lesson.lessonOrder] || {};
    if (!formState.testTitle?.trim()) {
      setError('กรุณากรอกหัวข้อสอบ');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await addTest(course.id, {
        testTitle: formState.testTitle.trim(),
        testDescription: (formState.testDescription || '').trim(),
        testOrder: testsForLesson(lesson.lessonOrder).length + 1,
        lessonOrder: lesson.lessonOrder,
      });
      setTestFormByLesson((prev) => ({ ...prev, [lesson.lessonOrder]: { testTitle: '', testDescription: '' } }));
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tc-modal-overlay" onClick={onClose}>
      <div className="tc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tc-modal-header">
          <h2>จัดการบทเรียน — {course.courseName}</h2>
          <button className="tc-modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="tc-modal-error">{error}</div>}

        <div className="tc-modal-section">
          <h3>บทเรียน ({lessons.length})</h3>

          {!lessonsEditable && (
            <p className="tc-modal-hint">คอร์สเริ่มสอนแล้ว ไม่สามารถเพิ่ม/แก้ไข/ลบบทเรียนได้อีก แต่ยังเพิ่มหัวข้อสอบได้</p>
          )}

          {lessons.map((lesson) => {
            const lessonTests = testsForLesson(lesson.lessonOrder);
            const testForm = testFormByLesson[lesson.lessonOrder] || {};

            return (
              <div key={lesson.id} className="tc-lesson-row tc-lesson-row--column">
                <div className="tc-lesson-row-top">
                  <div>
                    <strong>บทที่ {lesson.lessonOrder}: {lesson.lessonTitle}</strong>
                    {lesson.lessonContent && <p>{lesson.lessonContent}</p>}
                  </div>
                  {lessonsEditable && (
                    <div className="tc-lesson-row-actions">
                      <button type="button" onClick={() => startEditLesson(lesson)} disabled={busy}>แก้ไข</button>
                      <button type="button" onClick={() => handleDeleteLesson(lesson.id)} disabled={busy}>ลบ</button>
                    </div>
                  )}
                </div>

                {lessonTests.length > 0 && (
                  <ul className="tc-lesson-test-list">
                    {lessonTests.map((test) => (
                      <li key={test.id}>
                        <strong>สอบ: {test.testTitle}</strong>
                        {test.testDescription && <span> — {test.testDescription}</span>}
                      </li>
                    ))}
                  </ul>
                )}

                {testsAddable && (
                  <form className="tc-inline-test-form" onSubmit={(e) => submitTestForLesson(e, lesson)}>
                    <input
                      placeholder="เพิ่มหัวข้อสอบสำหรับบทนี้"
                      value={testForm.testTitle || ''}
                      onChange={(e) => setTestField(lesson.lessonOrder, 'testTitle', e.target.value)}
                    />
                    <input
                      placeholder="รายละเอียด (ถ้ามี)"
                      value={testForm.testDescription || ''}
                      onChange={(e) => setTestField(lesson.lessonOrder, 'testDescription', e.target.value)}
                    />
                    <button type="submit" disabled={busy}>+ เพิ่ม</button>
                  </form>
                )}
              </div>
            );
          })}

          {lessonsEditable && (
            <form className="tc-inline-form" onSubmit={submitLesson}>
              <input
                placeholder="ชื่อบทเรียน"
                value={lessonForm.lessonTitle}
                onChange={(e) => setLessonForm((f) => ({ ...f, lessonTitle: e.target.value }))}
              />
              <textarea
                placeholder="เนื้อหาบทเรียน"
                value={lessonForm.lessonContent}
                onChange={(e) => setLessonForm((f) => ({ ...f, lessonContent: e.target.value }))}
              />
              <div className="tc-inline-form-actions">
                <button type="submit" disabled={busy}>
                  {editingLessonId ? 'บันทึกการแก้ไข' : '+ เพิ่มบทเรียน'}
                </button>
                {editingLessonId && (
                  <button type="button" onClick={startAddLesson} disabled={busy}>ยกเลิกแก้ไข</button>
                )}
              </div>
            </form>
          )}
        </div>

        <div className="tc-modal-footer">
          <button onClick={onClose}>ปิด</button>
        </div>
      </div>
    </div>
  );
}