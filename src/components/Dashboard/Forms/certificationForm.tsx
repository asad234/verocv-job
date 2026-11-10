"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Calendar } from "lucide-react"
import { useProfileStore } from "@/utils/profileStore"
import type { Certification } from "@/utils/types"
import { formatDate } from "@/utils/formatDate"
import { useChangesStore } from "@/utils/changesStore"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

interface CertificationFormProps {
  certificationId: string | null
  onCancel: () => void
  onComplete: () => void
}

export default function CertificationForm({
  certificationId,
  onCancel,
  onComplete,
}: CertificationFormProps) {
  const { certifications: storedCertifications, setCertifications } = useProfileStore()
  const { addChange, editChange } = useChangesStore()
  const { t } = useDashboardTranslations()

  const [formData, setFormData] = useState<Partial<Certification>>({
    type: "certificate",
    title: "",
    startDate: new Date(),
    validDate: new Date(),
    code: "",
    issuer: "",
    supplier: "",
    description: "",
    link: "",
    noExpiry: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [doesntExpire, setDoesntExpire] = useState(false)

  // ✅ Load data when editing
  useEffect(() => {
    if (certificationId) {
      const certification = storedCertifications?.find((c) => c.id === certificationId)
      if (certification) {
        setFormData({
          ...certification,
          validDate: certification.validDate ? new Date(certification.validDate) : new Date(),
        })
        setDoesntExpire(certification.noExpiry || false)
      }
    } else {
      setFormData({
        type: "certificate",
        title: "",
        startDate: new Date(),
        validDate: new Date(),
        code: "",
        issuer: "",
        supplier: "",
        description: "",
        link: "",
        noExpiry: false,
      })
      setDoesntExpire(false)
    }
  }, [certificationId, storedCertifications])

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

  const handleDateChange = (name: string, date: Date) => {
    setFormData((prev) => ({ ...prev, [name]: date }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleDoesntExpireChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setDoesntExpire(checked)
    setFormData((prev) => ({
      ...prev,
      noExpiry: checked,
      validDate: checked ? null : new Date(),
    }))
    if (checked && errors.validDate) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.validDate
        return newErrors
      })
    }
  }

  const handleSubmit = () => {
    try {
      const validationErrors: Record<string, string> = {}

      if (!formData.title) validationErrors.title = t.titleRequired
      if (!formData.startDate) validationErrors.startDate = t.startDateRequired
      if (!doesntExpire && !formData.validDate)
        validationErrors.validDate = t.validDateRequired
      if (!formData.issuer) validationErrors.issuer = t.issuerRequired

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }

      const certificationData: Certification = {
        ...(formData as Certification),
        noExpiry: doesntExpire,
        validDate: doesntExpire ? null : formData.validDate!,
      }

      if (certificationId) {
        const updatedCertifications =
          storedCertifications?.map((c) =>
            c.id === certificationId ? { ...c, ...certificationData } : c
          ) || []
        setCertifications(updatedCertifications, true)
        editChange("certifications", certificationId)
      } else {
        const newCertification: Certification = {
          ...certificationData,
          id: Math.random().toString(36).substring(2, 15),
        } as Certification
        setCertifications([...(storedCertifications || []), newCertification], true)
        addChange("certifications", newCertification.id)
      }

      onComplete()
    } catch (error) {
      console.error("Error submitting certification:", error)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">
        {certificationId ? t.editCertification : t.addNewCertification}
      </h3>

      {/* Type */}
      <div>
        <label className="block text-gray-700 mb-1">{t.type}</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full p-2 border border-blue-200/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40"
          style={{ borderColor: 'rgb(176, 196, 222)' }}
        >
          <option value="certificate">{t.certificate}</option>
          <option value="course">{t.course}</option>
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="block text-gray-700 mb-1">
          {t.certificateTitle} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder={t.certificateTitle}
          className={`w-full p-2 border ${errors.title ? "border-red-500" : "border-blue-200/60"
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
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
              value={
                formData.startDate
                  ? formatDate(formData.startDate.toString(), false)
                  : ""
              }
              onChange={(e) => handleDateChange("startDate", new Date(e.target.value))}
              className={`w-full p-2 pl-10 border ${errors.startDate ? "border-red-500" : "border-blue-200/60"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
              style={!errors.startDate ? { borderColor: 'rgb(176, 196, 222)' } : {}}
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          {errors.startDate && (
            <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center">
            <label className="block text-gray-700 mb-1">
              {t.validUntil} {!doesntExpire && <span className="text-red-500">*</span>}
            </label>
            <div className="flex items-center mb-1">
              <input
                type="checkbox"
                id="doesntExpire"
                checked={doesntExpire}
                onChange={handleDoesntExpireChange}
                className="mr-2 h-4 w-4"
              />
              <label htmlFor="doesntExpire" className="text-sm text-gray-700">
                {t.doesntExpire}
              </label>
            </div>
          </div>
          {!doesntExpire && (
            <div className="relative">
              <input
                type="date"
                name="validDate"
                value={
                  formData.validDate
                    ? formatDate(formData.validDate.toString(), false)
                    : ""
                }
                onChange={(e) => handleDateChange("validDate", new Date(e.target.value))}
                className={`w-full p-2 pl-10 border ${errors.validDate ? "border-red-500" : "border-blue-200/60"
                  } rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
                style={!errors.validDate ? { borderColor: 'rgb(176, 196, 222)' } : {}}
                min={
                  formData.startDate
                    ? formatDate(formData.startDate.toString(), false)
                    : ""
                }
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          )}
          {errors.validDate && (
            <p className="text-red-500 text-sm mt-1">{errors.validDate}</p>
          )}
          {doesntExpire && (
            <p className="text-sm text-gray-500 mt-1">
              {t.certificationNeverExpires}
            </p>
          )}
        </div>
      </div>

      {/* Certificate Code */}
      <div>
        <label className="block text-gray-700 mb-1">{t.certificateCode}</label>
        <input
          type="text"
          name="code"
          value={formData.code || ""}
          onChange={handleChange}
          placeholder={t.certificateCodePlaceholder}
          className="w-full p-2 border border-blue-200/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40"
          style={{ borderColor: 'rgb(176, 196, 222)' }}
        />
      </div>

      {/* Issuer */}
      <div>
        <label className="block text-gray-700 mb-1">
          {t.issuer} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="issuer"
          value={formData.issuer}
          onChange={handleChange}
          placeholder={t.issuingOrganization}
          className={`w-full p-2 border ${errors.issuer ? "border-red-500" : "border-blue-200/60"
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40`}
          style={!errors.issuer ? { borderColor: 'rgb(176, 196, 222)' } : {}}
        />
        {errors.issuer && (
          <p className="text-red-500 text-sm mt-1">{errors.issuer}</p>
        )}
      </div>

      {/* Supplier */}
      <div>
        <label className="block text-gray-700 mb-1">{t.supplier}</label>
        <input
          type="text"
          name="supplier"
          value={formData.supplier || ""}
          onChange={handleChange}
          placeholder={t.supplierPlaceholder}
          className="w-full p-2 border border-blue-200/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40"
          style={{ borderColor: 'rgb(176, 196, 222)' }}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-gray-700 mb-1">{t.description}</label>
        <textarea
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          placeholder={t.provideAdditionalInformation}
          className="w-full p-2 border border-blue-200/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40"
          style={{ borderColor: 'rgb(176, 196, 222)' }}
        />
      </div>

      {/* Link */}
      <div>
        <label className="block text-gray-700 mb-1">{t.link}</label>
        <input
          type="url"
          name="link"
          value={formData.link || ""}
          onChange={handleChange}
          placeholder={t.linkPlaceholder}
          className="w-full p-2 border border-blue-200/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200/40"
          style={{ borderColor: 'rgb(176, 196, 222)' }}
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 transition-colors duration-300"
        >
          {t.cancel}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 rounded-md text-white transition-all duration-300 hover:shadow-lg"
          style={{ backgroundColor: 'rgb(5, 22, 80)' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          {certificationId ? t.saveChanges : t.addCertification}
        </button>
      </div>
    </div>
  )
}
