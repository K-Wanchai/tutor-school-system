import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTutors } from '../services/adminTutorService';
import './AdminExamPages.css';

const AVATAR_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706',
  '#dc2626', '#0891b2', '#9333ea', '#c2410c',
];

function avatarColor(name = '') {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function initials(firstName = '', lastName = '') {
  return `${(firstName[0] || '')}${(lastName[0] || '')}`.toUpperCase() || '?';
}

const PAGE_SIZE = 12;

export default function AdminExamTutorListPage() {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debounce = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getTutors({ page, size: PAGE_SIZE, keyword })
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data)) {
          setTutors(data);
          setTotalPages(1);
          setTotalElements(data.length);
        } else {
          setTutors(data?.content ?? []);
          setTotalPages(data?.totalPages ?? 1);
          setTotalElements(data?.totalElements ?? 0);
        }
        setError('');
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, keyword]);

  function handleSearch(e) {
    const val = e.target.value;
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setPage(0);
      setKeyword(val);
    }, 400);
  }

  const pageNumbers = useMemo(() => {
    const nums = [];
    const MAX = 5;
    let start = Math.max(0, page - 2);
    const end = Math.min(totalPages - 1, start + MAX - 1);
    if (end - start < MAX - 1) start = Math.max(0, end - MAX + 1);
    for (let i = start; i <= end; i += 1) nums.push(i);
    return nums;
  }, [page, totalPages]);

  return (
    <div className="aes-page">
      <div className="aes-header">
        <div>
          <h1>ข้อสอบ</h1>
          <p>เลือกติวเตอร์เพื่อดูคอร์สและคะแนนสอบของนักเรียนในแต่ละคอร์ส (ดูได้อย่างเดียว)</p>
        </div>
      </div>

      <div className="aes-toolbar">
        <input
          type="text"
          placeholder="ค้นหาชื่อ, รหัสติวเตอร์, email..."
          defaultValue={keyword}
          onChange={handleSearch}
        />
      </div>

      {error && (
        <div className="aes-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="aes-empty">กำลังโหลดติวเตอร์...</div>
      ) : tutors.length === 0 ? (
        <div className="aes-empty">
          {keyword ? `ไม่พบติวเตอร์สำหรับ "${keyword}"` : 'ยังไม่มีติวเตอร์ในระบบ'}
        </div>
      ) : (
        <>
          <div className="aes-grid">
            {tutors.map((tutor) => (
              <button
                key={tutor.id}
                type="button"
                className="aes-tutor-card"
                onClick={() => navigate(`/admin/exams/tutors/${tutor.id}`)}
              >
                <div
                  className="aes-avatar"
                  style={{ background: avatarColor(tutor.firstName || tutor.fullName || '') }}
                >
                  {initials(tutor.firstName, tutor.lastName)}
                </div>
                <div className="aes-tutor-info">
                  <h2>{tutor.fullName || `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim() || 'ไม่ระบุชื่อ'}</h2>
                  <span className="aes-tutor-code">{tutor.tutorCode || '—'}</span>
                  <span className="aes-tutor-email">{tutor.email || '—'}</span>
                </div>
                <span className="aes-card-cta">ดูคะแนนสอบ →</span>
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="aes-pagination">
              <span>หน้า {page + 1} จาก {totalPages} · ทั้งหมด {totalElements} คน</span>
              <div className="aes-pagination-controls">
                <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</button>
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={p === page ? 'aes-page-active' : ''}
                    onClick={() => setPage(p)}
                  >
                    {p + 1}
                  </button>
                ))}
                <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>›</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
