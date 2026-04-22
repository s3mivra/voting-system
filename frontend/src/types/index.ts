export interface User {
  _id: string;
  email: string;
  role: 'admin' | 'voter';
  isScreened: boolean;
  votedPolls: string[]; // <-- Replaced hasVoted
  profile?: {
    name: string;
    age: number | null;
  };
}
export interface Poll {
  _id: string;
  title: string;
  description: string;
  questions: Question[];
  status: 'draft' | 'active' | 'closed';
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  text: string;
  type: 'multipleChoice' | 'fillInTheBlank' | 'checkbox';
  required: boolean;
  display: boolean; // <-- Add this line
  options: Option[];
}

export interface Option {
  id: string;
  text: string;
}

export interface VoteSubmission {
  pollId: string;
  votes: {
    questionId: string;
    selected: string | string[];
  }[];
}

export interface Metrics {
  totalVoters: number;
  totalVoted: number;
  totalPending: number;
  voteRatio: string;
  totalVotes: number;
  // We remove topOptions and replace it with the new nested structure
  groupedResults: Array<{
    pollId: string;
    pollTitle: string;
    status: string;
    questions: Array<{
      questionText: string;
      options: Array<{
        text: string;
        count: number;
      }>;
    }>;
  }>;
}