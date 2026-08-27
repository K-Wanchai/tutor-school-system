import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getStudentExamAchievements,
  createStudentExamAchievement,
  updateStudentExamAchievement,
  deleteStudentExamAchievement,
  getStudentExamAchievementById,
} from '../services/studentExamAchievementService';
import { getExamInstitutions, getExamInstitutionById } from '../services/examInstitutionService';
import { getEnrollmentsByStudent } from '../services/adminEnrollmentService';
import { getStudents } from '../services/adminStudentService';
import { getFaculties, getMajors } from '../services/academicFacultyService';
import { getSchoolTracks } from '../services/schoolTrackService';
import { getVocationalMajors } from '../services/vocationalMajorService';
import { getAdmissionRounds } from '../services/admissionRoundService';
import { LEVEL_LABEL } from './StudentAchievementDetailPage';
import DateInput from '../../../shared/components/DateInput';
import './ExamInstitutionManagePage.css';
import './ExamInstitutionDetailPage.css';

const LEVEL_FILTER_OPTIONS = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'LOWER_SECONDARY', label: 'มัธยมต้น' },
  { value: 'UPPER_SECONDARY', label: 'มัธยมปลาย' },
  { value: 'VOCATIONAL_DIPLOMA', label: 'อนุปริญญา (ปวส.)' },
  { value: 'BACHELOR', label: 'มหาวิทยาลัย / ป.ตรี' },
];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'true', label: 'ใช้งาน' },
  { value: 'false', label: 'ไม่ใช้งาน' },
];

const EMPTY_FILTERS = { keyword: '', institutionId: '', educationLevel: '', academicYear: '', active: '' };

// ค่าเริ่มต้นของหน้านี้ (และของปุ่ม "ล้างค่า") แสดงเฉพาะรายการที่ใช้งานอยู่ ไม่ปนรายการที่ถูกลบ (ปิดใช้งาน) แล้ว
const DEFAULT_FILTERS = { ...EMPTY_FILTERS, active: 'true' };

// เฉพาะการลงทะเบียนที่แอดมินยืนยัน (อนุมัติ) แล้วเท่านั้น ที่นำมาแท็กเป็นคอร์สที่เรียนในผลสอบติดได้
const CONFIRMED_ENROLLMENT_STATUSES = ['APPROVED', 'COMPLETED'];

const EMPTY_FORM = {
  examInstitutionId: '',
  studentId: '',
  educationLevel: '',
  schoolTrackId: '',
  facultyId: '',
  academicMajorId: '',
  vocationalMajorId: '',
  admissionRoundId: '',
  academicYear: '',
  resultDate: '',
  note: '',
  active: true,
};

function levelDetail(a) {
  if (a.educationLevel === 'LOWER_SECONDARY' || a.educationLevel === 'UPPER_SECONDARY') return a.schoolTrackName || '—';
  if (a.educationLevel === 'VOCATIONAL_DIPLOMA') return a.vocationalMajorName || '—';
  if (a.educationLevel === 'BACHELOR') return [a.facultyName, a.majorName].filter(Boolean).join(' / ') || '—';
  return '—';
}

function courseSummary(a) {
  const names = (a.taggedCourses || []).map((c) => c.courseName);
  return names.length ? names.join(', ') : 'ยังไม่มีคอร์สที่เรียน';
}

