import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getEvaluationCriteria,
  getMyEvaluations,
  getPendingEvaluations,
  submitEvaluation,
  updateEvaluation,
} from '../services/studentEvaluationService';
import './StudentCourseEvaluationPage.css';

// สร้างคะแนนตั้งต้นของแต่ละหัวข้อ จาก criteriaScores ของรีวิวเดิม (ถ้ามี) มิฉะนั้นเริ่มที่ 0
function buildInitialScores(criteriaFields, existing) {
  const byId = new Map((existing?.criteriaScores || []).map((s) => [s.criteriaId, s.score]));
  return Object.fromEntries(criteriaFields.map((f) => [f.id, byId.get(f.id) || 0]));
}

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

function EvaluationFormModal({ target, existing, scoreFields, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    scores: buildInitialScores(scoreFields, existing),
    comment: existing?.comment || '',
    isAnonymous: Boolean(existing?.isAnonymous),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function setField(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function setScore(criteriaId, val) {
    setForm((prev) => ({ ...prev, scores: { ...prev.scores, [criteriaId]: val } }));
  }

  // คะแนนรวมไม่ให้กดเอง — คำนวณจากค่าเฉลี่ยของคะแนนแต่ละหัวข้อที่กรอกไว้ (server จะคำนวณซ้ำอีกครั้งตอนบันทึกจริง)
  const filledScores = scoreFields.map((field) => form.scores[field.id] || 0);
  const allFilled = scoreFields.length > 0 && filledScores.every((v) => v >= 1);
  const overallPreview = allFilled
    ? filledScores.reduce((sum, v) => sum + v, 0) / filledScores.length
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    for (const field of scoreFields) {
      if (!form.scores[field.id] || form.scores[field.id] < 1) {
        setError(`กรุณาให้คะแนนหัวข้อ "${field.label}"`);
        return;
      }
    }

    const criteriaScores = scoreFields.map((field) => ({
      criteriaId: field.id,
      score: form.scores[field.id],
    }));

    setBusy(true);
    try {
      if (existing) {
        await updateEvaluation(existing.id, {
          criteriaScores,
          comment: form.comment.trim() || null,
          isAnonymous: form.isAnonymous,
        });
      } else {
        await submitEvaluation({
          enrollmentId: target.enrollmentId,
          criteriaScores,
          comment: form.comment.trim() || null,
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
          {scoreFields.map((field) => (
            <div key={field.id} className="sce-form-block sce-form-row">
              <span className="sce-form-label">{field.label}</span>
              <Stars value={form.scores[field.id] || 0} onChange={(n) => setScore(field.id, n)} />
            </div>
          ))}

          <div className="sce-form-block sce-form-block--overall">
            <span className="sce-form-label">
              คะแนนรวม <small>(เฉลี่ยจากคะแนนแต่ละหัวข้อด้านบน)</small>
            </span>
            <div className="sce-overall-preview">
              <Stars value={overallPreview || 0} readOnly size="lg" />
              <span className="sce-overall-value">
                {overallPreview !== null ? `${overallPreview.toFixed(1)} / 5` : 'ให้คะแนนครบทุกหัวข้อก่อน'}
              </span>
            </div>
          </div>

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
  const [scoreFields, setScoreFields] = useState([]);

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
    getEvaluationCriteria().then(setScoreFields).catch(() => {});
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
          scoreFields={scoreFields}
          onClose={() => setModalTarget(null)}
          onSaved={() => handleSaved(false)}
        />
      )}

      {editTarget && (
        <EvaluationFormModal
          existing={editTarget}
          scoreFields={scoreFields}
          onClose={() => setEditTarget(null)}
          onSaved={() => handleSaved(true)}
        />
      )}
    </div>
  );
}
