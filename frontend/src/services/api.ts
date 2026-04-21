import axios from 'axios';

// Point directly to your deployed backend API
const API_URL = import.meta.env.PROD 
  ? 'https://voting-system-pb5q.vercel.app/api' 
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // This ensures Axios actually sends the cookie
});

export default api;