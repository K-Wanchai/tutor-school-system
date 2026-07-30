// เก็บ session ไว้ที่ localStorage (คงอยู่แม้ปิดเบราว์เซอร์) เมื่อผู้ใช้ติ๊ก "จดจำฉันไว้" ตอน login
// ไม่ติ๊ก = เก็บที่ sessionStorage แทน (หายไปเมื่อปิดแท็บ/เบราว์เซอร์) — REMEMBER_KEY เองเก็บไว้ที่
// localStorage เสมอ เพราะต้องอ่านค่านี้ได้ตั้งแต่ก่อน session เริ่ม เพื่อรู้ว่าจะไปอ่าน/เขียน storage ไหน
const REMEMBER_KEY = 'rememberMe';

function activeStorage() {
  return localStorage.getItem(REMEMBER_KEY) === 'true' ? localStorage : sessionStorage;
}

export const setRememberMe = (remember) => localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false');
export const isRememberMe  = ()          => localStorage.getItem(REMEMBER_KEY) === 'true';

export const getStoredItem = (key) => activeStorage().getItem(key);
export const setStoredItem = (key, value) => {
  if (value == null) return;
  activeStorage().setItem(key, String(value));
};

export const getToken        = ()    => getStoredItem('token');
export const getRole         = ()    => getStoredItem('role');
export const getRefreshToken = ()    => getStoredItem('refreshToken');
export const setToken        = (v)   => setStoredItem('token', v);
export const setRole         = (v)   => setStoredItem('role', v);
export const setRefreshToken = (v)   => setStoredItem('refreshToken', v);

export const getUsername = ()  => getStoredItem('username');
export const getUserId   = ()  => getStoredItem('userId');
export const getEmail    = ()  => getStoredItem('email');
export const setUsername = (v) => setStoredItem('username', v);
export const setUserId   = (v) => setStoredItem('userId', v);
export const setEmail    = (v) => setStoredItem('email', v);

const AUTH_KEYS = ['token', 'refreshToken', 'role', 'userId', 'username', 'email', 'tutorId'];

export const clearAuth = () => {
  // ล้างทั้งสอง storage เผื่อมีของค้างจากการสลับติ๊ก/ไม่ติ๊ก "จดจำฉันไว้" ระหว่าง session ก่อนหน้า
  AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  localStorage.removeItem(REMEMBER_KEY);
};

export const isAuthenticated = () => !!getToken();
