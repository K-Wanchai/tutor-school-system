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
  if (status === 400) {
    const errors = error.response?.data?.errors;
    if (errors && typeof errors === 'object') {
      const msgs = Object.values(errors).flat();
      if (msgs.length > 0) return msgs.join(', ');
    }
    return serverMsg || 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
  }
  if (status === 404) return 'ไม่พบ API endpoint (404 Not Found)';
  if (status === 409) return serverMsg || 'ข้อมูลซ้ำในระบบ (username / email ถูกใช้แล้ว)';
  if (status === 500) return `เกิดข้อผิดพลาดที่ server${serverMsg ? ': ' + serverMsg : ' (500)'}`;
  return serverMsg || `เกิดข้อผิดพลาด (${status})`;
}

export async function getTutors({ page = 0, size = 10, keyword = '' } = {}) {
  const params = { page, size };
  if (keyword.trim()) params.keyword = keyword.trim();
  try {
    const res = await api.get('/tutors', { params });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getTutors'));
  }
}

export async function getTutorById(id) {
  try {
    const res = await api.get(`/tutors/${id}`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getTutorById'));
  }
}

export async function createTutor(form) {
  const payload = {
    username:       form.username.trim(),
    firstName:      form.firstName.trim(),
    lastName:       form.lastName.trim(),
    email:          form.email.trim(),
    phoneNumber:    form.phoneNumber.trim(),
    specialization: form.specialization?.trim() || null,
    bio:            null,
  };
  try {
    const res = await api.post('/tutors', payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'createTutor'));
  }
}

export async function updateTutor(id, form) {
  const payload = {
    firstName:      form.firstName,
    lastName:       form.lastName,
    fullName:       `${form.firstName} ${form.lastName}`.trim(),
    phoneNumber:    form.phoneNumber || null,
    specialization: form.specialization || null,
  };
  try {
    const res = await api.put(`/tutors/${id}`, payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'updateTutor'));
  }
}

export async function deactivateTutor(id) {
  try {
    const res = await api.patch(`/tutors/${id}/status`, { enabled: false });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'deactivateTutor'));
  }
}

export async function activateTutor(id) {
  try {
    const res = await api.patch(`/tutors/${id}/status`, { enabled: true });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'activateTutor'));
  }
}

export async function getTutorStats() {
  try {
    const res = await api.get('/tutors', { params: { page: 0, size: 5000 } });
    const data = unwrap(res);
    const list = Array.isArray(data) ? data : (data?.content ?? []);
    const now  = new Date();
    return {
      total: data?.totalElements ?? list.length,
      active:   list.filter(t => t.enabled === true  || t.status === 'ACTIVE').length,
      inactive: list.filter(t => t.enabled === false || t.status === 'INACTIVE').length,
      newThisMonth: list.filter(t => {
        if (!t.createdAt) return false;
        const d = new Date(t.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length,
    };
  } catch {
    return { total: 0, active: 0, inactive: 0, newThisMonth: 0 };
  }
}
