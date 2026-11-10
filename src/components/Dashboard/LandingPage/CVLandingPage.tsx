"use client"
import React, { useState, useEffect } from 'react';

const RefinedCVLandingPage: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/3 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Mouse Follower Effect */}
      <div
        className="fixed w-6 h-6 bg-blue-400/40 rounded-full pointer-events-none blur-sm transition-all duration-200 z-50"
        style={{
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
        }}
      ></div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-md bg-white/80 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="group cursor-pointer">
              <div className="relative border-2 border-blue-500 px-8 py-3 rounded-lg backdrop-blur-sm bg-blue-50/50 hover:bg-blue-100/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-200/50">
                <span className="text-blue-700 font-bold text-xl tracking-wider group-hover:text-blue-900 transition-colors duration-300">OUR LOGO</span>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-200/0 via-blue-200/30 to-blue-200/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
            <button className="relative group px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium overflow-hidden hover:shadow-lg hover:shadow-blue-300/40 transition-all duration-300 hover:scale-105">
              <span className="relative z-10">Sign-in</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className={`text-center mb-24 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="mb-12">
            <h1 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-blue-700 to-blue-600 mb-8 leading-tight">
              CV Should be
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 animate-pulse">
                Easy
              </span>
            </h1>
          </div>

          <div className="backdrop-blur-md bg-white/70 rounded-3xl p-12 border border-blue-200 shadow-2xl shadow-blue-100/50 mb-16 hover:bg-white/80 transition-all duration-500 group">
            <div className="space-y-4 mb-12">
              <p className="text-xl md:text-2xl text-blue-800 leading-relaxed">
                We believe creating a <span className="font-bold text-blue-600 group-hover:text-blue-900 transition-colors duration-300">great</span> job-specific <span className="font-bold text-blue-700 group-hover:text-blue-900 transition-colors duration-300">CV should be quick</span>
              </p>
              <p className="text-xl md:text-2xl text-blue-800 leading-relaxed">
                A cover letter should be written in <span className="font-bold text-blue-600 group-hover:text-blue-900 transition-colors duration-300">no time</span>
              </p>
              <p className="text-xl md:text-2xl text-blue-800 leading-relaxed">
                Applying for work should only take a moment
              </p>
            </div>

            <button className="group relative px-12 py-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xl font-bold overflow-hidden transform hover:scale-110 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-300/40">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center">
                Start Now – It&apos;s free
                <svg className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </div>

          {/* Animated Arrow Section */}
          <div className="flex flex-col items-center mb-20">
            <div className="text-blue-500 text-6xl mb-6 animate-bounce">↓</div>
            <div className="backdrop-blur-md bg-white/60 border border-blue-200 rounded-full px-8 py-4 hover:bg-white/80 transition-all duration-300 hover:scale-105">
              <span className="text-blue-700 text-lg">If you are still not convinced read more below</span>
            </div>
          </div>
        </div>

        {/* Value Proposition */}
        <div className={`text-center mb-24 transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="backdrop-blur-md bg-white/70 rounded-3xl p-12 border border-blue-200 shadow-2xl shadow-blue-100/50 hover:bg-white/80 transition-all duration-500">
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-blue-700 mb-8 leading-tight">
              You are <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">80% more likely</span> to get hired if you tailor your CV and cover letter to the job.
            </h2>
            <p className="text-xl md:text-2xl text-blue-800">
              This process manually can take <span className="text-blue-600 font-bold">hours</span>; we help you do this in <span className="text-blue-500 font-bold">just a few clicks</span>
            </p>
          </div>
        </div>

        {/* Company Logos Section */}
        <div className={`text-center mb-24 transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <p className="text-blue-600 text-sm uppercase tracking-wider mb-12 font-medium">
            GET HIRED BY TOP COMPANIES WORLDWIDE
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 items-center">
            {/* Coinbase */}
            <div className="group flex flex-col items-center backdrop-blur-md bg-white/60 rounded-2xl p-6 border border-blue-100 hover:bg-white/80 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-200/40">
              <svg className="w-12 h-12 mb-4 group-hover:scale-125 transition-transform duration-300" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="url(#coinbaseGradient)" />
                <path d="M12 6.25c-3.175 0-5.75 2.575-5.75 5.75s2.575 5.75 5.75 5.75 5.75-2.575 5.75-5.75S15.175 6.25 12 6.25zm0 2.5c1.795 0 3.25 1.455 3.25 3.25S13.795 15.25 12 15.25 8.75 13.795 8.75 12 10.205 8.75 12 8.75z" fill="white" />
                <defs>
                  <linearGradient id="coinbaseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e40af" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-blue-700 font-semibold text-lg group-hover:text-blue-900 transition-colors duration-300">Coinbase</span>
            </div>

            {/* Spotify */}
            <div className="group flex flex-col items-center backdrop-blur-md bg-white/60 rounded-2xl p-6 border border-blue-100 hover:bg-white/80 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-200/40">
              <svg className="w-12 h-12 mb-4 group-hover:scale-125 transition-transform duration-300" viewBox="0 0 24 24" fill="#2563eb">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              <span className="text-blue-700 font-semibold text-lg group-hover:text-blue-900 transition-colors duration-300">Spotify</span>
            </div>

            {/* Microsoft */}
            <div className="group flex flex-col items-center backdrop-blur-md bg-white/60 rounded-2xl p-6 border border-blue-100 hover:bg-white/80 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-200/40">
              <svg className="w-12 h-12 mb-4 group-hover:scale-125 transition-transform duration-300" viewBox="0 0 24 24">
                <rect x="1" y="1" width="10" height="10" fill="#1e40af" />
                <rect x="13" y="1" width="10" height="10" fill="#3b82f6" />
                <rect x="1" y="13" width="10" height="10" fill="#60a5fa" />
                <rect x="13" y="13" width="10" height="10" fill="#93c5fd" />
              </svg>
              <span className="text-blue-700 font-semibold text-lg group-hover:text-blue-900 transition-colors duration-300">Microsoft</span>
            </div>

            {/* Meta */}
            <div className="group flex flex-col items-center backdrop-blur-md bg-white/60 rounded-2xl p-6 border border-blue-100 hover:bg-white/80 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-200/40">
              <svg className="w-12 h-12 mb-4 group-hover:scale-125 transition-transform duration-300" viewBox="0 0 24 24" fill="#1e40af">
                <circle cx="12" cy="12" r="12" fill="url(#metaGradient)" />
                <path d="M13.5 12H16l.5-3h-3V7.5c0-1 .5-2 2-2H17V3s-1.5-.25-3-.25c-3 0-5 1.75-5 5V9H6v3h3v9h3v-9z" fill="white" />
                <defs>
                  <linearGradient id="metaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e40af" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-blue-700 font-semibold text-lg group-hover:text-blue-900 transition-colors duration-300">Meta</span>
            </div>

            {/* SpaceX */}
            <div className="group flex flex-col items-center backdrop-blur-md bg-white/60 rounded-2xl p-6 border border-blue-100 hover:bg-white/80 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-200/40">
              <svg className="w-12 h-12 mb-4 group-hover:scale-125 transition-transform duration-300" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" fill="url(#spacexGradient)" rx="4" />
                <path d="M2 12h4l3-3v6l-3-3H2zm6 0h4l3-3v6l-3-3H8zm6 0h4l3-3v6l-3-3h-4z" fill="white" />
                <defs>
                  <linearGradient id="spacexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e40af" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-blue-700 font-semibold text-lg tracking-wider group-hover:text-blue-900 transition-colors duration-300">SPACEX</span>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className={`text-center transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="backdrop-blur-md bg-white/70 rounded-3xl p-12 border border-blue-200 shadow-2xl shadow-blue-100/50 hover:bg-white/80 transition-all duration-500">
            <h3 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-blue-700 to-blue-600 mb-12">
              We help you <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">succeed</span>
            </h3>
            <button className="group relative px-12 py-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xl font-bold overflow-hidden transform hover:scale-110 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-300/40">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center">
                Start Now – It&apos;s free
                <svg className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 backdrop-blur-md bg-blue-50/80 border-t border-blue-200 py-8 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            {/* Navigation Links */}
            <nav className="flex flex-wrap justify-center md:justify-start space-x-8 text-sm">
              <a href="#" className="text-blue-600 hover:text-blue-800 transition-all duration-300 hover:scale-105 relative group">
                Kontakt
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-blue-600 hover:text-blue-800 transition-all duration-300 hover:scale-105 relative group">
                Om oss
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-blue-600 hover:text-blue-800 transition-all duration-300 hover:scale-105 relative group">
                Användarvillkor
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-blue-600 hover:text-blue-800 transition-all duration-300 hover:scale-105 relative group">
                Integritetspolicy
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-blue-600 hover:text-blue-800 transition-all duration-300 hover:scale-105 relative group">
                Tillgänglighet
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-blue-600 hover:text-blue-800 transition-all duration-300 hover:scale-105 relative group">
                Cookiepolicy
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </a>
            </nav>

            {/* Copyright */}
            <div className="text-sm text-blue-700">
              <span>© 2025</span>
              <span className="ml-4">Alla rättigheter förbehållna.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RefinedCVLandingPage;
