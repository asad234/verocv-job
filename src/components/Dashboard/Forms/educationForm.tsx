// src/components/Profile/EducationForm.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useProfileStore } from "@/utils/profileStore"
import type { Education } from "@/utils/types"
import { Calendar, Link } from "lucide-react"
import { formatDate } from "@/utils/formatDate"
import { useChangesStore } from "@/utils/changesStore"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

interface EducationFormProps {
  educationId: string | null
  onCancel: () => void
  onComplete: () => void
}

export default function EducationForm({ educationId, onCancel, onComplete }: EducationFormProps) {
  const { education: storedEducation, setEducation } = useProfileStore()
  const { addChange, editChange } = useChangesStore()
  const { t } = useDashboardTranslations()

  const [formData, setFormData] = useState<Partial<Education>>({
    school: "",
    program: "",
    level: "",
    place: "",
    startDate: new Date(),
    endDate: undefined,
    ongoing: false,
    description: "",
    link: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (educationId) {
      const edu = storedEducation?.find((e) => e.id === educationId)
      if (edu) {
        setFormData({
          school: edu.school,
          program: edu.program,
          level: edu.level,
          place: edu.place,
          startDate: edu.startDate instanceof Date ? edu.startDate : new Date(edu.startDate),
          endDate: edu.endDate ? (edu.endDate instanceof Date ? edu.endDate : new Date(edu.endDate)) : undefined,
          ongoing: edu.ongoing,
          description: edu.description,
          link: edu.link,
        })
      } else {
        resetForm()
      }
    } else {
      resetForm()
    }
  }, [educationId, storedEducation])

  const resetForm = () => {
    setFormData({
      school: "",
      program: "",
      level: "",
      place: "",
      startDate: new Date(),
      endDate: undefined,
      ongoing: false,
      description: "",
      link: "",
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const handleDateChange = (name: string, value: string) => {
    const date = value ? new Date(value) : undefined

    if (name === "endDate" && date && formData.startDate) {
      const startDate = formData.startDate instanceof Date
        ? formData.startDate
        : new Date(formData.startDate)

      if (date < startDate) {
        setErrors(prev => ({ ...prev, endDate: t.endDateCannotBeBeforeStartDate }))
        return
      }
    }

    if (name === "startDate" && date && formData.endDate && !formData.ongoing) {
      const endDate = formData.endDate instanceof Date
        ? formData.endDate
        : new Date(formData.endDate)

      if (date > endDate) {
        setErrors(prev => ({ ...prev, startDate: t.endDateCannotBeBeforeStartDate }))
        return
      }
    }

    setFormData((prev) => ({ ...prev, [name]: date }))

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: checked, ...(checked ? { endDate: undefined } : {}) }))

    if (checked && errors.endDate) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.endDate
        return newErrors
      })
    }
  }

  const handleSubmit = () => {
    try {
      const validationErrors: Record<string, string> = {}

      if (!formData.school) validationErrors.school = t.schoolRequired
      if (!formData.program) validationErrors.program = t.programRequired
      if (!formData.level) validationErrors.level = t.levelRequired
      if (!formData.place) validationErrors.place = t.placeRequired
      if (!formData.startDate) validationErrors.startDate = t.startDateRequired
      if (!formData.ongoing && !formData.endDate) validationErrors.endDate = t.endDateRequired
      if (!formData.description) validationErrors.description = t.descriptionRequired

      if (formData.startDate && formData.endDate && !formData.ongoing) {
        const startDate = formData.startDate instanceof Date
          ? formData.startDate
          : new Date(formData.startDate)
        const endDate = formData.endDate instanceof Date
          ? formData.endDate
          : new Date(formData.endDate)

        if (endDate < startDate) {
          validationErrors.endDate = t.endDateCannotBeBeforeStartDate
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }

      if (educationId) {
        const updatedEducation = storedEducation?.map((e) =>
          e.id === educationId ? { ...e, ...formData } as Education : e
        ) || []
        setEducation(updatedEducation, true)
        editChange("education", educationId)
      } else {
        const newEducation: Education = {
          id: Math.random().toString(36).substring(2, 15),
          ...formData,
        } as Education
        setEducation([...(storedEducation || []), newEducation], true)
        addChange("education", newEducation.id)
      }

      onComplete()
    } catch (error) {
      console.error("Error submitting education:", error)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">
        {educationId ? t.editEducation : t.addNewEducation}
      </h3>

      {/* School */}
      <div>
        <label className="block text-gray-700 mb-1">
          {t.school} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="school"
          value={formData.school}
          onChange={handleChange}
          placeholder={t.schoolName}
          className={`w-full p-2 border ${errors.school ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
          style={!errors.school ? { borderColor: 'rgb(176, 196, 222)' } : {}}
        />
        {errors.school && <p className="text-red-500 text-sm mt-1">{errors.school}</p>}
      </div>

      {/* Program */}
      <div>
        <label className="block text-gray-700 mb-1">
          {t.program} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="program"
          value={formData.program}
          onChange={handleChange}
          placeholder={t.programOrDegree}
          className={`w-full p-2 border ${errors.program ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
          style={!errors.program ? { borderColor: 'rgb(176, 196, 222)' } : {}}
        />
        {errors.program && <p className="text-red-500 text-sm mt-1">{errors.program}</p>}
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
          <option value="High School">{t.highSchool}</option>
          <option value="Associate's Degree">{t.associatesDegree}</option>
          <option value="Bachelor's Degree">{t.bachelorsDegree}</option>
          <option value="Master's Degree">{t.mastersDegree}</option>
          <option value="Doctorate">{t.doctorate}</option>
          <option value="Certificate">{t.certificate}</option>
          <option value="Diploma">{t.diploma}</option>
        </select>
        {errors.level && <p className="text-red-500 text-sm mt-1">{errors.level}</p>}
      </div>

      {/* Place */}
      <div>
        <label className="block text-gray-700 mb-1">
          {t.place} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="place"
          value={formData.place}
          onChange={handleChange}
          placeholder={t.cityCountry}
          className={`w-full p-2 border ${errors.place ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
          style={!errors.place ? { borderColor: 'rgb(176, 196, 222)' } : {}}
        />
        {errors.place && <p className="text-red-500 text-sm mt-1">{errors.place}</p>}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 mb-1">
            {t.startDate} <span className="text-red-500">*</span>
          </label>
          <div className="relative" onClick={() => {
            const input = document.getElementById('startDateInput')
            if (input instanceof HTMLInputElement) input.showPicker()
          }}>
            <input
              id="startDateInput"
              type="date"
              name="startDate"
              value={formData.startDate ?
                (formData.startDate instanceof Date ?
                  formatDate(formData.startDate.toISOString(), false) :
                  formatDate(new Date(formData.startDate).toISOString(), false)) :
                ""}
              onChange={(e) => handleDateChange("startDate", e.target.value)}
              className={`w-full p-2 pl-10 border ${errors.startDate ? "border-red-500" : "border-blue-200/60"} rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
              style={!errors.startDate ? { borderColor: 'rgb(176, 196, 222)' } : {}}
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
          {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
        </div>

        {!formData.ongoing && (
          <div>
            <label className="block text-gray-700 mb-1">{t.endDate}</label>
            <div className="relative" onClick={() => {
              const input = document.getElementById('endDateInput')
              if (input instanceof HTMLInputElement) input.showPicker()
            }}>
              <input
                id="endDateInput"
                type="date"
                name="endDate"
                value={
                  formData.endDate && !formData.ongoing ?
                    (formData.endDate instanceof Date ?
                      formatDate(formData.endDate.toISOString(), false) :
                      formatDate(new Date(formData.endDate).toISOString(), false)) :
                    ""
                }
                onChange={(e) => handleDateChange("endDate", e.target.value)}
                disabled={formData.ongoing}
                min={formData.startDate instanceof Date ?
                  formatDate(formData.startDate.toISOString(), false) :
                  formatDate(new Date(formData.startDate || "").toISOString(), false)}
                className={`w-full p-2 pl-10 border ${errors.endDate ? "border-red-500" : "border-blue-200/60"} rounded-md ${formData.ongoing ? "bg-gray-100" : ""} cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
                style={!errors.endDate && !formData.ongoing ? { borderColor: 'rgb(176, 196, 222)' } : {}}
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
            {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
          </div>
        )}
      </div>

      {/* Ongoing */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="ongoing"
          name="ongoing"
          checked={formData.ongoing}
          onChange={handleCheckboxChange}
          className="mr-2"
        />
        <label htmlFor="ongoing" className="text-gray-700">
          {t.ongoing}
        </label>
      </div>

      {/* Description */}
      <div>
        <label className="block text-gray-700 mb-1">
          {t.description} <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder={t.educationDescription}
          rows={4}
          className={`w-full p-2 border ${errors.description ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
          style={!errors.description ? { borderColor: 'rgb(176, 196, 222)' } : {}}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* School Website */}
      <div>
        <label className="block text-gray-700 mb-1">{t.schoolWebsite}</label>
        <div className="relative">
          <input
            type="text"
            name="link"
            value={formData.link || ""}
            onChange={handleChange}
            placeholder={t.linkPlaceholder}
            className="w-full p-2 pl-10 border border-blue-200/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40"
            style={{ borderColor: 'rgb(176, 196, 222)' }}
          />
          <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
          {educationId ? t.updateEducation : t.addEducationBtn}
        </button>
      </div>
    </div>
  )
}
