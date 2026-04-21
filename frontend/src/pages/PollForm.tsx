import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { getPolls, createPoll, updatePoll, launchPoll, closePoll } from '../services/adminService';
import type { Poll, Question, Option } from '../types';

const PollForm: React.FC = () => {
  const navigate = useNavigate();
  const { id, action } = useParams();
  const isEdit = !!id && action === 'edit';
  const isLaunch = !!id && action === 'launch';
  const isClose = !!id && action === 'close';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      loadPoll(id);
    }
  }, [id, isEdit]);

  const loadPoll = async (pollId: string) => {
    try {
      const polls = await getPolls();
      const poll = polls.find((p) => p._id === pollId);
      if (poll) {
        setTitle(poll.title);
        setDescription(poll.description);
        setQuestions(poll.questions);
      }
    } catch (err) {
      setError('Failed to load poll');
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: '',
      type: 'multipleChoice',
      required: true,
      display: true, // <-- Add this line
      options: [
        { id: Date.now().toString() + '1', text: '' },
        { id: Date.now().toString() + '2', text: '' },
      ],
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (questionId: string, field: keyof Question, value: any) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, [field]: value } : q
      )
    );
  };

  const addOption = (questionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: [
                ...q.options,
                { id: Date.now().toString(), text: '' },
              ],
            }
          : q
      )
    );
  };

  const updateOption = (questionId: string, optionId: string, text: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((o) =>
                o.id === optionId ? { ...o, text } : o
              ),
            }
          : q
      )
    );
  };

  const removeOption = (questionId: string, optionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.filter((o) => o.id !== optionId),
            }
          : q
    )
    );
  };

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter((q) => q.id !== questionId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Clean questions data - remove empty options
    const cleanedQuestions = questions.map((q) => ({
      ...q,
      options: q.options.filter((opt) => opt.text.trim() !== ''),
    }));

    try {
      if (isEdit && id) {
        await updatePoll(id, { title, description, questions: cleanedQuestions });
        navigate('/admin');
      } else {
        await createPoll({ title, description, questions: cleanedQuestions });
        navigate('/admin');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save poll');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = async () => {
    if (!id) return;
    setLoading(true);
    try {
      await launchPoll(id);
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to launch poll');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (!id) return;
    setLoading(true);
    try {
      await closePoll(id);
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to close poll');
    } finally {
      setLoading(false);
    }
  };

  if (isLaunch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-light text-gray-900">Launch Poll</h1>
            <p className="mt-2 text-sm text-gray-500">Once launched, it cannot be edited</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex gap-3">
              <button
                onClick={handleLaunch}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all font-medium"
              >
                {loading ? 'Launching...' : 'Yes, Launch'}
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-all font-medium"
              >
                Cancel
              </button>
            </div>
            {error && (
              <div className="mt-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isClose) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-light text-gray-900">Close Poll</h1>
            <p className="mt-2 text-sm text-gray-500">Voters will no longer be able to submit votes</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all font-medium"
              >
                {loading ? 'Closing...' : 'Yes, Close'}
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-all font-medium"
              >
                Cancel
              </button>
            </div>
            {error && (
              <div className="mt-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <button
            onClick={() => navigate('/admin')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-light text-gray-900">
            {isEdit ? 'Edit Poll' : 'Create Poll'}
          </h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Poll title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                rows={3}
                placeholder="Poll description"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-light text-gray-900">Questions</h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </button>
              </div>

              {questions.map((question) => (
                <div key={question.id} className="border border-gray-100 rounded-xl p-4 mb-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="flex-1 space-y-3 w-full">
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                        placeholder="Question text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        required
                      />
                      <div className="flex flex-wrap gap-4">
                        <select
                          value={question.type}
                          onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        >
                          <option value="multipleChoice">Multiple Choice</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="fillInTheBlank">Fill in the Blank</option>
                        </select>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-600">Required</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={question.display !== false}
                            onChange={(e) => updateQuestion(question.id, 'display', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-600">Display</span>
                        </label>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {(question.type === 'multipleChoice' || question.type === 'checkbox') && (
                    <div className="ml-0 sm:ml-4 space-y-2">
                      {question.options.map((option) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => updateOption(question.id, option.id, e.target.value)}
                            placeholder="Option text"
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(question.id, option.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(question.id)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Option
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              {loading ? 'Saving...' : isEdit ? 'Update Poll' : 'Create Poll'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PollForm;
