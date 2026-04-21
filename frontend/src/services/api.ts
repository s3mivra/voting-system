import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

const baseURL = import.meta.env.PROD 
  ? 'https://your-production-backend.com/api' 
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});

export default api;
