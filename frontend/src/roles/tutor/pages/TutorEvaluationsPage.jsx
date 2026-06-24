import { useEffect, useMemo, useState } from 'react';
import { getTutorEvaluations } from '../services/tutorEvaluationService';
import './TutorEvaluationsPage.css';

export default function TutorEvaluationsPage() {
  const [evaluations, setEvaluations] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvaluations();
  }, []);

  async function loadEvaluations() {
    try {
      setLoading(true);
      const data = await getTutorEvaluations();
      setEvaluations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Load tutor evaluations error:', error);
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredEvaluations = useMemo(() => {
    let result = evaluations.filter((item) => {
      const text = `
        ${item.studentName || ''}
        ${item.courseName || ''}
        ${item.comment || ''}
      `.toLowerCase();

      const rating = Number(item.rating || 0);

      const matchKeyword = text.includes(keyword.toLowerCase());
      const matchRating =
        ratingFilter === 'ALL' || rating === Number(ratingFilter);

      return matchKeyword && matchRating;
    });

    if (sortBy === 'HIGHEST') {
      result = [...result].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    if (sortBy === 'LOWEST') {
      result = [...result].sort((a, b) => Number(a.rating || 0) - Number(b.rating || 0));
    }

    if (sortBy === 'NEWEST') {
      result = [...result].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    }

    return result;
  }, [evaluations, keyword, ratingFilter, sortBy]);

  const summary = useMemo(() => {
    const total = evaluations.length;
    const totalRating = evaluations.reduce(
      (sum, item) => sum + Number(item.rating || 0),
      0
    );

    const average = total > 0 ? totalRating / total : 0;

    const ratingCount = {
      5: evaluations.filter((item) => Number(item.rating) === 5).length,
      4: evaluations.filter((item) => Number(item.rating) === 4).length,
      3: evaluations.filter((item) => Number(item.rating) === 3).length,
      2: evaluations.filter((item) => Number(item.rating) === 2).length,
      1: evaluations.filter((item) => Number(item.rating) === 1).length,
    };

    const positive = evaluations.filter((item) => Number(item.rating || 0) >= 4).length;
    const needImprove = evaluations.filter((item) => Number(item.rating || 0) <= 3).length;

    return {
      total,
      average: average.toFixed(1),
      ratingCount,
      positive,
      needImprove,
      satisfactionRate: total > 0 ? Math.round((positive / total) * 100) : 0,
    };
  }, [evaluations]);

  return (
    <div className="tutor-eval-page">
      <section className="tutor-eval-top">
        <div className="tutor-eval-heading">
          <span>TEACHING QUALITY INSIGHT</span>
          <h1>การประเมินการสอน</h1>
          <p>วิเคราะห์คะแนน ความคิดเห็น และความพึงพอใจของนักเรียนจากฐานข้อมูลจริง</p>
        </div>

        <button className="tutor-eval-refresh-btn" onClick={loadEvaluations}>
          รีเฟรชข้อมูล
        </button>
      </section>

      <section className="tutor-eval-insight-grid">
        <div className="tutor-eval-score-panel">
          <div className="tutor-eval-score-circle">
            <strong>{summary.average}</strong>
            <span>/ 5</span>
          </div>

          <h2>{getScoreLabel(summary.average)}</h2>
          <p>คะแนนเฉลี่ยจากนักเรียนทั้งหมด</p>

          <div className="tutor-eval-score-meta">
            <div>
              <strong>{summary.total}</strong>
              <span>รีวิวทั้งหมด</span>
            </div>
            <div>
              <strong>{summary.satisfactionRate}%</strong>
              <span>ความพึงพอใจ</span>
            </div>
          </div>
        </div>

        <div className="tutor-eval-distribution-panel">
          <div className="tutor-eval-panel-head">
            <h2>การกระจายคะแนน</h2>
            <span>Rating Breakdown</span>
          </div>

          {[5, 4, 3, 2, 1].map((star) => (
            <RatingBar
              key={star}
              star={star}
              count={summary.ratingCount[star]}
              total={summary.total}
            />
          ))}
        </div>

        <div className="tutor-eval-health-panel">
          <div className="tutor-eval-mini-card positive">
            <span>รีวิวเชิงบวก</span>
            <strong>{summary.positive}</strong>
            <p>คะแนน 4-5 ดาว</p>
          </div>

          <div className="tutor-eval-mini-card warning">
            <span>ควรปรับปรุง</span>
            <strong>{summary.needImprove}</strong>
            <p>คะแนน 1-3 ดาว</p>
          </div>
        </div>
      </section>

      <section className="tutor-eval-control-panel">
        <div className="tutor-eval-search">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="ค้นหาชื่อนักเรียน คอร์ส หรือความคิดเห็น..."
          />
        </div>

        <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
          <option value="ALL">ทุกคะแนน</option>
          <option value="5">5 ดาว</option>
          <option value="4">4 ดาว</option>
          <option value="3">3 ดาว</option>
          <option value="2">2 ดาว</option>
          <option value="1">1 ดาว</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="NEWEST">ล่าสุด</option>
          <option value="HIGHEST">คะแนนสูงสุด</option>
          <option value="LOWEST">คะแนนต่ำสุด</option>
        </select>
      </section>

      <section className="tutor-eval-review-section">
        <div className="tutor-eval-section-head">
          <div>
            <h2>เสียงสะท้อนจากนักเรียน</h2>
            <p>ความคิดเห็นจริงจากผู้เรียนในแต่ละคอร์ส</p>
          </div>

          <span>{filteredEvaluations.length} รายการ</span>
        </div>

        {loading ? (
          <div className="tutor-eval-empty">กำลังโหลดผลการประเมิน...</div>
        ) : filteredEvaluations.length === 0 ? (
          <div className="tutor-eval-empty">
            <h3>ยังไม่มีผลการประเมิน</h3>
            <p>ถ้ามีข้อมูลในฐานข้อมูลแล้ว ให้ตรวจสอบ tutorId และ API /course-evaluations/tutor/&#123;tutorId&#125;</p>
          </div>
        ) : (
          <div className="tutor-eval-timeline">
            {filteredEvaluations.map((item, index) => (
              <EvaluationTimelineCard key={item.id || index} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RatingBar({ star, count, total }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="tutor-eval-rating-row">
      <div className="tutor-eval-rating-label">
        <span>{star}</span>
        <b>★</b>
      </div>

      <div className="tutor-eval-rating-track">
        <div style={{ width: `${percent}%` }} />
      </div>

      <strong>{count}</strong>
    </div>
  );
}

function EvaluationTimelineCard({ item }) {
  const rating = Number(item.rating || 0);

  return (
    <article className="tutor-eval-review-card">
      <div className="tutor-eval-review-line" />

      <div className="tutor-eval-review-avatar">
        {(item.studentName || 'S').charAt(0)}
      </div>

      <div className="tutor-eval-review-content">
        <div className="tutor-eval-review-head">
          <div>
            <h3>{item.studentName || 'นักเรียน'}</h3>
            <p>{item.courseName || 'ไม่ระบุคอร์ส'} · {formatDate(item.createdAt)}</p>
          </div>

          <div className={`tutor-eval-rating-badge ${getRatingClass(rating)}`}>
            ★ {rating || 0}
          </div>
        </div>

        <blockquote>
          {item.comment || 'ไม่มีความคิดเห็นเพิ่มเติม'}
        </blockquote>

        <div className="tutor-eval-review-footer">
          <span>{getRatingLabel(rating)}</span>
          <small>{getSuggestionText(rating)}</small>
        </div>
      </div>
    </article>
  );
}

function formatDate(value) {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getScoreLabel(value) {
  const score = Number(value);

  if (score >= 4.5) return 'คุณภาพยอดเยี่ยม';
  if (score >= 4) return 'คุณภาพดีมาก';
  if (score >= 3) return 'คุณภาพปานกลาง';
  if (score > 0) return 'ควรปรับปรุง';
  return 'ยังไม่มีข้อมูล';
}

function getRatingLabel(value) {
  if (value >= 5) return 'ยอดเยี่ยม';
  if (value >= 4) return 'ดีมาก';
  if (value >= 3) return 'พอใช้';
  if (value >= 2) return 'ควรปรับปรุง';
  return 'ต้องติดตาม';
}

function getSuggestionText(value) {
  if (value >= 5) return 'รักษามาตรฐานการสอนนี้ต่อไป';
  if (value >= 4) return 'ผลตอบรับดี มีจุดให้พัฒนาต่อได้';
  if (value >= 3) return 'ควรดูความคิดเห็นเพื่อปรับการสอน';
  return 'ควรติดตามและปรับปรุงอย่างจริงจัง';
}

function getRatingClass(value) {
  if (value >= 4) return 'good';
  if (value >= 3) return 'normal';
  return 'bad';
}