import api from '../../../shared/services/api';

const unwrap = (response) => {
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (response.data?.data) return response.data.data;
  return [];
};

export async function getClassroomSessions() {
  const response = await api.get('/classroom-sessions/tutor/me');
  return unwrap(response);
}

export async function openClassroomSession(id) {
  const response = await api.patch(`/classroom-sessions/${id}/open`);
  return unwrap(response);
}

export async function closeClassroomSession(id) {
  const response = await api.patch(`/classroom-sessions/${id}/close`);
  return unwrap(response);
}