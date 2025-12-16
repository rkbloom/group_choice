import React, { useState, useEffect } from 'react';
import { themesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ThemeListPage = () => {
  const { isAdmin } = useAuth();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    primary_color: '#4A5568',
    secondary_color: '#718096',
    accent_color: '#48BB78',
    background_color: '#F7FAFC',
    text_color: '#2D3748',
    font_family: 'Inter, system-ui, sans-serif',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      const response = await themesAPI.getAll();
      setThemes(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to load themes:', error);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingTheme) {
        await themesAPI.update(editingTheme.id, formData);
      } else {
        await themesAPI.create(formData);
      }
      setShowCreateModal(false);
      setEditingTheme(null);
      resetForm();
      loadThemes();
    } catch (error) {
      console.error('Failed to save theme:', error);
      setError(error.response?.data?.name?.[0] || 'Failed to save theme');
    }
    setSaving(false);
  };

  const handleEdit = (theme) => {
    setEditingTheme(theme);
    setFormData({
      name: theme.name,
      description: theme.description || '',
      primary_color: theme.primary_color,
      secondary_color: theme.secondary_color,
      accent_color: theme.accent_color,
      background_color: theme.background_color,
      text_color: theme.text_color,
      font_family: theme.font_family,
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      primary_color: '#4A5568',
      secondary_color: '#718096',
      accent_color: '#48BB78',
      background_color: '#F7FAFC',
      text_color: '#2D3748',
      font_family: 'Inter, system-ui, sans-serif',
    });
  };

  const handleSetDefault = async (themeId) => {
    try {
      await themesAPI.setDefault(themeId);
      loadThemes();
    } catch (error) {
      console.error('Failed to set default theme:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-stone-800">Themes</h1>
          <p className="text-stone-600 mt-1">
            Customize the look and feel of your surveys
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              resetForm();
              setEditingTheme(null);
              setShowCreateModal(true);
            }}
            className="btn-primary"
          >
            Create New Theme
          </button>
        )}
      </div>

      {/* Themes Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner w-10 h-10"></div>
        </div>
      ) : themes.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
            <div key={theme.id} className="card overflow-hidden">
              {/* Preview */}
              <div
                className="h-32 p-4"
                style={{ backgroundColor: theme.background_color }}
              >
                <div className="flex gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: theme.primary_color }}
                  />
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: theme.secondary_color }}
                  />
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: theme.accent_color }}
                  />
                </div>
                <div
                  className="text-lg font-semibold"
                  style={{ color: theme.text_color, fontFamily: theme.font_family }}
                >
                  Sample Text
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-stone-800">{theme.name}</h3>
                  {theme.is_default && (
                    <span className="badge badge-success">Default</span>
                  )}
                </div>
                {theme.description && (
                  <p className="text-sm text-stone-500 mb-3">{theme.description}</p>
                )}

                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(theme)}
                      className="btn-ghost text-sm flex-1"
                    >
                      Edit
                    </button>
                    {!theme.is_default && (
                      <button
                        onClick={() => handleSetDefault(theme.id)}
                        className="btn-ghost text-sm flex-1"
                      >
                        Set Default
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🎨</div>
          <h3 className="font-display text-xl font-semibold text-stone-800 mb-2">
            No themes yet
          </h3>
          <p className="text-stone-500 mb-6">
            {isAdmin
              ? 'Create your first theme to customize survey appearances.'
              : 'No themes are available yet.'}
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-block"
            >
              Create Theme
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full my-8 animate-slide-up">
            <h2 className="font-display text-xl font-semibold text-stone-800 mb-4">
              {editingTheme ? 'Edit Theme' : 'Create Theme'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="input-label">Theme Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="input-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="primary_color"
                      value={formData.primary_color}
                      onChange={handleChange}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      name="primary_color"
                      value={formData.primary_color}
                      onChange={handleChange}
                      className="input-field flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Secondary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="secondary_color"
                      value={formData.secondary_color}
                      onChange={handleChange}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      name="secondary_color"
                      value={formData.secondary_color}
                      onChange={handleChange}
                      className="input-field flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Accent Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="accent_color"
                      value={formData.accent_color}
                      onChange={handleChange}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      name="accent_color"
                      value={formData.accent_color}
                      onChange={handleChange}
                      className="input-field flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Background</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="background_color"
                      value={formData.background_color}
                      onChange={handleChange}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      name="background_color"
                      value={formData.background_color}
                      onChange={handleChange}
                      className="input-field flex-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="input-label">Font Family</label>
                <select
                  name="font_family"
                  value={formData.font_family}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="Inter, system-ui, sans-serif">Inter (Default)</option>
                  <option value="Georgia, serif">Georgia (Serif)</option>
                  <option value="system-ui, sans-serif">System UI</option>
                  <option value="Courier New, monospace">Courier (Mono)</option>
                </select>
              </div>

              {/* Preview */}
              <div>
                <label className="input-label">Preview</label>
                <div
                  className="p-4 rounded-xl border"
                  style={{ backgroundColor: formData.background_color }}
                >
                  <div className="flex gap-2 mb-3">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: formData.primary_color }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: formData.secondary_color }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: formData.accent_color }}
                    />
                  </div>
                  <p
                    style={{
                      color: formData.text_color,
                      fontFamily: formData.font_family,
                    }}
                  >
                    This is how your theme will look
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTheme(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  {saving ? <div className="spinner w-5 h-5"></div> : 'Save Theme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeListPage;
