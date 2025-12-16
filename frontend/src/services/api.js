import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) =>
    api.post('/token/', { email, password }),

  register: (data) =>
    api.post('/users/register/', data),

  checkEmail: (email) =>
    api.post('/users/check-email/', { email }),

  checkUsername: (username) =>
    api.post('/users/check-username/', { username }),

  getCurrentUser: () =>
    api.get('/users/me/'),

  updateProfile: (data) =>
    api.patch('/users/me/', data),

  changePassword: (data) =>
    api.put('/users/me/password/', data),

  getDashboard: () =>
    api.get('/users/dashboard/'),
};

// Users API (Admin)
export const usersAPI = {
  getAll: (params) =>
    api.get('/users/', { params }),

  getById: (id) =>
    api.get(`/users/${id}/`),

  create: (data) =>
    api.post('/users/', data),

  update: (id, data) =>
    api.patch(`/users/${id}/`, data),

  delete: (id) =>
    api.delete(`/users/${id}/`),
};

// Surveys API
export const surveysAPI = {
  getAll: (params) =>
    api.get('/surveys/', { params }),

  getMySurveys: (params) =>
    api.get('/surveys/my-surveys/', { params }),

  getById: (id) =>
    api.get(`/surveys/${id}/`),

  getPublic: (id, token) =>
    api.get(`/surveys/public/${id}/`, { params: { token } }),

  create: (data) =>
    api.post('/surveys/', data),

  update: (id, data) =>
    api.patch(`/surveys/${id}/`, data),

  delete: (id) =>
    api.delete(`/surveys/${id}/`),

  respond: (id, data) =>
    api.post(`/surveys/${id}/respond/`, data),

  getResults: (id) =>
    api.get(`/surveys/${id}/results/`),

  getResponses: (id) =>
    api.get(`/surveys/${id}/responses/`),

  toggleResultsVisibility: (id) =>
    api.post(`/surveys/${id}/toggle_results_visibility/`),

  checkResponseStatus: (id, token) =>
    api.get(`/surveys/${id}/check_response_status/`, { params: { token } }),
};

// Themes API
export const themesAPI = {
  getAll: (params) =>
    api.get('/themes/', { params }),

  getById: (id) =>
    api.get(`/themes/${id}/`),

  getDefault: () =>
    api.get('/themes/default/'),

  create: (data) =>
    api.post('/themes/', data),

  update: (id, data) =>
    api.patch(`/themes/${id}/`, data),

  delete: (id) =>
    api.delete(`/themes/${id}/`),

  setDefault: (id) =>
    api.post(`/themes/${id}/set_default/`),
};

// Groups API
export const groupsAPI = {
  getAll: (params) =>
    api.get('/groups/', { params }),

  getById: (id) =>
    api.get(`/groups/${id}/`),

  create: (data) =>
    api.post('/groups/', data),

  update: (id, data) =>
    api.patch(`/groups/${id}/`, data),

  delete: (id) =>
    api.delete(`/groups/${id}/`),

  addMember: (id, data) =>
    api.post(`/groups/${id}/add_member/`, data),

  removeMember: (id, email) =>
    api.post(`/groups/${id}/remove_member/`, { email }),

  addMembersBulk: (id, emails) =>
    api.post(`/groups/${id}/add_members_bulk/`, { emails }),
};

export default api;
