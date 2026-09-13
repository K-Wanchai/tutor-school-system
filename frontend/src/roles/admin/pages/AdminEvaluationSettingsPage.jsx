import { useEffect, useState } from 'react';
import {
  getEvaluationSettings,
  updateEvaluationSettings,
} from '../services/adminSettingsService';
import './AdminCourseManagementPage.css';
import './AdminSettingsPage.css';

const SCORE_FIELD_DEFS = [
  { name: 'teachingLabel', fallback: 'การสอน / เทคนิคการถ่ายทอด' },
  { name: 'contentLabel', fallback: 'เนื้อหาคอร์ส' },
  { name: 'materialLabel', fallback: 'เอกสาร / สื่อการสอน' },
  { name: 'communicationLabel', fallback: 'การสื่อสาร / การตอบคำถาม' },
  { name: 'valueLabel', fallback: 'ความคุ้มค่า' },
];

function toEvalForm(settings) {
  const form = {};
  for (const field of SCORE_FIELD_DEFS) {
    form[field.name] = settings?.[field.name] || '';
  }
  return form;
}

function formatDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function FormField({ label, name, value, onChange, error, required }) {
  return (
    <div className="is-form-field">
      <label className="is-form-label">
        {label}{required && <span className="is-required"> *</span>}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className={`is-form-input${error ? ' is-form-input--error' : ''}`}
        placeholder={`กรอก${label}...`}
      />
      {error && <span className="is-form-error">{error}</span>}
    </div>
  );
}

export default function AdminEvaluationSettingsPage() {
  const [settings, setSettings]     = useState(null);
  const [form, setForm]             = useState(toEvalForm(null));
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState('');
  const [errors, setErrors]         = useState({});
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState('');
  const [toast, setToast]           = useState({ type: '', msg: '' });

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: '', msg: '' }), 3500);
  }

  function load() {
    setLoading(true);
    setLoadError('');
    getEvaluationSettings()
      .then((data) => {
        setSettings(data);
        setForm(toEvalForm(data));
      })
      .catch((err) => setLoadError(err.message || 'ไม่สามารถโหลดหัวข้อการประเมินได้'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const isDirty = settings ? JSON.stringify(toEvalForm(settings)) !== JSON.stringify(form) : false;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function handleReset() {
    if (settings) setForm(toEvalForm(settings));
    setErrors({});
    setSaveError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    for (const field of SCORE_FIELD_DEFS) {
      if (!form[field.name].trim()) errs[field.name] = 'กรุณากรอกชื่อหัวข้อ';
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    setSaveError('');
    try {
      await updateEvaluationSettings(form);
      const data = await getEvaluationSettings();
      setSettings(data);
      setForm(toEvalForm(data));
      showToast('success', 'บันทึกหัวข้อการประเมินสำเร็จ');
    } catch (err) {
      setSaveError(err.message || 'ไม่สามารถบันทึกหัวข้อการประเมินได้');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="is-page">

      {/* ── Header ── */}
      <div className="is-header">
        <div>
          <h1 className="is-title">หัวข้อการประเมิน</h1>
          <p className="is-subtitle">
            กำหนดชื่อหัวข้อคะแนนย่อยที่นักเรียนใช้ประเมินคอร์ส (ให้คะแนนแต่ละหัวข้อ 1-5 ดาว)
          </p>
        </div>
        {settings && (
          <div className="is-header-meta">
            <span className="is-meta-text">แก้ไขล่าสุด {formatDateTime(settings.updatedAt)}</span>
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast.msg && (
        <div className={`is-toast is-toast--${toast.type}`}>
          {toast.type === 'success' ? (
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          <span>{toast.msg}</span>
          <button className="is-toast-close" onClick={() => setToast({ type: '', msg: '' })}>×</button>
        </div>
      )}

      {loading && (
        <div className="is-loading">
          <div className="is-spinner" />
          <span>กำลังโหลดหัวข้อการประเมิน...</span>
        </div>
      )}

      {!loading && loadError && (
        <div className="is-error-card">
          <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" style={{ flexShrink: 0 }}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div style={{ flex: 1 }}>
            <p className="is-error-title">โหลดข้อมูลไม่สำเร็จ</p>
            <p className="is-error-msg">{loadError}</p>
          </div>
          <button className="is-btn is-btn--ghost" onClick={load}>ลองใหม่</button>
        </div>
      )}

      {!loading && !loadError && (
        <form className="is-form" onSubmit={handleSubmit} noValidate>
          {saveError && (
            <div className="is-form-banner">
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {saveError}
            </div>
          )}

          <div className="is-grid">
            <div className="is-card">
              <div className="is-card-header">
                <h2 className="is-card-title">หัวข้อการประเมินคอร์ส</h2>
                <p className="is-card-subtitle">ชื่อหัวข้อเหล่านี้จะแสดงในหน้าประเมินคอร์สของนักเรียน</p>
              </div>
              <div className="is-card-body">
                <div className="is-form-grid">
                  {SCORE_FIELD_DEFS.map((field, idx) => (
                    <FormField
                      key={field.name}
                      label={`หัวข้อที่ ${idx + 1}`}
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      error={errors[field.name]}
                      required
                    />
                  ))}
                </div>
                <p className="is-hint">แต่ละหัวข้อให้นักเรียนประเมินด้วยคะแนน 1-5 ดาวเสมอ</p>
              </div>
            </div>
          </div>

          {/* ── Action Bar ── */}
          <div className="is-action-bar">
            <span className="is-action-bar-status">
              {isDirty ? 'มีการเปลี่ยนแปลงที่ยังไม่บันทึก' : 'ข้อมูลล่าสุดถูกบันทึกแล้ว'}
            </span>
            <div className="is-action-bar-buttons">
              <button
                type="button" className="is-btn is-btn--ghost"
                onClick={handleReset} disabled={!isDirty || saving}
              >
                ยกเลิกการแก้ไข
              </button>
              <button
                type="submit" className="is-btn is-btn--primary"
                disabled={!isDirty || saving}
              >
                {saving ? (<><span className="is-btn-spinner" />กำลังบันทึก...</>) : 'บันทึกการเปลี่ยนแปลง'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
