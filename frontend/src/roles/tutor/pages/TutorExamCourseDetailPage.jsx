import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  closeExam,
  createExam,
  deleteExam,
  getExamsByCourse,
  openExam,
  updateExam,
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

// จัดตารางสอบได้เฉพาะคอร์สที่สถานะ ONGOING (เปิดทำการเรียนการสอนแล้ว) — ต้องตรงกับ
// CourseStatus.java ฝั่ง backend และ validateCourseIsOngoing() ใน ExamServiceImpl
const EXAM_ELIGIBLE_COURSE_STATUS = 'ONGOING';

// แปลงรหัสวัน backend (MON/TUE/...) เป็นเลขวันของ Date.getDay() (0=อาทิตย์...6=เสาร์)
const DAY_CODE_TO_WEEKDAY = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const EMPTY_FORM = {
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

function getStatusClass(status) {
  return `tes-status tes-status-${String(status || 'unknown').toLowerCase()}`;
}

// input datetime-local ใช้ "YYYY-MM-DDTHH:mm" ไม่มี timezone/seconds — แปลงเป็น ISO ให้ backend
function toIsoOrNull(localDateTimeValue) {
  return localDateTimeValue ? `${localDateTimeValue}:00` : null;
}

// แปลง ISO ("2026-01-05T10:00:00") ที่ backend คืนมาเป็นค่า "YYYY-MM-DDTHH:mm" ให้ฟอร์มใช้แก้ไขต่อได้
function toLocalInputValue(isoValue) {
  if (!isoValue) return '';
  return isoValue.slice(0, 16);
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

// ช่วงเวลาเรียนของคอร์สที่ตรงกับวันในสัปดาห์ของ dateIso (เช่น "2026-01-05") — ใช้ตรวจว่าเวลาสอบที่เลือก
// อยู่ในช่วงเวลาเรียนของวันนั้นไหม ต้องตรงกับ validateExamSchedule() ฝั่ง backend
function findScheduleSlotForDate(course, dateIso) {
  if (!dateIso || !course?.scheduleDays?.length) return null;
  const [y, m, d] = dateIso.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  return course.scheduleDays.find((s) => DAY_CODE_TO_WEEKDAY[s.dayOfWeek] === weekday) || null;
}

// ตรวจกำหนดการสอบทั้งชุดฝั่ง frontend คู่กับ validateExamSchedule() ฝั่ง backend — กันไว้ก่อนยิง API
// เพื่อ UX ที่ดีกว่า (backend ยังคงเป็นคนบังคับจริงเผื่อ bypass มาตรงๆ)
function validateExamTiming({ startTime, durationMinutes, course, otherExams, excludeExamId }) {
  const startInstant = new Date(startTime);
  if (Number.isNaN(startInstant.getTime()) || startInstant <= new Date()) {
    return 'วันเวลาที่เปิดสอบต้องเป็นเวลาในอนาคตเท่านั้น';
  }
  const [startDatePart, startTimePart] = startTime.split('T');
  if (course.courseStartDate && startDatePart < course.courseStartDate) {
    return 'วันที่เปิดสอบต้องไม่ก่อนวันที่เปิดเรียนของคอร์ส';
  }

  const slot = findScheduleSlotForDate(course, startDatePart);
  if (course.scheduleDays?.length && !slot) {
    return 'วันที่เปิดสอบต้องตรงกับวันที่คอร์สนี้ทำการเรียนการสอนเท่านั้น';
  }

  const endLocal = addMinutesToLocalDateTimeString(startTime, Number(durationMinutes));
  const [endDatePart, endTimePartFull] = endLocal.split('T');
  const endTimeHHmm = endTimePartFull.slice(0, 5);

  if (endDatePart !== startDatePart) {
    return 'ระยะเวลาสอบต้องอยู่ภายในวันเดียวกับวันที่เปิดสอบ';
  }
  if (slot && (startTimePart < slot.startTime || endTimeHHmm > slot.endTime)) {
    return `เวลาสอบต้องอยู่ในช่วงเวลาเรียนของคอร์สนี้ (${slot.startTime} - ${slot.endTime}) เท่านั้น`;
  }

  const newStart = startInstant;
  const newEnd = new Date(endLocal);
  const overlaps = otherExams.some((e) => {
    if (excludeExamId && String(e.id) === String(excludeExamId)) return false;
    if (e.status === 'CANCELLED') return false;
    if (!e.startTime || !e.endTime) return false;
    if (e.startTime.slice(0, 10) !== startDatePart) return false;
    const otherStart = new Date(e.startTime);
    const otherEnd = new Date(e.endTime);
    return newStart < otherEnd && otherStart < newEnd;
  });
  if (overlaps) {
    return 'มีข้อสอบอื่นของคอร์สนี้ในวันเดียวกันที่เวลาซ้อนทับกันอยู่แล้ว';
  }

  return null;
}

export default function TutorExamCourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { confirm, confirmDialog } = useConfirm();

  const [course, setCourse] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [busyId, setBusyId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const [courses, examData] = await Promise.all([getMyCourses(), getExamsByCourse(courseId)]);
      const found = courses.find((c) => String(c.id) === String(courseId)) || null;
      setCourse(found);
      const sorted = [...examData].sort((a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return new Date(a.startTime) - new Date(b.startTime);
      });
      setExams(sorted);
    } catch (err) {
      setError(err.message);
      setExams([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // มาจากปุ่ม "ตารางสอบ" ในหน้าคอร์สของฉัน — เปิดฟอร์มสร้างข้อสอบให้ทันทีที่เข้าหน้านี้
  useEffect(() => {
    if (searchParams.get('create') === '1' && course?.status === EXAM_ELIGIBLE_COURSE_STATUS) {
      openCreate();
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('create');
        return next;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course]);

  const filtered = useMemo(
    () => exams.filter((e) => filter === 'ALL' || e.status === filter),
    [exams, filter]
  );

  const summary = useMemo(() => ({
    total: exams.length,
    open: exams.filter((e) => e.status === 'OPEN').length,
    upcoming: exams.filter((e) => e.status === 'DRAFT').length,
    closed: exams.filter((e) => e.status === 'CLOSED').length,
  }), [exams]);

  const allowedWeekdays = course?.scheduleDays?.length
    ? course.scheduleDays.map((s) => DAY_CODE_TO_WEEKDAY[s.dayOfWeek]).filter((n) => n !== undefined)
    : undefined;

  const minFormDate = course?.courseStartDate
    ? (course.courseStartDate > todayIso() ? course.courseStartDate : todayIso())
    : todayIso();

  const activeSlot = findScheduleSlotForDate(course, form.startTime?.split('T')[0]);

  function openCreate() {
    setEditingExamId(null);
    setForm({ ...EMPTY_FORM, title: `การสอบครั้งที่ ${exams.length + 1}` });
    setFormErr('');
    setShowForm(true);
  }

  function openEdit(exam) {
    setEditingExamId(exam.id);
    setForm({
      title: exam.title || '',
      description: exam.description || '',
      passingScore: exam.passingScore != null ? String(exam.passingScore) : '',
      startTime: toLocalInputValue(exam.startTime),
      durationMinutes: exam.durationMinutes != null ? String(exam.durationMinutes) : '',
    });
    setFormErr('');
    setShowForm(true);
  }

  function fld(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title) return setFormErr('ไม่พบชื่อประเภทข้อสอบ กรุณาปิดแล้วลองใหม่');
    if (form.passingScore === '' || Number.isNaN(Number(form.passingScore))) {
      return setFormErr('กรุณากรอกคะแนนเต็ม');
    }
    if (!form.startTime) return setFormErr('กรุณาเลือกวันที่และเวลาสอบ');
    if (form.durationMinutes === '' || Number(form.durationMinutes) <= 0) {
      return setFormErr('กรุณากรอกระยะเวลาทำข้อสอบ (นาที)');
    }
    if (!course) return setFormErr('ไม่พบข้อมูลคอร์ส');

    const timingError = validateExamTiming({
      startTime: form.startTime,
      durationMinutes: form.durationMinutes,
      course,
      otherExams: exams,
      excludeExamId: editingExamId,
    });
    if (timingError) return setFormErr(timingError);

    const endTime = addMinutesToLocalDateTimeString(form.startTime, Number(form.durationMinutes));

    setSaving(true);
    setFormErr('');
    try {
      if (editingExamId) {
        await updateExam(editingExamId, {
          description: form.description.trim() || null,
          passingScore: Number(form.passingScore),
          startTime: toIsoOrNull(form.startTime),
          endTime,
          durationMinutes: Number(form.durationMinutes),
        });
        setShowForm(false);
        await load();
      } else {
        const created = await createExam({
          courseId: Number(courseId),
          title: form.title,
          description: form.description.trim() || null,
          passingScore: Number(form.passingScore),
          startTime: toIsoOrNull(form.startTime),
          endTime,
          durationMinutes: Number(form.durationMinutes),
          shuffleQuestions: false,
          showScoreAfterSubmit: true,
          showCorrectAnswersAfterSubmit: false,
        });
        setShowForm(false);
        navigate(`/tutor/exams/${created.id}/build`);
      }
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

  if (!loading && !error && course && course.status !== EXAM_ELIGIBLE_COURSE_STATUS) {
    return (
      <div className="tes-page">
        <div className="tes-error-box">
          <strong>คอร์สนี้ไม่ได้อยู่ในสถานะ "กำลังเรียน"</strong>
          <p>จัดตารางสอบได้เฉพาะคอร์สที่กำลังเรียนเท่านั้น</p>
          <button type="button" className="tes-btn-primary" onClick={() => navigate('/tutor/exam-schedule')}>
            กลับไปหน้าตารางสอบ
          </button>
        </div>
      </div>
    );
  }

  if (!loading && !error && !course) {
    return (
      <div className="tes-page">
        <div className="tes-error-box">
          <strong>ไม่พบคอร์สนี้</strong>
          <button type="button" className="tes-btn-primary" onClick={() => navigate('/tutor/exam-schedule')}>
            กลับไปหน้าตารางสอบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tes-page">
      {confirmDialog}

      <div className="tutor-schedule-header">
        <div>
          <button type="button" className="tes-back-link" onClick={() => navigate('/tutor/exam-schedule')}>
            ‹ กลับไปหน้าตารางสอบ
          </button>
          <h1>{safeText(course?.courseCode)} — {safeText(course?.courseName)}</h1>
          <p>สร้างและจัดการข้อสอบของคอร์สนี้ — สร้างได้เฉพาะช่วงเวลาที่คอร์สนี้ทำการเรียนการสอนเท่านั้น</p>
        </div>
        <div className="tes-header-actions">
          <button type="button" className="tes-btn-primary" onClick={openCreate}>+ เพิ่มข้อสอบ</button>
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

        {!loading && !error && filtered.length === 0 && (
          <div className="tutor-schedule-empty">
            <h2>ยังไม่มีข้อสอบ</h2>
            <p>กด "+ เพิ่มข้อสอบ" เพื่อสร้างข้อสอบชุดแรกของคอร์สนี้</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="tes-grid">
            {filtered.map((exam) => (
              <article key={exam.id} className="tes-card">
                <div className="tes-card-top">
                  <div>
                    {exam.lessonTitle && <p className="tes-card-course">บท {safeText(exam.lessonTitle)}</p>}
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

                  {exam.status !== 'OPEN' && (
                    <button type="button" onClick={() => openEdit(exam)}>
                      ✏️ แก้ไขวันเวลา
                    </button>
                  )}

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
      </div>

      {showForm && course && (
        <div className="tes-modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="tes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tes-modal-header">
              <h2>{editingExamId ? 'แก้ไขวันเวลาสอบ' : 'สร้างข้อสอบ'}</h2>
              <button type="button" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form className="tes-form" onSubmit={handleSubmit}>
              <div className="tes-form-course-badge">
                คอร์ส: <strong>{safeText(course.courseName)}</strong>
              </div>

              <label>
                ประเภทข้อสอบ
                <input type="text" value={form.title} readOnly disabled />
                {!editingExamId && (
                  <span className="tes-lbl-hint">ตั้งชื่ออัตโนมัติตามลำดับการสอบของคอร์สนี้</span>
                )}
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
                  minDate={minFormDate}
                  allowedWeekdays={allowedWeekdays}
                />
                <span className="tes-lbl-hint">
                  เลือกได้เฉพาะวันที่คอร์สทำการเรียนการสอน ตั้งแต่วันนี้เป็นต้นไป — ย้อนหลังไม่ได้
                  {activeSlot && ` (เวลาเรียนวันนี้: ${activeSlot.startTime} - ${activeSlot.endTime})`}
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
                <button type="button" onClick={() => setShowForm(false)}>ยกเลิก</button>
                <button type="submit" className="tes-btn-primary" disabled={saving}>
                  {saving ? 'กำลังบันทึก...' : editingExamId ? 'บันทึกการแก้ไข' : 'สร้างและไปเพิ่มคำถาม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
