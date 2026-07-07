import { useEffect, useMemo, useState } from 'react';
import { getMyExamResults, getSubmissionById } from '../services/studentExamService';
import './StudentExamResultsPage.css';

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function StudentExamResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const data = await getMyExamResults();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(() => {
    const graded = results.filter((r) => r.status !== 'IN_PROGRESS');
    const passed = graded.filter((r) => r.isPassed === true).length;
    return { total: graded.length, passed, failed: graded.filter((r) => r.isPassed === false).length };
  }, [results]);

  return (
    <div className="ser-page">
      <section className="ser-hero-card">
        <div>
          <p className="ser-eyebrow">Student Exam Results</p>
          <h1>ผลสอบของฉัน</h1>
          <p>ดูคะแนนและผลสอบของทุกข้อสอบที่คุณทำไปแล้ว</p>
        </div>
        <div className="ser-hero-icon" aria-hidden="true">🏆</div>
      </section>

      <section className="ser-summary-grid">
        <div className="ser-summary-card"><span>สอบไปแล้ว</span><strong>{summary.total}</strong></div>
        <div className="ser-summary-card"><span>ผ่านเกณฑ์</span><strong>{summary.passed}</strong></div>
        <div className="ser-summary-card"><span>ไม่ผ่านเกณฑ์</span><strong>{summary.failed}</strong></div>
      </section>

      <section className="ser-content-card">
        {loading && <div className="ser-loading">กำลังโหลดผลสอบ...</div>}

        {!loading && error && (
          <div className="ser-error-box"><strong>เกิดข้อผิดพลาด</strong><p>{error}</p></div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="ser-empty-state">
            <div className="ser-empty-icon">📄</div>
            <h3>ยังไม่มีผลสอบ</h3>
            <p>เมื่อคุณทำข้อสอบเสร็จแล้ว ผลคะแนนจะแสดงที่นี่</p>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="ser-list">
            {results.map((r) => (
              <button
                key={r.submissionId}
                type="button"
                className="ser-row"
                onClick={() => setSelectedId(r.submissionId)}
              >
                <div>
                  <strong>{r.examTitle}</strong>
                  <p>{formatDateTime(r.submittedAt)}</p>
                </div>
                <div className="ser-row-score">
                  <span>{r.obtainedScore ?? '-'} / {r.totalScore ?? '-'}</span>
                  {r.isPassed !== null && (
                    <span className={r.isPassed ? 'ser-pass' : 'ser-fail'}>
                      {r.isPassed ? 'ผ่าน' : 'ไม่ผ่าน'}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedId && (
        <ResultDetailModal submissionId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

function ResultDetailModal({ submissionId, onClose }) {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getSubmissionById(submissionId)
      .then((data) => { if (active) setSubmission(data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [submissionId]);

  return (
    <div className="ser-modal-backdrop" onClick={onClose}>
      <div className="ser-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ser-modal-header">
          <h2>{submission ? submission.examTitle : 'รายละเอียดผลสอบ'}</h2>
          <button type="button" onClick={onClose}>✕</button>
        </div>

        {loading && <div className="ser-loading">กำลังโหลด...</div>}
        {error && <div className="ser-error-box"><p>{error}</p></div>}

        {!loading && submission && (
          <div className="ser-modal-body">
            <div className="ser-submission-summary">
              คะแนนรวม {submission.obtainedScore ?? 0} / {submission.totalScore ?? 0}
              {' · '}ถูก {submission.correctCount} · ผิด {submission.wrongCount} · ไม่ตอบ {submission.unansweredCount}
            </div>

            {(submission.answers || []).map((a) => (
              <div key={a.questionId} className="ser-answer-card">
                <p className="ser-answer-question">{a.questionText}</p>
                <p className="ser-answer-given">
                  คำตอบของคุณ: {a.selectedOptionText || a.studentAnswerText || <em>ไม่ได้ตอบ</em>}
                </p>
                <p className="ser-answer-score">
                  {a.scoreAwarded ?? 0} / {a.questionScore} คะแนน
                  {a.isCorrect === true && <span className="ser-pass"> ถูก</span>}
                  {a.isCorrect === false && <span className="ser-fail"> ผิด</span>}
                  {a.isCorrect === null && <span className="ser-pending"> รอตรวจ</span>}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="ser-modal-footer">
          <button type="button" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </div>
  );
}
