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
  if (status === 404) return 'ไม่พบข้อมูลสายการเรียน/ห้องเรียน';
  if (status === 409) return serverMsg || 'มีชื่อสายการเรียน/ห้องเรียนนี้อยู่ในระบบแล้ว';
  if (status === 500) return `เกิดข้อผิดพลาดที่ server${serverMsg ? ': ' + serverMsg : ' (500)'}`;
  return serverMsg || `เกิดข้อผิดพลาด (${status})`;
}

// educationLevel เป็น optional filter: 'LOWER_SECONDARY' | 'UPPER_SECONDARY'
export async function getSchoolTracks(institutionId, educationLevel) {
  try {
    const params = educationLevel ? { educationLevel } : {};
    const res = await api.get(`/admin/exam-institutions/${institutionId}/school-tracks`, { params });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getSchoolTracks'));
  }
}

// payload: { educationLevel, name, active }
export async function createSchoolTrack(institutionId, payload) {
  try {
    const res = await api.post(`/admin/exam-institutions/${institutionId}/school-tracks`, payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'createSchoolTrack'));
  }
}

export async function updateSchoolTrack(institutionId, trackId, payload) {
  try {
    const res = await api.put(`/admin/exam-institutions/${institutionId}/school-tracks/${trackId}`, payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'updateSchoolTrack'));
  }
}

export async function deleteSchoolTrack(institutionId, trackId) {
  try {
    const res = await api.delete(`/admin/exam-institutions/${institutionId}/school-tracks/${trackId}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'deleteSchoolTrack'));
  }
}
