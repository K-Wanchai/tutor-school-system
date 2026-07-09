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
  if (status === 404) return 'ไม่พบข้อมูลสถาบันที่จัดสอบ';
  if (status === 409) return serverMsg || 'มีชื่อสถาบันนี้อยู่ในระบบแล้ว';
  if (status === 500) return `เกิดข้อผิดพลาดที่ server${serverMsg ? ': ' + serverMsg : ' (500)'}`;
  return serverMsg || `เกิดข้อผิดพลาด (${status})`;
}

// params: { keyword?, type?, active? }
export async function getExamInstitutions(params = {}) {
  try {
    const res = await api.get('/admin/exam-institutions', { params });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getExamInstitutions'));
  }
}

export async function getExamInstitutionById(id) {
  try {
    const res = await api.get(`/admin/exam-institutions/${id}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getExamInstitutionById'));
  }
}

// payload: { institutionName, institutionType, province, district, address, websiteUrl, description, active }
export async function createExamInstitution(payload) {
  try {
    const res = await api.post('/admin/exam-institutions', payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'createExamInstitution'));
  }
}

export async function updateExamInstitution(id, payload) {
  try {
    const res = await api.put(`/admin/exam-institutions/${id}`, payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'updateExamInstitution'));
  }
}

export async function deleteExamInstitution(id) {
  try {
    const res = await api.delete(`/admin/exam-institutions/${id}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'deleteExamInstitution'));
  }
}

// คืนข้อมูลสถาบัน + นักเรียนที่สอบติดแยกเป็น 3 กลุ่ม (มัธยมต้น/มัธยมปลาย/มหาวิทยาลัย)
export async function getInstitutionAchievements(institutionId) {
  try {
    const res = await api.get(`/admin/exam-institutions/${institutionId}/achievements`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getInstitutionAchievements'));
  }
}
