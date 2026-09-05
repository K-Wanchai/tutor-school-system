import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createExam,
  deleteExam,
  getExamsByCourse,
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
  examLink: '',
  totalScore: '',
  durationMinutes: '',
  examDate: '',
  examTime: '',
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

function toIsoOrNull(dateIso, timeHHmm) {
  return dateIso && timeHHmm ? `${dateIso}T${timeHHmm}:00` : null;
}

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// บวกนาทีให้ dateIso+timeHHmm แบบ naive (ไม่มี timezone) คืนเป็น ISO string ให้ backend
function addMinutesToIso(dateIso, timeHHmm, minutes) {
  const [y, m, d] = dateIso.split('-').map(Number);
  const [h, min] = timeHHmm.split(':').map(Number);
  const dt = new Date(y, m - 1, d, h, min);
  dt.setMinutes(dt.getMinutes() + minutes);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`;
}

const MINUTE_STEP = 5;

// ช่วงเวลาเรียนของคอร์สที่ตรงกับวันในสัปดาห์ของ dateIso (เช่น "2026-01-05") — ถ้าคอร์สไม่มีข้อมูลตารางสอน
// เลยปล่อยให้เลือกได้เต็มวัน ต้องตรงกับ validateExamSchedule() ฝั่ง backend (ซึ่งก็ข้ามเช็คถ้าไม่มีข้อมูลเช่นกัน)
function findScheduleSlotForDate(course, dateIso) {
  if (!dateIso) return null;
  if (!course?.scheduleDays?.length) return { startTime: '00:00', endTime: '23:59' };
  const [y, m, d] = dateIso.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  return course.scheduleDays.find((s) => DAY_CODE_TO_WEEKDAY[s.dayOfWeek] === weekday) || null;
}

// รายการเวลาเริ่มสอบที่เลือกได้จริงสำหรับวันนี้ (ทุก 5 นาที) — ต้องอยู่ในช่วงเวลาเรียนของคอร์สวันนั้น,
// สอบจบไม่เกินเวลาเลิกเรียน, เป็นอนาคตเท่านั้น (ถ้าเป็นวันนี้), และไม่ทับเวลากับข้อสอบอื่นของคอร์สเดียวกัน —
// บล็อกไว้ตั้งแต่ตอนเลือกเลยแทนที่จะให้เลือกแล้วค่อยเช็ค ต้องตรงกับ validateExamSchedule() ฝั่ง backend
function computeAvailableStartTimes({ course, dateIso, durationMinutes, otherExams, excludeExamId }) {
  const duration = Number(durationMinutes);
  if (!dateIso || !duration || duration <= 0) return [];
  const slot = findScheduleSlotForDate(course, dateIso);
  if (!slot) return [];

  const slotStart = timeToMinutes(slot.startTime);
  const slotEnd = timeToMinutes(slot.endTime);
  const isToday = dateIso === todayIso();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const times = [];
  for (let m = slotStart; m + duration <= slotEnd; m += MINUTE_STEP) {
    if (isToday && m <= nowMinutes) continue;
    const hhmm = minutesToTime(m);
    const candidateStart = new Date(`${dateIso}T${hhmm}:00`);
    const candidateEnd = new Date(candidateStart.getTime() + duration * 60000);
    const overlaps = otherExams.some((e) => {
      if (excludeExamId && String(e.id) === String(excludeExamId)) return false;
      if (e.status === 'CANCELLED') return false;
      if (!e.startTime || !e.endTime) return false;
      if (e.startTime.slice(0, 10) !== dateIso) return false;
      const otherStart = new Date(e.startTime);
      const otherEnd = new Date(e.endTime);
      return candidateStart < otherEnd && otherStart < candidateEnd;
    });
    if (!overlaps) times.push(hhmm);
  }
  return times;
}

// เลือกวันที่ + เวลาเริ่มสอบ — ตัวเลือกชั่วโมง/นาทีมีเฉพาะเวลาที่ availableTimes อนุญาตเท่านั้น
// (อยู่ในช่วงเวลาเรียนของคอร์สวันนั้น และไม่ชนกับข้อสอบอื่น) เลือกเวลาที่ไม่ได้จะกดไม่ได้ตั้งแต่แรก
function ExamDateTimePicker({ dateValue, timeValue, onDateChange, onTimeChange, minDate, allowedWeekdays, availableTimes, timeSelectHint }) {
  const hours = useMemo(
    () => Array.from(new Set(availableTimes.map((t) => t.split(':')[0]))).sort(),
    [availableTimes]
  );
  const minutesForHour = useMemo(
    () => availableTimes.filter((t) => t.split(':')[0] === timeValue?.split(':')[0]).map((t) => t.split(':')[1]),
    [availableTimes, timeValue]
  );
  const [hour, minute] = timeValue ? timeValue.split(':') : ['', ''];
  const timeDisabled = availableTimes.length === 0;

  function emitTime(nextHour, nextMinute) {
    if (!nextHour || !nextMinute) {
      onTimeChange('');
      return;
    }
    onTimeChange(`${nextHour}:${nextMinute}`);
  }

  return (
    <div>
      <div className="tes-datetime24">
        <CalendarDateInput
          value={dateValue}
          onChange={onDateChange}
          minDate={minDate}
          allowedWeekdays={allowedWeekdays}
        />
        <select
          value={hour}
          disabled={timeDisabled}
          onChange={(e) => {
            const nextHour = e.target.value;
            const minsForNextHour = availableTimes.filter((t) => t.split(':')[0] === nextHour).map((t) => t.split(':')[1]);
            emitTime(nextHour, minsForNextHour[0] || '');
          }}
        >
          <option value="">ชม.</option>
          {hours.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        <span>:</span>
        <select value={minute} disabled={timeDisabled || !hour} onChange={(e) => emitTime(hour, e.target.value)}>
          <option value="">นาที</option>
          {minutesForHour.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <span className="tes-lbl-hint">{timeSelectHint}</span>
    </div>
  );
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

  const availableTimes = useMemo(
    () => computeAvailableStartTimes({
      course,
      dateIso: form.examDate,
      durationMinutes: form.durationMinutes,
      otherExams: exams,
      excludeExamId: editingExamId,
    }),
    [course, form.examDate, form.durationMinutes, exams, editingExamId]
  );

  const activeSlot = findScheduleSlotForDate(course, form.examDate);

  let timeSelectHint;
  if (!form.durationMinutes || Number(form.durationMinutes) <= 0) {
    timeSelectHint = 'กรอกระยะเวลาทำข้อสอบก่อน จึงจะเลือกเวลาสอบได้';
  } else if (!form.examDate) {
    timeSelectHint = 'เลือกวันที่สอบก่อน จึงจะเลือกเวลาสอบได้';
  } else if (availableTimes.length === 0) {
    timeSelectHint = activeSlot
      ? `ไม่มีช่วงเวลาว่างในวันนี้ที่พอสำหรับระยะเวลาสอบนี้ (เวลาเรียนวันนี้: ${activeSlot.startTime} - ${activeSlot.endTime})`
      : 'ไม่มีช่วงเวลาว่างในวันนี้';
  } else {
    timeSelectHint = activeSlot
      ? `เลือกได้เฉพาะเวลาที่ว่างในช่วงเวลาเรียนของคอร์สนี้ (${activeSlot.startTime} - ${activeSlot.endTime})`
      : 'เลือกได้เฉพาะเวลาที่ว่างเท่านั้น';
  }

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
      examLink: exam.examLink || '',
      totalScore: exam.totalScore != null ? String(exam.totalScore) : '',
      durationMinutes: exam.durationMinutes != null ? String(exam.durationMinutes) : '',
      examDate: exam.startTime ? exam.startTime.slice(0, 10) : '',
      examTime: exam.startTime ? exam.startTime.slice(11, 16) : '',
    });
    setFormErr('');
    setShowForm(true);
  }

  function fld(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // เปลี่ยนวันที่/ระยะเวลาแล้วต้องล้างเวลาที่เลือกไว้เสมอ เพราะช่วงเวลาที่เลือกได้ (availableTimes) เปลี่ยนไป
  function handleDateChange(value) {
    setForm((f) => ({ ...f, examDate: value, examTime: '' }));
  }

  function handleDurationChange(value) {
    setForm((f) => ({ ...f, durationMinutes: value, examTime: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title) return setFormErr('ไม่พบชื่อประเภทข้อสอบ กรุณาปิดแล้วลองใหม่');
    if (!form.examLink.trim()) return setFormErr('กรุณากรอกลิงก์ข้อสอบ');
    if (form.totalScore === '' || Number.isNaN(Number(form.totalScore))) {
      return setFormErr('กรุณากรอกคะแนนเต็ม');
    }
    if (form.durationMinutes === '' || Number(form.durationMinutes) <= 0) {
      return setFormErr('กรุณากรอกระยะเวลาทำข้อสอบ (นาที)');
    }
    if (!form.examDate || !form.examTime) return setFormErr('กรุณาเลือกวันที่และเวลาสอบ');
    if (!course) return setFormErr('ไม่พบข้อมูลคอร์ส');

    const startTime = toIsoOrNull(form.examDate, form.examTime);
    const endTime = addMinutesToIso(form.examDate, form.examTime, Number(form.durationMinutes));

    setSaving(true);
    setFormErr('');
    try {
      if (editingExamId) {
        await updateExam(editingExamId, {
          description: form.description.trim() || null,
          examLink: form.examLink.trim(),
          totalScore: Number(form.totalScore),
          startTime,
          endTime,
          durationMinutes: Number(form.durationMinutes),
        });
      } else {
        await createExam({
          courseId: Number(courseId),
          title: form.title,
          description: form.description.trim() || null,
          examLink: form.examLink.trim(),
          totalScore: Number(form.totalScore),
          startTime,
          endTime,
          durationMinutes: Number(form.durationMinutes),
          shuffleQuestions: false,
          showScoreAfterSubmit: true,
          showCorrectAnswersAfterSubmit: false,
        });
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormErr(err.message);
    } finally {
      setSaving(false);
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
          <p>ข้อสอบของคอร์สนี้อ้างอิงลิงก์จากภายนอก (เช่น Google Form) — เปิด/ปิดสอบอัตโนมัติตามวันเวลาที่ตั้งไว้</p>
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
                    <p className="tes-card-course">
                      {safeText(exam.examCode)}{exam.lessonTitle ? ` · บท ${safeText(exam.lessonTitle)}` : ''}
                    </p>
                    <h3>{safeText(exam.title)}</h3>
                  </div>
                  <span className={getStatusClass(exam.status)}>
                    {STATUS_ICONS[exam.status] || ''} {STATUS_LABELS[exam.status] || exam.status}
                  </span>
                </div>

                {exam.description && <p className="tes-card-desc">{exam.description}</p>}

                {exam.examLink && (
                  <a className="tes-exam-link" href={exam.examLink} target="_blank" rel="noreferrer">
                    🔗 เปิดลิงก์ข้อสอบ
                  </a>
                )}

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

                <div className="tes-card-actions">
                  {exam.status !== 'OPEN' && (
                    <button type="button" onClick={() => openEdit(exam)}>
                      ✏️ แก้ไข
                    </button>
                  )}

                  {exam.status !== 'DRAFT' && (
                    <button type="button" onClick={() => navigate(`/tutor/exams/${exam.id}/grading`)}>
                      📊 ผลสอบ/ตรวจข้อสอบ
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
              <h2>{editingExamId ? 'แก้ไขข้อสอบ' : 'สร้างข้อสอบ'}</h2>
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
                ลิงก์ข้อสอบ * <span className="tes-lbl-hint">(เช่น Google Form)</span>
                <input
                  type="url"
                  placeholder="https://forms.google.com/..."
                  value={form.examLink}
                  onChange={(e) => fld('examLink', e.target.value)}
                />
              </label>

              <label>
                รายละเอียด
                <textarea value={form.description} onChange={(e) => fld('description', e.target.value)} />
              </label>

              <label>
                คะแนนเต็ม *
                <input
                  type="number" min="0" step="0.5"
                  value={form.totalScore}
                  onChange={(e) => fld('totalScore', e.target.value)}
                />
              </label>

              <label>
                ระยะเวลาทำข้อสอบ (นาที) *
                <input
                  type="number" min="1" step="1"
                  value={form.durationMinutes}
                  onChange={(e) => handleDurationChange(e.target.value)}
                />
              </label>

              <label>
                วันที่และเวลาสอบ *
                <ExamDateTimePicker
                  dateValue={form.examDate}
                  timeValue={form.examTime}
                  onDateChange={handleDateChange}
                  onTimeChange={(v) => fld('examTime', v)}
                  minDate={minFormDate}
                  allowedWeekdays={allowedWeekdays}
                  availableTimes={availableTimes}
                  timeSelectHint={timeSelectHint}
                />
              </label>

              {formErr && <div className="tes-form-err">{formErr}</div>}

              <div className="tes-form-actions">
                <button type="button" onClick={() => setShowForm(false)}>ยกเลิก</button>
                <button type="submit" className="tes-btn-primary" disabled={saving}>
                  {saving ? 'กำลังบันทึก...' : editingExamId ? 'บันทึกการแก้ไข' : 'สร้างข้อสอบ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
