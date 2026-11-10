"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Skill } from "@/utils/types"
import { useProfileStore } from "@/utils/profileStore"
import { useChangesStore } from "@/utils/changesStore"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

interface SkillFormProps {
  skillId: string | null
  onCancel: () => void
  onComplete: () => void
}

export default function SkillForm({ skillId, onCancel, onComplete }: SkillFormProps) {
  const storedSkills = useProfileStore((state) => state.skills)
  const setSkills = useProfileStore((state) => state.setSkills)
  const { addChange, editChange } = useChangesStore()
  const { t } = useDashboardTranslations()

  const [formData, setFormData] = useState<Partial<Skill>>({
    skillName: "",
    skillRating: 3,
    skillYearsExperience: 1,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (skillId) {
      const skill = storedSkills?.find((s) => s.id === skillId)
      if (skill) {
        setFormData({
          skillName: skill.skillName,
          skillRating: skill.skillRating,
          skillYearsExperience: skill.skillYearsExperience || 1,
        })
      }
    } else {
      setFormData({ skillName: "", skillRating: 3, skillYearsExperience: 1 })
    }
  }, [skillId, storedSkills])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleRatingChange = (rating: number) => {
    setFormData((prev) => ({ ...prev, skillRating: rating }))
  }

  const handleYearsChange = (years: number) => {
    setFormData((prev) => ({ ...prev, skillYearsExperience: years }))
  }

  const isSkillNameDuplicate = (skillName: string): boolean => {
    if (!skillId) {
      return storedSkills?.some((s) => s.skillName.toLowerCase() === skillName.toLowerCase()) || false
    } else {
      return (
        storedSkills?.some((s) => s.id !== skillId && s.skillName.toLowerCase() === skillName.toLowerCase()) || false
      )
    }
  }

  const handleSubmit = () => {
    try {
      const validationErrors: Record<string, string> = {}

      if (!formData.skillName) {
        validationErrors.skillName = t.fieldRequired
        setErrors(validationErrors)
        return
      }

      if (skillId) {
        const skillName = formData.skillName?.trim() || ""

        if (skillName === "") {
          validationErrors.skillName = t.fieldRequired
          setErrors(validationErrors)
          return
        }

        if (isSkillNameDuplicate(skillName)) {
          validationErrors.skillName = t.duplicateSkillsDetected
          setErrors(validationErrors)
          return
        }

        const updatedSkills =
          storedSkills?.map((s) =>
            s.id === skillId ? ({ ...s, ...formData, skillName } as Skill) : s
          ) || []
        setSkills(updatedSkills, true)
        editChange("skills", skillId)
        onComplete()
      } else {
        const skillNames = (formData.skillName || "")
          .split(",")
          .map((name) => name.trim())
          .filter((name) => name !== "")

        if (skillNames.length === 0) {
          validationErrors.skillName = t.fieldRequired
          setErrors(validationErrors)
          return
        }

        const uniqueSkillNames = [...new Set(skillNames)]
        if (uniqueSkillNames.length < skillNames.length) {
          validationErrors.skillName = t.duplicateSkillsMessage
          setErrors(validationErrors)
          return
        }

        const newSkillNames = uniqueSkillNames.filter((name) => !isSkillNameDuplicate(name))

        if (newSkillNames.length === 0) {
          validationErrors.skillName = t.duplicateSkillsDetected
          setErrors(validationErrors)
          return
        }

        const newSkills = newSkillNames.map((skillName) => ({
          id: Math.random().toString(36).substring(2, 15),
          skillName,
          skillRating: formData.skillRating,
          skillYearsExperience: formData.skillYearsExperience,
        })) as Skill[]

        setSkills([...(storedSkills || []), ...newSkills], true)
        newSkills.forEach((skill) => addChange("skills", skill.id))
        onComplete()
      }
    } catch (error) {
      console.error("Error submitting skill:", error)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700 mb-2">
        {skillId ? t.editSkill : t.addNewSkill}
      </h3>

      {/* Skill Name */}
      <div>
        <label className="block text-gray-700 mb-1">
          {t.skills} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="skillName"
          value={formData.skillName}
          onChange={handleChange}
          placeholder={skillId ? t.technicalSkills : `${t.technicalSkills} (${t.noSkillsAdded})`}
          className={`w-full p-2 border ${errors.skillName ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
          style={!errors.skillName ? { borderColor: 'rgb(176, 196, 222)' } : {}}
        />
        {errors.skillName && <p className="text-red-500 text-sm mt-1">{errors.skillName}</p>}
        {!skillId && !errors.skillName && (
          <p className="text-gray-500 text-sm mt-1">{t.skillAddedDesc}</p>
        )}
      </div>

      {/* Rating */}
      <div>
        <label className="block text-gray-700 mb-2">{t.selectRating}</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => handleRatingChange(rating)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${formData.skillRating === rating
                  ? "text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              style={formData.skillRating === rating ? { backgroundColor: 'rgb(5, 22, 80)' } : {}}
            >
              {rating}
            </button>
          ))}
        </div>
      </div>

      {/* Years of Experience */}
      <div>
        <label className="block text-gray-700 mb-2">{t.years}</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((years) => (
            <button
              key={`years-${years}`}
              type="button"
              onClick={() => handleYearsChange(years)}
              className={`px-3 h-10 rounded-md flex items-center justify-center text-sm font-medium transition-all duration-300 ${formData.skillYearsExperience === years
                  ? "text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              style={formData.skillYearsExperience === years ? { backgroundColor: 'rgb(5, 22, 80)' } : {}}
            >
              {years === 5 ? "5+" : years} {years === 1 ? t.year : t.years}
            </button>
          ))}
        </div>
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
          {skillId ? t.updateProfile : t.addSkill}
        </button>
      </div>
    </div>
  )
}
