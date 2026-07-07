import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyExamSchedule } from '../services/studentExamService';
import './StudentExamSchedulePage.css';

const STATUS_LABELS = {
  DRAFT: 'ยังไม่เปิดสอบ',
  OPEN: 'เปิดสอบอยู่',
  CLOSED: 'ปิดสอบแล้ว',
  CANCELLED: 'ยกเลิก',
};

const FILTERS = [
  { key: 'ALL', label: 'ทั้งหมด' },
  { key: 'OPEN', label: 'เปิดสอบอยู่' },
  { key: 'DRAFT', label: 'ยังไม่เปิด' },
  { key: 'CLOSED', label: 'ปิดแล้ว' },
];

function safeText(value) {
  return value === null || value === undefined || value === '' ? '-' : value;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusClass(status) {
  return `es-status es-status-${String(status || 'unknown').toLowerCase()}`;
}

function getErrorMessage(err) {
  const status = err?.response?.status;
  if (status === 401) return 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
  if (status === 403) return 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้';
  if (status === 500) return 'เกิดข้อผิดพลาดจากระบบ กรุณาลองใหม่อีกครั้ง';
  return err?.response?.data?.message || err?.message || 'ไม่สามารถโหลดตารางสอบได้';
}

export default function StudentExamSchedulePage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const data = await getMyExamSchedule();
      const list = Array.isArray(data) ? data : [];
      list.sort((a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return new Date(a.startTime) - new Date(b.startTime);
      });
      setExams(list);
    } catch (err) {
      setError(getErrorMessage(err));
      setExams([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    return {
      total: exams.length,
      open: exams.filter((e) => e.status === 'OPEN').length,
      upcoming: exams.filter((e) => e.status === 'DRAFT').length,
      closed: exams.filter((e) => e.status === 'CLOSED').length,
    };
  }, [exams]);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return exams;
    return exams.filter((e) => e.status === filter);
  }, [exams, filter]);

  return (
    <div className="es-page">
      <section className="es-hero-card">
        <div>
          <p className="es-eyebrow">Student Exam Schedule</p>
          <h1>ตารางสอบของฉัน</h1>
          <p>ดูกำหนดการสอบของทุกคอร์สที่ลงทะเบียนไว้ ทั้งที่ยังไม่เปิด กำลังเปิดสอบ และปิดสอบแล้ว</p>
        </div>
        <div className="es-hero-icon" aria-hidden="true">📝</div>
      </section>

      <section className="es-summary-grid">
        <div className="es-summary-card"><span>ข้อสอบทั้งหมด</span><strong>{summary.total}</strong></div>
        <div className="es-summary-card"><span>เปิดสอบอยู่</span><strong>{summary.open}</strong></div>
        <div className="es-summary-card"><span>ยังไม่เปิด</span><strong>{summary.upcoming}</strong></div>
        <div className="es-summary-card"><span>ปิดแล้ว</span><strong>{summary.closed}</strong></div>
      </section>

      <section className="es-content-card">
        <div className="es-filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={filter === f.key ? 'es-filter-active' : ''}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="es-loading">
            <div className="es-spinner" />
            <p>กำลังโหลดตารางสอบ...</p>
          </div>
        )}

        {!loading && error && (
          <div className="es-error-box">
            <strong>เกิดข้อผิดพลาด</strong>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="es-empty-state">
            <div className="es-empty-icon">🗓️</div>
            <h3>ยังไม่มีข้อสอบ</h3>
            <p>เมื่อติวเตอร์กำหนดวันสอบของคอร์สที่คุณลงทะเบียนไว้ รายการจะแสดงที่นี่</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="es-grid">
            {filtered.map((exam) => (
              <article key={exam.id} className="es-card">
                <div className="es-card-top">
                  <div>
                    <p className="es-card-course">{safeText(exam.courseName)}</p>
                    <h3>{safeText(exam.title)}</h3>
                  </div>
                  <span className={getStatusClass(exam.status)}>
                    {STATUS_LABELS[exam.status] || exam.status}
                  </span>
                </div>

                {exam.description && <p className="es-card-desc">{exam.description}</p>}

                <div className="es-info-list">
                  <div>
                    <span>เวลาเปิดสอบ</span>
                    <strong>{formatDateTime(exam.startTime)}</strong>
                  </div>
                  <div>
                    <span>เวลาปิดสอบ</span>
                    <strong>{formatDateTime(exam.endTime)}</strong>
                  </div>
                  <div>
                    <span>ระยะเวลาทำข้อสอบ</span>
                    <strong>{exam.durationMinutes ? `${exam.durationMinutes} นาที` : '-'}</strong>
                  </div>
                  <div>
                    <span>คะแนนเต็ม / ผ่าน</span>
                    <strong>
                      {exam.totalScore ?? '-'} / {exam.passingScore ?? '-'}
                    </strong>
                  </div>
                </div>

                {exam.status === 'OPEN' && (
                  <button
                    type="button"
                    className="es-take-btn"
                    onClick={() => navigate(`/student/exams/${exam.id}/take`)}
                  >
                    เข้าสอบ
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
