import { useEffect, useMemo, useState } from 'react';
import { getMySchedules } from '../services/tutorScheduleService';
import RefreshButton from '../components/RefreshButton';
import './TutorSchedulesPage.css';

const DAY_LABELS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

const STATUS_LABELS = {
  SCHEDULED: 'รอสอน',
  ONGOING: 'กำลังสอน',
  COMPLETED: 'สอนเสร็จแล้ว',
  CANCELLED: 'ยกเลิก',
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
  if (typeof timeValue === 'string') return timeValue.slice(0, 5);
  return '-';
}

function getStatusLabel(status) {
  if (!status) return '-';
  return STATUS_LABELS[status] || status;
}

function getStatusClass(status) {
  const normalized = String(status || '').toLowerCase();
  return `tsp-status tsp-status-${normalized || 'unknown'}`;
}

function getTimetableEventClass(status) {
  const normalized = String(status || '').toLowerCase();
  return `tsp-tt-event tsp-tt-event-${normalized || 'unknown'}`;
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

function isToday(schedule) {
  return getScheduleDateKey(schedule) === getLocalDateKey();
}

function isCancelled(schedule) {
  return schedule.status === 'CANCELLED';
}

function isCompleted(schedule) {
  if (schedule.status === 'COMPLETED') return true;
  if (!schedule.scheduleDate || !schedule.endTime) return false;
  const endDateTime = new Date(`${schedule.scheduleDate}T${schedule.endTime}`);
  return !Number.isNaN(endDateTime.getTime()) && endDateTime < new Date();
}

function isUpcoming(schedule) {
  return !isCancelled(schedule) && !isCompleted(schedule);
}

function normalizeSchedule(item) {
  return {
    id: item.id,
    scheduleCode: item.scheduleCode,
    courseId: item.courseId,
    courseName: item.courseName,
    lessonTitle: item.lessonTitle,
    scheduleDate: item.scheduleDate,
    startTime: item.startTime,
    endTime: item.endTime,
    status: item.status,
    location: item.location,
    meetingLink: item.meetingLink,
    scheduleType: item.scheduleType,
    cancelReason: item.cancelReason,
  };
}

function getErrorMessage(err) {
  const status = err?.response?.status;
  if (status === 401) return 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
  if (status === 403) return 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้';
  if (status === 500) return 'เกิดข้อผิดพลาดจากระบบ กรุณาลองใหม่อีกครั้ง';
  return err?.response?.data?.message || err?.message || 'ไม่สามารถโหลดตารางสอนได้';
}

function formatWeekRangeLabel(startDate) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const startLabel = startDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  const endLabel = endDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
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

export default function TutorSchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [now, setNow] = useState(() => new Date());

  async function loadSchedules() {
    try {
      setLoading(true);
      setError('');
      const data = await getMySchedules();
      const list = Array.isArray(data) ? data : data?.content || [];
      setSchedules(list.map(normalizeSchedule));
    } catch (err) {
      setError(getErrorMessage(err));
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchedules();
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

  return (
    <div className="tsp-page">
      <div className="tutor-schedule-header">
        <div>
          <h1>ตารางสอน</h1>
          <p>ดูตารางสอนของคุณ คำนวณจากวัน-เวลาของแต่ละคอร์สโดยตรง</p>
        </div>
        <RefreshButton onClick={loadSchedules} loading={loading} />
      </div>

      <div className="tutor-schedule-summary">
        <div className="tutor-schedule-summary-card"><p>ตารางทั้งหมด</p><h2>{summary.total}</h2></div>
        <div className="tutor-schedule-summary-card"><p>วันนี้</p><h2>{summary.today}</h2></div>
        <div className="tutor-schedule-summary-card"><p>กำลังจะมาถึง</p><h2>{summary.upcoming}</h2></div>
        <div className="tutor-schedule-summary-card"><p>ยกเลิกแล้ว</p><h2>{summary.cancelled}</h2></div>
      </div>

      <div className="tsp-content-card">
        <div className="tsp-timetable-toolbar">
          <div className="tsp-timetable-nav">
            <button type="button" onClick={handlePrevWeek} aria-label="สัปดาห์ก่อนหน้า">‹</button>
            <button type="button" className="tsp-timetable-today-btn" onClick={handleToday}>วันนี้</button>
            <button type="button" onClick={handleNextWeek} aria-label="สัปดาห์ถัดไป">›</button>
          </div>
          <div className="tsp-timetable-range">{formatWeekRangeLabel(weekStart)}</div>
        </div>

        {loading && <div className="tutor-schedule-loading">กำลังโหลดตารางสอน...</div>}

        {!loading && error && (
          <div className="tsp-error-box">
            <strong>เกิดข้อผิดพลาด</strong>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && schedules.length === 0 && (
          <div className="tutor-schedule-empty">
            <h2>ยังไม่มีตารางสอน</h2>
            <p>เมื่อคอร์สของคุณถูกตอบรับและมีวัน-เวลาสอนแล้ว ตารางจะแสดงที่นี่โดยอัตโนมัติ</p>
          </div>
        )}

        {!loading && !error && schedules.length > 0 && (
          <div className="tsp-timetable-scroll">
            <div className="tsp-timetable-grid">
              <div className="tsp-tt-corner" />

              {weekDays.map((day) => (
                <div key={day.key} className={`tsp-tt-daycol-header ${day.key === todayKey ? 'tsp-tt-today' : ''}`}>
                  <span className="tsp-tt-day-name">{day.label}</span>
                  <span className="tsp-tt-day-date">{day.dateLabel}</span>
                </div>
              ))}

              <div className="tsp-tt-timeaxis" style={{ height: totalHeightPx }}>
                {hourMarks.map((mark) => (
                  <div key={mark.minutes} className="tsp-tt-hour-label" style={{ top: mark.top }}>
                    {mark.label}
                  </div>
                ))}
              </div>

              {weekDays.map((day) => (
                <div
                  key={day.key}
                  className={`tsp-tt-daycolumn ${day.key === todayKey ? 'tsp-tt-today-col' : ''}`}
                  style={{ height: totalHeightPx }}
                >
                  {hourMarks.map((mark) => (
                    <div key={mark.minutes} className="tsp-tt-hourline" style={{ top: mark.top }} />
                  ))}

                  {day.key === todayKey && nowOffset !== null && (
                    <div className="tsp-tt-now-line" style={{ top: nowOffset }} />
                  )}

                  {(scheduleByDay[day.key] || []).map((ev) => (
                    <button
                      type="button"
                      key={ev.id || ev.scheduleCode}
                      className={getTimetableEventClass(ev.status)}
                      style={{ top: ev.top, height: ev.height, left: ev.left, width: ev.width }}
                      onClick={() => setSelectedSchedule(ev)}
                    >
                      <span className="tsp-tt-event-time">
                        {formatTime(ev.startTime)}-{formatTime(ev.endTime)}
                      </span>
                      <span className="tsp-tt-event-title">{safeText(ev.courseName)}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedSchedule && (
        <div className="tsp-modal-backdrop" onClick={() => setSelectedSchedule(null)}>
          <div className="tsp-modal" onClick={(event) => event.stopPropagation()}>
            <div className="tsp-modal-header">
              <div>
                <p>รายละเอียดตารางสอน</p>
                <h2>{safeText(selectedSchedule.courseName)}</h2>
                <span className={getStatusClass(selectedSchedule.status)}>
                  {getStatusLabel(selectedSchedule.status)}
                </span>
              </div>
              <button
                type="button"
                className="tsp-modal-close"
                onClick={() => setSelectedSchedule(null)}
                aria-label="ปิดหน้าต่างรายละเอียด"
              >
                ×
              </button>
            </div>

            <div className="tsp-modal-body">
              <DetailItem label="ชื่อคอร์ส" value={safeText(selectedSchedule.courseName)} />
              <DetailItem label="บทเรียน" value={safeText(selectedSchedule.lessonTitle)} />
              <DetailItem label="วันที่สอน" value={formatDate(selectedSchedule.scheduleDate)} />
              <DetailItem
                label="เวลาสอน"
                value={`${formatTime(selectedSchedule.startTime)} - ${formatTime(selectedSchedule.endTime)}`}
              />
              <DetailItem label="สถานที่" value={safeText(selectedSchedule.location)} />
              <div className="tsp-detail-item">
                <span>ลิงก์เรียนออนไลน์</span>
                {selectedSchedule.meetingLink ? (
                  <a href={selectedSchedule.meetingLink} target="_blank" rel="noreferrer">
                    {selectedSchedule.meetingLink}
                  </a>
                ) : (
                  <strong>-</strong>
                )}
              </div>
              {isCancelled(selectedSchedule) && (
                <DetailItem label="เหตุผลที่ยกเลิก" value={safeText(selectedSchedule.cancelReason)} />
              )}
            </div>

            <div className="tsp-modal-footer">
              <button type="button" className="tsp-btn-outline" onClick={() => setSelectedSchedule(null)}>
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
    <div className="tsp-detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
