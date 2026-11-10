"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useProfileStore } from "@/utils/profileStore"
import type { Employer } from "@/types/payloadTypes"
import { Calendar, Link } from "lucide-react"
import { useChangesStore } from "@/utils/changesStore"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

interface EmployerFormProps {
  employerId: string | null
  onCancel: () => void
  onComplete: () => void
}

export default function EmployerForm({ employerId, onCancel, onComplete }: EmployerFormProps) {
  const { employers: storedEmployers, setEmployers } = useProfileStore()
  const { addChange, editChange } = useChangesStore()
  const { t } = useDashboardTranslations()

  const [formData, setFormData] = useState<Partial<Employer>>({
    employer: "",
    title: "",
    startDate: new Date(),
    ongoing: false,
    endDate: undefined,
    achievements: "",
    description: "",
    link: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (employerId) {
      const employer = storedEmployers?.find((e) => e.id === employerId)
      if (employer) {
        setFormData({
          employer: employer.employer,
          title: employer.title,
          startDate: employer.startDate,
          ongoing: employer.ongoing,
          endDate: employer.endDate,
          description: employer.description,
          achievements: employer.achievements,
          link: employer.link,
        })
      } else {
        setFormData({
          employer: "",
          title: "",
          startDate: new Date(),
          ongoing: false,
          endDate: undefined,
          description: "",
          link: "",
        }) // Reset for adding
      }
    } else {
      setFormData({
        employer: "",
        title: "",
        startDate: new Date(),
        ongoing: false,
        endDate: undefined,
        description: "",
        link: "",
      }) // Reset for adding
    }
  }, [employerId, storedEmployers])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    if (name === "startDate" && formData.endDate && date) {
      const endDate = new Date(formData.endDate)
      if (date > endDate) {
        setFormData((prev) => ({ ...prev, [name]: date, endDate: undefined }))
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[name]
          delete newErrors.endDate
          return newErrors
        })
        return
      }
    }

    if (name === "endDate" && formData.startDate && date) {
      const startDate = new Date(formData.startDate)
      if (date < startDate) {
        setErrors((prev) => ({ ...prev, endDate: t.endDateCannotBeBeforeStartDate }))
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
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.endDate
        return newErrors
      })
    }
  }

  const formatDateForInput = (date: Date | string | undefined): string => {
    if (!date) return ""
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return ""
    return dateObj.toISOString().split("T")[0]!
  }

  const handleSubmit = () => {
    try {
      const validationErrors: Record<string, string> = {}

      if (!formData.employer) validationErrors.employer = t.fieldRequired
      if (!formData.title) validationErrors.title = t.titleRequired
      if (!formData.startDate) validationErrors.startDate = t.startDateRequired
      if (!formData.ongoing && !formData.endDate) validationErrors.endDate = t.endDateRequired
      if (!formData.description) validationErrors.description = t.descriptionRequired

      if (!formData.ongoing && formData.startDate && formData.endDate) {
        const startDate = new Date(formData.startDate)
        const endDate = new Date(formData.endDate)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(0, 0, 0, 0)
        if (endDate < startDate) {
          validationErrors.endDate = t.endDateCannotBeBeforeStartDate
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }

      if (employerId) {
        const updatedEmployers =
          storedEmployers?.map((e) => (e.id === employerId ? ({ ...e, ...formData } as Employer) : e)) || []
        setEmployers(updatedEmployers, true)
        editChange("employers", employerId)
      } else {
        const newEmployer: Employer = {
          id: Math.random().toString(36).substring(2, 15),
          ...formData,
        } as Employer
        setEmployers([...(storedEmployers || []), newEmployer], true)
        addChange("employers", newEmployer.id)
      }

      onComplete()
    } catch (error) {
      console.error("Error submitting employer:", error)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">
        {employerId ? t.editEmployer : t.addNewEmployer}
      </h3>

      {/* Employer */}
      <div>
        <label className="block text-gray-700 mb-1">
          {t.employment} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="employer"
          value={formData.employer}
          onChange={handleChange}
          placeholder={t.addNewEmployer}
          className={`w-full p-2 border ${errors.employer ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
          style={!errors.employer ? { borderColor: 'rgb(176, 196, 222)' } : {}}
        />
        {errors.employer && <p className="text-red-500 text-sm mt-1">{errors.employer}</p>}
      </div>

      {/* Title */}
      <div>
        <label className="block text-gray-700 mb-1">
          {t.title} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder={t.presentTitlePlaceholder}
          className={`w-full p-2 border ${errors.title ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
          style={!errors.title ? { borderColor: 'rgb(176, 196, 222)' } : {}}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 mb-1">
            {t.startDate} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              name="startDate"
              value={formatDateForInput(formData.startDate)}
              onChange={(e) => handleDateChange("startDate", e.target.value)}
              className={`w-full p-2 pl-10 border ${errors.startDate ? "border-red-500" : "border-blue-200/60"} rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
              style={!errors.startDate ? { borderColor: 'rgb(176, 196, 222)' } : {}}
              onClick={(e) => e.currentTarget.showPicker()}
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
          {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
        </div>

        {!formData.ongoing && (
          <div>
            <label className="block text-gray-700 mb-1">{t.endDate}</label>
            <div className="relative">
              <input
                type="date"
                name="endDate"
                value={formatDateForInput(formData.endDate)}
                onChange={(e) => handleDateChange("endDate", e.target.value)}
                disabled={formData.ongoing}
                className={`w-full p-2 pl-10 border ${errors.endDate ? "border-red-500" : "border-blue-200/60"} rounded-md ${formData.ongoing ? "bg-gray-100" : "cursor-pointer"} focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
                style={!errors.endDate && !formData.ongoing ? { borderColor: 'rgb(176, 196, 222)' } : {}}
                min={formatDateForInput(formData.startDate)}
                onClick={(e) => !formData.ongoing && e.currentTarget.showPicker()}
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
          placeholder={t.featureDescriptionPlaceholder}
          rows={4}
          className={`w-full p-2 border ${errors.description ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
          style={!errors.description ? { borderColor: 'rgb(176, 196, 222)' } : {}}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      <div>
        <label className="block text-gray-700 mb-1">Achievements</label>
        <div className="relative">
          <input
            type="text"
            name="achievements"
            value={formData.achievements || ""}
            onChange={handleChange}
            placeholder="Describe what results or goals you achieved during your time at this job"
            className="w-full p-2 pl-10 border border-blue-200/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40"
            style={{ borderColor: 'rgb(176, 196, 222)' }}
          />
          <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
      </div>

      {/* Company Website */}
      <div>
        <label className="block text-gray-700 mb-1">{t.companyWebsite}</label>
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
          {employerId ? t.saveChangesButton : t.addEmployment}
        </button>
      </div>
    </div>
  )
}
