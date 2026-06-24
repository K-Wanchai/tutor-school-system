import { useCallback, useEffect, useRef, useState } from 'react';
import { getQuestions, saveAllQuestions } from '../services/testQuestionService';
import './TestEditorModal.css';

// ─── constants ────────────────────────────────────────────────────────────────

const QUESTION_TYPES = [
  { value: 'MULTIPLE_CHOICE', label: 'ตัวเลือก (เลือกได้ 1 ข้อ)' },
  { value: 'CHECKBOX',        label: 'กล่องตรวจสอบ (เลือกได้หลายข้อ)' },
  { value: 'TRUE_FALSE',      label: 'ถูก / ผิด' },
  { value: 'SHORT_ANSWER',    label: 'คำตอบสั้น' },
];

const QUESTION_TYPE_ICON = {
  MULTIPLE_CHOICE: '◉',
  CHECKBOX:        '☑',
  TRUE_FALSE:      '↔',
  SHORT_ANSWER:    '✏',
};

function emptyOption(order) {
  return { optionText: '', correct: false, optionOrder: order };
}

function emptyQuestion(order) {
  return {
    _key: Date.now() + Math.random(),
    questionText: '',
    questionType: 'MULTIPLE_CHOICE',
    questionOrder: order,
    explanation: '',
    options: [emptyOption(1), emptyOption(2), emptyOption(3), emptyOption(4)],
  };
}

function initOptions(type) {
  if (type === 'TRUE_FALSE') {
    return [
      { optionText: 'ถูก', correct: false, optionOrder: 1 },
      { optionText: 'ผิด', correct: false, optionOrder: 2 },
    ];
  }
  if (type === 'SHORT_ANSWER') return [];
  return [emptyOption(1), emptyOption(2), emptyOption(3), emptyOption(4)];
}

// ─── sub-components ──────────────────────────────────────────────────────────

