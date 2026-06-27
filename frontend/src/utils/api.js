import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000';
  }
  
  const url = import.meta.env.VITE_API_URL;
  if (!url || url === '/api' || url === 'api') {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  
  if (url.startsWith('/')) {
    return typeof window !== 'undefined' ? window.location.origin + url : url;
  }
  
  return url;
};

const axiosConfig = {
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
};

const api = axios.create(axiosConfig);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
