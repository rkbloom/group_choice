import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { surveysAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Helper to map error codes to display types
const getErrorType = (errorCode) => {
  switch (errorCode) {
    case 'SURVEY_EXPIRED':
      return 'expired';
    case 'SURVEY_INACTIVE':
      return 'inactive';
    case 'ALREADY_RESPONDED':
      return 'duplicate';
    case 'INVALID_TOKEN':
      return 'invalid';
    case 'AUTH_REQUIRED':
      return 'auth';
    default:
      return 'error';
  }
};

// Error Alert Component with icons based on error type
const ErrorAlert = ({ error }) => {
  // Handle both string errors and object errors
  const errorType = typeof error === 'object' ? error.type : 'error';
  const errorMessage = typeof error === 'object' ? error.message : error;

  const getIcon = () => {
    switch (errorType) {
      case 'expired':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'inactive':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        );
      case 'duplicate':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'invalid':
      case 'auth':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'network':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        );
      case 'server':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
    }
  };

  const getTitle = () => {
    switch (errorType) {
      case 'expired':
        return 'Survey Deadline Passed';
      case 'inactive':
        return 'Survey Closed';
      case 'duplicate':
        return 'Already Submitted';
      case 'invalid':
        return 'Invalid Link';
      case 'auth':
        return 'Sign In Required';
      case 'network':
        return 'Connection Error';
      case 'server':
        return 'Server Error';
      default:
        return 'Submission Failed';
    }
  };

  const getBgColor = () => {
    switch (errorType) {
      case 'duplicate':
        return 'bg-amber-50 border-amber-200';
      case 'network':
      case 'server':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-red-50 border-red-200';
    }
  };

  const getTextColor = () => {
    switch (errorType) {
      case 'duplicate':
        return 'text-amber-700';
      case 'network':
      case 'server':
        return 'text-orange-700';
      default:
        return 'text-red-700';
    }
  };

  return (
    <div className={`mb-6 p-4 border rounded-xl ${getBgColor()}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${getTextColor()}`}>{getIcon()}</div>
        <div className="flex-1">
          <h3 className={`font-semibold ${getTextColor()}`}>{getTitle()}</h3>
          <p className={`mt-1 text-sm ${getTextColor()} opacity-90`}>{errorMessage}</p>
        </div>
      </div>
    </div>
  );
};

