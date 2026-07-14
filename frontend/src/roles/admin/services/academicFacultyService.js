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
  if (status === 404) return 'ไม่พบข้อมูลคณะ/สาขา';
  if (status === 409) return serverMsg || 'มีชื่อคณะ/สาขานี้อยู่ในระบบแล้ว';
  if (status === 500) return `เกิดข้อผิดพลาดที่ server${serverMsg ? ': ' + serverMsg : ' (500)'}`;
  return serverMsg || `เกิดข้อผิดพลาด (${status})`;
}

// ── คณะ (Faculty) ────────────────────────────────────────────────────────

export async function getFaculties(institutionId) {
  try {
    const res = await api.get(`/admin/exam-institutions/${institutionId}/faculties`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getFaculties'));
  }
}

// payload: { name, active }
export async function createFaculty(institutionId, payload) {
  try {
    const res = await api.post(`/admin/exam-institutions/${institutionId}/faculties`, payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'createFaculty'));
  }
}

export async function updateFaculty(institutionId, facultyId, payload) {
  try {
    const res = await api.put(`/admin/exam-institutions/${institutionId}/faculties/${facultyId}`, payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'updateFaculty'));
  }
}

export async function deleteFaculty(institutionId, facultyId) {
  try {
    const res = await api.delete(`/admin/exam-institutions/${institutionId}/faculties/${facultyId}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'deleteFaculty'));
  }
}

// ── สาขา (Major) — ซ้อนอยู่ภายใต้คณะ ─────────────────────────────────────

export async function getMajors(institutionId, facultyId) {
  try {
    const res = await api.get(`/admin/exam-institutions/${institutionId}/faculties/${facultyId}/majors`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getMajors'));
  }
}

// payload: { name, active }
export async function createMajor(institutionId, facultyId, payload) {
  try {
    const res = await api.post(`/admin/exam-institutions/${institutionId}/faculties/${facultyId}/majors`, payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'createMajor'));
  }
}

export async function updateMajor(institutionId, facultyId, majorId, payload) {
  try {
    const res = await api.put(`/admin/exam-institutions/${institutionId}/faculties/${facultyId}/majors/${majorId}`, payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'updateMajor'));
  }
}

export async function deleteMajor(institutionId, facultyId, majorId) {
  try {
    const res = await api.delete(`/admin/exam-institutions/${institutionId}/faculties/${facultyId}/majors/${majorId}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'deleteMajor'));
  }
}
