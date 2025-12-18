import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { surveysAPI, groupsAPI, themesAPI } from '../services/api';

const SurveyCreatePage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    question: '',
    description: '',
    survey_type: 'ranked_choice',
    distribution_group: '',
    theme: '',
    is_anonymous: false,
    results_public: false,
    deadline: '',
  });

  const [choices, setChoices] = useState([{ text: '', url: '' }, { text: '', url: '' }]);
  const [groups, setGroups] = useState([]);
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      const [groupsRes, themesRes] = await Promise.all([
        groupsAPI.getAll(),
        themesAPI.getAll(),
      ]);

      setGroups(groupsRes.data.results || groupsRes.data || []);
      setThemes(themesRes.data.results || themesRes.data || []);

      if (isEditing) {
        const surveyRes = await surveysAPI.getById(id);
        const survey = surveyRes.data;

        setFormData({
          title: survey.title,
          question: survey.question,
          description: survey.description || '',
          survey_type: survey.survey_type,
          distribution_group: survey.distribution_group || '',
          theme: survey.theme || '',
          is_anonymous: survey.is_anonymous,
          results_public: survey.results_public,
          deadline: survey.deadline ? survey.deadline.slice(0, 16) : '',
        });

        setChoices(survey.choices.map((c) => ({ text: c.text, url: c.url || '' })));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoadingData(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Reset choices when type changes
    if (name === 'survey_type') {
      if (value === 'five_stones') {
        setChoices([{ text: '', url: '' }, { text: '', url: '' }, { text: '', url: '' }]);
      } else {
        setChoices([{ text: '', url: '' }, { text: '', url: '' }]);
      }
    }
  };

  const handleChoiceChange = (index, field, value) => {
    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], [field]: value };
    setChoices(newChoices);
  };

  const addChoice = () => {
    if (formData.survey_type === 'ranked_choice' && choices.length < 10) {
      setChoices([...choices, { text: '', url: '' }]);
    }
  };

  const removeChoice = (index) => {
    if (formData.survey_type === 'ranked_choice' && choices.length > 2) {
      setChoices(choices.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.question.trim()) {
      newErrors.question = 'Question is required';
    }

    const filledChoices = choices.filter((c) => c.text.trim());
    if (formData.survey_type === 'five_stones') {
      if (filledChoices.length !== 3) {
        newErrors.choices = '5 Stones surveys require exactly 3 choices';
      }
    } else {
      if (filledChoices.length < 2) {
        newErrors.choices = 'At least 2 choices are required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        ...formData,
        choices: choices
          .filter((c) => c.text.trim())
          .map((c) => ({ text: c.text, url: c.url || '' })),
        distribution_group: formData.distribution_group || null,
        theme: formData.theme || null,
        deadline: formData.deadline || null,
      };

      if (isEditing) {
        await surveysAPI.update(id, payload);
      } else {
        await surveysAPI.create(payload);
      }

      navigate('/surveys');
    } catch (error) {
      console.error('Failed to save survey:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    }

    setLoading(false);
  };

  if (loadingData) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner w-10 h-10"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-stone-800 mb-8">
        {isEditing ? 'Edit Survey' : 'Create New Survey'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Survey Type */}
        <div>
          <label className="input-label">Survey Type</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() =>
                handleChange({ target: { name: 'survey_type', value: 'ranked_choice' } })
              }
              disabled={isEditing}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                formData.survey_type === 'ranked_choice'
                  ? 'border-sage-400 bg-sage-50'
                  : 'border-stone-200 hover:border-stone-300'
              } ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="font-medium text-stone-800 mb-1">Ranked Choice</div>
              <div className="text-sm text-stone-500">
                Drag options to rank them (2-10 choices)
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                handleChange({ target: { name: 'survey_type', value: 'five_stones' } })
              }
              disabled={isEditing}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                formData.survey_type === 'five_stones'
                  ? 'border-clay-400 bg-clay-50'
                  : 'border-stone-200 hover:border-stone-300'
              } ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="font-medium text-stone-800 mb-1">5 Stones</div>
              <div className="text-sm text-stone-500">
                Distribute 5 points among 3 choices
              </div>
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="input-label">
            Survey Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            className={`input-field ${errors.title ? 'border-red-300' : ''}`}
            placeholder="e.g., Team Lunch Location"
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
        </div>

        {/* Question */}
        <div>
          <label htmlFor="question" className="input-label">
            Question
          </label>
          <textarea
            id="question"
            name="question"
            value={formData.question}
            onChange={handleChange}
            rows={2}
            className={`input-field ${errors.question ? 'border-red-300' : ''}`}
            placeholder="e.g., Where should we go for lunch on Friday?"
          />
          {errors.question && <p className="mt-1 text-sm text-red-500">{errors.question}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="input-label">
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="input-field"
            placeholder="Add any additional context..."
          />
        </div>

        {/* Choices */}
        <div>
          <label className="input-label">
            Choices{' '}
            {formData.survey_type === 'five_stones' ? '(exactly 3)' : '(2-10)'}
          </label>
          <div className="space-y-4">
            {choices.map((choice, index) => (
              <div key={index} className="p-4 bg-stone-50 rounded-lg border border-stone-200">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-stone-400 font-medium w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={choice.text}
                    onChange={(e) => handleChoiceChange(index, 'text', e.target.value)}
                    className="input-field flex-1"
                    placeholder={`Choice ${index + 1}`}
                  />
                  {formData.survey_type === 'ranked_choice' && choices.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeChoice(index)}
                      className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-9">
                  <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <input
                    type="url"
                    value={choice.url}
                    onChange={(e) => handleChoiceChange(index, 'url', e.target.value)}
                    className="input-field flex-1 text-sm"
                    placeholder="Link URL (optional)"
                  />
                </div>
              </div>
            ))}
          </div>
          {formData.survey_type === 'ranked_choice' && choices.length < 10 && (
            <button
              type="button"
              onClick={addChoice}
              className="mt-3 text-moss-600 text-sm font-medium hover:text-moss-700"
            >
              + Add another choice
            </button>
          )}
          {errors.choices && <p className="mt-1 text-sm text-red-500">{errors.choices}</p>}
        </div>

        {/* Distribution Group */}
        <div>
          <label htmlFor="distribution_group" className="input-label">
            Distribution Group (optional)
          </label>
          <select
            id="distribution_group"
            name="distribution_group"
            value={formData.distribution_group}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">None - Share via link only</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({group.member_count} members)
              </option>
            ))}
          </select>
        </div>

        {/* Theme */}
        <div>
          <label htmlFor="theme" className="input-label">
            Theme (optional)
          </label>
          <select
            id="theme"
            name="theme"
            value={formData.theme}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Default Theme</option>
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>

        {/* Deadline */}
        <div>
          <label htmlFor="deadline" className="input-label">
            Deadline (optional)
          </label>
          <input
            id="deadline"
            name="deadline"
            type="datetime-local"
            value={formData.deadline}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_anonymous"
              checked={formData.is_anonymous}
              onChange={handleChange}
              className="w-4 h-4 text-moss-600 rounded border-stone-300 focus:ring-moss-500"
            />
            <span className="ml-3">
              <span className="text-stone-800 font-medium">Anonymous Survey</span>
              <span className="block text-sm text-stone-500">
                Individual responses won't be tracked
              </span>
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="results_public"
              checked={formData.results_public}
              onChange={handleChange}
              className="w-4 h-4 text-moss-600 rounded border-stone-300 focus:ring-moss-500"
            />
            <span className="ml-3">
              <span className="text-stone-800 font-medium">Public Results</span>
              <span className="block text-sm text-stone-500">
                Survey takers can see aggregated results
              </span>
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center"
          >
            {loading ? (
              <div className="spinner w-5 h-5"></div>
            ) : isEditing ? (
              'Save Changes'
            ) : (
              'Create Survey'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SurveyCreatePage;
