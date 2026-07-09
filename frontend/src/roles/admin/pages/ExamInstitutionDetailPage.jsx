import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInstitutionAchievements } from '../services/examInstitutionService';
import {
  createStudentExamAchievement,
  updateStudentExamAchievement,
  deleteStudentExamAchievement,
  getStudentExamAchievementById,
} from '../services/studentExamAchievementService';
import { getEnrollmentsByStudent } from '../services/adminEnrollmentService';
import { getStudents } from '../services/adminStudentService';
import './ExamInstitutionDetailPage.css';

const TYPE_LABEL = {
  LOWER_SECONDARY: 'มัธยมต้น',
  UPPER_SECONDARY: 'มัธยมปลาย',
  UNIVERSITY: 'มหาวิทยาลัย / ป.ตรี',
  OTHER: 'อื่น ๆ',
};

const EMPTY_FORM = {
  studentId: '',
  educationLevel: '',
  lowerSecondaryRoomType: '',
  upperSecondaryProgram: '',
  faculty: '',
  major: '',
  admissionRound: '',
  academicYear: '',
  resultDate: '',
  note: '',
  active: true,
};

function formatCourseNames(names) {
  if (!names || names.length === 0) return 'ยังไม่มีคอร์สที่เรียน';
  return names.join(', ');
}

function validateForm(f) {
  const e = {};
  if (!f.studentId) e.studentId = 'กรุณาเลือกนักเรียน';
  if (!f.educationLevel) e.educationLevel = 'กรุณาเลือกระดับที่สอบติด';
  if (f.educationLevel === 'LOWER_SECONDARY' && !f.lowerSecondaryRoomType?.trim()) {
    e.lowerSecondaryRoomType = 'กรุณากรอกห้องเรียนสำหรับระดับมัธยมต้น';
  }
  if (f.educationLevel === 'UPPER_SECONDARY' && !f.upperSecondaryProgram?.trim()) {
    e.upperSecondaryProgram = 'กรุณากรอกสายการเรียนสำหรับระดับมัธยมปลาย';
  }
  if (f.educationLevel === 'BACHELOR') {
    if (!f.faculty?.trim()) e.faculty = 'กรุณากรอกคณะ';
    if (!f.major?.trim()) e.major = 'กรุณากรอกสาขา';
  }
  if (!f.academicYear) e.academicYear = 'กรุณากรอกปีการศึกษา';
  return e;
}

// ── Toast ─────────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`eid-toast eid-toast--${type}`}>
      <span>{msg}</span>
      <button onClick={onClose} aria-label="ปิด">✕</button>
    </div>
  );
}

// ── Course Picker: พิมพ์ชื่อ/รหัสคอร์ส หรือคลิกเพื่อเลือกจากคอร์สที่นักเรียนลงทะเบียนแล้ว ──

