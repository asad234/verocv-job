"use client"

import type React from "react"
import { useState } from "react"
import { Icon } from "@iconify/react"
import { useManagerTranslations } from "@/utils/Managertranslations"

const NAVY = "rgb(5,22,80)"

const inputCls = "w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white outline-none transition-all focus:ring-2 focus:ring-blue-200 focus:border-blue-300"

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

export default function ManagerFeatureRequest() {
  const { language } = useManagerTranslations()
  const isEn = language === "en"

  const [formData, setFormData] = useState({
    featureName: "", featureDescription: "", experienceRating: "", contactInfo: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"" | "success" | "error">("")
  const [errorDetails, setErrorDetails] = useState("")

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    if (!formData.featureName.trim() || !formData.featureDescription.trim()) return
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

  const ratings = isEn
    ? [{ val: "1", label: "Poor" }, { val: "2", label: "Fair" }, { val: "3", label: "Good" }, { val: "4", label: "Very Good" }, { val: "5", label: "Excellent" }]
    : [{ val: "1", label: "Dålig" }, { val: "2", label: "Okej" }, { val: "3", label: "Bra" }, { val: "4", label: "Mycket bra" }, { val: "5", label: "Utmärkt" }]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: NAVY }}>
            <Icon icon="tabler:bulb" className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            {isEn ? "Feature Request" : "Funktionsförfrågan"}
          </h1>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
            {isEn
              ? "Have an idea that would improve the platform? We'd love to hear it."
              : "Har du en idé som skulle förbättra plattformen? Vi vill gärna höra den."}
          </p>
        </div>

        {/* Success banner */}
        {submitStatus === "success" && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-green-50 border border-green-200">
            <Icon icon="tabler:circle-check-filled" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">
                {isEn ? "Request submitted!" : "Förfrågan skickad!"}
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                {isEn ? "Thank you — our team will review your suggestion." : "Tack — vårt team granskar ditt förslag."}
              </p>
            </div>
          </div>
        )}

        {/* Error banner */}
        {submitStatus === "error" && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200">
            <div className="flex items-start gap-3">
              <Icon icon="tabler:alert-circle" className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {isEn ? "Submission failed. Please try again." : "Det gick inte att skicka. Försök igen."}
                </p>
                {errorDetails && (
                  <p className="text-xs font-mono bg-white border border-red-100 rounded-lg p-2 mt-2 text-red-700 whitespace-pre-wrap">
                    {errorDetails}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">

          {/* Feature name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {isEn ? "Feature name" : "Funktionsnamn"} <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              {isEn ? "Give your idea a short, descriptive title." : "Ge din idé en kort, beskrivande titel."}
            </p>
            <input
              name="featureName" type="text"
              value={formData.featureName} onChange={set}
              placeholder={isEn ? "e.g. Export team availability as PDF" : "t.ex. Exportera teamtillgänglighet som PDF"}
              className={inputCls} {...fo} disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {isEn ? "Description" : "Beskrivning"} <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              {isEn
                ? "Describe the feature in detail. What problem does it solve? How should it work?"
                : "Beskriv funktionen i detalj. Vilket problem löser den? Hur ska den fungera?"}
            </p>
            <textarea
              name="featureDescription" rows={5}
              value={formData.featureDescription} onChange={set}
              placeholder={isEn
                ? "As a manager I want to… so that…"
                : "Som chef vill jag kunna… så att…"}
              className={`${inputCls} resize-none`} {...fo} disabled={isSubmitting}
            />
          </div>

          {/* Experience rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {isEn ? "Current experience rating" : "Betyg på nuvarande upplevelse"}
            </label>
            <p className="text-xs text-gray-400 mb-2">
              {isEn ? "How would you rate your current experience with the platform?" : "Hur betygsätter du din nuvarande upplevelse av plattformen?"}
            </p>
            <div className="flex gap-2 flex-wrap">
              {ratings.map(r => (
                <button key={r.val} type="button"
                  onClick={() => setFormData(p => ({ ...p, experienceRating: r.val }))}
                  className={`flex-1 min-w-[80px] py-2.5 rounded-xl border text-sm font-medium transition-all ${formData.experienceRating === r.val
                      ? "text-white shadow-sm border-transparent"
                      : "border-gray-200 text-gray-600 hover:border-blue-200 hover:bg-blue-50/30"
                    }`}
                  style={formData.experienceRating === r.val ? { backgroundColor: NAVY } : {}}>
                  {r.val} — {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact info */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {isEn ? "Contact info (optional)" : "Kontaktuppgifter (valfritt)"}
            </label>
            <p className="text-xs text-gray-400 mb-2">
              {isEn
                ? "Leave your email if you'd like us to follow up with you."
                : "Lämna din e-post om du vill att vi återkommer till dig."}
            </p>
            <input
              name="contactInfo" type="text"
              value={formData.contactInfo} onChange={set}
              placeholder={isEn ? "your@email.com" : "din@epost.se"}
              className={inputCls} {...fo} disabled={isSubmitting}
            />
          </div>

          {/* Submit */}
          <div className="pt-2 border-t border-gray-100 flex justify-center">
            <button
              type="button" onClick={handleSubmit} disabled={isSubmitting || !formData.featureName.trim() || !formData.featureDescription.trim()}
              className="flex items-center gap-2 px-8 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: NAVY }}
              onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.backgroundColor = "rgb(15,32,90)" }}
              onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.backgroundColor = NAVY }}>
              <Icon icon={isSubmitting ? "tabler:loader-2" : "tabler:send"}
                className={`w-4 h-4 ${isSubmitting ? "animate-spin" : ""}`} />
              {isSubmitting
                ? (isEn ? "Submitting…" : "Skickar…")
                : (isEn ? "Submit Request" : "Skicka förfrågan")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
