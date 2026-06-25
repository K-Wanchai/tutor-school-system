import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';
import './RegisterStudentPage.css';

const THAI_BANKS = [
  'กสิกรไทย',
  'กรุงเทพ',
  'กรุงไทย',
  'กรุงศรีอยุธยา',
  'ไทยพาณิชย์',
  'ทหารไทยธนชาต',
  'ออมสิน',
  'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร',
  'ซีไอเอ็มบีไทย',
  'ยูโอบี',
  'ธนาคารอาคารสงเคราะห์',
  'อื่นๆ',
];

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

const BE_YEAR_START = 2490;
const BE_YEAR_END   = 2550;

function getDaysInMonth(monthNum, yearBE) {
  if (!monthNum) return 31;
  const yearCE = yearBE ? parseInt(yearBE) - 543 : 2000;
  return new Date(yearCE, parseInt(monthNum), 0).getDate();
}

export default function RegisterStudentPage() {
  const navigate = useNavigate();
  const qrInputRef = useRef(null);

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
    phone: '',          // → RegisterRequest.phone → Student.phoneNumber
    address: '',
    parentPhone: '',    // → RegisterRequest.parentPhone → Student.guardianPhoneNumber
    bankName: 'กสิกรไทย',
    accountName: '',    // → RegisterRequest.accountName → Student.bankAccountName
    accountNumber: '',  // → RegisterRequest.accountNumber → Student.bankAccountNumber
    promptPayQrCode: '', // → RegisterRequest.promptPayQrCode → Student.bankQrCode
  });

  const [birthParts, setBirthParts] = useState({ day: '', month: '', yearBE: '' });
  const [customBankName, setCustomBankName] = useState('');
  const [qrFile, setQrFile] = useState(null);
  const [qrFileName, setQrFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setFieldErrors({});
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

  const handleQrCodeChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (PNG, JPG)');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 3MB');
      return;
    }
    setQrFile(file);
    setQrFileName(file.name);
    setError('');
    // ใช้ FileReader เฉพาะ preview เท่านั้น — ไม่ส่ง base64 ไป backend
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((prev) => ({ ...prev, promptPayQrCode: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQr = (e) => {
    e.stopPropagation();
    setQrFile(null);
    setQrFileName('');
    setForm((prev) => ({ ...prev, promptPayQrCode: '' }));
    if (qrInputRef.current) qrInputRef.current.value = '';
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
    if (!form.phone.trim()) return 'กรุณากรอกเบอร์โทรศัพท์';
    if (!/^\d{10}$/.test(form.phone.trim())) return 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น';
    if (!form.address.trim()) return 'กรุณากรอกที่อยู่';
    if (!form.parentPhone.trim()) return 'กรุณากรอกเบอร์โทรผู้ปกครอง';
    if (!form.bankName.trim()) return 'กรุณาเลือกธนาคาร';
    if (form.bankName === 'อื่นๆ' && !customBankName.trim()) return 'กรุณาระบุชื่อธนาคาร';
    if (!form.accountName.trim()) return 'กรุณากรอกชื่อบัญชีธนาคาร';
    if (!form.accountNumber.trim()) return 'กรุณากรอกเลขบัญชีธนาคาร';
    if (!qrFile) return 'กรุณาอัปโหลดรูป QR Code พร้อมเพย์';
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
      // ตัด confirmPassword และ promptPayQrCode ออก — ไม่ส่งไป backend
      const { confirmPassword, promptPayQrCode, ...rest } = form;
      const payload = {
        ...rest,
        birthDate: form.birthDate || null,
        bankName: form.bankName === 'อื่นๆ' ? customBankName.trim() : form.bankName,
      };

      const formData = new FormData();
      formData.append(
        'data',
        new Blob([JSON.stringify(payload)], { type: 'application/json' }),
      );
      if (qrFile) {
        formData.append('qrCodeFile', qrFile);
      }

      await register(formData);
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
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#2563eb" />
              <path d="M16 6L26 11V21L16 26L6 21V11L16 6Z" stroke="white" strokeWidth="1.5" fill="none" />
              <circle cx="16" cy="16" r="3" fill="white" />
            </svg>
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
                  className="auth-form-input"
                  placeholder="ชื่อผู้ใช้งาน"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                />
                <span className="auth-form-hint">ต้องไม่ซ้ำกับผู้ใช้งานคนอื่น</span>
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="email">
                  Email <span className="auth-required">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="auth-form-input"
                  placeholder="อีเมล"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
                <span className="auth-form-hint">ต้องไม่ซ้ำกับผู้ใช้งานคนอื่น</span>
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
                  className="auth-form-input"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
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
                  className="auth-form-input"
                  placeholder="ตัวเลข 13 หลัก"
                  value={form.nationalId}
                  onChange={handleChange}
                  maxLength={13}
                />
                <span className="auth-form-hint">ต้องไม่ซ้ำกับผู้ใช้งานคนอื่น</span>
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
                      { length: BE_YEAR_END - BE_YEAR_START + 1 },
                      (_, i) => BE_YEAR_END - i,
                    ).map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
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

            {/* ── Section 4: ข้อมูลบัญชีธนาคาร ── */}
            <div className="auth-register-section-label" style={{ marginTop: '12px' }}>ข้อมูลบัญชีธนาคาร</div>
            <div className="auth-form-grid">
              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="bankName">
                  ธนาคาร <span className="auth-required">*</span>
                </label>
                <select
                  id="bankName"
                  name="bankName"
                  className="auth-form-input"
                  value={form.bankName}
                  onChange={(e) => {
                    handleChange(e);
                    if (e.target.value !== 'อื่นๆ') setCustomBankName('');
                  }}
                >
                  {THAI_BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {form.bankName === 'อื่นๆ' && (
                  <input
                    type="text"
                    className="auth-form-input"
                    style={{ marginTop: '8px' }}
                    placeholder="ระบุชื่อธนาคาร"
                    value={customBankName}
                    onChange={(e) => {
                      setCustomBankName(e.target.value);
                      setError('');
                    }}
                  />
                )}
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="accountName">
                  ชื่อบัญชี <span className="auth-required">*</span>
                </label>
                <input
                  id="accountName"
                  type="text"
                  name="accountName"
                  className="auth-form-input"
                  placeholder="ชื่อบัญชีธนาคาร"
                  value={form.accountName}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="accountNumber">
                  เลขบัญชี <span className="auth-required">*</span>
                </label>
                <input
                  id="accountNumber"
                  type="text"
                  name="accountNumber"
                  className="auth-form-input"
                  placeholder="เลขบัญชีธนาคาร"
                  value={form.accountNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-form-group auth-form-group--full">
                <label className="auth-form-label">
                  QR Code พร้อมเพย์ <span className="auth-required">*</span>
                </label>
                <input
                  ref={qrInputRef}
                  id="promptPayQrCode"
                  type="file"
                  accept="image/*"
                  onChange={handleQrCodeChange}
                  style={{ display: 'none' }}
                />
                <div
                  className={`auth-qr-upload-area${form.promptPayQrCode ? ' has-image' : ''}`}
                  onClick={() => qrInputRef.current && qrInputRef.current.click()}
                >
                  {form.promptPayQrCode ? (
                    <div className="auth-qr-preview">
                      <img src={form.promptPayQrCode} alt="QR Code Preview" />
                      <div className="auth-qr-preview-info">
                        <span className="auth-qr-preview-name">{qrFileName}</span>
                        <span className="auth-qr-preview-sub">คลิกเพื่อเปลี่ยนรูป</span>
                        <button type="button" className="auth-qr-remove-btn" onClick={handleRemoveQr}>
                          ลบรูปภาพ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="auth-qr-placeholder">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <path d="M14 14h2v2h-2zM18 14h3v2h-3zM14 18h3v3h-3zM19 18h2v3h-2z" />
                      </svg>
                      <span className="auth-qr-placeholder-text">คลิกเพื่ออัปโหลด QR Code พร้อมเพย์</span>
                      <span className="auth-qr-placeholder-sub">PNG, JPG ขนาดไม่เกิน 3MB</span>
                    </div>
                  )}
                </div>
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
