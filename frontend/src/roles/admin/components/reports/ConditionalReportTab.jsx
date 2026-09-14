import { useEffect, useState } from 'react';
import CalendarDateInput from '../../../../shared/components/CalendarDateInput';
import { getStudents } from '../../services/adminStudentService';
import { getTutors } from '../../services/adminTutorService';
import { getCourses } from '../../services/adminCourseService';
import { getStudentReport, getTutorReport, getCourseReport, getEnrollmentReport, getPaymentStatusReport, getAttendanceReport } from '../../services/adminReportService';
import { getInstitutionProfile } from '../../../../shared/services/institutionService';
import { getExamInstitutions, getExamInstitutionById } from '../../services/examInstitutionService';
import { getFaculties, getMajors } from '../../services/academicFacultyService';
import { getVocationalMajors } from '../../services/vocationalMajorService';
import { getSchoolTracks } from '../../services/schoolTrackService';
import { statusLabelTH, COURSE_STATUS_TH, ENROLLMENT_STATUS_TH, PAYMENT_STATUS_TH, ATTENDANCE_STATUS_TH } from '../../../../shared/utils/statusLabels';
import { ENROLLMENT_HISTORY_STATUS_LABEL } from '../../../../shared/utils/enrollmentHistoryStatus';

const EDUCATION_LEVEL_TH = {
  LOWER_SECONDARY: 'มัธยมต้น',
  UPPER_SECONDARY: 'มัธยมปลาย',
  VOCATIONAL_DIPLOMA: 'ปวส.',
  BACHELOR: 'ปริญญาตรี',
};

const PAYMENT_METHOD_TH = {
  BANK_TRANSFER: 'โอนเงินผ่านธนาคาร',
  PROMPTPAY: 'พร้อมเพย์',
  CASH: 'เงินสด',
  CREDIT_CARD: 'บัตรเครดิต',
};

// "ข้อมูลการชำระเงิน" แสดงเฉพาะใบสมัครที่แอดมินตรวจสอบจบแล้ว — ชำระเงินเรียบร้อยแล้ว (APPROVED)
// หรือปฏิเสธ (REJECTED) เท่านั้น ไม่รวมรายการที่ยังรอตรวจสอบ/รอแก้ไขสลิป
const PAYMENT_DATA_STATUS_OPTIONS = ['APPROVED', 'REJECTED'];

// โหลดข้อมูลย่อยของสถาบันที่จัดสอบตามประเภท — มหาวิทยาลัย: คณะ > สาขา, ปวส.: สาขา, โรงเรียน: สายการเรียน/ห้องเรียน
async function loadInstitutionChildren(inst) {
  if (inst.institutionType === 'UNIVERSITY') {
    const faculties = asList(await getFaculties(inst.id));
    const facultiesWithMajors = await Promise.all(
      faculties.map(async (f) => ({ ...f, majors: asList(await getMajors(inst.id, f.id)) }))
    );
    return { ...inst, faculties: facultiesWithMajors };
  }
  if (inst.institutionType === 'VOCATIONAL_DIPLOMA') {
    return { ...inst, majors: asList(await getVocationalMajors(inst.id)) };
  }
  if (inst.institutionType === 'SECONDARY') {
    return { ...inst, tracks: asList(await getSchoolTracks(inst.id)) };
  }
  return inst;
}

function asList(pageOrArray) {
  if (Array.isArray(pageOrArray)) return pageOrArray;
  return pageOrArray?.content || [];
}

