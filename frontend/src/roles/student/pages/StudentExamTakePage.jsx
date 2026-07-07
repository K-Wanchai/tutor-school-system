import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { startExam, submitExam } from '../services/studentExamService';
import './StudentExamTakePage.css';

function formatClock(totalSeconds) {
  if (totalSeconds == null || totalSeconds < 0) return '--:--';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function StudentExamTakePage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startError, setStartError] = useState('');
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const submittedRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function begin() {
      try {
        setLoading(true);
        setStartError('');
        const data = await startExam(examId);
        if (!active) return;
        setExam(data);

        const durationSeconds = data.durationMinutes ? data.durationMinutes * 60 : null;
        const endTimeSeconds = data.endTime
          ? Math.floor((new Date(data.endTime).getTime() - Date.now()) / 1000)
          : null;

        const candidates = [durationSeconds, endTimeSeconds].filter((v) => v !== null && v > 0);
        setSecondsLeft(candidates.length > 0 ? Math.min(...candidates) : null);
      } catch (err) {
        if (active) setStartError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    begin();
    return () => { active = false; };
  }, [examId]);

  useEffect(() => {
    if (secondsLeft === null || result) return;
    if (secondsLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const timer = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, result]);

  useEffect(() => {
    function warnBeforeUnload(e) {
      if (exam && !result) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [exam, result]);

  const questions = useMemo(
    () => (exam?.questions ? [...exam.questions].sort((a, b) => a.questionOrder - b.questionOrder) : []),
    [exam]
  );

  function setSingleAnswer(questionId, optionId) {
    setAnswers((a) => ({ ...a, [questionId]: { selectedOptionId: optionId } }));
  }

  function toggleCheckboxAnswer(questionId, optionId) {
    setAnswers((a) => {
      const current = a[questionId]?.selectedOptionIds || [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...a, [questionId]: { selectedOptionIds: next } };
    });
  }

  function setTextAnswer(questionId, text) {
    setAnswers((a) => ({ ...a, [questionId]: { studentAnswerText: text } }));
  }

  async function handleSubmit(isAutoSubmit = false) {
    if (submittedRef.current) return;
    if (!isAutoSubmit) {
      const unanswered = questions.filter((q) => q.isRequired && !answers[q.id]);
      if (unanswered.length > 0) {
        const ok = window.confirm(`คุณยังไม่ได้ตอบ ${unanswered.length} ข้อที่บังคับตอบ ต้องการส่งคำตอบเลยหรือไม่?`);
        if (!ok) return;
      }
    }

    submittedRef.current = true;
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: answers[q.id]?.selectedOptionId ?? null,
        selectedOptionIds: answers[q.id]?.selectedOptionIds ?? null,
        studentAnswerText: answers[q.id]?.studentAnswerText ?? null,
      }));
      const submissionResult = await submitExam(examId, payload);
      setResult(submissionResult);
    } catch (err) {
      setSubmitError(err.message);
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="set-page"><div className="set-loading">กำลังเริ่มการสอบ...</div></div>;
  }

  if (startError) {
    return (
      <div className="set-page">
        <div className="set-error-box">
          <strong>ไม่สามารถเข้าสอบได้</strong>
          <p>{startError}</p>
          <button type="button" onClick={() => navigate('/student/exam-schedule')}>กลับไปตารางสอบ</button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="set-page">
        <div className="set-result-card">
          <h1>ส่งคำตอบสำเร็จ</h1>
          <p className="set-result-title">{exam?.title}</p>

          {result.obtainedScore !== null && result.obtainedScore !== undefined && (
            <div className="set-result-score">
              <span>{result.obtainedScore}</span> / {result.totalScore ?? exam?.totalScore ?? '-'}
            </div>
          )}

          {result.isPassed !== null && result.isPassed !== undefined && (
            <div className={result.isPassed ? 'set-result-pass' : 'set-result-fail'}>
              {result.isPassed ? '✓ ผ่านเกณฑ์' : '✕ ไม่ผ่านเกณฑ์'}
            </div>
          )}

          <div className="set-result-stats">
            <div><span>ถูก</span><strong>{result.correctCount ?? '-'}</strong></div>
            <div><span>ผิด</span><strong>{result.wrongCount ?? '-'}</strong></div>
            <div><span>ไม่ได้ตอบ</span><strong>{result.unansweredCount ?? '-'}</strong></div>
          </div>

          <p className="set-result-hint">
            คำตอบบางข้อ (ถ้ามี แบบบรรยาย) อาจต้องรอติวเตอร์ตรวจก่อนได้คะแนนสมบูรณ์
          </p>

          <button type="button" className="set-btn-primary" onClick={() => navigate('/student/exam-schedule')}>
            กลับไปตารางสอบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="set-page">
      <div className="set-exam-header">
        <div>
          <p className="set-exam-course">{exam?.courseName}</p>
          <h1>{exam?.title}</h1>
          {exam?.description && <p className="set-exam-desc">{exam.description}</p>}
        </div>

        {secondsLeft !== null && (
          <div className={`set-timer ${secondsLeft <= 60 ? 'set-timer-danger' : ''}`}>
            เวลาที่เหลือ
            <strong>{formatClock(secondsLeft)}</strong>
          </div>
        )}
      </div>

      {submitError && <div className="set-form-err">{submitError}</div>}

      <div className="set-questions">
        {questions.map((q, idx) => (
          <div key={q.id} className="set-question-card">
            <p className="set-question-text">
              <span className="set-question-index">ข้อ {idx + 1}.</span> {q.questionText}
              {q.isRequired && <span className="set-required-mark">*</span>}
              <span className="set-question-score">({q.score} คะแนน)</span>
            </p>

            {(q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'TRUE_FALSE') && (
              <div className="set-options">
                {(q.options || []).map((o) => (
                  <label key={o.id} className="set-option-row">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id]?.selectedOptionId === o.id}
                      onChange={() => setSingleAnswer(q.id, o.id)}
                    />
                    {o.optionText}
                  </label>
                ))}
              </div>
            )}

            {q.questionType === 'CHECKBOX' && (
              <div className="set-options">
                {(q.options || []).map((o) => (
                  <label key={o.id} className="set-option-row">
                    <input
                      type="checkbox"
                      checked={(answers[q.id]?.selectedOptionIds || []).includes(o.id)}
                      onChange={() => toggleCheckboxAnswer(q.id, o.id)}
                    />
                    {o.optionText}
                  </label>
                ))}
              </div>
            )}

            {q.questionType === 'SHORT_ANSWER' && (
              <input
                type="text"
                className="set-text-input"
                placeholder="พิมพ์คำตอบของคุณ"
                value={answers[q.id]?.studentAnswerText || ''}
                onChange={(e) => setTextAnswer(q.id, e.target.value)}
              />
            )}

            {q.questionType === 'PARAGRAPH' && (
              <textarea
                className="set-text-input"
                placeholder="พิมพ์คำตอบของคุณ"
                value={answers[q.id]?.studentAnswerText || ''}
                onChange={(e) => setTextAnswer(q.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="set-submit-bar">
        <button type="button" className="set-btn-primary" disabled={submitting} onClick={() => handleSubmit(false)}>
          {submitting ? 'กำลังส่ง...' : 'ส่งคำตอบ'}
        </button>
      </div>
    </div>
  );
}
