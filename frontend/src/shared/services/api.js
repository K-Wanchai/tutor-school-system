import axios from 'axios';

const SERVER_HOST = '172.24.163.173';
const API_ORIGIN = `http://${SERVER_HOST}:8080`;
const BASE_URL = `${API_ORIGIN}/api/v1`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Uploaded file URLs (logo, payment slips, QR codes, ...) are read back from the
// DB and may have an old host/IP baked in from whenever they were uploaded — this
// machine's LAN IP changes over time. Always re-point them at the *current*
// SERVER_HOST above so every machine renders the same image without needing a
// backend change or re-upload; only this file's SERVER_HOST ever needs editing.
export function resolveFileUrl(url) {
  if (!url) return url;
  const marker = '/uploads/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  return API_ORIGIN + url.slice(idx);
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });

  failedQueue = [];
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('role');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('tutorId');

  window.location.href = '/login';
}

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error.config;

    if (!original) {
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      original.url?.includes('/auth/login') ||
      original.url?.includes('/auth/refresh') ||
      original.url?.includes('/auth/register');

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !isAuthEndpoint &&
      !original._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        isRefreshing = false;
        logout();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const data = res.data?.data ?? res.data;

        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        localStorage.setItem('token', newAccessToken);

        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        original.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;