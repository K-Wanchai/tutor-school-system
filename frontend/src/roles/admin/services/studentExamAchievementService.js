import api from '../../../shared/services/api';

function unwrap(res) {
  return res.data?.data ?? res.data;
}

function apiError(error, label) {
  const status = error.response?.status;
  const serverMsg = error.response?.data?.message;
  console.error(`[${label}]`, error.response?.data || error.message);

  if (!error.response) return 'ไม่สามารถเชื่อมต่อ backend ได้ กรุณาตรวจสอบว่า server ทำงานอยู่';
  if (status === 401) return 'กรุณาเข้าสู่ระบบใหม่ (Token หมดอายุ)';
  if (status === 403) return 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้ (403 Forbidden)';
  if (status === 404) return 'ไม่พบข้อมูลผลการสอบติด';
  if (status === 409) return serverMsg || 'มีบันทึกผลสอบติดนี้อยู่ในระบบแล้ว';
  if (status === 500) return `เกิดข้อผิดพลาดที่ server${serverMsg ? ': ' + serverMsg : ' (500)'}`;
  return serverMsg || `เกิดข้อผิดพลาด (${status})`;
}

// params: { keyword?, educationLevel?, institutionId?, academicYear?, active? }
export async function getStudentExamAchievements(params = {}) {
  try {
    const res = await api.get('/admin/student-exam-achievements', { params });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getStudentExamAchievements'));
  }
}

export async function getStudentExamAchievementById(id) {
  try {
    const res = await api.get(`/admin/student-exam-achievements/${id}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getStudentExamAchievementById'));
  }
}

// payload: { studentId, examInstitutionId, educationLevel, schoolTrackId, academicMajorId,
//            admissionRoundId, academicYear, resultDate, note, active }
export async function createStudentExamAchievement(payload) {
  try {
    const res = await api.post('/admin/student-exam-achievements', payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'createStudentExamAchievement'));
  }
}

export async function updateStudentExamAchievement(id, payload) {
  try {
    const res = await api.put(`/admin/student-exam-achievements/${id}`, payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'updateStudentExamAchievement'));
  }
}

export async function deleteStudentExamAchievement(id) {
  try {
    const res = await api.delete(`/admin/student-exam-achievements/${id}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'deleteStudentExamAchievement'));
  }
}

export async function getStudentExamAchievementsByStudent(studentId) {
  try {
    const res = await api.get(`/admin/students/${studentId}/exam-achievements`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getStudentExamAchievementsByStudent'));
  }
}

// คืนข้อมูลผลสอบติดแบบเต็ม + คอร์สที่นักเรียนเคยเรียน (พร้อมผู้สอนและบทเรียน)
export async function getStudentAchievementDetail(achievementId) {
  try {
    const res = await api.get(`/admin/student-exam-achievements/${achievementId}/detail`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getStudentAchievementDetail'));
  }
}
