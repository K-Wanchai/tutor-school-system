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
  if (status === 404) return 'ไม่พบข้อมูลที่ต้องการ';
  return serverMsg || `เกิดข้อผิดพลาด (${status})`;
}

// คาบเรียนจริง + คาบ "เสมือน" ของคอร์ส (backend รวมให้แล้วสำหรับ ADMIN)
export async function getCourseSchedules(courseId) {
  try {
    const res = await api.get(`/course-schedules/course/${courseId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
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
