import { useState, useEffect, useCallback } from 'react';
import {
  getSchoolTracks, createSchoolTrack, updateSchoolTrack, deleteSchoolTrack,
} from '../services/schoolTrackService';

const LEVEL_TABS = [
  { key: 'LOWER_SECONDARY', label: 'มัธยมต้น' },
  { key: 'UPPER_SECONDARY', label: 'มัธยมปลาย' },
];

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

function TrackForm({ title, initialName, initialActive, saving, onCancel, onSubmit }) {
  const [name, setName] = useState(initialName);
  const [active, setActive] = useState(initialActive);
  const [err, setErr] = useState('');

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) { setErr('กรุณากรอกชื่อ'); return; }
    onSubmit({ name: name.trim(), active });
  }

  return (
    <div className="eid-overlay" onClick={onCancel}>
      <div className="eid-modal eid-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="eid-modal-header">
          <h2>{title}</h2>
          <button className="eid-modal-close" onClick={onCancel} aria-label="ปิด">✕</button>
        </div>
        <form className="eid-form" onSubmit={submit}>
          <div className="eid-field">
            <label>ชื่อสายการเรียน/ห้องเรียน *</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setErr(''); }}
              placeholder="เช่น ห้อง Gifted, วิทย์-คณิต"
              autoFocus
            />
            {err && <span className="eid-err">{err}</span>}
          </div>
          <div className="eid-field eid-field--checkbox">
            <label className="eid-checkbox-label">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              ใช้งาน
            </label>
          </div>
          <div className="eid-form-actions">
            <button type="button" className="eid-btn eid-btn--ghost" onClick={onCancel}>ยกเลิก</button>
            <button type="submit" className="eid-btn eid-btn--primary" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SchoolTrackManager({ institutionId }) {
  const [level, setLevel] = useState('LOWER_SECONDARY');
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState(null); // { mode, track }
  const [saving, setSaving] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTracks(await getSchoolTracks(institutionId, level));
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลสายการเรียน/ห้องเรียนได้');
    } finally {
      setLoading(false);
    }
  }, [institutionId, level]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(payload) {
    setSaving(true);
    try {
      const body = { ...payload, educationLevel: level };
      if (form.mode === 'create') {
        await createSchoolTrack(institutionId, body);
        setToast({ msg: 'เพิ่มสายการเรียน/ห้องเรียนสำเร็จ', type: 'success' });
      } else {
        await updateSchoolTrack(institutionId, form.track.id, body);
        setToast({ msg: 'แก้ไขสายการเรียน/ห้องเรียนสำเร็จ', type: 'success' });
      }
      setForm(null);
      await load();
    } catch (err) {
      setToast({ msg: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDisable() {
    setSaving(true);
    try {
      await deleteSchoolTrack(institutionId, confirmDisable.id);
      setToast({ msg: 'ปิดใช้งานสายการเรียน/ห้องเรียนสำเร็จ', type: 'success' });
      setConfirmDisable(null);
      await load();
    } catch (err) {
      setToast({ msg: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="eid-section">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="eid-config-header">
        <p className="eid-hint" style={{ margin: 0 }}>
          ตั้งค่าสายการเรียน/ห้องเรียนของสถาบันนี้ล่วงหน้า เพื่อให้เลือกได้ตอนบันทึกนักเรียนที่สอบติด
        </p>
        <button className="eid-btn eid-btn--primary" onClick={() => setForm({ mode: 'create' })}>
          + เพิ่มสายการเรียน/ห้องเรียน
        </button>
      </div>

      <div className="eid-tabs">
        {LEVEL_TABS.map((t) => (
          <button
            key={t.key}
            className={`eid-tab${level === t.key ? ' eid-tab--active' : ''}`}
            onClick={() => setLevel(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="eid-loading"><div className="eid-spinner" /><span>กำลังโหลดข้อมูล...</span></div>
      )}

      {!loading && error && (
        <div className="eid-error-card">
          <p className="eid-error-title">โหลดข้อมูลไม่สำเร็จ</p>
          <p className="eid-error-msg">{error}</p>
          <button className="eid-btn eid-btn--ghost" onClick={load}>ลองใหม่</button>
        </div>
      )}

      {!loading && !error && tracks.length === 0 && (
        <div className="eid-empty">
          <p>ยังไม่มีสายการเรียน/ห้องเรียนในระดับนี้ — กด "เพิ่มสายการเรียน/ห้องเรียน" เพื่อเริ่มตั้งค่า</p>
        </div>
      )}

      {!loading && !error && tracks.length > 0 && (
        <ul className="eid-config-list">
          {tracks.map((t) => (
            <li key={t.id} className="eid-config-list-item">
              <span className={t.active ? '' : 'eid-config-inactive'}>{t.name}</span>
              <div className="eid-actions">
                <button className="eid-btn-icon" title="แก้ไข" onClick={() => setForm({ mode: 'edit', track: t })}>✏️</button>
                <button className="eid-btn-icon" title="ปิดใช้งาน" disabled={!t.active} onClick={() => setConfirmDisable(t)}>🚫</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <TrackForm
          title={form.mode === 'create' ? 'เพิ่มสายการเรียน/ห้องเรียน' : 'แก้ไขสายการเรียน/ห้องเรียน'}
          initialName={form.mode === 'edit' ? form.track.name : ''}
          initialActive={form.mode === 'edit' ? form.track.active : true}
          saving={saving}
          onCancel={() => setForm(null)}
          onSubmit={handleSubmit}
        />
      )}

      {confirmDisable && (
        <div className="eid-overlay" onClick={() => setConfirmDisable(null)}>
          <div className="eid-modal eid-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="eid-modal-header">
              <h2>ยืนยันปิดใช้งาน</h2>
              <button className="eid-modal-close" onClick={() => setConfirmDisable(null)} aria-label="ปิด">✕</button>
            </div>
            <div className="eid-modal-body">
              <p>ต้องการปิดใช้งาน <strong>{confirmDisable.name}</strong> ใช่หรือไม่?</p>
              <div className="eid-form-actions">
                <button className="eid-btn eid-btn--ghost" onClick={() => setConfirmDisable(null)}>ยกเลิก</button>
                <button className="eid-btn eid-btn--danger" onClick={handleDisable} disabled={saving}>
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
