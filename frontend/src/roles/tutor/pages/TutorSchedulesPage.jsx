import { useEffect, useMemo, useState } from 'react';
import { getMySchedules } from '../services/tutorScheduleService';
import RefreshButton from '../components/RefreshButton';
import './TutorSchedulesPage.css';

export default function TutorSchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedules();
  }, []);

  async function loadSchedules() {
    try {
      setLoading(true);
      const data = await getMySchedules();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Load schedules error:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((item) => {
      const text = `${item.courseName || ''} ${item.status || ''}`.toLowerCase();
      const matchKeyword = text.includes(keyword.toLowerCase());
      const matchStatus = status === 'ALL' || item.status === status;

      return matchKeyword && matchStatus;
    });
  }, [schedules, keyword, status]);

  const todaySchedules = filteredSchedules.filter(
    (item) => item.scheduleDate === today
  );

  const upcomingSchedules = filteredSchedules.filter(
    (item) => item.scheduleDate > today
  );

  const pastSchedules = filteredSchedules.filter(
    (item) => item.scheduleDate < today
  );

  return (
    <div className="tutor-schedule-page">
      <div className="tutor-schedule-header">
        <div>
          <h1>ตารางสอน</h1>
          <p>ดูตารางสอนของติวเตอร์จากฐานข้อมูลจริง</p>
        </div>

        <RefreshButton
          onClick={loadSchedules}
          loading={loading}
        />
      </div>

      <div className="tutor-schedule-summary">
        <SummaryCard title="ตารางทั้งหมด" value={schedules.length} />
        <SummaryCard title="วันนี้" value={todaySchedules.length} />
        <SummaryCard title="กำลังจะมาถึง" value={upcomingSchedules.length} />
        <SummaryCard title="สอนผ่านมาแล้ว" value={pastSchedules.length} />
      </div>

      <div className="tutor-schedule-toolbar">
        <input
          type="text"
          placeholder="ค้นหาชื่อคอร์ส..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">ทุกสถานะ</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
      </div>

      {loading ? (
        <div className="tutor-schedule-loading">
          กำลังโหลดตารางสอน...
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="tutor-schedule-empty">
          <h2>ยังไม่มีตารางสอน</h2>
          <p>
            ถ้ามีข้อมูลในฐานข้อมูลแล้ว ให้ตรวจสอบ API
            /course-schedules/tutor/me
          </p>
        </div>
      ) : (
        <div className="tutor-schedule-card">
          <div className="tutor-schedule-card-head">
            <h2>รายการตารางสอน</h2>
            <span>{filteredSchedules.length} รายการ</span>
          </div>

          <div className="tutor-schedule-table-wrap">
            <table className="tutor-schedule-table">
              <thead>
                <tr>
                  <th>วันที่สอน</th>
                  <th>เวลา</th>
                  <th>คอร์ส</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {filteredSchedules.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{formatDate(item.scheduleDate)}</strong>

                      {item.scheduleDate === today && (
                        <span className="tutor-schedule-today">
                          วันนี้
                        </span>
                      )}
                    </td>

                    <td>
                      {item.startTime || '-'} - {item.endTime || '-'}
                    </td>

                    <td>
                      {item.courseName || 'ไม่ระบุชื่อคอร์ส'}
                    </td>

                    <td>
                      <StatusBadge status={item.status} />
                    </td>

                    <td>
                      <button className="tutor-schedule-action-btn">
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="tutor-schedule-summary-card">
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`tutor-schedule-status ${
        status?.toLowerCase() || 'unknown'
      }`}
    >
      {status || 'UNKNOWN'}
    </span>
  );
}

function formatDate(date) {
  if (!date) return '-';

  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}