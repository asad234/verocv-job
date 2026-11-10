import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Button from "../ReUsable/Button";

interface LanguageFormProps {
  onSave: (language: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const LanguageForm: React.FC<LanguageFormProps> = ({ onSave, onCancel, initialData }) => {
  const [language, setLanguage] = useState(initialData?.language || "");
  const [level, setLevel] = useState(initialData?.level || "");

  const languageOptions = [
    "English",
    "Spanish",
    "French",
    "German",
    "Chinese",
    "Japanese",
    "Arabic",
    "Russian",
    "Portuguese",
    "Italian",
  ];

  const levelOptions = [
    "No proficiency",
    "Elementary Proficiency",
    "Professional Working Proficiency",
    "Full Professional Proficiency",
    "Native or Bilingual Proficiency",
  ];

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-md font-semibold text-gray-800 mb-2">
        {initialData ? "Edit Language" : "Add Language"}
      </h3>

      {/* Grid Layout for Language and Level */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {/* Language Dropdown */}
        <div>
          <label className="text-gray-600 text-sm">Language *</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg mt-1"
            required
          >
            <option value="" disabled>
              Select a language
            </option>
            {languageOptions.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Level Dropdown */}
        <div>
          <label className="text-gray-600 text-sm">Level *</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg mt-1"
            required
          >
            <option value="" disabled>
              Select a proficiency level
            </option>
            {levelOptions.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Save and Cancel Buttons */}
      <div className="flex justify-start gap-4 mt-4">
        <Button onClick={() => onSave({ language, level })}>Save</Button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default LanguageForm;
