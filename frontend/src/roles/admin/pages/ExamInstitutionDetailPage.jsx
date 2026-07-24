import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getInstitutionAchievements } from '../services/examInstitutionService';
import {
  createStudentExamAchievement,
  updateStudentExamAchievement,
  deleteStudentExamAchievement,
  getStudentExamAchievementById,
  getStudentAchievementDetail,
} from '../services/studentExamAchievementService';
import { getEnrollmentsByStudent } from '../services/adminEnrollmentService';
import { getStudents } from '../services/adminStudentService';
import { getFaculties, getMajors } from '../services/academicFacultyService';
import { getSchoolTracks } from '../services/schoolTrackService';
import { getVocationalMajors } from '../services/vocationalMajorService';
import { getAdmissionRounds } from '../services/admissionRoundService';
import FacultyMajorManager from '../components/FacultyMajorManager';
import SchoolTrackManager from '../components/SchoolTrackManager';
import VocationalMajorManager from '../components/VocationalMajorManager';
import AdmissionRoundManager from '../components/AdmissionRoundManager';
import { AchievementDetailBody, LEVEL_LABEL } from './StudentAchievementDetailPage';
import './StudentAchievementDetailPage.css';
import './ExamInstitutionDetailPage.css';

const TYPE_LABEL = {
  SECONDARY: 'มัธยม',
  VOCATIONAL_DIPLOMA: 'อนุปริญญา (ปวส.)',
  UNIVERSITY: 'มหาวิทยาลัย / ป.ตรี',
};

