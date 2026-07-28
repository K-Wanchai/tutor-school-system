// สถานะ "ประวัติการสมัคร/ชำระเงิน" แบบเดียวกัน ใช้ร่วมกันทั้งหน้าแอดมินและนักเรียน
// ยุบสถานะจริง (enrollment.status) ให้เหลือ 4 กลุ่มที่ผู้ใช้เห็น
export const ENROLLMENT_HISTORY_STATUSES = ['PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'CANCELLED'];

export const ENROLLMENT_HISTORY_STATUS_LABEL = {
  PENDING_VERIFICATION: 'รอการยืนยันชำระเงิน',
  APPROVED:             'ชำระเงินเรียบร้อยแล้ว',
  REJECTED:             'ปฏิเสธ',
  CANCELLED:            'ยกเลิก',
};

export function getEnrollmentHistoryStatus(enrollment) {
  if (enrollment.status === 'APPROVED' || enrollment.status === 'COMPLETED') return 'APPROVED';
  if (enrollment.status === 'REJECTED') return 'REJECTED';
  if (enrollment.status === 'CANCELLED') return 'CANCELLED';
  return 'PENDING_VERIFICATION';
}
