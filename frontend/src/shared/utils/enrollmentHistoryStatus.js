// สถานะ "ประวัติการสมัคร/ชำระเงิน" แบบเดียวกัน ใช้ร่วมกันทั้งหน้าแอดมินและนักเรียน
// ยุบสถานะจริง (enrollment.status/paymentStatus) ให้เหลือกลุ่มที่ผู้ใช้เห็น — REJECTED (สถานะเดิมจากระบบ
// ปฏิเสธแบบเก่าก่อนเปลี่ยนมาเป็น "ส่งกลับแก้ไขสลิป") ถูกยุบรวมเข้ากับ CANCELLED เพื่อไม่ให้ข้อมูลเก่าที่ค้างอยู่หายไปจากประวัติ
// NEEDS_REVISION คือ enrollment ที่แอดมิน "ส่งกลับแก้ไขสลิป" (status ยังเป็น PENDING แต่ paymentStatus เป็น FAILED) —
// ไม่ใช่การปฏิเสธถาวร นักเรียนอัปโหลดสลิปใหม่ได้จากหน้าการชำระเงิน แล้วจะกลับไปเป็น PENDING_VERIFICATION ทันที
// AWAITING_PAYMENT คือ enrollment ที่ถูกสมัครซ้ำหลังยกเลิก/หมดเวลา (row เดิมถูกรีเซ็ตกลับเป็น PENDING+UNPAID —
// ดู EnrollmentServiceImpl reuse-cancelled-row) ยังไม่เคยส่งสลิปสำหรับรอบใหม่นี้ ต่างจาก PENDING+UNPAID ของการสมัคร
// ครั้งแรกตรงที่ row นี้เคยมีประวัติมาก่อนแล้ว จึงยังต้องแสดงในหน้าประวัติต่อไป ไม่ให้ประวัติเดิมหายไปเงียบๆ
export const ENROLLMENT_HISTORY_STATUSES = ['AWAITING_PAYMENT', 'PENDING_VERIFICATION', 'NEEDS_REVISION', 'APPROVED', 'CANCELLED'];

export const ENROLLMENT_HISTORY_STATUS_LABEL = {
  AWAITING_PAYMENT:     'รอชำระเงิน',
  PENDING_VERIFICATION: 'รอการยืนยันชำระเงิน',
  NEEDS_REVISION:       'แก้ไขสลิป',
  APPROVED:             'ชำระเงินเรียบร้อยแล้ว',
  CANCELLED:            'ยกเลิก',
};

// enrollment ที่สมัครซ้ำ (reuse row เดิม) จะมี enrollmentDate ถูกรีเซ็ตใหม่ทุกครั้ง ในขณะที่ createdAt
// ตั้งครั้งเดียวตอน insert แถวแรกและไม่เปลี่ยนอีกเลย — ต่างกันแปลว่า row นี้เคยถูกสมัคร/ยกเลิกมาก่อนแล้ว
export function isReenrollment(enrollment) {
  return !!enrollment.createdAt && !!enrollment.enrollmentDate && enrollment.createdAt !== enrollment.enrollmentDate;
}

export function getEnrollmentHistoryStatus(enrollment) {
  if (enrollment.status === 'APPROVED' || enrollment.status === 'COMPLETED') return 'APPROVED';
  if (enrollment.status === 'CANCELLED' || enrollment.status === 'REJECTED') return 'CANCELLED';
  if (enrollment.status === 'PENDING' && enrollment.paymentStatus === 'FAILED') return 'NEEDS_REVISION';
  if (enrollment.status === 'PENDING' && enrollment.paymentStatus === 'UNPAID') {
    return isReenrollment(enrollment) ? 'AWAITING_PAYMENT' : 'PENDING_VERIFICATION';
  }
  return 'PENDING_VERIFICATION';
}
