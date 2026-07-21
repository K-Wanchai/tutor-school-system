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

export async function getInstitutionProfile() {
  try {
    const res = await api.get('/institution-profile');
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'getInstitutionProfile'));
  }
}

export async function updateInstitutionProfile(form) {
  // Build payload that matches UpdateInstitutionProfileRequest
  const payload = {
    institutionName: form.institutionName || '',
    address: form.address || null,
    phoneNumber: form.phoneNumber || '',
    email: form.email || '',
    logoUrl: form.logoUrl || null,
    bankName: form.bankName || null,
    bankAccountName: form.bankAccountName || null,
    bankAccountNumber: form.bankAccountNumber || null,
    bankQrCode: form.bankQrCode || null,
    enrollmentPaymentDeadlineMinutes: Number(form.enrollmentPaymentDeadlineMinutes) || 15,
  };
  try {
    const res = await api.put('/institution-profile', payload);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'updateInstitutionProfile'));
  }
}

// Uploads an image via the generic file endpoint and returns its public URL
export async function uploadInstitutionImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'uploadInstitutionImage'));
  }
}
