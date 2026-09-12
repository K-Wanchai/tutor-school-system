import { useEffect, useMemo, useState } from 'react';
import { getOverviewReport } from '../services/adminReportService';
import {
  statusLabelTH,
  COURSE_STATUS_TH,
  ENROLLMENT_STATUS_TH,
  ATTENDANCE_STATUS_TH,
} from '../../../shared/utils/statusLabels';
import RevenueReportTab from '../components/reports/RevenueReportTab';
import EnrollmentReportTab from '../components/reports/EnrollmentReportTab';
import AttendanceReportTab from '../components/reports/AttendanceReportTab';
import ExamPerformanceReportTab from '../components/reports/ExamPerformanceReportTab';
import './AdminReportsPage.css';

const TABS = [
  { key: 'OVERVIEW', label: 'ภาพรวม' },
  { key: 'REVENUE', label: 'รายได้/การชำระเงิน' },
  { key: 'ENROLLMENT', label: 'การสมัครเรียน' },
  { key: 'ATTENDANCE', label: 'การเข้าเรียน' },
  { key: 'EXAM_PERFORMANCE', label: 'ผลสอบ/ผลงานติวเตอร์' },
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString('th-TH');
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('th-TH', { style: 'currency', currency: 'THB' });
}

function StatusBreakdown({ title, data, labelMap }) {
  const entries = Object.entries(data || {});
  const total = entries.reduce((sum, [, count]) => sum + Number(count || 0), 0);

  return (
    <section className="ar-card">
      <h2>{title}</h2>
      {entries.length === 0 ? (
        <p className="ar-empty">ยังไม่มีข้อมูล</p>
      ) : (
        <ul className="ar-breakdown">
          {entries
            .sort((a, b) => b[1] - a[1])
            .map(([status, count]) => {
              const percent = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <li key={status}>
                  <div className="ar-breakdown-head">
                    <span>{statusLabelTH(status, labelMap)}</span>
                    <strong>{formatNumber(count)}</strong>
                  </div>
                  <div className="ar-bar">
                    <span style={{ width: `${percent}%` }} />
                  </div>
                </li>
              );
            })}
        </ul>
      )}
    </section>
  );
}

function OverviewTab() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getOverviewReport();
      setReport(data);
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดรายงานได้');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('th-TH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    []
  );

  const summaryCards = report
    ? [
        { label: 'นักเรียนทั้งหมด', value: formatNumber(report.totalStudents) },
        { label: 'ติวเตอร์ทั้งหมด', value: formatNumber(report.totalTutors) },
        { label: 'คอร์สทั้งหมด', value: formatNumber(report.totalCourses) },
        { label: 'การสมัครเรียนทั้งหมด', value: formatNumber(report.totalEnrollments) },
        { label: 'รายได้ที่ยืนยันแล้ว', value: formatCurrency(report.totalRevenue) },
        { label: 'การชำระเงินรอตรวจสอบ', value: formatNumber(report.pendingPaymentVerifications) },
        { label: 'การประเมินคอร์ส', value: formatNumber(report.totalEvaluations) },
        {
          label: 'คะแนนประเมินเฉลี่ย',
          value: `${Number(report.averageRating || 0).toFixed(1)} / 5`,
        },
      ]
    : [];

  return (
    <>
      <div className="ar-header">
        <div>
          <h1>รายงานภาพรวม</h1>
          <p>{today}</p>
        </div>
        <button type="button" className="ar-refresh" onClick={load} disabled={loading}>
          {loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
        </button>
      </div>

      {loading && (
        <div className="ar-state">
          <div className="ar-spinner" />
          <p>กำลังโหลดรายงาน...</p>
        </div>
      )}

      {!loading && error && (
        <div className="ar-state ar-state--error">
          <p>{error}</p>
          <button type="button" onClick={load}>
            ลองใหม่อีกครั้ง
          </button>
        </div>
      )}

      {!loading && !error && report && (
        <>
          <section className="ar-summary-grid">
            {summaryCards.map((card) => (
              <article key={card.label} className="ar-summary-card">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </article>
            ))}
          </section>

          <div className="ar-grid">
            <StatusBreakdown
              title="คอร์สแยกตามสถานะ"
              data={report.coursesByStatus}
              labelMap={COURSE_STATUS_TH}
            />
            <StatusBreakdown
              title="การสมัครเรียนแยกตามสถานะ"
              data={report.enrollmentsByStatus}
              labelMap={ENROLLMENT_STATUS_TH}
            />
            <StatusBreakdown
              title="การเข้าเรียนแยกตามสถานะ"
              data={report.attendanceByStatus}
              labelMap={ATTENDANCE_STATUS_TH}
            />
          </div>

          <section className="ar-card">
            <h2>คอร์สยอดนิยม (ตามจำนวนผู้เรียน)</h2>
            {(report.topCourses || []).length === 0 ? (
              <p className="ar-empty">ยังไม่มีข้อมูลคอร์ส</p>
            ) : (
              <div className="ar-table-wrap">
                <table className="ar-table">
                  <thead>
                    <tr>
                      <th>คอร์ส</th>
                      <th>ติวเตอร์</th>
                      <th>สถานะ</th>
                      <th className="ar-num">ผู้เรียน</th>
                      <th className="ar-num">คะแนนเฉลี่ย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topCourses.map((course) => (
                      <tr key={course.courseId}>
                        <td>
                          <strong>{course.courseName}</strong>
                          <span className="ar-code">{course.courseCode || '-'}</span>
                        </td>
                        <td>{course.tutorName || '-'}</td>
                        <td>{statusLabelTH(course.status, COURSE_STATUS_TH)}</td>
                        <td className="ar-num">{formatNumber(course.enrolledCount)}</td>
                        <td className="ar-num">
                          {course.averageRating != null
                            ? Number(course.averageRating).toFixed(1)
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}

export default function AdminReportsPage() {
  const [tab, setTab] = useState('OVERVIEW');

  return (
    <div className="ar-page">
      {tab !== 'OVERVIEW' && (
        <div className="ar-header">
          <div>
            <h1>รายงาน</h1>
            <p>เลือกเงื่อนไขเพื่อเรียกดูรายงาน — export เป็น CSV ได้</p>
          </div>
        </div>
      )}

      <div className="ar-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`ar-tab-btn${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'OVERVIEW' && <OverviewTab />}
      {tab === 'REVENUE' && <RevenueReportTab />}
      {tab === 'ENROLLMENT' && <EnrollmentReportTab />}
      {tab === 'ATTENDANCE' && <AttendanceReportTab />}
      {tab === 'EXAM_PERFORMANCE' && <ExamPerformanceReportTab />}
    </div>
  );
}
