import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  addOption,
  addQuestion,
  deleteOption,
  deleteQuestion,
  getExamById,
  updateOption,
  updateQuestion,
} from '../services/tutorExamService';
import './TutorExamBuilderPage.css';

const QUESTION_TYPES = [
  { key: 'MULTIPLE_CHOICE', label: 'ตัวเลือกเดียว (Multiple choice)' },
  { key: 'CHECKBOX', label: 'หลายตัวเลือก (Checkbox)' },
  { key: 'TRUE_FALSE', label: 'ถูก/ผิด (True-False)' },
  { key: 'SHORT_ANSWER', label: 'คำตอบสั้น (ตรวจเอง)' },
  { key: 'PARAGRAPH', label: 'คำตอบยาว/บรรยาย (ตรวจเอง)' },
];

const HAS_OPTIONS = new Set(['MULTIPLE_CHOICE', 'CHECKBOX', 'TRUE_FALSE']);

function nextOrder(list, key) {
  return list.length > 0 ? Math.max(...list.map((x) => x[key] || 0)) + 1 : 1;
}

function emptyOptionRow() {
  return { text: '', correct: false, _key: Math.random().toString(36).slice(2) };
}

export default function TutorExamBuilderPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(null);
  const [addErr, setAddErr] = useState('');

  const [editingQuestionId, setEditingQuestionId] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const data = await getExamById(examId);
      setExam(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [examId]);

  const questions = exam?.questions ? [...exam.questions].sort((a, b) => a.questionOrder - b.questionOrder) : [];
  const editable = exam && exam.status !== 'OPEN';

  function startAddForm(type) {
    setAddForm({
      questionType: type,
      questionText: '',
      explanation: '',
      score: '',
      required: true,
      questionOrder: nextOrder(questions, 'questionOrder'),
      options: type === 'TRUE_FALSE'
        ? [
            { text: 'ถูก', correct: true, _key: 'true' },
            { text: 'ผิด', correct: false, _key: 'false' },
          ]
        : HAS_OPTIONS.has(type)
          ? [emptyOptionRow(), emptyOptionRow()]
          : [],
    });
    setAddErr('');
    setShowAddForm(true);
  }

  function setOptionField(index, field, value) {
    setAddForm((f) => {
      const options = [...f.options];
      if (field === 'correct' && f.questionType === 'MULTIPLE_CHOICE') {
        // เลือกได้คำตอบเดียว
        options.forEach((o, i) => { o.correct = i === index; });
      } else {
        options[index] = { ...options[index], [field]: value };
      }
      return { ...f, options };
    });
  }

  function addOptionRow() {
    setAddForm((f) => ({ ...f, options: [...f.options, emptyOptionRow()] }));
  }

  function removeOptionRow(index) {
    setAddForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== index) }));
  }

  async function submitAddQuestion(e) {
    e.preventDefault();
    if (!addForm.questionText.trim()) return setAddErr('กรุณากรอกคำถาม');
    if (!addForm.score || Number(addForm.score) <= 0) return setAddErr('กรุณากรอกคะแนนของคำถามนี้ (มากกว่า 0)');

    if (HAS_OPTIONS.has(addForm.questionType)) {
      const filled = addForm.options.filter((o) => o.text.trim());
      if (filled.length < 2) return setAddErr('ต้องมีตัวเลือกอย่างน้อย 2 ข้อ');
      if (!filled.some((o) => o.correct)) return setAddErr('กรุณาเลือกคำตอบที่ถูกต้องอย่างน้อย 1 ข้อ');
    }

    setBusy(true);
    setAddErr('');
    try {
      const payload = {
        questionText: addForm.questionText.trim(),
        questionType: addForm.questionType,
        explanation: addForm.explanation.trim() || null,
        score: Number(addForm.score),
        required: addForm.required,
        questionOrder: addForm.questionOrder,
        options: HAS_OPTIONS.has(addForm.questionType)
          ? addForm.options
              .filter((o) => o.text.trim())
              .map((o, i) => ({ optionText: o.text.trim(), correct: o.correct, optionOrder: i + 1 }))
          : [],
      };
      await addQuestion(examId, payload);
      setShowAddForm(false);
      setAddForm(null);
      await load();
    } catch (err) {
      setAddErr(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteQuestion(questionId) {
    if (!window.confirm('ลบคำถามนี้?')) return;
    setBusy(true);
    try {
      await deleteQuestion(questionId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="teb-page">
      <div className="teb-header">
        <button type="button" className="teb-back" onClick={() => navigate('/tutor/exam-schedule')}>
          ‹ กลับไปตารางสอบ
        </button>

        {exam && (
          <>
            <h1>{exam.title}</h1>
            <p>{exam.courseName} {exam.lessonTitle ? `· บท ${exam.lessonTitle}` : ''} — คะแนนเต็ม {exam.totalScore ?? 0} / ผ่าน {exam.passingScore ?? '-'}</p>
          </>
        )}
      </div>

      {loading && <div className="teb-loading">กำลังโหลดข้อสอบ...</div>}

      {!loading && error && (
        <div className="teb-error-box"><strong>เกิดข้อผิดพลาด</strong><p>{error}</p></div>
      )}

      {!loading && !error && exam && (
        <>
          {!editable && (
            <div className="teb-note">
              ข้อสอบนี้เปิดสอบอยู่ (OPEN) — ต้องปิดสอบก่อนจึงจะเพิ่ม/แก้ไข/ลบคำถามได้
            </div>
          )}

          <div className="teb-questions">
            {questions.length === 0 && (
              <div className="teb-empty">ยังไม่มีคำถามในข้อสอบนี้</div>
            )}

            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                index={idx + 1}
                question={q}
                editable={editable}
                editing={editingQuestionId === q.id}
                onStartEdit={() => setEditingQuestionId(q.id)}
                onStopEdit={() => setEditingQuestionId(null)}
                onDelete={() => handleDeleteQuestion(q.id)}
                onChanged={load}
                busy={busy}
                setBusy={setBusy}
                setError={setError}
              />
            ))}
          </div>

          {editable && !showAddForm && (
            <div className="teb-add-type-row">
              <span>เพิ่มคำถามใหม่:</span>
              {QUESTION_TYPES.map((t) => (
                <button key={t.key} type="button" onClick={() => startAddForm(t.key)}>
                  + {t.label}
                </button>
              ))}
            </div>
          )}

          {editable && showAddForm && addForm && (
            <form className="teb-add-form" onSubmit={submitAddQuestion}>
              <div className="teb-add-form-head">
                <strong>เพิ่มคำถาม — {QUESTION_TYPES.find((t) => t.key === addForm.questionType)?.label}</strong>
                <button type="button" onClick={() => { setShowAddForm(false); setAddForm(null); }}>✕</button>
              </div>

              <label>
                คำถาม *
                <textarea
                  value={addForm.questionText}
                  onChange={(e) => setAddForm((f) => ({ ...f, questionText: e.target.value }))}
                />
              </label>

              {HAS_OPTIONS.has(addForm.questionType) && (
                <div className="teb-options-editor">
                  <span className="teb-lbl">ตัวเลือก * (เลือกคำตอบที่ถูก)</span>
                  {addForm.options.map((o, i) => (
                    <div key={o._key} className="teb-option-row">
                      <input
                        type={addForm.questionType === 'MULTIPLE_CHOICE' || addForm.questionType === 'TRUE_FALSE' ? 'radio' : 'checkbox'}
                        name="correct-option"
                        checked={o.correct}
                        onChange={(e) => setOptionField(i, 'correct', addForm.questionType === 'CHECKBOX' ? e.target.checked : true)}
                      />
                      <input
                        type="text"
                        value={o.text}
                        placeholder={`ตัวเลือกที่ ${i + 1}`}
                        disabled={addForm.questionType === 'TRUE_FALSE'}
                        onChange={(e) => setOptionField(i, 'text', e.target.value)}
                      />
                      {addForm.questionType !== 'TRUE_FALSE' && addForm.options.length > 2 && (
                        <button type="button" onClick={() => removeOptionRow(i)}>ลบ</button>
                      )}
                    </div>
                  ))}
                  {addForm.questionType !== 'TRUE_FALSE' && (
                    <button type="button" className="teb-add-option-btn" onClick={addOptionRow}>+ เพิ่มตัวเลือก</button>
                  )}
                </div>
              )}

              <div className="teb-form-row">
                <label>
                  คะแนนของคำถามนี้ *
                  <input
                    type="number" min="0.5" step="0.5"
                    value={addForm.score}
                    onChange={(e) => setAddForm((f) => ({ ...f, score: e.target.value }))}
                  />
                </label>

                <label className="teb-checkbox-row">
                  <input
                    type="checkbox"
                    checked={addForm.required}
                    onChange={(e) => setAddForm((f) => ({ ...f, required: e.target.checked }))}
                  />
                  บังคับตอบ
                </label>
              </div>

              <label>
                คำอธิบายเฉลย (แสดงหลังส่งคำตอบ ถ้าเปิดใช้งาน)
                <textarea
                  value={addForm.explanation}
                  onChange={(e) => setAddForm((f) => ({ ...f, explanation: e.target.value }))}
                />
              </label>

              {addErr && <div className="teb-form-err">{addErr}</div>}

              <div className="teb-form-actions">
                <button type="button" onClick={() => { setShowAddForm(false); setAddForm(null); }}>ยกเลิก</button>
                <button type="submit" className="teb-btn-primary" disabled={busy}>บันทึกคำถาม</button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}

function QuestionCard({ index, question, editable, editing, onStartEdit, onStopEdit, onDelete, onChanged, busy, setBusy, setError }) {
  const [form, setForm] = useState(null);
  const [newOptionText, setNewOptionText] = useState('');

  useEffect(() => {
    if (editing) {
      setForm({
        questionText: question.questionText,
        explanation: question.explanation || '',
        score: String(question.score),
        required: question.isRequired,
      });
    }
  }, [editing, question]);

  async function saveQuestionFields() {
    setBusy(true);
    setError('');
    try {
      await updateQuestion(question.id, {
        questionText: form.questionText,
        explanation: form.explanation || null,
        score: Number(form.score),
        required: form.required,
      });
      onStopEdit();
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveOption(optionId, text, correct) {
    setBusy(true);
    setError('');
    try {
      await updateOption(optionId, { optionText: text, correct });
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeOption(optionId) {
    if (!window.confirm('ลบตัวเลือกนี้?')) return;
    setBusy(true);
    setError('');
    try {
      await deleteOption(optionId);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddOption() {
    if (!newOptionText.trim()) return;
    setBusy(true);
    setError('');
    try {
      const order = (question.options?.length || 0) + 1;
      await addOption(question.id, { optionText: newOptionText.trim(), correct: false, optionOrder: order });
      setNewOptionText('');
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const typeLabel = QUESTION_TYPES.find((t) => t.key === question.questionType)?.label || question.questionType;

  return (
    <div className="teb-question-card">
      <div className="teb-question-top">
        <span className="teb-question-index">ข้อ {index}</span>
        <span className="teb-question-type">{typeLabel}</span>
        <span className="teb-question-score">{question.score} คะแนน</span>
        {question.isRequired && <span className="teb-question-required">บังคับตอบ</span>}
      </div>

      {!editing && (
        <>
          <p className="teb-question-text">{question.questionText}</p>

          {HAS_OPTIONS.has(question.questionType) && (
            <ul className="teb-option-list">
              {(question.options || []).map((o) => (
                <li key={o.id} className={o.isCorrect ? 'teb-option-correct' : ''}>
                  {o.isCorrect ? '✓ ' : ''}{o.optionText}
                </li>
              ))}
            </ul>
          )}

          {question.explanation && <p className="teb-question-explanation">คำอธิบาย: {question.explanation}</p>}

          {editable && (
            <div className="teb-question-actions">
              <button type="button" onClick={onStartEdit}>แก้ไข</button>
              <button type="button" onClick={onDelete} disabled={busy}>ลบคำถาม</button>
            </div>
          )}
        </>
      )}

      {editing && form && (
        <div className="teb-edit-block">
          <label>
            คำถาม
            <textarea value={form.questionText} onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))} />
          </label>

          <div className="teb-form-row">
            <label>
              คะแนน
              <input type="number" min="0.5" step="0.5" value={form.score} onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))} />
            </label>
            <label className="teb-checkbox-row">
              <input type="checkbox" checked={form.required} onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked }))} />
              บังคับตอบ
            </label>
          </div>

          <label>
            คำอธิบายเฉลย
            <textarea value={form.explanation} onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))} />
          </label>

          {HAS_OPTIONS.has(question.questionType) && (
            <div className="teb-options-editor">
              <span className="teb-lbl">ตัวเลือก (แก้ไข/ลบทีละข้อ)</span>
              {(question.options || []).map((o) => (
                <div key={o.id} className="teb-option-row">
                  <input
                    type="checkbox"
                    checked={!!o.isCorrect}
                    onChange={(e) => saveOption(o.id, o.optionText, e.target.checked)}
                  />
                  <input
                    type="text"
                    defaultValue={o.optionText}
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value !== o.optionText) {
                        saveOption(o.id, e.target.value.trim(), !!o.isCorrect);
                      }
                    }}
                  />
                  <button type="button" onClick={() => removeOption(o.id)}>ลบ</button>
                </div>
              ))}
              <div className="teb-option-row">
                <input
                  type="text"
                  placeholder="+ เพิ่มตัวเลือกใหม่"
                  value={newOptionText}
                  onChange={(e) => setNewOptionText(e.target.value)}
                />
                <button type="button" onClick={handleAddOption}>เพิ่ม</button>
              </div>
            </div>
          )}

          <div className="teb-form-actions">
            <button type="button" onClick={onStopEdit}>ปิด</button>
            <button type="button" className="teb-btn-primary" onClick={saveQuestionFields} disabled={busy}>บันทึก</button>
          </div>
        </div>
      )}
    </div>
  );
}
