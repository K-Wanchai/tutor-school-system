import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getExamInstitutions,
  createExamInstitution,
  updateExamInstitution,
  deleteExamInstitution,
} from '../services/examInstitutionService';
import './ExamInstitutionManagePage.css';

// ── Labels & Options ─────────────────────────────────────────────────────

const TYPE_LABEL = {
  LOWER_SECONDARY: 'มัธยมต้น',
  UPPER_SECONDARY: 'มัธยมปลาย',
  UNIVERSITY: 'มหาวิทยาลัย / ป.ตรี',
  OTHER: 'อื่น ๆ',
};

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'LOWER_SECONDARY', label: 'มัธยมต้น' },
  { value: 'UPPER_SECONDARY', label: 'มัธยมปลาย' },
  { value: 'UNIVERSITY', label: 'มหาวิทยาลัย / ป.ตรี' },
  { value: 'OTHER', label: 'อื่น ๆ' },
];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'true', label: 'ใช้งาน' },
  { value: 'false', label: 'ไม่ใช้งาน' },
];

const EMPTY_FORM = {
  institutionName: '',
  institutionType: '',
  province: '',
  district: '',
  address: '',
  websiteUrl: '',
  description: '',
  active: true,
};

const EMPTY_FILTERS = { keyword: '', type: '', active: '' };

// ── Helpers ───────────────────────────────────────────────────────────────

function validateForm(f) {
  const e = {};
  if (!f.institutionName?.trim()) e.institutionName = 'กรุณากรอกชื่อสถาบัน';
  if (!f.institutionType) e.institutionType = 'กรุณาเลือกประเภทสถาบัน';
  const website = f.websiteUrl?.trim();
  if (website && !/^https?:\/\/.+/i.test(website)) {
    e.websiteUrl = 'รูปแบบเว็บไซต์ไม่ถูกต้อง ต้องขึ้นต้นด้วย http:// หรือ https://';
  }
  return e;
}

// ── Small components ─────────────────────────────────────────────────────

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

