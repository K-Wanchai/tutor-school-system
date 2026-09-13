import api from '../../../shared/services/api';

function unwrapApiResponse(res) {
  const body = res.data;

  if (!body?.success) {
    throw new Error(body?.message || 'เกิดข้อผิดพลาดจากระบบ');
  }

  return body.data;
}

// การเช็คชื่อ (onsite) ที่ติวเตอร์บันทึกให้นักเรียนคนนี้ ทุกคอร์ส
export async function getMyClassAttendance() {
  const res = await api.get('/class-attendance/student/me');
  return unwrapApiResponse(res);
}
