import { useState } from 'react';
import CalendarDateInput from '../../../../shared/components/CalendarDateInput';
import { getExamPerformanceReport, exportExamPerformanceReport } from '../../services/adminReportService';
import useReportLookups from './useReportLookups';

function formatNumber(value) {
  return Number(value || 0).toLocaleString('th-TH');
}

export default function ExamPerformanceReportTab() {
  const { courses, tutors } = useReportLookups();
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', courseId: '', tutorId: '' });
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
      const data = await getExamPerformanceReport(filters);
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
      await exportExamPerformanceReport(filters);
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
          <label>วันที่สอบ (เริ่มต้น)</label>
          <CalendarDateInput value={filters.dateFrom} onChange={(v) => fld('dateFrom', v)} />
        </div>
        <div className="ar-filter-field">
          <label>วันที่สอบ (สิ้นสุด)</label>
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
          <label>ติวเตอร์</label>
          <select value={filters.tutorId} onChange={(e) => fld('tutorId', e.target.value)}>
            <option value="">ทั้งหมด</option>
            {tutors.map((t) => (
              <option key={t.id} value={t.id}>{`${t.firstName || ''} ${t.lastName || ''}`.trim()}</option>
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
        <p className="ar-empty">เลือกเงื่อนไขแล้วกด "ค้นหา" เพื่อดูรายงาน (สรุปเป็นรายคอร์ส)</p>
      )}

      {report && (
        <section className="ar-card">
          <div className="ar-table-wrap">
            <table className="ar-table">
              <thead>
                <tr>
                  <th>คอร์ส</th>
                  <th>ติวเตอร์</th>
                  <th className="ar-num">จำนวนข้อสอบ</th>
                  <th className="ar-num">จำนวนฉบับที่ส่ง</th>
                  <th className="ar-num">จำนวนผู้สอบ</th>
                  <th className="ar-num">คะแนนเฉลี่ย</th>
                  <th className="ar-num">อัตราผ่าน</th>
                </tr>
              </thead>
              <tbody>
                {(report.items || []).length === 0 ? (
                  <tr><td colSpan={7} className="ar-empty">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</td></tr>
                ) : (
                  report.items.map((i) => (
                    <tr key={i.courseId}>
                      <td>
                        <strong>{i.courseName || '-'}</strong>
                        <span className="ar-code">{i.courseCode || ''}</span>
                      </td>
                      <td>{i.tutorName || '-'}</td>
                      <td className="ar-num">{formatNumber(i.examCount)}</td>
                      <td className="ar-num">{formatNumber(i.submissionCount)}</td>
                      <td className="ar-num">{formatNumber(i.studentCount)}</td>
                      <td className="ar-num">{i.averageScorePercent != null ? `${i.averageScorePercent}%` : '-'}</td>
                      <td className="ar-num">{i.passRate != null ? `${i.passRate}%` : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
