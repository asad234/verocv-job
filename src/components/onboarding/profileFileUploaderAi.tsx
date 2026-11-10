'use client'
import type React from "react"
import {
  Upload, XCircle, CheckCircle2, Brain, AlertTriangle,
  ChevronDown, Check, Loader2,
} from "lucide-react"
import { useProfileStore } from "@/utils/profileStore"
import { toast } from "sonner"
import posthog from "posthog-js"
import { useAuthTranslation } from "@/hooks/useAuthTranslation"
import { onboardingTranslations } from "@/utils/Onboardingtranslations"
import { useState, useRef, useEffect, useCallback } from "react"
import { useDashboardTranslation } from "@/hooks/useDashboardTranslation"
import { getFileType } from "@/lib/resumeProcessor"
import { detectMissingFields } from "@/lib/detectMissingFields"
import { SectionType } from "@/utils/types"
import ProfileImageSelector from "./ProfileImagePickerModal"
import { ProfileImageValue } from "./ProfileImagePickerModal"

const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

// ── Steps ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'photo', label: 'Extracting profile photo' },
  { id: 'parse', label: 'Reading CV with AI' },
  { id: 'analyze', label: 'Analyzing your profile' },
  { id: 'save', label: 'Saving' },
] as const

type StepId = typeof STEPS[number]['id']
type StepState = 'pending' | 'active' | 'done'

// ── Utilities ─────────────────────────────────────────────────────────────────

const parseDateString = (ds: string | undefined): Date | undefined => {
  if (!ds) return undefined
  try { const d = new Date(ds); return isNaN(d.getTime()) ? undefined : d }
  catch { return undefined }
}

