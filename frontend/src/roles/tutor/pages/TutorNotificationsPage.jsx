import { useCallback, useEffect, useState } from 'react';
import { getMyNotifications } from '../services/tutorNotificationService';
import './TutorNotificationsPage.css';

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDate(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr  = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1)  return 'เมื่อกี้';
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  if (diffHr  < 24) return `${diffHr} ชั่วโมงที่แล้ว`;
  if (diffDay < 7)  return `${diffDay} วันที่แล้ว`;
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatFull(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('th-TH', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const TYPE_CONFIG = {
  COURSE_ASSIGNED: {
    label: 'มอบหมายคอร์ส',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    accent: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ede9fe',
  },
  PAYMENT: {
    label: 'ชำระเงิน',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    accent: '#059669',
    bg: '#f0fdf4',
    border: '#d1fae5',
  },
  ENROLLMENT: {
    label: 'ลงทะเบียน',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
      </svg>
    ),
    accent: '#2563eb',
    bg: '#eff6ff',
    border: '#dbeafe',
  },
};

function typeConfig(type) {
  return TYPE_CONFIG[type] || {
    label: 'ระบบ',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9m-6 13a2 2 0 01-2-2h4a2 2 0 01-2 2" />
      </svg>
    ),
    accent: '#6b7280',
    bg: '#f9fafb',
    border: '#f3f4f6',
  };
}

const DELIVERY_BADGE = {
  SENT:    { label: 'ส่งสำเร็จ',    cls: 'tn-chip-sent' },
  FAILED:  { label: 'ส่งไม่สำเร็จ', cls: 'tn-chip-failed' },
  PENDING: { label: 'รอส่ง',         cls: 'tn-chip-pending' },
};

function DeliveryChip({ status }) {
  const m = DELIVERY_BADGE[status] || { label: status, cls: '' };
  return <span className={`tn-chip ${m.cls}`}>{m.label}</span>;
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ notif, onClose }) {
  const cfg = typeConfig(notif.notificationType);
  return (
    <div className="tn-overlay" onClick={onClose}>
      <div className="tn-modal" onClick={e => e.stopPropagation()}>

        {/* modal header strip */}
        <div className="tn-modal-strip" style={{ background: cfg.accent }} />

        <div className="tn-modal-inner">
          <button className="tn-modal-x" onClick={onClose} aria-label="ปิด">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* icon + type */}
          <div className="tn-modal-type-row">
            <span className="tn-modal-type-icon" style={{ background: cfg.bg, color: cfg.accent, border: `1px solid ${cfg.border}` }}>
              {cfg.icon}
            </span>
            <span className="tn-modal-type-label" style={{ color: cfg.accent }}>{cfg.label}</span>
            <DeliveryChip status={notif.deliveryStatus} />
          </div>

          <h2 className="tn-modal-subject">{notif.subject}</h2>

          <div className="tn-modal-meta-row">
            <span className="tn-modal-meta-item">
              <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
              {formatFull(notif.createdAt)}
            </span>
            {notif.sentAt && (
              <span className="tn-modal-meta-item">
                <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h2v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                ส่งเมื่อ {formatFull(notif.sentAt)}
              </span>
            )}
          </div>

          <div className="tn-modal-divider" />
          <pre className="tn-modal-body-text">{notif.message}</pre>
        </div>
      </div>
    </div>
  );
}

// ── Notification Card ─────────────────────────────────────────────────────────

function NotifCard({ notif, onClick }) {
  const cfg = typeConfig(notif.notificationType);
  return (
    <div
      className="tn-card"
      style={{ borderLeft: `4px solid ${cfg.accent}` }}
      onClick={() => onClick(notif)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(notif)}
    >
      <div className="tn-card-icon" style={{ background: cfg.bg, color: cfg.accent }}>
        {cfg.icon}
      </div>

      <div className="tn-card-content">
        <div className="tn-card-header-row">
          <span className="tn-card-type" style={{ color: cfg.accent }}>{cfg.label}</span>
          <DeliveryChip status={notif.deliveryStatus} />
          <span className="tn-card-time">{formatDate(notif.createdAt)}</span>
        </div>
        <p className="tn-card-subject">{notif.subject}</p>
        <p className="tn-card-preview">{notif.message}</p>
      </div>

      <div className="tn-card-arrow">
        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const FILTERS = [
  { key: 'ALL',            label: 'ทั้งหมด' },
  { key: 'COURSE_ASSIGNED', label: 'คอร์ส' },
];

export default function TutorNotificationsPage() {
  const [notifs, setNotifs]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [detail, setDetail]         = useState(null);
  const [activeFilter, setFilter]   = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyNotifications();
      setNotifs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = activeFilter === 'ALL'
    ? notifs
    : notifs.filter(n => n.notificationType === activeFilter);

  const counts = {
    ALL:            notifs.length,
    COURSE_ASSIGNED: notifs.filter(n => n.notificationType === 'COURSE_ASSIGNED').length,
  };

  return (
    <div className="tn-page">

      {/* ── Page header ── */}
      <div className="tn-page-header">
        <div className="tn-page-header-text">
          <h1>การแจ้งเตือน</h1>
          <p>ติดตามการมอบหมายคอร์สและการแจ้งเตือนจากระบบ</p>
        </div>
        <button className="tn-refresh-btn" onClick={load} disabled={loading}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15"
            style={{ animation: loading ? 'tn-spin 1s linear infinite' : 'none' }}>
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          รีเฟรช
        </button>
      </div>

      {/* ── Summary cards ── */}
      <div className="tn-summary-row">
        <div className="tn-summary-card">
          <div className="tn-summary-num">{notifs.length}</div>
          <div className="tn-summary-label">การแจ้งเตือนทั้งหมด</div>
        </div>
        <div className="tn-summary-card tn-summary-card--purple">
          <div className="tn-summary-num">{counts.COURSE_ASSIGNED}</div>
          <div className="tn-summary-label">มอบหมายคอร์ส</div>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="tn-tabs">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`tn-tab${activeFilter === f.key ? ' tn-tab--active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="tn-tab-count">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="tn-state-box">
          <div className="tn-spinner" />
          <p>กำลังโหลดการแจ้งเตือน...</p>
        </div>
      ) : error ? (
        <div className="tn-state-box tn-state-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error}</p>
          <button onClick={load}>ลองใหม่อีกครั้ง</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="tn-state-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="56" height="56" style={{ color: '#d1d5db' }}>
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9m-6 13a2 2 0 01-2-2h4a2 2 0 01-2 2" />
          </svg>
          <h3>ไม่มีการแจ้งเตือน</h3>
          <p>เมื่อแอดมินมอบหมายคอร์สให้คุณ การแจ้งเตือนจะปรากฏที่นี่</p>
        </div>
      ) : (
        <div className="tn-list">
          {filtered.map(n => (
            <NotifCard key={n.id} notif={n} onClick={setDetail} />
          ))}
        </div>
      )}

      {detail && <DetailModal notif={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
