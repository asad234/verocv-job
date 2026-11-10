//file used
// used to upload CV and extract profile data using AI. This is used in the onboarding flow and in the profile creation flow.
"use client"

import { useState, useRef } from "react"
import type React from "react"
import { Upload, XCircle, CheckCircle2, Sparkles, Brain, FileText } from "lucide-react"
import { useProfileStore } from "@/utils/profileStore"
import { usePersonalInfoStore } from "@/hooks/personal-information/personalInformationStore"
import { useChangesStore } from "@/utils/changesStore"
import { useDashboardTranslation } from "@/hooks/useDashboardTranslation"
import { toast } from "sonner"
import posthog from "posthog-js"
import { getFileType, processResumeFile, sendToExtractionAPI } from "@/lib/resumeProcessor"
import { SectionType } from "@/utils/types"

const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

interface ProfileCreationUploaderProps {
  onProfileFilled?: () => void
  onFileSelected?: (hasFile: boolean) => void
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

export default function ProfileCreationUploader({ onProfileFilled, onFileSelected }: ProfileCreationUploaderProps) {
  const { t } = useDashboardTranslation()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    setProfile, setProjectDetails, setSkills, setLanguages,
    setReferences, setCertifications, setEmployers, setEducation, setPersonalInformation
  } = useProfileStore()
  const { setPersonalInfo } = usePersonalInfoStore()
  const { markItemAsAdded } = useChangesStore()

  // ── File selection helpers ────────────────────────────────────────────────

  const handleFileSelection = (file: File | null) => {
    setError(null)
    setSuccessMessage(null)
    setSelectedFile(file)
    onFileSelected?.(!!file)
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

  // ── Main upload handler ───────────────────────────────────────────────────

  async function handleUploadAndFillProfile() {
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    try {
      if (!selectedFile) throw new Error(t.noFileSelected)
      if (!getFileType(selectedFile)) throw new Error("Unsupported file type. Please upload a PDF, DOCX, or DOC file.")
      if (selectedFile.size > MAX_FILE_SIZE_BYTES)
        throw new Error(t.fileSizeExceeds.replace("{size}", String(MAX_FILE_SIZE_MB)))

      // ── Step 1 & 2: Send file to FastAPI — extracts text + calls OpenAI ────────
      setLoadingMessage(t.analyzingCV)

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

      setLoadingMessage(t.extractingWithAI)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let rawData: any = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const events = buffer.split("\n\n")
        buffer = events.pop() ?? ""

        for (const raw of events) {
          if (!raw.trim()) continue
          const eventMatch = raw.match(/^event:\s*(\w+)/m)
          const dataMatch = raw.match(/^data:\s*(.+)$/m)
          if (!eventMatch || !dataMatch) continue
          const event = eventMatch[1]
          const payload = JSON.parse(dataMatch[1]!)
          if (event === "status" || event === "progress") continue
          if (event === "error") throw new Error(payload.detail ?? "Resume parsing failed")
          if (event === "done") rawData = payload.data
        }
      }

      if (!rawData) throw new Error("No data returned from parser")

      posthog.capture("resume_parse_success", { fileType: getFileType(selectedFile) })

      // ── Step 3: Update ONLY resume sections ───────────────────────────────────
      setLoadingMessage(t.fillingYourProfile)

      const resume = convertDatesInProfileData(rawData)
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

      // ── Step 4: Mark as added (triggers ChangesBar) ───────────────────────────
      const sectionMap: [SectionType, any[]][] = [
        ["projectDetails", projects],
        ["skills", skills],
        ["languages", languages],
        ["references", references],
        ["certifications", certifications],
        ["employers", employers],
        ["education", education],
      ]

      for (const [section, items] of sectionMap) {
        items.forEach((item) => markItemAsAdded(section, item.id))
      }

      const totalItems = sectionMap.reduce((sum, [, items]) => sum + items.length, 0)
      const successMsg = t.successfullyExtractedItems.replace("{count}", String(totalItems))

      toast.success(successMsg, { duration: 8000 })
      setSuccessMessage(successMsg)
      handleRemoveFile()
      if (onProfileFilled) setTimeout(() => onProfileFilled(), 1000)

    } catch (err: any) {
      posthog.capture("resume_parse_error", {
        message: err instanceof Error ? err.message : "Unknown error",
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <FileText className="w-6 h-6 mr-3" style={{ color: "rgb(5, 22, 80)" }} />
        <div>
          <h3 className="font-semibold text-lg">{t.quickStartWithCV}</h3>
          <p className="text-sm text-gray-600">{t.uploadCVToFillProfile}</p>
        </div>
      </div>

      <div className="space-y-4">
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
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "rgba(5, 22, 80, 0.1)" }}
              >
                <Upload className="w-6 h-6" style={{ color: "rgb(5, 22, 80)" }} />
              </div>
              <p className="text-gray-700 text-center">
                {t.dragDropCVHere}{" "}
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
                aria-label="Remove file"
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
                <strong>{t.notte}:</strong> {t.aiWillExtractCV}
              </p>
            </div>
            <button
              type="button"
              onClick={handleUploadAndFillProfile}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg text-white font-medium transition-colors shadow-md"
              style={{ backgroundColor: loading ? "#ccc" : "rgb(5, 22, 80)" }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = "rgb(15, 32, 90)")}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = "rgb(5, 22, 80)")}
            >
              {loading ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  <span>{loadingMessage || t.analyzingCV}</span>
                </>
              ) : (
                <>
                  <Brain className="w-6 h-6" />
                  <span>{t.uploadFillProfile}</span>
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
            <div className="flex items-start justify-between">
              <p className="font-semibold flex items-center">
                <XCircle className="w-5 h-5 mr-2" />
                {error}
              </p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 ml-4 focus:outline-none"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200 flex items-center justify-between">
            <p className="font-semibold flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {successMessage}
            </p>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-green-600 hover:text-green-800 ml-4 focus:outline-none"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[9999]">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm w-full">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div
                className="absolute inset-0 rounded-full border-4 border-dashed animate-spin"
                style={{ borderTopColor: "rgb(5, 22, 80)", borderRightColor: "rgb(5, 22, 80)" }}
              />
              <div
                className="absolute inset-0 rounded-full border-4 border-dotted animate-spin-reverse"
                style={{ borderBottomColor: "rgb(176, 196, 222)", borderLeftColor: "rgb(176, 196, 222)" }}
              />
            </div>
            <p className="text-xl font-bold text-gray-800 mb-2">{loadingMessage}</p>
            <p className="text-gray-600 text-sm">{t.pleaseWait}</p>
          </div>
        </div>
      )}
    </div>
  )
}