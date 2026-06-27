import axios from 'axios';

const axiosConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
};

const devBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const prodBaseURL = import.meta.env.VITE_API_URL;

if (import.meta.env.DEV && devBaseURL) {
  axiosConfig.baseURL = devBaseURL;
} else if (!import.meta.env.DEV && prodBaseURL) {
  axiosConfig.baseURL = prodBaseURL;
}

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
