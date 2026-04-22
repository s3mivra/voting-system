import api from './api';
import type { User } from '../types';

export const login = async (email: string, password: string): Promise<User> => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token); // Save token
  }
  return response.data;
};

export const completeScreening = async (profile: { name: string; age: number }): Promise<User> => {
  const response = await api.post('/auth/screening', profile);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token); // Save token
  }
  return response.data;
};

export const logout = async (): Promise<void> => {
  localStorage.removeItem('token'); // Delete token
  await api.post('/auth/logout');
};

export const getMe = async (): Promise<User> => {
  const response = await api.get('/auth/me');
  return response.data;
};

