// แปลงค่าสถานะ (enum ภาษาอังกฤษจาก backend) เป็นข้อความภาษาไทยสำหรับแสดงผล
// ใช้ร่วมกันทุกแดชบอร์ด (ติวเตอร์ / นักเรียน / แอดมิน)

export const COURSE_STATUS_TH = {
  PENDING: 'รอเปิดรับสมัคร',
  OPEN_FOR_REGISTRATION: 'เปิดรับสมัคร',
  CLOSED: 'ปิดรับสมัคร',
  ONGOING: 'กำลังเรียน',
  COMPLETED: 'สอนจบแล้ว',
};

export const SCHEDULE_STATUS_TH = {
  SCHEDULED: 'ตามกำหนดการ',
  ONGOING: 'กำลังเรียน',
  COMPLETED: 'เรียนจบแล้ว',
  CANCELLED: 'ยกเลิก',
};

export const ENROLLMENT_STATUS_TH = {
  PENDING: 'รออนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ถูกปฏิเสธ',
  CANCELLED: 'ยกเลิก',
  COMPLETED: 'เรียนจบแล้ว',
};

export const PAYMENT_STATUS_TH = {
  UNPAID: 'ยังไม่ชำระเงิน',
  PENDING_VERIFICATION: 'รอตรวจสอบสลิป',
  PAID: 'ชำระเงินแล้ว',
  FAILED: 'ชำระเงินไม่สำเร็จ',
  PENDING: 'รอดำเนินการ',
  VERIFIED: 'ยืนยันแล้ว',
  REJECTED: 'ปฏิเสธ',
  OVERDUE: 'เกินกำหนด',
};

export const EXAM_STATUS_TH = {
  NOT_STARTED: 'ยังไม่เริ่มสอบ',
  IN_PROGRESS: 'กำลังสอบ',
  SUBMITTED: 'ส่งแล้ว รอตรวจ',
  GRADED: 'ตรวจแล้ว',
  COMPLETED: 'เสร็จสิ้น',
  EXPIRED: 'หมดเวลา',
  ABSENT: 'ขาดสอบ',
  CANCELLED: 'ยกเลิก',
};

export const ATTENDANCE_STATUS_TH = {
  PRESENT: 'เข้าเรียน',
  LATE: 'มาสาย',
  ABSENT: 'ขาดเรียน',
  LEAVE: 'ลา',
  EXCUSED: 'ลาที่ได้รับอนุญาต',
};

// รวมทุก map ไว้ตัวเดียว สำหรับกรณีที่ไม่รู้แน่ชัดว่าเป็นสถานะประเภทไหน
const ALL_STATUS_TH = {
  ...COURSE_STATUS_TH,
  ...SCHEDULE_STATUS_TH,
  ...ENROLLMENT_STATUS_TH,
  ...PAYMENT_STATUS_TH,
  ...EXAM_STATUS_TH,
  ...ATTENDANCE_STATUS_TH,
};

export function statusLabelTH(status, map = ALL_STATUS_TH) {
  if (status === null || status === undefined || status === '') return '-';
  return map[status] || map[String(status).toUpperCase()] || String(status);
}
