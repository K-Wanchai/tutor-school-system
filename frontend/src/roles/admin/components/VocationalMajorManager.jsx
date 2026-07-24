import { useState, useEffect, useCallback } from 'react';
import {
  getVocationalMajors, createVocationalMajor, updateVocationalMajor, deleteVocationalMajor,
} from '../services/vocationalMajorService';

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

function MajorForm({ title, initialName, initialActive, saving, onCancel, onSubmit }) {
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
            <label>ชื่อสาขา *</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setErr(''); }}
              placeholder="เช่น ช่างยนต์, การบัญชี"
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

export default function VocationalMajorManager({ institutionId }) {
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState(null); // { mode, major }
  const [saving, setSaving] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setMajors(await getVocationalMajors(institutionId));
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลสาขาได้');
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(payload) {
    setSaving(true);
    try {
      if (form.mode === 'create') {
        await createVocationalMajor(institutionId, payload);
        setToast({ msg: 'เพิ่มสาขาสำเร็จ', type: 'success' });
      } else {
        await updateVocationalMajor(institutionId, form.major.id, payload);
        setToast({ msg: 'แก้ไขสาขาสำเร็จ', type: 'success' });
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
      await deleteVocationalMajor(institutionId, confirmDisable.id);
      setToast({ msg: 'ปิดใช้งานสาขาสำเร็จ', type: 'success' });
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
          ตั้งค่าสาขาของสถาบันนี้ล่วงหน้า เพื่อให้เลือกได้ตอนบันทึกนักเรียนที่สอบติด
        </p>
        <button className="eid-btn eid-btn--primary" onClick={() => setForm({ mode: 'create' })}>
          + เพิ่มสาขา
        </button>
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

      {!loading && !error && majors.length === 0 && (
        <div className="eid-empty">
          <p>ยังไม่มีสาขา — กด "เพิ่มสาขา" เพื่อเริ่มตั้งค่า</p>
        </div>
      )}

      {!loading && !error && majors.length > 0 && (
        <ul className="eid-config-list">
          {majors.map((m) => (
            <li key={m.id} className="eid-config-list-item">
              <span className={m.active ? '' : 'eid-config-inactive'}>{m.name}</span>
              <div className="eid-actions">
                <button className="eid-btn-icon" title="แก้ไข" onClick={() => setForm({ mode: 'edit', major: m })}>✏️</button>
                <button className="eid-btn-icon" title="ปิดใช้งาน" disabled={!m.active} onClick={() => setConfirmDisable(m)}>🚫</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <MajorForm
          title={form.mode === 'create' ? 'เพิ่มสาขา' : 'แก้ไขสาขา'}
          initialName={form.mode === 'edit' ? form.major.name : ''}
          initialActive={form.mode === 'edit' ? form.major.active : true}
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