// A4 portrait 210mm หัก margin 10mm ทั้งสองข้าง (ดู @page ใน AdminReportsPage.css) แปลงเป็น px ที่ 96dpi
const PRINT_PAGE_WIDTH_PX = 190 * 3.7795275591;

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('th-TH', { style: 'currency', currency: 'THB' });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('th-TH');
}

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
  const [filters, setFilters] = useState({ category: '', dateFrom: '', dateTo: '', specific: '', faculty: '', status: '', courseId: '' });
  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [examInstitutions, setExamInstitutions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function fld(name, value) {
    setFilters((f) => ({ ...f, [name]: value }));
  }

  function changeCategory(value) {
    setFilters((f) => ({ ...f, category: value, specific: '', faculty: '', status: '', courseId: '' }));
    setReport(null);
    setError('');
  }

  function changeSpecific(value) {
    setFilters((f) => ({ ...f, specific: value, faculty: '' }));
  }

  // ตัวกรองเฉพาะทางของ "ข้อมูลนักเรียน"/"ข้อมูลสมัครเรียน"/"ข้อมูลการชำระเงิน" — โหลดรายชื่อนักเรียนแบบ lazy ตอนเลือกหมวดนี้ครั้งแรกเท่านั้น
  useEffect(() => {
    if (!['STUDENT', 'ENROLLMENT', 'PAYMENT', 'ATTENDANCE'].includes(filters.category) || students.length > 0) return;
    let mounted = true;
    getStudents({ page: 0, size: 5000 })
      .then((data) => { if (mounted) setStudents(asList(data)); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [filters.category, students.length]);

  // ตัวกรองเฉพาะทางของ "ข้อมูลติวเตอร์" — โหลดรายชื่อติวเตอร์แบบ lazy ตอนเลือกหมวดนี้ครั้งแรกเท่านั้น
  useEffect(() => {
    if (filters.category !== 'TUTOR' || tutors.length > 0) return;
    let mounted = true;
    getTutors({ page: 0, size: 5000 })
      .then((data) => { if (mounted) setTutors(asList(data)); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [filters.category, tutors.length]);

  // ตัวกรองเฉพาะทางของ "ข้อมูลคอร์สเรียน"/"ข้อมูลสมัครเรียน"/"ข้อมูลการชำระเงิน" — โหลดรายชื่อคอร์สแบบ lazy ตอนเลือกหมวดนี้ครั้งแรกเท่านั้น
  useEffect(() => {
    if (!['COURSE', 'ENROLLMENT', 'PAYMENT', 'ATTENDANCE'].includes(filters.category) || courses.length > 0) return;
    let mounted = true;
    getCourses({ page: 0, size: 5000 })
      .then((data) => { if (mounted) setCourses(asList(data)); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [filters.category, courses.length]);

  // ตัวกรองเฉพาะทางของ "ข้อมูลสถาบันที่จัดสอบ" — โหลดรายชื่อสถาบันแบบ lazy ตอนเลือกหมวดนี้ครั้งแรกเท่านั้น
  useEffect(() => {
    if (filters.category !== 'EXAM_INSTITUTION' || examInstitutions.length > 0) return;
    let mounted = true;
    getExamInstitutions({})
      .then((data) => { if (mounted) setExamInstitutions(asList(data)); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [filters.category, examInstitutions.length]);

  const specificOptions = ['STUDENT', 'ENROLLMENT', 'PAYMENT', 'ATTENDANCE'].includes(filters.category)
    ? students.map((s) => ({ value: s.id, label: `${s.fullName} (${s.studentCode})` }))
    : filters.category === 'TUTOR'
    ? tutors.map((t) => ({ value: t.id, label: `${t.firstName} ${t.lastName} (${t.tutorCode || ''})` }))
    : filters.category === 'COURSE'
    ? courses.map((c) => ({ value: c.id, label: `${c.courseName} (${c.courseCode || ''})` }))
    : filters.category === 'EXAM_INSTITUTION'
    ? examInstitutions.map((e) => ({ value: e.id, label: `${e.institutionName} (${e.institutionTypeLabel || ''})` }))
    : [];

  // ตัวกรอง "คณะ" ใช้ได้เฉพาะตอนเจาะจงสถาบันประเภทมหาวิทยาลัยเท่านั้น (ไม่มีคณะถ้าเลือก "ทั้งหมด")
  const selectedInstitution = examInstitutions.find((e) => String(e.id) === String(filters.specific));
  const isUniversitySpecific = filters.category === 'EXAM_INSTITUTION' && !!filters.specific
    && selectedInstitution?.institutionType === 'UNIVERSITY';

  useEffect(() => {
    if (!isUniversitySpecific) return;
    let mounted = true;
    getFaculties(filters.specific)
      .then((data) => { if (mounted) setFaculties(asList(data)); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [isUniversitySpecific, filters.specific]);

  const isSearchable = filters.category === 'STUDENT' || filters.category === 'TUTOR'
    || filters.category === 'COURSE' || filters.category === 'ENROLLMENT' || filters.category === 'PAYMENT'
    || filters.category === 'ATTENDANCE'
    || filters.category === 'INSTITUTION' || filters.category === 'EXAM_INSTITUTION';
  const hasSpecificFilter = filters.category === 'STUDENT' || filters.category === 'TUTOR'
    || filters.category === 'COURSE' || filters.category === 'ENROLLMENT' || filters.category === 'PAYMENT'
    || filters.category === 'ATTENDANCE'
    || filters.category === 'EXAM_INSTITUTION';
  const hasCourseFilter = filters.category === 'ENROLLMENT' || filters.category === 'PAYMENT'
    || filters.category === 'ATTENDANCE';

  // ต้องแสดงข้อมูลครบทุกตัวอักษรในบรรทัดเดียวตอนพิมพ์ ห้ามตัดขึ้นบรรทัดใหม่ — คำนวณ zoom
  // ให้ตารางย่อพอดีความกว้างหน้ากระดาษแทนการ wrap (ดู white-space: nowrap ใน AdminReportsPage.css)
  //
  // ความกว้างที่ใช้คำนวณต้องมาจากขนาดกระดาษจริง (A4 portrait หักขอบ 10mm ทั้งสองข้าง ดู @page
  // ใน AdminReportsPage.css) ไม่ใช่ area.clientWidth ของหน้าจอ — ตอน beforeprint ยิง CSS
  // @media print อาจยังไม่ถูกคำนวณ layout ใหม่ทันเวลา ทำให้ clientWidth ที่อ่านได้เป็นความกว้าง
  // หน้าจอปกติ (กว้างกว่าโซนพิมพ์จริงมาก) ส่งผลให้ตารางที่กว้างเกินหน้ากระดาษแต่ยังแคบกว่าจอ
  // ถูกตัดสินว่า "พอดีแล้ว" และไม่ย่อ zoom ให้เลย ข้อความคอลัมน์ขวาสุดเลยหลุดขอบกระดาษตอนพิมพ์จริง
  useEffect(() => {
    function fitPrintTable() {
      const area = document.getElementById('ar-print-area');
      if (!area) return;
      area.querySelectorAll('.ar-print-table').forEach((table) => {
        table.style.zoom = '1';
        const needed = table.scrollWidth;
        if (needed > PRINT_PAGE_WIDTH_PX) {
          table.style.zoom = String(PRINT_PAGE_WIDTH_PX / needed);
        }
      });
    }
    function resetPrintTable() {
      document.querySelectorAll('.ar-print-table').forEach((table) => { table.style.zoom = ''; });
    }
    window.addEventListener('beforeprint', fitPrintTable);
    window.addEventListener('afterprint', resetPrintTable);
    return () => {
      window.removeEventListener('beforeprint', fitPrintTable);
      window.removeEventListener('afterprint', resetPrintTable);
    };
  }, []);

  async function handleSearch() {
    if (!isSearchable) return;
    setLoading(true);
    setError('');
    try {
      if (filters.category === 'STUDENT') {
        const data = await getStudentReport({
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          studentId: filters.specific,
        });
        setReport(data);
      } else if (filters.category === 'TUTOR') {
        const data = await getTutorReport({
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          tutorId: filters.specific,
        });
        setReport(data);
      } else if (filters.category === 'COURSE') {
        const data = await getCourseReport({
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          courseId: filters.specific,
          status: filters.status,
        });
        setReport(data);
      } else if (filters.category === 'ENROLLMENT') {
        const data = await getEnrollmentReport({
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          courseId: filters.courseId,
          status: filters.status,
          studentId: filters.specific,
        });
        setReport(data);
      } else if (filters.category === 'PAYMENT') {
        const data = await getPaymentStatusReport({
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          courseId: filters.courseId,
          status: filters.status,
          studentId: filters.specific,
        });
        setReport(data);
      } else if (filters.category === 'ATTENDANCE') {
        const data = await getAttendanceReport({
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          courseId: filters.courseId,
          studentId: filters.specific,
        });
        setReport(data);
      } else if (filters.category === 'INSTITUTION') {
        const profile = await getInstitutionProfile();
        setReport({ totalCount: profile ? 1 : 0, items: profile ? [profile] : [] });
      } else if (filters.category === 'EXAM_INSTITUTION') {
        let baseItems;
        if (filters.specific) {
          const inst = await getExamInstitutionById(filters.specific);
          baseItems = inst ? [inst] : [];
        } else {
          baseItems = asList(await getExamInstitutions({}));
        }
        let items = await Promise.all(baseItems.map(loadInstitutionChildren));
        if (isUniversitySpecific && filters.faculty) {
          items = items.map((inst) => ({
            ...inst,
            faculties: (inst.faculties || []).filter((f) => String(f.id) === String(filters.faculty)),
          }));
        }
        setReport({ totalCount: items.length, items });
      }
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดรายงานได้');
    } finally {
      setLoading(false);
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
          <label>ข้อมูลหลัก</label>
          <select value={filters.category} onChange={(e) => changeCategory(e.target.value)}>
            <option value="">เลือกประเภทข้อมูล</option>
            {DATA_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        {/* ตัวกรองเฉพาะทาง — ตัวเลือกเปลี่ยนตาม "ข้อมูลหลัก" ที่เลือก ตอนนี้รองรับข้อมูลนักเรียน/สถาบันที่จัดสอบ */}
        <div className="ar-filter-field">
          <label>ตัวกรองเฉพาะทาง</label>
          <select value={filters.specific} onChange={(e) => changeSpecific(e.target.value)} disabled={!hasSpecificFilter}>
            <option value="">ทั้งหมด</option>
            {specificOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        {/* ตัวกรอง "คณะ" — แสดงเฉพาะตอนเจาะจงสถาบันประเภทมหาวิทยาลัย */}
        {isUniversitySpecific && (
          <div className="ar-filter-field">
            <label>คณะ</label>
            <select value={filters.faculty} onChange={(e) => fld('faculty', e.target.value)}>
              <option value="">ทั้งหมด</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        )}
        {/* ตัวกรอง "คอร์ส" — แสดงเฉพาะหมวด "ข้อมูลสมัครเรียน"/"ข้อมูลการชำระเงิน" */}
        {hasCourseFilter && (
          <div className="ar-filter-field">
            <label>คอร์ส</label>
            <select value={filters.courseId} onChange={(e) => fld('courseId', e.target.value)}>
              <option value="">ทั้งหมด</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.courseName} ({c.courseCode || ''})</option>
              ))}
            </select>
          </div>
        )}
        {/* ตัวกรอง "สถานะ" — แสดงเฉพาะหมวดที่มีสถานะ (ตัวเลือกเปลี่ยนความหมายตามหมวด) */}
        {['COURSE', 'ENROLLMENT', 'PAYMENT'].includes(filters.category) && (
          <div className="ar-filter-field">
            <label>สถานะ</label>
            <select value={filters.status} onChange={(e) => fld('status', e.target.value)}>
              <option value="">ทั้งหมด</option>
              {filters.category === 'COURSE' && Object.entries(COURSE_STATUS_TH).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
              {filters.category === 'ENROLLMENT' && Object.entries(ENROLLMENT_STATUS_TH).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
              {filters.category === 'PAYMENT' && PAYMENT_DATA_STATUS_OPTIONS.map((key) => (
                <option key={key} value={key}>{statusLabelTH(key, ENROLLMENT_HISTORY_STATUS_LABEL)}</option>
              ))}
            </select>
          </div>
        )}
        <div className="ar-filter-actions">
          <button
            type="button"
            className="ar-btn-search"
            onClick={handleSearch}
            disabled={loading || !isSearchable}
          >
            {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
          </button>
          <button
            type="button"
            className="ar-btn-pdf"
            onClick={() => window.print()}
            disabled={!report}
          >
            ดาวน์โหลด PDF
          </button>
        </div>
      </div>

      {filters.category === '' && (
        <p className="ar-empty">เลือก "ข้อมูลหลัก" เพื่อเริ่มค้นหารายงาน</p>
      )}

      {filters.category !== '' && !isSearchable && (
        <p className="ar-empty">กำลังพัฒนา</p>
      )}

      {isSearchable && (
        <>
          {error && (
            <div className="ar-state ar-state--error">
              <p>{error}</p>
            </div>
          )}

          {!error && !report && !loading && (
            <p className="ar-empty">เลือกเงื่อนไขแล้วกด "ค้นหา" เพื่อดูรายงาน</p>
          )}

          {report && filters.category === 'STUDENT' && (
            <div id="ar-print-area">
              <h2 className="ar-print-title">
                รายงานข้อมูลนักเรียน
                <span>
                  {filters.dateFrom || filters.dateTo
                    ? `ช่วงวันที่สมัคร: ${filters.dateFrom ? formatDate(filters.dateFrom) : 'ไม่ระบุ'} ถึง ${filters.dateTo ? formatDate(filters.dateTo) : 'ไม่ระบุ'}`
                    : 'ทุกช่วงวันที่สมัคร'}
                  {' · '}พิมพ์เมื่อ {formatDate(new Date())}
                </span>
              </h2>

              <div className="ar-summary-chips">
                <div className="ar-chip"><span>จำนวนนักเรียน</span><strong>{report.totalCount}</strong></div>
              </div>

              <section className="ar-card">
                <div className="ar-table-wrap">
                  <table className="ar-table ar-print-table">
                    <thead>
                      <tr>
                        <th>รหัสนักเรียน</th>
                        <th>ชื่อ-นามสกุล</th>
                        <th>อีเมล</th>
                        <th>เบอร์โทรศัพท์</th>
                        <th>วันเกิด</th>
                        <th>เบอร์ผู้ปกครอง</th>
                        <th>วันที่สมัคร</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(report.items || []).length === 0 ? (
                        <tr><td colSpan={7} className="ar-empty">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</td></tr>
                      ) : (
                        report.items.map((s) => (
                          <tr key={s.id}>
                            <td>{s.studentCode || '-'}</td>
                            <td>{s.fullName || '-'}</td>
                            <td>{s.email || '-'}</td>
                            <td>{s.phoneNumber || '-'}</td>
                            <td>{formatDate(s.birthDate)}</td>
                            <td>{s.guardianPhoneNumber || '-'}</td>
                            <td>{formatDate(s.createdAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {report && filters.category === 'TUTOR' && (
            <div id="ar-print-area">
              <h2 className="ar-print-title">
                รายงานข้อมูลติวเตอร์
                <span>
                  {filters.dateFrom || filters.dateTo
                    ? `ช่วงวันที่สมัคร: ${filters.dateFrom ? formatDate(filters.dateFrom) : 'ไม่ระบุ'} ถึง ${filters.dateTo ? formatDate(filters.dateTo) : 'ไม่ระบุ'}`
                    : 'ทุกช่วงวันที่สมัคร'}
                  {' · '}พิมพ์เมื่อ {formatDate(new Date())}
                </span>
              </h2>

              <div className="ar-summary-chips">
                <div className="ar-chip"><span>จำนวนติวเตอร์</span><strong>{report.totalCount}</strong></div>
              </div>

              <section className="ar-card">
                <div className="ar-table-wrap">
                  <table className="ar-table ar-print-table">
                    <thead>
                      <tr>
                        <th>รหัสติวเตอร์</th>
                        <th>ชื่อ-นามสกุล</th>
                        <th>อีเมล</th>
                        <th>เบอร์โทรศัพท์</th>
                        <th>ความเชี่ยวชาญ</th>
                        <th>วันที่สมัคร</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(report.items || []).length === 0 ? (
                        <tr><td colSpan={6} className="ar-empty">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</td></tr>
                      ) : (
                        report.items.map((t) => (
                          <tr key={t.id}>
                            <td>{t.tutorCode || '-'}</td>
                            <td>{`${t.firstName || ''} ${t.lastName || ''}`.trim() || '-'}</td>
                            <td>{t.email || '-'}</td>
                            <td>{t.phoneNumber || '-'}</td>
                            <td>{t.specialization || '-'}</td>
                            <td>{formatDate(t.createdAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {report && filters.category === 'COURSE' && (
            <div id="ar-print-area">
              <h2 className="ar-print-title">
                รายงานข้อมูลคอร์สเรียน
                <span>
                  {filters.dateFrom || filters.dateTo
                    ? `ช่วงวันที่สร้างคอร์ส: ${filters.dateFrom ? formatDate(filters.dateFrom) : 'ไม่ระบุ'} ถึง ${filters.dateTo ? formatDate(filters.dateTo) : 'ไม่ระบุ'}`
                    : 'ทุกช่วงวันที่สร้างคอร์ส'}
                  {' · '}พิมพ์เมื่อ {formatDate(new Date())}
                </span>
              </h2>

              <div className="ar-summary-chips">
                <div className="ar-chip"><span>จำนวนคอร์ส</span><strong>{report.totalCount}</strong></div>
              </div>

              <section className="ar-card">
                <div className="ar-table-wrap">
                  <table className="ar-table ar-print-table">
                    <thead>
                      <tr>
                        <th>รหัสคอร์ส</th>
                        <th>ชื่อคอร์ส</th>
                        <th>ติวเตอร์</th>
                        <th className="ar-num">ราคา</th>
                        <th className="ar-num">จำนวนผู้สมัคร</th>
                        <th>สถานะ</th>
                        <th>วันเริ่มเรียน</th>
                        <th>วันที่สร้าง</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(report.items || []).length === 0 ? (
                        <tr><td colSpan={8} className="ar-empty">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</td></tr>
                      ) : (
                        report.items.map((c) => (
                          <tr key={c.id}>
                            <td>{c.courseCode || '-'}</td>
                            <td>{c.courseName || '-'}</td>
                            <td>{c.teacherName || '-'}</td>
                            <td className="ar-num">{formatCurrency(c.price)}</td>
                            <td className="ar-num">{formatNumber(c.enrolledCount)}/{formatNumber(c.seatLimit)}</td>
                            <td>{statusLabelTH(c.status, COURSE_STATUS_TH)}</td>
                            <td>{formatDate(c.courseStartDate)}</td>
                            <td>{formatDate(c.createdAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {report && filters.category === 'ENROLLMENT' && (
            <div id="ar-print-area">
              <h2 className="ar-print-title">
                รายงานข้อมูลสมัครเรียน
                <span>
                  {filters.dateFrom || filters.dateTo
                    ? `ช่วงวันที่สมัคร: ${filters.dateFrom ? formatDate(filters.dateFrom) : 'ไม่ระบุ'} ถึง ${filters.dateTo ? formatDate(filters.dateTo) : 'ไม่ระบุ'}`
                    : 'ทุกช่วงวันที่สมัคร'}
                  {' · '}พิมพ์เมื่อ {formatDate(new Date())}
                </span>
              </h2>

              <div className="ar-summary-chips">
                <div className="ar-chip"><span>จำนวนรายการ</span><strong>{formatNumber(report.totalCount)}</strong></div>
                <div className="ar-chip"><span>ยอดรวม</span><strong>{formatCurrency(report.totalAmount)}</strong></div>
                {Object.entries(report.byStatus || {}).map(([status, count]) => (
                  <div className="ar-chip" key={status}>
                    <span>{statusLabelTH(status, ENROLLMENT_STATUS_TH)}</span>
                    <strong>{formatNumber(count)}</strong>
                  </div>
                ))}
              </div>

              <section className="ar-card">
                <div className="ar-table-wrap">
                  <table className="ar-table ar-print-table">
                    <thead>
                      <tr>
                        <th>รหัสสมัคร</th>
                        <th>วันที่สมัคร</th>
                        <th>นักเรียน</th>
                        <th>คอร์ส</th>
                        <th>ติวเตอร์</th>
                        <th>สถานะสมัคร</th>
                        <th>การชำระเงิน</th>
                        <th className="ar-num">ยอดชำระ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(report.items || []).length === 0 ? (
                        <tr><td colSpan={8} className="ar-empty">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</td></tr>
                      ) : (
                        report.items.map((i) => (
                          <tr key={i.enrollmentId}>
                            <td>{i.enrollmentCode || '-'}</td>
                            <td>{formatDateTime(i.enrollmentDate)}</td>
                            <td>
                              <strong>{i.studentName || '-'}</strong>
                              <span className="ar-code">{i.studentCode || ''}</span>
                            </td>
                            <td>
                              <strong>{i.courseName || '-'}</strong>
                              <span className="ar-code">{i.courseCode || ''}</span>
                            </td>
                            <td>{i.tutorName || '-'}</td>
                            <td>{statusLabelTH(i.status, ENROLLMENT_STATUS_TH)}</td>
                            <td>{statusLabelTH(i.paymentStatus, PAYMENT_STATUS_TH)}</td>
                            <td className="ar-num">{formatCurrency(i.finalAmount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {report && filters.category === 'PAYMENT' && (
            <div id="ar-print-area">
              <h2 className="ar-print-title">
                รายงานข้อมูลการชำระเงิน
                <span>
                  {filters.dateFrom || filters.dateTo
                    ? `ช่วงวันที่สมัคร: ${filters.dateFrom ? formatDate(filters.dateFrom) : 'ไม่ระบุ'} ถึง ${filters.dateTo ? formatDate(filters.dateTo) : 'ไม่ระบุ'}`
                    : 'ทุกช่วงวันที่สมัคร'}
                  {' · '}พิมพ์เมื่อ {formatDate(new Date())}
                </span>
              </h2>

              <div className="ar-summary-chips">
                <div className="ar-chip"><span>จำนวนรายการ</span><strong>{formatNumber(report.totalCount)}</strong></div>
                <div className="ar-chip"><span>ยอดรวม</span><strong>{formatCurrency(report.totalAmount)}</strong></div>
                <div className="ar-chip"><span>ชำระเงินเรียบร้อยแล้ว</span><strong>{formatCurrency(report.approvedAmount)}</strong></div>
                <div className="ar-chip"><span>ปฏิเสธ</span><strong>{formatCurrency(report.rejectedAmount)}</strong></div>
              </div>

              <section className="ar-card">
                <div className="ar-table-wrap">
                  <table className="ar-table ar-print-table">
                    <thead>
                      <tr>
                        <th>รหัสสมัคร</th>
                        <th>นักเรียน</th>
                        <th>คอร์ส</th>
                        <th className="ar-num">ราคา</th>
                        <th>วิธีชำระ</th>
                        <th>สถานะ</th>
                        <th>ผู้ดำเนินการ</th>
                        <th>วันที่ดำเนินการ</th>
                        <th>หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(report.items || []).length === 0 ? (
                        <tr><td colSpan={9} className="ar-empty">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</td></tr>
                      ) : (
                        report.items.map((i) => (
                          <tr key={i.enrollmentId}>
                            <td>{i.enrollmentCode || '-'}</td>
                            <td>
                              <strong>{i.studentName || '-'}</strong>
                              <span className="ar-code">{i.studentCode || ''}</span>
                            </td>
                            <td>
                              <strong>{i.courseName || '-'}</strong>
                              <span className="ar-code">{i.courseCode || ''}</span>
                            </td>
                            <td className="ar-num">{formatCurrency(i.price)}</td>
                            <td>{PAYMENT_METHOD_TH[i.paymentMethod] || '-'}</td>
                            <td>{statusLabelTH(i.status, ENROLLMENT_HISTORY_STATUS_LABEL)}</td>
                            <td>{i.processedBy || '-'}</td>
                            <td>{formatDateTime(i.processedAt)}</td>
                            <td>{i.note || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {report && filters.category === 'ATTENDANCE' && (
            <div id="ar-print-area">
              <h2 className="ar-print-title">
                รายงานข้อมูลการเข้าเรียน
                <span>
                  {filters.dateFrom || filters.dateTo
                    ? `ช่วงวันที่เรียน: ${filters.dateFrom ? formatDate(filters.dateFrom) : 'ไม่ระบุ'} ถึง ${filters.dateTo ? formatDate(filters.dateTo) : 'ไม่ระบุ'}`
                    : 'ทุกช่วงวันที่เรียน'}
                  {' · '}พิมพ์เมื่อ {formatDate(new Date())}
                </span>
              </h2>

              <div className="ar-summary-chips">
                <div className="ar-chip"><span>จำนวนนักเรียน/คอร์ส</span><strong>{formatNumber(report.totalCount)}</strong></div>
              </div>

              <section className="ar-card">
                <div className="ar-table-wrap">
                  <table className="ar-table ar-print-table">
                    <thead>
                      <tr>
                        <th>นักเรียน</th>
                        <th>คอร์ส</th>
                        <th className="ar-num">จำนวนครั้งเรียน</th>
                        <th className="ar-num">{ATTENDANCE_STATUS_TH.PRESENT}</th>
                        <th className="ar-num">{ATTENDANCE_STATUS_TH.LATE}</th>
                        <th className="ar-num">{ATTENDANCE_STATUS_TH.ABSENT}</th>
                        <th className="ar-num">{ATTENDANCE_STATUS_TH.LEAVE}</th>
                        <th className="ar-num">{ATTENDANCE_STATUS_TH.EXCUSED}</th>
                        <th className="ar-num">อัตราเข้าเรียน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(report.items || []).length === 0 ? (
                        <tr><td colSpan={9} className="ar-empty">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</td></tr>
                      ) : (
                        report.items.map((i) => (
                          <tr key={`${i.studentId}-${i.courseId}`}>
                            <td>
                              <strong>{i.studentName || '-'}</strong>
                              <span className="ar-code">{i.studentCode || ''}</span>
                            </td>
                            <td>
                              <strong>{i.courseName || '-'}</strong>
                              <span className="ar-code">{i.courseCode || ''}</span>
                            </td>
                            <td className="ar-num">{formatNumber(i.totalSessions)}</td>
                            <td className="ar-num">{formatNumber(i.presentCount)}</td>
                            <td className="ar-num">{formatNumber(i.lateCount)}</td>
                            <td className="ar-num">{formatNumber(i.absentCount)}</td>
                            <td className="ar-num">{formatNumber(i.leaveCount)}</td>
                            <td className="ar-num">{formatNumber(i.excusedCount)}</td>
                            <td className="ar-num">{i.attendanceRate}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {report && filters.category === 'INSTITUTION' && (
            <div id="ar-print-area">
              <h2 className="ar-print-title">
                รายงานข้อมูลสถาบัน
                <span>พิมพ์เมื่อ {formatDate(new Date())}</span>
              </h2>

              {(report.items || []).length === 0 ? (
                <section className="ar-card">
                  <p className="ar-empty">ไม่พบข้อมูลสถาบัน</p>
                </section>
              ) : (
                <section className="ar-card">
                  <div className="ar-kv-grid">
                    {[
                      ['ชื่อสถาบัน', report.items[0].institutionName],
                      ['ที่อยู่', report.items[0].address],
                      ['เบอร์โทรศัพท์', report.items[0].phoneNumber],
                      ['อีเมล', report.items[0].email],
                      ['ธนาคาร', report.items[0].bankName],
                      ['ชื่อบัญชี', report.items[0].bankAccountName],
                      ['เลขบัญชี', report.items[0].bankAccountNumber],
                      ['พร้อมเพย์', report.items[0].promptPayId],
                      ['ปรับปรุงล่าสุด', formatDate(report.items[0].updatedAt)],
                    ].map(([label, value]) => (
                      <div className="ar-kv-item" key={label}>
                        <span className="ar-kv-label">{label}</span>
                        <span className="ar-kv-value">{value || value === 0 ? value : '-'}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {report && filters.category === 'EXAM_INSTITUTION' && (
            <div id="ar-print-area">
              <h2 className="ar-print-title">
                รายงานข้อมูลสถาบันที่จัดสอบ
                <span>พิมพ์เมื่อ {formatDate(new Date())}</span>
              </h2>

              <div className="ar-summary-chips">
                <div className="ar-chip"><span>จำนวนสถาบัน</span><strong>{report.totalCount}</strong></div>
              </div>

              {(report.items || []).length === 0 ? (
                <section className="ar-card">
                  <p className="ar-empty">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</p>
                </section>
              ) : (
                report.items.map((inst) => (
                  <section className="ar-card ar-exam-inst-card" key={inst.id}>
                    <h3 className="ar-exam-inst-title">
                      {inst.institutionName || '-'}
                      <span className="ar-code">
                        {inst.institutionCode || '-'} · {inst.institutionTypeLabel || inst.institutionType || '-'}
                        {' · '}{inst.province || '-'} {inst.district || ''}
                      </span>
                    </h3>

                    <div className="ar-table-wrap">
                      {inst.institutionType === 'UNIVERSITY' && (
                        <table className="ar-table ar-print-table">
                          <thead>
                            <tr>
                              <th>คณะ</th>
                              <th>สาขา</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(inst.faculties || []).length === 0 ? (
                              <tr><td colSpan={2} className="ar-empty">ไม่มีข้อมูลคณะ/สาขา</td></tr>
                            ) : (
                              inst.faculties.flatMap((f) => {
                                const majors = f.majors || [];
                                const rowSpan = Math.max(majors.length, 1);
                                if (majors.length === 0) {
                                  return [
                                    <tr key={`${f.id}-none`}>
                                      <td rowSpan={rowSpan}>{f.name || '-'}</td>
                                      <td>-</td>
                                    </tr>,
                                  ];
                                }
                                return majors.map((m, i) => (
                                  <tr key={`${f.id}-${m.id}`}>
                                    {i === 0 && <td rowSpan={rowSpan}>{f.name || '-'}</td>}
                                    <td>{m.name || '-'}</td>
                                  </tr>
                                ));
                              })
                            )}
                          </tbody>
                        </table>
                      )}

                      {inst.institutionType === 'VOCATIONAL_DIPLOMA' && (
                        <table className="ar-table ar-print-table">
                          <thead>
                            <tr>
                              <th>สาขา</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(inst.majors || []).length === 0 ? (
                              <tr><td className="ar-empty">ไม่มีข้อมูลสาขา</td></tr>
                            ) : (
                              inst.majors.map((m) => (
                                <tr key={m.id}>
                                  <td>{m.name || '-'}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      )}

                      {inst.institutionType === 'SECONDARY' && (
                        <table className="ar-table ar-print-table">
                          <thead>
                            <tr>
                              <th>ระดับชั้น</th>
                              <th>สายการเรียน/ห้องเรียน</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(inst.tracks || []).length === 0 ? (
                              <tr><td colSpan={2} className="ar-empty">ไม่มีข้อมูลสายการเรียน/ห้องเรียน</td></tr>
                            ) : (
                              inst.tracks.map((t) => (
                                <tr key={t.id}>
                                  <td>{EDUCATION_LEVEL_TH[t.educationLevel] || t.educationLevel || '-'}</td>
                                  <td>{t.name || '-'}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </section>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