function QuestionCard({ q, idx, total, onChange, onDelete, onMove }) {
  const [expanded, setExpanded] = useState(true);
  const [showExplanation, setShowExplanation] = useState(!!q.explanation);

  function handleTypeChange(newType) {
    onChange({ ...q, questionType: newType, options: initOptions(newType) });
  }

  function handleOptionText(oi, val) {
    const opts = q.options.map((o, i) => i === oi ? { ...o, optionText: val } : o);
    onChange({ ...q, options: opts });
  }

  function handleCorrect(oi) {
    let opts;
    if (q.questionType === 'CHECKBOX') {
      opts = q.options.map((o, i) => i === oi ? { ...o, correct: !o.correct } : o);
    } else {
      opts = q.options.map((o, i) => ({ ...o, correct: i === oi }));
    }
    onChange({ ...q, options: opts });
  }

  function addOption() {
    const opts = [...q.options, emptyOption(q.options.length + 1)];
    onChange({ ...q, options: opts });
  }

  function removeOption(oi) {
    if (q.options.length <= 2) return;
    const opts = q.options.filter((_, i) => i !== oi)
      .map((o, i) => ({ ...o, optionOrder: i + 1 }));
    onChange({ ...q, options: opts });
  }

  const needsOptions = ['MULTIPLE_CHOICE', 'CHECKBOX', 'TRUE_FALSE'].includes(q.questionType);
  const isTrueFalse  = q.questionType === 'TRUE_FALSE';

  return (
    <div className="tqe-card">
      {/* card top bar */}
      <div className="tqe-card-bar">
        <div className="tqe-card-bar-left">
          <span className="tqe-q-num">{idx + 1}</span>
          <span className="tqe-q-type-icon" title={QUESTION_TYPES.find(t => t.value === q.questionType)?.label}>
            {QUESTION_TYPE_ICON[q.questionType]}
          </span>
          <span className="tqe-q-preview" onClick={() => setExpanded(e => !e)}>
            {q.questionText || <em className="tqe-placeholder">คลิกเพื่อแก้ไขคำถาม</em>}
          </span>
        </div>
        <div className="tqe-card-bar-right">
          <button className="tqe-icon-btn" disabled={idx === 0} onClick={() => onMove(idx, -1)} title="เลื่อนขึ้น">↑</button>
          <button className="tqe-icon-btn" disabled={idx === total - 1} onClick={() => onMove(idx, 1)} title="เลื่อนลง">↓</button>
          <button className="tqe-icon-btn tqe-icon-btn--expand" onClick={() => setExpanded(e => !e)}>
            {expanded ? '▲' : '▼'}
          </button>
          <button className="tqe-icon-btn tqe-icon-btn--delete" onClick={() => onDelete(idx)} title="ลบคำถาม">🗑</button>
        </div>
      </div>

      {/* expanded editor */}
      {expanded && (
        <div className="tqe-card-body">
          {/* question text + type row */}
          <div className="tqe-row-top">
            <textarea
              className="tqe-q-text"
              placeholder="พิมพ์คำถาม..."
              value={q.questionText}
              rows={2}
              onChange={e => onChange({ ...q, questionText: e.target.value })}
            />
            <select
              className="tqe-type-select"
              value={q.questionType}
              onChange={e => handleTypeChange(e.target.value)}
            >
              {QUESTION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* options */}
          {needsOptions && (
            <div className="tqe-options">
              {q.options.map((opt, oi) => (
                <div key={oi} className="tqe-option-row">
                  {/* correct marker */}
                  <button
                    className={`tqe-correct-btn ${opt.correct ? 'tqe-correct-btn--on' : ''}`}
                    onClick={() => handleCorrect(oi)}
                    title={opt.correct ? 'เฉลย (คลิกเพื่อยกเลิก)' : 'ตั้งเป็นเฉลย'}
                  >
                    {q.questionType === 'CHECKBOX'
                      ? (opt.correct ? '☑' : '☐')
                      : (opt.correct ? '◉' : '○')}
                  </button>

                  {isTrueFalse ? (
                    <span className="tqe-tf-label">{opt.optionText}</span>
                  ) : (
                    <input
                      className="tqe-option-input"
                      placeholder={`ตัวเลือกที่ ${oi + 1}`}
                      value={opt.optionText}
                      onChange={e => handleOptionText(oi, e.target.value)}
                    />
                  )}

                  {!isTrueFalse && (
                    <button
                      className="tqe-remove-opt"
                      onClick={() => removeOption(oi)}
                      disabled={q.options.length <= 2}
                    >✕</button>
                  )}
                </div>
              ))}

              {!isTrueFalse && (
                <button className="tqe-add-opt" onClick={addOption}>
                  + เพิ่มตัวเลือก
                </button>
              )}
            </div>
          )}

          {q.questionType === 'SHORT_ANSWER' && (
            <div className="tqe-short-answer-preview">
              <input disabled placeholder="คำตอบของผู้เรียน (ช่องสำหรับผู้เรียนกรอก)" />
            </div>
          )}

          {/* explanation */}
          <div className="tqe-explanation-row">
            {!showExplanation ? (
              <button className="tqe-link-btn" onClick={() => setShowExplanation(true)}>
                + เพิ่มคำอธิบายเฉลย
              </button>
            ) : (
              <div className="tqe-explanation-field">
                <label>คำอธิบายเฉลย (แสดงหลังส่งคำตอบ)</label>
                <textarea
                  rows={2}
                  placeholder="อธิบายเหตุผลของคำตอบ..."
                  value={q.explanation}
                  onChange={e => onChange({ ...q, explanation: e.target.value })}
                />
                <button className="tqe-link-btn tqe-link-btn--red"
                  onClick={() => { setShowExplanation(false); onChange({ ...q, explanation: '' }); }}>
                  ✕ ลบคำอธิบาย
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function TestEditorModal({ test, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState('');
  const saveTimeout = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getQuestions(test.id);
      if (data.length === 0) {
        setQuestions([emptyQuestion(1)]);
      } else {
        setQuestions(data.map(q => ({ ...q, _key: q.id })));
      }
    } catch {
      setQuestions([emptyQuestion(1)]);
    } finally {
      setLoading(false);
    }
  }, [test.id]);

  useEffect(() => { load(); }, [load]);

  // auto-save indicator
  function markDirty() {
    setSaved(false);
    clearTimeout(saveTimeout.current);
  }

  function handleChange(idx, updated) {
    markDirty();
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...updated, _key: q._key } : q));
  }

  function handleDelete(idx) {
    markDirty();
    setQuestions(qs => qs.filter((_, i) => i !== idx)
      .map((q, i) => ({ ...q, questionOrder: i + 1 })));
  }

  function handleMove(idx, dir) {
    markDirty();
    setQuestions(qs => {
      const arr = [...qs];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr.map((q, i) => ({ ...q, questionOrder: i + 1 }));
    });
  }

  function addQuestion() {
    markDirty();
    setQuestions(qs => [...qs, { ...emptyQuestion(qs.length + 1), _key: Date.now() }]);
  }

  async function handleSave() {
    setError('');
    // validate: every question must have text
    const invalid = questions.find(q => !q.questionText.trim());
    if (invalid) { setError('กรุณากรอกข้อความคำถามให้ครบทุกข้อ'); return; }

    setSaving(true);
    try {
      const payload = questions.map((q, i) => ({
        questionText: q.questionText.trim(),
        questionType: q.questionType,
        questionOrder: i + 1,
        explanation: q.explanation || '',
        options: q.options.map((o, oi) => ({
          optionText: o.optionText,
          correct: o.correct,
          optionOrder: oi + 1,
        })),
      }));
      const saved = await saveAllQuestions(test.id, payload);
      setQuestions(saved.map(q => ({ ...q, _key: q.id })));
      setSaved(true);
    } catch (e) {
      setError(e.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="tqe-overlay" onClick={onClose}>
      <div className="tqe-modal" onClick={e => e.stopPropagation()}>

        {/* header */}
        <div className="tqe-header">
          <div className="tqe-header-left">
            <div className="tqe-header-icon">📝</div>
            <div>
              <h2>{test.testTitle}</h2>
              <p>แบบทดสอบ · บทที่ {test.lessonOrder ?? '—'}</p>
            </div>
          </div>
          <div className="tqe-header-right">
            {saved && <span className="tqe-saved-chip">✓ บันทึกแล้ว</span>}
            <button className="tqe-btn-save" onClick={handleSave} disabled={saving}>
              {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
            </button>
            <button className="tqe-btn-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* error bar */}
        {error && <div className="tqe-error-bar">{error}</div>}

        {/* body */}
        <div className="tqe-body">
          {loading ? (
            <div className="tqe-loading">กำลังโหลด...</div>
          ) : (
            <>
              <div className="tqe-questions-list">
                {questions.map((q, idx) => (
                  <QuestionCard
                    key={q._key}
                    q={q}
                    idx={idx}
                    total={questions.length}
                    onChange={u => handleChange(idx, u)}
                    onDelete={handleDelete}
                    onMove={handleMove}
                  />
                ))}
              </div>

              <button className="tqe-add-question-btn" onClick={addQuestion}>
                <span>+</span> เพิ่มคำถาม
              </button>
            </>
          )}
        </div>

        {/* footer */}
        <div className="tqe-footer">
          <span className="tqe-q-count">{questions.length} คำถาม</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="tqe-btn-cancel" onClick={onClose}>ปิด</button>
            <button className="tqe-btn-save" onClick={handleSave} disabled={saving}>
              {saving ? 'กำลังบันทึก...' : '💾 บันทึกแบบทดสอบ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
