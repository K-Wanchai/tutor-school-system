import { useState } from 'react';
import CalendarDateInput from '../../../../shared/components/CalendarDateInput';

export default function ConditionalReportTab() {
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '' });

  function fld(name, value) {
    setFilters((f) => ({ ...f, [name]: value }));
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
      </div>

      <p className="ar-empty">กำลังพัฒนา</p>
    </div>
  );
}
