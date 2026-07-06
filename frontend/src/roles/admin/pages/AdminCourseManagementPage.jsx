import { useCallback, useEffect, useState } from 'react';
import { getTutors } from '../services/adminTutorService';
import {
  createCourse,
  deleteCourse,
  getCourseStats,
  getCourses,
  getTutorWeeklyAvailability,
  updateCourse,
  updateCourseStatus,
} from '../services/adminCourseService';
import './AdminCourseManagementPage.css';

// ──────────────── helpers ────────────────
const STATUS_LABEL = {
  DRAFT:                 { label: 'รอติวเตอร์ตอบรับ', cls: 'cm-badge-draft' },
  ACCEPTED:              { label: 'กำลังจัดทำเนื้อหา', cls: 'cm-badge-draft' },
  OPEN_FOR_REGISTRATION: { label: 'เปิดรับสมัคร',  cls: 'cm-badge-open' },
  CLOSED:                { label: 'ปิดรับสมัคร',   cls: 'cm-badge-closed' },
  ONGOING:               { label: 'กำลังสอน',       cls: 'cm-badge-ongoing' },
  COMPLETED:             { label: 'สอนจบ',           cls: 'cm-badge-completed' },
  CANCELLED:             { label: 'ยกเลิก',          cls: 'cm-badge-cancelled' },
};

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] || { label: status, cls: '' };
  return <span className={`cm-badge ${s.cls}`}>{s.label}</span>;
}

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`cm-toast cm-toast-${type}`}>
      <span>{msg}</span>
      <button onClick={onClose}>✕</button>
    </div>
  );
}

function genCourseCode() {
  const now = new Date();
  const yy  = String(now.getFullYear()).slice(2);
  const mm  = String(now.getMonth() + 1).padStart(2, '0');
  const rnd = Math.floor(Math.random() * 900 + 100);
  return `CRS-${yy}${mm}-${rnd}`;
}

const DAYS = [
  { key: 'MON', label: 'จ' },
  { key: 'TUE', label: 'อ' },
  { key: 'WED', label: 'พ' },
  { key: 'THU', label: 'พฤ' },
  { key: 'FRI', label: 'ศ' },
  { key: 'SAT', label: 'ส' },
  { key: 'SUN', label: 'อา' },
];

const DAY_LABEL_TH = { MON:'จันทร์', TUE:'อังคาร', WED:'พุธ', THU:'พฤหัส', FRI:'ศุกร์', SAT:'เสาร์', SUN:'อาทิตย์' };

// รูปแบบใหม่: "MON:10:00-12:00,WED:13:00-15:00"
function parseDaySlots(str) {
  if (!str) return {};
  const slots = {};
  str.split(',').filter(Boolean).forEach(part => {
    const colonIdx = part.indexOf(':');
    if (colonIdx > 0 && colonIdx < part.length - 1) {
      const day = part.slice(0, colonIdx);
      const timeRange = part.slice(colonIdx + 1);
      const dashIdx = timeRange.lastIndexOf('-');
      slots[day] = dashIdx > 0
        ? { start: timeRange.slice(0, dashIdx), end: timeRange.slice(dashIdx + 1) }
        : { start: timeRange, end: '' };
    } else {
      // old format (just day name)
      slots[part] = { start: '', end: '' };
    }
  });
  return slots;
}

function encodeDaySlots(slots) {
  return DAYS.map(d => d.key)
    .filter(k => k in slots)
    .map(k => {
      const { start, end } = slots[k];
      return start && end ? `${k}:${start}-${end}` : k;
    })
    .join(',');
}

// compat: ใช้ใน detail modal
function parseDays(str) {
  if (!str) return [];
  return str.split(',').filter(Boolean).map(p => p.split(':')[0]);
}

function formatTimeRange(digits) {
  // digits = สูงสุด 8 ตัว → HH:MM - HH:MM
  const d = digits.slice(0, 8);
  let out = '';
  if (d.length >= 1) out += d.slice(0, 2).padEnd(d.length < 2 ? d.length : 2, '');
  if (d.length >= 3) out += ':' + d.slice(2, 4).padEnd(d.length < 4 ? d.length - 2 : 2, '');
  else if (d.length === 2) out += ':';
  if (d.length >= 5) out += ' - ' + d.slice(4, 6).padEnd(d.length < 6 ? d.length - 4 : 2, '');
  else if (d.length === 4) out += ' - ';
  if (d.length >= 7) out += ':' + d.slice(6, 8).padEnd(d.length < 8 ? d.length - 6 : 2, '');
  else if (d.length === 6) out += ':';
  return out;
}

function TimeRangeInput({ startTime, endTime, onChangeStart, onChangeEnd }) {
  const initDigits = (() => {
    if (!startTime && !endTime) return '';
    const s = (startTime || '00:00').replace(':', '');
    const e = (endTime   || '00:00').replace(':', '');
    return s + e;
  })();

  const [digits, setDigits] = useState(initDigits);

  function handleKeyDown(e) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = digits.slice(0, -1);
      setDigits(next);
      if (next.length < 4) { onChangeStart(''); onChangeEnd(''); }
      else if (next.length < 8) {
        onChangeStart(`${next.slice(0,2)}:${next.slice(2,4)}`);
        onChangeEnd('');
      } else {
        onChangeStart(`${next.slice(0,2)}:${next.slice(2,4)}`);
        onChangeEnd(`${next.slice(4,6)}:${next.slice(6,8)}`);
      }
    }
  }

  function handleInput(e) {
    const key = e.nativeEvent?.data;
    if (!key || !/\d/.test(key)) return;
    if (digits.length >= 8) return;
    const next = digits + key;
    setDigits(next);
    if (next.length >= 4) onChangeStart(`${next.slice(0,2)}:${next.slice(2,4)}`);
    if (next.length >= 8) onChangeEnd(`${next.slice(4,6)}:${next.slice(6,8)}`);
  }

  return (
    <input
      type="text"
      className="cm-time-range-input"
      placeholder="10:00 - 12:00"
      value={formatTimeRange(digits)}
      onKeyDown={handleKeyDown}
      onChange={handleInput}
      inputMode="numeric"
    />
  );
}

// ── helper: แปลง "HH:MM" เป็นนาที
function toMin(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function overlaps(s1, e1, s2, e2) {
  return toMin(s1) < toMin(e2) && toMin(e1) > toMin(s2);
}

// ── ตรวจ conflict แต่ละวัน (per-day slots)
function findConflictDays(scheduleSlots, avail) {
  if (!avail || !scheduleSlots) return [];
  return Object.entries(scheduleSlots).flatMap(([day, { start, end }]) => {
    if (!start || !end) return [];
    const busy = avail[day]?.busySlots ?? [];
    return busy
      .filter(b => overlaps(start, end, b.startTime, b.endTime))
      .map(b => ({ day, start: b.startTime, end: b.endTime, course: b.courseTitle }));
  });
}

// ── panel แสดงตารางว่างของติวเตอร์
function TutorAvailabilityPanel({ avail, loading }) {
  if (loading) {
    return (
      <div className="cm-avail-panel cm-avail-loading">
        กำลังโหลดตารางว่างของติวเตอร์...
      </div>
    );
  }
  if (!avail) return null;

  return (
    <div className="cm-avail-panel">
      <div className="cm-avail-title">ตารางว่างของติวเตอร์ (สัปดาห์นี้)</div>
      <div className="cm-avail-rows">
        {DAYS.map(({ key }) => {
          const data = avail[key];
          const freeSlots = data?.freeSlots ?? [];
          const hasFree = freeSlots.length > 0;
          return (
            <div key={key} className={`cm-avail-row ${hasFree ? 'cm-avail-free' : 'cm-avail-busy'}`}>
              <span className="cm-avail-day">{DAY_LABEL_TH[key]}</span>
              <span className="cm-avail-slots">
                {hasFree
                  ? freeSlots.map((s, i) => (
                      <span key={i} className="cm-avail-slot">
                        {s.startTime}–{s.endTime}
                      </span>
                    ))
                  : <span className="cm-avail-no">ไม่ว่าง</span>
                }
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleSection({ form, fld, avail, err }) {
  const slots = form.scheduleSlots || {};
  const orderedSelected = DAYS.map(d => d.key).filter(k => k in slots);
  const conflicts = findConflictDays(slots, avail);
  const conflictDaySet = new Set(conflicts.map(c => c.day));

  function toggleDay(key) {
    const next = { ...slots };
    if (key in next) {
      delete next[key];
    } else {
      next[key] = { start: '', end: '' };
    }
    fld('scheduleSlots', next);
  }

  function setSlotTime(day, field, value) {
    fld('scheduleSlots', { ...slots, [day]: { ...slots[day], [field]: value } });
  }

  return (
    <div className="cm-schedule-section">
      <div className="cm-schedule-section-title">
        <span className="cm-schedule-icon">📅</span>
        <span>ตารางสอน *</span>
      </div>

      {/* เลือกวัน */}
      <div className="cm-field">
        <label>กดเลือกวันที่สอน และใส่เวลาแต่ละวัน <span className="cm-lbl-hint">(08:00–22:00)</span></label>
        <div className="cm-day-pills">
          {DAYS.map(d => (
            <button key={d.key} type="button"
              className={`cm-day-pill ${d.key in slots ? 'cm-day-pill--on' : ''}`}
              onClick={() => toggleDay(d.key)}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* เวลาแต่ละวัน */}
      {orderedSelected.length > 0 && (
        <div className="cm-per-day-slots">
          {orderedSelected.map(key => {
            const slot = slots[key];
            const conflict = conflicts.find(c => c.day === key);
            return (
              <div key={key} className={`cm-per-day-row ${conflictDaySet.has(key) ? 'cm-per-day-row--conflict' : ''}`}>
                <span className="cm-per-day-label">{DAY_LABEL_TH[key]}</span>
                <TimeRangeInput
                  key={key}
                  startTime={slot.start}
                  endTime={slot.end}
                  onChangeStart={v => setSlotTime(key, 'start', v)}
                  onChangeEnd={v => setSlotTime(key, 'end', v)}
                />
                {conflict ? (
                  <span className="cm-per-day-conflict-msg">
                    ซ้ำ {conflict.start}–{conflict.end}{conflict.course ? ` (${conflict.course})` : ''}
                  </span>
                ) : (!slot.start || !slot.end) ? (
                  <span className="cm-per-day-hint-msg">ยังไม่ได้ใส่เวลา</span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* error จาก validate (submit) */}
      {err && (
        <div className="cm-avail-conflict"><strong>{err}</strong></div>
      )}
    </div>
  );
}

const EMPTY_FORM = {
  courseCode: '', courseName: '', tutorId: '', price: '',
  totalHours: '', seatLimit: '',
  registrationStartDate: '', registrationEndDate: '',
  courseStartDate: '', description: '',
  scheduleSlots: {},
};

// ──────────────── component ────────────────
export default function AdminCourseManagementPage() {
  const [courses, setCourses]       = useState([]);
  const [tutors, setTutors]         = useState([]);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [stats, setStats]           = useState({ total: 0, draft: 0, openForRegistration: 0, ongoing: 0 });
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState(null);

  const [tutorAvail, setTutorAvail]   = useState(null);
  const [availLoading, setAvailLoading] = useState(false);

  const [showCreate, setShowCreate]   = useState(false);
  const [showEdit, setShowEdit]       = useState(false);
  const [showDetail, setShowDetail]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStatus, setShowStatus]   = useState(false);
  const [selected, setSelected]       = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formErr, setFormErr]         = useState({});
  const [saving, setSaving]           = useState(false);
  const [newStatus, setNewStatus]     = useState('');

  const notify = useCallback((msg, type = 'success') => setToast({ msg, type }), []);
  const PAGE_SIZE = 10;

  // ── load courses
  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const [data, s] = await Promise.all([
        getCourses({ page: p, size: PAGE_SIZE }),
        getCourseStats(),
      ]);
      const list = Array.isArray(data) ? data : (data?.content ?? []);
      setCourses(list);
      setTotalPages(data?.totalPages ?? 1);
      setStats(s);
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(0); }, []); // eslint-disable-line

  // ── load tutors from real DB
  useEffect(() => {
    setTutorLoading(true);
    getTutors({ page: 0, size: 500 })
      .then(d => {
        const list = Array.isArray(d) ? d : (d?.content ?? []);
        setTutors(list.filter(t => t.enabled !== false));
      })
      .catch(() => notify('โหลดรายชื่อติวเตอร์ไม่สำเร็จ', 'error'))
      .finally(() => setTutorLoading(false));
  }, []); // eslint-disable-line

  // ── โหลด availability เมื่อเลือก tutorId
  useEffect(() => {
    if (!form.tutorId) { setTutorAvail(null); return; }
    setAvailLoading(true);
    getTutorWeeklyAvailability(form.tutorId)
      .then(setTutorAvail)
      .catch(() => setTutorAvail(null))
      .finally(() => setAvailLoading(false));
  }, [form.tutorId]); // eslint-disable-line

  // ── validate
  // checkSchedule: false เมื่อสร้างคอร์ส (ระบบจัดวัน-เวลาสอนให้อัตโนมัติแล้ว ไม่มี UI ให้เลือกเอง)
  function validate(f, priceRequired = true, checkSchedule = true) {
    const e = {};
    if (!f.courseCode?.trim()) e.courseCode = 'กรุณากรอกรหัสคอร์ส';
    if (!f.courseName?.trim()) e.courseName = 'กรุณากรอกชื่อวิชา';
    if (!f.tutorId) e.tutorId = 'กรุณาเลือกติวเตอร์';
    if (priceRequired && (f.price === '' || f.price == null || isNaN(f.price))) e.price = 'กรุณากรอกราคา';
    else if (f.price !== '' && f.price != null && Number(f.price) < 0) e.price = 'ราคาต้องไม่ติดลบ';
    if (!f.totalHours || isNaN(f.totalHours) || Number(f.totalHours) < 1) e.totalHours = 'ต้องมากกว่า 0';
    if (!f.seatLimit  || isNaN(f.seatLimit)  || Number(f.seatLimit)  < 1) e.seatLimit  = 'ต้องมากกว่า 0';
    if (!f.courseStartDate) e.courseStartDate = 'กรุณาเลือกวันที่เริ่มสอน';

    if (checkSchedule) {
      // บังคับตารางสอน
      const slots = f.scheduleSlots || {};
      const selectedDayKeys = Object.keys(slots);
      if (selectedDayKeys.length === 0) {
        e.scheduleTime = 'กรุณาเลือกวันสอนอย่างน้อย 1 วัน';
      } else {
        const missingTime = selectedDayKeys.filter(k => !slots[k].start || !slots[k].end);
        if (missingTime.length > 0) {
          e.scheduleTime = `กรุณาใส่เวลาให้ครบทุกวัน: ${missingTime.map(k => DAY_LABEL_TH[k]).join(', ')}`;
        }
      }

      // ตรวจ time conflict กับตารางของติวเตอร์
      const conflicts = findConflictDays(f.scheduleSlots, tutorAvail);
      if (conflicts.length > 0) {
        e.scheduleTime = conflicts.map(c =>
          `วัน${DAY_LABEL_TH[c.day]} ${c.start}–${c.end}${c.course ? ` (${c.course})` : ''}`
        ).join(', ');
      }
    }

    return e;
  }

  function fld(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setFormErr(e => ({ ...e, [key]: '' }));
  }

  // ── CREATE
  function openCreate() {
    setForm({ ...EMPTY_FORM, courseCode: genCourseCode() });
    setFormErr({});
    setShowCreate(true);
  }
  async function handleCreate(e) {
    e.preventDefault();
    const err = validate(form, true, false);
    if (Object.keys(err).length) { setFormErr(err); return; }
    setSaving(true);
    try {
      // ไม่ส่ง scheduleDays — ระบบหลังบ้านจะจัดวัน-เวลาสอนให้ติวเตอร์อัตโนมัติ (เลี่ยงชนกับคอร์สอื่นของติวเตอร์คนเดียวกัน)
      await createCourse({ ...form, price: Number(form.price) });
      notify('สร้างคอร์สสำเร็จ ระบบจัดวัน-เวลาสอนให้อัตโนมัติแล้ว และส่งการแจ้งเตือนไปยังติวเตอร์แล้ว');
      setShowCreate(false);
      load(0); setPage(0);
    } catch (ex) { notify(ex.message, 'error'); }
    finally { setSaving(false); }
  }

  // ── EDIT
  function openEdit(c) {
    setSelected(c);
    setForm({
      courseCode:            c.courseCode ?? '',
      courseName:            c.courseName ?? '',
      tutorId:               c.tutorId ?? '',
      price:                 c.price ?? '',
      totalHours:            c.totalHours ?? '',
      seatLimit:             c.seatLimit ?? '',
      registrationStartDate: c.registrationStartDate ?? '',
      registrationEndDate:   c.registrationEndDate ?? '',
      courseStartDate:       c.courseStartDate ?? '',
      description:           c.description ?? '',
      scheduleSlots:         parseDaySlots(c.scheduleDays),
    });
    setFormErr({});
    setShowEdit(true);
  }
  async function handleEdit(e) {
    e.preventDefault();
    const err = validate(form, false);
    if (Object.keys(err).length) { setFormErr(err); return; }
    setSaving(true);
    try {
      const scheduleDays = encodeDaySlots(form.scheduleSlots || {});
      await updateCourse(selected.id, { ...form, scheduleDays, scheduleStartTime: null, scheduleEndTime: null });
      notify('อัปเดตคอร์สสำเร็จ');
      setShowEdit(false);
      load(page);
    } catch (ex) { notify(ex.message, 'error'); }
    finally { setSaving(false); }
  }

  // ── DELETE
  function openDelete(c) { setSelected(c); setShowConfirm(true); }
  async function handleDelete() {
    setSaving(true);
    try {
      await deleteCourse(selected.id);
      notify('ลบคอร์สสำเร็จ');
      setShowConfirm(false);
      load(page);
    } catch (ex) { notify(ex.message, 'error'); }
    finally { setSaving(false); }
  }

  // ── STATUS
  function openStatus(c) { setSelected(c); setNewStatus(c.status); setShowStatus(true); }
  async function handleStatus() {
    setSaving(true);
    try {
      await updateCourseStatus(selected.id, newStatus);
      notify('อัปเดตสถานะสำเร็จ');
      setShowStatus(false);
      load(page);
    } catch (ex) { notify(ex.message, 'error'); }
    finally { setSaving(false); }
  }

  // ── DETAIL
  function openDetail(c) { setSelected(c); setShowDetail(true); }

  // ── Tutor dropdown option
  function TutorOption({ t }) {
    return (
      <option key={t.id} value={t.id}>
        {t.email}{t.firstName ? ` (${t.firstName} ${t.lastName})` : ''}
        {t.specialization ? ` — ${t.specialization}` : ''}
      </option>
    );
  }

  // ── shared tutor select + availability panel
  function TutorSelect({ value, onChange, err }) {
    return (
      <>
        <div className="cm-field">
          <label>ติวเตอร์ * <span className="cm-lbl-hint">(เลือกจากระบบ)</span></label>
          <select value={value} onChange={e => onChange(e.target.value)} disabled={tutorLoading}>
            <option value="">
              {tutorLoading ? 'กำลังโหลดรายชื่อ...' : tutors.length === 0 ? 'ไม่พบติวเตอร์ในระบบ' : '— เลือกติวเตอร์ —'}
            </option>
            {tutors.map(t => <TutorOption key={t.id} t={t} />)}
          </select>
          {err && <span className="cm-err">{err}</span>}
          {tutors.length > 0 && !tutorLoading && (
            <span className="cm-field-hint">มีติวเตอร์ในระบบ {tutors.length} คน</span>
          )}
        </div>
        {value && (
          <TutorAvailabilityPanel avail={tutorAvail} loading={availLoading} />
        )}
      </>
    );
  }

  return (
    <div className="cm-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="cm-header">
        <div>
          <h1>จัดการคอร์สเรียน</h1>
          <p>สร้างและจัดการคอร์สเรียนทั้งหมด พร้อมส่งการแจ้งเตือนไปยังติวเตอร์</p>
        </div>
        <button className="cm-btn-primary" onClick={openCreate}>+ เพิ่มคอร์ส</button>
      </div>

      {/* Stats */}
      <div className="cm-stats">
        <div className="cm-stat-card cm-stat-total">
          <div className="cm-stat-icon">📚</div>
          <div><div className="cm-stat-num">{stats.total}</div><div className="cm-stat-lbl">คอร์สทั้งหมด</div></div>
        </div>
        <div className="cm-stat-card cm-stat-draft">
          <div className="cm-stat-icon">⏳</div>
          <div><div className="cm-stat-num">{stats.draft}</div><div className="cm-stat-lbl">รอติวเตอร์ตอบรับ</div></div>
        </div>
        <div className="cm-stat-card cm-stat-open">
          <div className="cm-stat-icon">✅</div>
          <div><div className="cm-stat-num">{stats.openForRegistration}</div><div className="cm-stat-lbl">เปิดรับสมัคร</div></div>
        </div>
        <div className="cm-stat-card cm-stat-ongoing">
          <div className="cm-stat-icon">🎓</div>
          <div><div className="cm-stat-num">{stats.ongoing}</div><div className="cm-stat-lbl">กำลังสอน</div></div>
        </div>
      </div>

      {/* Table */}
      <div className="cm-table-wrap">
        {loading ? (
          <div className="cm-loading">กำลังโหลดข้อมูล...</div>
        ) : courses.length === 0 ? (
          <div className="cm-empty">ยังไม่มีคอร์สเรียน กด "เพิ่มคอร์ส" เพื่อสร้างคอร์สแรก</div>
        ) : (
          <table className="cm-table">
            <thead>
              <tr>
                <th>รหัสคอร์ส</th>
                <th>ชื่อคอร์ส</th>
                <th>ติวเตอร์</th>
                <th>ที่นั่ง</th>
                <th>ราคา</th>
                <th>วันเริ่มสอน</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(c => (
                <tr key={c.id}>
                  <td><span className="cm-code">{c.courseCode}</span></td>
                  <td className="cm-name-cell">{c.courseName}</td>
                  <td>
                    <div className="cm-tutor-cell">
                      <span>{c.teacherName || '—'}</span>
                      <small>{c.tutorEmail || ''}</small>
                    </div>
                  </td>
                  <td>{c.enrolledCount}/{c.seatLimit}</td>
                  <td>{c.price != null && Number(c.price) > 0 ? Number(c.price).toLocaleString() + ' ฿' : '—'}</td>
                  <td>{c.courseStartDate || '—'}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <div className="cm-actions">
                      <button className="cm-btn-icon" title="ดูรายละเอียด" onClick={() => openDetail(c)}>👁</button>
                      <button className="cm-btn-icon" title="แก้ไข" onClick={() => openEdit(c)}>✏️</button>
                      <button className="cm-btn-icon" title="เปลี่ยนสถานะ" onClick={() => openStatus(c)}>🔄</button>
                      <button className="cm-btn-icon" title="ลบ" onClick={() => openDelete(c)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="cm-pagination">
          <button disabled={page === 0} onClick={() => { setPage(p => p - 1); load(page - 1); }}>‹ ก่อน</button>
          <span>หน้า {page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => { setPage(p => p + 1); load(page + 1); }}>ถัดไป ›</button>
        </div>
      )}

      {/* ═══ CREATE MODAL ═══ */}
      {showCreate && (
        <div className="cm-overlay" onClick={() => setShowCreate(false)}>
          <div className="cm-modal" onClick={e => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h2>เพิ่มคอร์สเรียน</h2>
              <button className="cm-modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form className="cm-form" onSubmit={handleCreate}>

              {/* รหัสคอร์ส — auto generate */}
              <div className="cm-field">
                <label>รหัสคอร์ส</label>
                <div className="cm-auto-code-row">
                  <input
                    className="cm-auto-code-input"
                    value={form.courseCode}
                    onChange={e => fld('courseCode', e.target.value)}
                    placeholder="รหัสคอร์ส"
                  />
                  <button
                    type="button"
                    className="cm-btn-regen"
                    title="สร้างรหัสใหม่"
                    onClick={() => fld('courseCode', genCourseCode())}
                  >
                    🔄 สร้างใหม่
                  </button>
                </div>
                {formErr.courseCode && <span className="cm-err">{formErr.courseCode}</span>}
                <span className="cm-field-hint">รหัสถูกสร้างอัตโนมัติ แก้ไขได้หากต้องการ</span>
              </div>

              {/* ชื่อวิชา */}
              <div className="cm-field">
                <label>ชื่อวิชา *</label>
                <input value={form.courseName} onChange={e => fld('courseName', e.target.value)} placeholder="เช่น คณิตศาสตร์ ม.6" />
                {formErr.courseName && <span className="cm-err">{formErr.courseName}</span>}
              </div>

              {/* ติวเตอร์ — ดึงจาก DB จริง */}
              <TutorSelect
                value={form.tutorId}
                onChange={v => fld('tutorId', v)}
                err={formErr.tutorId}
              />

              {/* ตารางสอน — ระบบจัดให้อัตโนมัติหลังบันทึก ไม่ต้องเลือกเอง */}
              <div className="cm-field">
                <div className="cm-avail-panel">
                  <div className="cm-avail-title">📅 ตารางสอน</div>
                  <p className="cm-field-hint">
                    ระบบจะจัดวัน-เวลาสอนให้ติวเตอร์คนนี้อัตโนมัติหลังบันทึก
                    (คาบละ 2 ชั่วโมง ช่วง 09:00–20:00 จำนวนวัน/สัปดาห์คำนวณจากจำนวนชั่วโมงรวม)
                    โดยจะเลี่ยงวัน-เวลาที่ชนกับคอร์สอื่นของติวเตอร์คนเดียวกัน
                  </p>
                </div>
              </div>

              {/* ราคา */}
              <div className="cm-field">
                <label>ราคาคอร์ส (บาท) *</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.price}
                  onChange={e => fld('price', e.target.value)}
                  placeholder="0.00"
                />
                {formErr.price && <span className="cm-err">{formErr.price}</span>}
                <span className="cm-field-hint">ราคานี้จะไม่แสดงให้ติวเตอร์เห็น</span>
              </div>

              {/* ชั่วโมง + ที่นั่ง */}
              <div className="cm-form-row">
                <div className="cm-field">
                  <label>ชั่วโมงรวม *</label>
                  <input type="number" min="1" value={form.totalHours} onChange={e => fld('totalHours', e.target.value)} placeholder="เช่น 40" />
                  {formErr.totalHours && <span className="cm-err">{formErr.totalHours}</span>}
                </div>
                <div className="cm-field">
                  <label>จำนวนที่นั่ง *</label>
                  <input type="number" min="1" value={form.seatLimit} onChange={e => fld('seatLimit', e.target.value)} placeholder="เช่น 30" />
                  {formErr.seatLimit && <span className="cm-err">{formErr.seatLimit}</span>}
                </div>
              </div>

              {/* วันรับสมัคร */}
              <div className="cm-form-row">
                <div className="cm-field">
                  <label>วันเปิดรับสมัคร</label>
                  <input type="date" value={form.registrationStartDate} onChange={e => fld('registrationStartDate', e.target.value)} />
                </div>
                <div className="cm-field">
                  <label>วันปิดรับสมัคร</label>
                  <input type="date" value={form.registrationEndDate} onChange={e => fld('registrationEndDate', e.target.value)} />
                </div>
              </div>

              {/* วันเริ่มสอน */}
              <div className="cm-field">
                <label>วันที่เริ่มสอน *</label>
                <input type="date" value={form.courseStartDate} onChange={e => fld('courseStartDate', e.target.value)} />
                {formErr.courseStartDate && <span className="cm-err">{formErr.courseStartDate}</span>}
              </div>

              {/* รายละเอียด — อยู่ล่างสุด */}
              <div className="cm-field">
                <label>รายละเอียดคอร์ส</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={e => fld('description', e.target.value)}
                  placeholder="อธิบายเนื้อหาคอร์ส เป้าหมายผู้เรียน สิ่งที่จะได้รับ..."
                />
              </div>

              <div className="cm-info-box">
                💡 คอร์สจะถูกสร้างในสถานะ <strong>รอติวเตอร์ตอบรับ</strong> ระบบจัดวัน-เวลาสอนให้อัตโนมัติ และส่งการแจ้งเตือนไปยังอีเมลติวเตอร์ทันที
                หลังติวเตอร์ตอบรับและเพิ่มบทเรียนแล้ว ติวเตอร์จะกดเผยแพร่คอร์สเองเพื่อเปิดให้นักเรียนสมัคร
              </div>

              <div className="cm-form-actions">
                <button type="button" className="cm-btn-cancel" onClick={() => setShowCreate(false)}>ยกเลิก</button>
                <button type="submit" className="cm-btn-primary" disabled={saving}>
                  {saving ? 'กำลังสร้าง...' : '✓ สร้างคอร์สและแจ้งติวเตอร์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ EDIT MODAL ═══ */}
      {showEdit && selected && (
        <div className="cm-overlay" onClick={() => setShowEdit(false)}>
          <div className="cm-modal" onClick={e => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h2>แก้ไขคอร์ส</h2>
              <button className="cm-modal-close" onClick={() => setShowEdit(false)}>✕</button>
            </div>
            <form className="cm-form" onSubmit={handleEdit}>

              <div className="cm-field">
                <label>รหัสคอร์ส</label>
                <div className="cm-auto-code-row">
                  <input className="cm-auto-code-input" value={form.courseCode} onChange={e => fld('courseCode', e.target.value)} />
                </div>
                {formErr.courseCode && <span className="cm-err">{formErr.courseCode}</span>}
              </div>

              <div className="cm-field">
                <label>ชื่อวิชา *</label>
                <input value={form.courseName} onChange={e => fld('courseName', e.target.value)} />
                {formErr.courseName && <span className="cm-err">{formErr.courseName}</span>}
              </div>

              <TutorSelect
                value={form.tutorId}
                onChange={v => fld('tutorId', v)}
                err={formErr.tutorId}
              />

              {/* ตารางสอน — อยู่ใต้ตารางว่างของติวเตอร์ทันที */}
              <ScheduleSection form={form} fld={fld} avail={tutorAvail} err={formErr.scheduleTime} />

              <div className="cm-field">
                <label>ราคาคอร์ส (บาท)</label>
                <input type="number" min="0" step="0.01" value={form.price} onChange={e => fld('price', e.target.value)} placeholder="0.00" />
                {formErr.price && <span className="cm-err">{formErr.price}</span>}
                <span className="cm-field-hint">ราคานี้จะไม่แสดงให้ติวเตอร์เห็น</span>
              </div>

              <div className="cm-form-row">
                <div className="cm-field">
                  <label>ชั่วโมงรวม *</label>
                  <input type="number" min="1" value={form.totalHours} onChange={e => fld('totalHours', e.target.value)} />
                  {formErr.totalHours && <span className="cm-err">{formErr.totalHours}</span>}
                </div>
                <div className="cm-field">
                  <label>จำนวนที่นั่ง *</label>
                  <input type="number" min="1" value={form.seatLimit} onChange={e => fld('seatLimit', e.target.value)} />
                  {formErr.seatLimit && <span className="cm-err">{formErr.seatLimit}</span>}
                </div>
              </div>

              <div className="cm-form-row">
                <div className="cm-field">
                  <label>วันเปิดรับสมัคร</label>
                  <input type="date" value={form.registrationStartDate} onChange={e => fld('registrationStartDate', e.target.value)} />
                </div>
                <div className="cm-field">
                  <label>วันปิดรับสมัคร</label>
                  <input type="date" value={form.registrationEndDate} onChange={e => fld('registrationEndDate', e.target.value)} />
                </div>
              </div>

              <div className="cm-field">
                <label>วันที่เริ่มสอน *</label>
                <input type="date" value={form.courseStartDate} onChange={e => fld('courseStartDate', e.target.value)} />
                {formErr.courseStartDate && <span className="cm-err">{formErr.courseStartDate}</span>}
              </div>

              <div className="cm-field">
                <label>รายละเอียดคอร์ส</label>
                <textarea rows={4} value={form.description} onChange={e => fld('description', e.target.value)} />
              </div>

              <div className="cm-form-actions">
                <button type="button" className="cm-btn-cancel" onClick={() => setShowEdit(false)}>ยกเลิก</button>
                <button type="submit" className="cm-btn-primary" disabled={saving}>
                  {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ STATUS MODAL ═══ */}
      {showStatus && selected && (
        <div className="cm-overlay" onClick={() => setShowStatus(false)}>
          <div className="cm-modal cm-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h2>เปลี่ยนสถานะคอร์ส</h2>
              <button className="cm-modal-close" onClick={() => setShowStatus(false)}>✕</button>
            </div>
            <div className="cm-form">
              <p className="cm-modal-subtitle">{selected.courseCode} — {selected.courseName}</p>
              <div className="cm-field">
                <label>สถานะใหม่</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="cm-form-actions">
                <button className="cm-btn-cancel" onClick={() => setShowStatus(false)}>ยกเลิก</button>
                <button className="cm-btn-primary" disabled={saving} onClick={handleStatus}>
                  {saving ? 'กำลังบันทึก...' : 'ยืนยัน'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE CONFIRM ═══ */}
      {showConfirm && selected && (
        <div className="cm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="cm-modal cm-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h2>ยืนยันการลบ</h2>
              <button className="cm-modal-close" onClick={() => setShowConfirm(false)}>✕</button>
            </div>
            <div className="cm-form">
              <p>คุณต้องการลบคอร์ส <strong>{selected.courseName}</strong> ใช่หรือไม่?<br />การดำเนินการนี้ไม่สามารถเรียกคืนได้</p>
              <div className="cm-form-actions">
                <button className="cm-btn-cancel" onClick={() => setShowConfirm(false)}>ยกเลิก</button>
                <button className="cm-btn-danger" disabled={saving} onClick={handleDelete}>
                  {saving ? 'กำลังลบ...' : 'ลบคอร์ส'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DETAIL MODAL ═══ */}
      {showDetail && selected && (
        <div className="cm-overlay" onClick={() => setShowDetail(false)}>
          <div className="cm-modal cm-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h2>รายละเอียดคอร์ส</h2>
              <button className="cm-modal-close" onClick={() => setShowDetail(false)}>✕</button>
            </div>
            <div className="cm-detail">
              <div className="cm-detail-top">
                <span className="cm-code">{selected.courseCode}</span>
                <StatusBadge status={selected.status} />
              </div>
              <h3>{selected.courseName}</h3>
              <p className="cm-detail-desc">{selected.description || 'ไม่มีรายละเอียด'}</p>

              <div className="cm-detail-grid">
                <div><label>ติวเตอร์</label><span>{selected.teacherName || '—'}</span></div>
                <div><label>อีเมลติวเตอร์</label><span>{selected.tutorEmail || '—'}</span></div>
                <div><label>ราคา</label><span>{selected.price != null && Number(selected.price) > 0 ? Number(selected.price).toLocaleString() + ' บาท' : '—'}</span></div>
                <div><label>ชั่วโมงรวม</label><span>{selected.totalHours} ชั่วโมง</span></div>
                <div><label>ที่นั่ง</label><span>{selected.enrolledCount}/{selected.seatLimit} คน</span></div>
                <div><label>วันเริ่มสอน</label><span>{selected.courseStartDate || '—'}</span></div>
                <div><label>เปิดรับสมัคร</label><span>{selected.registrationStartDate || '—'}</span></div>
                <div><label>ปิดรับสมัคร</label><span>{selected.registrationEndDate || '—'}</span></div>
              </div>

              {/* ตารางสอน */}
              {selected.scheduleDays && (
                <div className="cm-schedule-info-box">
                  <div className="cm-schedule-info-title">📅 ตารางสอน</div>
                  <div className="cm-per-day-slots cm-per-day-slots--readonly">
                    {DAYS.map(d => d.key)
                      .filter(k => k in parseDaySlots(selected.scheduleDays))
                      .map(key => {
                        const { start, end } = parseDaySlots(selected.scheduleDays)[key];
                        return (
                          <div key={key} className="cm-per-day-row">
                            <span className="cm-per-day-label">{DAY_LABEL_TH[key]}</span>
                            <span className="cm-per-day-time-display">
                              {start && end ? `${start} – ${end} น.` : 'ยังไม่ระบุเวลา'}
                            </span>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              )}

              {selected.tutorRemark && (
                <div className="cm-remark-box">
                  <strong>หมายเหตุจากติวเตอร์:</strong> {selected.tutorRemark}
                </div>
              )}

              {selected.lessons?.length > 0 && (
                <div className="cm-curriculum">
                  <h4>หลักสูตร ({selected.lessons.length} บท)</h4>
                  {selected.lessons.map(l => (
                    <div key={l.id} className="cm-lesson-item">
                      <span className="cm-lesson-num">บทที่ {l.lessonOrder}</span>
                      <span>{l.lessonTitle}</span>
                    </div>
                  ))}
                </div>
              )}

              {selected.tests?.length > 0 && (
                <div className="cm-curriculum">
                  <h4>แบบทดสอบ ({selected.tests.length} ชุด)</h4>
                  {selected.tests.map(t => (
                    <div key={t.id} className="cm-lesson-item">
                      <span className="cm-lesson-num">#{t.testOrder}</span>
                      <span>{t.testTitle}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