const EMPTY_FORM = {
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

function formatCourseNames(names) {
  if (!names || names.length === 0) return 'ยังไม่มีคอร์สที่เรียน';
  return names.join(', ');
}

function validateForm(f) {
  const e = {};
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
    columns = [{ key: 'schoolTrackName', label: 'ห้องเรียน' }];
    emptyText = 'ยังไม่มีนักเรียนที่สอบติดระดับมัธยมต้น';
  } else if (tab === 'UPPER_SECONDARY') {
    rows = upperSecondary;
    columns = [{ key: 'schoolTrackName', label: 'สายการเรียน' }];
    emptyText = 'ยังไม่มีนักเรียนที่สอบติดระดับมัธยมปลาย';
  } else {
    rows = [
      ...lowerSecondary.map((r) => ({ ...r, levelLabel: 'มัธยมต้น', detail: r.schoolTrackName })),
      ...upperSecondary.map((r) => ({ ...r, levelLabel: 'มัธยมปลาย', detail: r.schoolTrackName })),
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
    () => Array.from(new Set(bachelor.map((b) => b.facultyName).filter(Boolean))).sort(),
    [bachelor]
  );

  function selectFaculty(f) {
    setActiveFaculty(f);
    setActiveMajor('ALL');
  }

  const facultyFiltered = activeFaculty === 'ALL'
    ? bachelor
    : bachelor.filter((b) => b.facultyName === activeFaculty);

  const majors = useMemo(
    () => Array.from(new Set(facultyFiltered.map((b) => b.majorName).filter(Boolean))).sort(),
    [facultyFiltered]
  );

  const rows = activeMajor === 'ALL'
    ? facultyFiltered
    : facultyFiltered.filter((b) => b.majorName === activeMajor);

  const columns = [];
  if (activeFaculty === 'ALL') columns.push({ key: 'facultyName', label: 'คณะ' });
  if (activeMajor === 'ALL') columns.push({ key: 'majorName', label: 'สาขา' });
  columns.push({ key: 'admissionRoundName', label: 'รอบที่สอบติด' });

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

// ── มุมมองอนุปริญญา (ปวส.): รายชื่อแบบเรียบ ไม่มีแท็บย่อย ────────────────────

function VocationalAchievementView({ vocationalDiploma, onViewDetail, onEdit, onDelete }) {
  return (
    <div className="eid-section">
      <AchievementTable
        columns={[
          { key: 'vocationalMajorName', label: 'สาขา' },
          { key: 'admissionRoundName', label: 'รอบที่สอบติด' },
        ]}
        rows={vocationalDiploma}
        emptyText="ยังไม่มีนักเรียนที่สอบติดสถาบันนี้"
        onViewDetail={onViewDetail}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

// ── การ์ดรายละเอียดผลสอบติด (แสดงแทนการไปหน้าใหม่) ──────────────────────────

function AchievementDetailModal({ achievementId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getStudentAchievementDetail(achievementId);
      setData(result);
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลรายละเอียดผลการสอบติดได้');
    } finally {
      setLoading(false);
    }
  }, [achievementId]);

  useEffect(() => { load(); }, [load]);

  const achievement = data?.achievement;

  return (
    <div className="eid-overlay" onClick={onClose}>
      <div className="eid-modal eid-modal--detail" onClick={(e) => e.stopPropagation()}>
        <div className="eid-modal-header">
          <h2>{achievement ? achievement.studentName : 'รายละเอียดผลสอบติด'}</h2>
          <button className="eid-modal-close" onClick={onClose} aria-label="ปิด">✕</button>
        </div>
        <div className="eid-modal-body sad-page">
          {loading ? (
            <div className="sad-loading">
              <div className="sad-spinner" />
              <span>กำลังโหลดข้อมูล...</span>
            </div>
          ) : error || !data ? (
            <div className="sad-error-card">
              <p className="sad-error-title">โหลดข้อมูลไม่สำเร็จ</p>
              <p className="sad-error-msg">{error || 'ไม่พบข้อมูล'}</p>
              <div className="sad-error-actions">
                <button className="sad-btn sad-btn--primary" onClick={load}>ลองใหม่</button>
              </div>
            </div>
          ) : (
            <>
              <div className="sad-meta-row">
                <span className="sad-meta-item sad-meta-item--primary">
                  {achievement.educationLevelLabel || LEVEL_LABEL[achievement.educationLevel]}
                </span>
                <span className="sad-meta-item">{achievement.institutionName}</span>
              </div>
              <AchievementDetailBody achievement={achievement} enrollments={data.enrollments} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ExamInstitutionDetailPage() {
  const { institutionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // สถาบันที่เพิ่งสร้างใหม่ (มาจาก "เพิ่มสถาบัน") — พาไปตั้งค่าคณะ/สาขา/สายการเรียนก่อนเริ่มบันทึกนักเรียนที่สอบติด
  const [mainTab, setMainTab] = useState(location.state?.openConfig ? 'config' : 'achievements');

  useEffect(() => {
    if (location.state?.openConfig) {
      setToast({ msg: 'สร้างสถาบันสำเร็จ — ตั้งค่าคณะ/สาขา หรือสายการเรียน/ห้องเรียน และรอบที่สอบติดของสถาบันนี้ก่อนเริ่มบันทึกนักเรียนที่สอบติด', type: 'success' });
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [viewAchievementId, setViewAchievementId] = useState(null);

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

  // โหลดรายชื่อคณะของสถาบันนี้ (สำหรับสถาบันประเภทมหาวิทยาลัย) เมื่อเปิดฟอร์ม
  useEffect(() => {
    if (!showForm || overview?.institution?.institutionType !== 'UNIVERSITY') { return; }
    getFaculties(institutionId)
      .then((data) => setFacultyList((data || []).filter((f) => f.active)))
      .catch(() => setFacultyList([]));
  }, [showForm, institutionId, overview]);

  // โหลดรายชื่อสาขาของสถาบันนี้ (สำหรับสถาบันประเภทอนุปริญญา หรือมหาวิทยาลัยที่เปิดหลักสูตรอนุปริญญาด้วย) เมื่อเปิดฟอร์ม
  useEffect(() => {
    const type = overview?.institution?.institutionType;
    const needsVocationalMajors = type === 'VOCATIONAL_DIPLOMA'
      || (type === 'UNIVERSITY' && overview?.institution?.offersVocationalDiploma);
    if (!showForm || !needsVocationalMajors) { return; }
    setLoadingVocationalMajors(true);
    getVocationalMajors(institutionId)
      .then((data) => setVocationalMajorList((data || []).filter((m) => m.active)))
      .catch(() => setVocationalMajorList([]))
      .finally(() => setLoadingVocationalMajors(false));
  }, [showForm, institutionId, overview]);

  // โหลดรอบที่สอบติดของสถาบันนี้ เมื่อเปิดฟอร์ม
  useEffect(() => {
    if (!showForm) { return; }
    getAdmissionRounds(institutionId)
      .then((data) => setRoundList((data || []).filter((r) => r.active)))
      .catch(() => setRoundList([]));
  }, [showForm, institutionId]);

  // โหลดสาขาตามคณะที่เลือก
  useEffect(() => {
    if (!form.facultyId) { setMajorList([]); return; }
    let cancelled = false;
    setLoadingMajors(true);
    getMajors(institutionId, form.facultyId)
      .then((data) => { if (!cancelled) setMajorList((data || []).filter((m) => m.active)); })
      .catch(() => { if (!cancelled) setMajorList([]); })
      .finally(() => { if (!cancelled) setLoadingMajors(false); });
    return () => { cancelled = true; };
  }, [institutionId, form.facultyId]);

  // โหลดสายการเรียน/ห้องเรียนตามระดับที่เลือก (มัธยมต้น/มัธยมปลาย)
  useEffect(() => {
    if (form.educationLevel !== 'LOWER_SECONDARY' && form.educationLevel !== 'UPPER_SECONDARY') {
      setTrackList([]);
      return;
    }
    let cancelled = false;
    setLoadingTracks(true);
    getSchoolTracks(institutionId, form.educationLevel)
      .then((data) => { if (!cancelled) setTrackList((data || []).filter((t) => t.active)); })
      .catch(() => { if (!cancelled) setTrackList([]); })
      .finally(() => { if (!cancelled) setLoadingTracks(false); });
    return () => { cancelled = true; };
  }, [institutionId, form.educationLevel]);

  function goToAchievementDetail(achievementId) {
    setViewAchievementId(achievementId);
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

  function openCreate() {
    setFormMode('create');
    setEditingId(null);
    const type = overview?.institution?.institutionType;
    const mixedUniversity = type === 'UNIVERSITY' && overview?.institution?.offersVocationalDiploma;
    const lockedLevel = mixedUniversity ? '' : type === 'UNIVERSITY' ? 'BACHELOR' : type === 'VOCATIONAL_DIPLOMA' ? 'VOCATIONAL_DIPLOMA' : '';
    setForm({ ...EMPTY_FORM, educationLevel: lockedLevel });
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

  const { institution, lowerSecondary, upperSecondary, vocationalDiploma, bachelor } = overview;
  const isUniversity = institution.institutionType === 'UNIVERSITY';
  const isVocational = institution.institutionType === 'VOCATIONAL_DIPLOMA';
  const hasVocationalDiploma = isUniversity && !!institution.offersVocationalDiploma;
  const facultyCount = new Set(bachelor.map((b) => b.facultyName).filter(Boolean)).size;
  const majorCount = new Set(bachelor.map((b) => b.majorName).filter(Boolean)).size;
  const vocationalMajorCount = new Set(vocationalDiploma.map((v) => v.vocationalMajorName).filter(Boolean)).size;

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
              <span className="eid-stat-value">
                {hasVocationalDiploma ? bachelor.length + vocationalDiploma.length : bachelor.length}
              </span>
              <span className="eid-stat-label">นักเรียนสอบติดทั้งหมด</span>
            </div>
            <div className="eid-stat-card">
              <span className="eid-stat-value">{facultyCount}</span>
              <span className="eid-stat-label">คณะ</span>
            </div>
            <div className="eid-stat-card">
              <span className="eid-stat-value">{majorCount}</span>
              <span className="eid-stat-label">สาขา (ป.ตรี)</span>
            </div>
            {hasVocationalDiploma && (
              <>
                <div className="eid-stat-card">
                  <span className="eid-stat-value">{vocationalDiploma.length}</span>
                  <span className="eid-stat-label">นักเรียนสอบติด (ปวส.)</span>
                </div>
                <div className="eid-stat-card">
                  <span className="eid-stat-value">{vocationalMajorCount}</span>
                  <span className="eid-stat-label">สาขา (ปวส.)</span>
                </div>
              </>
            )}
          </>
        ) : isVocational ? (
          <>
            <div className="eid-stat-card eid-stat-card--success">
              <span className="eid-stat-value">{vocationalDiploma.length}</span>
              <span className="eid-stat-label">นักเรียนสอบติดทั้งหมด</span>
            </div>
            <div className="eid-stat-card">
              <span className="eid-stat-value">{vocationalMajorCount}</span>
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

      {/* ── สลับมุมมอง: นักเรียนที่สอบติด / จัดการข้อมูลพื้นฐาน ── */}
      <div className="eid-maintabs">
        <button
          className={`eid-maintab${mainTab === 'achievements' ? ' eid-maintab--active' : ''}`}
          onClick={() => setMainTab('achievements')}
        >
          นักเรียนที่สอบติด
        </button>
        <button
          className={`eid-maintab${mainTab === 'config' ? ' eid-maintab--active' : ''}`}
          onClick={() => setMainTab('config')}
        >
          จัดการข้อมูลพื้นฐาน
        </button>
      </div>

      {mainTab === 'config' ? (
        <>
          {isUniversity ? (
            <>
              <FacultyMajorManager institutionId={institutionId} />
              {hasVocationalDiploma && <VocationalMajorManager institutionId={institutionId} />}
            </>
          ) : isVocational ? (
            <VocationalMajorManager institutionId={institutionId} />
          ) : (
            <SchoolTrackManager institutionId={institutionId} />
          )}
          <AdmissionRoundManager institutionId={institutionId} />
        </>
      ) : isUniversity ? (
        <>
          <UniversityAchievementView
            bachelor={bachelor}
            onViewDetail={goToAchievementDetail}
            onEdit={openEdit}
            onDelete={setConfirmDelete}
          />
          {hasVocationalDiploma && (
            <>
              <h3 className="eid-section-title">อนุปริญญา (ปวส.)</h3>
              <VocationalAchievementView
                vocationalDiploma={vocationalDiploma}
                onViewDetail={goToAchievementDetail}
                onEdit={openEdit}
                onDelete={setConfirmDelete}
              />
            </>
          )}
        </>
      ) : isVocational ? (
        <VocationalAchievementView
          vocationalDiploma={vocationalDiploma}
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
                  disabled={(isUniversity && !hasVocationalDiploma) || isVocational}
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
                  ) : (
                    <>
                      <option value="LOWER_SECONDARY">มัธยมต้น</option>
                      <option value="UPPER_SECONDARY">มัธยมปลาย</option>
                    </>
                  )}
                </select>
                {formErr.educationLevel && <span className="eid-err">{formErr.educationLevel}</span>}
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
                      ยังไม่มีสายการเรียน/ห้องเรียนของสถาบันนี้ — ไปตั้งค่าที่แท็บ "จัดการข้อมูลพื้นฐาน" ก่อน
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
                      ยังไม่มีสาขาของสถาบันนี้ — ไปตั้งค่าที่แท็บ "จัดการข้อมูลพื้นฐาน" ก่อน
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
                        ยังไม่มีคณะของสถาบันนี้ — ไปตั้งค่าที่แท็บ "จัดการข้อมูลพื้นฐาน" ก่อน
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
                      <span className="eid-hint">ยังไม่มีสาขาในคณะนี้ — ไปเพิ่มที่แท็บ "จัดการข้อมูลพื้นฐาน" ก่อน</span>
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
                  {roundList.length === 0 && (
                    <span className="eid-hint">ยังไม่มีรอบที่สอบติดของสถาบันนี้ — ไปตั้งค่าที่แท็บ "จัดการข้อมูลพื้นฐาน" ก่อน</span>
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

      {/* ═══ ACHIEVEMENT DETAIL CARD ═══ */}
      {viewAchievementId && (
        <AchievementDetailModal
          achievementId={viewAchievementId}
          onClose={() => setViewAchievementId(null)}
        />
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
