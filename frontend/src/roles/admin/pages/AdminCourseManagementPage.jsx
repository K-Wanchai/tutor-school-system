import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTutors } from '../services/adminTutorService';
import { getEnrollmentsByCourse } from '../services/adminEnrollmentService';
import { getInstitutionProfile, updateInstitutionProfile } from '../services/adminSettingsService';
import {
  deleteCourse,
  getCourseStats,
  getCourses,
  getTutorWeeklyAvailability,
  updateCourse,
} from '../services/adminCourseService';
import {
  DAYS,
  DAY_LABEL_TH,
  EMPTY_COURSE_FORM,
  parseDaySlots,
  slotsToScheduleDaysArray,
  scheduleDaysArrayToSlots,
  validateCourseForm,
  getScheduleWeekdays,
} from '../utils/courseScheduleUtils';
import { ScheduleSection, TutorSelectField } from '../components/CourseScheduleFields';
import useInstitutionProfile from '../../../shared/hooks/useInstitutionProfile';
import CalendarDateInput from '../../../shared/components/CalendarDateInput';
import { todayLocalISODate, addDaysISO } from '../../../shared/utils/dateUtils';
import './AdminCourseManagementPage.css';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ──────────────── helpers ────────────────
const STATUS_LABEL = {
  PENDING:               { label: 'รอเปิดรับสมัคร', cls: 'cm-badge-draft' },
  OPEN_FOR_REGISTRATION: { label: 'เปิดรับสมัคร',   cls: 'cm-badge-open' },
  CLOSED:                { label: 'ปิดรับสมัคร',    cls: 'cm-badge-closed' },
  ONGOING:               { label: 'กำลังเรียน',     cls: 'cm-badge-ongoing' },
  COMPLETED:             { label: 'สอนจบแล้ว',      cls: 'cm-badge-completed' },
};

const ENROLLMENT_STATUS_LABEL = {
  PENDING:   { label: 'รอดำเนินการ', cls: 'cm-badge-draft' },
  APPROVED:  { label: 'อนุมัติแล้ว', cls: 'cm-badge-open' },
  REJECTED:  { label: 'ปฏิเสธ',      cls: 'cm-badge-closed' },
  CANCELLED: { label: 'ยกเลิก',      cls: 'cm-badge-closed' },
  COMPLETED: { label: 'เรียนจบ',     cls: 'cm-badge-completed' },
};

function EnrollmentStatusBadge({ status }) {
  const s = ENROLLMENT_STATUS_LABEL[status] || { label: status, cls: '' };
  return <span className={`cm-badge ${s.cls}`}>{s.label}</span>;
}

const PAYMENT_STATUS_LABEL_TH = {
  UNPAID: 'ยังไม่ชำระ',
  PENDING_VERIFICATION: 'รอการยืนยันชำระเงิน',
  PAID: 'ชำระแล้ว',
  FAILED: 'ไม่สำเร็จ',
};

// แปลงข้อมูลสถาบันทั้งชุดให้เป็น payload สำหรับ PUT /institution-profile (endpoint ต้องการฟิลด์ครบทุกตัว)
// ใช้ตอนแก้ไขแค่บางฟิลด์จากหน้านี้ เพื่อไม่ให้ฟิลด์อื่นที่ตั้งค่าไว้ในหน้าอื่นถูกเขียนทับ
function toInstitutionPayload(profile, overrides = {}) {
  return {
    institutionName: profile?.institutionName || '',
    address: profile?.address || '',
    phoneNumber: profile?.phoneNumber || '',
    email: profile?.email || '',
    logoUrl: profile?.logoUrl || '',
    bankName: profile?.bankName || '',
    bankAccountName: profile?.bankAccountName || '',
    bankAccountNumber: profile?.bankAccountNumber || '',
    bankQrCode: profile?.bankQrCode || '',
    promptPayId: profile?.promptPayId || '',
    enrollmentPaymentDeadlineMinutes: profile?.enrollmentPaymentDeadlineMinutes ?? 15,
    slipRevisionDeadlineMinutes: profile?.slipRevisionDeadlineMinutes ?? 15,
    allowedTimeSlots: parseDaySlots(profile?.allowedTimeSlots),
    ...overrides,
  };
}

// ── Settings Modal (ช่วงเวลาที่อนุญาตให้จัดตารางสอน) ────────────────────────────

