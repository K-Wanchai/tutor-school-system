import api from '../../../shared/services/api';

export const getDashboardStats = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data.data;
};
