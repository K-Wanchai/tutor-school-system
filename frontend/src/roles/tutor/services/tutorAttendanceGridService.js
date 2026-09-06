import api from '../../../shared/services/api';

function unwrap(res) {
  return res.data?.data ?? res.data;
}

function apiError(error, label) {
  const status = error.response?.status;
  const serverMsg = error.response?.data?.message;
  console.error(`[${label}]`, error.response?.data || error.message);
  if (!error.response) return 'ไม่สามารถเชื่อมต่อ backend ได้';
  if (status === 401) return 'กรุณาเข้าสู่ระบบใหม่';
  if (status === 403) return 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้';
  return serverMsg || `เกิดข้อผิดพลาด (${status})`;
}

// คาบเรียนจริงของคอร์ส (วัน/เวลาที่มีเรียนตามตารางสอน) — ดึงจากตารางสอนของติวเตอร์แล้วกรองเฉพาะคอร์สนี้
// endpoint นี้คืนทั้งคาบที่แอดมินสร้างไว้จริง และคาบ "เสมือน" ที่คำนวณจาก scheduleDays + วันเริ่มเรียน
export async function getCourseSchedules(courseId) {
  try {
    const res = await api.get('/course-schedules/tutor/me');
    const data = unwrap(res);
    const list = Array.isArray(data) ? data : [];
    return list.filter((s) => String(s.courseId) === String(courseId));
  } catch (error) {
    throw new Error(apiError(error, 'getCourseSchedules'), { cause: error });
  }
}

export async function getCourseAttendanceGrid(courseId) {
  try {
    const res = await api.get(`/class-attendance/course/${courseId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(apiError(error, 'getCourseAttendanceGrid'), { cause: error });
  }
}

export async function saveAttendanceCell({ courseId, studentId, sessionDate, status, note }) {
  try {
    const res = await api.put('/class-attendance', { courseId, studentId, sessionDate, status, note });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'saveAttendanceCell'), { cause: error });
  }
}

export async function deleteAttendanceCell(courseId, studentId, sessionDate) {
  try {
    await api.delete(`/class-attendance/course/${courseId}/student/${studentId}`, {
      params: { date: sessionDate },
    });
  } catch (error) {
    throw new Error(apiError(error, 'deleteAttendanceCell'), { cause: error });
  }
}
