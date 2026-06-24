export const getToken        = ()    => localStorage.getItem('token');
export const getRole         = ()    => localStorage.getItem('role');
export const getRefreshToken = ()    => localStorage.getItem('refreshToken');
export const setToken        = (v)   => localStorage.setItem('token', v);
export const setRole         = (v)   => localStorage.setItem('role', v);
export const setRefreshToken = (v)   => localStorage.setItem('refreshToken', v);

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('role');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('email');
};

export const isAuthenticated = () => !!getToken();
