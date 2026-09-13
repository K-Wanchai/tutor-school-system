import { useState } from 'react';
import CalendarDateInput from '../../../../shared/components/CalendarDateInput';

const DATA_CATEGORIES = [
  { key: 'STUDENT', label: 'ข้อมูลนักเรียน' },
  { key: 'INSTITUTION', label: 'ข้อมูลสถาบัน' },
  { key: 'EXAM_INSTITUTION', label: 'ข้อมูลสถาบันที่จัดสอบ' },
  { key: 'TUTOR', label: 'ข้อมูลติวเตอร์' },
  { key: 'COURSE', label: 'ข้อมูลคอร์สเรียน' },
  { key: 'ENROLLMENT', label: 'ข้อมูลสมัครเรียน' },
  { key: 'PAYMENT', label: 'ข้อมูลการชำระเงิน' },
  { key: 'ATTENDANCE', label: 'ข้อมูลการเข้าเรียน' },
  { key: 'EXAM_RESULT', label: 'ข้อมูลผลการสอบ' },
  { key: 'EVALUATION', label: 'ข้อมูลประเมินความพึงพอใจของคอร์สเรียน' },
  { key: 'ENTRANCE_EXAM_RESULT', label: 'ข้อมูลผลการสอบเข้า' },
];

export default function ConditionalReportTab() {
  const [filters, setFilters] = useState({ category: '', dateFrom: '', dateTo: '' });

  function fld(name, value) {
    setFilters((f) => ({ ...f, [name]: value }));
  }

  return (
    <div className="ar-page">
      <div className="ar-filter-bar">
        <div className="ar-filter-field">
          <label>ข้อมูลหลัก</label>
          <select value={filters.category} onChange={(e) => fld('category', e.target.value)}>
            <option value="">เลือกประเภทข้อมูล</option>
            {DATA_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
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
