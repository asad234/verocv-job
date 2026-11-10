"use client"
import type React from "react"
import { useState } from "react"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

interface FeedbackFormData {
  rating: number | null
  perfectTenFeedback: string
  changeRemoveFeedback: string
}

const FeedbackForm: React.FC = () => {
  const { t } = useDashboardTranslations()
  const [formData, setFormData] = useState<FeedbackFormData>({
    rating: 7,
    perfectTenFeedback: "",
    changeRemoveFeedback: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  const handleRatingChange = (rating: number): void => {
    setFormData((prev) => ({ ...prev, rating }))
  }

  const handleTextChange = (field: "perfectTenFeedback" | "changeRemoveFeedback", value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (): Promise<void> => {
    if (formData.rating === null) {
      alert(t.selectRating)
      return
    }

    setIsSubmitting(true)
    setSubmissionStatus({ type: null, message: "" })

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmissionStatus({
          type: "success",
          message: t.feedbackSuccess,
        })
        // Reset form
        setFormData({
          rating: 7,
          perfectTenFeedback: "",
          changeRemoveFeedback: "",
        })
      } else {
        setSubmissionStatus({
          type: "error",
          message: result.error || t.feedbackError,
        })
      }
    } catch (error) {
      setSubmissionStatus({
        type: "error",
        message: t.networkError,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const ratingItems = Array.from({ length: 10 }, (_, i) => i + 1)

  return (
    <div>
      {/* Glassmorphism Container */}
      <div className="relative backdrop-blur-xl bg-white/20 border border-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-3xl">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl pointer-events-none" />
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-block">
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: 'rgb(5, 22, 80)' }}
              >
                {t.feedbackTitle}
              </h1>
            </div>
            <p className="text-gray-600 font-medium">{t.feedbackSubtitle}</p>
          </div>

          {/* Success/Error Messages */}
          {submissionStatus.type && (
            <div
              className={`mb-8 p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${submissionStatus.type === "success"
                  ? "bg-emerald-50/80 border-emerald-200/50 text-emerald-800 shadow-lg shadow-emerald-100/50"
                  : "bg-red-50/80 border-red-200/50 text-red-800 shadow-lg shadow-red-100/50"
                }`}
            >
              <div className="flex items-center">
                {submissionStatus.type === "success" ? (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center mr-4">
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <span className="font-medium">{submissionStatus.message}</span>
              </div>
            </div>
          )}

          {/* Rating Section */}
          <div className="mb-10">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">{t.rateExperience}</h2>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-3 mb-6">
                {ratingItems.map((rating) => (
                  <div key={rating} className="flex flex-col items-center">
                    <label className="cursor-pointer group">
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        checked={formData.rating === rating}
                        onChange={() => handleRatingChange(rating)}
                        className="sr-only"
                        disabled={isSubmitting}
                      />
                      <div
                        className={`w-12 h-12 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center font-bold text-sm group-hover:scale-110 group-hover:shadow-lg ${formData.rating === rating
                            ? "border-transparent text-white shadow-xl relative z-20"
                            : "bg-white/50 backdrop-blur-sm border-gray-200 text-gray-600 hover:bg-white/70 relative z-10"
                          }`}
                        style={
                          formData.rating === rating
                            ? {
                              background: 'linear-gradient(to right, rgb(5, 22, 80), rgb(15, 32, 100))',
                              boxShadow: '0 10px 25px -5px rgba(5, 22, 80, 0.3)',
                            }
                            : {}
                        }
                        onMouseEnter={(e) => {
                          if (formData.rating !== rating) {
                            e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (formData.rating !== rating) {
                            e.currentTarget.style.borderColor = ''
                          }
                        }}
                      >
                        {rating}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-500 px-2">
                <span>{t.terrible}</span>
                <span>{t.amazing}</span>
              </div>
            </div>
          </div>

          {/* First Question */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.perfectTenQuestion}</h3>
            <div className="relative">
              <textarea
                value={formData.perfectTenFeedback}
                onChange={(e) => handleTextChange("perfectTenFeedback", e.target.value)}
                className="w-full h-36 backdrop-blur-sm bg-white/30 border border-white/40 rounded-2xl p-6 text-gray-800 placeholder-gray-500 resize-none transition-all duration-300 focus:outline-none shadow-lg"
                style={{
                  '--focus-ring-color': 'rgba(176, 196, 222, 0.5)',
                  '--focus-border-color': 'rgb(176, 196, 222)',
                } as React.CSSProperties}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(176, 196, 222, 0.2)'
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.backgroundColor = ''
                }}
                placeholder={t.perfectTenPlaceholder}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Second Question */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.changeRemoveQuestion}</h3>
            <div className="relative">
              <textarea
                value={formData.changeRemoveFeedback}
                onChange={(e) => handleTextChange("changeRemoveFeedback", e.target.value)}
                className="w-full h-36 backdrop-blur-sm bg-white/30 border border-white/40 rounded-2xl p-6 text-gray-800 placeholder-gray-500 resize-none transition-all duration-300 focus:outline-none shadow-lg"
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(176, 196, 222, 0.2)'
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.backgroundColor = ''
                }}
                placeholder={t.changeRemovePlaceholder}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="relative inline-flex items-center justify-center px-12 py-4 text-white font-semibold rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
              style={{
                background: isSubmitting
                  ? 'linear-gradient(to right, rgba(5, 22, 80, 0.5), rgba(15, 32, 100, 0.5))'
                  : 'linear-gradient(to right, rgb(5, 22, 80), rgb(15, 32, 100))',
                boxShadow: '0 10px 25px -5px rgba(5, 22, 80, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.boxShadow = '0 20px 30px -5px rgba(5, 22, 80, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(5, 22, 80, 0.3)'
                }
              }}
            >
              {isSubmitting && (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              <span className="relative">{isSubmitting ? t.submitting : t.submitFeedback}</span>
              {/* Button shine effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeedbackForm
