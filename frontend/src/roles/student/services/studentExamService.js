import api from '../../../shared/services/api';

function unwrapApiResponse(res) {
  const body = res.data;

  if (!body?.success) {
    throw new Error(body?.message || 'เกิดข้อผิดพลาดจากระบบ');
  }

  return body.data;
}

export async function getMyExamSchedule() {
  const res = await api.get('/exams/student/me');
  return unwrapApiResponse(res);
}

// คะแนนสอบของตัวเองในคอร์สนี้ (ที่ติวเตอร์กรอกเอง — ข้อสอบลิงก์ภายนอก)
export async function getCourseScores(courseId) {
  const res = await api.get(`/exam-scores/course/${courseId}`);
  return unwrapApiResponse(res);
}
