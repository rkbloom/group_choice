import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/surveys', label: 'Surveys' },
    { to: '/groups', label: 'Groups' },
    { to: '/themes', label: 'Themes' },
  ];

  if (isAdmin) {
    navLinks.push({ to: '/admin/users', label: 'Users' });
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-moss-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-display font-bold text-sm">GC</span>
                </div>
                <span className="font-display text-xl font-semibold text-stone-800">
                  Group Choice
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-moss-50 text-moss-700'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* User menu */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/profile"
                className="flex items-center space-x-2 text-stone-600 hover:text-stone-800"
              >
                <div className="w-8 h-8 bg-sage-200 rounded-full flex items-center justify-center">
                  <span className="text-sage-700 font-medium text-sm">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
                <span className="text-sm font-medium">{user?.first_name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-stone-500 hover:text-stone-700"
              >
                Sign out
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-stone-600 hover:bg-stone-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                    isActive(link.to)
                      ? 'bg-moss-50 text-moss-700'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2 border-stone-200" />
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-stone-500 hover:bg-stone-100"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-stone-500">
            Group Choice - Making decisions together
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
