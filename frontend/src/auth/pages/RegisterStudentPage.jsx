import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, checkAvailability } from '../services/authService';
import useInstitutionProfile from '../../shared/hooks/useInstitutionProfile';
import './RegisterStudentPage.css';

const GRADE_LEVELS = [
  { value: 'PRATHOM_3', label: 'ประถมศึกษาปีที่ 3' },
  { value: 'PRATHOM_4', label: 'ประถมศึกษาปีที่ 4' },
  { value: 'PRATHOM_5', label: 'ประถมศึกษาปีที่ 5' },
  { value: 'PRATHOM_6', label: 'ประถมศึกษาปีที่ 6' },
  { value: 'MATTAYOM_1', label: 'มัธยมศึกษาปีที่ 1' },
  { value: 'MATTAYOM_2', label: 'มัธยมศึกษาปีที่ 2' },
  { value: 'MATTAYOM_3', label: 'มัธยมศึกษาปีที่ 3' },
  { value: 'MATTAYOM_4', label: 'มัธยมศึกษาปีที่ 4' },
  { value: 'MATTAYOM_5', label: 'มัธยมศึกษาปีที่ 5' },
  { value: 'MATTAYOM_6', label: 'มัธยมศึกษาปีที่ 6' },
  { value: 'VOCATIONAL_CERT_1', label: 'ปวช.1' },
  { value: 'VOCATIONAL_CERT_2', label: 'ปวช.2' },
  { value: 'VOCATIONAL_CERT_3', label: 'ปวช.3' },
  { value: 'VOCATIONAL_DIPLOMA_1', label: 'ปวส.1' },
  { value: 'VOCATIONAL_DIPLOMA_2', label: 'ปวส.2' },
  { value: 'UNIVERSITY', label: 'ระดับมหาวิทยาลัย / ปริญญาตรี' },
  { value: 'GENERAL_PUBLIC', label: 'บุคคลทั่วไป / วัยทำงาน' },
];

const MIN_AGE = 9;
const MAX_AGE = 40;

const THAI_MONTHS = [
  { num: '1',  name: 'มกราคม' },
  { num: '2',  name: 'กุมภาพันธ์' },
  { num: '3',  name: 'มีนาคม' },
  { num: '4',  name: 'เมษายน' },
  { num: '5',  name: 'พฤษภาคม' },
  { num: '6',  name: 'มิถุนายน' },
  { num: '7',  name: 'กรกฎาคม' },
  { num: '8',  name: 'สิงหาคม' },
  { num: '9',  name: 'กันยายน' },
  { num: '10', name: 'ตุลาคม' },
  { num: '11', name: 'พฤศจิกายน' },
  { num: '12', name: 'ธันวาคม' },
];

function getDaysInMonth(monthNum, yearBE) {
  if (!monthNum) return 31;
  const yearCE = yearBE ? parseInt(yearBE) - 543 : 2000;
  return new Date(yearCE, parseInt(monthNum), 0).getDate();
}

