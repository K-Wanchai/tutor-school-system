import { useEffect, useState } from 'react';
import CalendarDateInput from '../../../../shared/components/CalendarDateInput';
import { getStudents } from '../../services/adminStudentService';
import { getStudentReport } from '../../services/adminReportService';
import { getInstitutionProfile } from '../../../../shared/services/institutionService';
import { getExamInstitutions, getExamInstitutionById } from '../../services/examInstitutionService';
import { getFaculties, getMajors } from '../../services/academicFacultyService';
import { getVocationalMajors } from '../../services/vocationalMajorService';
import { getSchoolTracks } from '../../services/schoolTrackService';

const EDUCATION_LEVEL_TH = {
  LOWER_SECONDARY: 'มัธยมต้น',
  UPPER_SECONDARY: 'มัธยมปลาย',
  VOCATIONAL_DIPLOMA: 'ปวส.',
  BACHELOR: 'ปริญญาตรี',
};

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

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
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
  const [examInstitutions, setExamInstitutions] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function fld(name, value) {
    setFilters((f) => ({ ...f, [name]: value }));
  }

  function changeCategory(value) {
    setFilters((f) => ({ ...f, category: value, specific: '' }));
    setReport(null);
    setError('');
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

  // ตัวกรองเฉพาะทางของ "ข้อมูลสถาบันที่จัดสอบ" — โหลดรายชื่อสถาบันแบบ lazy ตอนเลือกหมวดนี้ครั้งแรกเท่านั้น
  useEffect(() => {
    if (filters.category !== 'EXAM_INSTITUTION' || examInstitutions.length > 0) return;
    let mounted = true;
    getExamInstitutions({})
      .then((data) => { if (mounted) setExamInstitutions(asList(data)); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [filters.category, examInstitutions.length]);

  const specificOptions = filters.category === 'STUDENT'
    ? students.map((s) => ({ value: s.id, label: `${s.fullName} (${s.studentCode})` }))
    : filters.category === 'EXAM_INSTITUTION'
    ? examInstitutions.map((e) => ({ value: e.id, label: `${e.institutionName} (${e.institutionTypeLabel || ''})` }))
    : [];

  const isSearchable = filters.category === 'STUDENT' || filters.category === 'INSTITUTION'
    || filters.category === 'EXAM_INSTITUTION';
  const hasSpecificFilter = filters.category === 'STUDENT' || filters.category === 'EXAM_INSTITUTION';

  // ต้องแสดงข้อมูลครบทุกตัวอักษรในบรรทัดเดียวตอนพิมพ์ ห้ามตัดขึ้นบรรทัดใหม่ — คำนวณ zoom
  // ให้ตารางย่อพอดีความกว้างหน้ากระดาษแทนการ wrap (ดู white-space: nowrap ใน AdminReportsPage.css)
  useEffect(() => {
    function fitPrintTable() {
      const area = document.getElementById('ar-print-area');
      if (!area) return;
      area.querySelectorAll('.ar-print-table').forEach((table) => {
        table.style.zoom = '1';
        const available = area.clientWidth;
        const needed = table.scrollWidth;
        if (available > 0 && needed > available) {
          table.style.zoom = String(available / needed);
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
        const items = await Promise.all(baseItems.map(loadInstitutionChildren));
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
          <select value={filters.specific} onChange={(e) => fld('specific', e.target.value)} disabled={!hasSpecificFilter}>
            <option value="">ทั้งหมด</option>
            {specificOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
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
                              inst.faculties.flatMap((f) => (
                                (f.majors || []).length === 0
                                  ? [
                                    <tr key={`${f.id}-none`}>
                                      <td>{f.name || '-'}</td>
                                      <td>-</td>
                                    </tr>,
                                  ]
                                  : f.majors.map((m) => (
                                    <tr key={`${f.id}-${m.id}`}>
                                      <td>{f.name || '-'}</td>
                                      <td>{m.name || '-'}</td>
                                    </tr>
                                  ))
                              ))
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
