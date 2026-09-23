import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  completeCourse,
  getCourseCompletionEligibility,
  getMyCourses,
  markCourseViewed,
} from '../services/tutorCourseService';
import { getEnrollmentsByCourse } from '../services/tutorEnrollmentService';

import RefreshButton from '../components/RefreshButton';
import { formatScheduleDaysTH } from '../../../shared/utils/dateUtils';

import './TutorCoursesPage.css';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

const STATUS_LABEL = {
  PENDING: {
    label: 'รอเปิดรับสมัคร',
    cls: 'tc-badge-draft',
  },

  OPEN_FOR_REGISTRATION: {
    label: 'เปิดรับสมัคร',
    cls: 'tc-badge-open',
  },

  CLOSED: {
    label: 'ปิดรับสมัคร',
    cls: 'tc-badge-closed',
  },

  ONGOING: {
    label: 'กำลังเรียน',
    cls: 'tc-badge-ongoing',
  },

  COMPLETED: {
    label: 'สอนจบแล้ว',
    cls: 'tc-badge-completed',
  },
};

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] || {
    label: status,
    cls: '',
  };

  return (
    <span className={`tc-badge ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function TutorCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);

  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [detailCourse, setDetailCourse] = useState(null);
  const [enrollCourse, setEnrollCourse] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState('');
  const [toast, setToast] = useState('');
  const [eligibilityByCourseId, setEligibilityByCourseId] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getMyCourses();
      const list = Array.isArray(data) ? data : [];

      setCourses(list);

      // แอดมินมอบหมายคอร์สมาแล้วถือว่าติวเตอร์ได้รับทันที — เข้าหน้านี้ครั้งแรกถือว่าเปิดดูแล้ว ล้าง badge แจ้งเตือนที่เมนู
      const unviewed = list.filter((c) => !c.tutorViewed);
      if (unviewed.length > 0) {
        await Promise.all(unviewed.map((c) => markCourseViewed(c.id).catch(() => {})));
      }

      // คอร์สที่กำลังเรียนอยู่ — เช็คว่าเช็คชื่อ+กรอกคะแนนสอบครบทุกช่องหรือยัง เพื่อเปิด/ปิดปุ่ม "บันทึกข้อมูลและจบการสอน"
      const ongoing = list.filter((c) => c.status === 'ONGOING');
      const entries = await Promise.all(
        ongoing.map(async (c) => {
          try {
            return [c.id, await getCourseCompletionEligibility(c.id)];
          } catch {
            return [c.id, null];
          }
        })
      );
      setEligibilityByCourseId(Object.fromEntries(entries));
    } catch (error) {
      console.error(error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    // คอร์สที่สอนจบแล้วย้ายไปแสดงที่หน้า "ประวัติคอร์สเรียน" แทน ไม่แสดงในหน้านี้อีกต่อไป
    return courses.filter((course) => {
      const text =
        `${course.courseName || ''} ${course.courseCode || ''}`.toLowerCase();

      return (
        course.status !== 'COMPLETED' &&
        text.includes(keyword.toLowerCase()) &&
        (filter === 'ALL' || course.status === filter)
      );
    });
  }, [courses, keyword, filter]);

  function openDetail(course) {
    setDetailCourse(course);
  }

  async function confirmCompleteCourse() {
    if (!completeTarget) return;
    setCompleting(true);
    setCompleteError('');
    try {
      await completeCourse(completeTarget.id);
      setCompleteTarget(null);
      setToast('บันทึกข้อมูลและจบการสอนเรียบร้อยแล้ว นักเรียนสามารถประเมินคอร์สได้แล้ว');
      window.setTimeout(() => setToast(''), 4000);
      await load();
    } catch (error) {
      setCompleteError(error.message);
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="tc-page">
      {toast && <div className="tc-toast">{toast}</div>}

      {/* Header */}
      <div className="tc-header">
        <div>
          <h1>คอร์สของฉัน</h1>

          <p>
            คอร์สทั้งหมดของคุณ จัดการบทเรียนและข้อสอบได้ที่นี่
          </p>
        </div>

        <div className="tc-header-right">
          <RefreshButton
            onClick={load}
            loading={loading}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="tc-toolbar">
        <input
          type="text"
          placeholder="ค้นหาชื่อคอร์ส หรือรหัสคอร์ส..."
          value={keyword}
          onChange={(e) =>
            setKeyword(e.target.value)
          }
        />

        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
        >
          <option value="ALL">
            ทุกสถานะ
          </option>

          <option value="PENDING">
            รอเปิดรับสมัคร
          </option>

          <option value="CLOSED">
            ปิดรับสมัคร
          </option>

          <option value="OPEN_FOR_REGISTRATION">
            เปิดรับสมัคร
          </option>

          <option value="ONGOING">
            กำลังเรียน
          </option>
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="tc-loading">
          กำลังโหลดข้อมูล...
        </div>
      ) : filtered.length === 0 ? (
        <div className="tc-empty">
          <div className="tc-empty-icon">
            📚
          </div>

          <h3>ยังไม่มีคอร์ส</h3>

          <p>
            เมื่อแอดมินมอบหมายคอร์สให้คุณ รายการจะแสดงที่นี่ทันที
          </p>
        </div>
      ) : (
        <div className="tc-grid">
          {filtered.map((course) => (
            <div key={course.id} className="tc-card">
              <div className="tc-card-top">
                <span className="tc-code">
                  {course.courseCode}
                </span>

                <StatusBadge
                  status={course.status}
                />
              </div>

              <h2 className="tc-card-title">
                {course.courseName}
              </h2>

              <p className="tc-card-desc">
                {course.description ||
                  'ไม่มีรายละเอียดคอร์ส'}
              </p>

              <div className="tc-card-info">
                <div>
                  <span>ชั่วโมงเรียน</span>

                  <strong>
                    {course.totalHours || 0}{' '}
                    ชั่วโมง
                  </strong>
                </div>

                <div>
                  <span>จำนวนนักเรียน</span>

                  <strong>
                    {course.enrolledCount || 0}/{course.seatLimit || 0}{' '}
                    คน
                  </strong>
                </div>

                <div>
                  <span>เริ่มเรียน</span>

                  <strong>
                    {formatDate(course.courseStartDate)}
                  </strong>
                </div>
              </div>

              <div className="tc-card-actions">
                <button className="tc-btn-detail" onClick={() => openDetail(course)}>
                  ดูรายละเอียด
                </button>
                <button className="tc-btn-roster" onClick={() => setEnrollCourse(course)}>
                  👥 รายชื่อ
                </button>

                {course.status === 'ONGOING' && (
                  <button
                    className="tc-btn-exam"
                    onClick={() => navigate(`/tutor/exam-schedule/${course.id}?create=1`)}
                  >
                    📝 ตารางสอบ
                  </button>
                )}

                {course.status === 'ONGOING' && (() => {
                  const eligibility = eligibilityByCourseId[course.id];
                  const canComplete = !!eligibility?.canComplete;
                  return (
                    <button
                      className="tc-btn-complete"
                      disabled={!canComplete}
                      title={
                        canComplete
                          ? undefined
                          : 'ต้องเช็คชื่อและกรอกคะแนนสอบให้ครบทุกช่องก่อน จึงจะบันทึกข้อมูลและจบการสอนได้'
                      }
                      onClick={() => {
                        setCompleteError('');
                        setCompleteTarget(course);
                      }}
                    >
                      ✅จบการสอน
                    </button>
                  );
                })()}

                {/* {['PENDING', 'CLOSED', 'OPEN_FOR_REGISTRATION', 'ONGOING'].includes(course.status) && (
                  <button className="tc-btn-accept" onClick={() => openManage(course)}>
                    📚 จัดการบทเรียน
                  </button>
                )} */}
              </div>
            </div>
          ))}
        </div>
      )}

      {detailCourse && (
        <CourseDetailModal
          course={detailCourse}
          onClose={() => setDetailCourse(null)}
        />
      )}

      {enrollCourse && (
        <EnrollmentListModal
          course={enrollCourse}
          onClose={() => setEnrollCourse(null)}
        />
      )}

      {completeTarget && (
        <div className="tc-modal-overlay" onClick={() => !completing && setCompleteTarget(null)}>
          <div className="tc-modal tc-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="tc-modal-header">
              <h2>บันทึกข้อมูลและจบการสอน</h2>
              <button
                className="tc-modal-close"
                onClick={() => !completing && setCompleteTarget(null)}
              >
                ✕
              </button>
            </div>

            <div className="tc-modal-section">
              <p>
                ยืนยันบันทึกข้อมูลและจบการสอนคอร์ส <strong>{completeTarget.courseName}</strong> หรือไม่?
              </p>
              <p className="tc-modal-hint">
                เมื่อยืนยันแล้ว สถานะคอร์สจะเปลี่ยนเป็น "สอนจบแล้ว" ทันที
                นักเรียนที่ชำระเงินเรียบร้อยจะถือว่าเรียนจบและสามารถประเมินคอร์สนี้ได้
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
              {completeError && <div className="tc-modal-error">{completeError}</div>}
            </div>

            <div className="tc-modal-footer">
              <button onClick={() => setCompleteTarget(null)} disabled={completing}>
                ยกเลิก
              </button>
              <button
                className="tc-btn-complete"
                onClick={confirmCompleteCourse}
                disabled={completing}
              >
                {completing ? 'กำลังดำเนินการ...' : 'ยืนยันบันทึกข้อมูลและจบการสอน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PAYMENT_STATUS_LABEL = {
  UNPAID:               { label: 'ยังไม่ชำระ',      cls: 'tc-pay-unpaid' },
  PENDING_VERIFICATION: { label: 'รอตรวจสอบ',        cls: 'tc-pay-pending' },
  PAID:                 { label: 'ชำระแล้ว',         cls: 'tc-pay-paid' },
  FAILED:               { label: 'ชำระไม่สำเร็จ',   cls: 'tc-pay-failed' },
};

function PayBadge({ status }) {
  const s = PAYMENT_STATUS_LABEL[status] || { label: status || '-', cls: '' };
  return <span className={`tc-pay-badge ${s.cls}`}>{s.label}</span>;
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function EnrollmentListModal({ course, onClose }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnr, setLoadingEnr] = useState(true);
  const [errEnr, setErrEnr] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoadingEnr(true);
    setErrEnr('');
    getEnrollmentsByCourse(course.id)
      .then((data) => {
        if (cancelled) return;
        // ซ่อนรายการที่ยกเลิกหรือถูกปฏิเสธ
        setEnrollments(data.filter((e) => e.status !== 'CANCELLED' && e.status !== 'REJECTED'));
      })
      .catch((err) => { if (!cancelled) setErrEnr(err.message); })
      .finally(() => { if (!cancelled) setLoadingEnr(false); });
    return () => { cancelled = true; };
  }, [course.id]);

  const paidCount = enrollments.filter((e) => e.paymentStatus === 'PAID').length;

  return (
    <div className="tc-modal-overlay" onClick={onClose}>
      <div className="tc-modal tc-modal--lg" onClick={(e) => e.stopPropagation()}>
        <div className="tc-modal-header">
          <h2>รายชื่อนักเรียน — {course.courseName}</h2>
          <button className="tc-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="tc-enroll-summary">
          <span>ทั้งหมด <strong>{enrollments.length}</strong> ราย</span>
          <span className="tc-enroll-summary-sep">·</span>
          <span>ชำระเงินแล้ว <strong className="tc-enroll-paid">{paidCount}</strong> ราย</span>
        </div>

        {errEnr && <div className="tc-modal-error">{errEnr}</div>}

        {loadingEnr ? (
          <p className="tc-modal-hint">กำลังโหลด...</p>
        ) : enrollments.length === 0 ? (
          <p className="tc-modal-hint">ยังไม่มีนักเรียนสมัครเรียนคอร์สนี้</p>
        ) : (
          <div className="tc-table-wrap">
            <table className="tc-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>รหัสสมัคร</th>
                  <th>ชื่อนักเรียน</th>
                  <th>วันที่สมัคร</th>
                  <th>สถานะชำระเงิน</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e, i) => (
                  <tr key={e.id}>
                    <td style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                    <td><span className="tc-table-code">{e.enrollmentCode || '-'}</span></td>
                    <td className="tc-table-name">{e.studentName || '-'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(e.enrollmentDate)}</td>
                    <td><PayBadge status={e.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="tc-modal-footer">
          <button onClick={onClose}>ปิด</button>
        </div>
      </div>
    </div>
  );
}

function CourseDetailModal({ course, onClose }) {
  return (
    <div className="tc-modal-overlay" onClick={onClose}>
      <div className="tc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tc-modal-header">
          <h2>รายละเอียดคอร์ส — {course.courseName}</h2>
          <button className="tc-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="tc-modal-section">
          <h3>ข้อมูลทั่วไป</h3>

          <p className="tc-modal-hint">{course.description || 'ไม่มีรายละเอียดคอร์ส'}</p>

          <div className="tc-card-info">
            <div>
              <span>รหัสคอร์ส</span>
              <strong>{course.courseCode}</strong>
            </div>

            <div>
              <span>สถานะ</span>
              <strong><StatusBadge status={course.status} /></strong>
            </div>

            <div>
              <span>ชั่วโมงเรียน</span>
              <strong>{course.totalHours || 0} ชั่วโมง</strong>
            </div>

            <div>
              <span>จำนวนนักเรียน</span>
              <strong>{course.enrolledCount || 0}/{course.seatLimit || 0} คน</strong>
            </div>

            <div>
              <span>ช่วงรับสมัคร</span>
              <strong>{formatDate(course.registrationStartDate)} - {formatDate(course.registrationEndDate)}</strong>
            </div>

            <div>
              <span>วันเริ่มเรียน</span>
              <strong>{formatDate(course.courseStartDate)}</strong>
            </div>

            <div>
              <span>ตารางสอน</span>
              <strong className="schedule-multiline">{formatScheduleDaysTH(course.scheduleDays)}</strong>
            </div>
          </div>

          {course.tutorRemark && (
            <p className="tc-modal-hint">หมายเหตุ: {course.tutorRemark}</p>
          )}
        </div>

        <div className="tc-modal-footer">
          <button onClick={onClose}>ปิด</button>
        </div>
      </div>
    </div>
  );
}
