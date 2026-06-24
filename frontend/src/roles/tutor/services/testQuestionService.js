import api from '../../../shared/services/api';

export async function getQuestions(testId) {
  const res = await api.get(`/course-tests/${testId}/questions`);
  return res.data?.data ?? res.data;
}

export async function saveAllQuestions(testId, questions) {
  const res = await api.put(`/course-tests/${testId}/questions/save-all`, questions);
  return res.data?.data ?? res.data;
}
