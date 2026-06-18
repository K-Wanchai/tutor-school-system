import './TutorDashboardPage.css';

export default function TutorDashboardPage() {
  const username = localStorage.getItem('username') || 'ติวเตอร์';
  const today = new Date().toLocaleDateString('th-TH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="tutor-dashboard-page">
      <div className="tutor-dashboard-header">
        <div>
          <h1 className="tutor-dashboard-title">แดชบอร์ดติวเตอร์</h1>
          <p className="tutor-dashboard-date">{today}</p>
        </div>
        <div className="tutor-dashboard-welcome">
          <span>ยินดีต้อนรับ, </span>
          <strong>{username}</strong>
        </div>
      </div>

      <div className="tutor-dashboard-placeholder">
        <div className="tutor-dashboard-placeholder-icon">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="56" height="56">
            <rect width="64" height="64" rx="16" fill="#ecfdf5" />
            <path d="M32 12L48 20V36L32 44L16 36V20L32 12Z" stroke="#059669" strokeWidth="2" fill="none" />
            <circle cx="32" cy="28" r="6" fill="#059669" fillOpacity="0.2" stroke="#059669" strokeWidth="1.5" />
          </svg>
        </div>
        <h2 className="tutor-dashboard-placeholder-title">ระบบติวเตอร์</h2>
        <p className="tutor-dashboard-placeholder-desc">
          หน้านี้จะแสดงข้อมูลสรุปของติวเตอร์<br />
          เช่น คอร์สที่สอน, ตารางสอนวันนี้, นักเรียนทั้งหมด และผลการประเมิน
        </p>
        <div className="tutor-dashboard-coming-soon">เร็ว ๆ นี้</div>
      </div>
    </div>
  );
}
