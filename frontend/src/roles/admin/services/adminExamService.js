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
  if (status === 404) return 'ไม่พบข้อมูลที่ต้องการ';
  return serverMsg || `เกิดข้อผิดพลาด (${status})`;
}

// คอร์สทั้งหมดของติวเตอร์คนหนึ่ง (แอดมินดูได้)
export async function getCoursesByTutorId(tutorId) {
  try {
    const res = await api.get(`/courses/tutor/${tutorId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(apiError(error, 'getCoursesByTutorId'), { cause: error });
  }
}

export async function getExamsByCourse(courseId) {
  try {
    const res = await api.get(`/exams/course/${courseId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(apiError(error, 'getExamsByCourse'), { cause: error });
  }
}

export async function getResultsByCourse(courseId) {
  try {
    const res = await api.get(`/exam-results/course/${courseId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(apiError(error, 'getResultsByCourse'), { cause: error });
  }
}

// คะแนนสอบที่ติวเตอร์กรอกเอง (ข้อสอบลิงก์ภายนอก) รายคอร์ส
export async function getManualScoresByCourse(courseId) {
  try {
    const res = await api.get(`/exam-scores/course/${courseId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(apiError(error, 'getManualScoresByCourse'), { cause: error });
  }
}

export async function getEnrollmentsByCourse(courseId) {
  try {
    const res = await api.get(`/enrollments/course/${courseId}`);
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(apiError(error, 'getEnrollmentsByCourse'), { cause: error });
  }
}
