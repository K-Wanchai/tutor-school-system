import api from '../../../shared/services/api';

function unwrap(res) {
  const body = res.data;
  if (body && body.success === false) {
    throw new Error(body.message || 'เกิดข้อผิดพลาดจากระบบ');
  }
  return body?.data ?? body;
}

function asArray(data) {
  return Array.isArray(data) ? data : [];
}

// ข้อมูลบุตรหลานที่ผูกกับบัญชีผู้ปกครอง
export async function getMyChildProfile() {
  return unwrap(await api.get('/parent/me'));
}

// ประวัติการสมัครเรียนของบุตรหลาน
export async function getChildEnrollments() {
  return asArray(unwrap(await api.get('/parent/enrollments')));
}
