import { useEffect, useState } from 'react';
import { getMyEnrollments } from '../services/studentEnrollmentService';
import api from '../../../shared/services/api';
import './StudentPaymentsPage.css';

export default function StudentPaymentsPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slipUrls, setSlipUrls] = useState({});
  const [uploading, setUploading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadEnrollments();
  }, []);

  async function loadEnrollments() {
    try {
      setLoading(true);
      const data = await getMyEnrollments();
      const pending = (Array.isArray(data) ? data : []).filter(
        (e) => e.status === 'PENDING' || e.status === 'APPROVED'
      );
      setEnrollments(pending);
    } catch {
      setMessage({ type: 'error', text: 'ไม่สามารถโหลดข้อมูลได้' });
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadSlip(enrollmentId) {
    const url = slipUrls[enrollmentId]?.trim();
    if (!url) {
      setMessage({ type: 'error', text: 'กรุณากรอก URL สลิปการชำระเงิน' });
      return;
    }

    try {
      setUploading(enrollmentId);
      setMessage({ type: '', text: '' });
      await api.patch(`/enrollments/${enrollmentId}/slip`, { paymentSlipUrl: url });
      setMessage({ type: 'success', text: 'อัพโหลดสลิปสำเร็จ กรุณารอเจ้าหน้าที่ตรวจสอบ' });
      setSlipUrls((prev) => ({ ...prev, [enrollmentId]: '' }));
      await loadEnrollments();
    } catch {
      setMessage({ type: 'error', text: 'ไม่สามารถอัพโหลดสลิปได้' });
    } finally {
      setUploading(null);
    }
  }

  function getPaymentStatusLabel(status) {
    const labels = {
      UNPAID: 'ยังไม่ชำระ',
      PENDING_VERIFICATION: 'รอตรวจสอบ',
      PAID: 'ชำระแล้ว',
      FAILED: 'ล้มเหลว',
      REFUNDED: 'คืนเงินแล้ว',
    };
    return labels[status] || status || '-';
  }

  function getEnrollmentStatusLabel(status) {
    const labels = {
      PENDING: 'รอดำเนินการ',
      APPROVED: 'อนุมัติแล้ว',
      REJECTED: 'ถูกปฏิเสธ',
      CANCELLED: 'ยกเลิกแล้ว',
      COMPLETED: 'เสร็จสิ้น',
    };
    return labels[status] || status || '-';
  }

  function formatMoney(val) {
    if (val == null) return '-';
    return `${Number(val).toLocaleString('th-TH')} บาท`;
  }

  function formatDate(val) {
    if (!val) return '-';
    return new Date(val).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="payment-page">
        <div className="payment-loading">
          <div className="payment-spinner" />
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-header">
        <div>
          <h1>การชำระเงิน</h1>
          <p>รายการที่รอชำระเงินและรอการอนุมัติ</p>
        </div>
      </div>

      {message.text && (
        <div className={`payment-alert ${message.type}`}>{message.text}</div>
      )}

      {enrollments.length === 0 ? (
        <div className="payment-empty">
          <h2>ไม่มีรายการรอชำระเงิน</h2>
          <p>เมื่อสมัครเรียนคอร์สแล้ว รายการจะแสดงที่หน้านี้</p>
        </div>
      ) : (
        <div className="payment-list">
          {enrollments.map((enrollment) => {
            const canUpload =
              enrollment.paymentStatus === 'UNPAID' ||
              enrollment.paymentStatus === 'FAILED';

            return (
              <div className="payment-card" key={enrollment.id}>
                <div className="payment-card-top">
                  <span className="payment-code">{enrollment.enrollmentCode || '-'}</span>
                  <div className="payment-badges">
                    <span className={`payment-badge enrollment-${enrollment.status?.toLowerCase()}`}>
                      {getEnrollmentStatusLabel(enrollment.status)}
                    </span>
                    <span className={`payment-badge payment-${enrollment.paymentStatus?.toLowerCase()}`}>
                      {getPaymentStatusLabel(enrollment.paymentStatus)}
                    </span>
                  </div>
                </div>

                <h2>{enrollment.courseName || '-'}</h2>

                <div className="payment-info">
                  <div>
                    <span>ยอดชำระ</span>
                    <strong>{formatMoney(enrollment.finalAmount)}</strong>
                  </div>
                  <div>
                    <span>วิธีชำระ</span>
                    <strong>{enrollment.paymentMethod === 'BANK_TRANSFER' ? 'โอนเงิน' : enrollment.paymentMethod || '-'}</strong>
                  </div>
                  <div>
                    <span>วันที่สมัคร</span>
                    <strong>{formatDate(enrollment.enrollmentDate)}</strong>
                  </div>
                </div>

                {enrollment.paymentSlipUrl && (
                  <div className="payment-slip-preview">
                    <span>สลิปที่แนบ:</span>
                    <a href={enrollment.paymentSlipUrl} target="_blank" rel="noreferrer">
                      ดูสลิป
                    </a>
                  </div>
                )}

                {canUpload && (
                  <div className="payment-upload">
                    <input
                      type="url"
                      placeholder="วาง URL รูปสลิปการโอนเงิน"
                      value={slipUrls[enrollment.id] || ''}
                      onChange={(e) =>
                        setSlipUrls((prev) => ({ ...prev, [enrollment.id]: e.target.value }))
                      }
                    />
                    <button
                      onClick={() => handleUploadSlip(enrollment.id)}
                      disabled={uploading === enrollment.id}
                    >
                      {uploading === enrollment.id ? 'กำลังส่ง...' : 'ส่งสลิป'}
                    </button>
                  </div>
                )}

                {enrollment.paymentStatus === 'PENDING_VERIFICATION' && (
                  <div className="payment-waiting-note">
                    รอเจ้าหน้าที่ตรวจสอบสลิปการชำระเงิน
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
