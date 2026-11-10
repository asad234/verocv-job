"use client"
import React from 'react';

const CVLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="border-2 border-red-500 px-6 py-2">
              <span className="text-red-500 font-bold text-lg">OUR LOGO</span>
            </div>
            <button className="bg-blue-400 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-500 transition-colors">
              Sign-in
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            CV Should be Easy
          </h1>

          <div className="space-y-2 mb-12">
            <p className="text-lg text-gray-700">
              We believe creating a <span className="font-bold">great</span> job-specific <span className="font-bold">CV should be quick</span>
            </p>
            <p className="text-lg text-gray-700">
              A cover letter should be written in <span className="font-bold">no time</span>
            </p>
            <p className="text-lg text-gray-700">
              Applying for work should only take a moment
            </p>
          </div>

          <button className="bg-blue-400 text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-blue-500 transition-colors mb-12">
            Start Now – It&apos;s free
          </button>

          {/* Arrow and encouragement text */}
          <div className="flex flex-col items-center mb-16">
            <div className="text-blue-400 text-4xl mb-2">↓</div>
            <div className="border border-gray-300 rounded-full px-6 py-2">
              <span className="text-gray-600 text-sm">If you are still not convinced read more below</span>
            </div>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            You are 80% more likely to get hired if you tailor your CV and cover letter to the job.
          </h2>
          <p className="text-lg text-gray-700">
            This process manually can take hours; we help you do this in just a few clicks
          </p>
        </div>

        {/* Company Logos Section */}
        <div className="text-center mb-16">
          <p className="text-gray-400 text-sm uppercase tracking-wider mb-8">
            GET HIRED BY TOP COMPANIES WORLDWIDE
          </p>

          <div className="flex justify-center items-center space-x-8 flex-wrap gap-6">
            {/* Coinbase */}
            <div className="flex items-center">
              <svg className="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#0052FF" />
                <path d="M12 6.25c-3.175 0-5.75 2.575-5.75 5.75s2.575 5.75 5.75 5.75 5.75-2.575 5.75-5.75S15.175 6.25 12 6.25zm0 2.5c1.795 0 3.25 1.455 3.25 3.25S13.795 15.25 12 15.25 8.75 13.795 8.75 12 10.205 8.75 12 8.75z" fill="white" />
              </svg>
              <span className="text-gray-600 font-semibold text-lg">Coinbase</span>
            </div>

            {/* Spotify */}
            <div className="flex items-center">
              <svg className="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="#1DB954">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              <span className="text-gray-600 font-semibold text-lg">Spotify</span>
            </div>

            {/* Microsoft */}
            <div className="flex items-center">
              <svg className="w-8 h-8 mr-2" viewBox="0 0 24 24">
                <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
                <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
                <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
              </svg>
              <span className="text-gray-600 font-semibold text-lg">Microsoft</span>
            </div>

            {/* Meta */}
            <div className="flex items-center">
              <svg className="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="#1877F2">
                <circle cx="12" cy="12" r="12" fill="#1877F2" />
                <path d="M13.5 12H16l.5-3h-3V7.5c0-1 .5-2 2-2H17V3s-1.5-.25-3-.25c-3 0-5 1.75-5 5V9H6v3h3v9h3v-9z" fill="white" />
              </svg>
              <span className="text-gray-600 font-semibold text-lg">Meta</span>
            </div>

            {/* SpaceX */}
            <div className="flex items-center">
              <svg className="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" fill="#005288" />
                <path d="M2 12h4l3-3v6l-3-3H2zm6 0h4l3-3v6l-3-3H8zm6 0h4l3-3v6l-3-3h-4z" fill="white" />
              </svg>
              <span className="text-gray-600 font-semibold text-lg tracking-wider">SPACEX</span>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            We help you succeed
          </h3>
          <button className="bg-blue-400 text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-blue-500 transition-colors">
            Start Now – It&apos;s free
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-6 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Navigation Links */}
            <nav className="flex flex-wrap justify-center md:justify-start space-x-6 text-sm">
              <a href="#" className="hover:text-blue-400 transition-colors">Kontakt</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Om oss</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Användarvillkor</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Integritetspolicy</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Tillgänglighet</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Cookiepolicy</a>
            </nav>

            {/* Copyright */}
            <div className="text-sm text-gray-400">
              <span>© 2025</span>
              <span className="ml-4">Alla rättigheter förbehållna.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CVLandingPage;
