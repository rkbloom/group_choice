import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await authAPI.getDashboard();
      setDashboard(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
    setLoading(false);
  };

  const filterSurveys = (surveys) => {
    if (!filter) return surveys;
    return surveys.filter(
      (s) =>
        s.title.toLowerCase().includes(filter.toLowerCase()) ||
        s.survey_type.toLowerCase().includes(filter.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner w-10 h-10"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-stone-800">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-stone-600 mt-1">
            Here's what's happening with your surveys.
          </p>
        </div>
        <Link to="/surveys/new" className="btn-primary mt-4 md:mt-0">
          Create New Survey
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="text-3xl font-display font-bold text-moss-600">
            {dashboard?.stats?.authored_count || 0}
          </div>
          <div className="text-stone-600 mt-1">Surveys Created</div>
        </div>
        <div className="card p-6">
          <div className="text-3xl font-display font-bold text-sage-600">
            {dashboard?.stats?.invited_count || 0}
          </div>
          <div className="text-stone-600 mt-1">Surveys Invited To</div>
        </div>
        <div className="card p-6">
          <div className="text-3xl font-display font-bold text-clay-600">
            {dashboard?.stats?.responses_submitted || 0}
          </div>
          <div className="text-stone-600 mt-1">Responses Submitted</div>
        </div>
      </div>

      {/* Search/Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search surveys..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field pl-10"
          />
          <svg
            className="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Authored Surveys */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-stone-800">
            Your Surveys
          </h2>
          <Link to="/surveys?type=authored" className="text-moss-600 text-sm hover:text-moss-700">
            View all
          </Link>
        </div>

        {dashboard?.authored_surveys?.length > 0 ? (
          <div className="grid gap-4">
            {filterSurveys(dashboard.authored_surveys).slice(0, 5).map((survey) => (
              <SurveyCard key={survey.id} survey={survey} isAuthor />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="font-medium text-stone-800 mb-1">No surveys yet</h3>
            <p className="text-stone-500 mb-4">Create your first survey to get started</p>
            <Link to="/surveys/new" className="btn-primary inline-block">
              Create Survey
            </Link>
          </div>
        )}
      </section>

      {/* Invited Surveys */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-stone-800">
            Surveys to Take
          </h2>
          <Link to="/surveys?type=invited" className="text-moss-600 text-sm hover:text-moss-700">
            View all
          </Link>
        </div>

        {dashboard?.invited_surveys?.length > 0 ? (
          <div className="grid gap-4">
            {filterSurveys(dashboard.invited_surveys).slice(0, 5).map((survey) => (
              <SurveyCard key={survey.id} survey={survey} />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h3 className="font-medium text-stone-800 mb-1">No invitations</h3>
            <p className="text-stone-500">You haven't been invited to any surveys yet</p>
          </div>
        )}
      </section>
    </div>
  );
};

const SurveyCard = ({ survey, isAuthor = false }) => {
  const getTypeBadge = () => {
    if (survey.survey_type === 'ranked_choice') {
      return <span className="badge badge-ranked">Ranked Choice</span>;
    }
    return <span className="badge badge-stones">5 Stones</span>;
  };

  const getStatusBadge = () => {
    if (survey.is_expired) {
      return <span className="badge bg-stone-100 text-stone-600">Expired</span>;
    }
    if (!survey.is_active) {
      return <span className="badge bg-stone-100 text-stone-600">Inactive</span>;
    }
    return <span className="badge badge-success">Active</span>;
  };

  return (
    <Link
      to={isAuthor ? `/surveys/${survey.id}` : `/survey/${survey.id}`}
      className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-moss-200"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-stone-800">{survey.title}</h3>
          {getTypeBadge()}
          {getStatusBadge()}
        </div>
        <p className="text-sm text-stone-500">
          {isAuthor ? (
            <>
              {survey.response_count} response{survey.response_count !== 1 ? 's' : ''}
              {survey.deadline && (
                <> · Due {new Date(survey.deadline).toLocaleDateString()}</>
              )}
            </>
          ) : (
            <>by {survey.author_name}</>
          )}
        </p>
      </div>

      <div className="flex items-center text-moss-600">
        <span className="text-sm font-medium mr-2">
          {isAuthor ? 'View Details' : 'Take Survey'}
        </span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
};

export default DashboardPage;
