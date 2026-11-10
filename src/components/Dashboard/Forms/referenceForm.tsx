"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useProfileStore } from "@/utils/profileStore"
import type { Reference } from "@/types/payloadTypes"
import { useChangesStore } from "@/utils/changesStore"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

interface ReferenceFormProps {
  referenceId: string | null
  onCancel: () => void
  onComplete: () => void
}

export default function ReferenceForm({ referenceId, onCancel, onComplete }: ReferenceFormProps) {
  const { references: storedReferences, setReferences } = useProfileStore()
  const { addChange, editChange } = useChangesStore()
  const { t } = useDashboardTranslations()

  const [formData, setFormData] = useState<Partial<Reference>>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    company: "",
    positionTitle: "",
    relationship: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (referenceId) {
      const reference = storedReferences?.find((r) => r.id === referenceId)
      if (reference) {
        setFormData({
          firstName: reference.firstName,
          lastName: reference.lastName,
          email: reference.email,
          phoneNumber: reference.phoneNumber,
          company: reference.company,
          positionTitle: reference.positionTitle,
          relationship: reference.relationship,
        })
      } else {
        resetForm()
      }
    } else {
      resetForm()
    }
  }, [referenceId, storedReferences])

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      company: "",
      positionTitle: "",
      relationship: "",
    })
  }

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

  const handleSubmit = () => {
    try {
      const validationErrors: Record<string, string> = {}

      if (!formData.firstName) validationErrors.firstName = t.firstNameRequired
      if (!formData.lastName) validationErrors.lastName = t.lastNameRequired
      if (!formData.email) validationErrors.email = t.fieldRequired
      else if (!/\S+@\S+\.\S+/.test(formData.email)) validationErrors.email = t.fillRequiredFields
      if (!formData.phoneNumber) validationErrors.phoneNumber = t.phoneNumberRequired
      if (!formData.positionTitle) validationErrors.positionTitle = t.titleRequired
      if (!formData.relationship) validationErrors.relationship = t.fieldRequired

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }

      if (referenceId) {
        const updatedReferences =
          storedReferences?.map((r) => (r.id === referenceId ? ({ ...r, ...formData } as Reference) : r)) || []
        setReferences(updatedReferences, true)
        editChange("references", referenceId)
      } else {
        const newReference: Reference = {
          id: Math.random().toString(36).substring(2, 15),
          ...formData,
        } as Reference
        setReferences([...(storedReferences || []), newReference], true)
        addChange("references", newReference.id)
      }

      onComplete()
    } catch (error) {
      console.error("Error submitting reference:", error)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">
        {referenceId ? t.editReference : t.addNewReference}
      </h3>

      {/* First Name & Last Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 mb-1">
            {t.firstName} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder={t.firstNamePlaceholder}
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
            placeholder={t.lastNamePlaceholder}
            className={`w-full p-2 border ${errors.lastName ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
            style={!errors.lastName ? { borderColor: 'rgb(176, 196, 222)' } : {}}
          />
          {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-gray-700 mb-1">
          {t.email} <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder={t.emailPlaceholder}
          className={`w-full p-2 border ${errors.email ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
          style={!errors.email ? { borderColor: 'rgb(176, 196, 222)' } : {}}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-gray-700 mb-1">
          {t.phone} <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder={t.phoneNumberPlaceholder}
          className={`w-full p-2 border ${errors.phoneNumber ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
          style={!errors.phoneNumber ? { borderColor: 'rgb(176, 196, 222)' } : {}}
        />
        {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
      </div>

      {/* Company */}
      <div>
        <label className="block text-gray-700 mb-1">{t.companyName}</label>
        <input
          type="text"
          name="company"
          value={formData.company || ""}
          onChange={handleChange}
          placeholder={t.companyNamePlaceholder}
          className="w-full p-2 border border-blue-200/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40"
          style={{ borderColor: 'rgb(176, 196, 222)' }}
        />
      </div>

      {/* Position Title */}
      <div>
        <label className="block text-gray-700 mb-1">
          {t.title} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="positionTitle"
          value={formData.positionTitle}
          onChange={handleChange}
          placeholder={t.titlePlaceholder}
          className={`w-full p-2 border ${errors.positionTitle ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
          style={!errors.positionTitle ? { borderColor: 'rgb(176, 196, 222)' } : {}}
        />
        {errors.positionTitle && <p className="text-red-500 text-sm mt-1">{errors.positionTitle}</p>}
      </div>

      {/* Relationship */}
      <div>
        <label className="block text-gray-700 mb-1">
          {t.relationship} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="relationship"
          value={formData.relationship}
          onChange={handleChange}
          placeholder={t.relationship}
          className={`w-full p-2 border ${errors.relationship ? "border-red-500" : "border-blue-200/60"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
          style={!errors.relationship ? { borderColor: 'rgb(176, 196, 222)' } : {}}
        />
        {errors.relationship && <p className="text-red-500 text-sm mt-1">{errors.relationship}</p>}
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
          {referenceId ? t.saveChanges : t.addReference}
        </button>
      </div>
    </div>
  )
}
