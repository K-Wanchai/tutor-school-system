import api from '../../shared/services/api';
import { setToken, setRole, setRefreshToken, clearAuth } from '../../shared/utils/tokenUtils';

const setUsername = (val) => localStorage.setItem('username', val ?? '');
const setUserId   = (val) => { if (val != null) localStorage.setItem('userId', String(val)); };
const setEmail    = (val) => { if (val)         localStorage.setItem('email',  val); };

export const login = async (payload) => {
  const response = await api.post('/auth/login', payload);
  const data = response.data.data;
  setToken(data.accessToken);
  setRole(data.role);
  setUsername(data.username);
  setUserId(data.userId);
  setEmail(data.email);
  if (data.refreshToken) setRefreshToken(data.refreshToken);
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

export const checkAvailability = async (field, value) => {
  const response = await api.get('/auth/check-availability', { params: { field, value } });
  return response.data.data;
};

export const logout = () => {
  clearAuth();
  localStorage.removeItem('username');
  window.location.href = '/login';
};
