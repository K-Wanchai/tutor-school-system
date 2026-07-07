import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getResultsByExam, getSubmissionById, gradeAnswer } from '../services/tutorExamService';
import './TutorExamGradingPage.css';

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function TutorExamGradingPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const data = await getResultsByExam(examId);
      setResults(data);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [examId]);

  const summary = useMemo(() => {
    const submitted = results.filter((r) => r.status !== 'IN_PROGRESS');
    const passed = submitted.filter((r) => r.isPassed === true).length;
    const pendingGrade = submitted.filter((r) => r.status === 'SUBMITTED').length;
    const avg = submitted.length > 0
      ? (submitted.reduce((sum, r) => sum + (r.obtainedScore || 0), 0) / submitted.length).toFixed(1)
      : '-';
    return { total: submitted.length, passed, pendingGrade, avg };
  }, [results]);

  return (
    <div className="teg-page">
      <div className="teg-header">
        <button type="button" className="teg-back" onClick={() => navigate('/tutor/exam-schedule')}>
          ‹ กลับไปตารางสอบ
        </button>
        <h1>ผลสอบ / ตรวจข้อสอบ</h1>
        <p>{results[0]?.examTitle ? `ข้อสอบ: ${results[0].examTitle}` : ''}</p>
      </div>

      <div className="teg-summary">
        <div className="teg-summary-card"><p>นักเรียนที่ส่งแล้ว</p><h2>{summary.total}</h2></div>
        <div className="teg-summary-card"><p>ผ่านเกณฑ์</p><h2>{summary.passed}</h2></div>
        <div className="teg-summary-card"><p>รอตรวจ (มีคำตอบบรรยาย)</p><h2>{summary.pendingGrade}</h2></div>
        <div className="teg-summary-card"><p>คะแนนเฉลี่ย</p><h2>{summary.avg}</h2></div>
      </div>

      {loading && <div className="teg-loading">กำลังโหลดผลสอบ...</div>}

      {!loading && error && (
        <div className="teg-error-box"><strong>เกิดข้อผิดพลาด</strong><p>{error}</p></div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="teg-empty">ยังไม่มีนักเรียนทำข้อสอบชุดนี้</div>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="teg-table-wrap">
          <table className="teg-table">
            <thead>
              <tr>
                <th>นักเรียน</th>
                <th>คะแนน</th>
                <th>ถูก/ผิด/ไม่ตอบ</th>
                <th>ผล</th>
                <th>สถานะ</th>
                <th>ส่งเมื่อ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.submissionId}>
                  <td>
                    <strong>{r.studentName}</strong>
                    {r.studentCode && <div className="teg-muted">{r.studentCode}</div>}
                  </td>
                  <td>{r.obtainedScore ?? '-'} / {r.totalScore ?? '-'}</td>
                  <td>{r.correctCount}/{r.wrongCount}/{r.unansweredCount}</td>
                  <td>
                    {r.isPassed === null ? '-' : (
                      <span className={r.isPassed ? 'teg-pass' : 'teg-fail'}>
                        {r.isPassed ? 'ผ่าน' : 'ไม่ผ่าน'}
                      </span>
                    )}
                  </td>
                  <td>{r.status}</td>
                  <td>{formatDateTime(r.submittedAt)}</td>
                  <td>
                    <button type="button" onClick={() => setSelectedSubmissionId(r.submissionId)}>
                      ดู/ตรวจ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedSubmissionId && (
        <SubmissionDetailModal
          submissionId={selectedSubmissionId}
          onClose={() => setSelectedSubmissionId(null)}
          onGraded={load}
        />
      )}
    </div>
  );
}

function SubmissionDetailModal({ submissionId, onClose, onGraded }) {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gradeForms, setGradeForms] = useState({});
  const [busyQuestionId, setBusyQuestionId] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const data = await getSubmissionById(submissionId);
      setSubmission(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  function setGradeField(questionId, field, value) {
    setGradeForms((prev) => ({ ...prev, [questionId]: { ...prev[questionId], [field]: value } }));
  }

  async function submitGrade(answer) {
    const form = gradeForms[answer.questionId] || {};
    const reason = (form.reason || '').trim();
    if (!reason) {
      setError('กรุณากรอกเหตุผลในการให้คะแนน');
      return;
    }
    setBusyQuestionId(answer.questionId);
    setError('');
    try {
      await gradeAnswer(submissionId, {
        questionId: answer.questionId,
        scoreAwarded: Number(form.scoreAwarded ?? 0),
        isCorrect: form.isCorrect ?? null,
        reason,
      });
      await load();
      await onGraded();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyQuestionId(null);
    }
  }

  return (
    <div className="teg-modal-backdrop" onClick={onClose}>
      <div className="teg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="teg-modal-header">
          <h2>{submission ? `ข้อสอบของ ${submission.studentName}` : 'รายละเอียดการสอบ'}</h2>
          <button type="button" onClick={onClose}>✕</button>
        </div>

        {loading && <div className="teg-loading">กำลังโหลด...</div>}
        {error && <div className="teg-form-err">{error}</div>}

        {!loading && submission && (
          <div className="teg-modal-body">
            <div className="teg-submission-summary">
              คะแนนรวม {submission.obtainedScore ?? 0} / {submission.totalScore ?? 0}
              {' · '}ถูก {submission.correctCount} · ผิด {submission.wrongCount} · ไม่ตอบ {submission.unansweredCount}
              {submission.isPassed !== null && (
                <span className={submission.isPassed ? 'teg-pass' : 'teg-fail'}>
                  {' '}({submission.isPassed ? 'ผ่าน' : 'ไม่ผ่าน'})
                </span>
              )}
            </div>

            {(submission.answers || []).map((a) => (
              <div key={a.questionId} className="teg-answer-card">
                <p className="teg-answer-question">{a.questionText}</p>
                <p className="teg-answer-given">
                  คำตอบ: {a.selectedOptionText || a.studentAnswerText || <em>ไม่ได้ตอบ</em>}
                </p>
                <p className="teg-answer-score">
                  {a.scoreAwarded ?? 0} / {a.questionScore} คะแนน
                  {a.isCorrect === true && <span className="teg-pass"> ถูก</span>}
                  {a.isCorrect === false && <span className="teg-fail"> ผิด</span>}
                  {a.isCorrect === null && <span className="teg-pending"> รอตรวจ</span>}
                </p>

                {a.isCorrect === null && a.studentAnswerText && (
                  <div className="teg-grade-form">
                    <input
                      type="number" min="0" max={a.questionScore} step="0.5"
                      placeholder="คะแนนที่ให้"
                      value={gradeForms[a.questionId]?.scoreAwarded ?? ''}
                      onChange={(e) => setGradeField(a.questionId, 'scoreAwarded', e.target.value)}
                    />
                    <select
                      value={gradeForms[a.questionId]?.isCorrect ?? ''}
                      onChange={(e) => setGradeField(a.questionId, 'isCorrect', e.target.value === '' ? null : e.target.value === 'true')}
                    >
                      <option value="">ไม่ระบุถูก/ผิด</option>
                      <option value="true">ถูก</option>
                      <option value="false">ผิด</option>
                    </select>
                    <input
                      type="text"
                      placeholder="เหตุผล (บังคับ)"
                      value={gradeForms[a.questionId]?.reason ?? ''}
                      onChange={(e) => setGradeField(a.questionId, 'reason', e.target.value)}
                    />
                    <button
                      type="button"
                      disabled={busyQuestionId === a.questionId}
                      onClick={() => submitGrade(a)}
                    >
                      บันทึกคะแนน
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="teg-modal-footer">
          <button type="button" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </div>
  );
}
