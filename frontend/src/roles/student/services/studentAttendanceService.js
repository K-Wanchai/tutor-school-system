import api from '../../../shared/services/api';

function unwrapApiResponse(res) {
  const body = res.data;

  if (!body?.success) {
    throw new Error(body?.message || 'เกิดข้อผิดพลาดจากระบบ');
  }

  return body.data;
}

export async function getMyClassroomSessions() {
  const res = await api.get('/classroom-sessions/student/me');
  return unwrapApiResponse(res);
}

export async function getMyAttendanceHistory() {
  const res = await api.get('/attendance-records/student/me');
  return unwrapApiResponse(res);
}

export async function joinClassroomSession(sessionId, joinCode) {
  if (!sessionId) {
    throw new Error('ไม่พบรหัสห้องเรียน');
  }

  const res = await api.post(`/classroom-sessions/${sessionId}/join`, { joinCode });
  return unwrapApiResponse(res);
}

export async function joinClassroomByCode(sessionCode, allSessions) {
  if (!sessionCode) {
    throw new Error('กรุณากรอกรหัสห้องเรียน');
  }

  // ระบบไม่มี endpoint "join by code" แยกต่างหาก — ต้องหา session ที่ sessionCode/joinCode ตรงกันก่อน
  // แล้วเรียก POST /classroom-sessions/{id}/join ด้วย joinCode ของ session นั้น
  const match = (allSessions || []).find(
    (s) => s.sessionCode === sessionCode || s.joinCode === sessionCode
  );

  if (!match) {
    throw new Error('ไม่พบห้องเรียนที่ตรงกับรหัสนี้ หรือห้องยังไม่เปิด');
  }

  return joinClassroomSession(match.id, match.joinCode);
}