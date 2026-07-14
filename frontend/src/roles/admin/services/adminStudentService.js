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

export async function getStudents({ page = 0, size = 10, keyword = '' } = {}) {
  const params = { page, size };
  if (keyword.trim()) params.keyword = keyword.trim();
  try {
    const res = await api.get('/students', { params });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getStudents'));
  }
}

export async function getStudentById(id) {
  try {
    const res = await api.get(`/students/${id}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getStudentById'));
  }
}

export async function updateStudent(id, form) {
  // Build payload that matches UpdateStudentRequest
  const fullName = `${form.firstName || ''} ${form.lastName || ''}`.trim()
    || form.fullName || '';

  const payload = {
    fullName,
    firstName: form.firstName || '',
    lastName:  form.lastName  || '',
    phoneNumber: form.phoneNumber || '',
    address: form.address || null,
    birthDate: form.birthDate || null,
    guardianPhoneNumber: form.guardianPhoneNumber || null,
    bankName: form.bankName || null,
    bankQrCode: form.bankQrCode || null,
    bankAccountName: form.bankAccountName || null,
    bankAccountNumber: form.bankAccountNumber || null,
  };
  try {
    const res = await api.put(`/students/${id}`, payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'updateStudent'));
  }
}

export async function getStudentStats() {
  try {
    const res = await api.get('/students', { params: { page: 0, size: 5000 } });
    const data = unwrap(res);
    const list = Array.isArray(data) ? data : (data?.content ?? []);
    const now  = new Date();
    return {
      total: data?.totalElements ?? list.length,
      newThisMonth: list.filter(s => {
        if (!s.createdAt) return false;
        const d = new Date(s.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length,
    };
  } catch (error) {
    console.error('[getStudentStats]', error.response?.data || error.message);
    return { total: 0, newThisMonth: 0 };
  }
}
