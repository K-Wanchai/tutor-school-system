import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTutors } from '../services/adminTutorService';
import { createCourse, getTutorWeeklyAvailability } from '../services/adminCourseService';
import { DAY_LABEL_TH, EMPTY_COURSE_FORM, slotsToScheduleDaysArray, parseDaySlots, validateCourseForm, getScheduleWeekdays } from '../utils/courseScheduleUtils';
import { ScheduleSection, TutorSelectField } from '../components/CourseScheduleFields';
import { specializationToChips } from '../utils/tutorSubjects';
import useInstitutionProfile from '../../../shared/hooks/useInstitutionProfile';
import CalendarDateInput from '../../../shared/components/CalendarDateInput';
import { todayLocalISODate, addDaysISO } from '../../../shared/utils/dateUtils';
import '../pages/AdminCourseManagementPage.css';
import './AdminCourseCreatePage.css';

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

function SectionCard({ step, icon, title, desc, children }) {
  return (
    <section className="cc-card">
      <header className="cc-card-header">
        <span className="cc-card-step">{step}</span>
        <span className="cc-card-icon">{icon}</span>
        <div className="cc-card-heading">
          <h2>{title}</h2>
          {desc && <p>{desc}</p>}
        </div>
      </header>
      <div className="cc-card-body">{children}</div>
    </section>
  );
}

const DRAFT_STORAGE_KEY = 'admin-course-create-draft';

function loadDraftForm() {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return EMPTY_COURSE_FORM;
    return { ...EMPTY_COURSE_FORM, ...JSON.parse(raw) };
  } catch {
    return EMPTY_COURSE_FORM;
  }
}

function clearDraftForm() {
  sessionStorage.removeItem(DRAFT_STORAGE_KEY);
}

function formatBaht(price) {
  const n = Number(price);
  if (price === '' || price == null || isNaN(n)) return null;
  return n.toLocaleString('th-TH', { maximumFractionDigits: 2 });
}

