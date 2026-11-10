"use client";
import React, { useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ProfileDetail from '../Profile/ProfileDetail';
import CreateManual from '../Profile/CreateManual';
import { useLanguageStore } from '@/utils/store';

const Language = () => {
  const {
    searchTerm,
    selectedLanguage,
    isDropdownOpen,
    showProfileDetail,
    setSearchTerm,
    setSelectedLanguage,
    setIsDropdownOpen,
    setShowProfileDetail
  } = useLanguageStore();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDetailRef = useRef<HTMLDivElement>(null);

  // Sample language data with flag icons
  const languages = [
    { code: 'en', name: 'English', flag: 'emojione:flag-for-united-states' },
    { code: 'es', name: 'Spanish', flag: 'emojione:flag-for-spain' },
    { code: 'fr', name: 'French', flag: 'emojione:flag-for-france' },
    { code: 'de', name: 'German', flag: 'emojione:flag-for-germany' },
    { code: 'zh', name: 'Chinese', flag: 'emojione:flag-for-china' },
    { code: 'ja', name: 'Japanese', flag: 'emojione:flag-for-japan' },
  ];

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setIsDropdownOpen(true);
  };

  const handleLanguageSelect = (languageName: string, languageCode: string) => {
    setSelectedLanguage(languageCode);
    setSearchTerm(languageName);
    setIsDropdownOpen(false);
  };

  const handleCreateProfileClick = () => {
    setShowProfileDetail(true);
  };

  // Filter languages based on search term
  const filteredLanguages = languages.filter((language) =>
    language.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Scroll to profile detail when shown
  useEffect(() => {
    if (showProfileDetail && profileDetailRef.current) {
      profileDetailRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showProfileDetail]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full lg:w-[100%] space-y-4 sm:space-y-6">
      {/* Language Card */}
      <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
        {/* Text */}
        <p className="text-gray-600 mb-4">
          If not, you can always create the profile manually.
        </p>

        {/* Language Label */}
        <label htmlFor="language-search" className="block text-sm font-medium text-gray-700 mb-2">
          Language*
        </label>

        {/* Search Box */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon icon="tabler:search" className="w-5 h-5 text-gray-400" />
          </div>
          <input
            id="language-search"
            type="text"
            placeholder="Search for a language"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          {/* Dropdown with Language Options */}
          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {filteredLanguages.map((language) => (
                <div
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.name, language.code)}
                  className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                >
                  <Icon icon={language.flag} className="w-5 h-5 mr-2" />
                  <span>{language.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Language Display */}
        {selectedLanguage && (
          <div className="mt-4">
            <p className="text-gray-700">
              Selected Language: <span className="font-semibold">
                {languages.find(l => l.code === selectedLanguage)?.name}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Profile Detail Section */}
      {selectedLanguage === 'en' && (
        <div>
          <button
            onClick={handleCreateProfileClick}
            className="px-4 py-2 mb-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create Profile
          </button>

          {showProfileDetail && (
            <div ref={profileDetailRef} className="mt-10">
              <ProfileDetail scrollToProfile={false} />
              <CreateManual />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Language;