import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const prefillEmail = searchParams.get('email') || '';

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: prefillEmail,
    username: '',
    password: '',
    password_confirm: '',
  });

  const [errors, setErrors] = useState({});
  const [emailStatus, setEmailStatus] = useState({ checking: false, available: null });
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null });
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Debounced email check
  const checkEmail = useCallback(async (email) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailStatus({ checking: false, available: null });
      return;
    }

    setEmailStatus({ checking: true, available: null });
    try {
      const response = await authAPI.checkEmail(email);
      setEmailStatus({ checking: false, available: response.data.available });
    } catch (err) {
      setEmailStatus({ checking: false, available: null });
    }
  }, []);

  // Debounced username check
  const checkUsername = useCallback(async (username) => {
    if (!username || username.length < 3) {
      setUsernameStatus({ checking: false, available: null });
      return;
    }

    setUsernameStatus({ checking: true, available: null });
    try {
      const response = await authAPI.checkUsername(username);
      setUsernameStatus({ checking: false, available: response.data.available });
    } catch (err) {
      setUsernameStatus({ checking: false, available: null });
    }
  }, []);

  // Debounce effect for email
  useEffect(() => {
    const timer = setTimeout(() => {
      checkEmail(formData.email);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.email, checkEmail]);

  // Debounce effect for username
  useEffect(() => {
    const timer = setTimeout(() => {
      checkUsername(formData.username);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.username, checkUsername]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    } else if (emailStatus.available === false) {
      newErrors.email = 'This email is already taken';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (usernameStatus.available === false) {
      newErrors.username = 'This username is already taken';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    const result = await register(formData);

    if (result.success) {
      navigate('/dashboard');
    } else {
      if (typeof result.error === 'object') {
        setErrors(result.error);
      }
    }

    setLoading(false);
  };

  const StatusIcon = ({ status }) => {
    if (status.checking) {
      return <div className="spinner w-4 h-4"></div>;
    }
    if (status.available === true) {
      return (
        <svg className="w-5 h-5 text-moss-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (status.available === false) {
      return (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center relative overflow-hidden py-12">
      {/* Decorative shapes */}
      <div className="organic-shape w-64 h-64 bg-sage-200 top-0 right-0 transform translate-x-1/3 -translate-y-1/3"></div>
      <div className="organic-shape w-48 h-48 bg-moss-200 bottom-0 left-0 transform -translate-x-1/4 translate-y-1/4"></div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-moss-500 rounded-full flex items-center justify-center">
              <span className="text-white font-display font-bold text-lg">GC</span>
            </div>
          </Link>
          <h2 className="mt-6 font-display text-3xl font-bold text-stone-800">
            Create your account
          </h2>
          <p className="mt-2 text-stone-600">
            Join Group Choice and start making decisions together
          </p>
        </div>

        {/* Form */}
        <div className="card-organic">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="input-label">
                  First name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`input-field ${errors.first_name ? 'border-red-300' : ''}`}
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>
                )}
              </div>
              <div>
                <label htmlFor="last_name" className="input-label">
                  Last name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`input-field ${errors.last_name ? 'border-red-300' : ''}`}
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="input-label">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-field pr-10 ${
                    errors.email || emailStatus.available === false
                      ? 'border-red-300'
                      : emailStatus.available === true
                      ? 'border-moss-300'
                      : ''
                  }`}
                  placeholder="you@example.com"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <StatusIcon status={emailStatus} />
                </div>
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
              {emailStatus.available === false && !errors.email && (
                <p className="mt-1 text-sm text-red-500">This email is already registered</p>
              )}
            </div>

            <div>
              <label htmlFor="username" className="input-label">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className={`input-field pr-10 ${
                    errors.username || usernameStatus.available === false
                      ? 'border-red-300'
                      : usernameStatus.available === true
                      ? 'border-moss-300'
                      : ''
                  }`}
                  placeholder="Choose a username"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <StatusIcon status={usernameStatus} />
                </div>
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-500">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`input-field ${errors.password ? 'border-red-300' : ''}`}
                placeholder="At least 8 characters"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="password_confirm" className="input-label">
                Confirm password
              </label>
              <input
                id="password_confirm"
                name="password_confirm"
                type="password"
                required
                value={formData.password_confirm}
                onChange={handleChange}
                className={`input-field ${errors.password_confirm ? 'border-red-300' : ''}`}
                placeholder="Confirm your password"
              />
              {errors.password_confirm && (
                <p className="mt-1 text-sm text-red-500">{errors.password_confirm}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center"
            >
              {loading ? (
                <div className="spinner w-5 h-5"></div>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-stone-600">
              Already have an account?{' '}
              <Link to="/login" className="text-moss-600 font-medium hover:text-moss-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
