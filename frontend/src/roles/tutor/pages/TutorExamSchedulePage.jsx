import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  closeExam,
  createExam,
  deleteExam,
  getMyExamSchedule,
  openExam,
} from '../services/tutorExamService';
import { getMyCourses } from '../services/tutorCourseService';
import RefreshButton from '../components/RefreshButton';
import CalendarDateInput from '../../../shared/components/CalendarDateInput';
import { useConfirm } from '../../../shared/components/ConfirmDialog';
import './TutorSchedulesPage.css';
import './TutorExamSchedulePage.css';

const STATUS_LABELS = {
  DRAFT: 'ยังไม่เปิดสอบ',
  OPEN: 'เปิดสอบอยู่',
  CLOSED: 'ปิดสอบแล้ว',
  CANCELLED: 'ยกเลิก',
};

const STATUS_ICONS = {
  DRAFT: '🕒',
  OPEN: '🟢',
  CLOSED: '🔒',
  CANCELLED: '✕',
};

const FILTERS = [
  { key: 'ALL', label: 'ทั้งหมด' },
  { key: 'OPEN', label: 'เปิดสอบอยู่' },
  { key: 'DRAFT', label: 'ยังไม่เปิด' },
  { key: 'CLOSED', label: 'ปิดแล้ว' },
];

// สร้างข้อสอบได้เฉพาะคอร์สที่สถานะ ONGOING (เปิดทำการเรียนการสอนแล้ว) — ต้องตรงกับ
// CourseStatus.java ฝั่ง backend และ validateCourseIsOngoing()/validateExamStartNotBeforeCourseStart()
// ใน ExamServiceImpl ห้ามผ่อนเงื่อนไขนี้ที่ฝั่ง frontend เด็ดขาดเพราะ backend เป็นคนบังคับจริง
const EXAM_ELIGIBLE_COURSE_STATUS = 'ONGOING';

// แปลงรหัสวัน backend (MON/TUE/...) เป็นเลขวันของ Date.getDay() (0=อาทิตย์...6=เสาร์)
// ให้ตรงกับ allowedWeekdays ของ CalendarDateInput
const DAY_CODE_TO_WEEKDAY = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const EMPTY_FORM = {
  courseId: '',
  title: '',
  description: '',
  passingScore: '',
  startTime: '',
  durationMinutes: '',
};

