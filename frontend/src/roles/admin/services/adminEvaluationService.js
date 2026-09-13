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

// ผลรวมการประเมินของทุกคอร์สที่มีนักเรียนประเมินแล้ว
export async function getCourseEvaluationSummaries() {
  try {
    const res = await api.get('/course-evaluations/summary');
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(apiError(error, 'getCourseEvaluationSummaries'), { cause: error });
  }
}

// รายการรีวิวรายตัวของคอร์สหนึ่ง ๆ (สำหรับดูรายละเอียด/ความคิดเห็น)
export async function getEvaluationsByCourse(courseId) {
  try {
    const res = await api.get(`/course-evaluations/course/${courseId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(apiError(error, 'getEvaluationsByCourse'), { cause: error });
  }
}
