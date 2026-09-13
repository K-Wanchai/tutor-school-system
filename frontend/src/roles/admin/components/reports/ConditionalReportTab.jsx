import { useEffect, useState } from 'react';
import CalendarDateInput from '../../../../shared/components/CalendarDateInput';
import { getStudents } from '../../services/adminStudentService';

function asList(pageOrArray) {
  if (Array.isArray(pageOrArray)) return pageOrArray;
  return pageOrArray?.content || [];
}

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
  const [filters, setFilters] = useState({ category: '', dateFrom: '', dateTo: '', specific: '' });
  const [students, setStudents] = useState([]);

  function fld(name, value) {
    setFilters((f) => ({ ...f, [name]: value }));
  }

  function changeCategory(value) {
    setFilters((f) => ({ ...f, category: value, specific: '' }));
  }

  // ตัวกรองเฉพาะทางของ "ข้อมูลนักเรียน" — โหลดรายชื่อนักเรียนแบบ lazy ตอนเลือกหมวดนี้ครั้งแรกเท่านั้น
  useEffect(() => {
    if (filters.category !== 'STUDENT' || students.length > 0) return;
    let mounted = true;
    getStudents({ page: 0, size: 5000 })
      .then((data) => { if (mounted) setStudents(asList(data)); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [filters.category, students.length]);

  const specificOptions = filters.category === 'STUDENT'
    ? students.map((s) => ({ value: s.id, label: `${s.fullName} (${s.studentCode})` }))
    : [];

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
          <label>ข้อมูลหลัก</label>
          <select value={filters.category} onChange={(e) => changeCategory(e.target.value)}>
            <option value="">เลือกประเภทข้อมูล</option>
            {DATA_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        {/* ตัวกรองเฉพาะทาง — ตัวเลือกเปลี่ยนตาม "ข้อมูลหลัก" ที่เลือก ตอนนี้รองรับเฉพาะข้อมูลนักเรียน */}
        <div className="ar-filter-field">
          <label>ตัวกรองเฉพาะทาง</label>
          <select value={filters.specific} onChange={(e) => fld('specific', e.target.value)}>
            <option value="">ทั้งหมด</option>
            {specificOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="ar-empty">กำลังพัฒนา</p>
    </div>
  );
}
