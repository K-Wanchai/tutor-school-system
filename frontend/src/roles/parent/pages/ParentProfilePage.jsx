import { useEffect, useMemo, useState } from 'react';
import { getMyChildProfile } from '../services/parentService';
import '../../student/pages/StudentProfilePage.css';

function formatDate(value) {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return '-';

  return new Date(value).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ParentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const initials = useMemo(() => {
    const first = profile?.firstName?.trim()?.charAt(0) || '';
    const last = profile?.lastName?.trim()?.charAt(0) || '';

    if (first || last) return `${first}${last}`;

    return profile?.fullName?.trim()?.charAt(0) || 'S';
  }, [profile]);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError('');
      const data = await getMyChildProfile();
      setProfile(data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="sp-page">
        <div className="sp-loading-card">
          <div className="sp-spinner" />
          <p>กำลังโหลดข้อมูลโปรไฟล์...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="sp-page">
        <div className="sp-empty-card">
          <h2>ไม่พบข้อมูลโปรไฟล์บุตรหลาน</h2>
          <p>{error || 'กรุณาลองโหลดหน้าใหม่อีกครั้ง'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-page">
      {error && <div className="sp-toast sp-toast-error">{error}</div>}

      <section className="sp-hero-card">
        <div className="sp-hero-left">
          <div className="sp-avatar">{initials}</div>

          <div>
            <p className="sp-kicker">Parent View · Child Profile</p>
            <h1>{profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`}</h1>

            <div className="sp-hero-meta">
              <span>{profile.studentCode || '-'}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="sp-grid">
        <InfoCard title="ข้อมูลส่วนตัว" subtitle="ข้อมูลพื้นฐานของนักเรียน">
          <InfoRow label="ชื่อ" value={profile.firstName} />
          <InfoRow label="นามสกุล" value={profile.lastName} />
          <InfoRow label="เลขบัตรประชาชน" value={profile.nationalId} />
          <InfoRow label="วันเกิด" value={formatDate(profile.birthDate)} />
          <InfoRow label="ที่อยู่" value={profile.address} full />
        </InfoCard>

        <InfoCard title="ข้อมูลติดต่อ" subtitle="ช่องทางติดต่อและบัญชีผู้ใช้ของนักเรียน">
          <InfoRow label="ชื่อผู้ใช้" value={profile.username} />
          <InfoRow label="อีเมล" value={profile.email} />
          <InfoRow label="เบอร์โทร" value={profile.phoneNumber} />
          <InfoRow label="เบอร์ผู้ปกครอง" value={profile.guardianPhoneNumber} />
        </InfoCard>

        <InfoCard title="ข้อมูลระบบ" subtitle="ข้อมูลวันที่ในระบบ">
          <InfoRow label="วันที่สมัคร" value={formatDateTime(profile.createdAt)} />
          <InfoRow label="แก้ไขล่าสุด" value={formatDateTime(profile.updatedAt)} />
        </InfoCard>
      </div>
    </div>
  );
}

function InfoCard({ title, subtitle, children }) {
  return (
    <section className="sp-card">
      <div className="sp-card-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className="sp-info-list">{children}</div>
    </section>
  );
}

function InfoRow({ label, value, full = false }) {
  return (
    <div className={full ? 'sp-info-row sp-info-row-full' : 'sp-info-row'}>
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  );
}
