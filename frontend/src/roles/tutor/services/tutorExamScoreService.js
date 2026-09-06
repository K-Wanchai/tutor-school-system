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

// คะแนนสอบที่ติวเตอร์กรอกเอง (ข้อสอบลิงก์ภายนอก) รายคอร์ส
export async function getManualScoresByCourse(courseId) {
  try {
    const res = await api.get(`/exam-scores/course/${courseId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(apiError(error, 'getManualScoresByCourse'), { cause: error });
  }
}

export async function saveManualScore({ examId, studentId, score, note }) {
  try {
    const res = await api.put('/exam-scores', { examId, studentId, score, note });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'saveManualScore'), { cause: error });
  }
}

export async function deleteManualScore(examId, studentId) {
  try {
    await api.delete(`/exam-scores/exam/${examId}/student/${studentId}`);
  } catch (error) {
    throw new Error(apiError(error, 'deleteManualScore'), { cause: error });
  }
}
