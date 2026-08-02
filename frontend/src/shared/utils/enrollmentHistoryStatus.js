// สถานะ "ประวัติการสมัคร/ชำระเงิน" แบบเดียวกัน ใช้ร่วมกันทั้งหน้าแอดมินและนักเรียน
// ยุบสถานะจริง (enrollment.status/paymentStatus) ให้เหลือกลุ่มที่ผู้ใช้เห็น — REJECTED คือแอดมินปฏิเสธถาวร
// (แยกจาก CANCELLED ซึ่งเป็นนักเรียน/ระบบยกเลิกเอง เช่น หมดเวลาชำระเงิน) ที่นั่งของ REJECTED จะถูกคืนกลับเข้าระบบอัตโนมัติ
// NEEDS_REVISION คือ enrollment ที่แอดมิน "ส่งกลับแก้ไขสลิป" (status ยังเป็น PENDING แต่ paymentStatus เป็น FAILED) —
// ไม่ใช่การปฏิเสธถาวร นักเรียนอัปโหลดสลิปใหม่ได้จากหน้าการชำระเงิน แล้วจะกลับไปเป็น PENDING_VERIFICATION ทันที
// การสมัครซ้ำหลังยกเลิก/หมดเวลา (row เดิมถูกรีเซ็ตกลับเป็น PENDING+UNPAID — ดู EnrollmentServiceImpl
// reuse-cancelled-row) ที่ยังไม่เคยส่งสลิปสำหรับรอบใหม่นี้ ก็ถูกจัดเข้ากลุ่ม PENDING_VERIFICATION เดียวกัน
// (ระบบมีสถานะ "รอ" อยู่กลุ่มเดียวคือรอการยืนยันชำระเงิน ไม่แยกเป็นสถานะ "รอชำระเงิน" ต่างหากอีกต่อไป)
export const ENROLLMENT_HISTORY_STATUSES = ['PENDING_VERIFICATION', 'NEEDS_REVISION', 'APPROVED', 'REJECTED', 'CANCELLED'];

export const ENROLLMENT_HISTORY_STATUS_LABEL = {
  PENDING_VERIFICATION: 'รอการยืนยันชำระเงิน',
  NEEDS_REVISION:       'แก้ไขสลิป',
  APPROVED:             'ชำระเงินเรียบร้อยแล้ว',
  REJECTED:             'ปฏิเสธ',
  CANCELLED:            'ยกเลิก',
};

// enrollment ที่สมัครซ้ำ (reuse row เดิม) จะมี enrollmentDate ถูกรีเซ็ตใหม่ทุกครั้ง ในขณะที่ createdAt
// ตั้งครั้งเดียวตอน insert แถวแรกและไม่เปลี่ยนอีกเลย — ต่างกันแปลว่า row นี้เคยถูกสมัคร/ยกเลิกมาก่อนแล้ว
export function isReenrollment(enrollment) {
  return !!enrollment.createdAt && !!enrollment.enrollmentDate && enrollment.createdAt !== enrollment.enrollmentDate;
}

export function getEnrollmentHistoryStatus(enrollment) {
  if (enrollment.status === 'APPROVED' || enrollment.status === 'COMPLETED') return 'APPROVED';
  if (enrollment.status === 'REJECTED') return 'REJECTED';
  if (enrollment.status === 'CANCELLED') return 'CANCELLED';
  if (enrollment.status === 'PENDING' && enrollment.paymentStatus === 'FAILED') return 'NEEDS_REVISION';
  return 'PENDING_VERIFICATION';
}
