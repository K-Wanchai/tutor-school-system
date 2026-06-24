import api from '../../../shared/services/api';

function unwrap(res) {
  return res.data?.data ?? res.data;
}

function apiError(error, label) {
  const status = error.response?.status;
  const serverMsg = error.response?.data?.message;
  console.error(`[${label}]`, error.response?.data || error.message);
  if (!error.response) return 'ไม่สามารถเชื่อมต่อ backend ได้';
  if (status === 401) return 'กรุณาเข้าสู่ระบบใหม่';
  if (status === 403) return 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้';
  return serverMsg || `เกิดข้อผิดพลาด (${status})`;
}

export async function getMyCourses() {
  try {
    const res = await api.get('/courses/my-courses');
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(apiError(error, 'getMyCourses'));
  }
}

export async function respondToCourse({ courseId, accepted, remark, lessons, tests }) {
  try {
    const res = await api.patch(`/courses/${courseId}/tutor-response`, {
      accepted,
      remark: remark || null,
      lessons: lessons || [],
      tests: tests || [],
    });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'respondToCourse'));
  }
}
