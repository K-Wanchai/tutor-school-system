import api from '../../../shared/services/api';

const unwrap = (response) => {
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (response.data?.data) return response.data.data;
  return [];
};

export async function getTutorCourses() {
  const tutorId = localStorage.getItem('tutorId') || localStorage.getItem('userId');

  if (!tutorId) {
    return [];
  }

  const response = await api.get(`/courses/tutor/${tutorId}`);
  return unwrap(response);
}