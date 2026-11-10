'use client';

import { useEffect, useState } from 'react';
import posthog from 'posthog-js';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

type Language = 'en' | 'sv';

interface CookieTranslations {
  en: {
    message: string;
    privacyPolicy: string;
    acceptAnalytics: string;
    onlyNecessary: string;
  };
  sv: {
    message: string;
    privacyPolicy: string;
    acceptAnalytics: string;
    onlyNecessary: string;
  };
}

const translations: CookieTranslations = {
  sv: {
    message: 'Vi använder nödvändiga cookies för att VeroCV ska fungera korrekt och valfri analys för att förbättra din upplevelse. Läs vår',
    privacyPolicy: 'Integritetspolicy',
    acceptAnalytics: 'Acceptera analys',
    onlyNecessary: 'Endast nödvändiga',
  },
  en: {
    message: 'We use essential cookies to make VeroCV work properly and optional analytics to improve your experience. Read our',
    privacyPolicy: 'Privacy Policy',
    acceptAnalytics: 'Accept analytics',
    onlyNecessary: 'Only necessary',
  },
};

export function CookiesBanner() {
  const [consentGiven, setConsentGiven] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [language, setLanguage] = useState<Language>('sv'); // Swedish as default

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedConsent = localStorage.getItem('cookie_consent');
      setConsentGiven(savedConsent ?? 'pending');

      // Get language from localStorage (set by landing page)
      const savedLanguage = localStorage.getItem('dashboardLanguage') as Language;
      if (savedLanguage === 'en' || savedLanguage === 'sv') {
        setLanguage(savedLanguage);
      }

      // Small delay to ensure proper animation
      setTimeout(() => setIsVisible(true), 100);
    }
  }, []);

  const handleAccept = (): void => {
    localStorage.setItem('cookie_consent', 'granted');
    posthog.opt_in_capturing();
    setConsentGiven('granted');
    setIsVisible(false);
  };

  const handleDecline = (): void => {
    localStorage.setItem('cookie_consent', 'denied');
    posthog.opt_out_capturing();
    setConsentGiven('denied');
    setIsVisible(false);
  };

  // Don't render anything if consent is already given or declined
  if (consentGiven !== 'pending' || !isVisible) {
    return null;
  }

  const t = translations[language];

  return (
    <AnimatePresence>
      {consentGiven === 'pending' && isVisible && (
        <>
          {/* Backdrop to block interactions with the rest of the page */}
          <motion.div
            key="overlay"
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Main banner container */}
          <motion.div
            key="banner"
            className="fixed z-50 w-full max-h-screen overflow-y-auto"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{
              duration: 0.4,
              type: "spring",
              damping: 25,
              stiffness: 300
            }}
          >
            {/* Mobile & Small Screens: Bottom Sheet Style */}
            <div className="block lg:hidden">
              <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl rounded-t-2xl lg:rounded-b-2xl mx-auto max-w-screen-2xl">
                <div className="px-4 sm:px-6 py-4 sm:py-5 max-w-full">
                  {/* Close indicator for mobile */}
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col items-center text-center gap-4">
                    {/* Logo - Mobile */}
                    <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 relative">
                      <Image
                        src="/logo/logovero.svg"
                        alt="VeroCV Logo"
                        fill
                        className="object-contain dark:invert"
                        priority
                      />
                    </div>

                    {/* Message */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                        {t.message}{' '}
                        <Link
                          href="/terms"
                          className="font-medium inline-block hover:underline"
                          style={{ color: 'rgb(5, 22, 80)' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t.privacyPolicy}
                        </Link>
                        .
                      </p>
                    </div>

                    {/* Buttons - Stacked on mobile */}
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                      <button
                        onClick={handleAccept}
                        className="w-full px-6 py-3 text-base font-medium rounded-lg text-white shadow-lg transition-all duration-200 transform active:scale-95"
                        style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                      >
                        {t.acceptAnalytics}
                      </button>
                      <button
                        onClick={handleDecline}
                        className="w-full px-6 py-3 text-base font-medium rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 active:bg-gray-100 transition-all duration-200"
                      >
                        {t.onlyNecessary}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop & Tablet: Centered Card */}
            <div className="hidden lg:block">
              <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] max-w-2xl xl:max-w-3xl 2xl:max-w-4xl">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl px-6 py-5 lg:px-8 lg:py-6">
                  <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
                    {/* Logo - Desktop */}
                    <div className="flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 relative">
                      <Image
                        src="/logo/logovero.svg"
                        alt="VeroCV Logo"
                        fill
                        className="object-contain dark:invert"
                        priority
                      />
                    </div>

                    {/* Message */}
                    <div className="flex-1 min-w-0 text-center lg:text-left">
                      <p className="text-base lg:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                        {t.message}{' '}
                        <Link
                          href="/terms"
                          className="font-medium hover:underline"
                          style={{ color: 'rgb(5, 22, 80)' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t.privacyPolicy}
                        </Link>
                        .
                      </p>
                    </div>

                    {/* Buttons - Side by side on desktop */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-shrink-0">
                      <button
                        onClick={handleDecline}
                        className="px-6 py-3 text-base font-medium rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 active:bg-gray-100 transition-all duration-200 whitespace-nowrap"
                      >
                        {t.onlyNecessary}
                      </button>
                      <button
                        onClick={handleAccept}
                        className="px-6 py-3 text-base font-medium rounded-lg text-white shadow-lg transition-all duration-200 transform active:scale-95 whitespace-nowrap"
                        style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                      >
                        {t.acceptAnalytics}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
