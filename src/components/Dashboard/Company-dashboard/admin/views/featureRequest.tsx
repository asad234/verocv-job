"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { useBusinessAdminTranslations } from "@/utils/Businessadmintranslations"

const NAVY = "rgb(5,22,80)"

const fo = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(176,196,222,0.5)"
    e.currentTarget.style.borderColor = "rgb(176,196,222)"
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.boxShadow = ""
    e.currentTarget.style.borderColor = ""
  },
}

const inputCls = "w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white outline-none transition-colors"

export default function FeatureRequest() {
  const { t } = useBusinessAdminTranslations()

  const [formData, setFormData] = useState({
    featureName: "", featureDescription: "", experienceRating: "", contactInfo: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"" | "success" | "error">("")
  const [errorDetails, setErrorDetails] = useState("")

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    setIsSubmitting(true); setSubmitStatus(""); setErrorDetails("")
    try {
      const res = await fetch("/api/submit-feature-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        setSubmitStatus("success")
        setFormData({ featureName: "", featureDescription: "", experienceRating: "", contactInfo: "" })
      } else {
        setSubmitStatus("error")
        setErrorDetails(data.message || `HTTP ${res.status}`)
      }
    } catch (err) {
      setSubmitStatus("error")
      setErrorDetails((err as Error).message || "Network error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: NAVY }}>
            <Icon icon="tabler:bulb" className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t.featureRequestTitle}</h1>
          <p className="text-gray-500 text-sm mt-2">{t.featureRequestDesc}</p>
        </div>

        {/* Status banners */}
        {submitStatus === "success" && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
            <Icon icon="tabler:circle-check-filled" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 font-medium">{t.featureRequestSuccess}</p>
          </div>
        )}
        {submitStatus === "error" && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
            <div className="flex items-start gap-3">
              <Icon icon="tabler:alert-circle" className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">{t.featureRequestError}</p>
                {errorDetails && <p className="text-xs font-mono bg-white border border-red-100 rounded p-2 mt-2 text-red-700 whitespace-pre-wrap">{errorDetails}</p>}
                <p className="text-xs text-red-600 mt-1">{t.featureRequestErrorHelp}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">

          {/* Feature name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="featureName">
              {t.featureNameLabel} <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">{t.featureNameHelp}</p>
            <input
              id="featureName" name="featureName" type="text"
              value={formData.featureName} onChange={set}
              placeholder={t.featureNamePlaceholder}
              className={inputCls} {...fo}
              required disabled={isSubmitting}
            />
          </div>

          {/* Feature description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="featureDescription">
              {t.featureDescriptionLabel} <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">{t.featureDescriptionHelp}</p>
            <textarea
              id="featureDescription" name="featureDescription" rows={5}
              value={formData.featureDescription} onChange={set}
              placeholder={t.featureDescriptionPlaceholder}
              className={`${inputCls} resize-none`} {...fo}
              required disabled={isSubmitting}
            />
          </div>

          {/* Experience rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t.experienceRatingLabel}
            </label>
            <p className="text-xs text-gray-400 mb-2">{t.experienceRatingHelp}</p>
            <select
              name="experienceRating"
              value={formData.experienceRating} onChange={set}
              className={`${inputCls} cursor-pointer`} {...fo}
              disabled={isSubmitting}
            >
              <option value="">{t.selectRatingOption}</option>
              <option value="1">{t.ratingPoor}</option>
              <option value="2">{t.ratingFair}</option>
              <option value="3">{t.ratingGood}</option>
              <option value="4">{t.ratingVeryGood}</option>
              <option value="5">{t.ratingExcellent}</option>
            </select>
          </div>

          {/* Contact info */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="contactInfo">
              {t.contactInfoLabel}
            </label>
            <p className="text-xs text-gray-400 mb-2">{t.contactInfoHelp}</p>
            <input
              id="contactInfo" name="contactInfo" type="text"
              value={formData.contactInfo} onChange={set}
              placeholder={t.contactInfoPlaceholder}
              className={inputCls} {...fo}
              disabled={isSubmitting}
            />
          </div>

          {/* Submit */}
          <div className="pt-2 border-t border-gray-100 flex justify-center">
            <button
              type="button" onClick={handleSubmit} disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: NAVY }}
              onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.backgroundColor = "rgb(15,32,90)" }}
              onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.backgroundColor = NAVY }}>
              <Icon icon={isSubmitting ? "tabler:loader-2" : "tabler:send"} className={`w-4 h-4 ${isSubmitting ? "animate-spin" : ""}`} />
              {isSubmitting ? t.submittingButton : t.submitButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
