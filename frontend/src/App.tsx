import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Screening from './pages/Screening';
import Voting from './pages/Voting';
import Success from './pages/Success';
import AdminDashboard from './pages/AdminDashboard';
import PollForm from './pages/PollForm';
import UserForm from './pages/UserForm';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const VoterRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'voter') {
    return <Navigate to="/admin" />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      
      <Route
        path="/screening"
        element={
          <ProtectedRoute>
            <VoterRoute>
              <Screening />
            </VoterRoute>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/voting"
        element={
          <ProtectedRoute>
            <VoterRoute>
              <Voting />
            </VoterRoute>
          </ProtectedRoute>
        }
      />
      
      <Route path="/success" element={<Success />} />
      
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/polls/new"
        element={
          <ProtectedRoute requireAdmin>
            <PollForm />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/polls/:id/:action"
        element={
          <ProtectedRoute requireAdmin>
            <PollForm />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/users/new"
        element={
          <ProtectedRoute requireAdmin>
            <UserForm />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/users/:id/edit"
        element={
          <ProtectedRoute requireAdmin>
            <UserForm />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/users/bulk-upload"
        element={
          <ProtectedRoute requireAdmin>
            <UserForm />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/"
        element={
          user ? (
            user.role === 'admin' ? (
              <Navigate to="/admin" />
            ) : !user.isScreened ? (
              <Navigate to="/screening" />
            ) : (
              <Navigate to="/voting" />
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
