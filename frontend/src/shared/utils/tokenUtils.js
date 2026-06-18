export const getToken = () => localStorage.getItem('token');
export const getRole = () => localStorage.getItem('role');
export const setToken = (token) => localStorage.setItem('token', token);
export const setRole = (role) => localStorage.setItem('role', role);

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
};

export const isAuthenticated = () => !!getToken();
