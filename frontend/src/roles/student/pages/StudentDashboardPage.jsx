import './StudentDashboardPage.css';

export default function StudentDashboardPage() {
  const username = localStorage.getItem('username') || 'นักเรียน';
  const today = new Date().toLocaleDateString('th-TH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="student-dashboard-page">
      <div className="student-dashboard-header">
        <div>
          <h1 className="student-dashboard-title">แดชบอร์ดนักเรียน</h1>
          <p className="student-dashboard-date">{today}</p>
        </div>
        <div className="student-dashboard-welcome">
          <span>ยินดีต้อนรับ, </span>
          <strong>{username}</strong>
        </div>
      </div>

      <div className="student-dashboard-placeholder">
        <div className="student-dashboard-placeholder-icon">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="56" height="56">
            <rect width="64" height="64" rx="16" fill="#f5f3ff" />
            <path d="M32 12L48 20V36L32 44L16 36V20L32 12Z" stroke="#7c3aed" strokeWidth="2" fill="none" />
            <circle cx="32" cy="28" r="6" fill="#7c3aed" fillOpacity="0.2" stroke="#7c3aed" strokeWidth="1.5" />
          </svg>
        </div>
        <h2 className="student-dashboard-placeholder-title">ระบบนักเรียน</h2>
        <p className="student-dashboard-placeholder-desc">
          หน้านี้จะแสดงข้อมูลสรุปของนักเรียน<br />
          เช่น คอร์สที่ลงทะเบียน, ตารางเรียนวันนี้, ผลสอบ และการเข้าเรียน
        </p>
        <div className="student-dashboard-coming-soon">เร็ว ๆ นี้</div>
      </div>
    </div>
  );
}
