import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { surveysAPI } from '../services/api';

const SurveyResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadResults();
  }, [id]);

  const loadResults = async () => {
    try {
      const [surveyRes, resultsRes] = await Promise.all([
        surveysAPI.getById(id).catch(() => surveysAPI.getPublic(id)),
        surveysAPI.getResults(id),
      ]);

      setSurvey(surveyRes.data);
      setResults(resultsRes.data);
    } catch (error) {
      console.error('Failed to load results:', error);
      if (error.response?.status === 403) {
        setError('Results are not available for this survey.');
      } else {
        setError('Failed to load results.');
      }
    }
    setLoading(false);
  };

  const refreshResults = async () => {
    setRefreshing(true);
    try {
      const resultsRes = await surveysAPI.getResults(id);
      setResults(resultsRes.data);
    } catch (error) {
      console.error('Failed to refresh results:', error);
    }
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner w-10 h-10"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="font-display text-2xl font-bold text-stone-800 mb-2">
          Results Unavailable
        </h1>
        <p className="text-stone-600 mb-6">{error}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  const maxScore =
    results.type === 'ranked_choice'
      ? Math.max(...results.results.map((r) => r.score), 1)
      : results.total_stones || 1;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Link
          to={`/surveys/${id}`}
          className="text-moss-600 hover:text-moss-700 text-sm mb-4 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Survey
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-stone-800">
              {survey.title}
            </h1>
            <p className="text-stone-600 mt-1">Survey Results</p>
          </div>
          <button
            onClick={refreshResults}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-4 text-center">
          <div className="text-2xl font-display font-bold text-moss-600">
            {results.total_responses}
          </div>
          <div className="text-sm text-stone-600">Total Responses</div>
        </div>

        {results.type === 'ranked_choice' ? (
          <div className="card p-4 text-center">
            <div className="text-2xl font-display font-bold text-sage-600">
              {survey.choices?.length || 0}
            </div>
            <div className="text-sm text-stone-600">Choices Ranked</div>
          </div>
        ) : (
          <div className="card p-4 text-center">
            <div className="text-2xl font-display font-bold text-clay-600">
              {results.total_stones || 0}
            </div>
            <div className="text-sm text-stone-600">Total Stones</div>
          </div>
        )}

        <div className="card p-4 text-center col-span-2 sm:col-span-1">
          <div className="text-sm text-stone-500 mb-1">Method</div>
          <div className="font-medium text-stone-800">
            {results.type === 'ranked_choice' ? 'Borda Count' : 'Point Allocation'}
          </div>
        </div>
      </div>

      {/* Results Chart */}
      <div className="card p-6 mb-8">
        <h2 className="font-display text-xl font-semibold text-stone-800 mb-6">
          {results.type === 'ranked_choice' ? 'Rankings' : 'Stone Distribution'}
        </h2>

        {results.total_responses > 0 ? (
          <div className="space-y-6">
            {results.results.map((result, index) => (
              <ResultItem
                key={index}
                result={result}
                index={index}
                type={results.type}
                maxScore={maxScore}
                totalResponses={results.total_responses}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-stone-500">No responses yet</p>
          </div>
        )}
      </div>

      {/* Method Explanation */}
      <div className="card p-6 bg-stone-50">
        <h3 className="font-medium text-stone-800 mb-2">
          How {results.type === 'ranked_choice' ? 'Borda Count' : 'Stone Allocation'} Works
        </h3>
        {results.type === 'ranked_choice' ? (
          <p className="text-sm text-stone-600">
            Each position in a ranking is assigned points. With {survey.choices?.length || 'N'} choices,
            a 1st place vote gets {survey.choices?.length || 'N'} points, 2nd place gets{' '}
            {(survey.choices?.length || 2) - 1} points, and so on. The choice with the most total
            points wins. This method rewards consistent high rankings over occasional first places.
          </p>
        ) : (
          <p className="text-sm text-stone-600">
            Each participant distributes 5 stones among 3 choices based on their preferences.
            They can put all stones on one choice or spread them out. The choice with the most
            stones wins. This method captures not just preference order but also preference intensity.
          </p>
        )}
      </div>
    </div>
  );
};

const ResultItem = ({ result, index, type, maxScore, totalResponses }) => {
  const score = type === 'ranked_choice' ? result.score : result.stones;
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const avgPerResponse =
    totalResponses > 0
      ? (score / totalResponses).toFixed(1)
      : 0;

  const colors = [
    { bg: 'bg-moss-500', light: 'bg-moss-50', text: 'text-moss-700' },
    { bg: 'bg-sage-500', light: 'bg-sage-50', text: 'text-sage-700' },
    { bg: 'bg-clay-500', light: 'bg-clay-50', text: 'text-clay-700' },
    { bg: 'bg-stone-400', light: 'bg-stone-50', text: 'text-stone-600' },
  ];

  const color = colors[index % colors.length];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${color.light} ${color.text} font-bold`}
          >
            {index + 1}
          </div>
          <span className="font-medium text-stone-800">{result.text}</span>
        </div>
        <div className="text-right">
          <div className="font-bold text-stone-800">
            {score} {type === 'ranked_choice' ? 'pts' : 'stones'}
          </div>
          <div className="text-xs text-stone-500">
            Avg: {avgPerResponse} / response
          </div>
        </div>
      </div>

      <div className="h-4 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color.bg}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Distribution stats for 5 stones */}
      {type === 'five_stones' && result.distribution && (
        <div className="mt-2 flex gap-1 items-center">
          <span className="text-xs text-stone-400">Distribution:</span>
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4, 5].map((val) => {
              const count = result.distribution.filter((d) => d === val).length;
              if (count === 0) return null;
              return (
                <span
                  key={val}
                  className="text-xs px-1.5 py-0.5 bg-stone-100 rounded text-stone-500"
                >
                  {val}×{count}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyResultsPage;
