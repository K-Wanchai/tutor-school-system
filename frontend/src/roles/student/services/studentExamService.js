import api from '../../../shared/services/api';

function unwrapApiResponse(res) {
  const body = res.data;

  if (!body?.success) {
    throw new Error(body?.message || 'เกิดข้อผิดพลาดจากระบบ');
  }

  return body.data;
}

export async function getMyExamSubmissions() {
  const res = await api.get('/exam-submissions/me');
  return unwrapApiResponse(res);
}
