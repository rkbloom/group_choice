import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-stone-50 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="organic-shape w-96 h-96 bg-moss-300 top-0 right-0 transform translate-x-1/3 -translate-y-1/3"></div>
      <div className="organic-shape w-64 h-64 bg-clay-300 bottom-0 left-0 transform -translate-x-1/4 translate-y-1/4"></div>
      <div className="organic-shape w-48 h-48 bg-sage-300 top-1/2 left-1/4"></div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-moss-500 rounded-full flex items-center justify-center">
              <span className="text-white font-display font-bold">GC</span>
            </div>
            <span className="font-display text-2xl font-semibold text-stone-800">
              Group Choice
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="btn-ghost">
              Sign in
            </Link>
            <Link to="/register" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-5xl md:text-6xl font-bold text-stone-800 mb-6 animate-fade-in">
            Decide Together,
            <span className="block text-moss-600">Beautifully</span>
          </h1>

          <p className="text-xl text-stone-600 mb-10 animate-slide-up text-balance">
            Group Choice helps friends, families, teams, and communities make
            collective decisions with ease. Create surveys, gather input, and
            find consensus naturally.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link to="/register" className="btn-primary text-lg px-8 py-4">
              Create Your First Survey
            </Link>
            <Link to="/login" className="btn-secondary text-lg px-8 py-4">
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-32 grid md:grid-cols-2 gap-8">
          {/* Ranked Choice */}
          <div className="card-organic">
            <div className="w-14 h-14 bg-sage-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <h3 className="font-display text-2xl font-semibold text-stone-800 mb-3">
              Ranked Choice Surveys
            </h3>
            <p className="text-stone-600 mb-4">
              Let your group rank up to 10 options by dragging them into their
              preferred order. Results are calculated using the fair Borda count
              method.
            </p>
            <ul className="space-y-2 text-sm text-stone-500">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-sage-400 rounded-full mr-2"></span>
                Drag-and-drop ranking
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-sage-400 rounded-full mr-2"></span>
                2-10 options supported
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-sage-400 rounded-full mr-2"></span>
                Fair Borda count results
              </li>
            </ul>
          </div>

          {/* 5 Stones */}
          <div className="card-organic">
            <div className="w-14 h-14 bg-clay-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-clay-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-display text-2xl font-semibold text-stone-800 mb-3">
              5 Stones Allocation
            </h3>
            <p className="text-stone-600 mb-4">
              Each participant has 5 "stones" to distribute among 3 choices
              however they wish. Perfect for gauging intensity of preferences.
            </p>
            <ul className="space-y-2 text-sm text-stone-500">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-clay-400 rounded-full mr-2"></span>
                5 points to distribute
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-clay-400 rounded-full mr-2"></span>
                Exactly 3 choices
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-clay-400 rounded-full mr-2"></span>
                Shows preference strength
              </li>
            </ul>
          </div>
        </div>

        {/* Additional Features */}
        <div className="mt-20 text-center">
          <h2 className="font-display text-3xl font-semibold text-stone-800 mb-12">
            Everything you need for group decisions
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '👥',
                title: 'Distribution Groups',
                desc: 'Create reusable groups for recurring surveys'
              },
              {
                icon: '🎨',
                title: 'Custom Themes',
                desc: 'Brand your surveys with colors and fonts'
              },
              {
                icon: '📊',
                title: 'Real-time Results',
                desc: 'Watch responses come in as they arrive'
              },
              {
                icon: '🔒',
                title: 'Anonymous Option',
                desc: 'Let people respond without tracking'
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white border border-stone-100">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-medium text-stone-800 mb-1">{feature.title}</h3>
                <p className="text-sm text-stone-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-stone-200 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <p className="text-center text-stone-500">
            Group Choice - Making collective decisions simple and beautiful
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
