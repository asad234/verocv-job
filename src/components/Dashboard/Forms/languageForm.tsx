"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useProfileStore } from "@/utils/profileStore";
import type { LanguageSkill } from "@/types/payloadTypes";
import { useChangesStore } from "@/utils/changesStore";
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation";

interface LanguageFormProps {
  languageId: string | null;
  onCancel: () => void;
  onComplete: () => void;
}

export default function LanguageForm({ languageId, onCancel, onComplete }: LanguageFormProps) {
  const { languages: storedLanguages, setLanguages } = useProfileStore();
  const { addChange, editChange } = useChangesStore();
  const { t } = useDashboardTranslations();

  const [formData, setFormData] = useState<Partial<LanguageSkill>>({
    language: "",
    level: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Level values stay in English (stored in DB), but labels are translated
  const languageLevels: { value: string; label: string }[] = [
    { value: "Native", label: t.native },
    { value: "Fluent", label: t.fluent },
    { value: "Advanced", label: t.advanced },
    { value: "Intermediate", label: t.intermediate },
    { value: "Basic", label: t.basic },
  ];

  useEffect(() => {
    if (languageId) {
      const languageSkill = storedLanguages?.find((l) => l.id === languageId);
      if (languageSkill) {
        setFormData({
          language: languageSkill.language,
          level: languageSkill.level,
        });
      } else {
        setFormData({ language: "", level: "" });
      }
    } else {
      setFormData({ language: "", level: "" });
    }
  }, [languageId, storedLanguages]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const checkDuplicateLanguage = (language: string): boolean => {
    if (languageId) {
      const currentLanguage = storedLanguages?.find((l) => l.id === languageId);
      if (currentLanguage && currentLanguage.language.toLowerCase() === language.toLowerCase()) {
        return false;
      }
    }
    return storedLanguages?.some(
      (l) => l.language.toLowerCase() === language.toLowerCase()
    ) || false;
  };

  const handleSubmit = () => {
    try {
      const validationErrors: Record<string, string> = {};
      if (!formData.language) validationErrors.language = t.languageRequired;
      if (!formData.level) validationErrors.level = t.proficiencyLevelRequired;

      if (formData.language && checkDuplicateLanguage(formData.language)) {
        validationErrors.language = t.languageAlreadyExists;
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      if (languageId) {
        const updatedLanguages = storedLanguages?.map((l) =>
          l.id === languageId ? { ...l, ...formData } as LanguageSkill : l
        ) || [];
        setLanguages(updatedLanguages, true);
        editChange("languages", languageId);
      } else {
        const newLanguageSkill: LanguageSkill = {
          id: Math.random().toString(36).substring(2, 15),
          ...formData,
        } as LanguageSkill;
        setLanguages([...(storedLanguages || []), newLanguageSkill], true);
        addChange("languages", newLanguageSkill.id);
      }

      onComplete();
    } catch (error) {
      console.error("Error submitting language:", error);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700 mb-2">
        {languageId ? t.editLanguage : t.addNewLanguage}
      </h3>

      {/* Language */}
      <div>
        <label className="block text-gray-700 mb-1">
          {t.language} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="language"
          value={formData.language}
          onChange={handleChange}
          placeholder={t.languagePlaceholder}
          className={`w-full p-2 border ${errors.language ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
          style={!errors.language ? { borderColor: 'rgb(176, 196, 222)' } : {}}
        />
        {errors.language && <p className="text-red-500 text-sm mt-1">{errors.language}</p>}
      </div>

      {/* Level */}
      <div>
        <label className="block text-gray-700 mb-1">
          {t.level} <span className="text-red-500">*</span>
        </label>
        <select
          name="level"
          value={formData.level}
          onChange={handleChange}
          className={`w-full p-2 border ${errors.level ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
          style={!errors.level ? { borderColor: 'rgb(176, 196, 222)' } : {}}
        >
          <option value="">{t.selectLevel}</option>
          {languageLevels.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.level && <p className="text-red-500 text-sm mt-1">{errors.level}</p>}
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
        >
          {t.cancel}
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 text-white font-medium py-2 px-4 rounded-md transition-all duration-300 hover:shadow-lg"
          style={{ backgroundColor: 'rgb(5, 22, 80)' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          {languageId ? t.updateLanguage : t.addLanguageBtn}
        </button>
      </div>
    </div>
  );
}