function AllowedTimeSlotsModal({ onClose, onSaved, notify }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ allowedTimeSlots: {} });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    getInstitutionProfile()
      .then((data) => {
        setProfile(data);
        setForm({ allowedTimeSlots: parseDaySlots(data?.allowedTimeSlots) });
      })
      .catch((err) => setLoadError(err.message || 'ไม่สามารถโหลดข้อมูลได้'))
      .finally(() => setLoading(false));
  }, []);

  function fld(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      await updateInstitutionProfile(toInstitutionPayload(profile, { allowedTimeSlots: form.allowedTimeSlots }));
      notify('บันทึกการตั้งค่าสำเร็จ');
      onSaved();
    } catch (err) {
      setSaveError(err.message || 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cm-overlay" onClick={onClose}>
      <div className="cm-modal cm-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="cm-modal-header">
          <h2>ช่วงเวลาที่อนุญาตให้จัดตารางสอน</h2>
          <button className="cm-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="cm-form">
          {loading && <div className="cm-loading">กำลังโหลดข้อมูล...</div>}
          {!loading && loadError && <div className="cm-err">{loadError}</div>}
          {!loading && !loadError && (
            <>
              <p className="cm-field-hint">
                กำหนดช่วงเวลาที่อนุญาตให้จัดตารางสอนในแต่ละวัน วันที่ไม่ได้ตั้งค่าไว้จะไม่จำกัดเวลา
                หากแอดมินลงตารางสอนของคอร์สนอกช่วงเวลานี้ ระบบจะแจ้งเตือนใต้ช่องเวลานั้นทันที
              </p>
              <ScheduleSection
                form={form}
                fld={fld}
                slotsField="allowedTimeSlots"
                icon="✅"
                title="เวลาที่อนุญาตรายวัน"
                hint="(ว่างไว้ = ไม่จำกัดเวลาวันนั้น)"
              />
              {saveError && <div className="cm-err">{saveError}</div>}
              <div className="cm-form-actions">
                <button type="button" className="cm-btn-cancel" onClick={onClose} disabled={saving}>ยกเลิก</button>
                <button type="button" className="cm-btn-primary" disabled={saving} onClick={handleSave}>
                  {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

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

// ──────────────── component ────────────────
export default function AdminCourseManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const institution = useInstitutionProfile();
  const allowedSlots = useMemo(
    () => parseDaySlots(institution?.allowedTimeSlots),
    [institution]
  );

  const [courses, setCourses]       = useState([]);
  const [tutors, setTutors]         = useState([]);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [stats, setStats]           = useState({ total: 0, pending: 0, closed: 0, openForRegistration: 0, ongoing: 0 });
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState(null);

  const [tutorAvail, setTutorAvail]   = useState(null);
  const [availLoading, setAvailLoading] = useState(false);

  const [showEdit, setShowEdit]       = useState(false);
  const [showDetail, setShowDetail]   = useState(false);
  const [courseEnrollments, setCourseEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selected, setSelected]       = useState(null);
  const [form, setForm]               = useState(EMPTY_COURSE_FORM);
  const [formErr, setFormErr]         = useState({});
  const [saving, setSaving]           = useState(false);

  const notify = useCallback((msg, type = 'success') => setToast({ msg, type }), []);
  const PAGE_SIZE = 10;

  // ── toast ที่ส่งมาจากหน้าเพิ่มคอร์ส (หลังสร้างคอร์สสำเร็จ)
  useEffect(() => {
    if (location.state?.toast) {
      notify(location.state.toast.msg, location.state.toast.type);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── load courses
  // silent: true = polling แบบเงียบๆ ในพื้นหลัง ไม่แตะ loading/error UI (ใช้อัปเดตจำนวนที่นั่งแบบเรียลไทม์)
  const load = useCallback(async (p = 0, { silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [data, s] = await Promise.all([
        getCourses({ page: p, size: PAGE_SIZE }),
        getCourseStats(),
      ]);
      const list = Array.isArray(data) ? data : (data?.content ?? []);
      setCourses(list);
      setTotalPages(data?.totalPages ?? 1);
      setStats(s);
      // มี detail modal เปิดอยู่ — อัปเดตข้อมูลที่แสดง (เช่นจำนวนที่นั่ง) ให้ตรงกับรายการล่าสุดไปด้วย
      setSelected(prev => (prev ? (list.find(c => c.id === prev.id) || prev) : prev));
    } catch (e) {
      if (!silent) notify(e.message, 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(0); }, []); // eslint-disable-line

  // จำนวนที่นั่งเปลี่ยนได้ตลอดเวลาจากการสมัคร/อนุมัติ/ยกเลิกของนักเรียน — ดึงรายการคอร์สซ้ำเป็นระยะ
  // แบบเงียบๆ เพื่อให้ตารางและ detail modal ที่เปิดอยู่เห็นจำนวนที่นั่งล่าสุดโดยไม่ต้องรีเฟรชหน้า
  useEffect(() => {
    const interval = setInterval(() => { load(page, { silent: true }); }, 10000);
    return () => clearInterval(interval);
  }, [page, load]);

  // ── load tutors from real DB
  useEffect(() => {
    setTutorLoading(true);
    getTutors({ page: 0, size: 500 })
      .then(d => {
        const list = Array.isArray(d) ? d : (d?.content ?? []);
        setTutors(list);
      })
      .catch(() => notify('โหลดรายชื่อติวเตอร์ไม่สำเร็จ', 'error'))
      .finally(() => setTutorLoading(false));
  }, []); // eslint-disable-line

  // ── โหลด availability เมื่อเลือก tutorId (ตอนแก้ไขคอร์ส ไม่นับตารางของคอร์สที่กำลังแก้ไขเองว่าเป็นเวลาไม่ว่าง)
  useEffect(() => {
    if (!form.tutorId) { setTutorAvail(null); return; }
    setAvailLoading(true);
    getTutorWeeklyAvailability(form.tutorId, selected?.id)
      .then(setTutorAvail)
      .catch(() => setTutorAvail(null))
      .finally(() => setAvailLoading(false));
  }, [form.tutorId, selected]); // eslint-disable-line

  function fld(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setFormErr(e => ({ ...e, [key]: '' }));
  }

  // วันในสัปดาห์ทั้งหมดที่เลือกไว้ในตารางสอน — "วันที่เริ่มสอน" เลือกได้เฉพาะวันเหล่านี้เท่านั้น
  const scheduleWeekdays = useMemo(
    () => getScheduleWeekdays(form.scheduleSlots),
    [form.scheduleSlots]
  );

  // ── EDIT
  function openEdit(c) {
    setSelected(c);
    setForm({
      courseName:            c.courseName ?? '',
      tutorId:               c.tutorId ?? '',
      price:                 c.price ?? '',
      totalHours:            c.totalHours ?? '',
      seatLimit:             c.seatLimit ?? '',
      registrationStartDate: c.registrationStartDate ?? '',
      registrationEndDate:   c.registrationEndDate ?? '',
      courseStartDate:       c.courseStartDate ?? '',
      description:           c.description ?? '',
      scheduleSlots:         scheduleDaysArrayToSlots(c.scheduleDays),
    });
    setFormErr({});
    setShowEdit(true);
  }
  async function handleEdit(e) {
    e.preventDefault();
    const err = validateCourseForm(form, tutorAvail, false, allowedSlots);
    if (Object.keys(err).length) { setFormErr(err); return; }
    setSaving(true);
    try {
      const scheduleDays = slotsToScheduleDaysArray(form.scheduleSlots || {});
      await updateCourse(selected.id, { ...form, scheduleDays });
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

  // ── DETAIL
  function openDetail(c) {
    setSelected(c);
    setShowDetail(true);
    setCourseEnrollments([]);
    setEnrollmentsLoading(true);
    getEnrollmentsByCourse(c.id)
      .then(list => setCourseEnrollments((list || []).filter(e => e.status === 'APPROVED' || e.status === 'PENDING')))
      .catch(ex => notify(ex.message, 'error'))
      .finally(() => setEnrollmentsLoading(false));
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
        <div className="cm-header-actions">
          <button className="cm-btn-ghost" onClick={() => setShowTimeSettings(true)}>
            ⚙️ ช่วงเวลาที่อนุญาตให้จัดตารางสอน
          </button>
          <button className="cm-btn-primary" onClick={() => navigate('/admin/courses/create')}>+ เพิ่มคอร์ส</button>
        </div>
      </div>

      {/* Stats */}
      <div className="cm-stats">
        <div className="cm-stat-card cm-stat-total">
          <div className="cm-stat-icon">📚</div>
          <div><div className="cm-stat-num">{stats.total}</div><div className="cm-stat-lbl">คอร์สทั้งหมด</div></div>
        </div>
        <div className="cm-stat-card cm-stat-pending">
          <div className="cm-stat-icon">⏳</div>
          <div><div className="cm-stat-num">{stats.pending}</div><div className="cm-stat-lbl">รอเปิดรับสมัคร</div></div>
        </div>
        <div className="cm-stat-card cm-stat-draft">
          <div className="cm-stat-icon">⏸</div>
          <div><div className="cm-stat-num">{stats.closed}</div><div className="cm-stat-lbl">ปิดรับสมัคร</div></div>
        </div>
        <div className="cm-stat-card cm-stat-open">
          <div className="cm-stat-icon">✅</div>
          <div><div className="cm-stat-num">{stats.openForRegistration}</div><div className="cm-stat-lbl">เปิดรับสมัคร</div></div>
        </div>
        <div className="cm-stat-card cm-stat-ongoing">
          <div className="cm-stat-icon">🎓</div>
          <div><div className="cm-stat-num">{stats.ongoing}</div><div className="cm-stat-lbl">กำลังเรียน</div></div>
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
                <th>ผู้สอน</th>
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
                  <td>{formatDate(c.courseStartDate)}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <div className="cm-actions">
                      <button className="cm-btn-icon" title="ดูรายละเอียด" onClick={() => openDetail(c)}>👁</button>
                      <button className="cm-btn-icon" title="แก้ไข" onClick={() => openEdit(c)}>✏️</button>
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
                <span className="cm-code">{selected.courseCode}</span>
                <span className="cm-field-hint">รหัสคอร์สแก้ไขไม่ได้</span>
              </div>

              <div className="cm-field">
                <label>ชื่อคอร์ส *</label>
                <input value={form.courseName} onChange={e => fld('courseName', e.target.value)} />
                {formErr.courseName && <span className="cm-err">{formErr.courseName}</span>}
              </div>

              <TutorSelectField
                tutors={tutors}
                tutorLoading={tutorLoading}
                tutorAvail={tutorAvail}
                availLoading={availLoading}
                value={form.tutorId}
                onChange={v => fld('tutorId', v)}
                err={formErr.tutorId}
              />

              {/* ตารางสอน — อยู่ใต้ตารางว่างของติวเตอร์ทันที */}
              <ScheduleSection
                form={form} fld={fld} avail={tutorAvail} err={formErr.scheduleTime}
                allowed={allowedSlots}
              />

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
                  <CalendarDateInput
                    value={form.registrationStartDate}
                    onChange={v => fld('registrationStartDate', v)}
                    minDate={todayLocalISODate()}
                  />
                  {formErr.registrationStartDate && <span className="cm-err">{formErr.registrationStartDate}</span>}
                </div>
                <div className="cm-field">
                  <label>วันปิดรับสมัคร</label>
                  <CalendarDateInput
                    value={form.registrationEndDate}
                    onChange={v => fld('registrationEndDate', v)}
                    minDate={form.registrationStartDate || todayLocalISODate()}
                  />
                  {formErr.registrationEndDate && <span className="cm-err">{formErr.registrationEndDate}</span>}
                </div>
              </div>

              <div className="cm-field">
                <label>วันที่เริ่มสอน *</label>
                <CalendarDateInput
                  value={form.courseStartDate}
                  onChange={v => fld('courseStartDate', v)}
                  minDate={form.registrationEndDate ? addDaysISO(form.registrationEndDate, 1) : todayLocalISODate()}
                  allowedWeekdays={scheduleWeekdays.length > 0 ? scheduleWeekdays : undefined}
                />
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
                <div><label>วันเริ่มสอน</label><span>{formatDate(selected.courseStartDate)}</span></div>
                <div><label>เปิดรับสมัคร</label><span>{formatDate(selected.registrationStartDate)}</span></div>
                <div><label>ปิดรับสมัคร</label><span>{formatDate(selected.registrationEndDate)}</span></div>
              </div>

              {/* ตารางสอน */}
              {selected.scheduleDays?.length > 0 && (
                <div className="cm-schedule-info-box">
                  <div className="cm-schedule-info-title">📅 ตารางสอน</div>
                  <div className="cm-per-day-slots cm-per-day-slots--readonly">
                    {DAYS.map(d => d.key)
                      .filter(k => k in scheduleDaysArrayToSlots(selected.scheduleDays))
                      .map(key => {
                        const { start, end } = scheduleDaysArrayToSlots(selected.scheduleDays)[key];
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

              {/* นักเรียนที่สมัครคอร์สนี้ */}
              <div className="cm-enrolled-students">
                <h4>นักเรียนที่สมัครคอร์สนี้ ({selected.enrolledCount ?? courseEnrollments.length} คน)</h4>
                {enrollmentsLoading ? (
                  <div className="cm-enrolled-loading">กำลังโหลดรายชื่อนักเรียน...</div>
                ) : courseEnrollments.length === 0 ? (
                  <div className="cm-enrolled-empty">ยังไม่มีนักเรียนสมัครคอร์สนี้</div>
                ) : (
                  <div className="cm-enrolled-table-wrap">
                    <table className="cm-enrolled-table">
                      <thead>
                        <tr>
                          <th>รหัสสมัคร</th>
                          <th>ชื่อนักเรียน</th>
                          <th>วันที่สมัคร</th>
                          <th>สถานะ</th>
                          <th>สถานะชำระเงิน</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseEnrollments.map(en => (
                          <tr key={en.id}>
                            <td>{en.enrollmentCode || '—'}</td>
                            <td>{en.studentName || '—'}</td>
                            <td>{en.enrollmentDate ? formatDate(en.enrollmentDate) : '—'}</td>
                            <td><EnrollmentStatusBadge status={en.status} /></td>
                            <td>{PAYMENT_STATUS_LABEL_TH[en.paymentStatus] || en.paymentStatus || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

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

      {showTimeSettings && (
        <AllowedTimeSlotsModal
          onClose={() => setShowTimeSettings(false)}
          onSaved={() => setShowTimeSettings(false)}
          notify={notify}
        />
      )}
    </div>
  );
}
