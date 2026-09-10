import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getMyEvaluations,
  getPendingEvaluations,
  submitEvaluation,
  updateEvaluation,
} from '../services/studentEvaluationService';
import './StudentCourseEvaluationPage.css';

const SCORE_FIELDS = [
  { key: 'teachingScore', label: 'การสอน / เทคนิคการถ่ายทอด' },
  { key: 'contentScore', label: 'เนื้อหาคอร์ส' },
  { key: 'materialScore', label: 'เอกสาร / สื่อการสอน' },
  { key: 'communicationScore', label: 'การสื่อสาร / การตอบคำถาม' },
  { key: 'valueScore', label: 'ความคุ้มค่า' },
];

const EMPTY_FORM = {
  rating: 0,
  teachingScore: 0,
  contentScore: 0,
  materialScore: 0,
  communicationScore: 0,
  valueScore: 0,
  comment: '',
  suggestion: '',
  isAnonymous: false,
};

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
  );
}

function Stars({ value, onChange, readOnly = false, size = 'md' }) {
  return (
    <div className={`sce-stars sce-stars--${size} ${readOnly ? 'sce-stars--readonly' : ''}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={n <= value ? 'sce-star sce-star--on' : 'sce-star'}
          onClick={readOnly ? undefined : () => onChange(n)}
          disabled={readOnly}
          aria-label={`${n} ดาว`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function EvaluationFormModal({ target, existing, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    if (existing) {
      return {
        rating: existing.rating || 0,
        teachingScore: existing.teachingScore || 0,
        contentScore: existing.contentScore || 0,
        materialScore: existing.materialScore || 0,
        communicationScore: existing.communicationScore || 0,
        valueScore: existing.valueScore || 0,
        comment: existing.comment || '',
        suggestion: existing.suggestion || '',
        isAnonymous: Boolean(existing.isAnonymous),
      };
    }
    return { ...EMPTY_FORM };
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function setField(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.rating < 1) {
      setError('กรุณาให้คะแนนความพึงพอใจโดยรวม');
      return;
    }
    for (const field of SCORE_FIELDS) {
      if (form[field.key] < 1) {
        setError(`กรุณาให้คะแนนหัวข้อ "${field.label}"`);
        return;
      }
    }

    setBusy(true);
    try {
      if (existing) {
        await updateEvaluation(existing.id, {
          rating: form.rating,
          teachingScore: form.teachingScore,
          contentScore: form.contentScore,
          materialScore: form.materialScore,
          communicationScore: form.communicationScore,
          valueScore: form.valueScore,
          comment: form.comment.trim() || null,
          suggestion: form.suggestion.trim() || null,
          isAnonymous: form.isAnonymous,
        });
      } else {
        await submitEvaluation({
          enrollmentId: target.enrollmentId,
          rating: form.rating,
          teachingScore: form.teachingScore,
          contentScore: form.contentScore,
          materialScore: form.materialScore,
          communicationScore: form.communicationScore,
          valueScore: form.valueScore,
          comment: form.comment.trim() || null,
          suggestion: form.suggestion.trim() || null,
          isAnonymous: form.isAnonymous,
        });
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const courseName = existing?.courseName || target?.courseName;
  const tutorName = existing?.teacherName || target?.tutorName;

  return (
    <div className="sce-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sce-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sce-modal-header">
          <div>
            <p>{existing ? 'แก้ไขการประเมิน' : 'ประเมินคอร์ส'}</p>
            <h2>{courseName}</h2>
            <span className="sce-modal-tutor">ผู้สอน: {tutorName || '-'}</span>
          </div>
          <button type="button" className="sce-modal-close" onClick={onClose} aria-label="ปิด">
            ×
          </button>
        </div>

        <form className="sce-modal-body" onSubmit={handleSubmit}>
          <div className="sce-form-block sce-form-block--overall">
            <span className="sce-form-label">ความพึงพอใจโดยรวม</span>
            <Stars value={form.rating} onChange={(n) => setField('rating', n)} size="lg" />
          </div>

          {SCORE_FIELDS.map((field) => (
            <div key={field.key} className="sce-form-block sce-form-row">
              <span className="sce-form-label">{field.label}</span>
              <Stars value={form[field.key]} onChange={(n) => setField(field.key, n)} />
            </div>
          ))}

          <div className="sce-form-block">
            <label className="sce-form-label" htmlFor="sce-comment">
              ความคิดเห็นเพิ่มเติม
            </label>
            <textarea
              id="sce-comment"
              rows={3}
              value={form.comment}
              onChange={(e) => setField('comment', e.target.value)}
              placeholder="สิ่งที่ประทับใจในคอร์สนี้..."
            />
          </div>

          <div className="sce-form-block">
            <label className="sce-form-label" htmlFor="sce-suggestion">
              ข้อเสนอแนะเพื่อการพัฒนา
            </label>
            <textarea
              id="sce-suggestion"
              rows={3}
              value={form.suggestion}
              onChange={(e) => setField('suggestion', e.target.value)}
              placeholder="สิ่งที่อยากให้ปรับปรุง..."
            />
          </div>

          <label className="sce-checkbox">
            <input
              type="checkbox"
              checked={form.isAnonymous}
              onChange={(e) => setField('isAnonymous', e.target.checked)}
            />
            <span>ไม่ระบุชื่อผู้ประเมิน (ติวเตอร์จะไม่เห็นชื่อของคุณ)</span>
          </label>

          {error && <div className="sce-form-error">{error}</div>}

          <div className="sce-modal-footer">
            <button type="button" className="sce-btn-ghost" onClick={onClose} disabled={busy}>
              ยกเลิก
            </button>
            <button type="submit" className="sce-btn-primary" disabled={busy}>
              {busy ? 'กำลังบันทึก...' : existing ? 'บันทึกการแก้ไข' : 'ส่งการประเมิน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function canEdit(evaluation) {
  if (!evaluation?.submittedAt) return false;
  const deadline = new Date(evaluation.submittedAt).getTime() + 24 * 60 * 60 * 1000;
  return Date.now() < deadline;
}

export default function StudentCourseEvaluationPage() {
  const [tab, setTab] = useState('PENDING');
  const [pending, setPending] = useState([]);
  const [submitted, setSubmitted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalTarget, setModalTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pendingData, submittedData] = await Promise.all([
        getPendingEvaluations(),
        getMyEvaluations(),
      ]);
      setPending(pendingData);
      setSubmitted(submittedData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(msg) {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  }

  function handleSaved(isEdit) {
    setModalTarget(null);
    setEditTarget(null);
    showToast(isEdit ? 'แก้ไขการประเมินเรียบร้อยแล้ว' : 'ขอบคุณสำหรับการประเมิน');
    load();
  }

  const averageGiven = useMemo(() => {
    if (submitted.length === 0) return '0.0';
    const sum = submitted.reduce((acc, item) => acc + Number(item.rating || 0), 0);
    return (sum / submitted.length).toFixed(1);
  }, [submitted]);

  return (
    <div className="sce-page">
      {toast && <div className="sce-toast">{toast}</div>}

      <section className="sce-hero">
        <div>
          <p className="sce-hero-kicker">Course Evaluation</p>
          <h1>ประเมินคอร์ส</h1>
          <p>
            ประเมินคอร์สที่ติวเตอร์ปิดจบการสอนแล้ว
            ความคิดเห็นของคุณช่วยพัฒนาคุณภาพการสอน
          </p>
        </div>
        <button type="button" className="sce-refresh" onClick={load} disabled={loading}>
          {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
        </button>
      </section>

      <section className="sce-summary">
        <article>
          <span>รอประเมิน</span>
          <strong>{pending.length}</strong>
        </article>
        <article>
          <span>ประเมินแล้ว</span>
          <strong>{submitted.length}</strong>
        </article>
        <article>
          <span>คะแนนเฉลี่ยที่คุณให้</span>
          <strong>{averageGiven} / 5</strong>
        </article>
      </section>

      <div className="sce-tabs">
        <button
          type="button"
          className={tab === 'PENDING' ? 'active' : ''}
          onClick={() => setTab('PENDING')}
        >
          รอประเมิน ({pending.length})
        </button>
        <button
          type="button"
          className={tab === 'SUBMITTED' ? 'active' : ''}
          onClick={() => setTab('SUBMITTED')}
        >
          ประเมินแล้ว ({submitted.length})
        </button>
      </div>

      {loading && (
        <div className="sce-state">
          <div className="sce-spinner" />
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {!loading && error && (
        <div className="sce-state sce-state--error">
          <h3>ไม่สามารถโหลดข้อมูลได้</h3>
          <p>{error}</p>
          <button type="button" onClick={load}>
            ลองใหม่อีกครั้ง
          </button>
        </div>
      )}

      {!loading && !error && tab === 'PENDING' && (
        pending.length === 0 ? (
          <div className="sce-state">
            <div className="sce-state-icon">📝</div>
            <h3>ยังไม่มีคอร์สที่รอประเมิน</h3>
            <p>เมื่อติวเตอร์ปิดจบการสอนคอร์สที่คุณเรียน คอร์สนั้นจะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="sce-grid">
            {pending.map((item) => (
              <article key={item.enrollmentId} className="sce-card">
                <div className="sce-card-body">
                  <span className="sce-card-code">{item.courseCode || '-'}</span>
                  <h3>{item.courseName}</h3>
                  <dl>
                    <div>
                      <dt>ผู้สอน</dt>
                      <dd>{item.tutorName || '-'}</dd>
                    </div>
                    <div>
                      <dt>วันที่เริ่มเรียน</dt>
                      <dd>{formatDate(item.courseStartDate)}</dd>
                    </div>
                  </dl>
                </div>
                <button
                  type="button"
                  className="sce-btn-primary"
                  onClick={() => setModalTarget(item)}
                >
                  ประเมินคอร์สนี้
                </button>
              </article>
            ))}
          </div>
        )
      )}

      {!loading && !error && tab === 'SUBMITTED' && (
        submitted.length === 0 ? (
          <div className="sce-state">
            <div className="sce-state-icon">⭐</div>
            <h3>ยังไม่มีการประเมิน</h3>
            <p>การประเมินที่คุณส่งแล้วจะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="sce-grid">
            {submitted.map((item) => (
              <article key={item.id} className="sce-card sce-card--done">
                <div className="sce-card-body">
                  <span className="sce-card-code">{item.evaluationCode || item.courseCode || '-'}</span>
                  <h3>{item.courseName}</h3>
                  <div className="sce-card-rating">
                    <Stars value={item.rating || 0} readOnly size="sm" />
                    <span>{Number(item.rating || 0).toFixed(1)}</span>
                  </div>
                  <dl>
                    <div>
                      <dt>ผู้สอน</dt>
                      <dd>{item.teacherName || '-'}</dd>
                    </div>
                    <div>
                      <dt>ประเมินเมื่อ</dt>
                      <dd>{formatDate(item.submittedAt)}</dd>
                    </div>
                  </dl>
                  {item.comment && <p className="sce-card-comment">“{item.comment}”</p>}
                </div>
                {canEdit(item) && (
                  <button
                    type="button"
                    className="sce-btn-ghost"
                    onClick={() => setEditTarget(item)}
                  >
                    แก้ไข (ภายใน 24 ชม.)
                  </button>
                )}
              </article>
            ))}
          </div>
        )
      )}

      {modalTarget && (
        <EvaluationFormModal
          target={modalTarget}
          onClose={() => setModalTarget(null)}
          onSaved={() => handleSaved(false)}
        />
      )}

      {editTarget && (
        <EvaluationFormModal
          existing={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => handleSaved(true)}
        />
      )}
    </div>
  );
}