function validateForm(f) {
  const e = {};
  if (!f.examInstitutionId) e.examInstitutionId = 'กรุณาเลือกสถาบัน';
  if (!f.studentId) e.studentId = 'กรุณาเลือกนักเรียน';
  if (!f.educationLevel) e.educationLevel = 'กรุณาเลือกระดับที่สอบติด';
  if ((f.educationLevel === 'LOWER_SECONDARY' || f.educationLevel === 'UPPER_SECONDARY') && !f.schoolTrackId) {
    e.schoolTrackId = 'กรุณาเลือกสายการเรียน/ห้องเรียน';
  }
  if (f.educationLevel === 'BACHELOR') {
    if (!f.facultyId) e.facultyId = 'กรุณาเลือกคณะ';
    if (!f.academicMajorId) e.academicMajorId = 'กรุณาเลือกสาขา';
  }
  if (f.educationLevel === 'VOCATIONAL_DIPLOMA' && !f.vocationalMajorId) {
    e.vocationalMajorId = 'กรุณาเลือกสาขา';
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
    <div className={`eim-toast eim-toast--${type}`}>
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

// ── Main Page ─────────────────────────────────────────────────────────────

export default function StudentExamAchievementManagePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [achievements, setAchievements] = useState([]);
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [keywordDraft, setKeywordDraft] = useState('');
  const [institutionDraft, setInstitutionDraft] = useState('');
  const [levelDraft, setLevelDraft] = useState('');
  const [yearDraft, setYearDraft] = useState('');
  const [activeDraft, setActiveDraft] = useState(DEFAULT_FILTERS.active);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [institutions, setInstitutions] = useState([]);
  const [students, setStudents] = useState([]);

  const [facultyList, setFacultyList] = useState([]);
  const [majorList, setMajorList] = useState([]);
  const [trackList, setTrackList] = useState([]);
  const [roundList, setRoundList] = useState([]);
  const [vocationalMajorList, setVocationalMajorList] = useState([]);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [loadingVocationalMajors, setLoadingVocationalMajors] = useState(false);

  // form modal state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [institutionLocked, setInstitutionLocked] = useState(false);

  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function notify(msg, type = 'success') {
    setToast({ msg, type });
  }

  const buildParams = (f) => {
    const params = {};
    if (f.keyword) params.keyword = f.keyword;
    if (f.institutionId) params.institutionId = f.institutionId;
    if (f.educationLevel) params.educationLevel = f.educationLevel;
    if (f.academicYear) params.academicYear = f.academicYear;
    if (f.active !== '') params.active = f.active === 'true';
    return params;
  };

  const load = useCallback(async (appliedFilters) => {
    setLoading(true);
    setError('');
    try {
      const data = await getStudentExamAchievements(buildParams(appliedFilters));
      setAchievements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลนักเรียนที่สอบติดได้');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await getStudentExamAchievements({ active: true });
      setStatsData(Array.isArray(data) ? data : []);
    } catch {
      // สถิติเป็นข้อมูลเสริม ไม่ต้องแจ้ง error ซ้ำกับตารางหลัก
    }
  }, []);

  useEffect(() => {
    load(DEFAULT_FILTERS);
    loadStats();
  }, [load, loadStats]);

  useEffect(() => {
    getExamInstitutions({})
      .then((data) => setInstitutions(Array.isArray(data) ? data : []))
      .catch(() => setInstitutions([]));
  }, []);

  useEffect(() => {
    getStudents({ page: 0, size: 1000 })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.content ?? []);
        setStudents(list);
      })
      .catch(() => { /* ตัวเลือกนักเรียนเป็นข้อมูลเสริม ไม่บล็อกหน้าหลัก */ });
  }, []);

  const stats = useMemo(() => ({
    total: statsData.length,
    lowerSecondary: statsData.filter((a) => a.educationLevel === 'LOWER_SECONDARY').length,
    upperSecondary: statsData.filter((a) => a.educationLevel === 'UPPER_SECONDARY').length,
    vocationalDiploma: statsData.filter((a) => a.educationLevel === 'VOCATIONAL_DIPLOMA').length,
    bachelor: statsData.filter((a) => a.educationLevel === 'BACHELOR').length,
  }), [statsData]);

  const sortedAchievements = useMemo(
    () => [...achievements].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)),
    [achievements]
  );

  function handleSearch(e) {
    e.preventDefault();
    const next = {
      keyword: keywordDraft.trim(),
      institutionId: institutionDraft,
      educationLevel: levelDraft,
      academicYear: yearDraft,
      active: activeDraft,
    };
    setFilters(next);
    load(next);
  }

  function handleClear() {
    setKeywordDraft('');
    setInstitutionDraft('');
    setLevelDraft('');
    setYearDraft('');
    setActiveDraft(DEFAULT_FILTERS.active);
    setFilters(DEFAULT_FILTERS);
    load(DEFAULT_FILTERS);
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
    setForm((f) => ({ ...f, facultyId: val, academicMajorId: '' }));
    setFormErr((e) => ({ ...e, facultyId: '', academicMajorId: '' }));
  }

  function lockedLevelFor(inst) {
    const type = inst?.institutionType;
    const mixedUniversity = type === 'UNIVERSITY' && inst?.offersVocationalDiploma;
    if (mixedUniversity) return '';
    if (type === 'UNIVERSITY') return 'BACHELOR';
    if (type === 'VOCATIONAL_DIPLOMA') return 'VOCATIONAL_DIPLOMA';
    return '';
  }

  function fldInstitution(id) {
    const inst = institutions.find((i) => String(i.id) === String(id)) || null;
    setSelectedInstitution(inst);
    setForm((f) => ({
      ...f,
      examInstitutionId: id,
      educationLevel: lockedLevelFor(inst),
      schoolTrackId: '',
      facultyId: '',
      academicMajorId: '',
      vocationalMajorId: '',
      admissionRoundId: '',
    }));
    setFormErr((e) => ({ ...e, examInstitutionId: '' }));
  }

  function openCreate(presetInstitution) {
    setFormMode('create');
    setEditingId(null);
    setSelectedCourseIds([]);
    setStudentEnrollments([]);
    setFormErr({});
    if (presetInstitution) {
      setInstitutionLocked(true);
      setSelectedInstitution(presetInstitution);
      setForm({ ...EMPTY_FORM, examInstitutionId: presetInstitution.id, educationLevel: lockedLevelFor(presetInstitution) });
    } else {
      setInstitutionLocked(false);
      setSelectedInstitution(null);
      setForm(EMPTY_FORM);
    }
    setShowForm(true);
  }

  async function openEdit(achievementId) {
    try {
      const a = await getStudentExamAchievementById(achievementId);
      const inst = await getExamInstitutionById(a.examInstitutionId);
      setFormMode('edit');
      setEditingId(achievementId);
      setInstitutionLocked(true);
      setSelectedInstitution(inst);
      setForm({
        examInstitutionId: a.examInstitutionId ?? '',
        studentId: a.studentId ?? '',
        educationLevel: a.educationLevel ?? '',
        schoolTrackId: a.schoolTrackId ?? '',
        facultyId: a.academicFacultyId ?? '',
        academicMajorId: a.academicMajorId ?? '',
        vocationalMajorId: a.vocationalMajorId ?? '',
        admissionRoundId: a.admissionRoundId ?? '',
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

  // เปิดฟอร์มเพิ่มนักเรียนที่สอบติดอัตโนมัติ พร้อมล็อกสถาบัน เมื่อมาจากปุ่มในหน้ารายละเอียดสถาบัน
  useEffect(() => {
    const presetId = location.state?.presetInstitutionId;
    if (!presetId) return;
    (async () => {
      try {
        const inst = await getExamInstitutionById(presetId);
        openCreate(inst);
      } catch (err) {
        notify(err.message || 'ไม่สามารถโหลดข้อมูลสถาบันได้', 'error');
      } finally {
        navigate(location.pathname, { replace: true, state: {} });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // เฉพาะคอร์สที่ลงทะเบียนและผ่านการยืนยัน (อนุมัติ) จากแอดมินแล้ว เท่านั้น ที่นำมาแท็กในผลสอบติดได้
  useEffect(() => {
    if (!form.studentId) { setStudentEnrollments([]); return; }
    let cancelled = false;
    setLoadingEnrollments(true);
    getEnrollmentsByStudent(form.studentId)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const confirmed = list.filter((en) => CONFIRMED_ENROLLMENT_STATUSES.includes(en.status));
        if (!cancelled) setStudentEnrollments(confirmed);
      })
      .catch(() => { if (!cancelled) setStudentEnrollments([]); })
      .finally(() => { if (!cancelled) setLoadingEnrollments(false); });
    return () => { cancelled = true; };
  }, [form.studentId]);

  // โหลดรายชื่อคณะของสถาบันที่เลือก (สำหรับสถาบันประเภทมหาวิทยาลัย)
  useEffect(() => {
    if (!showForm || selectedInstitution?.institutionType !== 'UNIVERSITY') { setFacultyList([]); return; }
    getFaculties(selectedInstitution.id)
      .then((data) => setFacultyList((data || []).filter((f) => f.active)))
      .catch(() => setFacultyList([]));
  }, [showForm, selectedInstitution]);

  // โหลดรายชื่อสาขาของสถาบันที่เลือก (สำหรับสถาบันประเภทอนุปริญญา หรือมหาวิทยาลัยที่เปิดหลักสูตรอนุปริญญาด้วย)
  useEffect(() => {
    const type = selectedInstitution?.institutionType;
    const needsVocationalMajors = type === 'VOCATIONAL_DIPLOMA'
      || (type === 'UNIVERSITY' && selectedInstitution?.offersVocationalDiploma);
    if (!showForm || !selectedInstitution || !needsVocationalMajors) { setVocationalMajorList([]); return; }
    setLoadingVocationalMajors(true);
    getVocationalMajors(selectedInstitution.id)
      .then((data) => setVocationalMajorList((data || []).filter((m) => m.active)))
      .catch(() => setVocationalMajorList([]))
      .finally(() => setLoadingVocationalMajors(false));
  }, [showForm, selectedInstitution]);

  // โหลดรอบที่สอบติดของสถาบันที่เลือก
  useEffect(() => {
    if (!showForm || !selectedInstitution) { setRoundList([]); return; }
    getAdmissionRounds(selectedInstitution.id)
      .then((data) => setRoundList((data || []).filter((r) => r.active)))
      .catch(() => setRoundList([]));
  }, [showForm, selectedInstitution]);

  // โหลดสาขาตามคณะที่เลือก
  useEffect(() => {
    if (!selectedInstitution || !form.facultyId) { setMajorList([]); return; }
    let cancelled = false;
    setLoadingMajors(true);
    getMajors(selectedInstitution.id, form.facultyId)
      .then((data) => { if (!cancelled) setMajorList((data || []).filter((m) => m.active)); })
      .catch(() => { if (!cancelled) setMajorList([]); })
      .finally(() => { if (!cancelled) setLoadingMajors(false); });
    return () => { cancelled = true; };
  }, [selectedInstitution, form.facultyId]);

  // โหลดสายการเรียน/ห้องเรียนตามระดับที่เลือก (มัธยมต้น/มัธยมปลาย)
  useEffect(() => {
    if (!selectedInstitution || (form.educationLevel !== 'LOWER_SECONDARY' && form.educationLevel !== 'UPPER_SECONDARY')) {
      setTrackList([]);
      return;
    }
    let cancelled = false;
    setLoadingTracks(true);
    getSchoolTracks(selectedInstitution.id, form.educationLevel)
      .then((data) => { if (!cancelled) setTrackList((data || []).filter((t) => t.active)); })
      .catch(() => { if (!cancelled) setTrackList([]); })
      .finally(() => { if (!cancelled) setLoadingTracks(false); });
    return () => { cancelled = true; };
  }, [selectedInstitution, form.educationLevel]);

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validateForm(form);
    if (Object.keys(err).length) { setFormErr(err); return; }

    setSaving(true);
    try {
      const payload = {
        studentId: Number(form.studentId),
        examInstitutionId: Number(form.examInstitutionId),
        enrollmentIds: selectedCourseIds,
        educationLevel: form.educationLevel,
        schoolTrackId: (form.educationLevel === 'LOWER_SECONDARY' || form.educationLevel === 'UPPER_SECONDARY') && form.schoolTrackId
          ? Number(form.schoolTrackId) : null,
        academicMajorId: form.educationLevel === 'BACHELOR' && form.academicMajorId ? Number(form.academicMajorId) : null,
        vocationalMajorId: form.educationLevel === 'VOCATIONAL_DIPLOMA' && form.vocationalMajorId ? Number(form.vocationalMajorId) : null,
        admissionRoundId: form.admissionRoundId ? Number(form.admissionRoundId) : null,
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
      await load(filters);
      await loadStats();
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
      await deleteStudentExamAchievement(confirmDelete.id);
      notify('ลบผลการสอบติดสำเร็จ');
      setConfirmDelete(null);
      await load(filters);
      await loadStats();
    } catch (ex) {
      notify(ex.message, 'error');
    } finally {
      setDeleting(false);
    }
  }

  const isUniversity = selectedInstitution?.institutionType === 'UNIVERSITY';
  const isVocational = selectedInstitution?.institutionType === 'VOCATIONAL_DIPLOMA';
  const hasVocationalDiploma = isUniversity && !!selectedInstitution?.offersVocationalDiploma;

  return (
    <div className="eim-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <div className="eim-header">
        <div>
          <h1 className="eim-title">นักเรียนที่สอบติด</h1>
          <p className="eim-subtitle">
            บันทึกและติดตามนักเรียนที่สอบติดสถาบันต่าง ๆ ทั้งหมดในระบบ
          </p>
        </div>
        <button className="eim-btn eim-btn--primary" onClick={() => openCreate()}>
          + เพิ่มนักเรียนที่สอบติด
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="eim-stats-grid">
        <div className="eim-stat-card eim-stat-card--success">
          <span className="eim-stat-value">{loading ? '...' : stats.total}</span>
          <span className="eim-stat-label">นักเรียนสอบติดทั้งหมด</span>
        </div>
        <div className="eim-stat-card">
          <span className="eim-stat-value">{loading ? '...' : stats.lowerSecondary}</span>
          <span className="eim-stat-label">มัธยมต้น</span>
        </div>
        <div className="eim-stat-card">
          <span className="eim-stat-value">{loading ? '...' : stats.upperSecondary}</span>
          <span className="eim-stat-label">มัธยมปลาย</span>
        </div>
        <div className="eim-stat-card">
          <span className="eim-stat-value">{loading ? '...' : stats.vocationalDiploma}</span>
          <span className="eim-stat-label">อนุปริญญา (ปวส.)</span>
        </div>
        <div className="eim-stat-card">
          <span className="eim-stat-value">{loading ? '...' : stats.bachelor}</span>
          <span className="eim-stat-label">มหาวิทยาลัย / ป.ตรี</span>
        </div>
      </div>

      {/* ── Filter / Search ── */}
      <form className="eim-filter-bar" onSubmit={handleSearch}>
        <input
          type="text"
          className="eim-filter-input"
          placeholder="ค้นหาชื่อนักเรียน หรือรหัสนักเรียน..."
          value={keywordDraft}
          onChange={(e) => setKeywordDraft(e.target.value)}
        />
        <select
          className="eim-filter-select"
          value={institutionDraft}
          onChange={(e) => setInstitutionDraft(e.target.value)}
        >
          <option value="">— ทุกสถาบัน —</option>
          {institutions.map((i) => (
            <option key={i.id} value={i.id}>{i.institutionName}</option>
          ))}
        </select>
        <select
          className="eim-filter-select"
          value={levelDraft}
          onChange={(e) => setLevelDraft(e.target.value)}
        >
          {LEVEL_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="number"
          className="eim-filter-input"
          placeholder="ปีการศึกษา"
          value={yearDraft}
          onChange={(e) => setYearDraft(e.target.value)}
        />
        <select
          className="eim-filter-select"
          value={activeDraft}
          onChange={(e) => setActiveDraft(e.target.value)}
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button type="submit" className="eim-btn eim-btn--primary">ค้นหา</button>
        <button type="button" className="eim-btn eim-btn--ghost" onClick={handleClear}>ล้างค่า</button>
      </form>

      {/* ── Table ── */}
      <div className="eim-table-card">
        {loading && (
          <div className="eim-loading">
            <div className="eim-spinner" />
            <span>กำลังโหลดข้อมูล...</span>
          </div>
        )}

        {!loading && error && (
          <div className="eim-error-card">
            <p className="eim-error-title">โหลดข้อมูลไม่สำเร็จ</p>
            <p className="eim-error-msg">{error}</p>
            <button className="eim-btn eim-btn--ghost" onClick={() => load(filters)}>ลองใหม่</button>
          </div>
        )}

        {!loading && !error && achievements.length === 0 && (
          <div className="eim-empty">
            <p className="eim-empty-title">ยังไม่มีนักเรียนที่สอบติด</p>
            <p className="eim-empty-subtitle">
              {filters.keyword || filters.institutionId || filters.educationLevel || filters.academicYear || filters.active !== DEFAULT_FILTERS.active
                ? 'ไม่พบผลลัพธ์ที่ตรงกับเงื่อนไขการค้นหา'
                : 'กด "+ เพิ่มนักเรียนที่สอบติด" เพื่อเริ่มบันทึกรายการแรก'}
            </p>
          </div>
        )}

        {!loading && !error && achievements.length > 0 && (
          <div className="eim-table-wrap">
            <table className="eim-table">
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  <th>ชื่อนักเรียน</th>
                  <th>สถาบัน</th>
                  <th>ระดับที่สอบติด</th>
                  <th>รายละเอียด</th>
                  <th>ปีการศึกษา</th>
                  <th>คอร์สที่เรียน</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {sortedAchievements.map((a, idx) => (
                  <tr key={a.id} className="eim-table-row">
                    <td>{idx + 1}</td>
                    <td className="eim-text-name">{a.studentName}</td>
                    <td>
                      {a.institutionCode && <span className="eim-code-badge">{a.institutionCode}</span>} {a.institutionName}
                    </td>
                    <td>{a.educationLevelLabel || LEVEL_LABEL[a.educationLevel]}</td>
                    <td>{levelDetail(a)}</td>
                    <td>{a.academicYear || '—'}</td>
                    <td className="eid-course-cell" title={courseSummary(a)}>{courseSummary(a)}</td>
                    <td>
                      <div className="eim-actions">
                        <button
                          className="eim-btn-icon"
                          title="ดูรายละเอียด"
                          onClick={() => navigate(`/admin/student-exam-achievements/${a.id}/detail`)}
                        >
                          👁
                        </button>
                        <button className="eim-btn-icon" title="แก้ไข" onClick={() => openEdit(a.id)}>✏️</button>
                        <button className="eim-btn-icon" title="ลบ" onClick={() => setConfirmDelete(a)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                <label>สถาบันที่สอบติด *</label>
                {institutionLocked ? (
                  <div className="eid-locked-field">
                    {selectedInstitution
                      ? `${selectedInstitution.institutionName}${selectedInstitution.institutionCode ? ` (${selectedInstitution.institutionCode})` : ''}`
                      : '—'}
                  </div>
                ) : (
                  <>
                    <select value={form.examInstitutionId} onChange={(e) => fldInstitution(e.target.value)}>
                      <option value="">— เลือกสถาบัน —</option>
                      {institutions.filter((i) => i.active).map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.institutionName}{i.institutionCode ? ` (${i.institutionCode})` : ''}
                        </option>
                      ))}
                    </select>
                    {formErr.examInstitutionId && <span className="eid-err">{formErr.examInstitutionId}</span>}
                  </>
                )}
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
                  disabled={!selectedInstitution || (isUniversity && !hasVocationalDiploma) || isVocational}
                >
                  <option value="">— เลือกระดับที่สอบติด —</option>
                  {isUniversity ? (
                    hasVocationalDiploma ? (
                      <>
                        <option value="BACHELOR">มหาวิทยาลัย / ปริญญาตรี</option>
                        <option value="VOCATIONAL_DIPLOMA">อนุปริญญา (ปวส.)</option>
                      </>
                    ) : (
                      <option value="BACHELOR">มหาวิทยาลัย / ปริญญาตรี</option>
                    )
                  ) : isVocational ? (
                    <option value="VOCATIONAL_DIPLOMA">อนุปริญญา (ปวส.)</option>
                  ) : selectedInstitution ? (
                    <>
                      <option value="LOWER_SECONDARY">มัธยมต้น</option>
                      <option value="UPPER_SECONDARY">มัธยมปลาย</option>
                    </>
                  ) : null}
                </select>
                {formErr.educationLevel && <span className="eid-err">{formErr.educationLevel}</span>}
                {!selectedInstitution && <span className="eid-hint">กรุณาเลือกสถาบันก่อน</span>}
              </div>

              {(form.educationLevel === 'LOWER_SECONDARY' || form.educationLevel === 'UPPER_SECONDARY') && (
                <div className="eid-field">
                  <label>{form.educationLevel === 'LOWER_SECONDARY' ? 'ห้องเรียนระดับมัธยมต้น' : 'สายการเรียนระดับมัธยมปลาย'} *</label>
                  <select
                    value={form.schoolTrackId}
                    onChange={(e) => fld('schoolTrackId', e.target.value)}
                    disabled={loadingTracks}
                  >
                    <option value="">— เลือกสายการเรียน/ห้องเรียน —</option>
                    {trackList.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {formErr.schoolTrackId && <span className="eid-err">{formErr.schoolTrackId}</span>}
                  {!loadingTracks && trackList.length === 0 && (
                    <span className="eid-hint">
                      ยังไม่มีสายการเรียน/ห้องเรียนของสถาบันนี้ — ไปตั้งค่าที่หน้ารายละเอียดสถาบันก่อน
                    </span>
                  )}
                </div>
              )}

              {form.educationLevel === 'VOCATIONAL_DIPLOMA' && (
                <div className="eid-field">
                  <label>สาขา *</label>
                  <select
                    value={form.vocationalMajorId}
                    onChange={(e) => fld('vocationalMajorId', e.target.value)}
                    disabled={loadingVocationalMajors}
                  >
                    <option value="">— เลือกสาขา —</option>
                    {vocationalMajorList.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  {formErr.vocationalMajorId && <span className="eid-err">{formErr.vocationalMajorId}</span>}
                  {!loadingVocationalMajors && vocationalMajorList.length === 0 && (
                    <span className="eid-hint">
                      ยังไม่มีสาขาของสถาบันนี้ — ไปตั้งค่าที่หน้ารายละเอียดสถาบันก่อน
                    </span>
                  )}
                </div>
              )}

              {form.educationLevel === 'BACHELOR' && (
                <div className="eid-form-row">
                  <div className="eid-field">
                    <label>คณะ *</label>
                    <select value={form.facultyId} onChange={(e) => fldFaculty(e.target.value)}>
                      <option value="">— เลือกคณะ —</option>
                      {facultyList.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    {formErr.facultyId && <span className="eid-err">{formErr.facultyId}</span>}
                    {facultyList.length === 0 && (
                      <span className="eid-hint">
                        ยังไม่มีคณะของสถาบันนี้ — ไปตั้งค่าที่หน้ารายละเอียดสถาบันก่อน
                      </span>
                    )}
                  </div>
                  <div className="eid-field">
                    <label>สาขา *</label>
                    <select
                      value={form.academicMajorId}
                      onChange={(e) => fld('academicMajorId', e.target.value)}
                      disabled={!form.facultyId || loadingMajors}
                    >
                      <option value="">— เลือกสาขา —</option>
                      {majorList.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    {formErr.academicMajorId && <span className="eid-err">{formErr.academicMajorId}</span>}
                    {form.facultyId && !loadingMajors && majorList.length === 0 && (
                      <span className="eid-hint">ยังไม่มีสาขาในคณะนี้ — ไปเพิ่มที่หน้ารายละเอียดสถาบันก่อน</span>
                    )}
                  </div>
                </div>
              )}

              <div className="eid-form-row">
                <div className="eid-field">
                  <label>รอบที่สอบติด</label>
                  <select value={form.admissionRoundId} onChange={(e) => fld('admissionRoundId', e.target.value)}>
                    <option value="">— เลือกรอบที่สอบติด —</option>
                    {roundList.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  {selectedInstitution && roundList.length === 0 && (
                    <span className="eid-hint">ยังไม่มีรอบที่สอบติดของสถาบันนี้ — ไปตั้งค่าที่หน้ารายละเอียดสถาบันก่อน</span>
                  )}
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
                <DateInput value={form.resultDate} onChange={(v) => fld('resultDate', v)} />
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
                <button type="button" className="eim-btn eim-btn--ghost" onClick={() => setShowForm(false)}>ยกเลิก</button>
                <button type="submit" className="eim-btn eim-btn--primary" disabled={saving}>
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
                <button className="eim-btn eim-btn--ghost" onClick={() => setConfirmDelete(null)}>ยกเลิก</button>
                <button className="eim-btn eim-btn--danger" onClick={handleDelete} disabled={deleting}>
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
