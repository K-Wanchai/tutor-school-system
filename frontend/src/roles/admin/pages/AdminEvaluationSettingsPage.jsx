import { useEffect, useState } from 'react';
import {
  createEvaluationCriteria,
  deleteEvaluationCriteria,
  getAllEvaluationCriteria,
  reorderEvaluationCriteria,
  updateEvaluationCriteria,
} from '../services/adminEvaluationCriteriaService';
import './AdminCourseManagementPage.css';
import './AdminSettingsPage.css';
import './AdminEvaluationSettingsPage.css';

function formatDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminEvaluationSettingsPage() {
  const [criteria, setCriteria]     = useState([]);
  const [drafts, setDrafts]         = useState({}); // id -> label ที่แก้ไขอยู่ (ยังไม่บันทึก)
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState('');
  const [savingId, setSavingId]     = useState(null);
  const [rowError, setRowError]     = useState({});
  const [toast, setToast]           = useState({ type: '', msg: '' });
  const [newLabel, setNewLabel]     = useState('');
  const [adding, setAdding]         = useState(false);
  const [reordering, setReordering] = useState(false);

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: '', msg: '' }), 3500);
  }

  function load() {
    setLoading(true);
    setLoadError('');
    getAllEvaluationCriteria()
      .then((data) => {
        setCriteria(data);
        setDrafts(Object.fromEntries(data.map((c) => [c.id, c.label])));
      })
      .catch((err) => setLoadError(err.message || 'ไม่สามารถโหลดหัวข้อการประเมินได้'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function handleDraftChange(id, value) {
    setDrafts((prev) => ({ ...prev, [id]: value }));
    if (rowError[id]) setRowError((prev) => ({ ...prev, [id]: '' }));
  }

  async function handleSaveLabel(item) {
    const label = (drafts[item.id] || '').trim();
    if (!label) {
      setRowError((prev) => ({ ...prev, [item.id]: 'กรุณากรอกชื่อหัวข้อ' }));
      return;
    }
    setSavingId(item.id);
    try {
      const updated = await updateEvaluationCriteria(item.id, { label, isActive: item.isActive });
      setCriteria((prev) => prev.map((c) => (c.id === item.id ? updated : c)));
      setDrafts((prev) => ({ ...prev, [item.id]: updated.label }));
      showToast('success', 'บันทึกหัวข้อสำเร็จ');
    } catch (err) {
      showToast('error', err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSavingId(null);
    }
  }

  async function handleToggleActive(item) {
    setSavingId(item.id);
    try {
      const updated = await updateEvaluationCriteria(item.id, {
        label: (drafts[item.id] || item.label).trim() || item.label,
        isActive: !item.isActive,
      });
      setCriteria((prev) => prev.map((c) => (c.id === item.id ? updated : c)));
      showToast('success', updated.isActive ? 'เปิดใช้งานหัวข้อแล้ว' : 'ปิดใช้งานหัวข้อแล้ว');
    } catch (err) {
      showToast('error', err.message || 'ไม่สามารถเปลี่ยนสถานะได้');
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`ต้องการลบหัวข้อ "${item.label}" ใช่หรือไม่?`)) return;
    setSavingId(item.id);
    try {
      await deleteEvaluationCriteria(item.id);
      setCriteria((prev) => prev.filter((c) => c.id !== item.id));
      showToast('success', 'ลบหัวข้อสำเร็จ');
    } catch (err) {
      showToast('error', err.message || 'ไม่สามารถลบหัวข้อได้');
    } finally {
      setSavingId(null);
    }
  }

  async function handleMove(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= criteria.length) return;

    const reordered = [...criteria];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    setReordering(true);
    try {
      const updated = await reorderEvaluationCriteria(reordered.map((c) => c.id));
      setCriteria(updated);
    } catch (err) {
      showToast('error', err.message || 'ไม่สามารถจัดลำดับได้');
    } finally {
      setReordering(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    setAdding(true);
    try {
      const created = await createEvaluationCriteria(label);
      setCriteria((prev) => [...prev, created]);
      setDrafts((prev) => ({ ...prev, [created.id]: created.label }));
      setNewLabel('');
      showToast('success', 'เพิ่มหัวข้อสำเร็จ');
    } catch (err) {
      showToast('error', err.message || 'ไม่สามารถเพิ่มหัวข้อได้');
    } finally {
      setAdding(false);
    }
  }

  const lastUpdated = criteria.reduce((latest, c) => {
    if (!c.updatedAt) return latest;
    return !latest || new Date(c.updatedAt) > new Date(latest) ? c.updatedAt : latest;
  }, null);

  return (
    <div className="is-page">

      {/* ── Header ── */}
      <div className="is-header">
        <div>
          <h1 className="is-title">หัวข้อการประเมิน</h1>
          <p className="is-subtitle">
            เพิ่ม แก้ไข ปิดใช้งาน หรือจัดลำดับหัวข้อที่นักเรียนใช้ประเมินคอร์ส (ให้คะแนนแต่ละหัวข้อ 1-5 ดาวเสมอ)
          </p>
        </div>
        {lastUpdated && (
          <div className="is-header-meta">
            <span className="is-meta-text">แก้ไขล่าสุด {formatDateTime(lastUpdated)}</span>
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
        <div className="is-grid">
          <div className="is-card">
            <div className="is-card-header">
              <h2 className="is-card-title">หัวข้อการประเมินคอร์ส</h2>
              <p className="is-card-subtitle">
                หัวข้อที่ "เปิดใช้งาน" จะแสดงในฟอร์มประเมินของนักเรียนทันที เรียงจากบนลงล่าง
              </p>
            </div>
            <div className="is-card-body">
              <div className="ec-list">
                {criteria.length === 0 && (
                  <p className="is-hint">ยังไม่มีหัวข้อการประเมิน เพิ่มหัวข้อแรกได้ด้านล่าง</p>
                )}

                {criteria.map((item, index) => (
                  <div key={item.id} className={`ec-row${item.isActive ? '' : ' ec-row--inactive'}`}>
                    <div className="ec-row-order">
                      <button
                        type="button" className="ec-order-btn"
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0 || reordering || savingId === item.id}
                        aria-label="เลื่อนขึ้น"
                      >▲</button>
                      <button
                        type="button" className="ec-order-btn"
                        onClick={() => handleMove(index, 1)}
                        disabled={index === criteria.length - 1 || reordering || savingId === item.id}
                        aria-label="เลื่อนลง"
                      >▼</button>
                    </div>

                    <div className="ec-row-field">
                      <input
                        type="text"
                        className={`is-form-input${rowError[item.id] ? ' is-form-input--error' : ''}`}
                        value={drafts[item.id] ?? ''}
                        onChange={(e) => handleDraftChange(item.id, e.target.value)}
                        placeholder="ชื่อหัวข้อการประเมิน..."
                      />
                      {rowError[item.id] && <span className="is-form-error">{rowError[item.id]}</span>}
                    </div>

                    <div className="ec-row-actions">
                      <button
                        type="button" className="is-btn is-btn--ghost is-btn--sm"
                        onClick={() => handleSaveLabel(item)}
                        disabled={savingId === item.id || drafts[item.id] === item.label}
                      >
                        บันทึก
                      </button>
                      <button
                        type="button"
                        className={`ec-toggle-btn${item.isActive ? ' ec-toggle-btn--on' : ''}`}
                        onClick={() => handleToggleActive(item)}
                        disabled={savingId === item.id}
                      >
                        {item.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </button>
                      <button
                        type="button" className="ec-delete-btn"
                        onClick={() => handleDelete(item)}
                        disabled={savingId === item.id}
                        aria-label="ลบหัวข้อ"
                        title="ลบหัวข้อ"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form className="ec-add-row" onSubmit={handleAdd}>
                <input
                  type="text" className="is-form-input" value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="เพิ่มหัวข้อใหม่ เช่น ความตรงต่อเวลา..."
                />
                <button type="submit" className="is-btn is-btn--primary" disabled={adding || !newLabel.trim()}>
                  {adding ? 'กำลังเพิ่ม...' : '+ เพิ่มหัวข้อ'}
                </button>
              </form>

              <p className="is-hint">แต่ละหัวข้อให้นักเรียนประเมินด้วยคะแนน 1-5 ดาวเสมอ</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
