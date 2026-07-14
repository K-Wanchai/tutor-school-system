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
  if (status === 404) return 'ไม่พบข้อมูลรอบที่สอบติด';
  if (status === 409) return serverMsg || 'มีชื่อรอบที่สอบติดนี้อยู่ในระบบแล้ว';
  if (status === 500) return `เกิดข้อผิดพลาดที่ server${serverMsg ? ': ' + serverMsg : ' (500)'}`;
  return serverMsg || `เกิดข้อผิดพลาด (${status})`;
}

export async function getAdmissionRounds(institutionId) {
  try {
    const res = await api.get(`/admin/exam-institutions/${institutionId}/admission-rounds`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getAdmissionRounds'));
  }
}

// payload: { name, active }
export async function createAdmissionRound(institutionId, payload) {
  try {
    const res = await api.post(`/admin/exam-institutions/${institutionId}/admission-rounds`, payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'createAdmissionRound'));
  }
}

export async function updateAdmissionRound(institutionId, roundId, payload) {
  try {
    const res = await api.put(`/admin/exam-institutions/${institutionId}/admission-rounds/${roundId}`, payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'updateAdmissionRound'));
  }
}

export async function deleteAdmissionRound(institutionId, roundId) {
  try {
    const res = await api.delete(`/admin/exam-institutions/${institutionId}/admission-rounds/${roundId}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'deleteAdmissionRound'));
  }
}
