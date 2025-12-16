import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { surveysAPI } from '../services/api';

const SurveyListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [surveys, setSurveys] = useState({ authored: [], invited: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('type') || 'all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadSurveys();
  }, [filter, search]);

  const loadSurveys = async () => {
    try {
      const response = await surveysAPI.getMySurveys({ type: filter, search });
      setSurveys(response.data);
    } catch (error) {
      console.error('Failed to load surveys:', error);
    }
    setLoading(false);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setSearchParams(newFilter !== 'all' ? { type: newFilter } : {});
  };

  const allSurveys = [
    ...(surveys.authored || []).map((s) => ({ ...s, isAuthor: true })),
    ...(surveys.invited || []).map((s) => ({ ...s, isAuthor: false })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const displaySurveys =
    filter === 'all'
      ? allSurveys
      : filter === 'authored'
      ? (surveys.authored || []).map((s) => ({ ...s, isAuthor: true }))
      : (surveys.invited || []).map((s) => ({ ...s, isAuthor: false }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-stone-800">Surveys</h1>
          <p className="text-stone-600 mt-1">Manage and take surveys</p>
        </div>
        <Link to="/surveys/new" className="btn-primary">
          Create New Survey
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex bg-stone-100 rounded-xl p-1">
          {['all', 'authored', 'invited'].map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-600 hover:text-stone-800'
              }`}
            >
              {f === 'all' ? 'All' : f === 'authored' ? 'Created' : 'Invited'}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search surveys..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

      {/* Survey List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner w-10 h-10"></div>
        </div>
      ) : displaySurveys.length > 0 ? (
        <div className="grid gap-4">
          {displaySurveys.map((survey) => (
            <SurveyCard key={survey.id} survey={survey} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="font-display text-xl font-semibold text-stone-800 mb-2">
            No surveys found
          </h3>
          <p className="text-stone-500 mb-6">
            {filter === 'authored'
              ? "You haven't created any surveys yet."
              : filter === 'invited'
              ? "You haven't been invited to any surveys."
              : 'No surveys match your search.'}
          </p>
          {filter !== 'invited' && (
            <Link to="/surveys/new" className="btn-primary inline-block">
              Create Your First Survey
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

const SurveyCard = ({ survey }) => {
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
      to={survey.isAuthor ? `/surveys/${survey.id}` : `/survey/${survey.id}`}
      className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-moss-200"
    >
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h3 className="font-medium text-stone-800 text-lg">{survey.title}</h3>
          {getTypeBadge()}
          {getStatusBadge()}
          {survey.isAuthor && (
            <span className="badge bg-moss-50 text-moss-700">Author</span>
          )}
        </div>
        <p className="text-sm text-stone-500">
          {survey.isAuthor ? (
            <>
              {survey.response_count} response{survey.response_count !== 1 ? 's' : ''}
              {survey.deadline && (
                <> · Due {new Date(survey.deadline).toLocaleDateString()}</>
              )}
            </>
          ) : (
            <>by {survey.author_name}</>
          )}
          <span className="mx-2">·</span>
          Created {new Date(survey.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center text-moss-600">
        <span className="text-sm font-medium mr-2">
          {survey.isAuthor ? 'View Details' : 'Take Survey'}
        </span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
};

export default SurveyListPage;
