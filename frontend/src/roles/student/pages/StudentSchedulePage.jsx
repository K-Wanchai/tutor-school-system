import { useEffect, useMemo, useState } from 'react';
import { getMySchedule } from '../services/studentScheduleService';
import './StudentSchedulePage.css';

const DAY_LABELS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

const STATUS_LABELS = {
  SCHEDULED: 'รอตารางเรียน',
  UPCOMING: 'กำลังจะถึง',
  ONGOING: 'กำลังเรียน',
  COMPLETED: 'เรียนเสร็จแล้ว',
  CANCELLED: 'ยกเลิก',
  CLOSED: 'ปิดห้องเรียนแล้ว',
};

const DEFAULT_RANGE_START = 8 * 60;
const DEFAULT_RANGE_END = 20 * 60;
const PX_PER_MIN = 1.2;

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

function getTimetableEventClass(status) {
  const normalized = String(status || '').toLowerCase();
  return `ssp-tt-event ssp-tt-event-${normalized || 'unknown'}`;
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getStartOfWeek(date = new Date()) {
  const start = new Date(date);
  const currentDay = start.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  start.setDate(start.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  return start;
}

function parseScheduleDate(dateValue) {
  if (!dateValue) return null;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function parseTimeToMinutes(timeValue) {
  if (!timeValue || typeof timeValue !== 'string') return null;

  const [h, m] = timeValue.split(':');
  const hours = Number(h);
  const minutes = Number(m);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  return hours * 60 + minutes;
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
    cancelReason: item.cancelReason,
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

function formatWeekRangeLabel(startDate) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const startLabel = startDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  const endLabel = endDate.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `${startLabel} - ${endLabel}`;
}

function clusterByOverlap(sortedEvents) {
  const clusters = [];
  let current = [];
  let currentEnd = -Infinity;

  sortedEvents.forEach((ev) => {
    if (current.length === 0 || ev.startMin < currentEnd) {
      current.push(ev);
      currentEnd = Math.max(currentEnd, ev.endMin);
    } else {
      clusters.push(current);
      current = [ev];
      currentEnd = ev.endMin;
    }
  });

  if (current.length > 0) clusters.push(current);

  return clusters;
}

function assignLanes(cluster) {
  const laneEnds = [];
  const withLanes = [];

  cluster.forEach((ev) => {
    let lane = laneEnds.findIndex((end) => end <= ev.startMin);

    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(ev.endMin);
    } else {
      laneEnds[lane] = ev.endMin;
    }

    withLanes.push({ ...ev, lane });
  });

  return { events: withLanes, laneCount: laneEnds.length };
}

function layoutDayEvents(dayEvents, rangeStart, pxPerMin) {
  const withMinutes = dayEvents
    .map((ev) => {
      const startMin = parseTimeToMinutes(ev.startTime);
      const endMin = parseTimeToMinutes(ev.endTime);

      return {
        ...ev,
        startMin: startMin === null ? rangeStart : startMin,
        endMin: endMin === null ? (startMin === null ? rangeStart + 45 : startMin + 45) : endMin,
      };
    })
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const clusters = clusterByOverlap(withMinutes);
  const positioned = [];

  clusters.forEach((cluster) => {
    const { events, laneCount } = assignLanes(cluster);
    const widthPercent = 100 / laneCount;

    events.forEach((ev) => {
      positioned.push({
        ...ev,
        top: (ev.startMin - rangeStart) * pxPerMin,
        height: Math.max((ev.endMin - ev.startMin) * pxPerMin, 32),
        left: `${ev.lane * widthPercent}%`,
        width: `calc(${widthPercent}% - 4px)`,
      });
    });
  });

  return positioned;
}

export default function StudentSchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [toast, setToast] = useState({ type: '', msg: '' });
  const [now, setNow] = useState(() => new Date());

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

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const summary = useMemo(() => {
    return {
      total: schedules.length,
      today: schedules.filter(isToday).length,
      upcoming: schedules.filter(isUpcoming).length,
      cancelled: schedules.filter(isCancelled).length,
    };
  }, [schedules]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);

      return {
        key: getLocalDateKey(date),
        date,
        label: DAY_LABELS[i],
        dateLabel: date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
      };
    });
  }, [weekStart]);

  const timeRange = useMemo(() => {
    let start = DEFAULT_RANGE_START;
    let end = DEFAULT_RANGE_END;

    schedules.forEach((s) => {
      const startMin = parseTimeToMinutes(s.startTime);
      const endMin = parseTimeToMinutes(s.endTime);

      if (startMin !== null) start = Math.min(start, startMin);
      if (endMin !== null) end = Math.max(end, endMin);
    });

    start = Math.floor(start / 60) * 60;
    end = Math.ceil(end / 60) * 60;

    return { start, end };
  }, [schedules]);

  const totalHeightPx = (timeRange.end - timeRange.start) * PX_PER_MIN;

  const hourMarks = useMemo(() => {
    const marks = [];

    for (let m = timeRange.start; m <= timeRange.end; m += 60) {
      marks.push({
        minutes: m,
        top: (m - timeRange.start) * PX_PER_MIN,
        label: `${String(Math.floor(m / 60)).padStart(2, '0')}:00`,
      });
    }

    return marks;
  }, [timeRange]);

  const scheduleByDay = useMemo(() => {
    const map = {};

    weekDays.forEach((day) => {
      const dayEvents = schedules.filter((s) => getScheduleDateKey(s) === day.key);
      map[day.key] = layoutDayEvents(dayEvents, timeRange.start, PX_PER_MIN);
    });

    return map;
  }, [schedules, weekDays, timeRange]);

  const todayKey = getLocalDateKey(now);

  const nowOffset = useMemo(() => {
    const minutes = now.getHours() * 60 + now.getMinutes();

    if (minutes < timeRange.start || minutes > timeRange.end) return null;

    return (minutes - timeRange.start) * PX_PER_MIN;
  }, [now, timeRange]);

  function handlePrevWeek() {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  }

  function handleNextWeek() {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  }

  function handleToday() {
    setWeekStart(getStartOfWeek(new Date()));
  }

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
        <div className="ssp-timetable-toolbar">
          <div className="ssp-timetable-nav">
            <button type="button" onClick={handlePrevWeek} aria-label="สัปดาห์ก่อนหน้า">
              ‹
            </button>
            <button type="button" className="ssp-timetable-today-btn" onClick={handleToday}>
              วันนี้
            </button>
            <button type="button" onClick={handleNextWeek} aria-label="สัปดาห์ถัดไป">
              ›
            </button>
          </div>

          <div className="ssp-timetable-range">{formatWeekRangeLabel(weekStart)}</div>
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

        {!loading && !error && schedules.length === 0 && (
          <div className="ssp-empty-state">
            <div className="ssp-empty-icon">🗓️</div>
            <h3>ยังไม่มีตารางเรียน</h3>
            <p>
              เมื่อลงทะเบียนคอร์สและมีการจัดตารางเรียน รายการจะแสดงที่หน้านี้
            </p>
          </div>
        )}

        {!loading && !error && schedules.length > 0 && (
          <div className="ssp-timetable-scroll">
            <div className="ssp-timetable-grid">
              <div className="ssp-tt-corner" />

              {weekDays.map((day) => (
                <div
                  key={day.key}
                  className={`ssp-tt-daycol-header ${day.key === todayKey ? 'ssp-tt-today' : ''}`}
                >
                  <span className="ssp-tt-day-name">{day.label}</span>
                  <span className="ssp-tt-day-date">{day.dateLabel}</span>
                </div>
              ))}

              <div className="ssp-tt-timeaxis" style={{ height: totalHeightPx }}>
                {hourMarks.map((mark) => (
                  <div key={mark.minutes} className="ssp-tt-hour-label" style={{ top: mark.top }}>
                    {mark.label}
                  </div>
                ))}
              </div>

              {weekDays.map((day) => (
                <div
                  key={day.key}
                  className={`ssp-tt-daycolumn ${day.key === todayKey ? 'ssp-tt-today-col' : ''}`}
                  style={{ height: totalHeightPx }}
                >
                  {hourMarks.map((mark) => (
                    <div key={mark.minutes} className="ssp-tt-hourline" style={{ top: mark.top }} />
                  ))}

                  {day.key === todayKey && nowOffset !== null && (
                    <div className="ssp-tt-now-line" style={{ top: nowOffset }} />
                  )}

                  {(scheduleByDay[day.key] || []).map((ev) => (
                    <button
                      type="button"
                      key={ev.id || ev.scheduleCode}
                      className={getTimetableEventClass(ev.status)}
                      style={{ top: ev.top, height: ev.height, left: ev.left, width: ev.width }}
                      onClick={() => setSelectedSchedule(ev)}
                    >
                      <span className="ssp-tt-event-time">
                        {formatTime(ev.startTime)}-{formatTime(ev.endTime)}
                      </span>
                      <span className="ssp-tt-event-title">{safeText(ev.courseName)}</span>
                      <span className="ssp-tt-event-sub">{safeText(ev.tutorName)}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
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
                <span className={getStatusClass(selectedSchedule.status)}>
                  {getStatusLabel(selectedSchedule.status)}
                </span>
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

              {isCancelled(selectedSchedule) && (
                <DetailItem label="เหตุผลที่ยกเลิก" value={safeText(selectedSchedule.cancelReason)} />
              )}

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

              {selectedSchedule.meetingUrl && (
                <button
                  type="button"
                  className="ssp-btn ssp-btn-soft"
                  onClick={() => handleOpenMeeting(selectedSchedule.meetingUrl)}
                >
                  เปิดลิงก์เรียนออนไลน์
                </button>
              )}

              {canJoinClass(selectedSchedule) && (
                <button
                  type="button"
                  className="ssp-btn ssp-btn-primary"
                  onClick={handleJoinClass}
                >
                  เข้าเรียน
                </button>
              )}
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
