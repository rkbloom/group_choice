import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="organic-shape w-64 h-64 bg-moss-200 top-0 left-0 transform -translate-x-1/2 -translate-y-1/2"></div>
      <div className="organic-shape w-48 h-48 bg-clay-200 bottom-0 right-0 transform translate-x-1/4 translate-y-1/4"></div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-moss-500 rounded-full flex items-center justify-center">
              <span className="text-white font-display font-bold text-lg">GC</span>
            </div>
          </Link>
          <h2 className="mt-6 font-display text-3xl font-bold text-stone-800">
            Welcome back
          </h2>
          <p className="mt-2 text-stone-600">
            Sign in to continue to Group Choice
          </p>
        </div>

        {/* Form */}
        <div className="card-organic">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="input-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center"
            >
              {loading ? (
                <div className="spinner w-5 h-5"></div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-stone-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-moss-600 font-medium hover:text-moss-700">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
