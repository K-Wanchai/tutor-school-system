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

export async function getMyExamSchedule() {
  try {
    const res = await api.get('/exams/tutor/me');
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(apiError(error, 'getMyExamSchedule'), { cause: error });
  }
}

export async function getExamById(examId) {
  try {
    const res = await api.get(`/exams/${examId}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getExamById'), { cause: error });
  }
}

export async function createExam(payload) {
  try {
    const res = await api.post('/exams', payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'createExam'), { cause: error });
  }
}

export async function updateExam(examId, payload) {
  try {
    const res = await api.put(`/exams/${examId}`, payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'updateExam'), { cause: error });
  }
}

export async function openExam(examId) {
  try {
    const res = await api.patch(`/exams/${examId}/open`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'openExam'), { cause: error });
  }
}

export async function closeExam(examId) {
  try {
    const res = await api.patch(`/exams/${examId}/close`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'closeExam'), { cause: error });
  }
}

export async function deleteExam(examId) {
  try {
    await api.delete(`/exams/${examId}`);
  } catch (error) {
    throw new Error(apiError(error, 'deleteExam'), { cause: error });
  }
}

export async function getExamsByCourse(courseId) {
  try {
    const res = await api.get(`/exams/course/${courseId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(apiError(error, 'getExamsByCourse'), { cause: error });
  }
}
