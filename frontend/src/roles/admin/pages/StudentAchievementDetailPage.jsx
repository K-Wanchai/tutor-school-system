import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentAchievementDetail } from '../services/studentExamAchievementService';
import './StudentAchievementDetailPage.css';

const LEVEL_LABEL = {
  LOWER_SECONDARY: 'มัธยมต้น',
  UPPER_SECONDARY: 'มัธยมปลาย',
  BACHELOR: 'มหาวิทยาลัย / ป.ตรี',
  OTHER: 'อื่น ๆ',
};

const ENROLLMENT_STATUS_LABEL = {
  PENDING: 'รอดำเนินการ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ปฏิเสธ',
  CANCELLED: 'ยกเลิก',
  COMPLETED: 'เสร็จสิ้น',
};

const ENROLLMENT_STATUS_TONE = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'default',
  COMPLETED: 'info',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function DetailRow({ label, value }) {
  return (
    <div className="sad-detail-row">
      <span className="sad-detail-row-label">{label}</span>
      <span className="sad-detail-row-value">{value || '—'}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const tone = ENROLLMENT_STATUS_TONE[status] || 'default';
  return (
    <span className={`sad-badge sad-badge--${tone}`}>
      <span className="sad-badge-dot" />
      {ENROLLMENT_STATUS_LABEL[status] || status || '—'}
    </span>
  );
}

function levelDetailRows(achievement) {
  if (achievement.educationLevel === 'LOWER_SECONDARY') {
    return [{ label: 'ห้องเรียน', value: achievement.schoolTrackName }];
  }
  if (achievement.educationLevel === 'UPPER_SECONDARY') {
    return [{ label: 'สายการเรียน', value: achievement.schoolTrackName }];
  }
  if (achievement.educationLevel === 'BACHELOR') {
    return [
      { label: 'คณะ', value: achievement.facultyName },
      { label: 'สาขา', value: achievement.majorName },
    ];
  }
  return [];
}

export default function StudentAchievementDetailPage() {
  const { achievementId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getStudentAchievementDetail(achievementId);
      setData(result);
    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลรายละเอียดผลการสอบติดได้');
    } finally {
      setLoading(false);
    }
  }, [achievementId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="sad-page">
        <div className="sad-loading">
          <div className="sad-spinner" />
          <span>กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="sad-page">
        <div className="sad-error-card">
          <p className="sad-error-title">โหลดข้อมูลไม่สำเร็จ</p>
          <p className="sad-error-msg">{error || 'ไม่พบข้อมูล'}</p>
          <div className="sad-error-actions">
            <button className="sad-btn sad-btn--ghost" onClick={() => navigate(-1)}>← ย้อนกลับ</button>
            <button className="sad-btn sad-btn--primary" onClick={load}>ลองใหม่</button>
          </div>
        </div>
      </div>
    );
  }

  const { achievement, enrollments } = data;

  return (
    <div className="sad-page">
      {/* ── Header ── */}
      <div className="sad-header">
        <button className="sad-btn sad-btn--ghost" onClick={() => navigate(-1)}>← ย้อนกลับ</button>
        <div className="sad-header-main">
          <h1 className="sad-title">{achievement.studentName}</h1>
          <div className="sad-meta-row">
            <span className="sad-meta-item sad-meta-item--primary">
              {achievement.educationLevelLabel || LEVEL_LABEL[achievement.educationLevel]}
            </span>
            <span className="sad-meta-item">{achievement.institutionName}</span>
          </div>
        </div>
      </div>

      {/* ── ผลสอบติด ── */}
      <div className="sad-card">
        <h2 className="sad-card-title">ผลสอบติด</h2>
        <div className="sad-detail-rows">
          <DetailRow label="สถาบัน" value={`${achievement.institutionName} (${achievement.institutionCode})`} />
          <DetailRow
            label="ระดับที่สอบติด"
            value={achievement.educationLevelLabel || LEVEL_LABEL[achievement.educationLevel]}
          />
          {levelDetailRows(achievement).map((row) => (
            <DetailRow key={row.label} label={row.label} value={row.value} />
          ))}
          <DetailRow label="รอบที่สอบติด" value={achievement.admissionRoundName} />
          <DetailRow label="ปีการศึกษา" value={achievement.academicYear} />
          <DetailRow label="วันที่ประกาศผล" value={formatDate(achievement.resultDate)} />
          <DetailRow label="หมายเหตุ" value={achievement.note} />
        </div>
      </div>

      {/* ── ข้อมูลนักเรียน ── */}
      <div className="sad-card">
        <h2 className="sad-card-title">ข้อมูลนักเรียน</h2>
        <div className="sad-detail-rows">
          <DetailRow label="ชื่อ" value={achievement.studentName} />
          <DetailRow label="รหัสนักเรียน" value={achievement.studentCode} />
          <DetailRow label="Email" value={achievement.studentEmail} />
          <DetailRow label="เบอร์โทร" value={achievement.studentPhone} />
        </div>
      </div>

      {/* ── คอร์สที่เคยเรียน ── */}
      <div className="sad-section">
        <h2 className="sad-section-title">คอร์สที่เคยเรียน</h2>

        {enrollments.length === 0 ? (
          <div className="sad-empty">
            <p>นักเรียนคนนี้ยังไม่เคยลงทะเบียนเรียนคอร์สใด</p>
          </div>
        ) : (
          <div className="sad-course-list">
            {enrollments.map((e) => (
              <div key={e.enrollmentId} className="sad-course-card">
                <div className="sad-course-header">
                  <div>
                    <span className="sad-code-badge">{e.courseCode}</span>
                    <h3 className="sad-course-name">{e.courseName}</h3>
                  </div>
                  <StatusBadge status={e.enrollmentStatus} />
                </div>

                <div className="sad-course-meta">
                  <span>ผู้สอน: {e.tutor?.tutorName || '—'}</span>
                  <span>วันที่สมัคร: {formatDateTime(e.enrolledAt)}</span>
                </div>

                {e.lessons && e.lessons.length > 0 ? (
                  <div className="sad-lessons">
                    <div className="sad-lessons-title">บทเรียน / หลักสูตร</div>
                    <div className="sad-lessons-table-wrap">
                      <table className="sad-lessons-table">
                        <thead>
                          <tr>
                            <th>ลำดับ</th>
                            <th>ชื่อบทเรียน</th>
                            <th>รายละเอียด</th>
                          </tr>
                        </thead>
                        <tbody>
                          {e.lessons.map((l) => (
                            <tr key={l.lessonId}>
                              <td>{l.lessonOrder}</td>
                              <td className="sad-lesson-title">{l.lessonTitle}</td>
                              <td>{l.lessonDescription || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="sad-no-lessons">ยังไม่มีบทเรียนในคอร์สนี้</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
