import api from '../../../shared/services/api';

export async function getMyProfile() {
  const res = await api.get('/tutors/me');
  return res.data?.data;
}

export async function updateMyProfile(data) {
  const res = await api.put('/tutors/me', data);
  return res.data?.data;
}
