import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Debug: Log the API URL being used
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🔗 VITE_API_URL env var:', import.meta.env.VITE_API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getCurrentAdmin: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/users/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (formData) => {
    const response = await api.post('/users/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// Attendance API
export const attendanceAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/attendance/', { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/attendance/stats');
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/attendance/dashboard');
    return response.data;
  },

  getUserAttendance: async (userId, params = {}) => {
    const response = await api.get(`/attendance/user/${userId}`, { params });
    return response.data;
  },

  logAttendance: async (data) => {
    const response = await api.post('/attendance/', data);
    return response.data;
  },
};

// Camera API
export const cameraAPI = {
  getFeedUrl: () => {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/camera/feed?token=${token}`;
  },

  getInfo: async () => {
    const response = await api.get('/camera/info');
    return response.data;
  },

  start: async (cameraId = 0) => {
    const response = await api.post('/camera/start', null, {
      params: { camera_id: cameraId },
    });
    return response.data;
  },

  stop: async () => {
    const response = await api.post('/camera/stop');
    return response.data;
  },

  recognize: async () => {
    const response = await api.post('/camera/recognize');
    return response.data;
  },

  reloadFaces: async () => {
    const response = await api.get('/camera/reload-faces');
    return response.data;
  },
};

export default api;
