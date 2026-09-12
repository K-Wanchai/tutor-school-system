import api from '../../../shared/services/api';

function apiError(context, error) {
  const status = error.response?.status;
  const serverMsg = error.response?.data?.message;
  console.error(`[${context}]`, error.response?.data || error.message);

  if (!error.response) return 'ไม่สามารถเชื่อมต่อ backend ได้ กรุณาตรวจสอบว่า server ทำงานอยู่';
  if (status === 401) return 'กรุณาเข้าสู่ระบบใหม่ (Token หมดอายุ)';
  if (status === 403) return 'ไม่มีสิทธิ์เข้าถึงรายงาน (403 Forbidden)';
  if (status === 404) return `ไม่พบ API สำหรับ ${context} (404 Not Found)`;
  return serverMsg || `เกิดข้อผิดพลาด (${status})`;
}

// ตัดคีย์ที่เป็น '' / null / undefined ออกจาก filter ก่อนส่ง — ให้ backend ไม่กรองพารามิเตอร์นั้นเลย
function cleanParams(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
}

// ดาวน์โหลดไฟล์ CSV จาก endpoint ที่ต้องแนบ token (ต่างจาก URL ไฟล์อัปโหลดทั่วไปที่เปิดตรงได้)
async function downloadCsv(context, url, filters) {
  try {
    const response = await api.get(url, { params: cleanParams(filters), responseType: 'blob' });
    const disposition = response.headers['content-disposition'] || '';
    const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    const filename = match ? decodeURIComponent(match[1]) : `${context}.csv`;

    const blobUrl = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    throw new Error(apiError(context, error), { cause: error });
  }
}

export const getOverviewReport = async () => {
  try {
    const response = await api.get('/admin/reports');
    return response.data.data;
  } catch (error) {
    throw new Error(apiError('getOverviewReport', error), { cause: error });
  }
};

// ── รายได้/การชำระเงิน ──
export const getRevenueReport = async (filters) => {
  try {
    const response = await api.get('/admin/reports/revenue', { params: cleanParams(filters) });
    return response.data.data;
  } catch (error) {
    throw new Error(apiError('getRevenueReport', error), { cause: error });
  }
};
export const exportRevenueReport = (filters) =>
  downloadCsv('revenue-report', '/admin/reports/revenue/export', filters);

// ── การสมัครเรียน ──
export const getEnrollmentReport = async (filters) => {
  try {
    const response = await api.get('/admin/reports/enrollments', { params: cleanParams(filters) });
    return response.data.data;
  } catch (error) {
    throw new Error(apiError('getEnrollmentReport', error), { cause: error });
  }
};
export const exportEnrollmentReport = (filters) =>
  downloadCsv('enrollment-report', '/admin/reports/enrollments/export', filters);
