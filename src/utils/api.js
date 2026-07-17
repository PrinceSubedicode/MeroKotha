import axios from 'axios';

// Create a pre-configured Axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token dynamically
api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('admin_token');
    const token = localStorage.getItem('token');

    // Attach admin token for admin routes or if no regular token exists
    if (config.url && (config.url.startsWith('/admin') || config.url.includes('/admin/')) && adminToken) {
      config.headers['Authorization'] = `Bearer ${adminToken}`;
    } else if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else if (adminToken) {
      config.headers['Authorization'] = `Bearer ${adminToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry / unauthenticated events
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Avoid clear session loop if already on login pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/admin')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
