import api from '../../../shared/services/api';

function unwrapApiResponse(res) {
  const body = res.data;

  if (!body?.success) {
    throw new Error(body?.message || 'เกิดข้อผิดพลาดจากระบบ');
  }

  return body.data;
}

export async function getMyClassroomSessions() {
  // TODO: ถ้า backend ไม่มี endpoint นี้ ให้ปรับให้ตรงกับ endpoint จริง
  // ตัวเลือกที่เป็นไปได้: /classroom-sessions/my หรือ /course-schedules/my
  const res = await api.get('/classroom-sessions/my');
  return unwrapApiResponse(res);
}

export async function getMyAttendanceHistory() {
  // ใช้ endpoint ที่เคยพบใน backend: /attendance/student/me
  // TODO: ถ้า backend ใช้ /attendance/my ให้แก้ตรงนี้เป็น api.get('/attendance/my')
  const res = await api.get('/attendance/student/me');
  return unwrapApiResponse(res);
}

export async function joinClassroomSession(sessionId) {
  if (!sessionId) {
    throw new Error('ไม่พบรหัสห้องเรียน');
  }

  // TODO: ตรวจสอบ backend ว่าใช้ POST /classroom-sessions/{id}/join จริงหรือไม่
  const res = await api.post(`/classroom-sessions/${sessionId}/join`);
  return unwrapApiResponse(res);
}

export async function joinClassroomByCode(sessionCode) {
  if (!sessionCode) {
    throw new Error('กรุณากรอกรหัสห้องเรียน');
  }

  // TODO: ถ้า backend ใช้ field ชื่ออื่น เช่น code ให้แก้ payload ตรงนี้
  const res = await api.post('/classroom-sessions/join', {
    sessionCode,
  });

  return unwrapApiResponse(res);
}