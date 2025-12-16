import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { groupsAPI } from '../services/api';

const GroupListPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await groupsAPI.getAll();
      setGroups(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      await groupsAPI.create(newGroup);
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '' });
      loadGroups();
    } catch (error) {
      console.error('Failed to create group:', error);
      setError(error.response?.data?.name?.[0] || 'Failed to create group');
    }
    setCreating(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-stone-800">
            Distribution Groups
          </h1>
          <p className="text-stone-600 mt-1">
            Create reusable groups to easily share surveys
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Create New Group
        </button>
      </div>

      {/* Groups List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner w-10 h-10"></div>
        </div>
      ) : groups.length > 0 ? (
        <div className="grid gap-4">
          {groups.map((group) => (
            <Link
              key={group.id}
              to={`/groups/${group.id}`}
              className="card p-5 flex items-center justify-between hover:border-moss-200"
            >
              <div>
                <h3 className="font-medium text-stone-800 text-lg">
                  {group.name}
                </h3>
                {group.description && (
                  <p className="text-sm text-stone-500 mt-1">
                    {group.description}
                  </p>
                )}
                <p className="text-sm text-stone-400 mt-2">
                  {group.member_count} member{group.member_count !== 1 ? 's' : ''} ·{' '}
                  Created {new Date(group.created_at).toLocaleDateString()}
                </p>
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="font-display text-xl font-semibold text-stone-800 mb-2">
            No groups yet
          </h3>
          <p className="text-stone-500 mb-6">
            Create distribution groups to easily share surveys with the same people.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary inline-block"
          >
            Create Your First Group
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-slide-up">
            <h2 className="font-display text-xl font-semibold text-stone-800 mb-4">
              Create Distribution Group
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="input-label">
                  Group Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={newGroup.name}
                  onChange={(e) =>
                    setNewGroup((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="input-field"
                  placeholder="e.g., Marketing Team"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="input-label">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={newGroup.description}
                  onChange={(e) =>
                    setNewGroup((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="input-field"
                  rows={3}
                  placeholder="Describe this group..."
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  {creating ? (
                    <div className="spinner w-5 h-5"></div>
                  ) : (
                    'Create Group'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupListPage;
