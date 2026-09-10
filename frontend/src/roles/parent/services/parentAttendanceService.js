import api from '../../../shared/services/api';

function unwrap(res) {
  const body = res.data;
  if (body && body.success === false) {
    throw new Error(body.message || 'เกิดข้อผิดพลาดจากระบบ');
  }
  return body?.data ?? body;
}

// ข้อมูลบุตรหลานที่ผูกกับบัญชีผู้ปกครอง
export async function getMyChildProfile() {
  const res = await api.get('/students/parent/me');
  return unwrap(res);
}

// ประวัติการเข้าเรียนของบุตรหลาน
export async function getChildAttendance() {
  const res = await api.get('/attendance-records/parent/me');
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
}
