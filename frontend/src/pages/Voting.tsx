import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle, ChevronLeft, FileText, Send } from 'lucide-react';
import { getActivePolls, getPollById, submitVote } from '../services/voterService';
import type { Poll, VoteSubmission } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Voting: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [votes, setVotes] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  // Add refreshUser here
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      const data = await getActivePolls();
      setPolls(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load polls');
      setLoading(false);
    }
  };

  const selectPoll = async (pollId: string) => {
    try {
      const { poll, hasVoted: voted } = await getPollById(pollId);
      setSelectedPoll(poll);
      setHasVoted(voted);
      setVotes({});
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load poll');
    }
  };

  const handleVoteChange = (questionId: string, value: string | string[]) => {
    setVotes((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitVote = async () => {
    if (!selectedPoll) return;

    // Validate all required questions
    const requiredQuestions = selectedPoll.questions.filter((q) => q.required);
    for (const question of requiredQuestions) {
      if (!votes[question.id] || (Array.isArray(votes[question.id]) && votes[question.id].length === 0)) {
        setError(`Please answer all required questions`);
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      const submission: VoteSubmission = {
        pollId: selectedPoll._id,
        votes: selectedPoll.questions.map((q) => ({
          questionId: q.id,
          selected: votes[q.id] || '',
        })),
      };
      
      await submitVote(submission);
      
      // ADD THIS LINE: Force the app to fetch the updated votedPolls array
      await refreshUser(); 
      
      navigate('/success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-light text-gray-900">Voting</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 hidden sm:block">{user?.profile?.name}</span>
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedPoll ? (
          <>
            <h2 className="text-2xl font-light text-gray-900 mb-8">Active Polls</h2>
            <div className="space-y-4">
              {polls.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-400">No active polls available</p>
                </div>
              ) : (
                polls.map((poll) => {
                  const isVoted = user?.votedPolls?.includes(poll._id);
                  return (
                    <div key={poll._id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">{poll.title}</h3>
                            {isVoted && (
                              <span className="inline-flex items-center bg-green-50 text-green-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">{poll.description}</p>
                        </div>
                        <button
                          onClick={() => selectPoll(poll._id)}
                          disabled={isVoted}
                          className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
                            isVoted 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isVoted ? 'Viewed' : 'Start Voting'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
            <button
              onClick={() => setSelectedPoll(null)}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-6 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {hasVoted ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-light text-gray-900 mb-2">Already Voted</h2>
                <p className="text-gray-400">Thank you for participating</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-light text-gray-900 mb-2">{selectedPoll.title}</h2>
                {selectedPoll.description && (
                  <p className="text-gray-400 mb-8">{selectedPoll.description}</p>
                )}

                <div className="space-y-8">
                  {selectedPoll.questions.map((question) => (
                    <div key={question.id}>
                      <label className="block text-base font-medium text-gray-700 mb-4">
                        {question.text}
                        {question.required && <span className="text-red-500 ml-1">*</span>}
                      </label>

                      {question.type === 'multipleChoice' && (
                        <div className="space-y-3">
                          {question.options.map((option) => (
                            <label key={option.id} className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                              <input
                                type="radio"
                                name={question.id}
                                value={option.id}
                                checked={votes[question.id] === option.id}
                                onChange={(e) => handleVoteChange(question.id, e.target.value)}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-gray-700 text-sm">{option.text}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {question.type === 'checkbox' && (
                        <div className="space-y-3">
                          {question.options.map((option) => (
                            <label key={option.id} className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                              <input
                                type="checkbox"
                                name={question.id}
                                value={option.id}
                                checked={Array.isArray(votes[question.id]) && votes[question.id].includes(option.id)}
                                onChange={(e) => {
                                  const current = (Array.isArray(votes[question.id]) ? votes[question.id] : []) as string[];
                                  if (e.target.checked) {
                                    handleVoteChange(question.id, [...current, option.id]);
                                  } else {
                                    handleVoteChange(question.id, current.filter((id) => id !== option.id));
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span className="text-gray-700 text-sm">{option.text}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {question.type === 'fillInTheBlank' && (
                        <input
                          type="text"
                          value={votes[question.id] as string || ''}
                          onChange={(e) => handleVoteChange(question.id, e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter your answer"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="mt-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmitVote}
                  disabled={submitting}
                  className="mt-8 w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium inline-flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {submitting ? 'Submitting...' : 'Submit Vote'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Voting;
