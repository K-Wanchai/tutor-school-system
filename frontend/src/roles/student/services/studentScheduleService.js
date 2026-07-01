import api from '../../../shared/services/api';

function unwrapApiResponse(res) {
  const body = res.data;

  if (!body?.success) {
    throw new Error(body?.message || 'เกิดข้อผิดพลาดจากระบบ');
  }

  return body.data;
}

export async function getMySchedule() {
  // TODO: ตรวจสอบ endpoint จริงจาก backend
  // ตัวเลือกที่อาจเป็นไปได้:
  // /course-schedules/my
  // /course-schedules/student/me
  // /schedules/my
  // /classroom-sessions/my
  // /enrollments/my แล้วค่อยดึง schedule ตาม courseId
  const res = await api.get('/course-schedules/my');
  return unwrapApiResponse(res);
}