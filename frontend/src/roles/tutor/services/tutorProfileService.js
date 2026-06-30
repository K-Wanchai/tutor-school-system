import api from '../../../shared/services/api';

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'เกิดข้อผิดพลาด'
  );
};

const unwrap = (res) => {
  if (res.data?.success === false) {
    throw new Error(res.data?.message || 'เกิดข้อผิดพลาด');
  }

  return res.data?.data ?? res.data;
};

export async function getMyProfile() {
  try {
    const res = await api.get('/tutors/me');
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateMyProfile(data) {
  try {
    const res = await api.put('/tutors/me', data);
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function changePassword(data) {
  try {
    const res = await api.post('/tutors/me/change-password', data);
    return unwrap(res);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
