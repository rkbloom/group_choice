import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { groupsAPI } from '../services/api';

const GroupDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberUsername, setAddMemberUsername] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '' });

  useEffect(() => {
    loadGroup();
  }, [id]);

  const loadGroup = async () => {
    try {
      const response = await groupsAPI.getById(id);
      setGroup(response.data);
      setEditData({
        name: response.data.name,
        description: response.data.description || '',
      });
    } catch (error) {
      console.error('Failed to load group:', error);
      navigate('/groups');
    }
    setLoading(false);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddingMember(true);
    setError('');

    try {
      const data = addMemberEmail
        ? { email: addMemberEmail }
        : { username: addMemberUsername };

      await groupsAPI.addMember(id, data);
      setAddMemberEmail('');
      setAddMemberUsername('');
      loadGroup();
    } catch (error) {
      console.error('Failed to add member:', error);
      setError(
        error.response?.data?.email?.[0] ||
          error.response?.data?.username?.[0] ||
          error.response?.data?.error ||
          'Failed to add member'
      );
    }
    setAddingMember(false);
  };

  const handleRemoveMember = async (email) => {
    try {
      await groupsAPI.removeMember(id, email);
      loadGroup();
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await groupsAPI.update(id, editData);
      setEditing(false);
      loadGroup();
    } catch (error) {
      console.error('Failed to update group:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await groupsAPI.delete(id);
      navigate('/groups');
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner w-10 h-10"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <Link
          to="/groups"
          className="text-moss-600 hover:text-moss-700 text-sm mb-4 inline-flex items-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Groups
        </Link>

        {editing ? (
          <form onSubmit={handleUpdate} className="card p-6">
            <div className="space-y-4">
              <div>
                <label className="input-label">Group Name</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="input-label">Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="input-field"
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-stone-800">
                {group.name}
              </h1>
              {group.description && (
                <p className="text-stone-600 mt-1">{group.description}</p>
              )}
              <p className="text-sm text-stone-500 mt-2">
                {group.member_count} member{group.member_count !== 1 ? 's' : ''} ·
                Created {new Date(group.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditing(true)} className="btn-secondary">
                Edit
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Member */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold text-stone-800 mb-4">
          Add Member
        </h2>

        <form onSubmit={handleAddMember} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Email Address</label>
              <input
                type="email"
                value={addMemberEmail}
                onChange={(e) => {
                  setAddMemberEmail(e.target.value);
                  setAddMemberUsername('');
                }}
                className="input-field"
                placeholder="member@example.com"
              />
            </div>
            <div>
              <label className="input-label">Or Username</label>
              <input
                type="text"
                value={addMemberUsername}
                onChange={(e) => {
                  setAddMemberUsername(e.target.value);
                  setAddMemberEmail('');
                }}
                className="input-field"
                placeholder="username"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={addingMember || (!addMemberEmail && !addMemberUsername)}
            className="btn-primary flex items-center justify-center"
          >
            {addingMember ? (
              <div className="spinner w-5 h-5"></div>
            ) : (
              'Add Member'
            )}
          </button>

          <p className="text-sm text-stone-500">
            If the email isn't registered, they'll receive an invitation to create an account.
          </p>
        </form>
      </div>

      {/* Members List */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold text-stone-800 mb-4">
          Members ({group.member_count})
        </h2>

        {group.members && group.members.length > 0 ? (
          <div className="space-y-3">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-stone-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sage-200 rounded-full flex items-center justify-center">
                    {member.user_name ? (
                      <span className="text-sage-700 font-medium text-sm">
                        {member.user_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </span>
                    ) : (
                      <svg
                        className="w-5 h-5 text-sage-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-stone-800">
                      {member.user_name || member.email}
                    </div>
                    {member.user_name && (
                      <div className="text-sm text-stone-500">{member.email}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {member.is_registered ? (
                    <span className="badge badge-success">Registered</span>
                  ) : (
                    <span className="badge badge-warning">Invited</span>
                  )}
                  <button
                    onClick={() => handleRemoveMember(member.email)}
                    className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-500 text-center py-4">
            No members yet. Add members above.
          </p>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-slide-up">
            <h3 className="font-display text-xl font-semibold text-stone-800 mb-2">
              Delete Group?
            </h3>
            <p className="text-stone-600 mb-6">
              This will remove all members from the group. Surveys using this group
              will no longer be distributed to these members.
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
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetailPage;