const convertDates = (data: any): any => {
  const DATE_KEYS = new Set(['startDate', 'endDate', 'validDate', 'completionDate', 'dateOfBirth', 'birthdate'])
  if (Array.isArray(data)) return data.map(convertDates)
  if (data && typeof data === 'object') {
    const out: any = {}
    for (const k in data) {
      if (!Object.prototype.hasOwnProperty.call(data, k)) continue
      const v = data[k]
      if (typeof v === 'string' && DATE_KEYS.has(k)) out[k] = parseDateString(v)
      else if (v && typeof v === 'object') out[k] = convertDates(v)
      else out[k] = v
    }
    return out
  }
  return data
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ProfilePdfUploaderProps {
  onProfileFilled?: (data: any) => void
}

export default function ProfilePdfUploader({ onProfileFilled }: ProfilePdfUploaderProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [steps, setSteps] = useState<Record<StepId, StepState>>({
    photo: 'pending', parse: 'pending', analyze: 'pending', save: 'pending',
  })
  const [currentLabel, setCurrentLabel] = useState('')

  // Missing-fields modal
  const [showMissingModal, setShowMissingModal] = useState(false)
  const [missingIssues, setMissingIssues] = useState<any[]>([])
  const [pendingResume, setPendingResume] = useState<any>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Image picker
  const [extractedImages, setExtractedImages] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [profileImage, setProfileImage] = useState<ProfileImageValue>(null)

  const { language } = useAuthTranslation('sv')
  const t = onboardingTranslations[language]
  const { t: dt } = useDashboardTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const imageGateRef = useRef<(() => void) | null>(null)

  const {
    setProjectDetails, setSkills, setLanguages, setReferences,
    setCertifications, setEmployers, setEducation, setPersonalInformation,
  } = useProfileStore()

  useEffect(() => () => {
    abortRef.current?.abort()
    imageGateRef.current?.()
  }, [])

  // ── Step helpers ───────────────────────────────────────────────────────────

  const activate = (id: StepId) => {
    setSteps(p => ({ ...p, [id]: 'active' }))
    setCurrentLabel(STEPS.find(s => s.id === id)!.label)
  }

  const complete = (id: StepId) =>
    setSteps(p => ({ ...p, [id]: 'done' }))

  // ── File helpers ───────────────────────────────────────────────────────────

  const handleFileSelection = (file: File | null) => {
    setError(null); setSuccessMessage(null); setSelectedFile(file)
  }
  const handleRemoveFile = () => {
    handleFileSelection(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  const validateAndSelect = (file: File) => {
    if (!getFileType(file)) { setError('Unsupported file type. Please upload a PDF, DOCX, or image.'); return }
    if (file.size > MAX_FILE_SIZE_BYTES) { setError(t.fileSizeExceeds); return }
    handleFileSelection(file)
  }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const f = e.dataTransfer.files?.[0]; if (f) validateAndSelect(f)
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) validateAndSelect(f)
  }

  // ── Image modal close → resolves gate ─────────────────────────────────────

  const handleImageModalClose = useCallback(() => {
    setIsModalOpen(false)
    setExtractedImages([])
    imageGateRef.current?.()
    imageGateRef.current = null
  }, [])

  // ── Apply to stores ────────────────────────────────────────────────────────

  const applyToStores = useCallback((resume: any, rawData: any) => {
    const projects = resume.projects ?? []
    const skills = resume.skills ?? []
    const languages = resume.languages ?? []
    const references = resume.references ?? []
    const certifications = resume.certifications ?? []
    const employers = resume.experience ?? []
    const education = resume.education ?? []
    const src = resume.personalInfo ?? resume.personalInformation ?? {}

    /* setPersonalInformation({
      title: src.title ?? undefined,
      personalPresentation: src.personalPresentation ?? undefined,
      professionalPresentation: src.professionalPresentation ?? undefined,
    }, false) */
    setProjectDetails(projects)
    setSkills(skills)
    setLanguages(languages)
    setReferences(references)
    setCertifications(certifications)
    setEmployers(employers)
    setEducation(education)

    const total = [projects, skills, languages, references, certifications, employers, education]
      .reduce((s, a) => s + a.length, 0)
    const msg = dt.successfullyExtractedItems.replace('{count}', String(total))
    toast.success(msg, { duration: 8000 })
    setSuccessMessage(msg)
    handleRemoveFile()
    onProfileFilled?.(rawData)
  }, [
    setPersonalInformation, setProjectDetails, setSkills, setLanguages,
    setReferences, setCertifications, setEmployers, setEducation, dt, onProfileFilled,
  ])

  // ── Main handler ───────────────────────────────────────────────────────────

  async function handleUploadAndFillProfile() {
    setError(null)
    setSuccessMessage(null)
    setLoading(true)
    setSteps({ photo: 'pending', parse: 'pending', analyze: 'pending', save: 'pending' })

    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    const { signal } = ac

    try {
      if (!selectedFile) throw new Error(dt.noFileSelected)
      if (!getFileType(selectedFile)) throw new Error('Unsupported file type.')
      if (selectedFile.size > MAX_FILE_SIZE_BYTES)
        throw new Error(dt.fileSizeExceeds.replace('{size}', String(MAX_FILE_SIZE_MB)))

      // ✅ Capture file reference before any async/modal operations
      const fileToProcess = selectedFile

      // ── 1. Extract images ─────────────────────────────────────────────────
      activate('photo')
      await new Promise(res => setTimeout(res, 400))

      const formImg = new FormData()
      formImg.append('file', fileToProcess)

      const imgResult = await fetch(
        `${process.env.NEXT_PUBLIC_PYTHON_SERVER_URL}/extract-images`,
        { method: 'POST', body: formImg, signal },
      ).then(r => r.json()).catch(() => ({ images: [] as string[] }))

      if (!signal.aborted && imgResult.images?.length > 0) {
        setExtractedImages(imgResult.images)
        setIsModalOpen(true)
        setCurrentLabel('Choose your profile photo')

        await new Promise<void>(resolve => { imageGateRef.current = resolve })
        if (signal.aborted) return
      }

      await new Promise(res => setTimeout(res, 600))
      complete('photo')

      // ── 2. Parse resume ───────────────────────────────────────────────────
      activate('parse')

      const formParse = new FormData()
      formParse.append('file', fileToProcess) // ✅ safe reference

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PYTHON_SERVER_URL}/parse-resume`,
        { method: 'POST', body: formParse, signal },
      )

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail ?? 'Resume parsing failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let rawData: any = null

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone || signal.aborted) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const raw of events) {
          if (!raw.trim()) continue
          const eventMatch = raw.match(/^event:\s*(\w+)/m)
          const dataMatch = raw.match(/^data:\s*(.+)$/m)
          if (!eventMatch || !dataMatch) continue
          const event = eventMatch[1]
          const payload = JSON.parse(dataMatch[1]!)
          if (event === 'error') throw new Error(payload.detail ?? 'Resume parsing failed')
          if (event === 'done') rawData = payload.data
        }
      }

      if (signal.aborted) return
      if (!rawData) throw new Error('No data returned from parser')
      posthog.capture('resume_parse_success', { fileType: getFileType(fileToProcess) })
      complete('parse')

      // ── 3. Analyze ────────────────────────────────────────────────────────
      activate('analyze')
      const resume = convertDates(rawData)
      const issues = detectMissingFields(resume)
      await new Promise(r => setTimeout(r, 500))
      if (signal.aborted) return
      complete('analyze')

      // ── 4. Save ───────────────────────────────────────────────────────────
      activate('save')
      await new Promise(r => setTimeout(r, 350))
      if (signal.aborted) return
      complete('save')

      setLoading(false)
      applyToStores(resume, rawData)

    } catch (err: any) {
      if (signal.aborted) return
      posthog.capture('resume_parse_error', {
        message: err.message || 'Unknown error',
        fileType: getFileType(selectedFile!),
      })
      const message = err instanceof Error ? err.message : dt.unknownErrorOccurred
      setError(message)
      toast.error(message)
      setLoading(false)
    }
  }

  //render ─────────────────────────────────────────────────────────────────────────────

  const totalMissing = missingIssues.reduce(
    (s, c) => s + c.items.reduce((ss: number, i: any) => ss + i.missing.length, 0), 0,
  )

  return (
    <div className="mx-auto p-6 relative">

      {/* ── Missing-fields modal ───────────────────────────────────────────── */}
      {showMissingModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div
            className="bg-white rounded-xl border border-gray-200 w-full max-w-lg flex flex-col"
            style={{ maxHeight: '80vh' }}
          >
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Some fields need attention</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {totalMissing} missing field{totalMissing !== 1 && 's'} across{' '}
                    {missingIssues.length} {missingIssues.length === 1 ? 'section' : 'sections'}
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

            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {missingIssues.map(category => (
                <div key={category.category} className="rounded-lg border border-gray-100 overflow-hidden">
                  <button
                    onClick={() =>
                      setExpandedCategory(expandedCategory === category.category ? null : category.category)
                    }
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{category.icon}</span>
                      <span className="font-medium text-sm text-gray-800">{category.category}</span>
                      <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                        {category.items.reduce((s: number, i: any) => s + i.missing.length, 0)} missing
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${expandedCategory === category.category ? 'rotate-180' : ''
                        }`}
                    />
                  </button>
                  {expandedCategory === category.category && (
                    <div className="divide-y divide-gray-100">
                      {category.items.map((item: any, idx: number) => (
                        <div key={idx} className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-700 mb-1.5">{item.name}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {item.missing.map((f: any) => (
                              <span key={f.field} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
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
                  if (pendingResume) applyToStores(pendingResume.resume, pendingResume.rawData)
                  setPendingResume(null)
                }}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Accept anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Drop zone ─────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <label htmlFor="pdf-upload" className="block text-sm font-medium mb-1 text-gray-700">
            {t.uploadCV}
          </label>
          <div
            className={`
              border-2 rounded-lg p-8 flex flex-col items-center justify-center transition-colors
              ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              ${selectedFile ? 'border-solid bg-gray-50' : 'border-dashed'}
              ${loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !loading && !selectedFile && fileInputRef.current?.click()}
          >
            <input
              id="pdf-upload" type="file" ref={fileInputRef}
              onChange={handleFileChange} className="hidden"
              accept=".pdf,.docx,.doc" disabled={loading || !!selectedFile}
            />
            {!selectedFile ? (
              <>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-gray-700 text-center">
                  {t.dragDropOrBrowse}{' '}
                  <span className="text-blue-600 font-semibold">{t.clickToBrowse}</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">{t.maxFileSize}</p>
              </>
            ) : (
              <div className="flex items-center space-x-3 text-gray-800 font-medium">
                <span className="truncate max-w-[calc(100%-40px)]">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); handleRemoveFile() }}
                  className="text-red-400 hover:text-red-600"
                  aria-label="Remove file"
                  disabled={loading}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {selectedFile && !loading && (
          <div className="flex flex-col items-center gap-3 pt-1">
            <p className="text-sm text-gray-500 text-center">{t.aiWillAnalyze}</p>
            <button
              type="button"
              onClick={handleUploadAndFillProfile}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Brain className="w-4 h-4" />
              {t.uploadAndFill}
            </button>
          </div>
        )}
      </div>

      {/* ── Loading overlay ────────────────────────────────────────────────── */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">

            {/* Header */}
            <div className="mb-5">
              <h2 className="text-base font-semibold text-gray-900">
                Processing your resume
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {currentLabel}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-100 rounded mb-6">
              <div
                className="h-2 bg-blue-600 rounded transition-all duration-500"
                style={{
                  width: `${(Object.values(steps).filter(s => s === "done").length /
                    STEPS.length) *
                    100
                    }%`,
                }}
              />
            </div>

            {/* Steps */}
            <ol className="space-y-3">
              {STEPS.map((step) => {
                const state = steps[step.id]

                return (
                  <li key={step.id} className="flex items-center gap-3">

                    {/* Status icon */}
                    <span className="w-5 h-5 flex items-center justify-center">
                      {state === "done" && (
                        <Check className="w-4 h-4 text-green-600" strokeWidth={3} />
                      )}

                      {state === "active" && (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      )}

                      {state === "pending" && (
                        <span className="w-2 h-2 rounded-full bg-gray-300" />
                      )}
                    </span>

                    {/* Label */}
                    <span
                      className={`text-sm ${state === "done"
                        ? "text-gray-400"
                        : state === "active"
                          ? "text-gray-900 font-medium"
                          : "text-gray-400"
                        }`}
                    >
                      {step.label}
                    </span>
                  </li>
                )
              })}
            </ol>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-gray-400">{t.pleaseWait}</p>

              <p className="text-xs text-gray-500">
                {Object.values(steps).filter(s => s === "done").length} / {STEPS.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {t.error}: {error}
              </p>
              <button
                type="button"
                onClick={() => { setError(null); handleRemoveFile() }}
                className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs font-medium inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                {language === 'en' ? 'Try again' : 'Försök igen'}
              </button>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 flex-shrink-0">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Success ───────────────────────────────────────────────────────── */}
      {successMessage && (
        <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-lg border border-green-200 flex items-center justify-between gap-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            {successMessage}
          </p>
          <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700 flex-shrink-0">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Image picker ───────────────────────────────────────────────────── */}
      <ProfileImageSelector
        mode="modal"
        isOpen={isModalOpen}
        onClose={handleImageModalClose}
        images={extractedImages}
        value={profileImage}
        onChange={() => handleImageModalClose()}
      />
    </div>
  )
}