export default function RegisterStudentPage() {
  const navigate = useNavigate();
  const profile = useInstitutionProfile();

  // field names ต้องตรงกับ backend RegisterRequest DTO ทุกตัว
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    nationalId: '',
    birthDate: '',
    currentSchool: '',
    gradeLevel: '',
    phone: '',          // → RegisterRequest.phone → Student.phoneNumber
    address: '',
    parentPhone: '',    // → RegisterRequest.parentPhone → Student.guardianPhoneNumber
  });

  const [birthParts, setBirthParts] = useState({ day: '', month: '', yearBE: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');

  // สถานะเช็ค username/email/nationalId ซ้ำแบบ real-time (null = ยังไม่ได้เช็ค, true = ว่าง, false = ซ้ำ)
  const [availability, setAvailability] = useState({ username: null, email: null, nationalId: null });
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  const beYearRange = useMemo(() => {
    const nowBE = new Date().getFullYear() + 543;
    return { start: nowBE - MAX_AGE, end: nowBE - MIN_AGE };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError('');
    setFieldErrors({});
    if (name in availability) {
      setAvailability((prev) => ({ ...prev, [name]: null }));
    }
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordMismatch(false);
    }
  };

  const handleAvailabilityBlur = async (field) => {
    const value = form[field];
    if (!value || !value.trim()) return;
    try {
      const result = await checkAvailability(field, value.trim());
      setAvailability((prev) => ({ ...prev, [field]: !!result.available }));
    } catch {
      // ไม่บล็อกการกรอกฟอร์มถ้าเช็คไม่สำเร็จ ปล่อยให้ backend ตรวจตอน submit อีกครั้ง
      setAvailability((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handlePasswordBlur = () => {
    if (form.confirmPassword) {
      setPasswordMismatch(form.password !== form.confirmPassword);
    }
  };

  const availabilityInputClass = (field) => {
    if (availability[field] === false) return 'auth-form-input is-duplicate';
    if (availability[field] === true) return 'auth-form-input is-available';
    return 'auth-form-input';
  };

  const availabilityHint = (field, defaultHint) => {
    if (availability[field] === false) return 'ข้อมูลนี้ถูกใช้งานแล้ว กรุณาแก้ไข';
    if (availability[field] === true) return 'ใช้งานได้';
    return defaultHint;
  };

  const availabilityHintClass = (field) => {
    if (availability[field] === false) return 'auth-form-hint auth-form-hint--duplicate';
    if (availability[field] === true) return 'auth-form-hint auth-form-hint--available';
    return 'auth-form-hint';
  };

  const handleBirthPartChange = (field, value) => {
    const next = { ...birthParts, [field]: value };
    if (field === 'month' || field === 'yearBE') {
      const maxDays = getDaysInMonth(
        field === 'month' ? value : next.month,
        field === 'yearBE' ? value : next.yearBE,
      );
      if (parseInt(next.day) > maxDays) next.day = '';
    }
    setBirthParts(next);
    setError('');
    if (next.day && next.month && next.yearBE) {
      const yearCE = parseInt(next.yearBE) - 543;
      const mm = String(next.month).padStart(2, '0');
      const dd = String(next.day).padStart(2, '0');
      setForm((prev) => ({ ...prev, birthDate: `${yearCE}-${mm}-${dd}` }));
    } else {
      setForm((prev) => ({ ...prev, birthDate: '' }));
    }
  };

  const validate = () => {
    if (!form.firstName.trim()) return 'กรุณากรอกชื่อ';
    if (!form.lastName.trim()) return 'กรุณากรอกนามสกุล';
    if (!form.username.trim()) return 'กรุณากรอก Username';
    if (!form.email.trim()) return 'กรุณากรอก Email';
    if (!form.password) return 'กรุณากรอกรหัสผ่าน';
    if (form.password.length < 8) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    if (!form.confirmPassword) return 'กรุณายืนยันรหัสผ่าน';
    if (form.confirmPassword !== form.password) return 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน';
    if (!form.nationalId) return 'กรุณากรอกเลขบัตรประชาชน';
    if (!/^\d{13}$/.test(form.nationalId)) return 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลักเท่านั้น';
    if (!form.birthDate) return 'กรุณาเลือกวันเกิด (วัน / เดือน / ปี) ให้ครบ';
    if (form.birthDate) {
      const birth = new Date(form.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const hasHadBirthdayThisYear =
        today.getMonth() > birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
      if (!hasHadBirthdayThisYear) age -= 1;
      if (age < MIN_AGE || age > MAX_AGE) return `อายุต้องอยู่ระหว่าง ${MIN_AGE}-${MAX_AGE} ปี`;
    }
    if (!form.currentSchool.trim()) return 'กรุณากรอกชื่อโรงเรียนปัจจุบัน';
    if (!form.gradeLevel) return 'กรุณาเลือกระดับชั้น';
    if (!form.phone.trim()) return 'กรุณากรอกเบอร์โทรศัพท์';
    if (!/^\d{10}$/.test(form.phone.trim())) return 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น';
    if (!form.address.trim()) return 'กรุณากรอกที่อยู่';
    if (!form.parentPhone.trim()) return 'กรุณากรอกเบอร์โทรผู้ปกครอง';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError('');
    setFieldErrors({});
    try {
      // ตัด confirmPassword ออก — ไม่ส่งไป backend
      const { confirmPassword, ...rest } = form;
      const payload = {
        ...rest,
        birthDate: form.birthDate || null,
      };

      await register(payload);
      window.alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบด้วยบัญชีที่สมัครไว้');
      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      const status = err.response?.status;

      // แสดง field-level errors จาก backend ถ้ามี
      if (data?.errors && Object.keys(data.errors).length > 0) {
        setFieldErrors(data.errors);
      }

      // ข้อความหลักตาม HTTP status code
      if (status === 400) {
        setError(data?.message || 'กรุณาตรวจสอบข้อมูลที่กรอก');
      } else if (status === 409) {
        setError(data?.message || 'ชื่อผู้ใช้ อีเมล หรือเลขบัตรประชาชนนี้ถูกใช้งานแล้ว');
      } else if (status === 500) {
        setError('เกิดข้อผิดพลาดจากระบบ');
      } else {
        setError(data?.message || 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-register-page">
      <div className="auth-register-header">
        <div className="auth-register-brand">
          <div className="auth-reg-logo-icon">
            {profile?.logoUrl ? (
              <img src={profile.logoUrl} alt={profile.institutionName || 'Logo'} />
            ) : (
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="#2563eb" />
                <path d="M16 6L26 11V21L16 26L6 21V11L16 6Z" stroke="white" strokeWidth="1.5" fill="none" />
                <circle cx="16" cy="16" r="3" fill="white" />
              </svg>
            )}
          </div>
          <span className="auth-reg-brand-name">KruPuk Tutor</span>
        </div>
        <p className="auth-reg-header-sub">สมัครสมาชิกนักเรียน</p>
      </div>

      <div className="auth-register-container">
        <div className="auth-register-card">
          <div className="auth-register-card-header">
            <h2 className="auth-register-title">สร้างบัญชีนักเรียน</h2>
            <p className="auth-register-subtitle">กรอกข้อมูลให้ครบทุกช่องเพื่อสมัครสมาชิกในระบบ</p>
          </div>

          {(error || Object.keys(fieldErrors).length > 0) && (
            <div className="auth-error-alert">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{ flexShrink: 0 }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                {error && <div>{error}</div>}
                {Object.keys(fieldErrors).length > 0 && (
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                    {Object.entries(fieldErrors).map(([field, msg]) => (
                      <li key={field}><strong>{field}:</strong> {msg}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {success && (
            <div className="auth-success-alert">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          <form className="auth-register-form" onSubmit={handleSubmit}>

            {/* ── Section 1: ข้อมูลบัญชี ── */}
            <div className="auth-register-section-label">ข้อมูลบัญชี</div>
            <div className="auth-form-grid">
              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="username">
                  Username <span className="auth-required">*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  className={availabilityInputClass('username')}
                  placeholder="ชื่อผู้ใช้งาน"
                  value={form.username}
                  onChange={handleChange}
                  onBlur={() => handleAvailabilityBlur('username')}
                  autoComplete="username"
                />
                <span className={availabilityHintClass('username')}>
                  {availabilityHint('username', 'ต้องไม่ซ้ำกับผู้ใช้งานคนอื่น')}
                </span>
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="email">
                  Email <span className="auth-required">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className={availabilityInputClass('email')}
                  placeholder="อีเมล"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={() => handleAvailabilityBlur('email')}
                  autoComplete="email"
                />
                <span className={availabilityHintClass('email')}>
                  {availabilityHint('email', 'ต้องไม่ซ้ำกับผู้ใช้งานคนอื่น')}
                </span>
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="password">
                  รหัสผ่าน <span className="auth-required">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  className="auth-form-input"
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handlePasswordBlur}
                  autoComplete="new-password"
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="confirmPassword">
                  ยืนยันรหัสผ่าน <span className="auth-required">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  className={`auth-form-input${passwordMismatch ? ' is-mismatch' : ''}`}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={handlePasswordBlur}
                  autoComplete="new-password"
                />
                {passwordMismatch && (
                  <span className="auth-form-hint auth-form-hint--mismatch">รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน</span>
                )}
              </div>
            </div>

            {/* ── Section 2: ข้อมูลส่วนตัว ── */}
            <div className="auth-register-section-label" style={{ marginTop: '12px' }}>ข้อมูลส่วนตัว</div>
            <div className="auth-form-grid">
              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="firstName">
                  ชื่อ <span className="auth-required">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  className="auth-form-input"
                  placeholder="ชื่อจริง"
                  value={form.firstName}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="lastName">
                  นามสกุล <span className="auth-required">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  className="auth-form-input"
                  placeholder="นามสกุล"
                  value={form.lastName}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="nationalId">
                  เลขบัตรประชาชน <span className="auth-required">*</span>
                </label>
                <input
                  id="nationalId"
                  type="text"
                  name="nationalId"
                  className={availabilityInputClass('nationalId')}
                  placeholder="ตัวเลข 13 หลัก"
                  value={form.nationalId}
                  onChange={handleChange}
                  onBlur={() => handleAvailabilityBlur('nationalId')}
                  maxLength={13}
                />
                <span className={availabilityHintClass('nationalId')}>
                  {availabilityHint('nationalId', 'ต้องไม่ซ้ำกับผู้ใช้งานคนอื่น')}
                </span>
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label">
                  วันเกิด <span className="auth-required">*</span>
                  <span className="auth-form-hint" style={{ fontWeight: 400, marginLeft: 6 }}>(วัน / เดือน / ปี พ.ศ.)</span>
                </label>
                <div className="auth-date-picker">
                  <select
                    className="auth-date-select auth-date-select--day"
                    value={birthParts.day}
                    onChange={(e) => handleBirthPartChange('day', e.target.value)}
                  >
                    <option value="">วัน</option>
                    {Array.from(
                      { length: getDaysInMonth(birthParts.month, birthParts.yearBE) },
                      (_, i) => i + 1,
                    ).map((d) => (
                      <option key={d} value={String(d)}>{d}</option>
                    ))}
                  </select>

                  <select
                    className="auth-date-select auth-date-select--month"
                    value={birthParts.month}
                    onChange={(e) => handleBirthPartChange('month', e.target.value)}
                  >
                    <option value="">เดือน</option>
                    {THAI_MONTHS.map((m) => (
                      <option key={m.num} value={m.num}>{m.name}</option>
                    ))}
                  </select>

                  <select
                    className="auth-date-select auth-date-select--year"
                    value={birthParts.yearBE}
                    onChange={(e) => handleBirthPartChange('yearBE', e.target.value)}
                  >
                    <option value="">ปี (พ.ศ.)</option>
                    {Array.from(
                      { length: beYearRange.end - beYearRange.start + 1 },
                      (_, i) => beYearRange.end - i,
                    ).map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
                <span className="auth-form-hint">อายุต้องอยู่ระหว่าง {MIN_AGE}-{MAX_AGE} ปี</span>
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="currentSchool">
                  โรงเรียน/สถานศึกษาปัจจุบัน <span className="auth-required">*</span>
                </label>
                <input
                  id="currentSchool"
                  type="text"
                  name="currentSchool"
                  className="auth-form-input"
                  placeholder="ชื่อโรงเรียน/สถานศึกษาปัจจุบัน"
                  value={form.currentSchool}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="gradeLevel">
                  ระดับชั้น <span className="auth-required">*</span>
                </label>
                <select
                  id="gradeLevel"
                  name="gradeLevel"
                  className="auth-form-input"
                  value={form.gradeLevel}
                  onChange={handleChange}
                >
                  <option value="">เลือกระดับชั้น</option>
                  {GRADE_LEVELS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Section 3: ข้อมูลการติดต่อ ── */}
            <div className="auth-register-section-label" style={{ marginTop: '12px' }}>ข้อมูลการติดต่อ</div>
            <div className="auth-form-grid">
              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="phone">
                  เบอร์โทรศัพท์ <span className="auth-required">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  className="auth-form-input"
                  placeholder="ตัวเลข 10 หลัก"
                  value={form.phone}
                  onChange={handleChange}
                  maxLength={10}
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="parentPhone">
                  เบอร์โทรผู้ปกครอง <span className="auth-required">*</span>
                </label>
                <input
                  id="parentPhone"
                  type="tel"
                  name="parentPhone"
                  className="auth-form-input"
                  placeholder="เบอร์โทรผู้ปกครอง"
                  value={form.parentPhone}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-form-group auth-form-group--full">
                <label className="auth-form-label" htmlFor="address">
                  ที่อยู่ <span className="auth-required">*</span>
                </label>
                <input
                  id="address"
                  type="text"
                  name="address"
                  className="auth-form-input"
                  placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                  value={form.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
              style={{ marginTop: '12px' }}
            >
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="auth-spinner"></span>
                  กำลังสมัครสมาชิก...
                </span>
              ) : (
                'สมัครสมาชิก'
              )}
            </button>
          </form>

          <div className="auth-register-footer">
            <p>
              มีบัญชีอยู่แล้ว?{' '}
              <Link to="/login" className="auth-link">
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
