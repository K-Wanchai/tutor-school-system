import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  closeExam,
  createExam,
  deleteExam,
  getMyExamSchedule,
  openExam,
} from '../services/tutorExamService';
import { getMyCourses } from '../services/tutorCourseService';
import RefreshButton from '../components/RefreshButton';
import './TutorSchedulesPage.css';
import './TutorExamSchedulePage.css';

const STATUS_LABELS = {
  DRAFT: 'ยังไม่เปิดสอบ',
  OPEN: 'เปิดสอบอยู่',
  CLOSED: 'ปิดสอบแล้ว',
  CANCELLED: 'ยกเลิก',
};

const FILTERS = [
  { key: 'ALL', label: 'ทั้งหมด' },
  { key: 'OPEN', label: 'เปิดสอบอยู่' },
  { key: 'DRAFT', label: 'ยังไม่เปิด' },
  { key: 'CLOSED', label: 'ปิดแล้ว' },
];

const EMPTY_FORM = {
  courseId: '',
  lessonId: '',
  title: '',
  description: '',
  passingScore: '',
  startTime: '',
  endTime: '',
  durationMinutes: '',
  allowMultipleAttempts: false,
  maxAttempts: '',
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

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES_5 = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

// เลือกวัน-เวลาแบบ 24 ชม. เอง แทน <input type="datetime-local"> เพราะ picker ของเบราว์เซอร์
// จะโชว์ AM/PM ตาม locale ของเครื่อง ควบคุมให้เป็น 24 ชม. เสมอไม่ได้ผ่าน HTML attribute
function DateTime24Input({ value, onChange }) {
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
      <input
        type="date"
        value={datePart}
        onChange={(e) => emit(e.target.value, hour || '00', minute || '00')}
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

  const filtered = useMemo(() => {
    if (filter === 'ALL') return exams;
    return exams.filter((e) => e.status === filter);
  }, [exams, filter]);

  const selectedCourse = courses.find((c) => String(c.id) === String(form.courseId));
  const lessonsOfSelectedCourse = selectedCourse?.lessons || [];

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormErr('');
    setShowCreate(true);
  }

  function fld(key, value) {
    setForm((f) => ({ ...f, [key]: value, ...(key === 'courseId' ? { lessonId: '' } : {}) }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.courseId) return setFormErr('กรุณาเลือกคอร์ส');
    if (!form.lessonId) return setFormErr('กรุณาเลือกบทเรียน — ข้อสอบต้องผูกกับบทเรียนเสมอ');
    if (!form.title.trim()) return setFormErr('กรุณากรอกชื่อข้อสอบ');
    if (form.passingScore === '' || Number.isNaN(Number(form.passingScore))) {
      return setFormErr('กรุณากรอกคะแนนผ่าน');
    }

    setSaving(true);
    setFormErr('');
    try {
      const created = await createExam({
        courseId: Number(form.courseId),
        lessonId: Number(form.lessonId),
        title: form.title.trim(),
        description: form.description.trim() || null,
        passingScore: Number(form.passingScore),
        startTime: toIsoOrNull(form.startTime),
        endTime: toIsoOrNull(form.endTime),
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        allowMultipleAttempts: form.allowMultipleAttempts,
        maxAttempts: form.maxAttempts ? Number(form.maxAttempts) : null,
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
    if (!window.confirm('ยืนยันลบข้อสอบนี้? การกระทำนี้ย้อนกลับไม่ได้')) return;
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
      <div className="tutor-schedule-header">
        <div>
          <h1>ตารางสอบ</h1>
          <p>สร้างและจัดการข้อสอบของทุกคอร์สที่คุณสอน — ข้อสอบทุกชุดผูกกับบทเรียนที่สอบหลังเรียนจบ</p>
        </div>
        <div className="tes-header-actions">
          <button type="button" className="tes-btn-primary" onClick={openCreate}>+ สร้างข้อสอบ</button>
          <RefreshButton onClick={load} loading={loading} />
        </div>
      </div>

      <div className="tutor-schedule-summary">
        <div className="tutor-schedule-summary-card"><p>ข้อสอบทั้งหมด</p><h2>{summary.total}</h2></div>
        <div className="tutor-schedule-summary-card"><p>เปิดสอบอยู่</p><h2>{summary.open}</h2></div>
        <div className="tutor-schedule-summary-card"><p>ยังไม่เปิด</p><h2>{summary.upcoming}</h2></div>
        <div className="tutor-schedule-summary-card"><p>ปิดแล้ว</p><h2>{summary.closed}</h2></div>
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
            <p>กด "+ สร้างข้อสอบ" เพื่อสร้างข้อสอบชุดแรกให้บทเรียนของคุณ</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="tes-grid">
            {filtered.map((exam) => (
              <article key={exam.id} className="tes-card">
                <div className="tes-card-top">
                  <div>
                    <p className="tes-card-course">
                      {safeText(exam.courseName)}{exam.lessonTitle ? ` · บท ${safeText(exam.lessonTitle)}` : ''}
                    </p>
                    <h3>{safeText(exam.title)}</h3>
                  </div>
                  <span className={getStatusClass(exam.status)}>
                    {STATUS_LABELS[exam.status] || exam.status}
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
                    <span>คะแนนเต็ม / ผ่าน</span>
                    <strong>{exam.totalScore ?? '-'} / {exam.passingScore ?? '-'}</strong>
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
      </div>

      {showCreate && (
        <div className="tes-modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="tes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tes-modal-header">
              <h2>สร้างข้อสอบใหม่</h2>
              <button type="button" onClick={() => setShowCreate(false)}>✕</button>
            </div>

            <form className="tes-form" onSubmit={handleCreate}>
              <label>
                คอร์ส *
                <select value={form.courseId} onChange={(e) => fld('courseId', e.target.value)}>
                  <option value="">— เลือกคอร์ส —</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.courseName}</option>
                  ))}
                </select>
              </label>

              <label>
                บทเรียน * <span className="tes-lbl-hint">(สอบหลังเรียนจบบทนี้)</span>
                <select
                  value={form.lessonId}
                  onChange={(e) => fld('lessonId', e.target.value)}
                  disabled={!form.courseId}
                >
                  <option value="">— เลือกบทเรียน —</option>
                  {lessonsOfSelectedCourse.map((l) => (
                    <option key={l.id} value={l.id}>บทที่ {l.lessonOrder}: {l.lessonTitle}</option>
                  ))}
                </select>
                {form.courseId && lessonsOfSelectedCourse.length === 0 && (
                  <span className="tes-lbl-hint">คอร์สนี้ยังไม่มีบทเรียน กรุณาเพิ่มบทเรียนก่อน</span>
                )}
              </label>

              <label>
                ชื่อข้อสอบ *
                <input value={form.title} onChange={(e) => fld('title', e.target.value)} placeholder="เช่น แบบทดสอบท้ายบทที่ 1" />
              </label>

              <label>
                รายละเอียด
                <textarea value={form.description} onChange={(e) => fld('description', e.target.value)} />
              </label>

              <div className="tes-form-row">
                <label>
                  คะแนนผ่าน *
                  <input
                    type="number" min="0" step="0.5"
                    value={form.passingScore}
                    onChange={(e) => fld('passingScore', e.target.value)}
                  />
                </label>

                <label>
                  ระยะเวลาทำข้อสอบ (นาที)
                  <input
                    type="number" min="1"
                    value={form.durationMinutes}
                    onChange={(e) => fld('durationMinutes', e.target.value)}
                  />
                </label>
              </div>

              <div className="tes-form-row">
                <label>
                  เวลาเปิดสอบ <span className="tes-lbl-hint">(24 ชม.)</span>
                  <DateTime24Input value={form.startTime} onChange={(v) => fld('startTime', v)} />
                </label>

                <label>
                  เวลาปิดสอบ <span className="tes-lbl-hint">(24 ชม.)</span>
                  <DateTime24Input value={form.endTime} onChange={(v) => fld('endTime', v)} />
                </label>
              </div>

              <label className="tes-checkbox-row">
                <input
                  type="checkbox"
                  checked={form.allowMultipleAttempts}
                  onChange={(e) => fld('allowMultipleAttempts', e.target.checked)}
                />
                อนุญาตให้ทำข้อสอบซ้ำได้หลายครั้ง
              </label>

              {form.allowMultipleAttempts && (
                <label>
                  จำนวนครั้งสูงสุด
                  <input
                    type="number" min="1"
                    value={form.maxAttempts}
                    onChange={(e) => fld('maxAttempts', e.target.value)}
                  />
                </label>
              )}

              {formErr && <div className="tes-form-err">{formErr}</div>}

              <div className="tes-form-actions">
                <button type="button" onClick={() => setShowCreate(false)}>ยกเลิก</button>
                <button type="submit" className="tes-btn-primary" disabled={saving}>
                  {saving ? 'กำลังสร้าง...' : 'สร้างและไปเพิ่มคำถาม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
