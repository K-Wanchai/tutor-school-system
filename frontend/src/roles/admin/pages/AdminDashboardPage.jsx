import { useState, useEffect } from 'react';
import DashboardCard from '../components/DashboardCard';
import RecentTable from '../components/RecentTable';
import { getDashboardStats } from '../services/adminDashboardService';
import './AdminDashboardPage.css';

function StatusBadge({ status }) {
  const MAP = {
    APPROVED:  'success',
    PENDING:   'warning',
    REJECTED:  'error',
    VERIFIED:  'success',
    CANCELLED: 'error',
    REFUNDED:  'default',
    PAID:      'success',
    OVERDUE:   'error',
  };
  const LABEL_TH = {
    APPROVED:  'ชำระเงินเรียบร้อยแล้ว',
    PENDING:   'รอดำเนินการ',
    REJECTED:  'ปฏิเสธ',
    VERIFIED:  'ยืนยันแล้ว',
    CANCELLED: 'ยกเลิก',
    REFUNDED:  'คืนเงินแล้ว',
    PAID:      'ชำระแล้ว',
    OVERDUE:   'เกินกำหนด',
  };
  const color = MAP[status] || 'default';
  const label = LABEL_TH[status] || status;
  return <span className={`dashboard-status-badge dashboard-status-badge--${color}`}>{label}</span>;
}

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatAmount(amount) {
  if (amount == null) return '—';
  return Number(amount).toLocaleString('th-TH', { style: 'currency', currency: 'THB' });
}

const ENROLLMENT_COLUMNS = [
  { key: 'studentName', label: 'นักเรียน' },
  { key: 'courseName',  label: 'คอร์สเรียน' },
  { key: 'tutorName',   label: 'ติวเตอร์' },
  { key: 'enrollmentDate', label: 'วันที่สมัคร', render: (v) => formatDate(v) },
  { key: 'status', label: 'สถานะ', render: (v) => <StatusBadge status={v} /> },
];

const PAYMENT_COLUMNS = [
  { key: 'studentName',  label: 'นักเรียน' },
  { key: 'courseName',   label: 'คอร์สเรียน' },
  { key: 'amount',       label: 'จำนวนเงิน', render: (v) => formatAmount(v) },
  { key: 'paymentDate',  label: 'วันที่ชำระ',  render: (v) => formatDate(v) },
  { key: 'paymentStatus', label: 'สถานะ', render: (v) => <StatusBadge status={v} /> },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err.message || 'ไม่สามารถโหลดข้อมูล Dashboard ได้'))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('th-TH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <div>
          <h1 className="admin-dashboard-title">แดชบอร์ดผู้ดูแลระบบ</h1>
          <p className="admin-dashboard-date">{today}</p>
        </div>
        <div className="admin-dashboard-welcome">
          <span>ยินดีต้อนรับ, </span>
          <strong>ผู้ดูแลระบบ</strong>
        </div>
      </div>

      {loading && (
        <div className="admin-dashboard-loading">
          <div className="admin-dashboard-spinner"></div>
          <span>กำลังโหลดข้อมูล...</span>
        </div>
      )}

      {error && (
        <div className="admin-dashboard-error">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && stats && (
        <>
          <div className="admin-dashboard-cards">
            <DashboardCard
              title="นักเรียนทั้งหมด"
              value={stats.totalStudents ?? 0}
              subtitle="ผู้เรียนที่ลงทะเบียน"
              color="blue"
              icon={
                <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              }
            />
            <DashboardCard
              title="ติวเตอร์ทั้งหมด"
              value={stats.totalTutors ?? 0}
              subtitle="บุคลากรการสอน"
              color="purple"
              icon={
                <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              }
            />
            <DashboardCard
              title="คอร์สทั้งหมด"
              value={stats.totalCourses ?? 0}
              subtitle="คอร์สที่เปิดสอน"
              color="green"
              icon={
                <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              }
            />
            <DashboardCard
              title="การสมัครเรียนทั้งหมด"
              value={stats.totalEnrollments ?? 0}
              subtitle="ภาคการศึกษานี้"
              color="teal"
              icon={
                <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              }
            />
            <DashboardCard
              title="การชำระเงินรอตรวจสอบ"
              value={stats.pendingPayments ?? 0}
              subtitle="รอการยืนยัน"
              color="orange"
              icon={
                <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
              }
            />
          </div>

          <div className="admin-dashboard-tables">
            <div className="admin-dashboard-table-col">
              <RecentTable
                title="รายการสมัครเรียนล่าสุด"
                columns={ENROLLMENT_COLUMNS}
                rows={stats.recentEnrollments ?? []}
                emptyText="ยังไม่มีการสมัครเรียน"
              />
            </div>
            <div className="admin-dashboard-table-col">
              <RecentTable
                title="รายการชำระเงินล่าสุด"
                columns={PAYMENT_COLUMNS}
                rows={stats.recentPayments ?? []}
                emptyText="ยังไม่มีรายการชำระเงิน"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
