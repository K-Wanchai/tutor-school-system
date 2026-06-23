import api from '../../../shared/services/api';

function apiError(error) {
  const status = error.response?.status;
  const serverMsg = error.response?.data?.message;
  console.error('[getDashboardStats]', error.response?.data || error.message);

  if (!error.response) return 'ไม่สามารถเชื่อมต่อ backend ได้ กรุณาตรวจสอบว่า server ทำงานอยู่';
  if (status === 401) return 'กรุณาเข้าสู่ระบบใหม่ (Token หมดอายุ)';
  if (status === 403) return 'ไม่มีสิทธิ์เข้าถึงข้อมูล Dashboard (403 Forbidden)';
  if (status === 404) return 'ไม่พบ API /admin/dashboard (404 Not Found)';
  if (status === 500) return `เกิดข้อผิดพลาดที่ server${serverMsg ? ': ' + serverMsg : ' (500)'}`;
  return serverMsg || `เกิดข้อผิดพลาด (${status})`;
}

export const getDashboardStats = async () => {
  try {
    const response = await api.get('/admin/dashboard');
    return response.data.data;
  } catch (error) {
    throw new Error(apiError(error));
  }
};
