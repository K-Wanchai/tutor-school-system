import { Link } from 'react-router-dom';
import { resolveFileUrl } from '../../shared/services/api';
import useInstitutionProfile from '../../shared/hooks/useInstitutionProfile';
import './LandingPage.css';

const FEATURES = [
  {
    title: 'จัดการนักเรียนและผู้สอน',
    desc: 'บริหารข้อมูลนักเรียน ติวเตอร์ และคอร์สเรียนได้ครบในที่เดียว',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
        <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'จัดตารางเรียนและลงทะเบียน',
    desc: 'จัดการตารางเรียน การลงทะเบียน และการชำระเงินอย่างเป็นระบบ',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
        <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 9h16M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'สอบออนไลน์และเช็คชื่อ',
    desc: 'ระบบข้อสอบออนไลน์ การเข้าเรียน และรายงานผลแบบเรียลไทม์',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    title: 'ชำระเงินและแจ้งเตือน',
    desc: 'ตรวจสอบสลิปการโอนเงิน ติดตามสถานะ และแจ้งเตือนอัตโนมัติ',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
        <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
];

function LogoMark({ profile }) {
  return profile?.logoUrl ? (
    <img src={resolveFileUrl(profile.logoUrl)} alt={profile.institutionName || 'Logo'} />
  ) : (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="white" fillOpacity="0.15" />
      <path d="M20 8L32 14V26L20 32L8 26V14L20 8Z" stroke="white" strokeWidth="2" fill="none" />
      <path d="M20 14L26 17V23L20 26L14 23V17L20 14Z" fill="white" fillOpacity="0.3" />
      <circle cx="20" cy="20" r="3" fill="white" />
    </svg>
  );
}

export default function LandingPage() {
  const profile = useInstitutionProfile();
  const institutionName = profile?.institutionName || 'TutorSchool';

  return (
    <div className="lp-page">
      {/* ── Navbar ── */}
      <header className="lp-navbar">
        <div className="lp-navbar-inner">
          <div className="lp-brand">
            <div className="lp-brand-logo"><LogoMark profile={profile} /></div>
            <span className="lp-brand-name">{institutionName}</span>
          </div>
          <div className="lp-navbar-actions">
            <Link to="/login" className="lp-btn lp-btn--ghost">เข้าสู่ระบบ</Link>
            <Link to="/register" className="lp-btn lp-btn--primary">สมัครเรียน</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-bg-blob lp-hero-bg-blob--1" />
        <div className="lp-hero-bg-blob lp-hero-bg-blob--2" />
        <div className="lp-hero-inner">
          <span className="lp-hero-eyebrow">ระบบจัดการโรงเรียนกวดวิชา</span>
          <h1 className="lp-hero-title">
            ยินดีต้อนรับสู่<br />{institutionName}
          </h1>
          <p className="lp-hero-subtitle">
            แพลตฟอร์มบริหารจัดการโรงเรียนกวดวิชาครบวงจร ตั้งแต่สมัครเรียน จัดตารางเรียน
            ชำระเงิน สอบออนไลน์ ไปจนถึงติดตามผลการเรียน สะดวก รวดเร็ว และปลอดภัย
          </p>
          <div className="lp-hero-actions">
            <Link to="/register" className="lp-btn lp-btn--primary lp-btn--lg">สมัครเรียนตอนนี้</Link>
            <Link to="/login" className="lp-btn lp-btn--outline lp-btn--lg">เข้าสู่ระบบ</Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <h2 className="lp-section-title">ทุกสิ่งที่สถาบันต้องการ ในระบบเดียว</h2>
          <p className="lp-section-subtitle">เครื่องมือครบครันสำหรับผู้ดูแลระบบ ติวเตอร์ และนักเรียน</p>
          <div className="lp-feature-grid">
            {FEATURES.map((f) => (
              <div className="lp-feature-card" key={f.title}>
                <div className="lp-feature-icon">{f.icon}</div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About / Contact ── */}
      {(profile?.address || profile?.phoneNumber || profile?.email) && (
        <section className="lp-section lp-section--muted">
          <div className="lp-section-inner">
            <h2 className="lp-section-title">ติดต่อสถาบัน</h2>
            <p className="lp-section-subtitle">{institutionName}</p>
            <div className="lp-contact-grid">
              {profile?.address && (
                <div className="lp-contact-card">
                  <span className="lp-contact-label">ที่อยู่</span>
                  <span className="lp-contact-value">{profile.address}</span>
                </div>
              )}
              {profile?.phoneNumber && (
                <div className="lp-contact-card">
                  <span className="lp-contact-label">โทรศัพท์</span>
                  <span className="lp-contact-value">{profile.phoneNumber}</span>
                </div>
              )}
              {profile?.email && (
                <div className="lp-contact-card">
                  <span className="lp-contact-label">อีเมล</span>
                  <span className="lp-contact-value">{profile.email}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <h2 className="lp-cta-title">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
          <p className="lp-cta-subtitle">สมัครเรียนวันนี้ หรือเข้าสู่ระบบเพื่อจัดการบัญชีของคุณ</p>
          <div className="lp-hero-actions">
            <Link to="/register" className="lp-btn lp-btn--white lp-btn--lg">สมัครเรียน</Link>
            <Link to="/login" className="lp-btn lp-btn--outline-white lp-btn--lg">เข้าสู่ระบบ</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <span>&copy; {new Date().getFullYear()} {institutionName}. สงวนลิขสิทธิ์.</span>
      </footer>
    </div>
  );
}
