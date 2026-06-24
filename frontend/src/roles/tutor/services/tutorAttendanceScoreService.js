import api from '../../../shared/services/api';

const unwrap = (response) => {
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (response.data?.data) return response.data.data;
  return [];
};

export async function getTutorCourses() {
  const tutorId = localStorage.getItem('tutorId') || localStorage.getItem('userId');

  if (!tutorId) return [];

  const response = await api.get(`/courses/tutor/${tutorId}`);
  return unwrap(response);
}

export async function getCourseSessions(courseId) {
  const response = await api.get(`/classroom-sessions/course/${courseId}`);
  return unwrap(response);
}

export async function getSessionAttendance(sessionId) {
  const response = await api.get(`/attendance-records/session/${sessionId}`);
  return unwrap(response);
}

export async function getCourseExams(courseId) {
  const response = await api.get(`/exams/course/${courseId}`);
  return unwrap(response);
}

export async function getCourseExamResults(courseId) {
  const response = await api.get(`/exam-results/course/${courseId}`);
  return unwrap(response);
}