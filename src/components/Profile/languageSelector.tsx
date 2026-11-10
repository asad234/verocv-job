"use client"

import { useState, useEffect, useRef } from "react"
import { Search, ChevronDown, Check } from "lucide-react"
import { useProfileStore } from "@/utils/profileStore";
import { Language } from "@/types/payloadTypes";

const languages = [
  { name: "English", code: "en" },
  { name: "French", code: "fr" },
  { name: "German", code: "de" },
  { name: "Spanish", code: "es" },
  { name: "Chinese", code: "zh" },
  { name: "Japanese", code: "ja" }
];

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentProfile, setProfile } = useProfileStore();
  const [selectedLanguageName, setSelectedLanguageName] = useState(() => {
    const foundLanguage = languages.find(lang => lang.code === currentProfile?.language);
    return foundLanguage ? foundLanguage.name : "English";
  });

  useEffect(() => {
    console.log("LanguageSelector: profileLanguage from store:", currentProfile?.language);
    const foundLanguage = languages.find(lang => lang.code === currentProfile?.language);
    if (foundLanguage?.name !== selectedLanguageName) {
      console.log("LanguageSelector: Updating selectedLanguageName to:", foundLanguage?.name);
      setSelectedLanguageName(foundLanguage?.name || "English");
    }
  }, [currentProfile?.language, selectedLanguageName]);

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageSelect = (languageName: string) => {
    const selectedLangObject = languages.find(lang => lang.name === languageName);
    if (selectedLangObject && currentProfile) {
      setProfile({ ...currentProfile, language: selectedLangObject.code as 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' });
      setSelectedLanguageName(languageName); // Update UI immediately
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <label htmlFor="language" className={`block text-gray-700 font-medium`}>
        Language<span className="text-red-500">*</span>
      </label>
      <div
        className={`border border-gray-300 rounded-md p-3 flex items-center justify-between cursor-pointer hover:border-gray-400 transition-colors ${isOpen ? 'rounded-b-none' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <span>{selectedLanguageName}</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-0 bg-white border border-gray-200 rounded-md rounded-t-none shadow-lg z-10 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search languages..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((language) => (
                <div
                  key={language.code}
                  className={`p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between ${selectedLanguageName === language.name ? 'bg-blue-50' : ''}`}
                  onClick={() => handleLanguageSelect(language.name)}
                >
                  <span>{language.name}</span>
                  {selectedLanguageName === language.name && <Check className="w-5 h-5 text-blue-500" />}
                </div>
              ))
            ) : (
              <div className="p-3 text-gray-500 text-center">No languages found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
