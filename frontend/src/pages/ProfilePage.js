import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    username: user?.username || '',
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    const result = await updateUser(profileData);

    if (result.success) {
      setProfileSuccess('Profile updated successfully!');
    } else {
      setProfileError(
        typeof result.error === 'string'
          ? result.error
          : Object.values(result.error).flat().join(' ')
      );
    }

    setSavingProfile(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.new_password !== passwordData.new_password_confirm) {
      setPasswordError('New passwords do not match');
      setSavingPassword(false);
      return;
    }

    try {
      await authAPI.changePassword(passwordData);
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    } catch (error) {
      setPasswordError(
        error.response?.data?.old_password?.[0] ||
          error.response?.data?.new_password?.[0] ||
          'Failed to change password'
      );
    }

    setSavingPassword(false);
  };

  const getPermissionBadge = () => {
    switch (user?.permission_level) {
      case 'super':
        return <span className="badge bg-purple-100 text-purple-700">Super Admin</span>;
      case 'admin':
        return <span className="badge bg-blue-100 text-blue-700">Admin</span>;
      default:
        return <span className="badge badge-info">User</span>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold text-stone-800">Profile</h1>
        <p className="text-stone-600 mt-1">Manage your account settings</p>
      </div>

      {/* Account Info Card */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-sage-200 rounded-full flex items-center justify-center">
            <span className="text-sage-700 font-display font-bold text-xl">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </span>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-stone-800">
              {user?.full_name}
            </h2>
            <p className="text-stone-500">{user?.email}</p>
            <div className="mt-1">{getPermissionBadge()}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-stone-500">Username</span>
            <p className="font-medium text-stone-800">@{user?.username}</p>
          </div>
          <div>
            <span className="text-stone-500">Member since</span>
            <p className="font-medium text-stone-800">
              {new Date(user?.date_joined).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold text-stone-800 mb-4">
          Edit Profile
        </h2>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {profileError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="p-3 bg-moss-50 border border-moss-100 rounded-xl text-moss-600 text-sm">
              {profileSuccess}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">First Name</label>
              <input
                type="text"
                value={profileData.first_name}
                onChange={(e) =>
                  setProfileData((prev) => ({ ...prev, first_name: e.target.value }))
                }
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="input-label">Last Name</label>
              <input
                type="text"
                value={profileData.last_name}
                onChange={(e) =>
                  setProfileData((prev) => ({ ...prev, last_name: e.target.value }))
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
              value={profileData.username}
              onChange={(e) =>
                setProfileData((prev) => ({ ...prev, username: e.target.value }))
              }
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="input-label">Email</label>
            <input
              type="email"
              value={user?.email}
              className="input-field bg-stone-50"
              disabled
            />
            <p className="text-xs text-stone-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="btn-primary flex items-center justify-center"
          >
            {savingProfile ? (
              <div className="spinner w-5 h-5"></div>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold text-stone-800 mb-4">
          Change Password
        </h2>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="p-3 bg-moss-50 border border-moss-100 rounded-xl text-moss-600 text-sm">
              {passwordSuccess}
            </div>
          )}

          <div>
            <label className="input-label">Current Password</label>
            <input
              type="password"
              value={passwordData.old_password}
              onChange={(e) =>
                setPasswordData((prev) => ({ ...prev, old_password: e.target.value }))
              }
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="input-label">New Password</label>
            <input
              type="password"
              value={passwordData.new_password}
              onChange={(e) =>
                setPasswordData((prev) => ({ ...prev, new_password: e.target.value }))
              }
              className="input-field"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="input-label">Confirm New Password</label>
            <input
              type="password"
              value={passwordData.new_password_confirm}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  new_password_confirm: e.target.value,
                }))
              }
              className="input-field"
              required
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="btn-primary flex items-center justify-center"
          >
            {savingPassword ? (
              <div className="spinner w-5 h-5"></div>
            ) : (
              'Change Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