function safeText(value) {
  return value === null || value === undefined || value === '' ? '-' : value;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getStatusClass(status) {
  return `tes-status tes-status-${String(status || 'unknown').toLowerCase()}`;
}

// input datetime-local ใช้ "YYYY-MM-DDTHH:mm" ไม่มี timezone/seconds — แปลงเป็น ISO ให้ backend
function toIsoOrNull(localDateTimeValue) {
  return localDateTimeValue ? `${localDateTimeValue}:00` : null;
}

// บวกจำนวนนาทีให้ "YYYY-MM-DDTHH:mm" (เวลาท้องถิ่นแบบ naive ไม่มี timezone) แล้วคืนค่ารูปแบบเดียวกัน —
// ใช้ getFullYear/getMonth/... (เวลาท้องถิ่นของเบราว์เซอร์) แทน toISOString() เพราะ toISOString()
// แปลงเป็น UTC ซึ่งจะเลื่อนเวลาไม่ตรงกับที่ผู้ใช้เลือกถ้า timezone ไม่ใช่ UTC+0
function addMinutesToLocalDateTimeString(localDateTimeValue, minutes) {
  const [datePart, timePart] = localDateTimeValue.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [h, min] = timePart.split(':').map(Number);
  const dt = new Date(y, m - 1, d, h, min);
  dt.setMinutes(dt.getMinutes() + minutes);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`;
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES_5 = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

// เลือกวัน-เวลาแบบ 24 ชม. เอง แทน <input type="datetime-local"> เพราะ picker ของเบราว์เซอร์
// จะโชว์ AM/PM ตาม locale ของเครื่อง ควบคุมให้เป็น 24 ชม. เสมอไม่ได้ผ่าน HTML attribute
function DateTime24Input({ value, onChange, minDate, allowedWeekdays }) {
  const [datePart, timePart] = value ? value.split('T') : ['', ''];
  const [hour, minute] = timePart ? timePart.split(':') : ['', ''];

  function emit(nextDate, nextHour, nextMinute) {
    if (!nextDate || nextHour === '' || nextMinute === '') {
      onChange('');
      return;
    }
    onChange(`${nextDate}T${nextHour}:${nextMinute}`);
  }

  return (
    <div className="tes-datetime24">
      <CalendarDateInput
        value={datePart}
        onChange={(v) => emit(v, hour || '00', minute || '00')}
        minDate={minDate}
        allowedWeekdays={allowedWeekdays}
      />
      <select value={hour} onChange={(e) => emit(datePart, e.target.value, minute || '00')}>
        <option value="">ชม.</option>
        {HOURS_24.map((h) => <option key={h} value={h}>{h}</option>)}
      </select>
      <span>:</span>
      <select value={minute} onChange={(e) => emit(datePart, hour || '00', e.target.value)}>
        <option value="">นาที</option>
        {MINUTES_5.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  );
}

export default function TutorExamSchedulePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { confirm, confirmDialog } = useConfirm();
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [busyId, setBusyId] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const [examData, courseData] = await Promise.all([getMyExamSchedule(), getMyCourses()]);
      const list = [...examData].sort((a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return new Date(a.startTime) - new Date(b.startTime);
      });
      setExams(list);
      setCourses(Array.isArray(courseData) ? courseData : []);
    } catch (err) {
      setError(err.message);
      setExams([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    return {
      total: exams.length,
      open: exams.filter((e) => e.status === 'OPEN').length,
      upcoming: exams.filter((e) => e.status === 'DRAFT').length,
      closed: exams.filter((e) => e.status === 'CLOSED').length,
    };
  }, [exams]);

  // เฉพาะคอร์สที่เปิดทำการเรียนการสอนแล้ว (ONGOING) เท่านั้นที่สร้างข้อสอบได้ — หน้านี้จึงแสดง card
  // เฉพาะคอร์สกลุ่มนี้เท่านั้น คอร์สอื่น (รอเปิดเรียน/เปิดรับสมัคร/ปิดรับสมัคร/เรียนจบแล้ว) ไม่แสดงเลย
  const eligibleCourses = useMemo(
    () => courses.filter((c) => c.status === EXAM_ELIGIBLE_COURSE_STATUS),
    [courses]
  );

  // จัดกลุ่มข้อสอบตามคอร์ส (เฉพาะคอร์สที่กำลังเรียน) แล้วกรองตามแท็บสถานะที่เลือกในแต่ละคอร์ส
  const examsByCourse = useMemo(() => {
    const map = new Map();
    eligibleCourses.forEach((c) => map.set(String(c.id), []));
    exams.forEach((e) => {
      const key = String(e.courseId);
      if (map.has(key)) map.get(key).push(e);
    });
    return map;
  }, [eligibleCourses, exams]);

  // มาจากปุ่ม "ตารางสอบ" ในหน้าคอร์สของฉัน — เลื่อนไปหา card ของคอร์สนั้นและเปิดฟอร์มสร้างข้อสอบให้เลย
  useEffect(() => {
    const courseIdParam = searchParams.get('courseId');
    if (!courseIdParam || courses.length === 0) return;
    if (searchParams.get('create') === '1') {
      const course = eligibleCourses.find((c) => String(c.id) === courseIdParam);
      if (course) {
        openCreate(courseIdParam);
      }
    }
    document.getElementById(`tes-course-${courseIdParam}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('create');
      next.delete('courseId');
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses]);

  const selectedCourse = eligibleCourses.find((c) => String(c.id) === String(form.courseId));

  // เลือกวันสอบได้เฉพาะวันที่คอร์สทำการเรียนการสอนจริง (ตาม scheduleDays ของคอร์ส) และต้องไม่ก่อนวันนี้ —
  // ต้องตรงกับ validateExamStartOnTeachingDayAndFuture()/validateExamStartNotBeforeCourseStart() ฝั่ง backend
  const allowedWeekdays = selectedCourse?.scheduleDays?.length
    ? selectedCourse.scheduleDays
        .map((s) => DAY_CODE_TO_WEEKDAY[s.dayOfWeek])
        .filter((n) => n !== undefined)
    : undefined;

  const minCreateDate = selectedCourse?.courseStartDate
    ? (selectedCourse.courseStartDate > todayIso() ? selectedCourse.courseStartDate : todayIso())
    : todayIso();

  // ประเภทข้อสอบตั้งชื่ออัตโนมัติตามลำดับที่สร้างของคอร์สนั้น — เพิ่มครั้งแรกได้ "การสอบครั้งที่ 1"
  // ครั้งต่อไปนับต่ออัตโนมัติ ไม่ต้องให้ติวเตอร์เลือกเอง
  function openCreate(courseId) {
    const examCount = (examsByCourse.get(String(courseId)) || []).length;
    setForm({ ...EMPTY_FORM, courseId: String(courseId), title: `การสอบครั้งที่ ${examCount + 1}` });
    setFormErr('');
    setShowCreate(true);
  }

  function fld(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.courseId) return setFormErr('กรุณาเลือกคอร์ส');
    if (!form.title) return setFormErr('ไม่พบชื่อประเภทข้อสอบ กรุณาปิดแล้วลองใหม่');
    if (form.passingScore === '' || Number.isNaN(Number(form.passingScore))) {
      return setFormErr('กรุณากรอกคะแนนเต็ม');
    }
    if (!form.startTime) return setFormErr('กรุณาเลือกวันที่และเวลาสอบ');
    if (form.durationMinutes === '' || Number(form.durationMinutes) <= 0) {
      return setFormErr('กรุณากรอกระยะเวลาทำข้อสอบ (นาที)');
    }

    // กันไว้อีกชั้นนอกจากปฏิทินที่ปิดกั้นวันที่เลือกไม่ได้อยู่แล้ว (minDate/allowedWeekdays) — เผื่อกรณีเลือก
    // วันที่ไว้ก่อนค่อยเปลี่ยนคอร์สทีหลัง ทำให้วันที่เดิมใช้ไม่ได้กับคอร์สใหม่
    const startInstant = new Date(form.startTime);
    if (Number.isNaN(startInstant.getTime()) || startInstant <= new Date()) {
      return setFormErr('วันเวลาที่เปิดสอบต้องเป็นเวลาในอนาคตเท่านั้น');
    }
    const [startDatePart] = form.startTime.split('T');
    if (selectedCourse?.courseStartDate && startDatePart < selectedCourse.courseStartDate) {
      return setFormErr('วันที่เปิดสอบต้องไม่ก่อนวันที่เปิดเรียนของคอร์ส');
    }
    if (allowedWeekdays && !allowedWeekdays.includes(startInstant.getDay())) {
      return setFormErr('วันที่เปิดสอบต้องตรงกับวันที่คอร์สนี้ทำการเรียนการสอนเท่านั้น');
    }

    setSaving(true);
    setFormErr('');
    try {
      const created = await createExam({
        courseId: Number(form.courseId),
        title: form.title,
        description: form.description.trim() || null,
        passingScore: Number(form.passingScore),
        startTime: toIsoOrNull(form.startTime),
        endTime: addMinutesToLocalDateTimeString(form.startTime, Number(form.durationMinutes)),
        durationMinutes: Number(form.durationMinutes),
        shuffleQuestions: false,
        showScoreAfterSubmit: true,
        showCorrectAnswersAfterSubmit: false,
      });
      setShowCreate(false);
      navigate(`/tutor/exams/${created.id}/build`);
    } catch (err) {
      setFormErr(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleOpen(examId) {
    setBusyId(examId);
    try {
      await openExam(examId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleClose(examId) {
    setBusyId(examId);
    try {
      await closeExam(examId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(examId) {
    const ok = await confirm({
      title: 'ยืนยันการลบข้อสอบ',
      message: 'ลบข้อสอบนี้? การกระทำนี้ย้อนกลับไม่ได้',
      confirmText: 'ลบข้อสอบ',
      danger: true,
    });
    if (!ok) return;
    setBusyId(examId);
    try {
      await deleteExam(examId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="tes-page">
      {confirmDialog}

      <div className="tutor-schedule-header">
        <div>
          <h1>ตารางสอบ</h1>
          <p>คอร์สที่กำลังเรียนอยู่แต่ละคอร์สจะมี card ของตัวเอง — กด "+ เพิ่มข้อสอบ" ในคอร์สนั้นเพื่อสร้างข้อสอบให้คอร์สนั้นได้เลย</p>
        </div>
        <div className="tes-header-actions">
          <RefreshButton onClick={load} loading={loading} />
        </div>
      </div>

      <div className="tutor-schedule-summary">
        <div className="tutor-schedule-summary-card tes-summary-total">
          <span className="tes-summary-icon">🗂️</span>
          <div><p>ข้อสอบทั้งหมด</p><h2>{summary.total}</h2></div>
        </div>
        <div className="tutor-schedule-summary-card tes-summary-open">
          <span className="tes-summary-icon">🟢</span>
          <div><p>เปิดสอบอยู่</p><h2>{summary.open}</h2></div>
        </div>
        <div className="tutor-schedule-summary-card tes-summary-upcoming">
          <span className="tes-summary-icon">🕒</span>
          <div><p>ยังไม่เปิด</p><h2>{summary.upcoming}</h2></div>
        </div>
        <div className="tutor-schedule-summary-card tes-summary-closed">
          <span className="tes-summary-icon">🔒</span>
          <div><p>ปิดแล้ว</p><h2>{summary.closed}</h2></div>
        </div>
      </div>

      <div className="tes-content-card">
        <div className="tes-filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={filter === f.key ? 'tes-filter-active' : ''}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && <div className="tutor-schedule-loading">กำลังโหลดตารางสอบ...</div>}

        {!loading && error && (
          <div className="tes-error-box">
            <strong>เกิดข้อผิดพลาด</strong>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && eligibleCourses.length === 0 && (
          <div className="tutor-schedule-empty">
            <h2>ยังไม่มีคอร์สที่กำลังเรียน</h2>
            <p>สร้างข้อสอบได้เฉพาะคอร์สที่ขึ้นสถานะ "กำลังเรียน" เท่านั้น — รอให้คอร์สที่คุณสอนถึงวันเริ่มเรียนก่อน</p>
          </div>
        )}

        {!loading && !error && eligibleCourses.length > 0 && (
          <div className="tes-course-list">
            {eligibleCourses.map((course) => {
              const courseExams = (examsByCourse.get(String(course.id)) || []).filter(
                (e) => filter === 'ALL' || e.status === filter
              );
              return (
                <section key={course.id} id={`tes-course-${course.id}`} className="tes-course-panel">
                  <div className="tes-course-panel-header">
                    <div>
                      <span className="tes-course-panel-code">{safeText(course.courseCode)}</span>
                      <h3>{safeText(course.courseName)}</h3>
                    </div>
                    <button type="button" className="tes-btn-primary" onClick={() => openCreate(course.id)}>
                      + เพิ่มข้อสอบ
                    </button>
                  </div>

                  {courseExams.length === 0 ? (
                    <div className="tes-course-panel-empty">
                      ยังไม่มีข้อสอบ{filter !== 'ALL' ? 'ในสถานะนี้' : ''}สำหรับคอร์สนี้ — กด "+ เพิ่มข้อสอบ" เพื่อสร้างข้อสอบชุดแรก
                    </div>
                  ) : (
                    <div className="tes-grid">
                      {courseExams.map((exam) => (
                        <article key={exam.id} className="tes-card">
                          <div className="tes-card-top">
                            <div>
                              {exam.lessonTitle && (
                                <p className="tes-card-course">บท {safeText(exam.lessonTitle)}</p>
                              )}
                              <h3>{safeText(exam.title)}</h3>
                            </div>
                            <span className={getStatusClass(exam.status)}>
                              {STATUS_ICONS[exam.status] || ''} {STATUS_LABELS[exam.status] || exam.status}
                            </span>
                          </div>

                          {exam.description && <p className="tes-card-desc">{exam.description}</p>}

                          <div className="tes-info-list">
                            <div>
                              <span>เวลาเปิดสอบ</span>
                              <strong>{formatDateTime(exam.startTime)}</strong>
                            </div>
                            <div>
                              <span>เวลาปิดสอบ</span>
                              <strong>{formatDateTime(exam.endTime)}</strong>
                            </div>
                            <div>
                              <span>ระยะเวลาทำข้อสอบ</span>
                              <strong>{exam.durationMinutes ? `${exam.durationMinutes} นาที` : '-'}</strong>
                            </div>
                            <div>
                              <span>คะแนนเต็ม</span>
                              <strong>{exam.totalScore ?? '-'}</strong>
                            </div>
                          </div>

                          {exam.status === 'DRAFT' && !exam.startTime && (
                            <div className="tes-note">ยังไม่ได้กำหนดวัน-เวลาเปิดสอบ</div>
                          )}

                          <div className="tes-card-actions">
                            <button type="button" onClick={() => navigate(`/tutor/exams/${exam.id}/build`)}>
                              📝 จัดการคำถาม
                            </button>

                            {exam.status !== 'DRAFT' && (
                              <button type="button" onClick={() => navigate(`/tutor/exams/${exam.id}/grading`)}>
                                📊 ผลสอบ/ตรวจข้อสอบ
                              </button>
                            )}

                            {exam.status === 'DRAFT' && (
                              <button type="button" disabled={busyId === exam.id} onClick={() => handleOpen(exam.id)}>
                                เปิดสอบ
                              </button>
                            )}

                            {exam.status === 'OPEN' && (
                              <button type="button" disabled={busyId === exam.id} onClick={() => handleClose(exam.id)}>
                                ปิดสอบ
                              </button>
                            )}

                            {exam.status !== 'OPEN' && (
                              <button
                                type="button"
                                className="tes-btn-danger"
                                disabled={busyId === exam.id}
                                onClick={() => handleDelete(exam.id)}
                              >
                                ลบ
                              </button>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="tes-modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="tes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tes-modal-header">
              <h2>สร้างข้อสอบ</h2>
              <button type="button" onClick={() => setShowCreate(false)}>✕</button>
            </div>

            {!selectedCourse ? (
              <div className="tes-modal-empty">
                <p>ไม่พบคอร์สนี้ หรือคอร์สนี้ไม่ได้อยู่ในสถานะ "กำลังเรียน" แล้ว</p>
                <p>กรุณาปิดหน้าต่างนี้แล้วลองใหม่จาก card ของคอร์สนั้นอีกครั้ง</p>
                <div className="tes-form-actions">
                  <button type="button" onClick={() => setShowCreate(false)}>ปิด</button>
                </div>
              </div>
            ) : (
            <form className="tes-form" onSubmit={handleCreate}>
              <div className="tes-form-course-badge">
                คอร์ส: <strong>{safeText(selectedCourse?.courseName)}</strong>
              </div>

              <label>
                ประเภทข้อสอบ
                <input type="text" value={form.title} readOnly disabled />
                <span className="tes-lbl-hint">ตั้งชื่ออัตโนมัติตามลำดับการสอบของคอร์สนี้</span>
              </label>

              <label>
                รายละเอียด
                <textarea value={form.description} onChange={(e) => fld('description', e.target.value)} />
              </label>

              <label>
                คะแนนเต็ม *
                <input
                  type="number" min="0" step="0.5"
                  value={form.passingScore}
                  onChange={(e) => fld('passingScore', e.target.value)}
                />
              </label>

              <label>
                วันที่สอบ * <span className="tes-lbl-hint">(24 ชม.)</span>
                <DateTime24Input
                  value={form.startTime}
                  onChange={(v) => fld('startTime', v)}
                  minDate={minCreateDate}
                  allowedWeekdays={allowedWeekdays}
                />
                <span className="tes-lbl-hint">
                  เลือกได้เฉพาะวันที่คอร์สทำการเรียนการสอน ตั้งแต่วันนี้เป็นต้นไป — ย้อนหลังไม่ได้
                  {selectedCourse?.courseStartDate && ` (เริ่มเรียน ${formatDateShort(selectedCourse.courseStartDate)})`}
                </span>
              </label>

              <label>
                ระยะเวลาทำข้อสอบ (นาที) *
                <input
                  type="number" min="1" step="1"
                  value={form.durationMinutes}
                  onChange={(e) => fld('durationMinutes', e.target.value)}
                />
              </label>

              {formErr && <div className="tes-form-err">{formErr}</div>}

              <div className="tes-form-actions">
                <button type="button" onClick={() => setShowCreate(false)}>ยกเลิก</button>
                <button type="submit" className="tes-btn-primary" disabled={saving}>
                  {saving ? 'กำลังสร้าง...' : 'สร้างและไปเพิ่มคำถาม'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
