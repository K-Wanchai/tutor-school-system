import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMyCourses, respondToCourse } from '../services/tutorCourseService';
import TestEditorModal from '../components/TestEditorModal';
import './TutorCoursesPage.css';

const STATUS_LABEL = {
  DRAFT:                 { label: 'รอการตอบรับ',  cls: 'tc-badge-draft' },
  OPEN_FOR_REGISTRATION: { label: 'เปิดรับสมัคร', cls: 'tc-badge-open' },
  CLOSED:                { label: 'ปิดรับสมัคร',  cls: 'tc-badge-closed' },
  ONGOING:               { label: 'กำลังสอน',      cls: 'tc-badge-ongoing' },
  COMPLETED:             { label: 'สอนจบ',          cls: 'tc-badge-completed' },
  CANCELLED:             { label: 'ถูกยกเลิก',      cls: 'tc-badge-cancelled' },
};

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] || { label: status, cls: '' };
  return <span className={`tc-badge ${s.cls}`}>{s.label}</span>;
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`tc-toast tc-toast-${type}`}>
      <span>{msg}</span><button onClick={onClose}>✕</button>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function emptyLesson(order) {
  return { lessonTitle: '', lessonContent: '', lessonOrder: order, tests: [] };
}

function emptyTest() {
  return { testTitle: '', testDescription: '' };
}

