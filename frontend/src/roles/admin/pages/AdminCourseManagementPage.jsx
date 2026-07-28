import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTutors } from '../services/adminTutorService';
import {
  deleteCourse,
  getCourseStats,
  getCourses,
  getTutorWeeklyAvailability,
  updateCourse,
  updateCourseStatus,
} from '../services/adminCourseService';
import {
  DAYS,
  DAY_LABEL_TH,
  EMPTY_COURSE_FORM,
  parseDaySlots,
  encodeDaySlots,
  validateCourseForm,
} from '../utils/courseScheduleUtils';
import { ScheduleSection, TutorSelectField } from '../components/CourseScheduleFields';
import './AdminCourseManagementPage.css';

// ──────────────── helpers ────────────────
const STATUS_LABEL = {
  OPEN_FOR_REGISTRATION: { label: 'เปิดรับสมัคร', cls: 'cm-badge-open' },
  CLOSED:                { label: 'ปิดรับสมัคร',  cls: 'cm-badge-closed' },
  ONGOING:               { label: 'กำลังเรียน',   cls: 'cm-badge-ongoing' },
  COMPLETED:             { label: 'สอนจบแล้ว',    cls: 'cm-badge-completed' },
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

// ──────────────── component ────────────────
export default function AdminCourseManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [courses, setCourses]       = useState([]);
  const [tutors, setTutors]         = useState([]);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [stats, setStats]           = useState({ total: 0, closed: 0, openForRegistration: 0, ongoing: 0 });
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState(null);

  const [tutorAvail, setTutorAvail]   = useState(null);
  const [availLoading, setAvailLoading] = useState(false);

  const [showEdit, setShowEdit]       = useState(false);
  const [showDetail, setShowDetail]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStatus, setShowStatus]   = useState(false);
  const [selected, setSelected]       = useState(null);
  const [form, setForm]               = useState(EMPTY_COURSE_FORM);
  const [formErr, setFormErr]         = useState({});
  const [saving, setSaving]           = useState(false);
  const [newStatus, setNewStatus]     = useState('');

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

  function fld(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setFormErr(e => ({ ...e, [key]: '' }));
  }

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
      scheduleSlots:         parseDaySlots(c.scheduleDays),
    });
    setFormErr({});
    setShowEdit(true);
  }
  async function handleEdit(e) {
    e.preventDefault();
    const err = validateCourseForm(form, tutorAvail, false);
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

  return (
    <div className="cm-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="cm-header">
        <div>
          <h1>จัดการคอร์สเรียน</h1>
          <p>สร้างและจัดการคอร์สเรียนทั้งหมด พร้อมส่งการแจ้งเตือนไปยังติวเตอร์</p>
        </div>
        <button className="cm-btn-primary" onClick={() => navigate('/admin/courses/create')}>+ เพิ่มคอร์ส</button>
      </div>

      {/* Stats */}
      <div className="cm-stats">
        <div className="cm-stat-card cm-stat-total">
          <div className="cm-stat-icon">📚</div>
          <div><div className="cm-stat-num">{stats.total}</div><div className="cm-stat-lbl">คอร์สทั้งหมด</div></div>
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
                <label>ชื่อวิชา *</label>
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
