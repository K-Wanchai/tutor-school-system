import api from '../../../shared/services/api';
import { getStoredItem, getUserId } from '../../../shared/utils/tokenUtils';

const unwrap = (response) => {
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (response.data?.data) return response.data.data;
  return [];
};

const getTutorId = () =>
  getStoredItem('tutorId') ||
  getUserId() ||
  getStoredItem('id');

export async function getTutorCourses() {
  const tutorId = getTutorId();
  if (!tutorId) return [];
  const response = await api.get(`/courses/tutor/${tutorId}`);
  return unwrap(response);
}

export async function getTutorEvaluations() {
  const tutorId = getTutorId();
  if (!tutorId) return [];
  const response = await api.get(`/course-evaluations/tutor/${tutorId}`);
  return unwrap(response);
}
