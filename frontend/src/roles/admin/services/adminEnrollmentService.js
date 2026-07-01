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

export async function getAllEnrollments() {
  try {
    const res = await api.get('/enrollments');
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getAllEnrollments'));
  }
}

export async function getEnrollmentById(id) {
  try {
    const res = await api.get(`/enrollments/${id}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getEnrollmentById'));
  }
}

// status: PENDING | APPROVED | REJECTED | CANCELLED | COMPLETED
export async function updateEnrollmentStatus(id, status, note) {
  try {
    const res = await api.patch(`/enrollments/${id}/status`, { status, note: note || null });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'updateEnrollmentStatus'));
  }
}

// payload: { paymentStatus?, paymentMethod?, discountAmount?, note? }
export async function updatePayment(id, payload) {
  try {
    const res = await api.patch(`/enrollments/${id}/payment`, payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'updatePayment'));
  }
}

export async function approveEnrollment(id, approvedBy, note) {
  try {
    const res = await api.patch(`/enrollments/${id}/approve`, { approvedBy, note: note || null });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'approveEnrollment'));
  }
}

export async function cancelEnrollment(id) {
  try {
    const res = await api.delete(`/enrollments/${id}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'cancelEnrollment'));
  }
}
