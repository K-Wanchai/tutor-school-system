import { useState } from 'react';
import CalendarDateInput from '../../../../shared/components/CalendarDateInput';
import { getRevenueReport, exportRevenueReport } from '../../services/adminReportService';
import { statusLabelTH, PAYMENT_STATUS_TH } from '../../../../shared/utils/statusLabels';
import useReportLookups from './useReportLookups';

const STATUS_OPTIONS = ['PENDING', 'VERIFIED', 'REJECTED', 'CANCELLED'];

function formatNumber(value) {
  return Number(value || 0).toLocaleString('th-TH');
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('th-TH', { style: 'currency', currency: 'THB' });
}

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function RevenueReportTab() {
  const { courses } = useReportLookups();
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', courseId: '', status: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  function fld(name, value) {
    setFilters((f) => ({ ...f, [name]: value }));
  }

  async function handleSearch() {
    setLoading(true);
    setError('');
    try {
      const data = await getRevenueReport(filters);
      setReport(data);
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดรายงานได้');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setError('');
    try {
      await exportRevenueReport(filters);
    } catch (err) {
      setError(err.message || 'ไม่สามารถ export ได้');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="ar-page">
      <div className="ar-filter-bar">
        <div className="ar-filter-field">
          <label>วันที่เริ่มต้น</label>
          <CalendarDateInput value={filters.dateFrom} onChange={(v) => fld('dateFrom', v)} />
        </div>
        <div className="ar-filter-field">
          <label>วันที่สิ้นสุด</label>
          <CalendarDateInput value={filters.dateTo} onChange={(v) => fld('dateTo', v)} />
        </div>
        <div className="ar-filter-field">
          <label>คอร์ส</label>
          <select value={filters.courseId} onChange={(e) => fld('courseId', e.target.value)}>
            <option value="">ทั้งหมด</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.courseName}</option>
            ))}
          </select>
        </div>
        <div className="ar-filter-field">
          <label>สถานะการชำระเงิน</label>
          <select value={filters.status} onChange={(e) => fld('status', e.target.value)}>
            <option value="">ทั้งหมด</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{statusLabelTH(s, PAYMENT_STATUS_TH)}</option>
            ))}
          </select>
        </div>
        <div className="ar-filter-actions">
          <button type="button" className="ar-btn-search" onClick={handleSearch} disabled={loading}>
            {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
          </button>
          <button type="button" className="ar-btn-export" onClick={handleExport} disabled={exporting || !report}>
            {exporting ? 'กำลัง Export...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {error && (
        <div className="ar-state ar-state--error">
          <p>{error}</p>
        </div>
      )}

      {!error && !report && !loading && (
        <p className="ar-empty">เลือกเงื่อนไขแล้วกด "ค้นหา" เพื่อดูรายงาน</p>
      )}

      {report && (
        <>
          <div className="ar-summary-chips">
            <div className="ar-chip"><span>จำนวนรายการ</span><strong>{formatNumber(report.totalCount)}</strong></div>
            <div className="ar-chip"><span>ยอดรวมทั้งหมด</span><strong>{formatCurrency(report.totalAmount)}</strong></div>
            <div className="ar-chip"><span>ยืนยันแล้ว</span><strong>{formatCurrency(report.verifiedAmount)}</strong></div>
            <div className="ar-chip"><span>รอตรวจสอบ</span><strong>{formatCurrency(report.pendingAmount)}</strong></div>
          </div>

          <section className="ar-card">
            <div className="ar-table-wrap">
              <table className="ar-table">
                <thead>
                  <tr>
                    <th>วันที่</th>
                    <th>รหัสการชำระเงิน</th>
                    <th>นักเรียน</th>
                    <th>คอร์ส</th>
                    <th className="ar-num">ยอดชำระ</th>
                    <th>วิธีชำระ</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.items || []).length === 0 ? (
                    <tr><td colSpan={7} className="ar-empty">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</td></tr>
                  ) : (
                    report.items.map((i) => (
                      <tr key={i.paymentId}>
                        <td>{formatDateTime(i.paymentDate)}</td>
                        <td>{i.paymentCode || '-'}</td>
                        <td>
                          <strong>{i.studentName || '-'}</strong>
                          <span className="ar-code">{i.studentCode || ''}</span>
                        </td>
                        <td>
                          <strong>{i.courseName || '-'}</strong>
                          <span className="ar-code">{i.courseCode || ''}</span>
                        </td>
                        <td className="ar-num">{formatCurrency(i.amount)}</td>
                        <td>{i.paymentMethod || '-'}</td>
                        <td>{statusLabelTH(i.paymentStatus, PAYMENT_STATUS_TH)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
