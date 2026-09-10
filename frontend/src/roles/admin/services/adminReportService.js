import api from '../../../shared/services/api';

function apiError(error) {
  const status = error.response?.status;
  const serverMsg = error.response?.data?.message;
  console.error('[getOverviewReport]', error.response?.data || error.message);

  if (!error.response) return 'ไม่สามารถเชื่อมต่อ backend ได้ กรุณาตรวจสอบว่า server ทำงานอยู่';
  if (status === 401) return 'กรุณาเข้าสู่ระบบใหม่ (Token หมดอายุ)';
  if (status === 403) return 'ไม่มีสิทธิ์เข้าถึงรายงาน (403 Forbidden)';
  if (status === 404) return 'ไม่พบ API /admin/reports (404 Not Found)';
  return serverMsg || `เกิดข้อผิดพลาด (${status})`;
}

export const getOverviewReport = async () => {
  try {
    const response = await api.get('/admin/reports');
    return response.data.data;
  } catch (error) {
    throw new Error(apiError(error), { cause: error });
  }
};
