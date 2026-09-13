import { useEffect, useMemo, useState } from 'react';
import { getCourseEvaluationSummaries, getEvaluationsByCourse } from '../services/adminEvaluationService';
import './AdminEvaluationResultsPage.css';

function formatScore(value) {
  if (value === null || value === undefined) return '—';
  return Number(value).toFixed(1);
}

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function Stars({ value }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <span className="er-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? 'er-star er-star--on' : 'er-star'}>★</span>
      ))}
    </span>
  );
}

function DetailModal({ course, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getEvaluationsByCourse(course.courseId)
      .then((data) => { if (active) setItems(data); })
      .catch((err) => { if (active) setError(err.message || 'ไม่สามารถโหลดรายละเอียดได้'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [course.courseId]);

  return (
    <div className="er-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="er-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="er-modal-header">
          <div>
            <p>ผลการประเมิน</p>
            <h2>{course.courseName}</h2>
            <span className="er-modal-tutor">ผู้สอน: {course.teacherName || '-'}</span>
          </div>
          <button type="button" className="er-modal-close" onClick={onClose} aria-label="ปิด">×</button>
        </div>

        <div className="er-modal-summary">
          <div className="er-modal-overall">
            <Stars value={course.averageRating} />
            <strong>{formatScore(course.averageRating)} / 5</strong>
            <span>{course.totalEvaluations} รีวิว</span>
          </div>
          <div className="er-modal-scores">
            {(course.criteriaAverages || []).map((field) => (
              <div key={field.criteriaId} className="er-modal-score-item">
                <span>{field.label}</span>
                <strong>{formatScore(field.averageScore)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="er-modal-body">
          {loading && <div className="er-state"><div className="er-spinner" />กำลังโหลด...</div>}
          {!loading && error && <div className="er-state er-state--error">{error}</div>}
          {!loading && !error && items.length === 0 && (
            <div className="er-state">ยังไม่มีรีวิวสำหรับคอร์สนี้</div>
          )}
          {!loading && !error && items.map((item) => (
            <article key={item.id} className="er-review-card">
              <div className="er-review-head">
                <div>
                  <strong>{item.isAnonymous ? 'ไม่ระบุชื่อผู้ประเมิน' : (item.studentName || 'นักเรียน')}</strong>
                  <span className="er-review-date">{formatDate(item.submittedAt)}</span>
                </div>
                <div className="er-review-rating"><Stars value={item.rating} /><span>{item.rating}/5</span></div>
              </div>
              {(item.criteriaScores || []).length > 0 && (
                <div className="er-review-criteria">
                  {item.criteriaScores.map((s) => (
                    <span key={s.criteriaId} className="er-review-criteria-item">
                      {s.label}: <b>{s.score}</b>
                    </span>
                  ))}
                </div>
              )}
              {item.comment && <p className="er-review-text">“{item.comment}”</p>}
              {item.suggestion && (
                <p className="er-review-suggestion"><b>ข้อเสนอแนะ:</b> {item.suggestion}</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminEvaluationResultsPage() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [detailCourse, setDetailCourse] = useState(null);

  function load() {
    setLoading(true);
    setError('');
    getCourseEvaluationSummaries()
      .then(setSummaries)
      .catch((err) => setError(err.message || 'ไม่สามารถโหลดผลการประเมินได้'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  // หัวข้อคะแนนย่อยทั้งหมดที่ใช้อยู่ ณ ปัจจุบัน (มาจาก criteriaAverages ของ summary — ทุกคอร์สใช้ชุดหัวข้อเดียวกัน
  // คือหัวข้อที่เปิดใช้งานอยู่ตอนคำนวณ) ใช้เป็นหัวคอลัมน์ตาราง
  const scoreFields = useMemo(() => {
    const withCriteria = summaries.find((s) => s.criteriaAverages?.length);
    return (withCriteria?.criteriaAverages || []).map((c) => ({ criteriaId: c.criteriaId, label: c.label }));
  }, [summaries]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return summaries;
    return summaries.filter((s) =>
      (s.courseName || '').toLowerCase().includes(kw) ||
      (s.teacherName || '').toLowerCase().includes(kw)
    );
  }, [summaries, keyword]);

  const overallStats = useMemo(() => {
    const totalCourses = summaries.length;
    const totalEvaluations = summaries.reduce((sum, s) => sum + (s.totalEvaluations || 0), 0);
    const weightedSum = summaries.reduce(
      (sum, s) => sum + (Number(s.averageRating) || 0) * (s.totalEvaluations || 0), 0
    );
    const overallAverage = totalEvaluations > 0 ? weightedSum / totalEvaluations : 0;
    return { totalCourses, totalEvaluations, overallAverage };
  }, [summaries]);

  function scoreFor(summary, criteriaId) {
    return summary.criteriaAverages?.find((c) => c.criteriaId === criteriaId)?.averageScore;
  }

  return (
    <div className="er-page">
      <div className="er-header">
        <div>
          <h1 className="er-title">ผลการประเมิน</h1>
          <p className="er-subtitle">ผลรวมของการประเมินคอร์สแต่ละคอร์สจากนักเรียน</p>
        </div>
        <div className="er-search-wrap">
          <input
            type="text" className="er-search-input" value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="ค้นหาคอร์สหรือผู้สอน..."
          />
        </div>
      </div>

      <div className="er-stats-grid">
        <div className="er-stat-card">
          <span className="er-stat-value">{loading ? '...' : overallStats.totalCourses}</span>
          <span className="er-stat-label">คอร์สที่มีผลประเมิน</span>
        </div>
        <div className="er-stat-card">
          <span className="er-stat-value">{loading ? '...' : overallStats.totalEvaluations}</span>
          <span className="er-stat-label">รีวิวทั้งหมด</span>
        </div>
        <div className="er-stat-card">
          <span className="er-stat-value">{loading ? '...' : `${overallStats.overallAverage.toFixed(1)} / 5`}</span>
          <span className="er-stat-label">คะแนนเฉลี่ยรวม (ถ่วงน้ำหนัก)</span>
        </div>
      </div>

      <div className="er-table-card">
        {loading && (
          <div className="er-state">
            <div className="er-spinner" />
            <span>กำลังโหลดข้อมูล...</span>
          </div>
        )}

        {!loading && error && (
          <div className="er-error-card">
            <p className="er-error-title">โหลดข้อมูลไม่สำเร็จ</p>
            <p className="er-error-msg">{error}</p>
            <button className="er-btn er-btn--ghost" onClick={load}>ลองใหม่</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="er-empty">
            <p className="er-empty-title">ยังไม่มีผลการประเมิน</p>
            <p className="er-empty-subtitle">
              {keyword ? `ไม่พบผลลัพธ์สำหรับ "${keyword}"` : 'เมื่อนักเรียนส่งการประเมินคอร์ส ผลรวมจะแสดงที่นี่'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="er-table-wrap">
            <table className="er-table">
              <thead>
                <tr>
                  <th>คอร์ส</th>
                  <th>ผู้สอน</th>
                  <th>จำนวนรีวิว</th>
                  <th>คะแนนเฉลี่ยรวม</th>
                  {scoreFields.map((field) => <th key={field.criteriaId}>{field.label}</th>)}
                  <th>รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.courseId} className="er-table-row">
                    <td className="er-text-name">{s.courseName || '—'}</td>
                    <td>{s.teacherName || '—'}</td>
                    <td>{s.totalEvaluations}</td>
                    <td>
                      <div className="er-overall-cell">
                        <Stars value={s.averageRating} />
                        <span>{formatScore(s.averageRating)}</span>
                      </div>
                    </td>
                    {scoreFields.map((field) => (
                      <td key={field.criteriaId}>{formatScore(scoreFor(s, field.criteriaId))}</td>
                    ))}
                    <td>
                      <button className="er-row-btn" onClick={() => setDetailCourse(s)}>
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailCourse && (
        <DetailModal
          course={detailCourse}
          onClose={() => setDetailCourse(null)}
        />
      )}
    </div>
  );
}