function StatusBadge({ active }) {
  return (
    <span className={`eim-badge ${active ? 'eim-badge--success' : 'eim-badge--default'}`}>
      <span className="eim-badge-dot" />
      {active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ExamInstitutionManagePage() {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // filter draft inputs (bound to form fields, applied on search)
  const [keywordDraft, setKeywordDraft] = useState('');
  const [typeDraft, setTypeDraft] = useState('');
  const [activeDraft, setActiveDraft] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // form modal state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState({});
  const [saving, setSaving] = useState(false);

  // disable-confirm modal state
  const [showConfirmDisable, setShowConfirmDisable] = useState(false);

  function notify(msg, type = 'success') {
    setToast({ msg, type });
  }

  const buildParams = (f) => {
    const params = {};
    if (f.keyword) params.keyword = f.keyword;
    if (f.type) params.type = f.type;
    if (f.active !== '') params.active = f.active === 'true';
    return params;
  };

  const load = useCallback(async (appliedFilters) => {
    setLoading(true);
    setError('');
    try {
      const data = await getExamInstitutions(buildParams(appliedFilters));
      setInstitutions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลสถาบันที่จัดสอบได้');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await getExamInstitutions({});
      setStatsData(Array.isArray(data) ? data : []);
    } catch {
      // สถิติเป็นข้อมูลเสริม ไม่ต้องแจ้ง error ซ้ำกับตารางหลัก
    }
  }, []);

  useEffect(() => {
    load(EMPTY_FILTERS);
    loadStats();
  }, [load, loadStats]);

  const stats = useMemo(() => ({
    total: statsData.length,
    lowerSecondary: statsData.filter((i) => i.institutionType === 'LOWER_SECONDARY').length,
    upperSecondary: statsData.filter((i) => i.institutionType === 'UPPER_SECONDARY').length,
    university: statsData.filter((i) => i.institutionType === 'UNIVERSITY').length,
    active: statsData.filter((i) => i.active).length,
  }), [statsData]);

  function handleSearch(e) {
    e.preventDefault();
    const next = { keyword: keywordDraft.trim(), type: typeDraft, active: activeDraft };
    setFilters(next);
    load(next);
  }

  function handleClear() {
    setKeywordDraft('');
    setTypeDraft('');
    setActiveDraft('');
    setFilters(EMPTY_FILTERS);
    load(EMPTY_FILTERS);
  }

  function fld(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    setFormErr((e) => ({ ...e, [key]: '' }));
  }

  function openCreate() {
    setFormMode('create');
    setForm(EMPTY_FORM);
    setFormErr({});
    setShowForm(true);
  }

  function openEdit(inst) {
    setFormMode('edit');
    setSelected(inst);
    setForm({
      institutionName: inst.institutionName ?? '',
      institutionType: inst.institutionType ?? '',
      province: inst.province ?? '',
      district: inst.district ?? '',
      address: inst.address ?? '',
      websiteUrl: inst.websiteUrl ?? '',
      description: inst.description ?? '',
      active: inst.active ?? true,
    });
    setFormErr({});
    setShowForm(true);
  }

  function openConfirmDisable(inst) {
    setSelected(inst);
    setShowConfirmDisable(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validateForm(form);
    if (Object.keys(err).length) { setFormErr(err); return; }

    setSaving(true);
    try {
      const payload = {
        institutionName: form.institutionName.trim(),
        institutionType: form.institutionType,
        province: form.province?.trim() || null,
        district: form.district?.trim() || null,
        address: form.address?.trim() || null,
        websiteUrl: form.websiteUrl?.trim() || null,
        description: form.description?.trim() || null,
        active: form.active,
      };

      if (formMode === 'create') {
        const created = await createExamInstitution(payload);
        setShowForm(false);
        // พาไปตั้งค่าคณะ/สาขา (มหาวิทยาลัย) หรือสายการเรียน/ห้องเรียน (โรงเรียน) ทันที ก่อนเริ่มบันทึกนักเรียนที่สอบติด
        navigate(`/admin/exam-institutions/${created.id}`, { state: { openConfig: true } });
        return;
      }

      await updateExamInstitution(selected.id, payload);
      notify('แก้ไขข้อมูลสถาบันที่จัดสอบสำเร็จ');
      setShowForm(false);
      await load(filters);
      await loadStats();
    } catch (ex) {
      notify(ex.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDisable() {
    setSaving(true);
    try {
      await deleteExamInstitution(selected.id);
      notify('ปิดใช้งานสถาบันที่จัดสอบสำเร็จ');
      setShowConfirmDisable(false);
      await load(filters);
      await loadStats();
    } catch (ex) {
      notify(ex.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="eim-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <div className="eim-header">
        <div>
          <h1 className="eim-title">จัดการสถาบันที่จัดสอบ</h1>
          <p className="eim-subtitle">
            จัดการข้อมูลโรงเรียนและมหาวิทยาลัยที่นักเรียนสอบสมัครและได้รับเลือกเข้าศึกษาต่อ
          </p>
        </div>
        <button className="eim-btn eim-btn--primary" onClick={openCreate}>+ เพิ่มสถาบัน</button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="eim-stats-grid">
        <div className="eim-stat-card">
          <span className="eim-stat-value">{loading ? '...' : stats.total}</span>
          <span className="eim-stat-label">สถาบันทั้งหมด</span>
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
          <span className="eim-stat-value">{loading ? '...' : stats.university}</span>
          <span className="eim-stat-label">มหาวิทยาลัย</span>
        </div>
        <div className="eim-stat-card eim-stat-card--success">
          <span className="eim-stat-value">{loading ? '...' : stats.active}</span>
          <span className="eim-stat-label">สถานะใช้งาน</span>
        </div>
      </div>

      {/* ── Filter / Search ── */}
      <form className="eim-filter-bar" onSubmit={handleSearch}>
        <input
          type="text"
          className="eim-filter-input"
          placeholder="ค้นหาชื่อสถาบัน หรือจังหวัด..."
          value={keywordDraft}
          onChange={(e) => setKeywordDraft(e.target.value)}
        />
        <select
          className="eim-filter-select"
          value={typeDraft}
          onChange={(e) => setTypeDraft(e.target.value)}
        >
          {TYPE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
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

        {!loading && !error && institutions.length === 0 && (
          <div className="eim-empty">
            <p className="eim-empty-title">ยังไม่มีข้อมูลสถาบันที่จัดสอบ</p>
            <p className="eim-empty-subtitle">
              {filters.keyword || filters.type || filters.active
                ? 'ไม่พบผลลัพธ์ที่ตรงกับเงื่อนไขการค้นหา'
                : 'กด "เพิ่มสถาบัน" เพื่อเริ่มบันทึกข้อมูลสถาบันแรก'}
            </p>
          </div>
        )}

        {!loading && !error && institutions.length > 0 && (
          <div className="eim-table-wrap">
            <table className="eim-table">
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  <th>รหัสสถาบัน</th>
                  <th>ชื่อสถาบัน</th>
                  <th>ประเภท</th>
                  <th>จังหวัด</th>
                  <th>อำเภอ/เขต</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map((inst, idx) => (
                  <tr key={inst.id} className="eim-table-row">
                    <td>{idx + 1}</td>
                    <td><span className="eim-code-badge">{inst.institutionCode}</span></td>
                    <td className="eim-text-name">{inst.institutionName}</td>
                    <td>{inst.institutionTypeLabel || TYPE_LABEL[inst.institutionType] || '—'}</td>
                    <td>{inst.province || '—'}</td>
                    <td>{inst.district || '—'}</td>
                    <td><StatusBadge active={inst.active} /></td>
                    <td>
                      <div className="eim-actions">
                        <button
                          className="eim-btn-icon"
                          title="ดูรายละเอียด"
                          onClick={() => navigate(`/admin/exam-institutions/${inst.id}`)}
                        >
                          👁
                        </button>
                        <button className="eim-btn-icon" title="แก้ไข" onClick={() => openEdit(inst)}>✏️</button>
                        <button
                          className="eim-btn-icon"
                          title="ปิดใช้งาน"
                          disabled={!inst.active}
                          onClick={() => openConfirmDisable(inst)}
                        >
                          🚫
                        </button>
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
        <div className="eim-overlay" onClick={() => setShowForm(false)}>
          <div className="eim-modal" onClick={(e) => e.stopPropagation()}>
            <div className="eim-modal-header">
              <h2>{formMode === 'create' ? 'เพิ่มสถาบัน' : 'แก้ไขสถาบัน'}</h2>
              <button className="eim-modal-close" onClick={() => setShowForm(false)} aria-label="ปิด">✕</button>
            </div>
            <form className="eim-form" onSubmit={handleSubmit}>
              <div className="eim-field">
                <label>ชื่อสถาบัน *</label>
                <input
                  value={form.institutionName}
                  onChange={(e) => fld('institutionName', e.target.value)}
                  placeholder="เช่น โรงเรียนขอนแก่นวิทยายน"
                />
                {formErr.institutionName && <span className="eim-err">{formErr.institutionName}</span>}
              </div>

              <div className="eim-field">
                <label>ประเภทสถาบัน *</label>
                <select
                  value={form.institutionType}
                  onChange={(e) => fld('institutionType', e.target.value)}
                >
                  <option value="">— เลือกประเภทสถาบัน —</option>
                  <option value="LOWER_SECONDARY">มัธยมต้น</option>
                  <option value="UPPER_SECONDARY">มัธยมปลาย</option>
                  <option value="UNIVERSITY">มหาวิทยาลัย / ปริญญาตรี</option>
                  <option value="OTHER">อื่น ๆ</option>
                </select>
                {formErr.institutionType && <span className="eim-err">{formErr.institutionType}</span>}
              </div>

              <div className="eim-form-row">
                <div className="eim-field">
                  <label>จังหวัด</label>
                  <input value={form.province} onChange={(e) => fld('province', e.target.value)} placeholder="เช่น ขอนแก่น" />
                </div>
                <div className="eim-field">
                  <label>อำเภอ/เขต</label>
                  <input value={form.district} onChange={(e) => fld('district', e.target.value)} placeholder="เช่น เมืองขอนแก่น" />
                </div>
              </div>

              <div className="eim-field">
                <label>ที่อยู่</label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => fld('address', e.target.value)}
                  placeholder="ที่อยู่ของสถาบัน"
                />
              </div>

              <div className="eim-field">
                <label>เว็บไซต์</label>
                <input
                  value={form.websiteUrl}
                  onChange={(e) => fld('websiteUrl', e.target.value)}
                  placeholder="https://..."
                />
                {formErr.websiteUrl && <span className="eim-err">{formErr.websiteUrl}</span>}
              </div>

              <div className="eim-field">
                <label>รายละเอียดเพิ่มเติม</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => fld('description', e.target.value)}
                  placeholder="ข้อมูลเพิ่มเติมเกี่ยวกับสถาบัน..."
                />
              </div>

              <div className="eim-field eim-field--checkbox">
                <label className="eim-checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!form.active}
                    onChange={(e) => fld('active', e.target.checked)}
                  />
                  ใช้งาน
                </label>
              </div>

              <div className="eim-form-actions">
                <button type="button" className="eim-btn eim-btn--ghost" onClick={() => setShowForm(false)}>ยกเลิก</button>
                <button type="submit" className="eim-btn eim-btn--primary" disabled={saving}>
                  {saving ? 'กำลังบันทึก...' : formMode === 'create' ? 'เพิ่มสถาบัน' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ CONFIRM DISABLE MODAL ═══ */}
      {showConfirmDisable && selected && (
        <div className="eim-overlay" onClick={() => setShowConfirmDisable(false)}>
          <div className="eim-modal eim-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="eim-modal-header">
              <h2>ยืนยันปิดใช้งาน</h2>
              <button className="eim-modal-close" onClick={() => setShowConfirmDisable(false)} aria-label="ปิด">✕</button>
            </div>
            <div className="eim-modal-body">
              <p>
                ต้องการปิดใช้งานสถาบัน <strong>{selected.institutionName}</strong> ใช่หรือไม่?
                ข้อมูลจะยังคงอยู่ในระบบแต่จะไม่แสดงเป็นตัวเลือกที่ใช้งานได้
              </p>
              <div className="eim-form-actions">
                <button className="eim-btn eim-btn--ghost" onClick={() => setShowConfirmDisable(false)}>ยกเลิก</button>
                <button className="eim-btn eim-btn--danger" onClick={handleDisable} disabled={saving}>
                  {saving ? 'กำลังบันทึก...' : 'ปิดใช้งาน'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
