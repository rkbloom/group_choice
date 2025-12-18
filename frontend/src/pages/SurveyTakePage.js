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
      let errorMessage = 'Failed to submit response.';

      if (data) {
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (Array.isArray(data)) {
          errorMessage = data[0];
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors)
            ? data.non_field_errors[0]
            : data.non_field_errors;
        } else if (data.message) {
          errorMessage = data.message;
        }
      }

      setError(errorMessage);
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
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600">
              {error}
            </div>
          )}

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
      <span className="text-stone-800 flex-1">{choice.text}</span>
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
            <div className="font-medium text-stone-800 mb-3">{choice.text}</div>
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
