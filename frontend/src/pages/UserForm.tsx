import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Upload, CheckCircle, X, AlertTriangle, User as UserIcon } from 'lucide-react';
import { getUsers, createUser, updateUser, bulkUploadUsers } from '../services/adminService';

const UserForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const isBulkUpload = window.location.pathname.includes('bulk-upload');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'voter'>('voter');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bulkResult, setBulkResult] = useState<any>(null);

  useEffect(() => {
    if (isEdit && id) {
      loadUser(id);
    }
  }, [id, isEdit]);

  const loadUser = async (userId: string) => {
    try {
      const users = await getUsers();
      const user = users.find((u) => u._id === userId);
      if (user) {
        setEmail(user.email);
        setRole(user.role);
      }
    } catch (err) {
      setError('Failed to load user');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit && id) {
        await updateUser(id, { email, role });
      } else {
        await createUser({ email, password, role });
      }
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await bulkUploadUsers(file);
      setBulkResult(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload users');
    } finally {
      setLoading(false);
    }
  };

  if (isBulkUpload) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Upload className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-light text-gray-900">Bulk Upload</h1>
            <p className="mt-2 text-sm text-gray-500">Upload users via CSV file</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            {!bulkResult ? (
              <form onSubmit={handleFileUpload} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    CSV should have columns: email, password, role (optional)
                  </p>
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
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {loading ? 'Uploading...' : 'Upload CSV'}
                </button>
              </form>
            ) : (
              <div>
                <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-6">
                  <CheckCircle className="w-4 h-4" />
                  Upload completed successfully!
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600">Success</span>
                    </div>
                    <span className="text-lg font-medium text-gray-900">{bulkResult.successCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <X className="w-5 h-5 text-red-400" />
                      <span className="text-sm text-gray-600">Errors</span>
                    </div>
                    <span className="text-lg font-medium text-gray-900">{bulkResult.errorCount}</span>
                  </div>
                  {bulkResult.errors.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Errors:</h3>
                      <div className="max-h-60 overflow-y-auto bg-gray-50 p-4 rounded-xl space-y-2">
                        {bulkResult.errors.map((err: any, index: number) => (
                          <div key={index} className="text-xs text-red-500 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {err.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => navigate('/admin')}
                  className="mt-6 w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-all font-medium"
                >
                  Back to Dashboard
                </button>
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
        <div className="max-w-md mx-auto flex items-center gap-2">
          <button
            onClick={() => navigate('/admin')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-light text-gray-900">
            {isEdit ? 'Edit User' : 'Create User'}
          </h1>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <UserIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-light text-gray-900">
              {isEdit ? 'Edit User' : 'New User'}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {isEdit ? 'Update user information' : 'Create a new user account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'voter')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="voter">Voter</option>
                <option value="admin">Admin</option>
              </select>
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
              {loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserForm;
