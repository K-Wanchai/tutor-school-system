import api from '../../../shared/services/api';

const unwrap = (response) => {
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (response.data?.data) return response.data.data;
  return [];
};

export async function getTutorEvaluations() {
  const tutorId =
    localStorage.getItem('tutorId') ||
    localStorage.getItem('userId') ||
    localStorage.getItem('id');

  if (!tutorId) {
    return [];
  }

  const response = await api.get(`/course-evaluations/tutor/${tutorId}`);
  return unwrap(response);
}