import api from '../../../shared/services/api';

export const getTutorDashboard = async () => {
  const response = await api.get('/tutor/dashboard');
  return response.data.data;
};
