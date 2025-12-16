import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SurveyListPage from './pages/SurveyListPage';
import SurveyDetailPage from './pages/SurveyDetailPage';
import SurveyCreatePage from './pages/SurveyCreatePage';
import SurveyTakePage from './pages/SurveyTakePage';
import SurveyResultsPage from './pages/SurveyResultsPage';
import GroupListPage from './pages/GroupListPage';
import GroupDetailPage from './pages/GroupDetailPage';
import ThemeListPage from './pages/ThemeListPage';
import ProfilePage from './pages/ProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';

function AppRoutes() {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <HomePage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />

      {/* Public survey taking */}
      <Route path="/survey/:id" element={<SurveyTakePage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/surveys" element={<SurveyListPage />} />
          <Route path="/surveys/new" element={<SurveyCreatePage />} />
          <Route path="/surveys/:id" element={<SurveyDetailPage />} />
          <Route path="/surveys/:id/edit" element={<SurveyCreatePage />} />
          <Route path="/surveys/:id/results" element={<SurveyResultsPage />} />
          <Route path="/groups" element={<GroupListPage />} />
          <Route path="/groups/:id" element={<GroupDetailPage />} />
          <Route path="/themes" element={<ThemeListPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin routes */}
          {isAdmin && (
            <Route path="/admin/users" element={<AdminUsersPage />} />
          )}
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
