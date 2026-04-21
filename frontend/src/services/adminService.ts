import api from './api';
import type { Poll, User, Metrics } from '../types';

export const getMetrics = async (): Promise<Metrics> => {
  const response = await api.get('/admin/metrics');
  return response.data;
};

export const getUsers = async (voted?: string): Promise<User[]> => {
  const params = voted ? { voted } : {};
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const createUser = async (userData: {
  email: string;
  password: string;
  role?: string;
}): Promise<User> => {
  const response = await api.post('/admin/users', userData);
  return response.data;
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  const response = await api.put(`/admin/users/${id}`, userData);
  return response.data;
};

// Add the delete user function
export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/admin/users/${id}`);
};

// Update export votes to handle the Blob download correctly
export const exportVotes = async (pollId: string): Promise<void> => {
  const response = await api.get(`/admin/export/votes?pollId=${pollId}`, {
    responseType: 'blob', // Forces Axios to handle the response as a raw binary file
  });
  
  // Create a virtual link to trigger the browser's download manager
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  
  // Update the extension here
  link.setAttribute('download', `votes-poll-${pollId}.xlsx`);
  
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const bulkUploadUsers = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/admin/users/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getPolls = async (): Promise<Poll[]> => {
  const response = await api.get('/admin/polls');
  return response.data;
};

export const createPoll = async (pollData: Partial<Poll>): Promise<Poll> => {
  const response = await api.post('/admin/polls', pollData);
  return response.data;
};

export const updatePoll = async (id: string, pollData: Partial<Poll>): Promise<Poll> => {
  const response = await api.put(`/admin/polls/${id}`, pollData);
  return response.data;
};

export const launchPoll = async (id: string): Promise<{ message: string; poll: Poll }> => {
  const response = await api.post(`/admin/polls/${id}/launch`);
  return response.data;
};

export const closePoll = async (id: string): Promise<{ message: string; poll: Poll }> => {
  const response = await api.post(`/admin/polls/${id}/close`);
  return response.data;
};

export const deletePoll = async (id: string): Promise<void> => {
  await api.delete(`/admin/polls/${id}`);
};

export const exportUsers = async (): Promise<void> => {
  const response = await api.get('/admin/export/users', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'users.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
};
