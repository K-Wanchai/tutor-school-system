import { useEffect, useMemo, useState } from 'react';
import {
  closeClassroomSession,
  getClassroomSessions,
  openClassroomSession,
} from '../services/tutorClassroomService';
import './TutorClassroomsPage.css';

export default function TutorClassroomsPage() {
  const [sessions, setSessions] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      setLoading(true);
      const data = await getClassroomSessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Load classroom sessions error:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen(id) {
    try {
      await openClassroomSession(id);
      await loadSessions();
    } catch (error) {
      alert('เปิดห้องเรียนไม่สำเร็จ');
      console.error(error);
    }
  }

  async function handleClose(id) {
    try {
      await closeClassroomSession(id);
      await loadSessions();
    } catch (error) {
      alert('ปิดห้องเรียนไม่สำเร็จ');
      console.error(error);
    }
  }

  const filteredSessions = useMemo(() => {
    return sessions.filter((item) => {
      const text = `
        ${item.sessionCode || ''}
        ${item.courseName || ''}
        ${item.status || ''}
      `.toLowerCase();

      const matchKeyword = text.includes(keyword.toLowerCase());
      const matchStatus = status === 'ALL' || item.status === status;

      return matchKeyword && matchStatus;
    });
  }, [sessions, keyword, status]);

  const summary = useMemo(() => {
    return {
      total: sessions.length,
      open: sessions.filter((s) => ['OPEN', 'ACTIVE', 'IN_PROGRESS'].includes(s.status)).length,
      closed: sessions.filter((s) => ['CLOSED', 'COMPLETED'].includes(s.status)).length,
      cancelled: sessions.filter((s) => s.status === 'CANCELLED').length,
    };
  }, [sessions]);

  return (
    <div className="tutor-classroom-page">
      <div className="tutor-classroom-header">
        <div>
          <h1>ห้องเรียน</h1>
          <p>จัดการห้องเรียนออนไลน์/ห้องเรียนของคอร์สที่เปิดสอน</p>
        </div>

        <button onClick={loadSessions}>รีเฟรชข้อมูล</button>
      </div>

      <div className="tutor-classroom-summary">
        <SummaryCard title="ห้องเรียนทั้งหมด" value={summary.total} />
        <SummaryCard title="เปิดอยู่" value={summary.open} />
        <SummaryCard title="ปิดแล้ว" value={summary.closed} />
        <SummaryCard title="ยกเลิก" value={summary.cancelled} />
      </div>

      <div className="tutor-classroom-toolbar">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="ค้นหารหัสห้องเรียนหรือชื่อคอร์ส..."
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">ทุกสถานะ</option>
          <option value="OPEN">OPEN</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="CLOSED">CLOSED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {loading ? (
        <div className="tutor-classroom-empty">กำลังโหลดข้อมูลห้องเรียน...</div>
      ) : filteredSessions.length === 0 ? (
        <div className="tutor-classroom-empty">
          <h2>ยังไม่มีห้องเรียน</h2>
          <p>ถ้ามีข้อมูลในฐานข้อมูลแล้ว ให้ตรวจสอบ API /classroom-sessions</p>
        </div>
      ) : (
        <div className="tutor-classroom-grid">
          {filteredSessions.map((item) => (
            <div className="tutor-classroom-card" key={item.id}>
              <div className="tutor-classroom-card-top">
                <span>{item.sessionCode || `SESSION-${item.id}`}</span>
                <StatusBadge status={item.status} />
              </div>

              <h2>{item.courseName || 'ไม่ระบุชื่อคอร์ส'}</h2>

              <div className="tutor-classroom-info">
                <Info label="วันที่เรียน" value={item.scheduleDate || '-'} />
                <Info label="เวลา" value={`${item.startTime || '-'} - ${item.endTime || '-'}`} />
                <Info label="Lesson ID" value={item.lessonId || '-'} />
                <Info label="Course ID" value={item.courseId || '-'} />
              </div>

              <div className="tutor-classroom-actions">
                <button
                  className="open"
                  onClick={() => handleOpen(item.id)}
                  disabled={['OPEN', 'ACTIVE', 'IN_PROGRESS'].includes(item.status)}
                >
                  เปิดห้องเรียน
                </button>

                <button
                  className="close"
                  onClick={() => handleClose(item.id)}
                  disabled={['CLOSED', 'COMPLETED', 'CANCELLED'].includes(item.status)}
                >
                  ปิดห้องเรียน
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="tutor-classroom-summary-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>ห้อง</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="tutor-classroom-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`tutor-classroom-status ${status?.toLowerCase() || 'unknown'}`}>
      {status || 'UNKNOWN'}
    </span>
  );
}