// สถานะ "ประวัติการสมัคร/ชำระเงิน" แบบเดียวกัน ใช้ร่วมกันทั้งหน้าแอดมินและนักเรียน
// ยุบสถานะจริง (enrollment.status/paymentStatus) ให้เหลือ 4 กลุ่มที่ผู้ใช้เห็น — REJECTED (สถานะเดิมจากระบบ
// ปฏิเสธแบบเก่าก่อนเปลี่ยนมาเป็น "ส่งกลับแก้ไขสลิป") ถูกยุบรวมเข้ากับ CANCELLED เพื่อไม่ให้ข้อมูลเก่าที่ค้างอยู่หายไปจากประวัติ
// NEEDS_REVISION คือ enrollment ที่แอดมิน "ส่งกลับแก้ไขสลิป" (status ยังเป็น PENDING แต่ paymentStatus เป็น FAILED) —
// ไม่ใช่การปฏิเสธถาวร นักเรียนอัปโหลดสลิปใหม่ได้จากหน้าการชำระเงิน แล้วจะกลับไปเป็น PENDING_VERIFICATION ทันที
export const ENROLLMENT_HISTORY_STATUSES = ['PENDING_VERIFICATION', 'NEEDS_REVISION', 'APPROVED', 'CANCELLED'];

export const ENROLLMENT_HISTORY_STATUS_LABEL = {
  PENDING_VERIFICATION: 'รอการยืนยันชำระเงิน',
  NEEDS_REVISION:       'แก้ไขสลิป',
  APPROVED:             'ชำระเงินเรียบร้อยแล้ว',
  CANCELLED:            'ยกเลิก',
};

export function getEnrollmentHistoryStatus(enrollment) {
  if (enrollment.status === 'APPROVED' || enrollment.status === 'COMPLETED') return 'APPROVED';
  if (enrollment.status === 'CANCELLED' || enrollment.status === 'REJECTED') return 'CANCELLED';
  if (enrollment.status === 'PENDING' && enrollment.paymentStatus === 'FAILED') return 'NEEDS_REVISION';
  return 'PENDING_VERIFICATION';
}