function SummarySidebar({ form, tutor, checklist, doneCount }) {
  const slots = form.scheduleSlots || {};
  const dayKeys = Object.keys(slots);
  const baht = formatBaht(form.price);

  return (
    <aside className="cc-sidebar">
      <div className="cc-sidebar-card">
        <div className="cc-sidebar-title">ตัวอย่างคอร์ส</div>
        <div className="cc-preview-name">{form.courseName?.trim() || 'ชื่อคอร์ส...'}</div>
        <div className="cc-preview-tutor">
          {tutor
            ? (tutor.firstName ? `${tutor.firstName} ${tutor.lastName ?? ''}`.trim() : tutor.email)
            : 'ยังไม่ได้เลือกติวเตอร์'}
        </div>
        {tutor && specializationToChips(tutor.specialization).length > 0 && (
          <div className="cm-tutor-subjects">
            {specializationToChips(tutor.specialization).map(chip => (
              <span key={chip} className="cm-tutor-subject-chip">{chip}</span>
            ))}
          </div>
        )}

        {dayKeys.length > 0 && (
          <div className="cc-preview-days">
            {dayKeys.map(k => {
              const s = slots[k];
              return (
                <span key={k} className="cc-preview-day-chip">
                  {DAY_LABEL_TH[k]}{s.start && s.end ? ` ${s.start}-${s.end}` : ''}
                </span>
              );
            })}
          </div>
        )}

        <div className="cc-preview-stats">
          <div><span>ราคา</span><strong>{baht ? `฿${baht}` : '-'}</strong></div>
          <div><span>ชั่วโมงรวม</span><strong>{form.totalHours || '-'}</strong></div>
          <div><span>ที่นั่ง</span><strong>{form.seatLimit || '-'}</strong></div>
        </div>
      </div>

      <div className="cc-sidebar-card">
        <div className="cc-sidebar-title">ความครบถ้วนของข้อมูล ({doneCount}/{checklist.length})</div>
        <ul className="cc-checklist">
          {checklist.map(c => (
            <li key={c.label} className={c.done ? 'cc-checklist-done' : ''}>
              <span className="cc-checklist-icon">{c.done ? '✓' : ''}</span>{c.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="cc-sidebar-note">
        💡 คอร์สจะถูกมอบหมายให้ติวเตอร์ทันทีตามวัน-เวลาที่เลือก และส่งอีเมลแจ้งเตือนติวเตอร์ทันทีหลังบันทึก
        ติวเตอร์เพิ่มบทเรียน/ข้อสอบได้เลย ระบบจะเปลี่ยนสถานะเป็น "เปิดรับสมัคร" ให้อัตโนมัติเมื่อถึงวันเปิดรับสมัคร
        (ถ้ายังไม่มีบทเรียนจะค้างสถานะ "รอเปิดรับสมัคร" ไว้ก่อน) และปิดรับสมัครอัตโนมัติเมื่อถึงวันที่กำหนด
        หรือแอดมินจะเปลี่ยนสถานะเองก็ได้เช่นกัน
      </div>
    </aside>
  );
}

export default function AdminCourseCreatePage() {
  const navigate = useNavigate();
  const institution = useInstitutionProfile();
  const allowedSlots = useMemo(
    () => parseDaySlots(institution?.allowedTimeSlots),
    [institution]
  );

  const [tutors, setTutors] = useState([]);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorAvail, setTutorAvail] = useState(null);
  const [availLoading, setAvailLoading] = useState(false);

  const [form, setForm] = useState(loadDraftForm);
  const [formErr, setFormErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // เก็บฉบับร่างไว้ใน sessionStorage ทุกครั้งที่ฟอร์มเปลี่ยน — กันข้อมูลหายตอนรีเฟรช/เปลี่ยนหน้าโดยไม่ตั้งใจ
  // จะล้างออกก็ต่อเมื่อกด "ยกเลิก" หรือสร้างคอร์สสำเร็จเท่านั้น (ดู handleCancel / handleSubmit)
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
    } catch {
      // เต็ม/ถูกบล็อก (private mode) — ปล่อยผ่าน ไม่ใช่ข้อมูลสำคัญระดับต้องแจ้งเตือนผู้ใช้
    }
  }, [form]);

  const notify = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  useEffect(() => {
    setTutorLoading(true);
    getTutors({ page: 0, size: 500 })
      .then(d => {
        const list = Array.isArray(d) ? d : (d?.content ?? []);
        setTutors(list);
      })
      .catch(() => notify('โหลดรายชื่อติวเตอร์ไม่สำเร็จ', 'error'))
      .finally(() => setTutorLoading(false));
  }, [notify]);

  useEffect(() => {
    if (!form.tutorId) { setTutorAvail(null); return; }
    setAvailLoading(true);
    getTutorWeeklyAvailability(form.tutorId)
      .then(setTutorAvail)
      .catch(() => setTutorAvail(null))
      .finally(() => setAvailLoading(false));
  }, [form.tutorId]);

  function fld(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setFormErr(e => ({ ...e, [key]: '' }));
  }

  const selectedTutor = useMemo(
    () => tutors.find(t => String(t.id) === String(form.tutorId)),
    [tutors, form.tutorId]
  );

  // วันในสัปดาห์ทั้งหมดที่เลือกไว้ในตารางสอน — "วันที่เริ่มสอน" เลือกได้เฉพาะวันเหล่านี้เท่านั้น
  const scheduleWeekdays = useMemo(
    () => getScheduleWeekdays(form.scheduleSlots),
    [form.scheduleSlots]
  );

  const checklist = useMemo(() => {
    const slots = form.scheduleSlots || {};
    const dayKeys = Object.keys(slots);
    const scheduleDone = dayKeys.length > 0 && dayKeys.every(k => slots[k].start && slots[k].end);
    return [
      { label: 'ชื่อคอร์ส', done: !!form.courseName?.trim() },
      { label: 'ติวเตอร์ผู้สอน', done: !!form.tutorId },
      { label: 'ตารางสอน', done: scheduleDone },
      { label: 'ราคาคอร์ส', done: form.price !== '' && form.price != null && !isNaN(form.price) && Number(form.price) >= 0 },
      { label: 'ชั่วโมงรวม / ที่นั่ง', done: !!form.totalHours && !!form.seatLimit },
      { label: 'วันที่เริ่มสอน', done: !!form.courseStartDate },
    ];
  }, [form]);
  const doneCount = checklist.filter(c => c.done).length;
  const progressPct = Math.round((doneCount / checklist.length) * 100);

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validateCourseForm(form, tutorAvail, true, allowedSlots);
    if (Object.keys(err).length) { setFormErr(err); return; }
    setSaving(true);
    try {
      const scheduleDays = slotsToScheduleDaysArray(form.scheduleSlots || {});
      await createCourse({ ...form, price: Number(form.price), scheduleDays });
      clearDraftForm();
      navigate('/admin/courses', {
        state: { toast: { msg: 'สร้างคอร์สสำเร็จ และส่งการแจ้งเตือนไปยังติวเตอร์แล้ว', type: 'success' } },
      });
    } catch (ex) {
      notify(ex.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    clearDraftForm();
    navigate('/admin/courses');
  }

  return (
    <div className="cc-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="cm-header">
        <div>
          <div className="cc-breadcrumb">
            <a onClick={() => navigate('/admin/courses')}>คอร์สเรียน</a> / เพิ่มคอร์สใหม่
          </div>
          <h1>เพิ่มคอร์สเรียนใหม่</h1>
          <p>กรอกข้อมูลให้ครบถ้วน ระบบจะสร้างรหัสคอร์สอัตโนมัติหลังบันทึก</p>
        </div>
      </div>

      <div className="cc-progress-track">
        <div className="cc-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="cc-layout">
        <form id="cc-create-form" className="cc-main" onSubmit={handleSubmit}>

          <SectionCard step={1} icon="📘" title="ข้อมูลพื้นฐาน" desc="ชื่อคอร์สและรายละเอียดคอร์สสำหรับผู้เรียน">
            <div className="cm-field">
              <label>ชื่อคอร์ส *</label>
              <input value={form.courseName} onChange={e => fld('courseName', e.target.value)} placeholder="เช่น คณิตศาสตร์ ม.6" />
              {formErr.courseName && <span className="cm-err">{formErr.courseName}</span>}
              <span className="cm-field-hint">รหัสคอร์สจะถูกสร้างให้อัตโนมัติตามลำดับ (เช่น CRS-0001) และไม่สามารถแก้ไขภายหลังได้</span>
            </div>
            <div className="cm-field">
              <label>รายละเอียดคอร์ส</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={e => fld('description', e.target.value)}
                placeholder="อธิบายเนื้อหาคอร์ส เป้าหมายผู้เรียน สิ่งที่จะได้รับ..."
              />
            </div>
          </SectionCard>

                    <SectionCard step={2} icon="💰" title="ราคาและจำนวนที่นั่ง" desc="ราคาคอร์สจะไม่แสดงให้ติวเตอร์เห็น">
            <div className="cm-field">
              <label>ราคาคอร์ส (บาท) *</label>
              <input
                type="number" min="0" step="0.01"
                value={form.price}
                onChange={e => fld('price', e.target.value)}
                placeholder="0.00"
              />
              {formErr.price && <span className="cm-err">{formErr.price}</span>}
            </div>
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
          </SectionCard>

          <SectionCard step={3} icon="👨‍🏫" title="ติวเตอร์ผู้สอน" desc="เลือกติวเตอร์จากระบบและตรวจสอบตารางว่าง">
            <TutorSelectField
              tutors={tutors}
              tutorLoading={tutorLoading}
              tutorAvail={tutorAvail}
              availLoading={availLoading}
              value={form.tutorId}
              onChange={v => fld('tutorId', v)}
              err={formErr.tutorId}
            />
          </SectionCard>



          <SectionCard step={4} icon="📅" title="ตารางสอน" desc="กำหนดวันและเวลาสอนในแต่ละสัปดาห์ ระบบตรวจสอบเวลาว่างของติวเตอร์ให้อัตโนมัติ">
            <ScheduleSection
              form={form} fld={fld} avail={tutorAvail} err={formErr.scheduleTime}
              allowed={allowedSlots}
            />
          </SectionCard>

          <SectionCard step={5} icon="🗓️" title="กำหนดการรับสมัคร" desc="วันเปิด-ปิดรับสมัคร และวันที่เริ่มเรียนจริง">
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
          </SectionCard>
        </form>

        <SummarySidebar form={form} tutor={selectedTutor} checklist={checklist} doneCount={doneCount} />
      </div>

      <div className="cc-action-bar">
        <button type="button" className="cm-btn-cancel" onClick={handleCancel}>ยกเลิก</button>
        <button type="submit" form="cc-create-form" className="cm-btn-primary" disabled={saving}>
          {saving ? 'กำลังสร้าง...' : '✓ สร้างคอร์สและแจ้งติวเตอร์'}
        </button>
      </div>
    </div>
  );
}
