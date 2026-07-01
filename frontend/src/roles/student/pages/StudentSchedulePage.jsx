import { useEffect, useMemo, useState } from 'react';
import { getMySchedule } from '../services/studentScheduleService';
import './StudentSchedulePage.css';

const FILTERS = [
  { key: 'ALL', label: 'ทั้งหมด' },
  { key: 'TODAY', label: 'วันนี้' },
  { key: 'THIS_WEEK', label: 'สัปดาห์นี้' },
  { key: 'UPCOMING', label: 'กำลังจะมาถึง' },
  { key: 'COMPLETED', label: 'เรียนจบแล้ว' },
  { key: 'CANCELLED', label: 'ยกเลิกแล้ว' },
];

const STATUS_LABELS = {
  SCHEDULED: 'รอตารางเรียน',
  UPCOMING: 'กำลังจะถึง',
  ONGOING: 'กำลังเรียน',
  COMPLETED: 'เรียนเสร็จแล้ว',
  CANCELLED: 'ยกเลิก',
  CLOSED: 'ปิดห้องเรียนแล้ว',
};

function safeText(value) {
  return value === null || value === undefined || value === '' ? '-' : value;
}

function formatDate(dateValue) {
  if (!dateValue) return '-';

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

function formatShortDate(dateValue) {
  if (!dateValue) return '-';

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(timeValue) {
  if (!timeValue) return '-';

  if (typeof timeValue === 'string') {
    return timeValue.slice(0, 5);
  }

  return '-';
}

function formatDateTime(dateTimeValue) {
  if (!dateTimeValue) return '-';

  const date = new Date(dateTimeValue);

  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusLabel(status) {
  if (!status) return '-';
  return STATUS_LABELS[status] || status;
}

function getStatusClass(status) {
  const normalized = String(status || '').toLowerCase();
  return `ssp-status ssp-status-${normalized || 'unknown'}`;
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseScheduleDate(dateValue) {
  if (!dateValue) return null;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function getScheduleDateKey(schedule) {
  return schedule.scheduleDate || '';
}

function getScheduleEndDateTime(schedule) {
  if (!schedule.scheduleDate || !schedule.endTime) {
    return parseScheduleDate(schedule.scheduleDate);
  }

  const dateTime = new Date(`${schedule.scheduleDate}T${schedule.endTime}`);

  if (Number.isNaN(dateTime.getTime())) {
    return parseScheduleDate(schedule.scheduleDate);
  }

  return dateTime;
}

function isToday(schedule) {
  return getScheduleDateKey(schedule) === getLocalDateKey();
}

function isThisWeek(schedule) {
  const date = parseScheduleDate(schedule.scheduleDate);
  if (!date) return false;

  const now = new Date();

  const startOfWeek = new Date(now);
  const currentDay = startOfWeek.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  return date >= startOfWeek && date < endOfWeek;
}

function isCancelled(schedule) {
  return schedule.status === 'CANCELLED';
}

function isCompleted(schedule) {
  const status = schedule.status;

  if (status === 'COMPLETED' || status === 'CLOSED') {
    return true;
  }

  const endDateTime = getScheduleEndDateTime(schedule);

  return endDateTime ? endDateTime < new Date() : false;
}

function isUpcoming(schedule) {
  if (isCancelled(schedule) || isCompleted(schedule)) {
    return false;
  }

  if (schedule.status === 'SCHEDULED' || schedule.status === 'UPCOMING' || schedule.status === 'ONGOING') {
    return true;
  }

  const endDateTime = getScheduleEndDateTime(schedule);

  return endDateTime ? endDateTime >= new Date() : false;
}

function canJoinClass(schedule) {
  const joinableStatuses = ['SCHEDULED', 'UPCOMING', 'ONGOING'];

  return (
    joinableStatuses.includes(schedule.status) &&
    (schedule.classroomSessionId || schedule.sessionCode)
  );
}

function normalizeSchedule(item) {
  return {
    id: item.id,
    scheduleCode: item.scheduleCode || item.code || item.schedule_code,
    courseId: item.courseId || item.course?.id,
    courseName: item.courseName || item.course?.courseName || item.course?.name,
    lessonId: item.lessonId || item.lesson?.id,
    lessonTitle: item.lessonTitle || item.lesson?.lessonTitle || item.lesson?.title || item.lessonName,
    tutorName:
      item.tutorName ||
      item.tutor?.fullName ||
      item.tutor?.name ||
      item.teacherName ||
      item.teacher?.fullName,
    scheduleDate: item.scheduleDate || item.date || item.classDate,
    startTime: item.startTime || item.start_time,
    endTime: item.endTime || item.end_time,
    status: item.status,
    classroomSessionId: item.classroomSessionId || item.sessionId || item.classroomSession?.id,
    sessionCode: item.sessionCode || item.classroomSession?.sessionCode,
    meetingUrl: item.meetingUrl || item.onlineUrl || item.classroomSession?.meetingUrl,
    location: item.location || item.roomName || item.room,
    note: item.note || item.remark,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function getErrorMessage(err) {
  const status = err?.response?.status;

  if (status === 401) {
    return 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
  }

  if (status === 403) {
    return 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้';
  }

  if (status === 500) {
    return 'เกิดข้อผิดพลาดจากระบบ กรุณาลองใหม่อีกครั้ง';
  }

  return err?.response?.data?.message || err?.message || 'ไม่สามารถโหลดตารางเรียนได้';
}

export default function StudentSchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [toast, setToast] = useState({ type: '', msg: '' });

  function showToast(type, msg) {
    setToast({ type, msg });

    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      setToast({ type: '', msg: '' });
    }, 3000);
  }

  useEffect(() => {
    let mounted = true;

    async function loadSchedule() {
      try {
        setLoading(true);
        setError('');

        const data = await getMySchedule();
        const list = Array.isArray(data) ? data : data?.content || [];

        const normalized = list.map(normalizeSchedule);

        if (!mounted) return;

        setSchedules(normalized);

        if (normalized.length > 0) {
          showToast('success', 'โหลดตารางเรียนสำเร็จ');
        }
      } catch (err) {
        if (!mounted) return;

        const message = getErrorMessage(err);
        setError(message);
        showToast('error', message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSchedule();

    return () => {
      mounted = false;
      window.clearTimeout(showToast.timer);
    };
  }, []);

  const summary = useMemo(() => {
    return {
      total: schedules.length,
      today: schedules.filter(isToday).length,
      upcoming: schedules.filter(isUpcoming).length,
      cancelled: schedules.filter(isCancelled).length,
    };
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    switch (activeFilter) {
      case 'TODAY':
        return schedules.filter(isToday);
      case 'THIS_WEEK':
        return schedules.filter(isThisWeek);
      case 'UPCOMING':
        return schedules.filter(isUpcoming);
      case 'COMPLETED':
        return schedules.filter(isCompleted);
      case 'CANCELLED':
        return schedules.filter(isCancelled);
      case 'ALL':
      default:
        return schedules;
    }
  }, [activeFilter, schedules]);

  function handleJoinClass() {
    alert('ฟีเจอร์เข้าเรียนจะพัฒนาในขั้นตอนถัดไป');
  }

  function handleOpenMeeting(url) {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="ssp-page">
      {toast.msg && (
        <div className={`ssp-toast ssp-toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      <section className="ssp-hero-card">
        <div>
          <p className="ssp-eyebrow">Student Schedule</p>
          <h1>ตารางเรียนของฉัน</h1>
          <p>
            ดูวัน เวลา สถานที่เรียน และรายละเอียดห้องเรียนของคอร์สที่คุณลงทะเบียนไว้
          </p>
        </div>

        <div className="ssp-hero-icon" aria-hidden="true">
          📅
        </div>
      </section>

      <section className="ssp-summary-grid">
        <div className="ssp-summary-card">
          <span>ตารางเรียนทั้งหมด</span>
          <strong>{summary.total}</strong>
        </div>

        <div className="ssp-summary-card">
          <span>วันนี้</span>
          <strong>{summary.today}</strong>
        </div>

        <div className="ssp-summary-card">
          <span>กำลังจะมาถึง</span>
          <strong>{summary.upcoming}</strong>
        </div>

        <div className="ssp-summary-card">
          <span>ยกเลิกแล้ว</span>
          <strong>{summary.cancelled}</strong>
        </div>
      </section>

      <section className="ssp-content-card">
        <div className="ssp-section-header">
          <div>
            <h2>รายการตารางเรียน</h2>
            <p>กรองตารางเรียนตามช่วงเวลาและสถานะ</p>
          </div>
        </div>

        <div className="ssp-filter-tabs">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={activeFilter === filter.key ? 'ssp-filter-active' : ''}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="ssp-loading">
            <div className="ssp-spinner" />
            <p>กำลังโหลดตารางเรียน...</p>
          </div>
        )}

        {!loading && error && (
          <div className="ssp-error-box">
            <strong>เกิดข้อผิดพลาด</strong>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filteredSchedules.length === 0 && (
          <div className="ssp-empty-state">
            <div className="ssp-empty-icon">🗓️</div>
            <h3>ยังไม่มีตารางเรียน</h3>
            <p>
              เมื่อลงทะเบียนคอร์สและมีการจัดตารางเรียน รายการจะแสดงที่หน้านี้
            </p>
          </div>
        )}

        {!loading && !error && filteredSchedules.length > 0 && (
          <div className="ssp-schedule-grid">
            {filteredSchedules.map((schedule) => (
              <article key={schedule.id || schedule.scheduleCode} className="ssp-schedule-card">
                <div className="ssp-card-top">
                  <div>
                    <p className="ssp-card-date">
                      {formatShortDate(schedule.scheduleDate)}
                    </p>
                    <h3>{safeText(schedule.courseName)}</h3>
                    <p className="ssp-lesson-title">
                      {safeText(schedule.lessonTitle)}
                    </p>
                  </div>

                  <span className={getStatusClass(schedule.status)}>
                    {getStatusLabel(schedule.status)}
                  </span>
                </div>

                <div className="ssp-info-list">
                  <div>
                    <span>ติวเตอร์</span>
                    <strong>{safeText(schedule.tutorName)}</strong>
                  </div>

                  <div>
                    <span>เวลาเรียน</span>
                    <strong>
                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                    </strong>
                  </div>

                  <div>
                    <span>สถานที่</span>
                    <strong>{safeText(schedule.location)}</strong>
                  </div>

                  <div>
                    <span>รหัสห้องเรียน</span>
                    <strong>{safeText(schedule.sessionCode)}</strong>
                  </div>
                </div>

                {schedule.note && (
                  <div className="ssp-note">
                    <span>หมายเหตุ:</span> {schedule.note}
                  </div>
                )}

                <div className="ssp-card-actions">
                  <button
                    type="button"
                    className="ssp-btn ssp-btn-outline"
                    onClick={() => setSelectedSchedule(schedule)}
                  >
                    ดูรายละเอียด
                  </button>

                  {canJoinClass(schedule) && (
                    <button
                      type="button"
                      className="ssp-btn ssp-btn-primary"
                      onClick={handleJoinClass}
                    >
                      เข้าเรียน
                    </button>
                  )}

                  {schedule.meetingUrl && (
                    <button
                      type="button"
                      className="ssp-btn ssp-btn-soft"
                      onClick={() => handleOpenMeeting(schedule.meetingUrl)}
                    >
                      เปิดลิงก์เรียนออนไลน์
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedSchedule && (
        <div className="ssp-modal-backdrop" onClick={() => setSelectedSchedule(null)}>
          <div className="ssp-modal" onClick={(event) => event.stopPropagation()}>
            <div className="ssp-modal-header">
              <div>
                <p>รายละเอียดตารางเรียน</p>
                <h2>{safeText(selectedSchedule.courseName)}</h2>
              </div>

              <button
                type="button"
                className="ssp-modal-close"
                onClick={() => setSelectedSchedule(null)}
                aria-label="ปิดหน้าต่างรายละเอียด"
              >
                ×
              </button>
            </div>

            <div className="ssp-modal-body">
              <DetailItem label="รหัสตารางเรียน" value={safeText(selectedSchedule.scheduleCode)} />
              <DetailItem label="ชื่อคอร์ส" value={safeText(selectedSchedule.courseName)} />
              <DetailItem label="บทเรียน" value={safeText(selectedSchedule.lessonTitle)} />
              <DetailItem label="ติวเตอร์" value={safeText(selectedSchedule.tutorName)} />
              <DetailItem label="วันที่เรียน" value={formatDate(selectedSchedule.scheduleDate)} />
              <DetailItem
                label="เวลาเรียน"
                value={`${formatTime(selectedSchedule.startTime)} - ${formatTime(selectedSchedule.endTime)}`}
              />
              <DetailItem label="สถานะ" value={getStatusLabel(selectedSchedule.status)} />
              <DetailItem
                label="Classroom Session ID"
                value={safeText(selectedSchedule.classroomSessionId)}
              />
              <DetailItem label="Session Code" value={safeText(selectedSchedule.sessionCode)} />

              <div className="ssp-detail-item">
                <span>ลิงก์เรียนออนไลน์</span>
                {selectedSchedule.meetingUrl ? (
                  <a
                    href={selectedSchedule.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {selectedSchedule.meetingUrl}
                  </a>
                ) : (
                  <strong>-</strong>
                )}
              </div>

              <DetailItem label="สถานที่" value={safeText(selectedSchedule.location)} />
              <DetailItem label="หมายเหตุ" value={safeText(selectedSchedule.note)} />
              <DetailItem label="สร้างเมื่อ" value={formatDateTime(selectedSchedule.createdAt)} />
              <DetailItem label="แก้ไขล่าสุด" value={formatDateTime(selectedSchedule.updatedAt)} />
            </div>

            <div className="ssp-modal-footer">
              <button
                type="button"
                className="ssp-btn ssp-btn-outline"
                onClick={() => setSelectedSchedule(null)}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="ssp-detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}