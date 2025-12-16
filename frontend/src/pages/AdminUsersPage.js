import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminUsersPage = () => {
  const { isSuper } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, [search, filter]);

  const loadUsers = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filter) params.permission_level = filter;

      const response = await usersAPI.getAll(params);
      setUsers(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await usersAPI.update(editingUser.id, {
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        username: editingUser.username,
        email: editingUser.email,
        permission_level: editingUser.permission_level,
        is_active: editingUser.is_active,
      });
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      setError(
        error.response?.data?.email?.[0] ||
          error.response?.data?.username?.[0] ||
          'Failed to update user'
      );
    }
    setSaving(false);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await usersAPI.delete(userId);
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const getPermissionBadge = (level) => {
    switch (level) {
      case 'super':
        return <span className="badge bg-purple-100 text-purple-700">Super</span>;
      case 'admin':
        return <span className="badge bg-blue-100 text-blue-700">Admin</span>;
      default:
        return <span className="badge badge-info">User</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-stone-800">
          User Management
        </h1>
        <p className="text-stone-600 mt-1">View and manage user accounts</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search users..."
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

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
          <option value="super">Super Admins</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner w-10 h-10"></div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left p-4 font-medium text-stone-600">User</th>
                  <th className="text-left p-4 font-medium text-stone-600">Email</th>
                  <th className="text-left p-4 font-medium text-stone-600">Role</th>
                  <th className="text-left p-4 font-medium text-stone-600">Status</th>
                  <th className="text-left p-4 font-medium text-stone-600">Joined</th>
                  <th className="text-right p-4 font-medium text-stone-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-stone-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sage-200 rounded-full flex items-center justify-center">
                          <span className="text-sage-700 font-medium text-sm">
                            {user.first_name?.[0]}
                            {user.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-stone-800">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-stone-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-stone-600">{user.email}</td>
                    <td className="p-4">{getPermissionBadge(user.permission_level)}</td>
                    <td className="p-4">
                      {user.is_active ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge bg-stone-100 text-stone-600">Inactive</span>
                      )}
                    </td>
                    <td className="p-4 text-stone-500 text-sm">
                      {new Date(user.date_joined).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setEditingUser({ ...user })}
                        className="btn-ghost text-sm"
                      >
                        Edit
                      </button>
                      {isSuper && user.permission_level !== 'super' && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="btn-ghost text-sm text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-stone-500">No users found</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-slide-up">
            <h2 className="font-display text-xl font-semibold text-stone-800 mb-4">
              Edit User
            </h2>

            <form onSubmit={handleUpdate} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">First Name</label>
                  <input
                    type="text"
                    value={editingUser.first_name}
                    onChange={(e) =>
                      setEditingUser((prev) => ({
                        ...prev,
                        first_name: e.target.value,
                      }))
                    }
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Last Name</label>
                  <input
                    type="text"
                    value={editingUser.last_name}
                    onChange={(e) =>
                      setEditingUser((prev) => ({
                        ...prev,
                        last_name: e.target.value,
                      }))
                    }
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Username</label>
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={(e) =>
                    setEditingUser((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="input-label">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="input-label">Permission Level</label>
                <select
                  value={editingUser.permission_level}
                  onChange={(e) =>
                    setEditingUser((prev) => ({
                      ...prev,
                      permission_level: e.target.value,
                    }))
                  }
                  className="input-field"
                  disabled={!isSuper}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  {isSuper && <option value="super">Super Admin</option>}
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingUser.is_active}
                    onChange={(e) =>
                      setEditingUser((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-moss-600 rounded border-stone-300 focus:ring-moss-500"
                  />
                  <span className="ml-2 text-stone-700">Active account</span>
                </label>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  {saving ? <div className="spinner w-5 h-5"></div> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
