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

// คาบเรียนจริงตามตารางสอนของคอร์ส (ใช้เป็นหัวคอลัมน์)
export async function getCourseSchedules(courseId) {
  try {
    const res = await api.get(`/course-schedules/course/${courseId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(apiError(error, 'getCourseSchedules'), { cause: error });
  }
}

// การเข้าเรียนที่ติวเตอร์บันทึกเองรายคอร์ส
export async function getCourseAttendanceGrid(courseId) {
  try {
    const res = await api.get(`/schedule-attendance/course/${courseId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(apiError(error, 'getCourseAttendanceGrid'), { cause: error });
  }
}

export async function saveAttendanceCell({ scheduleId, studentId, status, note }) {
  try {
    const res = await api.put('/schedule-attendance', { scheduleId, studentId, status, note });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'saveAttendanceCell'), { cause: error });
  }
}

export async function deleteAttendanceCell(scheduleId, studentId) {
  try {
    await api.delete(`/schedule-attendance/schedule/${scheduleId}/student/${studentId}`);
  } catch (error) {
    throw new Error(apiError(error, 'deleteAttendanceCell'), { cause: error });
  }
}
