"use client"

import { useState, useRef } from "react"
import type React from "react"
import { Upload, XCircle, CheckCircle2, Sparkles, Brain, FileText, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"
import { useProfileStore } from "@/utils/profileStore"
import { useDashboardTranslation } from "@/hooks/useDashboardTranslation"
import { toast } from "sonner"
import posthog from "posthog-js"
import { getFileType, processResumeFile, sendToExtractionAPI } from "@/lib/resumeProcessor"
import { detectMissingFields } from "@/lib/detectMissingFields"
import { SectionType } from "@/utils/types"

const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

interface ProfileDocumentUploaderProps {
  onProfileUpdated?: (data: any) => void
}

const parseDateString = (dateString: string | undefined): Date | undefined => {
  if (!dateString) return undefined
  try {
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? undefined : date
  } catch {
    return undefined
  }
}

const convertDatesInProfileData = (data: any): any => {
  if (Array.isArray(data)) return data.map(convertDatesInProfileData)
  if (typeof data === "object" && data !== null) {
    const newObj: any = {}
    for (const key in data) {
      if (!data.hasOwnProperty(key)) continue
      const value = data[key]
      const isDateField = ["startDate", "endDate", "validDate", "completionDate", "dateOfBirth", "birthdate"].includes(key)
      if (typeof value === "string" && isDateField) {
        newObj[key] = parseDateString(value)
      } else if (typeof value === "object" && value !== null) {
        newObj[key] = convertDatesInProfileData(value)
      } else {
        newObj[key] = value
      }
    }
    return newObj
  }
  return data
}

export default function ProfileDocumentUploader({ onProfileUpdated }: ProfileDocumentUploaderProps) {
  const { t } = useDashboardTranslation()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // ── Missing fields modal state ────────────────────────────────────────────
  const [showMissingModal, setShowMissingModal] = useState(false)
  const [missingIssues, setMissingIssues] = useState<any[]>([])
  const [pendingResume, setPendingResume] = useState<any>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    setProjectDetails, setSkills, setLanguages,
    setReferences, setCertifications, setEmployers, setEducation,
    setPersonalInformation
  } = useProfileStore()

  // ── File helpers ──────────────────────────────────────────────────────────

  const handleFileSelection = (file: File | null) => {
    setError(null)
    setSuccessMessage(null)
    setSelectedFile(file)
  }

  const handleRemoveFile = () => {
    handleFileSelection(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const validateAndSelect = (file: File) => {
    if (!getFileType(file)) {
      setError("Unsupported file type. Please upload a PDF, DOCX, or DOC file.")
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File size exceeds ${MAX_FILE_SIZE_MB}MB`)
      return
    }
    handleFileSelection(file)
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndSelect(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) validateAndSelect(file)
  }

  // ── Commit to stores ──────────────────────────────────────────────────────

  function applyToStores(resume: any) {
    const projects = resume.projects ?? []
    const skills = resume.skills ?? []
    const languages = resume.languages ?? []
    const references = resume.references ?? []
    const certifications = resume.certifications ?? []
    const employers = resume.experience ?? []
    const education = resume.education ?? []

    setProjectDetails(projects)
    setSkills(skills)
    setLanguages(languages)
    setReferences(references)
    setCertifications(certifications)
    setEmployers(employers)
    setEducation(education)

    const sectionMap: [SectionType, any[]][] = [
      ["projectDetails", projects],
      ["skills", skills],
      ["languages", languages],
      ["references", references],
      ["certifications", certifications],
      ["employers", employers],
      ["education", education],
    ]

    const totalItems = sectionMap.reduce((sum, [, items]) => sum + items.length, 0)
    toast.success(
      t.successfullyExtractedItems.replace("{count}", String(totalItems)),
      { duration: 8000 }
    )
    setSuccessMessage(t.successfullyExtractedItems.replace("{count}", String(totalItems)))
    handleRemoveFile()
  }

  // ── Main handler ──────────────────────────────────────────────────────────

  async function handleUploadAndFillProfile() {
    //document uploader
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    try {
      if (!selectedFile) throw new Error(t.noFileSelected)
      if (!getFileType(selectedFile)) throw new Error("Unsupported file type. Please upload a PDF, DOCX, or image.")
      if (selectedFile.size > MAX_FILE_SIZE_BYTES)
        throw new Error(t.fileSizeExceeds.replace("{size}", String(MAX_FILE_SIZE_MB)))

      setLoadingMessage(t.extractingWithAI)

      const form = new FormData()
      form.append("file", selectedFile)

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PYTHON_SERVER_URL}/parse-resume`,
        { method: "POST", body: form }
      )

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail ?? "Resume parsing failed")
      }

      // ── Read SSE stream ───────────────────────────────────────────────────────
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let rawData: any = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE events are separated by double newlines
        const events = buffer.split("\n\n")
        buffer = events.pop() ?? ""  // keep incomplete last chunk

        for (const raw of events) {
          if (!raw.trim()) continue

          // Parse "event: X\ndata: {...}"
          const eventMatch = raw.match(/^event:\s*(\w+)/m)
          const dataMatch = raw.match(/^data:\s*(.+)$/m)
          if (!eventMatch || !dataMatch) continue

          const event = eventMatch[1]
          const payload = JSON.parse(dataMatch[1]!)

          if (event === "status" || event === "progress") {
            // Optional: update a loading message with progress
            // setLoadingMessage(payload.message ?? t.extractingWithAI)
            continue
          }

          if (event === "error") {
            throw new Error(payload.detail ?? "Resume parsing failed")
          }

          if (event === "done") {
            rawData = payload.data
          }
        }
      }

      if (!rawData) throw new Error("No data returned from parser")

      posthog.capture("resume_parse_success", { fileType: getFileType(selectedFile) })

      // ── Apply to profile ──────────────────────────────────────────────────────
      setLoadingMessage(t.fillingYourProfile)
      const resume = convertDatesInProfileData(rawData)
      console.log("Raw resume before detection:", JSON.stringify(resume, null, 2))

      const issues = detectMissingFields(resume)
      console.log("Issues found:", issues.length)

      if (issues.length > 0) {
        setPendingResume(resume)
        setMissingIssues(issues)
        setExpandedCategory(issues[0]?.category ?? null)
        setShowMissingModal(true)
        setLoading(false)
        setLoadingMessage("")
        return
      }

      applyToStores(resume)
      onProfileUpdated?.(rawData)

    } catch (err: any) {
      posthog.capture("resume_parse_error", {
        message: err.message || "Unknown error",
        fileType: getFileType(selectedFile!),
      })
      const message = err instanceof Error ? err.message : t.unknownErrorOccurred
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
      setLoadingMessage("")
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mb-6 rounded-xl shadow-md overflow-hidden bg-white">

      {/* ── Missing fields modal ─────────────────────────────────────────── */}
      {showMissingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl border border-gray-200 w-full max-w-lg flex flex-col"
            style={{ maxHeight: "80vh" }}>

            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Some fields need attention</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {missingIssues.reduce((sum, c) =>
                      sum + c.items.reduce((s: number, i: any) => s + i.missing.length, 0), 0
                    )} missing fields across {missingIssues.length} {missingIssues.length === 1 ? "section" : "sections"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowMissingModal(false); setPendingResume(null) }}
                className="text-gray-400 hover:text-gray-600 ml-4"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {missingIssues.map((category) => (
                <div key={category.category} className="rounded-lg border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(
                      expandedCategory === category.category ? null : category.category
                    )}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{category.icon}</span>
                      <span className="font-medium text-sm text-gray-800">{category.category}</span>
                      <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                        {category.items.reduce((s: number, i: any) => s + i.missing.length, 0)} missing
                      </span>
                    </div>
                    {expandedCategory === category.category
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </button>

                  {expandedCategory === category.category && (
                    <div className="divide-y divide-gray-100">
                      {category.items.map((item: any, idx: number) => (
                        <div key={idx} className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-700 mb-1.5">{item.name}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {item.missing.map((f: any) => (
                              <span key={f.field}
                                className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                                {f.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex gap-2 justify-end p-4 border-t border-gray-100">
              <button
                onClick={() => { setShowMissingModal(false); setPendingResume(null) }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Review manually
              </button>
              <button
                onClick={() => {
                  setShowMissingModal(false)
                  if (pendingResume) {
                    applyToStores(pendingResume)
                    onProfileUpdated?.(pendingResume)
                  }
                  setPendingResume(null)
                }}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                style={{ backgroundColor: "rgb(5, 22, 80)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(15, 32, 90)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgb(5, 22, 80)")}
              >
                Accept anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Collapsible header ───────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between cursor-pointer p-6 bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <FileText className="w-6 h-6 mr-4" style={{ color: "rgb(5, 22, 80)" }} />
          <div>
            <h3 className="font-semibold text-xl">{t.updateProfileFromDocument}</h3>
            <p className="text-sm text-gray-600 mt-1">{t.uploadAdditionalDocuments}</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
      </div>

      {isExpanded && (
        <div className="p-6 space-y-4">
          <div
            className={`border-2 rounded-lg p-8 flex flex-col items-center justify-center transition-colors
              ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"}
              ${selectedFile ? "border-solid bg-gray-50" : "border-dashed"}
              ${loading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !loading && !selectedFile && fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.docx,.doc"
              disabled={loading || !!selectedFile}
            />

            {!selectedFile ? (
              <>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "rgba(5, 22, 80, 0.1)" }}>
                  <Upload className="w-6 h-6" style={{ color: "rgb(5, 22, 80)" }} />
                </div>
                <p className="text-gray-700 text-center">
                  {t.dragDropDocumentHere}{" "}
                  <span className="font-semibold" style={{ color: "rgb(5, 22, 80)" }}>
                    {t.clickToBrowse}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {t.maxFileSizePDFOnly.replace("{size}", String(MAX_FILE_SIZE_MB))}
                </p>
              </>
            ) : (
              <div className="flex items-center space-x-3 text-gray-800 font-medium">
                <span className="truncate max-w-[calc(100%-40px)]">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveFile() }}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                  disabled={loading}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-lg w-full" style={{ backgroundColor: "rgba(176, 196, 222, 0.2)" }}>
                <p className="text-sm text-center" style={{ color: "rgb(5, 22, 80)" }}>
                  <strong>{t.notte}:</strong> {t.aiWillMergeDocument}
                </p>
              </div>
              <button
                type="button"
                onClick={handleUploadAndFillProfile}
                disabled={loading}
                className="flex items-center justify-center gap-3 px-6 py-3 rounded-lg text-white font-medium transition-colors shadow-md"
                style={{ backgroundColor: loading ? "#ccc" : "rgb(5, 22, 80)" }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = "rgb(15, 32, 90)")}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = "rgb(5, 22, 80)")}
              >
                {loading ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    <span>{loadingMessage || t.analyzing}</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-6 h-6" />
                    <span>{t.uploadUpdateProfile}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
              <div className="flex items-start justify-between">
                <p className="font-semibold flex items-center">
                  <XCircle className="w-5 h-5 mr-2" />{error}
                </p>
                <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800 ml-4">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200 flex items-center justify-between">
              <p className="font-semibold flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2" />{successMessage}
              </p>
              <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800 ml-4">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[9999]">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm w-full">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-dashed animate-spin"
                style={{ borderTopColor: "rgb(5, 22, 80)", borderRightColor: "rgb(5, 22, 80)" }} />
              <div className="absolute inset-0 rounded-full border-4 border-dotted animate-spin-reverse"
                style={{ borderBottomColor: "rgb(176, 196, 222)", borderLeftColor: "rgb(176, 196, 222)" }} />
            </div>
            <p className="text-xl font-bold text-gray-800 mb-2">{loadingMessage}</p>
            <p className="text-gray-600 text-sm">{t.pleaseWait}</p>
          </div>
        </div>
      )}
    </div>
  )
}