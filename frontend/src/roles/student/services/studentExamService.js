import api from '../../../shared/services/api';

function unwrapApiResponse(res) {
  const body = res.data;

  if (!body?.success) {
    throw new Error(body?.message || 'เกิดข้อผิดพลาดจากระบบ');
  }

  return body.data;
}

function apiError(error) {
  const status = error.response?.status;
  const serverMsg = error.response?.data?.message;
  if (!error.response) return 'ไม่สามารถเชื่อมต่อ backend ได้';
  if (status === 401) return 'กรุณาเข้าสู่ระบบใหม่';
  if (status === 403) return 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้';
  return serverMsg || `เกิดข้อผิดพลาด (${status})`;
}

export async function getMyExamSubmissions() {
  const res = await api.get('/exam-submissions/me');
  return unwrapApiResponse(res);
}

export async function getMyExamSchedule() {
  const res = await api.get('/exams/student/me');
  return unwrapApiResponse(res);
}

export async function getMyExamResults() {
  const res = await api.get('/exam-results/student/me');
  return unwrapApiResponse(res);
}

export async function startExam(examId) {
  try {
    const res = await api.post(`/exams/${examId}/start`);
    return unwrapApiResponse(res);
  } catch (error) {
    throw new Error(apiError(error));
  }
}

export async function submitExam(examId, answers) {
  try {
    const res = await api.post(`/exams/${examId}/submit`, { answers });
    return unwrapApiResponse(res);
  } catch (error) {
    throw new Error(apiError(error));
  }
}

export async function getSubmissionById(submissionId) {
  try {
    const res = await api.get(`/exam-submissions/${submissionId}`);
    return unwrapApiResponse(res);
  } catch (error) {
    throw new Error(apiError(error));
  }
}
