import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, BarChart3, FileText, Users, Plus, Upload, Download, Trash2, Edit, Play, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getMetrics, getPolls, getUsers, deleteUser, exportVotes } from '../services/adminService';
import type { Metrics, Poll, User as UserType } from '../types';

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [activeTab, setActiveTab] = useState<'metrics' | 'polls' | 'users'>('metrics');
  const [userFilter, setUserFilter] = useState<'all' | 'voted' | 'not-voted'>('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate, userFilter]);
  const loadData = async () => {
    try {
      const [metricsData, pollsData, usersData] = await Promise.all([
        getMetrics(),
        getPolls(),
        getUsers(userFilter === 'all' ? undefined : userFilter === 'voted' ? 'true' : 'false'),
      ]);
      setMetrics(metricsData);
      setPolls(pollsData);
      setUsers(usersData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load data');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This cannot be undone.')) {
      try {
        await deleteUser(userId);
        // Remove the user from the local React state instantly
        setUsers(users.filter((u) => u._id !== userId));
        // Optional: reload metrics to update the total counts
        loadData(); 
      } catch (err) {
        console.error('Failed to delete user');
        alert('Failed to delete user.');
      }
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
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-light text-gray-900">Admin</h1>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-100 pb-4">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'metrics' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Metrics
          </button>
          <button
            onClick={() => setActiveTab('polls')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'polls' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            Polls
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
        </div>

        {activeTab === 'metrics' && metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="text-sm text-gray-400 mb-2">Total Voters</p>
              <p className="text-3xl font-light text-gray-900">{metrics.totalVoters}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="text-sm text-gray-400 mb-2">Total Voted</p>
              <p className="text-3xl font-light text-green-600">{metrics.totalVoted}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="text-sm text-gray-400 mb-2">Pending</p>
              <p className="text-3xl font-light text-yellow-600">{metrics.totalPending}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="text-sm text-gray-400 mb-2">Vote Ratio</p>
              <p className="text-3xl font-light text-blue-600">{metrics.voteRatio}%</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:col-span-2">
              <p className="text-sm text-gray-400 mb-4">Top Options</p>
              <div className="space-y-4">
                {metrics.topOptions.map((option, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase mb-1">
                        {option.pollTitle}
                      </span>
                      <span className="text-gray-800 font-medium text-sm">
                        {option.questionText}
                      </span>
                      <span className="text-blue-500 text-xs mt-1">
                        {option.optionText}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xl font-light text-gray-900">{option.count}</span>
                      <span className="text-xs text-gray-400">votes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'polls' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-light text-gray-900">Polls</h2>
              <button
                onClick={() => navigate('/admin/polls/new')}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Create Poll
              </button>
            </div>
            <div className="space-y-4">
              {polls.map((poll) => (
                <div key={poll._id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-all">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{poll.title}</h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          poll.status === 'active' ? 'bg-green-50 text-green-600' :
                          poll.status === 'closed' ? 'bg-red-50 text-red-600' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {poll.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{poll.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {poll.status === 'draft' && (
                        <>
                          <button
                            onClick={() => navigate(`/admin/polls/${poll._id}/edit`)}
                            className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => navigate(`/admin/polls/${poll._id}/launch`)}
                            className="inline-flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            Launch
                          </button>
                        </>
                      )}
                      {poll.status === 'active' && (
                        <>
                          <button
                            onClick={() => navigate(`/admin/polls/${poll._id}/close`)}
                            className="inline-flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Close
                          </button>
                          <button
                            onClick={() => exportVotes(poll._id)}
                            className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Export
                          </button>
                        </>
                      )}
                      {poll.status === 'closed' && (
                        <button
                          onClick={() => exportVotes(poll._id)}
                          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Export
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-light text-gray-900">Users</h2>
              <div className="flex flex-wrap gap-2">
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value as any)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="voted">Voted</option>
                  <option value="not-voted">Not Voted</option>
                </select>
                <button
                  onClick={() => navigate('/admin/users/new')}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
                <button
                  onClick={() => navigate('/admin/users/bulk-upload')}
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all text-sm font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Bulk Upload
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Screened</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Voted</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const activePolls = polls.filter(p => p.status === 'active');
                    const hasFinishedAll = activePolls.length > 0 && 
                      activePolls.every(poll => user.votedPolls?.includes(poll._id));

                    return (
                      <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700">{user.email}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{user.profile?.name || '-'}</td>
                        <td className="py-3 px-4">
                          {user.isScreened ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <X className="w-5 h-5 text-red-400" />
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {hasFinishedAll ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <X className="w-5 h-5 text-red-400" />
                          )}
                        </td>
                        <td className="py-3 px-4 flex gap-2">
                          <button
                            onClick={() => navigate(`/admin/users/${user._id}/edit`)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
