import api from '../../shared/services/api';
import {
  setToken, setRole, setRefreshToken, setUsername, setUserId, setEmail,
  setRememberMe, clearAuth,
} from '../../shared/utils/tokenUtils';

// rememberMe: true = เก็บ session ไว้ที่ localStorage (คงอยู่แม้ปิดเบราว์เซอร์)
//             false = เก็บที่ sessionStorage (หายไปเมื่อปิดแท็บ/เบราว์เซอร์)
export const login = async (payload, rememberMe = false) => {
  const response = await api.post('/auth/login', payload);
  const data = response.data.data;
  // ต้องล้าง session เก่าก่อน เผื่อครั้งก่อนติ๊ก/ไม่ติ๊กไว้ต่างกัน แล้วตั้งโหมด storage ก่อนเขียนค่าใดๆ
  clearAuth();
  setRememberMe(rememberMe);
  setToken(data.accessToken);
  setRole(data.role);
  setUsername(data.username);
  setUserId(data.userId);
  setEmail(data.email);
  if (data.refreshToken) setRefreshToken(data.refreshToken);
  return data;
};

export const register = async (payload) => {
  const response = await api.post('/auth/register', payload);
  return response.data;
};

export const checkAvailability = async (field, value) => {
  const response = await api.get('/auth/check-availability', { params: { field, value } });
  return response.data.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async ({ token, newPassword, confirmPassword }) => {
  const response = await api.post('/auth/reset-password', { token, newPassword, confirmPassword });
  return response.data;
};

export const logout = () => {
  clearAuth();
  window.location.href = '/login';
};
