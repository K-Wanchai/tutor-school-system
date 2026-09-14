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

// การเช็คชื่อเข้าเรียนของบุตรหลาน ทุกคอร์ส
export async function getChildAttendance() {
  return asArray(unwrap(await api.get('/parent/attendance')));
}

// คาบเรียนของคอร์สหนึ่ง (คำนวณจากตารางสอนรายสัปดาห์ + วันเริ่มเรียน) — ใช้เป็นคอลัมน์ของตารางเช็คชื่อ
export async function getChildCourseSessions(courseId) {
  return asArray(unwrap(await api.get(`/parent/courses/${courseId}/sessions`)));
}

// ตารางสอบของบุตรหลาน ทุกคอร์สที่ลงทะเบียนอยู่
export async function getChildExams() {
  return asArray(unwrap(await api.get('/parent/exams')));
}

// คะแนนสอบของบุตรหลานในคอร์สหนึ่ง (ที่ติวเตอร์กรอกเอง — ข้อสอบลิงก์ภายนอก)
export async function getChildCourseScores(courseId) {
  return asArray(unwrap(await api.get(`/parent/courses/${courseId}/exam-scores`)));
}