function CoursePicker({ enrollments, loading, disabled, selectedIds, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const selected = enrollments.filter((en) => selectedIds.includes(en.id));
  const available = enrollments.filter((en) => !selectedIds.includes(en.id));
  const term = query.trim().toLowerCase();
  const filtered = term
    ? available.filter((en) =>
        (en.courseName || '').toLowerCase().includes(term) ||
        (en.courseCode || '').toLowerCase().includes(term))
    : available;

  function addCourse(enrollmentId) {
    onChange([...selectedIds, enrollmentId]);
    setQuery('');
  }

  function removeCourse(enrollmentId) {
    onChange(selectedIds.filter((id) => id !== enrollmentId));
  }

  return (
    <div className="eid-course-picker">
      {selected.length > 0 && (
        <div className="eid-course-chips">
          {selected.map((en) => (
            <span key={en.id} className="eid-course-chip">
              {en.courseName} ({en.courseCode})
              <button type="button" onClick={() => removeCourse(en.id)} aria-label="เอาออก">✕</button>
            </span>
          ))}
        </div>
      )}

      {disabled ? (
        <p className="eid-course-picker-hint">กรุณาเลือกนักเรียนก่อน</p>
      ) : loading ? (
        <p className="eid-course-picker-hint">กำลังโหลดคอร์สที่นักเรียนลงทะเบียน...</p>
      ) : enrollments.length === 0 ? (
        <p className="eid-course-picker-hint">นักเรียนคนนี้ยังไม่ได้ลงทะเบียนคอร์สใด</p>
      ) : (
        <div className="eid-course-picker-input-wrap">
          <input
            type="text"
            className="eid-course-picker-input"
            placeholder="พิมพ์ชื่อคอร์สหรือรหัสคอร์ส หรือคลิกเพื่อเลือก..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
          />
          {open && (
            <div className="eid-course-picker-dropdown">
              {filtered.length === 0 ? (
                <div className="eid-course-picker-empty">ไม่พบคอร์สที่ตรงกัน หรือเลือกครบแล้ว</div>
              ) : (
                filtered.map((en) => (
                  <button
                    type="button"
                    key={en.id}
                    className="eid-course-picker-option"
                    onMouseDown={() => addCourse(en.id)}
                  >
                    <span className="eid-course-picker-option-name">{en.courseName}</span>
                    <span className="eid-course-picker-option-code">{en.courseCode}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Suggest Input: พิมพ์ค่าใหม่ได้ หรือเลือกจากค่าที่เคยบันทึกไว้แล้ว ──────

function SuggestInput({ value, onChange, suggestions, placeholder }) {
  const [open, setOpen] = useState(false);
  const term = value.trim().toLowerCase();
  const filtered = term
    ? suggestions.filter((s) => s.toLowerCase().includes(term) && s !== value)
    : suggestions;

  return (
    <div className="eid-suggest-wrap">
      <input
        type="text"
        className="eid-suggest-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && filtered.length > 0 && (
        <div className="eid-suggest-dropdown">
          {filtered.map((s) => (
            <button
              type="button"
              key={s}
              className="eid-suggest-option"
              onMouseDown={() => { onChange(s); setOpen(false); }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Achievement Table (ใช้ร่วมกันทั้งมุมมองโรงเรียนและมหาวิทยาลัย) ─────────

function AchievementTable({ columns, rows, emptyText, onViewDetail, onEdit, onDelete }) {
  if (rows.length === 0) {
    return (
      <div className="eid-empty">
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="eid-table-card">
      <div className="eid-table-wrap">
        <table className="eid-table">
          <thead>
            <tr>
              <th>ชื่อนักเรียน</th>
              <th>ปีการศึกษา</th>
              {columns.map((col) => <th key={col.key}>{col.label}</th>)}
              <th>คอร์สที่เรียน</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.achievementId} className="eid-table-row">
                <td className="eid-text-name">{r.studentName}</td>
                <td>{r.academicYear || '—'}</td>
                {columns.map((col) => (
                  <td key={col.key}>{r[col.key] || '—'}</td>
                ))}
                <td className="eid-course-cell" title={formatCourseNames(r.courseNames)}>
                  {r.courseSummary}
                </td>
                <td>
                  <div className="eid-actions">
                    <button className="eid-row-btn" onClick={() => onViewDetail(r.achievementId)}>
                      ดูรายละเอียด
                    </button>
                    <button className="eid-btn-icon" title="แก้ไข" onClick={() => onEdit(r.achievementId)}>✏️</button>
                    <button className="eid-btn-icon" title="ลบ" onClick={() => onDelete(r)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── มุมมองโรงเรียน: แท็บ ทั้งหมด / มัธยมต้น / มัธยมปลาย ─────────────────────

const SCHOOL_TABS = [
  { key: 'ALL', label: 'ทั้งหมด' },
  { key: 'LOWER_SECONDARY', label: 'มัธยมต้น' },
  { key: 'UPPER_SECONDARY', label: 'มัธยมปลาย' },
];

function SchoolAchievementView({ lowerSecondary, upperSecondary, onViewDetail, onEdit, onDelete }) {
  const [tab, setTab] = useState('ALL');

  let rows;
  let columns;
  let emptyText;

  if (tab === 'LOWER_SECONDARY') {
    rows = lowerSecondary;
    columns = [{ key: 'lowerSecondaryRoomType', label: 'ห้องเรียน' }];
    emptyText = 'ยังไม่มีนักเรียนที่สอบติดระดับมัธยมต้น';
  } else if (tab === 'UPPER_SECONDARY') {
    rows = upperSecondary;
    columns = [{ key: 'upperSecondaryProgram', label: 'สายการเรียน' }];
    emptyText = 'ยังไม่มีนักเรียนที่สอบติดระดับมัธยมปลาย';
  } else {
    rows = [
      ...lowerSecondary.map((r) => ({ ...r, levelLabel: 'มัธยมต้น', detail: r.lowerSecondaryRoomType })),
      ...upperSecondary.map((r) => ({ ...r, levelLabel: 'มัธยมปลาย', detail: r.upperSecondaryProgram })),
    ];
    columns = [
      { key: 'levelLabel', label: 'ระดับ' },
      { key: 'detail', label: 'รายละเอียด' },
    ];
    emptyText = 'ยังไม่มีนักเรียนที่สอบติดสถาบันนี้';
  }

  return (
    <div className="eid-section">
      <div className="eid-tabs">
        {SCHOOL_TABS.map((t) => (
          <button
            key={t.key}
            className={`eid-tab${tab === t.key ? ' eid-tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <AchievementTable
        columns={columns}
        rows={rows}
        emptyText={emptyText}
        onViewDetail={onViewDetail}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

// ── มุมมองมหาวิทยาลัย: แท็บคณะ → แท็บย่อยสาขา ───────────────────────────────

function UniversityAchievementView({ bachelor, onViewDetail, onEdit, onDelete }) {
  const [activeFaculty, setActiveFaculty] = useState('ALL');
  const [activeMajor, setActiveMajor] = useState('ALL');

  const faculties = useMemo(
    () => Array.from(new Set(bachelor.map((b) => b.faculty).filter(Boolean))).sort(),
    [bachelor]
  );

  function selectFaculty(f) {
    setActiveFaculty(f);
    setActiveMajor('ALL');
  }

  const facultyFiltered = activeFaculty === 'ALL'
    ? bachelor
    : bachelor.filter((b) => b.faculty === activeFaculty);

  const majors = useMemo(
    () => Array.from(new Set(facultyFiltered.map((b) => b.major).filter(Boolean))).sort(),
    [facultyFiltered]
  );

  const rows = activeMajor === 'ALL'
    ? facultyFiltered
    : facultyFiltered.filter((b) => b.major === activeMajor);

  const columns = [];
  if (activeFaculty === 'ALL') columns.push({ key: 'faculty', label: 'คณะ' });
  if (activeMajor === 'ALL') columns.push({ key: 'major', label: 'สาขา' });
  columns.push({ key: 'admissionRound', label: 'รอบที่สอบติด' });

  if (bachelor.length === 0) {
    return (
      <div className="eid-section">
        <div className="eid-empty">
          <p>ยังไม่มีนักเรียนที่สอบติดสถาบันนี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="eid-section">
      <div className="eid-tabs">
        <button
          className={`eid-tab${activeFaculty === 'ALL' ? ' eid-tab--active' : ''}`}
          onClick={() => selectFaculty('ALL')}
        >
          ทั้งหมด
        </button>
        {faculties.map((f) => (
          <button
            key={f}
            className={`eid-tab${activeFaculty === f ? ' eid-tab--active' : ''}`}
            onClick={() => selectFaculty(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {majors.length > 0 && (
        <div className="eid-subtabs">
          <button
            className={`eid-subtab${activeMajor === 'ALL' ? ' eid-subtab--active' : ''}`}
            onClick={() => setActiveMajor('ALL')}
          >
            ทั้งหมด
          </button>
          {majors.map((m) => (
            <button
              key={m}
              className={`eid-subtab${activeMajor === m ? ' eid-subtab--active' : ''}`}
              onClick={() => setActiveMajor(m)}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      <AchievementTable
        columns={columns}
        rows={rows}
        emptyText="ยังไม่มีนักเรียนที่สอบติดในคณะ/สาขานี้"
        onViewDetail={onViewDetail}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ExamInstitutionDetailPage() {
  const { institutionId } = useParams();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [students, setStudents] = useState([]);

  // form modal state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);

  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function notify(msg, type = 'success') {
    setToast({ msg, type });
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getInstitutionAchievements(institutionId);
      setOverview(data);
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลสถาบันได้');
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getStudents({ page: 0, size: 1000 })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.content ?? []);
        setStudents(list);
      })
      .catch(() => { /* ตัวเลือกนักเรียนเป็นข้อมูลเสริม ไม่บล็อกหน้าหลัก */ });
  }, []);

  useEffect(() => {
    if (!form.studentId) { setStudentEnrollments([]); return; }
    let cancelled = false;
    setLoadingEnrollments(true);
    getEnrollmentsByStudent(form.studentId)
      .then((data) => { if (!cancelled) setStudentEnrollments(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setStudentEnrollments([]); })
      .finally(() => { if (!cancelled) setLoadingEnrollments(false); });
    return () => { cancelled = true; };
  }, [form.studentId]);

  // คณะ/สาขาที่เคยบันทึกไว้แล้วในสถาบันนี้ — ใช้เป็นตัวเลือกให้พิมพ์/เลือกตอนกรอกฟอร์ม
  const facultyOptions = useMemo(
    () => Array.from(new Set((overview?.bachelor || []).map((b) => b.faculty).filter(Boolean))).sort(),
    [overview]
  );
  const majorOptionsForFaculty = useMemo(
    () => Array.from(new Set(
      (overview?.bachelor || [])
        .filter((b) => b.faculty === form.faculty)
        .map((b) => b.major)
        .filter(Boolean)
    )).sort(),
    [overview, form.faculty]
  );

  function goToAchievementDetail(achievementId) {
    navigate(`/admin/student-exam-achievements/${achievementId}/detail`);
  }

  function fld(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    setFormErr((e) => ({ ...e, [key]: '' }));
  }

  function fldStudent(val) {
    setForm((f) => ({ ...f, studentId: val }));
    setFormErr((e) => ({ ...e, studentId: '' }));
    setSelectedCourseIds([]);
  }

  function fldFaculty(val) {
    setForm((f) => ({ ...f, faculty: val, major: '' }));
    setFormErr((e) => ({ ...e, faculty: '', major: '' }));
  }

  function openCreate() {
    setFormMode('create');
    setEditingId(null);
    const isUniversity = overview?.institution?.institutionType === 'UNIVERSITY';
    setForm({ ...EMPTY_FORM, educationLevel: isUniversity ? 'BACHELOR' : '' });
    setFormErr({});
    setSelectedCourseIds([]);
    setShowForm(true);
  }

  async function openEdit(achievementId) {
    try {
      const a = await getStudentExamAchievementById(achievementId);
      setFormMode('edit');
      setEditingId(achievementId);
      setForm({
        studentId: a.studentId ?? '',
        educationLevel: a.educationLevel ?? '',
        lowerSecondaryRoomType: a.lowerSecondaryRoomType ?? '',
        upperSecondaryProgram: a.upperSecondaryProgram ?? '',
        faculty: a.faculty ?? '',
        major: a.major ?? '',
        admissionRound: a.admissionRound ?? '',
        academicYear: a.academicYear ?? '',
        resultDate: a.resultDate ?? '',
        note: a.note ?? '',
        active: a.active ?? true,
      });
      setSelectedCourseIds((a.taggedCourses || []).map((c) => c.enrollmentId));
      setFormErr({});
      setShowForm(true);
    } catch (err) {
      notify(err.message || 'ไม่สามารถโหลดข้อมูลผลการสอบติดได้', 'error');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validateForm(form);
    if (Object.keys(err).length) { setFormErr(err); return; }

    setSaving(true);
    try {
      const payload = {
        studentId: Number(form.studentId),
        examInstitutionId: Number(institutionId),
        enrollmentIds: selectedCourseIds,
        educationLevel: form.educationLevel,
        lowerSecondaryRoomType: form.educationLevel === 'LOWER_SECONDARY' ? form.lowerSecondaryRoomType?.trim() || null : null,
        upperSecondaryProgram: form.educationLevel === 'UPPER_SECONDARY' ? form.upperSecondaryProgram?.trim() || null : null,
        faculty: form.educationLevel === 'BACHELOR' ? form.faculty?.trim() || null : null,
        major: form.educationLevel === 'BACHELOR' ? form.major?.trim() || null : null,
        admissionRound: form.admissionRound?.trim() || null,
        academicYear: Number(form.academicYear),
        resultDate: form.resultDate || null,
        note: form.note?.trim() || null,
        active: form.active,
      };

      if (formMode === 'create') {
        await createStudentExamAchievement(payload);
        notify('เพิ่มนักเรียนที่สอบติดสำเร็จ');
      } else {
        await updateStudentExamAchievement(editingId, payload);
        notify('แก้ไขข้อมูลผลการสอบติดสำเร็จ');
      }

      setShowForm(false);
      await load();
    } catch (ex) {
      notify(ex.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteStudentExamAchievement(confirmDelete.achievementId);
      notify('ลบผลการสอบติดสำเร็จ');
      setConfirmDelete(null);
      await load();
    } catch (ex) {
      notify(ex.message, 'error');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="eid-page">
        <div className="eid-loading">
          <div className="eid-spinner" />
          <span>กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="eid-page">
        <div className="eid-error-card">
          <p className="eid-error-title">โหลดข้อมูลไม่สำเร็จ</p>
          <p className="eid-error-msg">{error || 'ไม่พบข้อมูลสถาบัน'}</p>
          <div className="eid-error-actions">
            <button className="eid-btn eid-btn--ghost" onClick={() => navigate('/admin/exam-institutions')}>
              ← กลับไปหน้ารายการสถาบัน
            </button>
            <button className="eid-btn eid-btn--primary" onClick={load}>ลองใหม่</button>
          </div>
        </div>
      </div>
    );
  }

  const { institution, lowerSecondary, upperSecondary, bachelor } = overview;
  const isUniversity = institution.institutionType === 'UNIVERSITY';
  const facultyCount = new Set(bachelor.map((b) => b.faculty).filter(Boolean)).size;
  const majorCount = new Set(bachelor.map((b) => b.major).filter(Boolean)).size;

  return (
    <div className="eid-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <div className="eid-header">
        <div className="eid-header-top">
          <button className="eid-btn eid-btn--ghost" onClick={() => navigate('/admin/exam-institutions')}>
            ← ย้อนกลับ
          </button>
          <div className="eid-header-top-actions">
            <button className="eid-btn eid-btn--primary" onClick={openCreate}>
              + เพิ่มนักเรียนที่สอบติด
            </button>
            <button className="eid-btn eid-btn--ghost" onClick={() => navigate('/admin/exam-institutions')}>
              แก้ไขสถาบัน
            </button>
          </div>
        </div>
        <h1 className="eid-title">{institution.institutionName}</h1>
        <div className="eid-meta-row">
          <span className="eid-code-badge">{institution.institutionCode}</span>
          <span className="eid-meta-item">
            {institution.institutionTypeLabel || TYPE_LABEL[institution.institutionType] || '—'}
          </span>
          {institution.province && <span className="eid-meta-item">{institution.province}</span>}
          {institution.district && <span className="eid-meta-item">{institution.district}</span>}
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="eid-stats-grid">
        {isUniversity ? (
          <>
            <div className="eid-stat-card eid-stat-card--success">
              <span className="eid-stat-value">{bachelor.length}</span>
              <span className="eid-stat-label">นักเรียนสอบติดทั้งหมด</span>
            </div>
            <div className="eid-stat-card">
              <span className="eid-stat-value">{facultyCount}</span>
              <span className="eid-stat-label">คณะ</span>
            </div>
            <div className="eid-stat-card">
              <span className="eid-stat-value">{majorCount}</span>
              <span className="eid-stat-label">สาขา</span>
            </div>
          </>
        ) : (
          <>
            <div className="eid-stat-card eid-stat-card--success">
              <span className="eid-stat-value">{lowerSecondary.length + upperSecondary.length}</span>
              <span className="eid-stat-label">นักเรียนสอบติดทั้งหมด</span>
            </div>
            <div className="eid-stat-card">
              <span className="eid-stat-value">{lowerSecondary.length}</span>
              <span className="eid-stat-label">มัธยมต้น</span>
            </div>
            <div className="eid-stat-card">
              <span className="eid-stat-value">{upperSecondary.length}</span>
              <span className="eid-stat-label">มัธยมปลาย</span>
            </div>
          </>
        )}
      </div>

      {/* ── ระดับ: แท็บตามประเภทสถาบัน ── */}
      {isUniversity ? (
        <UniversityAchievementView
          bachelor={bachelor}
          onViewDetail={goToAchievementDetail}
          onEdit={openEdit}
          onDelete={setConfirmDelete}
        />
      ) : (
        <SchoolAchievementView
          lowerSecondary={lowerSecondary}
          upperSecondary={upperSecondary}
          onViewDetail={goToAchievementDetail}
          onEdit={openEdit}
          onDelete={setConfirmDelete}
        />
      )}

      {/* ═══ CREATE / EDIT MODAL ═══ */}
      {showForm && (
        <div className="eid-overlay" onClick={() => setShowForm(false)}>
          <div className="eid-modal" onClick={(e) => e.stopPropagation()}>
            <div className="eid-modal-header">
              <h2>{formMode === 'create' ? 'เพิ่มนักเรียนที่สอบติด' : 'แก้ไขผลการสอบติด'}</h2>
              <button className="eid-modal-close" onClick={() => setShowForm(false)} aria-label="ปิด">✕</button>
            </div>
            <form className="eid-form" onSubmit={handleSubmit}>
              <div className="eid-field">
                <label>สถาบันที่สอบติด</label>
                <div className="eid-locked-field">{institution.institutionName} ({institution.institutionCode})</div>
              </div>

              <div className="eid-field">
                <label>นักเรียน *</label>
                <select value={form.studentId} onChange={(e) => fldStudent(e.target.value)}>
                  <option value="">— เลือกนักเรียน —</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.studentCode})</option>
                  ))}
                </select>
                {formErr.studentId && <span className="eid-err">{formErr.studentId}</span>}
              </div>

              <div className="eid-field">
                <label>ระดับที่สอบติด *</label>
                <select
                  value={form.educationLevel}
                  onChange={(e) => fld('educationLevel', e.target.value)}
                  disabled={isUniversity}
                >
                  <option value="">— เลือกระดับที่สอบติด —</option>
                  {isUniversity ? (
                    <option value="BACHELOR">มหาวิทยาลัย / ปริญญาตรี</option>
                  ) : (
                    <>
                      <option value="LOWER_SECONDARY">มัธยมต้น</option>
                      <option value="UPPER_SECONDARY">มัธยมปลาย</option>
                    </>
                  )}
                </select>
                {formErr.educationLevel && <span className="eid-err">{formErr.educationLevel}</span>}
              </div>

              {form.educationLevel === 'LOWER_SECONDARY' && (
                <div className="eid-field">
                  <label>ห้องเรียนระดับมัธยมต้น *</label>
                  <input
                    value={form.lowerSecondaryRoomType}
                    onChange={(e) => fld('lowerSecondaryRoomType', e.target.value)}
                    placeholder="เช่น ห้อง Gifted, ห้อง English Program"
                  />
                  {formErr.lowerSecondaryRoomType && <span className="eid-err">{formErr.lowerSecondaryRoomType}</span>}
                </div>
              )}

              {form.educationLevel === 'UPPER_SECONDARY' && (
                <div className="eid-field">
                  <label>สายการเรียนระดับมัธยมปลาย *</label>
                  <input
                    value={form.upperSecondaryProgram}
                    onChange={(e) => fld('upperSecondaryProgram', e.target.value)}
                    placeholder="เช่น วิทย์-คณิต, ศิลป์-คำนวณ"
                  />
                  {formErr.upperSecondaryProgram && <span className="eid-err">{formErr.upperSecondaryProgram}</span>}
                </div>
              )}

              {form.educationLevel === 'BACHELOR' && (
                <div className="eid-form-row">
                  <div className="eid-field">
                    <label>คณะ *</label>
                    <SuggestInput
                      value={form.faculty}
                      onChange={fldFaculty}
                      suggestions={facultyOptions}
                      placeholder="เช่น คณะวิศวกรรมศาสตร์"
                    />
                    {formErr.faculty && <span className="eid-err">{formErr.faculty}</span>}
                  </div>
                  <div className="eid-field">
                    <label>สาขา *</label>
                    <SuggestInput
                      value={form.major}
                      onChange={(v) => fld('major', v)}
                      suggestions={majorOptionsForFaculty}
                      placeholder="เช่น วิศวกรรมคอมพิวเตอร์"
                    />
                    {formErr.major && <span className="eid-err">{formErr.major}</span>}
                    {form.faculty && majorOptionsForFaculty.length === 0 && (
                      <span className="eid-hint">ยังไม่เคยบันทึกสาขาในคณะนี้ — พิมพ์สาขาใหม่ได้เลย</span>
                    )}
                  </div>
                </div>
              )}

              <div className="eid-form-row">
                <div className="eid-field">
                  <label>รอบที่สอบติด</label>
                  <input
                    value={form.admissionRound}
                    onChange={(e) => fld('admissionRound', e.target.value)}
                    placeholder="เช่น Portfolio, Quota, Admission"
                  />
                </div>
                <div className="eid-field">
                  <label>ปีการศึกษา *</label>
                  <input
                    type="number"
                    value={form.academicYear}
                    onChange={(e) => fld('academicYear', e.target.value)}
                    placeholder="เช่น 2567"
                  />
                  {formErr.academicYear && <span className="eid-err">{formErr.academicYear}</span>}
                </div>
              </div>

              <div className="eid-field">
                <label>วันที่ประกาศผล / วันที่บันทึกผล</label>
                <input type="date" value={form.resultDate} onChange={(e) => fld('resultDate', e.target.value)} />
              </div>

              <div className="eid-field">
                <label>คอร์สที่เรียน</label>
                <CoursePicker
                  enrollments={studentEnrollments}
                  loading={loadingEnrollments}
                  disabled={!form.studentId}
                  selectedIds={selectedCourseIds}
                  onChange={setSelectedCourseIds}
                />
              </div>

              <div className="eid-field">
                <label>หมายเหตุ</label>
                <textarea
                  rows={2}
                  value={form.note}
                  onChange={(e) => fld('note', e.target.value)}
                  placeholder="ข้อมูลเพิ่มเติม..."
                />
              </div>

              <div className="eid-field eid-field--checkbox">
                <label className="eid-checkbox-label">
                  <input type="checkbox" checked={!!form.active} onChange={(e) => fld('active', e.target.checked)} />
                  ใช้งาน
                </label>
              </div>

              <div className="eid-form-actions">
                <button type="button" className="eid-btn eid-btn--ghost" onClick={() => setShowForm(false)}>ยกเลิก</button>
                <button type="submit" className="eid-btn eid-btn--primary" disabled={saving}>
                  {saving ? 'กำลังบันทึก...' : formMode === 'create' ? 'เพิ่มนักเรียนที่สอบติด' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ CONFIRM DELETE MODAL ═══ */}
      {confirmDelete && (
        <div className="eid-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="eid-modal eid-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="eid-modal-header">
              <h2>ยืนยันการลบ</h2>
              <button className="eid-modal-close" onClick={() => setConfirmDelete(null)} aria-label="ปิด">✕</button>
            </div>
            <div className="eid-modal-body">
              <p>
                ต้องการลบบันทึกผลสอบติดของ <strong>{confirmDelete.studentName}</strong> ใช่หรือไม่?
                ข้อมูลจะถูกซ่อนจากรายการแต่ยังคงอยู่ในระบบ
              </p>
              <div className="eid-form-actions">
                <button className="eid-btn eid-btn--ghost" onClick={() => setConfirmDelete(null)}>ยกเลิก</button>
                <button className="eid-btn eid-btn--danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'กำลังบันทึก...' : 'ลบ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
