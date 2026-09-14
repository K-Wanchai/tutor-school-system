import api from './api';

// สถิติผลสอบเข้าแบบสาธารณะ (ไม่ต้องล็อกอิน) — ใช้แสดงบนหน้าแลนดิ้งเพจ
export async function getPublicEntranceExamStats() {
  const res = await api.get('/public/entrance-exam-stats');
  return res.data?.data ?? res.data;
}
