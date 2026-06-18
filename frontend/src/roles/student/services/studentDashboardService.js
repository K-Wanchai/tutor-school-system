import api from '../../../shared/services/api';

export const getStudentDashboard = async () => {
  const response = await api.get('/student/dashboard');
  return response.data.data;
};
