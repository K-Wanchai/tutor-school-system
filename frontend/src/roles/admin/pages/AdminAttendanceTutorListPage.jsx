import { useEffect, useMemo, useState } from 'react';
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

function tutorFullName(t) {
  return t.fullName || `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'ไม่ระบุชื่อ';
}

const PAGE_SIZE = 12;

export default function AdminAttendanceTutorListPage() {
  const navigate = useNavigate();
  const [allTutors, setAllTutors] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getTutors({ page: 0, size: 1000 })
      .then((data) => {
        if (!active) return;
        setAllTutors(Array.isArray(data) ? data : (data?.content ?? []));
        setError('');
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return allTutors;
    return allTutors.filter((t) =>
      [tutorFullName(t), t.tutorCode, t.email, t.username, t.phoneNumber]
        .some((v) => String(v || '').toLowerCase().includes(kw))
    );
  }, [allTutors, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    const nums = [];
    const MAX = 5;
    let start = Math.max(0, currentPage - 2);
    const end = Math.min(totalPages - 1, start + MAX - 1);
    if (end - start < MAX - 1) start = Math.max(0, end - MAX + 1);
    for (let i = start; i <= end; i += 1) nums.push(i);
    return nums;
  }, [currentPage, totalPages]);

  return (
    <div className="aes-page">
      <div className="aes-header">
        <div>
          <h1>การเข้าเรียน</h1>
          <p>เลือกติวเตอร์เพื่อดูคอร์สและการเข้าเรียนของนักเรียนในแต่ละคาบ (ดูได้อย่างเดียว)</p>
        </div>
      </div>

      <div className="aes-toolbar">
        <input
          type="text"
          placeholder="ค้นหาชื่อ, รหัสติวเตอร์, email, เบอร์โทร..."
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
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
      ) : filtered.length === 0 ? (
        <div className="aes-empty">
          {keyword ? `ไม่พบติวเตอร์สำหรับ "${keyword}"` : 'ยังไม่มีติวเตอร์ในระบบ'}
        </div>
      ) : (
        <>
          <div className="aes-grid">
            {visible.map((tutor) => (
              <button
                key={tutor.id}
                type="button"
                className="aes-tutor-card"
                onClick={() => navigate(`/admin/attendance/tutors/${tutor.id}`)}
              >
                <div
                  className="aes-avatar"
                  style={{ background: avatarColor(tutor.firstName || tutor.fullName || '') }}
                >
                  {initials(tutor.firstName, tutor.lastName)}
                </div>
                <div className="aes-tutor-info">
                  <h2>{tutorFullName(tutor)}</h2>
                  <span className="aes-tutor-code">{tutor.tutorCode || '—'}</span>
                  <span className="aes-tutor-email">{tutor.email || '—'}</span>
                </div>
                <span className="aes-card-cta">ดูการเข้าเรียน →</span>
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="aes-pagination">
              <span>หน้า {currentPage + 1} จาก {totalPages} · ทั้งหมด {filtered.length} คน</span>
              <div className="aes-pagination-controls">
                <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>‹</button>
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={p === currentPage ? 'aes-page-active' : ''}
                    onClick={() => setPage(p)}
                  >
                    {p + 1}
                  </button>
                ))}
                <button type="button" disabled={currentPage >= totalPages - 1} onClick={() => setPage(currentPage + 1)}>›</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
