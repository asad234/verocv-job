"use client"

import { useState } from "react"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

const FeatureRequest = () => {
  const { t } = useDashboardTranslations()
  const [formData, setFormData] = useState({
    featureName: "",
    featureDescription: "",
    experienceRating: "",
    contactInfo: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState("")
  const [errorDetails, setErrorDetails] = useState("")

  const handleChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitStatus("")
    setErrorDetails("")

    try {
      console.log("Submitting form data:", formData)
      // API call to your backend endpoint
      const response = await fetch("/api/submit-feature-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      console.log("Response status:", response.status)
      const responseData = await response.json()
      console.log("Response data:", responseData)

      if (response.ok) {
        setSubmitStatus("success")
        setFormData({
          featureName: "",
          featureDescription: "",
          experienceRating: "",
          contactInfo: "",
        })
      } else {
        setSubmitStatus("error")
        const errorMsg = responseData.message || `HTTP ${response.status}: ${response.statusText}`
        const details = responseData.details ? JSON.stringify(responseData.details, null, 2) : ""
        setErrorDetails(`${errorMsg}${details ? "\n\nDetails:\n" + details : ""}`)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setSubmitStatus("error")
      // FIX: Assert 'error' as an Error type to access its 'message' property
      setErrorDetails((error as Error).message || "Network error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">{t.featureRequestTitle}</h1>
      <p className="mb-6">{t.featureRequestDescription}</p>

      {submitStatus === "success" && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {t.featureRequestSuccessMessage}
        </div>
      )}

      {submitStatus === "error" && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="font-semibold">{t.featureRequestErrorMessage}</div>
          {errorDetails && (
            <div className="mt-2 text-sm font-mono bg-gray-100 p-2 rounded whitespace-pre-wrap">{errorDetails}</div>
          )}
          <div className="mt-2">{t.featureRequestErrorHelp}</div>
        </div>
      )}

      <div>
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2" htmlFor="featureName">
            {t.featureNameLabel}
          </label>
          <p className="text-sm text-gray-500 mb-2">{t.featureNameHelp}</p>
          <input
            type="text"
            id="featureName"
            name="featureName"
            value={formData.featureName}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none transition-colors"
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
              e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = ''
              e.currentTarget.style.borderColor = ''
            }}
            placeholder={t.featureNamePlaceholder}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="mb-6">
          <label className="block text-lg font-medium mb-2" htmlFor="featureDescription">
            {t.featureDescriptionLabel}
          </label>
          <p className="text-sm text-gray-500 mb-2">{t.featureDescriptionHelp}</p>
          <textarea
            id="featureDescription"
            name="featureDescription"
            value={formData.featureDescription}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded h-32 focus:outline-none transition-colors"
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
              e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = ''
              e.currentTarget.style.borderColor = ''
            }}
            placeholder={t.featureDescriptionPlaceholder}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">{t.experienceRatingLabel}</label>
          <p className="text-sm text-gray-500 mb-2">{t.experienceRatingHelp}</p>
          <select
            name="experienceRating"
            value={formData.experienceRating}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none transition-colors"
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
              e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = ''
              e.currentTarget.style.borderColor = ''
            }}
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

        <div className="mb-6">
          <label className="block text-lg font-medium mb-2" htmlFor="contactInfo">
            {t.contactInfoLabel}
          </label>
          <p className="text-sm text-gray-500 mb-2">{t.contactInfoHelp}</p>
          <input
            type="text"
            id="contactInfo"
            name="contactInfo"
            value={formData.contactInfo}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none transition-colors"
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
              e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = ''
              e.currentTarget.style.borderColor = ''
            }}
            placeholder={t.contactInfoPlaceholder}
            disabled={isSubmitting}
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="py-2 px-6 rounded-xl transition-colors text-white"
          style={{
            backgroundColor: isSubmitting ? 'rgb(156, 163, 175)' : 'rgb(5, 22, 80)',
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'
            }
          }}
        >
          {isSubmitting ? t.submittingButton : t.submitButton}
        </button>
      </div>
    </div>
  )
}

export default FeatureRequest
