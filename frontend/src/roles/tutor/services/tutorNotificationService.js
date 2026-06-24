import api from '../../../shared/services/api';

function unwrap(res) {
  return res.data?.data ?? res.data;
}

export async function getMyNotifications() {
  const res = await api.get('/notifications/me');
  return unwrap(res);
}
