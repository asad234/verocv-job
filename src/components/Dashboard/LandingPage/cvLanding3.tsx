"use client"
import React, { useState, useEffect } from 'react';

const MinimalistCVLandingPage: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);

    const updateScrollY = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', updateScrollY);
    return () => window.removeEventListener('scroll', updateScrollY);
  }, []);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl opacity-10 rotate-12"
          style={{ transform: `translateY(${scrollY * 0.1}px) rotate(12deg)` }}
        ></div>
        <div
          className="absolute top-1/3 -left-16 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-10"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        ></div>
        <div
          className="absolute bottom-1/4 right-10 w-24 h-24 bg-gradient-to-br from-green-400 to-cyan-400 rounded-lg opacity-10 rotate-45"
          style={{ transform: `translateY(${scrollY * 0.15}px) rotate(45deg)` }}
        ></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="group cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                <span className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">OUR LOGO</span>
              </div>
            </div>
            <button className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
              Sign-in
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-6 lg:px-8 pt-20 pb-32">
          <div className={`text-center transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>

            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-8 border border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
              Free to use • No credit card required
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 leading-tight">
              CV Should be
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Easy
              </span>
            </h1>

            <div className="max-w-4xl mx-auto space-y-4 mb-12 text-lg md:text-xl text-gray-600 leading-relaxed">
              <p>
                We believe creating a <span className="font-semibold text-blue-600">great</span> job-specific <span className="font-semibold text-purple-600">CV should be quick</span>
              </p>
              <p>
                A cover letter should be written in <span className="font-semibold text-pink-600">no time</span>
              </p>
              <p>
                Applying for work should only take a moment
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button className="group px-8 py-4 bg-blue-600 text-white rounded-2xl font-semibold text-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center">
                Start Now – It&apos;s free
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <button className="px-8 py-4 text-gray-700 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 000-5H9v5zm0 0H7.5A2.5 2.5 0 005 7.5v0H9m-4 6.5h1.5a2.5 2.5 0 000-5H5v5z" />
                </svg>
                Watch Demo
              </button>
            </div>

            {/* Scroll indicator */}
            <div className="flex flex-col items-center">
              <p className="text-gray-400 text-sm mb-4">If you are still not convinced read more below</p>
              <div className="animate-bounce">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gray-50 py-20">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className={`transform transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
              <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium mb-6 border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Proven Results
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                    You are <span className="text-green-600">80% more likely</span> to get hired
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    if you tailor your CV and cover letter to the job. This process manually can take <span className="font-semibold text-red-500">hours</span>; we help you do this in <span className="font-semibold text-green-600">just a few clicks</span>
                  </p>
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center p-6 bg-blue-50 rounded-2xl">
                    <div className="text-3xl font-bold text-blue-600 mb-2">2 min</div>
                    <div className="text-gray-600">Average time to create CV</div>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-2xl">
                    <div className="text-3xl font-bold text-purple-600 mb-2">10x</div>
                    <div className="text-gray-600">Faster than manual writing</div>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-2xl">
                    <div className="text-3xl font-bold text-green-600 mb-2">80%</div>
                    <div className="text-gray-600">Higher interview rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Companies Section */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className={`text-center transform transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
              <div className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-full text-sm font-medium mb-12 border border-gray-200">
                <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                GET HIRED BY TOP COMPANIES WORLDWIDE
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                {/* Coinbase */}
                <div className="group flex flex-col items-center p-6 rounded-2xl hover:bg-gray-50 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="8" fill="#0052FF" />
                      <path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" fill="white" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-blue-600 transition-colors duration-300">Coinbase</span>
                </div>

                {/* Spotify */}
                <div className="group flex flex-col items-center p-6 rounded-2xl hover:bg-gray-50 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#1DB954">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-green-600 transition-colors duration-300">Spotify</span>
                </div>

                {/* Microsoft */}
                <div className="group flex flex-col items-center p-6 rounded-2xl hover:bg-gray-50 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="8" height="8" fill="#F25022" />
                      <rect x="13" y="3" width="8" height="8" fill="#7FBA00" />
                      <rect x="3" y="13" width="8" height="8" fill="#00A4EF" />
                      <rect x="13" y="13" width="8" height="8" fill="#FFB900" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-blue-600 transition-colors duration-300">Microsoft</span>
                </div>

                {/* Meta */}
                <div className="group flex flex-col items-center p-6 rounded-2xl hover:bg-gray-50 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12C24 5.373 18.627 0 12 0S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-blue-600 transition-colors duration-300">Meta</span>
                </div>

                {/* SpaceX */}
                <div className="group flex flex-col items-center p-6 rounded-2xl hover:bg-gray-50 transition-all duration-300 cursor-pointer">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#005288">
                      <path d="M2 12h4l3-3v6l-3-3H2zm6 0h4l3-3v6l-3-3H8zm6 0h4l3-3v6l-3-3h-4z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors duration-300 tracking-wider">SPACEX</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <div className={`transform transition-all duration-1000 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
              <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
                We help you succeed
              </h3>
              <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
                Join thousands of professionals who&apos;ve already landed their dream jobs with our AI-powered CV builder
              </p>
              <button className="px-12 py-4 bg-white text-blue-600 rounded-2xl font-bold text-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center mx-auto">
                Start Now – It&apos;s free
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <nav className="flex flex-wrap justify-center md:justify-start gap-8 text-sm">
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 relative group">
                Kontakt
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 relative group">
                Om oss
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 relative group">
                Användarvillkor
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 relative group">
                Integritetspolicy
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 relative group">
                Tillgänglighet
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 relative group">
                Cookiepolicy
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 group-hover:w-full transition-all duration-300"></span>
              </a>
            </nav>

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

export default MinimalistCVLandingPage;
