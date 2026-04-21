import axios from 'axios';

const baseURL = import.meta.env.PROD 
  ? 'https://voting-system-pb5q.vercel.app/api' 
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});

export default api;