// กลุ่ม tests ตาม lessonOrder จาก API response
function groupTestsByLesson(lessons, tests) {
  return lessons.map(l => ({
    lessonTitle:   l.lessonTitle,
    lessonContent: l.lessonContent || '',
    lessonOrder:   l.lessonOrder,
    tests: (tests || [])
      .filter(t => t.lessonOrder === l.lessonOrder)
      .map(t => ({ testTitle: t.testTitle, testDescription: t.testDescription || '' })),
  }));
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TutorCoursesPage() {
  const [courses, setCourses]       = useState([]);
  const [keyword, setKeyword]       = useState('');
  const [filter, setFilter]         = useState('ALL');
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState(null);
  const [respondModal, setRespondModal] = useState(null); // { course, mode }
  const [lessons, setLessons]       = useState([]);   // [{ lessonTitle, lessonContent, lessonOrder, tests: [] }]
  const [remark, setRemark]         = useState('');
  const [saving, setSaving]         = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [editingTest, setEditingTest] = useState(null); // TestResponse object

  const notify = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyCourses();
      setCourses(data);
    } catch (e) {
      notify(e.message, 'error');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => courses.filter(c => {
    const text = `${c.courseName || ''} ${c.courseCode || ''}`.toLowerCase();
    return text.includes(keyword.toLowerCase()) && (filter === 'ALL' || c.status === filter);
  }), [courses, keyword, filter]);

  const pendingCount = courses.filter(c => c.status === 'DRAFT').length;

  // ── open modals ──────────────────────────────────────────────────────────────

  function openAccept(course) {
    setRespondModal({ course, mode: 'accept' });
    if (course.lessons?.length > 0) {
      setLessons(groupTestsByLesson(course.lessons, course.tests || []));
    } else {
      setLessons([emptyLesson(1)]);
    }
    setRemark('');
  }

  function openReject(course) {
    setRespondModal({ course, mode: 'reject' });
    setRemark('');
  }

  // ── lesson CRUD ──────────────────────────────────────────────────────────────

  function addLesson() {
    setLessons(ls => [...ls, emptyLesson(ls.length + 1)]);
  }

  function removeLesson(i) {
    setLessons(ls => ls.filter((_, idx) => idx !== i)
      .map((l, idx) => ({ ...l, lessonOrder: idx + 1 })));
  }

  function updateLesson(i, key, val) {
    setLessons(ls => ls.map((l, idx) => idx === i ? { ...l, [key]: val } : l));
  }

  // ── test CRUD (per lesson) ───────────────────────────────────────────────────

  function addTest(lessonIdx) {
    setLessons(ls => ls.map((l, idx) =>
      idx === lessonIdx ? { ...l, tests: [...l.tests, emptyTest()] } : l
    ));
  }

  function removeTest(lessonIdx, testIdx) {
    setLessons(ls => ls.map((l, idx) =>
      idx === lessonIdx
        ? { ...l, tests: l.tests.filter((_, ti) => ti !== testIdx) }
        : l
    ));
  }

  function updateTest(lessonIdx, testIdx, key, val) {
    setLessons(ls => ls.map((l, idx) =>
      idx === lessonIdx
        ? { ...l, tests: l.tests.map((t, ti) => ti === testIdx ? { ...t, [key]: val } : t) }
        : l
    ));
  }

  // ── submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!respondModal) return;
    const { course, mode } = respondModal;

    if (mode === 'accept') {
      if (lessons.find(l => !l.lessonTitle.trim())) {
        notify('กรุณากรอกชื่อบทเรียนให้ครบทุกบท', 'error'); return;
      }
    }
    if (mode === 'reject' && !remark.trim()) {
      notify('กรุณากรอกหมายเหตุสำหรับการปฏิเสธ', 'error'); return;
    }

    setSaving(true);
    try {
      // ส่ง lessons พร้อม nested tests ไปยัง backend
      const lessonsPayload = mode === 'accept'
        ? lessons
            .filter(l => l.lessonTitle.trim())
            .map(l => ({
              lessonTitle:   l.lessonTitle.trim(),
              lessonContent: l.lessonContent.trim(),
              lessonOrder:   l.lessonOrder,
              tests: l.tests.filter(t => t.testTitle.trim()).map(t => ({
                testTitle:       t.testTitle.trim(),
                testDescription: t.testDescription.trim(),
              })),
            }))
        : [];

      await respondToCourse({
        courseId: course.id,
        accepted: mode === 'accept',
        remark:   mode === 'reject' ? remark : null,
        lessons:  lessonsPayload,
        tests:    [],  // tests ถูกฝังใน lessons แล้ว
      });

      notify(mode === 'accept' ? 'ตอบรับคอร์สสำเร็จ! คอร์สถูกเปิดรับสมัครแล้ว' : 'ปฏิเสธคอร์สสำเร็จ');
      setRespondModal(null);
      load();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="tc-page">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="tc-header">
        <div>
          <h1>คอร์สของฉัน</h1>
          <p>จัดการคอร์สที่ได้รับมอบหมาย ตอบรับ หรือปฏิเสธ พร้อมกำหนดหลักสูตร</p>
        </div>
        <div className="tc-header-right">
          {pendingCount > 0 && (
            <div className="tc-pending-badge">⏳ รอการตอบรับ {pendingCount} คอร์ส</div>
          )}
          <button className="tc-btn-refresh" onClick={load}>รีเฟรช</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="tc-toolbar">
        <input type="text" placeholder="ค้นหาชื่อหรือรหัสคอร์ส..."
          value={keyword} onChange={e => setKeyword(e.target.value)} />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="ALL">ทุกสถานะ</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Course cards */}
      {loading ? (
        <div className="tc-loading">กำลังโหลดข้อมูล...</div>
      ) : filtered.length === 0 ? (
        <div className="tc-empty">
          <div className="tc-empty-icon">📚</div>
          <h3>ยังไม่มีคอร์สที่ตรงกัน</h3>
          <p>เมื่อแอดมินมอบหมายคอร์สให้คุณ จะปรากฏที่นี่</p>
        </div>
      ) : (
        <div className="tc-grid">
          {filtered.map(course => (
            <div key={course.id} className={`tc-card${course.status === 'DRAFT' ? ' tc-card-pending' : ''}`}>
              <div className="tc-card-top">
                <span className="tc-code">{course.courseCode}</span>
                <StatusBadge status={course.status} />
              </div>
              <h2 className="tc-card-title">{course.courseName}</h2>
              <p className="tc-card-desc">{course.description || 'ไม่มีรายละเอียด'}</p>
              <div className="tc-card-info">
                <div><span>วันเริ่มสอน</span><strong>{course.courseStartDate || '—'}</strong></div>
                <div><span>ที่นั่ง</span><strong>{course.seatLimit} คน</strong></div>
                <div><span>ชั่วโมงรวม</span><strong>{course.totalHours} ชม.</strong></div>
                <div><span>ผู้สมัคร</span><strong>{course.enrolledCount || 0} คน</strong></div>
              </div>
              {course.lessons?.length > 0 && (
                <div className="tc-curriculum-summary">
                  📖 {course.lessons.length} บทเรียน
                  {course.tests?.length > 0 && ` · 📝 ${course.tests.length} แบบทดสอบ`}
                </div>
              )}
              {course.tutorRemark && (
                <div className="tc-remark">หมายเหตุ: {course.tutorRemark}</div>
              )}

              {/* แบบทดสอบ — แสดงเฉพาะคอร์สที่ตอบรับแล้ว */}
              {course.status !== 'DRAFT' && course.tests?.length > 0 && (
                <div className="tc-tests-chips">
                  <span className="tc-tests-chips-label">📝 แบบทดสอบ</span>
                  {course.tests.map(t => (
                    <button
                      key={t.id}
                      className="tc-test-chip"
                      onClick={() => setEditingTest(t)}
                      title="คลิกเพื่อแก้ไขข้อสอบ"
                    >
                      {t.testTitle}
                    </button>
                  ))}
                </div>
              )}

              <div className="tc-card-actions">
                <button className="tc-btn-detail" onClick={() => setDetailModal(course)}>ดูรายละเอียด</button>
                {course.status === 'DRAFT' && (
                  <>
                    <button className="tc-btn-accept" onClick={() => openAccept(course)}>✓ ตอบรับ</button>
                    <button className="tc-btn-reject" onClick={() => openReject(course)}>✕ ปฏิเสธ</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ RESPOND MODAL ═══ */}
      {respondModal && (
        <div className="tc-overlay" onClick={() => setRespondModal(null)}>
          <div className="tc-modal" onClick={e => e.stopPropagation()}>
            <div className="tc-modal-header">
              <h2>{respondModal.mode === 'accept' ? '✓ ตอบรับคอร์ส' : '✕ ปฏิเสธคอร์ส'}</h2>
              <button className="tc-modal-close" onClick={() => setRespondModal(null)}>✕</button>
            </div>

            <div className="tc-modal-body">
              {/* course info */}
              <div className="tc-course-info-box">
                <strong>{respondModal.course.courseCode}</strong> — {respondModal.course.courseName}
                <br /><small>วันเริ่มสอน: {respondModal.course.courseStartDate} · ที่นั่ง: {respondModal.course.seatLimit} คน</small>
              </div>

              {respondModal.mode === 'accept' ? (
                <>
                  <div className="tc-section-head-row">
                    <h3 className="tc-section-title">บทเรียนและแบบทดสอบ</h3>
                    <button className="tc-btn-add-lesson" onClick={addLesson}>+ เพิ่มบทเรียน</button>
                  </div>

                  {lessons.length === 0 && (
                    <p className="tc-hint">กด "+ เพิ่มบทเรียน" เพื่อเริ่มกำหนดหลักสูตร</p>
                  )}

                  {lessons.map((lesson, li) => (
                    <div key={li} className="tc-lesson-block">
                      {/* lesson header */}
                      <div className="tc-lesson-block-header">
                        <span className="tc-lesson-num-badge">บทที่ {li + 1}</span>
                        <button className="tc-btn-remove-lesson" onClick={() => removeLesson(li)} title="ลบบทเรียน">✕</button>
                      </div>

                      {/* lesson fields */}
                      <div className="tc-lesson-fields">
                        <input
                          className="tc-lesson-input"
                          placeholder="ชื่อบทเรียน *"
                          value={lesson.lessonTitle}
                          onChange={e => updateLesson(li, 'lessonTitle', e.target.value)}
                        />
                        <input
                          className="tc-lesson-input tc-lesson-input--secondary"
                          placeholder="เนื้อหา (ไม่บังคับ)"
                          value={lesson.lessonContent}
                          onChange={e => updateLesson(li, 'lessonContent', e.target.value)}
                        />
                      </div>

                      {/* tests of this lesson */}
                      <div className="tc-tests-area">
                        <div className="tc-tests-header">
                          <span className="tc-tests-label">📝 แบบทดสอบของบทนี้</span>
                          <button className="tc-btn-add-test" onClick={() => addTest(li)}>+ เพิ่มแบบทดสอบ</button>
                        </div>

                        {lesson.tests.length === 0 ? (
                          <p className="tc-tests-empty">ยังไม่มีแบบทดสอบในบทนี้</p>
                        ) : (
                          <div className="tc-tests-list">
                            {lesson.tests.map((test, ti) => (
                              <div key={ti} className="tc-test-row">
                                <span className="tc-test-num">ข้อ {ti + 1}</span>
                                <div className="tc-test-fields">
                                  <input
                                    placeholder="ชื่อแบบทดสอบ *"
                                    value={test.testTitle}
                                    onChange={e => updateTest(li, ti, 'testTitle', e.target.value)}
                                  />
                                  <input
                                    placeholder="คำอธิบาย (ไม่บังคับ)"
                                    value={test.testDescription}
                                    onChange={e => updateTest(li, ti, 'testDescription', e.target.value)}
                                  />
                                </div>
                                <button className="tc-btn-remove-test" onClick={() => removeTest(li, ti)}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="tc-section">
                  <label className="tc-label">หมายเหตุ (เหตุผลที่ปฏิเสธ) *</label>
                  <textarea rows={4} placeholder="กรุณาระบุเหตุผลที่ปฏิเสธคอร์สนี้..."
                    value={remark} onChange={e => setRemark(e.target.value)} />
                </div>
              )}

              <div className="tc-modal-actions">
                <button className="tc-btn-cancel" onClick={() => setRespondModal(null)}>ยกเลิก</button>
                <button
                  className={respondModal.mode === 'accept' ? 'tc-btn-confirm-accept' : 'tc-btn-confirm-reject'}
                  disabled={saving} onClick={handleSubmit}
                >
                  {saving ? 'กำลังบันทึก...' : respondModal.mode === 'accept' ? 'ยืนยันตอบรับ' : 'ยืนยันปฏิเสธ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DETAIL MODAL ═══ */}
      {detailModal && (
        <div className="tc-overlay" onClick={() => setDetailModal(null)}>
          <div className="tc-modal tc-modal-detail" onClick={e => e.stopPropagation()}>
            <div className="tc-modal-header">
              <h2>รายละเอียดคอร์ส</h2>
              <button className="tc-modal-close" onClick={() => setDetailModal(null)}>✕</button>
            </div>
            <div className="tc-modal-body">
              <div className="tc-detail-top">
                <span className="tc-code">{detailModal.courseCode}</span>
                <StatusBadge status={detailModal.status} />
              </div>
              <h3>{detailModal.courseName}</h3>
              <p className="tc-detail-desc">{detailModal.description || 'ไม่มีรายละเอียด'}</p>
              <div className="tc-detail-grid">
                <div><label>วันเริ่มสอน</label><span>{detailModal.courseStartDate || '—'}</span></div>
                <div><label>เปิดรับสมัคร</label><span>{detailModal.registrationStartDate || '—'}</span></div>
                <div><label>จำนวนที่นั่ง</label><span>{detailModal.seatLimit} คน</span></div>
                <div><label>ชั่วโมงรวม</label><span>{detailModal.totalHours} ชม.</span></div>
                <div><label>ผู้สมัคร</label><span>{detailModal.enrolledCount || 0} คน</span></div>
                <div><label>วันปิดรับสมัคร</label><span>{detailModal.registrationEndDate || '—'}</span></div>
              </div>

              {/* show lessons with their tests */}
              {detailModal.lessons?.length > 0 && (
                <div className="tc-curriculum-block">
                  <h4>บทเรียนและแบบทดสอบ</h4>
                  {detailModal.lessons.map(l => {
                    const lessonTests = (detailModal.tests || []).filter(t => t.lessonOrder === l.lessonOrder);
                    return (
                      <div key={l.id} className="tc-detail-lesson">
                        <div className="tc-lesson-item">
                          <span className="tc-lesson-num">บทที่ {l.lessonOrder}</span>
                          <div>
                            <strong>{l.lessonTitle}</strong>
                            {l.lessonContent && <p>{l.lessonContent}</p>}
                          </div>
                        </div>
                        {lessonTests.length > 0 && (
                          <div className="tc-detail-tests">
                            {lessonTests.map((t, ti) => (
                              <div key={t.id} className="tc-detail-test-item">
                                <span className="tc-test-num-sm">ข้อ {ti + 1}</span>
                                <span>{t.testTitle}</span>
                                {t.testDescription && <small>{t.testDescription}</small>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TEST EDITOR MODAL ═══ */}
      {editingTest && (
        <TestEditorModal
          test={editingTest}
          onClose={() => setEditingTest(null)}
        />
      )}
    </div>
  );
}
