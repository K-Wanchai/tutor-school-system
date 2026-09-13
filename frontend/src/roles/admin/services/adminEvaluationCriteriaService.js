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
  if (status === 404) return 'ไม่พบ API endpoint (404 Not Found)';
  if (status === 500) return `เกิดข้อผิดพลาดที่ server${serverMsg ? ': ' + serverMsg : ' (500)'}`;
  return serverMsg || `เกิดข้อผิดพลาด (${status})`;
}

// รายการหัวข้อการประเมินทั้งหมด รวมที่ปิดใช้งาน (สำหรับหน้าแอดมินจัดการ)
export async function getAllEvaluationCriteria() {
  try {
    const res = await api.get('/evaluation-criteria/all');
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(apiError(error, 'getAllEvaluationCriteria'), { cause: error });
  }
}

export async function createEvaluationCriteria(label) {
  try {
    const res = await api.post('/evaluation-criteria', { label });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'createEvaluationCriteria'), { cause: error });
  }
}

export async function updateEvaluationCriteria(id, { label, isActive }) {
  try {
    const res = await api.put(`/evaluation-criteria/${id}`, { label, isActive });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'updateEvaluationCriteria'), { cause: error });
  }
}

export async function deleteEvaluationCriteria(id) {
  try {
    const res = await api.delete(`/evaluation-criteria/${id}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'deleteEvaluationCriteria'), { cause: error });
  }
}

export async function reorderEvaluationCriteria(orderedIds) {
  try {
    const res = await api.put('/evaluation-criteria/reorder', { orderedIds });
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(apiError(error, 'reorderEvaluationCriteria'), { cause: error });
  }
}
