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

export async function markCourseViewed(courseId) {
  try {
    const res = await api.patch(`/courses/${courseId}/mark-viewed`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'markCourseViewed'));
  }
}

export async function addLesson(courseId, { lessonTitle, lessonContent, lessonOrder }) {
  try {
    const res = await api.post(`/courses/${courseId}/lessons`, {
      lessonTitle,
      lessonContent: lessonContent || null,
      lessonOrder,
    });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'addLesson'));
  }
}

export async function updateLesson(courseId, lessonId, { lessonTitle, lessonContent, lessonOrder }) {
  try {
    const res = await api.put(`/courses/${courseId}/lessons/${lessonId}`, {
      lessonTitle,
      lessonContent: lessonContent || null,
      lessonOrder,
    });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'updateLesson'));
  }
}

export async function deleteLesson(courseId, lessonId) {
  try {
    await api.delete(`/courses/${courseId}/lessons/${lessonId}`);
  } catch (error) {
    throw new Error(apiError(error, 'deleteLesson'));
  }
}

export async function addTest(courseId, { testTitle, testDescription, testOrder, lessonOrder }) {
  try {
    const res = await api.post(`/courses/${courseId}/tests`, {
      testTitle,
      testDescription: testDescription || null,
      testOrder,
      lessonOrder: lessonOrder ?? null,
    });
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'addTest'));
  }
}

export async function publishCourse(courseId) {
  try {
    const res = await api.patch(`/courses/${courseId}/publish`);
    return unwrap(res);
  } catch (error) {
    throw new Error(apiError(error, 'publishCourse'));
  }
}
