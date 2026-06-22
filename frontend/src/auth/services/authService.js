import api from '../../shared/services/api';
import { setToken, setRole, clearAuth } from '../../shared/utils/tokenUtils';

const setUsername = (val) => localStorage.setItem('username', val ?? '');

export const login = async (payload) => {
  const response = await api.post('/auth/login', payload);
  const data = response.data.data;
  setToken(data.accessToken);
  setRole(data.role);
  setUsername(data.username);
  return data;
};

export const register = async (payload) => {
  if (payload instanceof FormData) {
    // Let the browser set Content-Type with the proper multipart boundary
    const response = await api.post('/auth/register', payload, {
      headers: { 'Content-Type': undefined },
    });
    return response.data;
  }
  const response = await api.post('/auth/register', payload);
  return response.data;
};

export const logout = () => {
  clearAuth();
  localStorage.removeItem('username');
  window.location.href = '/login';
};
