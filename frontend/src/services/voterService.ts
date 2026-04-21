import api from './api';
import type { Poll, VoteSubmission } from '../types';

export const getActivePolls = async (): Promise<Poll[]> => {
  const response = await api.get('/voter/polls');
  return response.data;
};

export const getPollById = async (id: string): Promise<{ poll: Poll; hasVoted: boolean }> => {
  const response = await api.get(`/voter/polls/${id}`);
  return response.data;
};

export const submitVote = async (submission: VoteSubmission): Promise<void> => {
  await api.post('/voter/vote', submission);
};
