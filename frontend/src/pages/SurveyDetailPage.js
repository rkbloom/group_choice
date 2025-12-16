import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { surveysAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SurveyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isSuper } = useAuth();

  const [survey, setSurvey] = useState(null);
  const [results, setResults] = useState(null);
  const [responses, setResponses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResponses, setShowResponses] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    loadSurvey();
  }, [id]);

  const loadSurvey = async () => {
    try {
      const [surveyRes, resultsRes] = await Promise.all([
        surveysAPI.getById(id),
        surveysAPI.getResults(id).catch(() => null),
      ]);

      setSurvey(surveyRes.data);
      if (resultsRes) setResults(resultsRes.data);
    } catch (error) {
      console.error('Failed to load survey:', error);
      navigate('/surveys');
    }
    setLoading(false);
  };

  const loadResponses = async () => {
    if (!survey.is_anonymous) {
      try {
        const response = await surveysAPI.getResponses(id);
        setResponses(response.data);
      } catch (error) {
        console.error('Failed to load responses:', error);
      }
    }
    setShowResponses(true);
  };

  const toggleResultsVisibility = async () => {
    try {
      const response = await surveysAPI.toggleResultsVisibility(id);
      setSurvey((prev) => ({ ...prev, results_public: response.data.results_public }));
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await surveysAPI.delete(id);
      navigate('/surveys');
    } catch (error) {
      console.error('Failed to delete survey:', error);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(survey.share_url);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner w-10 h-10"></div>
      </div>
    );
  }

  const isAuthor = survey.author === user?.id;
  const canEdit = isAuthor || isSuper;
  const canDelete = isAuthor || isSuper;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-3xl font-bold text-stone-800">
              {survey.title}
            </h1>
            <span
              className={`badge ${
                survey.survey_type === 'ranked_choice' ? 'badge-ranked' : 'badge-stones'
              }`}
            >
              {survey.survey_type === 'ranked_choice' ? 'Ranked Choice' : '5 Stones'}
            </span>
            {survey.is_expired ? (
              <span className="badge bg-stone-100 text-stone-600">Expired</span>
            ) : survey.is_active ? (
              <span className="badge badge-success">Active</span>
            ) : (
              <span className="badge bg-stone-100 text-stone-600">Inactive</span>
            )}
          </div>
          <p className="text-stone-600">{survey.question}</p>
          {survey.description && (
            <p className="text-stone-500 text-sm mt-1">{survey.description}</p>
          )}
        </div>

        {canEdit && (
          <div className="flex gap-3">
            <Link to={`/surveys/${id}/edit`} className="btn-secondary">
              Edit
            </Link>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-2xl font-display font-bold text-moss-600">
            {survey.response_count}
          </div>
          <div className="text-stone-600">Total Responses</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-stone-500 mb-1">Created</div>
          <div className="font-medium text-stone-800">
            {new Date(survey.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-stone-500 mb-1">Deadline</div>
          <div className="font-medium text-stone-800">
            {survey.deadline
              ? new Date(survey.deadline).toLocaleDateString()
              : 'No deadline'}
          </div>
        </div>
      </div>

      {/* Share Section */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold text-stone-800 mb-4">
          Share Survey
        </h2>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={survey.share_url}
            readOnly
            className="input-field flex-1 bg-stone-50"
          />
          <button onClick={copyShareLink} className="btn-primary">
            Copy Link
          </button>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={survey.results_public}
              onChange={toggleResultsVisibility}
              className="w-4 h-4 text-moss-600 rounded border-stone-300 focus:ring-moss-500"
            />
            <span className="ml-2 text-stone-600">
              Allow survey takers to see results
            </span>
          </label>
        </div>
      </div>

      {/* Choices */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold text-stone-800 mb-4">
          Choices
        </h2>
        <div className="space-y-2">
          {survey.choices.map((choice, index) => (
            <div
              key={choice.id}
              className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl"
            >
              <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-stone-600 font-medium">
                {index + 1}
              </span>
              <span className="text-stone-800">{choice.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-stone-800">
              Results
            </h2>
            <Link
              to={`/surveys/${id}/results`}
              className="text-moss-600 text-sm hover:text-moss-700"
            >
              View Full Results
            </Link>
          </div>

          {results.total_responses > 0 ? (
            <div className="space-y-4">
              {results.results.slice(0, 5).map((result, index) => (
                <ResultBar
                  key={index}
                  result={result}
                  index={index}
                  type={survey.survey_type}
                  maxScore={
                    survey.survey_type === 'ranked_choice'
                      ? Math.max(...results.results.map((r) => r.score))
                      : results.total_stones
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-stone-500 text-center py-4">
              No responses yet
            </p>
          )}
        </div>
      )}

      {/* Responses */}
      {!survey.is_anonymous && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-stone-800">
              Individual Responses
            </h2>
            {!showResponses && (
              <button
                onClick={loadResponses}
                className="text-moss-600 text-sm hover:text-moss-700"
              >
                View Responses
              </button>
            )}
          </div>

          {showResponses && responses ? (
            responses.length > 0 ? (
              <div className="space-y-4">
                {responses.map((response) => (
                  <div key={response.id} className="p-4 bg-stone-50 rounded-xl">
                    <div className="font-medium text-stone-800 mb-2">
                      {response.user_name || response.anonymous_email || 'Anonymous'}
                    </div>
                    <div className="text-sm text-stone-500">
                      Submitted {new Date(response.submitted_at).toLocaleString()}
                    </div>
                    {survey.survey_type === 'ranked_choice' ? (
                      <div className="mt-2 space-y-1">
                        {response.ranked_answers.map((a, i) => (
                          <div key={i} className="text-sm">
                            <span className="text-stone-400">{a.rank}.</span>{' '}
                            <span className="text-stone-600">{a.choice}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 space-y-1">
                        {response.stones_answers.map((a, i) => (
                          <div key={i} className="text-sm flex items-center gap-2">
                            <span className="text-stone-600">{a.choice}</span>
                            <span className="text-clay-600 font-medium">
                              {a.stones} stone{a.stones !== 1 ? 's' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-stone-500 text-center py-4">
                No responses yet
              </p>
            )
          ) : null}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 animate-slide-up">
            <h3 className="font-display text-xl font-semibold text-stone-800 mb-2">
              Delete Survey?
            </h3>
            <p className="text-stone-600 mb-6">
              This action cannot be undone. All responses will be permanently deleted.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ResultBar = ({ result, index, type, maxScore }) => {
  const score = type === 'ranked_choice' ? result.score : result.stones;
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  const colors = [
    'bg-moss-500',
    'bg-sage-500',
    'bg-clay-500',
    'bg-stone-500',
    'bg-moss-400',
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-stone-800 font-medium">
          {index + 1}. {result.text}
        </span>
        <span className="text-stone-600 text-sm">
          {type === 'ranked_choice'
            ? `${score} points`
            : `${score} stone${score !== 1 ? 's' : ''}`}
        </span>
      </div>
      <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`results-bar ${colors[index % colors.length]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default SurveyDetailPage;
