import api from '../../../shared/services/api';

function unwrapApiResponse(res) {
  const body = res.data;

  if (!body?.success) {
    throw new Error(body?.message || 'เกิดข้อผิดพลาดจากระบบ');
  }

  return body.data;
}

export async function getMyProfile() {
  const res = await api.get('/students/me');
  return unwrapApiResponse(res);
}

export async function updateMyProfile(data) {
  const res = await api.put('/students/me', data);
  return unwrapApiResponse(res);
}