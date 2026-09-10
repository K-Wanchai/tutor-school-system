import api from '../../../shared/services/api';

function unwrapApiResponse(res) {
  const body = res.data;

  if (body && body.success === false) {
    throw new Error(body.message || 'เกิดข้อผิดพลาดจากระบบ');
  }

  return body?.data ?? body;
}

// คอร์สที่เรียนจบแล้ว (ติวเตอร์ปิดจบการสอน) และยังไม่ได้ประเมิน
export async function getPendingEvaluations() {
  const res = await api.get('/course-evaluations/student/pending');
  const data = unwrapApiResponse(res);
  return Array.isArray(data) ? data : [];
}

// รีวิวที่นักเรียนคนนี้เคยส่งไว้แล้ว
export async function getMyEvaluations() {
  const res = await api.get('/course-evaluations/student/me');
  const data = unwrapApiResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function submitEvaluation(payload) {
  const res = await api.post('/course-evaluations', payload);
  return unwrapApiResponse(res);
}

// แก้ไขรีวิวได้ภายใน 24 ชม. หลังส่ง
export async function updateEvaluation(id, payload) {
  const res = await api.put(`/course-evaluations/${id}`, payload);
  return unwrapApiResponse(res);
}
