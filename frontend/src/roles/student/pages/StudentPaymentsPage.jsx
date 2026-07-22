import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';
import { getMyEnrollments } from '../services/studentEnrollmentService';
import api from '../../../shared/services/api';
import './StudentPaymentsPage.css';

/* ── Countdown hook (deadline from server) ── */
function useCountdown(deadline) {
  const calc = useCallback(() => {
    if (!deadline) return null;
    const diff = Math.floor((new Date(deadline) - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  }, [deadline]);

  const [secs, setSecs] = useState(calc);
  useEffect(() => {
    setSecs(calc());
    if (!deadline) return;
    const id = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(id);
  }, [deadline, calc]);
  return secs;
}

/* ── Countdown badge ── */
function CountdownBadge({ deadline, onExpired }) {
  const secs = useCountdown(deadline);
  useEffect(() => { if (secs === 0 && onExpired) onExpired(); }, [secs, onExpired]);
  if (secs === null || secs === undefined) return null;
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return (
    <div className={`pay-countdown ${secs <= 60 ? 'pay-countdown--urgent' : ''} ${secs === 0 ? 'pay-countdown--expired' : ''}`}>
      <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
      {secs === 0 ? 'หมดเวลา...' : `ชำระภายใน ${m}:${s}`}
    </div>
  );
}

export default function StudentPaymentsPage() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courseDetails, setCourseDetails] = useState({});
  const [detailModal, setDetailModal] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [slipUrls, setSlipUrls] = useState({});
  const [bulkSlipUrl, setBulkSlipUrl] = useState('');
  const [uploading, setUploading] = useState(null);
  const [copied, setCopied] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') { setDetailModal(null); setPayModal(null); setBulkModal(false); } }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [data, instData] = await Promise.all([
        getMyEnrollments().catch(() => []),
        api.get('/institution-profile').then((r) => r.data.data).catch(() => null),
      ]);
      // แสดงเฉพาะ PENDING + UNPAID (รอชำระ) และ PENDING_VERIFICATION (ส่งสลิปแล้ว รอ admin)
      const active = (Array.isArray(data) ? data : []).filter(
        (e) => e.status !== 'CANCELLED' && e.status !== 'APPROVED' && e.status !== 'REJECTED'
            && e.paymentStatus !== 'PAID'
      );
      setEnrollments(active);
      setInstitution(instData);
    } catch {
      setMessage({ type: 'error', text: 'ไม่สามารถโหลดข้อมูลได้' });
    } finally {
      setLoading(false);
    }
  }

  async function fetchCourseDetail(courseId) {
    if (!courseDetails[courseId]) {
      try {
        const res = await api.get(`/courses/${courseId}`);
        setCourseDetails((prev) => ({ ...prev, [courseId]: res.data.data }));
      } catch {
        setCourseDetails((prev) => ({ ...prev, [courseId]: 'error' }));
      }
    }
  }

  async function openDetailModal(en) { setDetailModal(en); fetchCourseDetail(en.courseId); }
  async function openPayModal(en) { setPayModal(en); fetchCourseDetail(en.courseId); }

  // หมดเวลา — reload หลัง 3 วินาที (รอ scheduler cancel)
  function handleExpired() {
    setTimeout(loadAll, 3000);
  }

  async function handleConfirmPayment(enrollmentId) {
    const url = slipUrls[enrollmentId]?.trim();
    if (!url) { setMessage({ type: 'error', text: 'กรุณาอัพโหลดสลิปก่อนยืนยัน' }); return; }
    try {
      setUploading(enrollmentId);
      setMessage({ type: '', text: '' });
      await api.patch(`/enrollments/${enrollmentId}/slip`, { paymentSlipUrl: url });
      setPayModal(null);
      navigate('/student/enrollment-history');
    } catch (err) {
      const msg = err?.response?.data?.message || '';
      if (msg.includes('SEAT_FULL')) {
        setMessage({ type: 'error', text: 'ขออภัย ที่นั่งเต็มแล้ว ไม่สามารถยืนยันการชำระเงินได้' });
      } else if (msg.includes('cancelled')) {
        setMessage({ type: 'error', text: 'การลงทะเบียนถูกยกเลิกเนื่องจากหมดเวลาชำระเงิน' });
        await loadAll();
      } else {
        setMessage({ type: 'error', text: 'ไม่สามารถยืนยันการชำระเงินได้' });
      }
    } finally {
      setUploading(null);
    }
  }

  async function handleBulkPayment(unpaidEnrollments) {
    if (!bulkSlipUrl.trim()) { setMessage({ type: 'error', text: 'กรุณาอัพโหลดสลิปก่อนยืนยัน' }); return; }
    try {
      setUploading('bulk');
      setMessage({ type: '', text: '' });
      const results = await Promise.allSettled(
        unpaidEnrollments.map((en) => api.patch(`/enrollments/${en.id}/slip`, { paymentSlipUrl: bulkSlipUrl.trim() }))
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      setBulkSlipUrl('');
      setBulkModal(false);
      if (failed === 0) {
        navigate('/student/enrollment-history');
      } else {
        setMessage({ type: 'error', text: `${failed} คอร์สล้มเหลว (อาจที่นั่งเต็ม) กรุณาชำระรายคอร์สแทน` });
        await loadAll();
      }
    } catch {
      setMessage({ type: 'error', text: 'ไม่สามารถยืนยันการชำระเงินได้' });
    } finally {
      setUploading(null);
    }
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 2000); });
  }

  async function downloadQR(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'qrcode.png';
    a.click();
  }

  function fmt(val) {
    if (val == null) return '-';
    return `${Number(val).toLocaleString('th-TH')} บาท`;
  }

  const unpaidEnrollments = enrollments.filter((e) => e.paymentStatus === 'UNPAID' || e.paymentStatus === 'FAILED');
  const totalUnpaid = unpaidEnrollments.reduce((s, e) => s + (Number(e.finalAmount) || 0), 0);

  if (loading) return (
    <div className="pay-page"><div className="pay-loading"><div className="pay-spinner" /><p>กำลังโหลดข้อมูล...</p></div></div>
  );

  return (
    <div className="pay-page">
      <div className="pay-header">
        <div className="pay-header-row">
          <div>
            <h1>การชำระเงิน</h1>
            <p>ชำระเงินภายใน {institution?.enrollmentPaymentDeadlineMinutes ?? 15} นาที เพื่อยืนยันสิทธิ์ในคอร์ส</p>
          </div>
          {unpaidEnrollments.length > 1 && (
            <button className="pay-bulk-btn" onClick={() => setBulkModal(true)}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              ชำระรวม {unpaidEnrollments.length} คอร์ส
            </button>
          )}
        </div>
      </div>

      {message.text && <div className={`pay-alert ${message.type}`}>{message.text}</div>}

      {enrollments.length === 0 ? (
        <div className="pay-empty"><h2>ไม่มีรายการรอชำระเงิน</h2><p>กดสมัครเรียนจากหน้าคอร์ส แล้วมาชำระเงินที่นี่ภายใน {institution?.enrollmentPaymentDeadlineMinutes ?? 15} นาที</p></div>
      ) : (
        <div className="pay-list">
          {enrollments.map((en) => (
            <div className="pay-card" key={en.id}>
              <div className="pay-card-top">
                <div className="pay-card-title">
                  <h2>{en.courseName}</h2>
                </div>
                {en.paymentStatus === 'UNPAID' && en.paymentDeadline ? (
                  <CountdownBadge deadline={en.paymentDeadline} onExpired={handleExpired} />
                ) : en.paymentStatus === 'PENDING_VERIFICATION' ? (
                  <span className="pay-countdown" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
                    รอการยืนยันชำระเงิน
                  </span>
                ) : null}
              </div>

              <div className="pay-card-body">
                <div className="pay-card-price-label">ยอดชำระ</div>
                <div className="pay-amount">{fmt(en.finalAmount)}</div>
              </div>

              {en.paymentStatus === 'PENDING_VERIFICATION' && (
                <div className="pay-submitted-note">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  ส่งสลิปแล้ว รอเจ้าหน้าที่ตรวจสอบ
                  {en.paymentSlipUrl && (
                    <a href={en.paymentSlipUrl} target="_blank" rel="noreferrer" className="pay-slip-link">ดูสลิป</a>
                  )}
                </div>
              )}

              <div className="pay-card-footer">
                <button className="pay-btn-outline" onClick={() => openDetailModal(en)}>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                  ดูรายละเอียดคอร์ส
                </button>
                {(en.paymentStatus === 'UNPAID' || en.paymentStatus === 'FAILED') && (
                  <button className="pay-btn-primary" onClick={() => openPayModal(en)}>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                    </svg>
                    ชำระเงิน
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {detailModal && (
        <CourseDetailModal enrollment={detailModal} detail={courseDetails[detailModal.courseId]} onClose={() => setDetailModal(null)} />
      )}
      {bulkModal && (
        <BulkPaymentModal enrollments={unpaidEnrollments} totalAmount={totalUnpaid} institution={institution} slipUrl={bulkSlipUrl} onSlipChange={setBulkSlipUrl} uploading={uploading === 'bulk'} copied={copied} onCopy={copyText} onDownloadQR={downloadQR} onConfirm={() => handleBulkPayment(unpaidEnrollments)} onClose={() => setBulkModal(false)} fmt={fmt} />
      )}
      {payModal && (
        <PaymentModal enrollment={payModal} detail={courseDetails[payModal.courseId]} institution={institution} slipUrl={slipUrls[payModal.id] || ''} onSlipChange={(v) => setSlipUrls((p) => ({ ...p, [payModal.id]: v }))} uploading={uploading === payModal.id} copied={copied} onCopy={copyText} onDownloadQR={downloadQR} onConfirm={() => handleConfirmPayment(payModal.id)} onClose={() => setPayModal(null)} fmt={fmt} />
      )}
    </div>
  );
}

function BulkPaymentModal({ enrollments, totalAmount, institution, slipUrl, onSlipChange, uploading, copied, onCopy, onDownloadQR, onConfirm, onClose, fmt }) {
  return (
    <ModalShell title="ชำระรวมทุกคอร์ส" onClose={onClose} wide>
      <div className="bulk-course-list">
        {enrollments.map((en) => (
          <div className="bulk-course-row" key={en.id}>
            <div>
              <span className="pay-code" style={{ fontSize: 11 }}>{en.enrollmentCode}</span>
              <strong>{en.courseName}</strong>
            </div>
            <span className="bulk-course-amount">{fmt(en.finalAmount)}</span>
          </div>
        ))}
      </div>
      <div className="bulk-total-box">
        <div className="bulk-total-label">
          <span>ยอดรวมทั้งหมด</span>
          <span className="bulk-total-count">{enrollments.length} คอร์ส</span>
        </div>
        <strong className="bulk-total-amount">{fmt(totalAmount)}</strong>
      </div>
      <div className="pay-modal-divider" />
      {institution ? (
        <BankInfo institution={institution} totalAmount={totalAmount} copied={copied} onCopy={onCopy} onDownloadQR={onDownloadQR} fmt={fmt} prefix="bulk" />
      ) : <p className="pay-modal-empty">ไม่พบข้อมูลบัญชีธนาคารของสถาบัน</p>}
      <div className="pay-modal-divider" />
      <div className="pay-modal-section">
        <h3 className="pay-modal-section-title">แนบสลิปการโอนเงิน</h3>
        <SlipUploader slipUrl={slipUrl} onSlipChange={onSlipChange} />
      </div>
      <button className="pay-confirm-btn" disabled={uploading || !slipUrl.trim()} onClick={onConfirm}>
        {uploading ? 'กำลังส่ง...' : `ยืนยันการชำระเงินรวม ${enrollments.length} คอร์ส`}
      </button>
    </ModalShell>
  );
}

function CourseDetailModal({ enrollment, detail, onClose }) {
  return (
    <ModalShell title={enrollment.courseName} onClose={onClose}>
      <CourseDetailBody detail={detail} />
    </ModalShell>
  );
}

function PaymentModal({ enrollment, detail, institution, slipUrl, onSlipChange, uploading, copied, onCopy, onDownloadQR, onConfirm, onClose, fmt }) {
  return (
    <ModalShell title={`ชำระเงิน — ${enrollment.courseName}`} onClose={onClose} wide>
      <CourseDetailBody detail={detail} compact />
      <div className="pay-modal-divider" />
      {institution ? (
        <BankInfo institution={institution} totalAmount={enrollment.finalAmount} copied={copied} onCopy={onCopy} onDownloadQR={onDownloadQR} fmt={fmt} prefix="single" />
      ) : <p className="pay-modal-empty">ไม่พบข้อมูลบัญชีธนาคารของสถาบัน</p>}
      <div className="pay-modal-divider" />
      <div className="pay-modal-section">
        <h3 className="pay-modal-section-title">แนบสลิปการโอนเงิน</h3>
        <SlipUploader slipUrl={slipUrl} onSlipChange={onSlipChange} />
      </div>
      <button className="pay-confirm-btn" disabled={uploading || !slipUrl.trim()} onClick={onConfirm}>
        {uploading ? 'กำลังส่ง...' : 'ยืนยันการชำระเงิน'}
      </button>
    </ModalShell>
  );
}

function DynamicPromptPayQr({ promptPayId, amount }) {
  const [dataUrl, setDataUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const numAmount = Number(amount);
    if (!promptPayId || !numAmount || numAmount <= 0) return;
    let cancelled = false;
    Promise.resolve()
      .then(() => generatePayload(promptPayId, { amount: numAmount }))
      .then((payload) => QRCode.toDataURL(payload, { margin: 1, width: 220 }))
      .then((url) => { if (!cancelled) setDataUrl(url); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [promptPayId, amount]);

  if (failed) return null;
  return (
    <div className="pay-qr-box">
      {dataUrl ? (
        <>
          <img src={dataUrl} alt="QR พร้อมเพย์ (ระบุยอดเงินแล้ว)" />
          <span className="pay-qr-dynamic-hint">สแกนแล้วยอด {Number(amount).toLocaleString('th-TH')} บาท จะขึ้นให้อัตโนมัติ</span>
          <a className="pay-qr-download" href={dataUrl} download="promptpay-qr.png">บันทึก QR Code</a>
        </>
      ) : (
        <div className="pay-spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
      )}
    </div>
  );
}

function BankInfo({ institution, totalAmount, copied, onCopy, onDownloadQR, fmt, prefix }) {
  return (
    <div className="pay-modal-section">
      <h3 className="pay-modal-section-title">ข้อมูลการชำระเงิน</h3>
      <div className="pay-bank-layout">
        {institution.promptPayId ? (
          <DynamicPromptPayQr key={totalAmount} promptPayId={institution.promptPayId} amount={totalAmount} />
        ) : institution.bankQrCode && (
          <div className="pay-qr-box">
            <img src={institution.bankQrCode} alt="QR โอนเงิน" />
            <button className="pay-qr-download" onClick={() => onDownloadQR(institution.bankQrCode)}>บันทึก QR Code</button>
          </div>
        )}
        <div className="pay-bank-info">
          <div className="pay-bank-row"><span>ธนาคาร</span><strong>{institution.bankName || '-'}</strong></div>
          <div className="pay-bank-row"><span>ชื่อบัญชี</span><strong>{institution.bankAccountName || '-'}</strong></div>
          <div className="pay-bank-row">
            <span>เลขบัญชี</span>
            <div className="pay-copy-row">
              <strong>{institution.bankAccountNumber || '-'}</strong>
              <button className="pay-copy-btn" onClick={() => onCopy(institution.bankAccountNumber, `${prefix}-acc`)}>
                {copied === `${prefix}-acc` ? 'คัดลอกแล้ว!' : 'คัดลอก'}
              </button>
            </div>
          </div>
          <div className="pay-bank-row pay-total-row">
            <span>ยอดชำระ</span>
            <div className="pay-copy-row">
              <strong className="pay-total-amount">{fmt(totalAmount)}</strong>
              <button className="pay-copy-btn" onClick={() => onCopy(String(totalAmount), `${prefix}-amt`)}>
                {copied === `${prefix}-amt` ? 'คัดลอกแล้ว!' : 'คัดลอก'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalShell({ title, onClose, children, wide }) {
  return (
    <div className="pay-modal-overlay" onClick={onClose}>
      <div className={`pay-modal ${wide ? 'pay-modal--wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="pay-modal-header">
          <h2>{title}</h2>
          <button className="pay-modal-close" onClick={onClose}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="pay-modal-body">{children}</div>
      </div>
    </div>
  );
}

function SlipUploader({ slipUrl, onSlipChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('ไฟล์ต้องมีขนาดไม่เกิน 5 MB'); return; }
    setError(''); setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSlipChange(res.data.data);
    } catch { setError('อัพโหลดไม่สำเร็จ กรุณาลองใหม่'); }
    finally { setUploading(false); }
  }

  return (
    <div className="slip-uploader">
      <label className={`slip-drop-zone ${uploading ? 'uploading' : ''} ${slipUrl ? 'has-file' : ''}`}>
        <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} style={{ display: 'none' }} />
        {uploading ? (
          <div className="slip-uploading-state"><div className="pay-spinner" style={{ width: 24, height: 24, borderWidth: 2 }} /><span>กำลังอัพโหลด...</span></div>
        ) : slipUrl ? (
          <div className="slip-preview-state"><img src={slipUrl} alt="สลิป" /><span className="slip-change-hint">คลิกเพื่อเปลี่ยนรูป</span></div>
        ) : (
          <div className="slip-empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <strong>คลิกเพื่อเลือกรูปสลิป</strong>
            <span>JPG, PNG, WEBP ขนาดไม่เกิน 5 MB</span>
          </div>
        )}
      </label>
      {error && <p className="slip-error">{error}</p>}
    </div>
  );
}

function CourseDetailBody({ detail, compact }) {
  if (!detail) return <div className="pay-modal-loading"><div className="pay-spinner" /><p>กำลังโหลด...</p></div>;
  if (detail === 'error') return <p className="pay-modal-error">ไม่สามารถโหลดข้อมูลคอร์สได้</p>;
  return (
    <div className="pay-course-detail">
      <div className="pay-modal-info-grid">
        <div><span>ผู้สอน</span><strong>{detail.teacherName || '-'}</strong></div>
        <div><span>จำนวนชั่วโมง</span><strong>{detail.totalHours != null ? `${detail.totalHours} ชั่วโมง` : '-'}</strong></div>
        <div><span>ตารางเรียน</span><strong>{detail.scheduleDays ? `${detail.scheduleDays} ${detail.scheduleStartTime || ''} - ${detail.scheduleEndTime || ''}`.trim() : '-'}</strong></div>
        <div><span>วันเริ่มเรียน</span><strong>{detail.courseStartDate ? new Date(detail.courseStartDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</strong></div>
      </div>
      {!compact && detail.description && <div className="pay-modal-desc"><p>{detail.description}</p></div>}
      <div className="pay-modal-section">
        <h3 className="pay-modal-section-title">บทเรียน ({detail.lessons?.length || 0} บท)</h3>
        {detail.lessons?.length > 0 ? (
          <ul className="pay-modal-list">{detail.lessons.map((l) => (
            <li key={l.id}><span className="pay-modal-order">บทที่ {l.lessonOrder}</span><div><strong>{l.lessonTitle}</strong>{l.lessonContent && <p>{l.lessonContent}</p>}</div></li>
          ))}</ul>
        ) : <p className="pay-modal-empty">ยังไม่มีบทเรียน</p>}
      </div>
      <div className="pay-modal-section">
        <h3 className="pay-modal-section-title">การทดสอบ ({detail.tests?.length || 0} รายการ)</h3>
        {detail.tests?.length > 0 ? (
          <ul className="pay-modal-list">{detail.tests.map((t) => (
            <li key={t.id}><span className="pay-modal-order">ครั้งที่ {t.testOrder}</span><div><strong>{t.testTitle}</strong>{t.testDescription && <p>{t.testDescription}</p>}</div></li>
          ))}</ul>
        ) : <p className="pay-modal-empty">ยังไม่มีการทดสอบ</p>}
      </div>
    </div>
  );
}
