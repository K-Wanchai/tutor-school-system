import api from '../../../shared/services/api';

const unwrap = (response) => {
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (response.data?.data) return response.data.data;
  return [];
};

const getTutorId = () =>
  localStorage.getItem('tutorId') ||
  localStorage.getItem('userId') ||
  localStorage.getItem('id');

export async function getTutorCourses() {
  const tutorId = getTutorId();
  if (!tutorId) return [];
  const response = await api.get(`/courses/tutor/${tutorId}`);
  return unwrap(response);
}

export async function getTutorSchedules() {
  const response = await api.get('/course-schedules/tutor/me');
  return unwrap(response);
}

export async function getClassroomSessions() {
  const response = await api.get('/classroom-sessions');
  return unwrap(response);
}

export async function getTutorEvaluations() {
  const tutorId = getTutorId();
  if (!tutorId) return [];
  const response = await api.get(`/course-evaluations/tutor/${tutorId}`);
  return unwrap(response);
}

export async function getCourseExamResults(courseId) {
  const response = await api.get(`/exam-results/course/${courseId}`);
  return unwrap(response);
}