const SurveyTakePage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [canRespond, setCanRespond] = useState(false);

  // Ranked choice state
  const [rankedChoices, setRankedChoices] = useState([]);

  // 5 Stones state
  const [stoneAllocations, setStoneAllocations] = useState({});
  const [remainingStones, setRemainingStones] = useState(5);

  useEffect(() => {
    loadSurvey();
  }, [id, token]);

  const loadSurvey = async () => {
    try {
      const response = await surveysAPI.getPublic(id, token);
      const surveyData = response.data;

      setSurvey(surveyData);
      setCanRespond(surveyData.can_respond);

      if (surveyData.has_responded) {
        setSubmitted(true);
      }

      // Initialize choices
      if (surveyData.survey_type === 'ranked_choice') {
        setRankedChoices(surveyData.choices.map((c) => ({ ...c })));
      } else {
        const initialAllocations = {};
        surveyData.choices.forEach((c) => {
          initialAllocations[c.id] = 0;
        });
        setStoneAllocations(initialAllocations);
      }
    } catch (error) {
      console.error('Failed to load survey:', error);
      if (error.response?.status === 410) {
        setError('This survey is no longer active.');
      } else {
        setError('Failed to load survey.');
      }
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const payload = { token };

      if (survey.survey_type === 'ranked_choice') {
        payload.ranked_answers = rankedChoices.map((choice, index) => ({
          choice_id: String(choice.id),
          rank: index + 1,
        }));
      } else {
        payload.stones_answers = Object.entries(stoneAllocations).map(
          ([choiceId, stones]) => ({
            choice_id: String(choiceId),
            stones,
          })
        );
      }

      await surveysAPI.respond(id, payload);
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit:', error);
      // Extract error message from various DRF response formats
      const data = error.response?.data;
      const status = error.response?.status;
      let errorInfo = {
        type: 'error',
        message: 'Something went wrong while submitting your response. Please try again.',
      };

      if (data) {
        // Handle structured error responses with error_code
        if (data.non_field_errors && typeof data.non_field_errors[0] === 'object') {
          const errData = data.non_field_errors[0];
          errorInfo = {
            type: getErrorType(errData.error_code),
            message: errData.message,
          };
        } else if (typeof data === 'string') {
          errorInfo.message = data;
        } else if (Array.isArray(data)) {
          errorInfo.message = data[0];
        } else if (data.detail) {
          errorInfo.message = data.detail;
        } else if (data.non_field_errors) {
          errorInfo.message = Array.isArray(data.non_field_errors)
            ? data.non_field_errors[0]
            : data.non_field_errors;
        } else if (data.message) {
          errorInfo.message = data.message;
        } else if (data.error_code) {
          errorInfo = {
            type: getErrorType(data.error_code),
            message: data.message || 'An error occurred.',
          };
        }
      }

      // Add network error handling
      if (!error.response) {
        errorInfo = {
          type: 'network',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
        };
      } else if (status >= 500) {
        errorInfo = {
          type: 'server',
          message: 'The server encountered an error. Please try again in a few moments.',
        };
      }

      setError(errorInfo);
    }
    setSubmitting(false);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setRankedChoices((items) => {
        const oldIndex = items.findIndex((i) => String(i.id) === String(active.id));
        const newIndex = items.findIndex((i) => String(i.id) === String(over.id));
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const allocateStone = (choiceId, increment) => {
    const current = stoneAllocations[choiceId];
    const newValue = current + increment;

    if (newValue < 0 || newValue > 5) return;
    if (increment > 0 && remainingStones <= 0) return;

    setStoneAllocations((prev) => ({ ...prev, [choiceId]: newValue }));
    setRemainingStones((prev) => prev - increment);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="spinner w-10 h-10"></div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="card-organic text-center max-w-md">
          <div className="text-5xl mb-4">😔</div>
          <h1 className="font-display text-2xl font-bold text-stone-800 mb-2">
            Survey Unavailable
          </h1>
          <p className="text-stone-600 mb-6">{error}</p>
          <Link to="/" className="btn-primary inline-block">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="card-organic text-center max-w-md animate-fade-in">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="font-display text-2xl font-bold text-stone-800 mb-2">
            Response Submitted!
          </h1>
          <p className="text-stone-600 mb-6">
            Thank you for participating in this survey.
          </p>
          {survey.results_public && (
            <Link
              to={`/surveys/${id}/results`}
              className="btn-secondary inline-block mb-4"
            >
              View Results
            </Link>
          )}
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary inline-block">
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/" className="btn-primary inline-block">
              Go Home
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!canRespond && !token && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="card-organic text-center max-w-md">
          <h1 className="font-display text-2xl font-bold text-stone-800 mb-2">
            Sign In Required
          </h1>
          <p className="text-stone-600 mb-6">
            Please sign in to take this survey.
          </p>
          <Link
            to={`/login?redirect=/survey/${id}`}
            className="btn-primary inline-block"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4">
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <span
            className={`badge mb-4 ${
              survey.survey_type === 'ranked_choice' ? 'badge-ranked' : 'badge-stones'
            }`}
          >
            {survey.survey_type === 'ranked_choice' ? 'Ranked Choice' : '5 Stones'}
          </span>
          <h1 className="font-display text-3xl font-bold text-stone-800 mb-2">
            {survey.title}
          </h1>
          <p className="text-lg text-stone-600">{survey.question}</p>
          {survey.description && (
            <p className="text-stone-500 mt-2">{survey.description}</p>
          )}
        </div>

        {/* Survey Form */}
        <div className="card-organic">
          {error && <ErrorAlert error={error} />}

          {survey.survey_type === 'ranked_choice' ? (
            <RankedChoiceForm
              choices={rankedChoices}
              sensors={sensors}
              onDragEnd={handleDragEnd}
            />
          ) : (
            <FiveStonesForm
              choices={survey.choices}
              allocations={stoneAllocations}
              remainingStones={remainingStones}
              onAllocate={allocateStone}
            />
          )}

          {/* Submit Button */}
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              disabled={
                submitting ||
                (survey.survey_type === 'five_stones' && remainingStones > 0)
              }
              className="w-full btn-primary flex items-center justify-center"
            >
              {submitting ? (
                <div className="spinner w-5 h-5"></div>
              ) : (
                'Submit Response'
              )}
            </button>
            {survey.survey_type === 'five_stones' && remainingStones > 0 && (
              <p className="text-center text-sm text-stone-500 mt-2">
                Please allocate all 5 stones before submitting
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-stone-400 mt-8">
          Powered by Group Choice
        </p>
      </div>
    </div>
  );
};

// Ranked Choice Form Component
const RankedChoiceForm = ({ choices, sensors, onDragEnd }) => {
  return (
    <div>
      <p className="text-stone-600 mb-4">
        Drag the options below to rank them in your preferred order.
        <br />
        <span className="text-sm text-stone-500">
          #1 is your top choice, lowest number wins.
        </span>
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={choices.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {choices.map((choice, index) => (
              <SortableItem key={choice.id} choice={choice} rank={index + 1} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

// Choice Text Component (with optional link)
const ChoiceText = ({ text, url, className = '' }) => {
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`text-moss-600 hover:text-moss-700 underline ${className}`}
      >
        {text}
        <svg className="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    );
  }
  return <span className={className}>{text}</span>;
};

// Sortable Item Component
const SortableItem = ({ choice, rank }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: choice.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`drag-item flex items-center gap-4 ${
        isDragging ? 'drag-item-active z-10' : ''
      }`}
    >
      <div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center text-sage-700 font-bold">
        {rank}
      </div>
      <div className="flex-1">
        <ChoiceText text={choice.text} url={choice.url} className="text-stone-800" />
      </div>
      <svg
        className="w-5 h-5 text-stone-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 8h16M4 16h16"
        />
      </svg>
    </div>
  );
};

// 5 Stones Form Component
const FiveStonesForm = ({ choices, allocations, remainingStones, onAllocate }) => {
  return (
    <div>
      <div className="text-center mb-6">
        <p className="text-stone-600 mb-2">
          Distribute your 5 stones among the choices below.
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-stone-500">Remaining:</span>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`stone ${i < remainingStones ? '' : 'opacity-30'}`}
              />
            ))}
          </div>
          <span className="font-bold text-clay-600">{remainingStones}</span>
        </div>
      </div>

      <div className="space-y-6">
        {choices.map((choice) => (
          <div key={choice.id} className="p-4 bg-stone-50 rounded-xl">
            <div className="font-medium text-stone-800 mb-3">
              <ChoiceText text={choice.text} url={choice.url} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      onAllocate(
                        choice.id,
                        i < allocations[choice.id] ? -1 : 1
                      )
                    }
                    className={`stone ${
                      i < allocations[choice.id] ? 'stone-active' : ''
                    }`}
                    disabled={
                      i >= allocations[choice.id] && remainingStones <= 0
                    }
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onAllocate(choice.id, -1)}
                  disabled={allocations[choice.id] <= 0}
                  className="w-8 h-8 rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  -
                </button>
                <span className="w-8 text-center font-bold text-lg text-clay-600">
                  {allocations[choice.id]}
                </span>
                <button
                  onClick={() => onAllocate(choice.id, 1)}
                  disabled={allocations[choice.id] >= 5 || remainingStones <= 0}
                  className="w-8 h-8 rounded-full bg-clay-200 text-clay-700 hover:bg-clay-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SurveyTakePage;
