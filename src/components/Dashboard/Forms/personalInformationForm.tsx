"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { PersonalInformation } from "@/types/payloadTypes"
import { useChangesStore } from "@/utils/changesStore"
import { usePersonalInfoStore } from "@/hooks/personal-information/personalInformationStore"
import { useDashboardTranslation } from "@/hooks/useDashboardTranslation"

interface PersonalInformationFormProps {
  onCancel: () => void
  onComplete: () => void
}

export default function PersonalInformationForm({ onCancel, onComplete }: PersonalInformationFormProps) {
  const { t } = useDashboardTranslation()
  const { personalInfo: storedPersonalInfo, setPersonalInfo } = usePersonalInfoStore()
  const { addChange, editChange, removeChange } = useChangesStore()
  const [formData, setFormData] = useState<PersonalInformation>(
    () =>
      storedPersonalInfo || {
        id: "",
        user: 0,
        createdAt: "",
        updatedAt: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        homeAddress: "",
        dateOfBirth: "",
        gender: "other",
        companyType: "",
        title: "",
        professionalPresentation: "",
        personalPresentation: "",
      },
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (storedPersonalInfo) {
      setFormData(storedPersonalInfo)
    }
  }, [storedPersonalInfo])

  console.log("stored:", storedPersonalInfo)

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

  const handleSubmit = () => {
    const validationErrors: Record<string, string> = {}
    if (!formData.firstName) validationErrors.firstName = t.firstNameRequired
    if (!formData.lastName) validationErrors.lastName = t.lastNameRequired

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setPersonalInfo(formData, true)
    addChange("personalInfo", "main")
    onComplete()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">{t.editPersonalInformation}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 mb-1">
            {t.firstName} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder={t.firstName}
            className={`w-full p-2 border ${errors.firstName ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
            style={!errors.firstName ? { borderColor: 'rgb(176, 196, 222)' } : {}}
          />
          {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label className="block text-gray-700 mb-1">
            {t.lastName} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder={t.lastName}
            className={`w-full p-2 border ${errors.lastName ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
            style={!errors.lastName ? { borderColor: 'rgb(176, 196, 222)' } : {}}
          />
          {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <label className="block text-gray-700 mb-1">{t.title}</label>
        <input
          type="text"
          name="title"
          value={formData.title || ""}
          onChange={handleChange}
          placeholder={t.titlePlaceholder}
          className={`w-full p-2 border ${errors.title ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
          style={!errors.title ? { borderColor: 'rgb(176, 196, 222)' } : {}}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-gray-700 mb-1">{t.professionalPresentation}</label>
        <textarea
          name="professionalPresentation"
          value={formData.professionalPresentation || ""}
          onChange={handleChange}
          placeholder={t.professionalPresentationPlaceholder}
          className="w-full p-2 border border-blue-200/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40"
          style={{ borderColor: 'rgb(176, 196, 222)' }}
          rows={4}
        />
      </div>

      <div>
        <label className="block text-gray-700 mb-1">{t.personalPresentation}</label>
        <textarea
          name="personalPresentation"
          value={formData.personalPresentation || ""}
          onChange={handleChange}
          placeholder={t.personalPresentationPlaceholder}
          className="w-full p-2 border border-blue-200/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40"
          style={{ borderColor: 'rgb(176, 196, 222)' }}
          rows={4}
        />
      </div>

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
          {t.saveInformation}
        </button>
      </div>
    </div>
  )
}
