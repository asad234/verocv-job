"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import { useManagerTranslations } from "@/utils/Managertranslations"
import { useManagerDashboard } from "@/components/Dashboard/Company-dashboard/manager/ManagerDashboardContext"
import {
  CONTRACT_SECTION_ORDER, emptySections, isSectionFilled, defaultDocumentStyle,
  type EmployeeContract, type DocumentStyle, type SectionKey, type SigningMethod,
} from "@/utils/contractsStore"
import {
  loadContract, saveContract, sendForSignature, ApiError, RECIPIENT_ERROR_CODES,
} from "@/utils/contractsApi"
import { generateContractDraft, type GenerateOptions } from "@/utils/contractAiAssist"
import { runsToPlainText, effectiveRunStyle, type RichRun } from "@/utils/richText"
import { PDF_FONTS, loadWebFontsForPreview, type PdfFontValue } from "@/utils/pdfFonts"
import RichTextEditor from "@/components/Dashboard/Company-dashboard/manager/views/RichTextEditor"
import PersonalInfoDialog, { type PersonalInfoFormData } from "@/components/Dashboard/Company-dashboard/manager/views/PersonalInfoDialog"
import GenerateContractDialog from "@/components/Dashboard/Company-dashboard/manager/views/GenerateContractDialog"
import SigningMethodDialog from "./SigningMethodDialog"
import LogoReminderDialog from "../company/Logoreminderdialog"
import CompanyLogoPicker from "../company/Companylogopicker"

const NAVY = "rgb(5,22,80)"

const SECTION_META: Record<SectionKey, { en: string; sv: string; hintEn: string; hintSv: string; rows: number }> = {
  agreementTitle: { en: "Agreement Title", sv: "Avtalstitel", hintEn: "e.g. \"Fixed-term employment agreement\"", hintSv: "t.ex. \"Tidsbegränsat anställningsavtal\"", rows: 1 },
  position: { en: "Position", sv: "Din position / Befattning", hintEn: "The employee's job title.", hintSv: "Medarbetarens befattning.", rows: 1 },
  jobDuties: { en: "Job Duties", sv: "Arbetsuppgifter", hintEn: "What the employee is expected to do.", hintSv: "Vad medarbetaren förväntas göra.", rows: 4 },
  mainWorkplace: { en: "Main Workplace", sv: "Din huvudsakliga arbetsplats", hintEn: "Primary office or work location.", hintSv: "Primärt kontor eller arbetsplats.", rows: 2 },
  workingHours: { en: "Working Hours", sv: "Din arbetstid", hintEn: "Weekly hours and schedule.", hintSv: "Veckoarbetstid och schema.", rows: 2 },
  salary: { en: "Salary", sv: "Lön", hintEn: "Amount, payment date, currency.", hintSv: "Belopp, utbetalningsdag, valuta.", rows: 2 },
  overtime: { en: "Overtime", sv: "Vad gäller övertid?", hintEn: "How overtime is compensated.", hintSv: "Hur övertid kompenseras.", rows: 3 },
  vacation: { en: "Vacation", sv: "Semester", hintEn: "Days per year per Swedish vacation law (statutory minimum: 25 days).", hintSv: "Antal dagar per år enligt semesterlagen (lagstadgat minimum: 25 dagar).", rows: 3 },
  socialSecurity: { en: "Social Security", sv: "Information om socialt skydd enligt lagen", hintEn: "Statutory social insurance coverage.", hintSv: "Lagstadgat socialförsäkringsskydd.", rows: 3 },
  pensionInsurance: { en: "Pension & Insurance", sv: "Din pension och dina försäkringsförmåner", hintEn: "Occupational pension and group insurance.", hintSv: "Tjänstepension och gruppförsäkringar.", rows: 3 },
  companyPolicy: { en: "Company Policy", sv: "Företagets policy och regelverk enligt lagen", hintEn: "Internal policies the employee must follow.", hintSv: "Interna policyer medarbetaren måste följa.", rows: 3 },
  bonusProgram: { en: "Bonus Program", sv: "Bonusprogram", hintEn: "If applicable — how bonus is determined.", hintSv: "Om tillämpligt — hur bonus fastställs.", rows: 3 },
  termination: { en: "Termination", sv: "Avslut av anställning", hintEn: "Notice periods and end-of-contract terms.", hintSv: "Uppsägningstider och villkor vid avslut.", rows: 3 },
  confidentiality: { en: "Confidentiality & Loyalty", sv: "Sekretess, lojalitet och konfidentiell information", hintEn: "Non-disclosure and loyalty obligations.", hintSv: "Sekretess- och lojalitetsåtaganden.", rows: 4 },
  dataProtection: { en: "Data Protection", sv: "Skydd av personuppgifter inom företaget", hintEn: "GDPR compliance within the company.", hintSv: "GDPR-efterlevnad inom företaget.", rows: 3 },
  advanceVacationPay: { en: "Advance Vacation Pay Agreement", sv: "Överenskommelse om betald förskottssemester enligt lagen", hintEn: "Repayment terms if vacation was taken in advance.", hintSv: "Återbetalningsvillkor vid uttag av semester i förskott.", rows: 3 },
  other: { en: "Other", sv: "Övrigt", hintEn: "Anything else specific to this agreement.", hintSv: "Övrigt specifikt för detta avtal.", rows: 3 },
}

function newBlankContract(): EmployeeContract {
  const now = new Date().toISOString()
  return {
    id: "", // assigned by the database on first save
    employeeId: "", employeeName: "", employeeInitials: "", employeeTitle: "",
    contractType: "permanent", employmentExtent: "full_time",
    startDate: now, endDate: null,
    createdAt: now, signedAt: null,
    status: "draft",
    history: [{ id: crypto.randomUUID(), type: "created", date: now }],
    sections: { ...emptySections },
    documentStyle: { ...defaultDocumentStyle },

    companyName: "", orgNumber: "", companyAddress: "", contactPerson: "",
    personalNumber: "", employeeAddress: "",
    positionTitle: "", workplace: "", noticePeriod: "",
    monthlySalaryAmount: "", payDay: "", vacationDaysPerYear: "", otherBenefits: "",
    otherNotes: "", hasCollectiveAgreement: "", signingPlace: "",
    signingDate: now,
    companyLogo: null,

    referenceTemplateIds: [],
    aiDrafts: [],
  }
}

export default function ManagerContractEditor() {
  const { language } = useManagerTranslations()
  const { selectedContractId, setView, setSelectedContractId } = useManagerDashboard()
  const isEn = language === "en"

  const [contract, setContract] = useState<EmployeeContract>(newBlankContract())
  const [activeSection, setActiveSection] = useState<SectionKey>("agreementTitle")
  // Bumped whenever sections are replaced from outside (load / AI generation)
  // so the rich-text editor re-mounts with the new content.
  const [contentVersion, setContentVersion] = useState(0)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveFlash, setSaveFlash] = useState(false)

  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [showPersonalInfoDialog, setShowPersonalInfoDialog] = useState(false)
  const [sendBlocked, setSendBlocked] = useState(false)
  const [showSigningMethodDialog, setShowSigningMethodDialog] = useState(false)
  /** "Add your company logo?" reminder — shown before sending when there's no logo. */
  const [showLogoReminder, setShowLogoReminder] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  // Review notes from the last AI generation (shown until dismissed).
  const [aiNotes, setAiNotes] = useState<{ warnings: string[]; missingInformation: string[]; templateName?: string } | null>(null)

  // The id currently in state — lets us skip re-fetching right after our own save.
  const loadedIdRef = useRef<string>("")

  useEffect(() => { loadWebFontsForPreview() }, [])

  /* ── Load the selected contract from the database ── */
  useEffect(() => {
    if (!selectedContractId) {
      loadedIdRef.current = ""
      setContract(newBlankContract())
      setContentVersion(v => v + 1)
      // Start a new contract with the logo from the manager's previous contract.
      let cancelled = false
      fetch("/api/company/managers/company-logo", { credentials: "include", cache: "no-store" })
        .then(res => (res.ok ? res.json() : null))
        .then(json => {
          if (cancelled || !json?.logo) return
          setContract(prev => (prev.id || prev.companyLogo ? prev : { ...prev, companyLogo: json.logo }))
        })
        .catch(() => { /* no previous logo — fine */ })
      return () => { cancelled = true }
    }
    if (selectedContractId === loadedIdRef.current) return

    let cancelled = false
    setLoading(true)
    setError(null)
    loadContract(selectedContractId)
      .then(c => {
        if (cancelled) return
        loadedIdRef.current = c.id
        setContract({ ...newBlankContract(), ...c })
        setContentVersion(v => v + 1)
      })
      .catch(e => { if (!cancelled) setError(e.message || (isEn ? "Couldn't load the contract." : "Kunde inte ladda kontraktet.")) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedContractId, isEn])

  const isLocked = !!contract.status && contract.status !== "draft"

  const back = () => { setSelectedContractId(null); setView("contracts") }
  const flashSaved = () => { setSaveFlash(true); setTimeout(() => setSaveFlash(false), 1500) }

  /** Persists the current state and returns the saved contract (with its real id). */
  const persist = async (): Promise<EmployeeContract> => {
    const saved = await saveContract(contract)
    loadedIdRef.current = saved.id
    // Keep local sections/style (identical to what was saved) so the editor doesn't re-mount.
    setContract(prev => ({ ...prev, ...saved, sections: prev.sections, documentStyle: prev.documentStyle }))
    if (selectedContractId !== saved.id) setSelectedContractId(saved.id)
    return saved
  }

  const handleSaveDraft = async () => {
    if (isLocked || saving) return
    setSaving(true)
    setError(null)
    try {
      await persist()
      flashSaved()
    } catch (e) {
      setError((e as Error).message || (isEn ? "Couldn't save the contract." : "Kunde inte spara kontraktet."))
    } finally {
      setSaving(false)
    }
  }

  const requiredPersonalInfoFilled = () => {
    const req = [
      contract.companyName, contract.orgNumber, contract.companyAddress,
      contract.employeeName, contract.personalNumber, contract.employeeAddress,
      contract.positionTitle, contract.workplace, contract.startDate,
      contract.noticePeriod, contract.monthlySalaryAmount, contract.payDay,
      contract.vacationDaysPerYear, contract.hasCollectiveAgreement,
      contract.signingPlace, contract.signingDate,
    ]
    return req.every(v => v && String(v).trim() !== "")
  }

  const handleSendForSignature = () => {
    if (isLocked) return
    if (!requiredPersonalInfoFilled()) {
      setSendBlocked(true)
      setShowPersonalInfoDialog(true)
      return
    }
    setSendError(null)
    // Not required — just a reminder. The manager can upload now or send without a logo.
    if (!contract.companyLogo) {
      setShowLogoReminder(true)
      return
    }
    setShowSigningMethodDialog(true)
  }

  /** Reminder → "Upload logo": the logo goes on the contract (saved on send), then continue. */
  const handleReminderUpload = (logo: string) => {
    setContract(prev => ({ ...prev, companyLogo: logo }))
    setShowLogoReminder(false)
    setShowSigningMethodDialog(true)
  }

  /** Reminder → "Send without logo": continue without any image. */
  const handleReminderSkip = () => {
    setShowLogoReminder(false)
    setShowSigningMethodDialog(true)
  }

  /**
   * Saves the latest edits, then sends. Delivery is in-app: the contract appears in
   * the employee's VeroCV dashboard. The recipient is the linked employee, or the
   * VeroCV account matching `recipientEmail` (typed in SigningMethodDialog).
   */
  const finalizeSendForSignature = async (method: Exclude<SigningMethod, null>, recipientEmail?: string) => {
    setSaving(true)
    setSendError(null)
    setError(null)
    try {
      const saved = await persist() // save the latest edits before locking
      const result = await sendForSignature(saved.id, method, recipientEmail)
      setContract(prev => ({
        ...prev,
        status: result.contract.status,
        history: result.contract.history,
        signingMethod: result.contract.signingMethod,
        recipientEmail: result.recipientEmail,
        employeeId: result.contract.employeeId || prev.employeeId,
      }))
      setShowSigningMethodDialog(false)
      back()
    } catch (e) {
      if (e instanceof ApiError && RECIPIENT_ERROR_CODES.includes(e.data?.code)) {
        // Keep the dialog open so the manager can enter / correct the email.
        setSendError(e.message)
      } else if (e instanceof ApiError && e.status === 422) {
        setShowSigningMethodDialog(false)
        setSendBlocked(true)
        setShowPersonalInfoDialog(true)
      } else {
        setSendError((e as Error).message || (isEn ? "Couldn't send the contract." : "Kunde inte skicka kontraktet."))
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePersonalInfoSave = (data: PersonalInfoFormData) => {
    setContract(prev => ({ ...prev, ...data }))
    setSendBlocked(false)
  }

  /**
   * Called by GenerateContractDialog. Throws on failure so the dialog can show the error.
   * The AI uses the information from PersonalInfoDialog (current, unsaved state included)
   * and fills every agreement section as editable rich text.
   */
  const handleGenerateContract = async (options: GenerateOptions) => {
    const result = await generateContractDraft(contract, options)
    const now = new Date().toISOString()

    const modeLabel = options.mode === "from_template"
      ? `${isEn ? "From template" : "Från mall"}: ${result.templateName ?? ""}`.trim()
      : (isEn ? "AI draft" : "AI-utkast")
    const historyNote = [modeLabel, options.prompt].filter(Boolean).join(" — ")

    setContract(prev => ({
      ...prev,
      sections: { ...prev.sections, ...result.sections },
      referenceTemplateIds: Array.from(new Set([...(prev.referenceTemplateIds ?? []), ...options.templateIds])),
      aiDrafts: [...(prev.aiDrafts ?? []), {
        mode: options.mode,
        prompt: options.prompt,
        templateIds: options.templateIds,
        generatedAt: now,
      }],
      history: [...prev.history, { id: crypto.randomUUID(), type: "ai_drafted", date: now, note: historyNote }],
    }))
    setContentVersion(v => v + 1)
    setActiveSection("agreementTitle")
    setAiNotes(
      result.warnings.length > 0 || result.missingInformation.length > 0
        ? { warnings: result.warnings, missingInformation: result.missingInformation, templateName: result.templateName }
        : null,
    )
  }

  const handleDownloadPdf = () => {
    // TEMPORARY: browser print-to-PDF against the hidden #contract-print-view.
    // Swap for react-pdf + uploadContractPdf() to also store it in contract-pdfs.
    window.print()
  }

  const updateSectionRuns = (key: SectionKey, runs: RichRun[]) => {
    setContract(prev => ({ ...prev, sections: { ...prev.sections, [key]: runs } }))
  }

  const updateDocStyle = (patch: Partial<DocumentStyle>) => {
    setContract(prev => ({ ...prev, documentStyle: { ...prev.documentStyle, ...patch } }))
  }

  const meta = SECTION_META[activeSection]
  const sectionLabel = (key: SectionKey) => isEn ? SECTION_META[key].en : SECTION_META[key].sv
  const isTitleSection = activeSection === "agreementTitle"

  const filledCount = CONTRACT_SECTION_ORDER.filter(k => isSectionFilled(contract.sections[k])).length
  const progressPct = Math.round((filledCount / CONTRACT_SECTION_ORDER.length) * 100)
  const personalInfoComplete = requiredPersonalInfoFilled()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center gap-2 text-sm text-gray-400">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        {isEn ? "Loading contract…" : "Laddar kontrakt…"}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #contract-print-view, #contract-print-view * { visibility: visible; }
          #contract-print-view { position: absolute; inset: 0; padding: 2rem; }
        }
      `}</style>

      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={back} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 flex-shrink-0">
              <Icon icon="tabler:arrow-left" className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-gray-800 truncate">
                {runsToPlainText(contract.sections.agreementTitle) || (isEn ? "New Contract" : "Nytt Kontrakt")}
              </h1>
              <p className="text-xs text-gray-400 truncate">
                {contract.employeeName || (isEn ? "No employee selected" : "Ingen medarbetare vald")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {saveFlash && (
              <span className="text-xs font-medium text-green-600 flex items-center gap-1 mr-1">
                <Icon icon="tabler:check" className="w-3.5 h-3.5" /> {isEn ? "Saved" : "Sparat"}
              </span>
            )}
            <button onClick={() => setShowGenerateDialog(true)} disabled={isLocked || saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "rgb(109,40,217)" }}>
              <Icon icon="tabler:wand" className="w-3.5 h-3.5" />
              {isEn ? "Generate Contract" : "Generera Kontrakt"}
            </button>
            <button onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all">
              <Icon icon="tabler:download" className="w-3.5 h-3.5" />
              {isEn ? "Download PDF" : "Ladda ned PDF"}
            </button>
            <button onClick={handleSaveDraft} disabled={isLocked || saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {saving
                ? <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                : <Icon icon="tabler:device-floppy" className="w-3.5 h-3.5" />}
              {isEn ? "Save Draft" : "Spara Utkast"}
            </button>
            <button onClick={handleSendForSignature} disabled={isLocked || saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: NAVY }}>
              <Icon icon="tabler:send" className="w-3.5 h-3.5" />
              {isEn ? "Send for Signature" : "Skicka för Signering"}
            </button>
          </div>
        </div>
      </div>

      {/* Banners */}
      {(error || isLocked || aiNotes) && (
        <div className="px-4 sm:px-6 pt-4 space-y-2">
          {error && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
              <Icon icon="tabler:alert-circle" className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <Icon icon="tabler:x" className="w-4 h-4" />
              </button>
            </div>
          )}
          {aiNotes && !isLocked && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/60 px-4 py-3 text-sm">
              <div className="flex items-start gap-2">
                <Icon icon="tabler:sparkles" className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-600" />
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="font-semibold text-purple-900">
                    {isEn ? "AI draft created — review before sending" : "AI-utkast skapat — granska innan du skickar"}
                  </p>
                  {aiNotes.missingInformation.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700">
                        {isEn ? "Fill in these placeholders [ … ] in the sections:" : "Fyll i dessa platshållare [ … ] i avsnitten:"}
                      </p>
                      <ul className="mt-1 space-y-0.5 text-xs text-gray-600 list-disc pl-4">
                        {aiNotes.missingInformation.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>
                  )}
                  {aiNotes.warnings.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{isEn ? "Legal notes:" : "Juridiska anmärkningar:"}</p>
                      <ul className="mt-1 space-y-0.5 text-xs text-gray-600 list-disc pl-4">
                        {aiNotes.warnings.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
                <button onClick={() => setAiNotes(null)} className="text-purple-400 hover:text-purple-700"
                  aria-label={isEn ? "Dismiss" : "Stäng"}>
                  <Icon icon="tabler:x" className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {isLocked && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-700">
              <Icon icon="tabler:lock" className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                {isEn
                  ? "This contract has been sent for signature and can no longer be edited."
                  : "Detta kontrakt har skickats för signering och kan inte längre redigeras."}
                {contract.recipientEmail && (
                  <> {isEn ? "Sent to" : "Skickat till"} <strong>{contract.recipientEmail}</strong>.</>
                )}
                {contract.signedAt && contract.managerSignedAt && (
                  <>
                    {" "}
                    <a href={`/api/company/managers/employee-contracts/${contract.id}/pdf`}
                      className="font-semibold underline underline-offset-2">
                      {isEn ? "Download signed PDF" : "Ladda ned signerad PDF"}
                    </a>
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="p-4 sm:p-6 flex flex-col xl:flex-row gap-6">

        {/* ── LEFT: basic info + document style + section nav ── */}
        <div className="w-full xl:w-80 flex-shrink-0 space-y-4">

          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {isEn ? "Basic Information" : "Grundläggande Information"}
              </p>
              <Icon icon={personalInfoComplete ? "tabler:circle-check-filled" : "tabler:circle"}
                className={clsx("w-4 h-4", personalInfoComplete ? "text-green-500" : "text-gray-300")} />
            </div>

            {contract.employeeName || contract.companyName ? (
              <div className="rounded-xl bg-gray-50 p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {contract.employeeName || (isEn ? "Employee not named" : "Medarbetare ej angiven")}
                  </p>
                  {contract.employeeId && (
                    <Icon icon="tabler:link" className="w-3.5 h-3.5 text-green-500 flex-shrink-0"
                      aria-label={isEn ? "Linked to employee account" : "Kopplad till medarbetarkonto"} />
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{contract.positionTitle || "—"}</p>
                <p className="text-xs text-gray-400 truncate">{contract.companyName || "—"}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                {isEn ? "No information filled in yet." : "Ingen information ifylld ännu."}
              </p>
            )}

            {sendBlocked && !personalInfoComplete && (
              <p className="text-[11px] text-red-500">
                {isEn
                  ? "Complete the required information before sending."
                  : "Fyll i den obligatoriska informationen innan du skickar."}
              </p>
            )}

            <button onClick={() => setShowPersonalInfoDialog(true)} disabled={isLocked}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: NAVY }}>
              <Icon icon="tabler:id" className="w-4 h-4" />
              {contract.employeeName || contract.companyName
                ? (isEn ? "Edit Information" : "Redigera Information")
                : (isEn ? "Personal Information" : "Personlig Information")}
            </button>
          </div>

          <fieldset disabled={isLocked} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 disabled:opacity-60">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{isEn ? "Document Style" : "Dokumentstil"}</p>

            <CompanyLogoPicker
              isEn={isEn}
              value={contract.companyLogo}
              disabled={isLocked}
              onChange={logo => setContract(prev => ({ ...prev, companyLogo: logo }))}
            />

            <div>
              <p className="text-[11px] font-semibold text-gray-500 mb-1.5">{isEn ? "Titles / Headings" : "Titlar / Rubriker"}</p>
              <div className="space-y-1.5">
                <select value={contract.documentStyle.headingFont} onChange={e => updateDocStyle({ headingFont: e.target.value as PdfFontValue })}
                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white outline-none">
                  {Object.entries(PDF_FONTS).map(([key, family]) => <option key={key} value={family}>{family}</option>)}
                </select>
                <div className="flex items-center gap-1.5">
                  <input type="color" value={contract.documentStyle.headingColor} onChange={e => updateDocStyle({ headingColor: e.target.value })}
                    className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <select value={contract.documentStyle.headingSize} onChange={e => updateDocStyle({ headingSize: Number(e.target.value) })}
                    className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white outline-none">
                    {[11, 12, 13, 14, 16, 18, 20, 24].map(s => <option key={s} value={s}>{s}pt</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-500 mb-1.5">{isEn ? "Body Text" : "Brödtext"}</p>
              <div className="space-y-1.5">
                <select value={contract.documentStyle.bodyFont} onChange={e => updateDocStyle({ bodyFont: e.target.value as PdfFontValue })}
                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white outline-none">
                  {Object.entries(PDF_FONTS).map(([key, family]) => <option key={key} value={family}>{family}</option>)}
                </select>
                <div className="flex items-center gap-1.5">
                  <input type="color" value={contract.documentStyle.bodyColor} onChange={e => updateDocStyle({ bodyColor: e.target.value })}
                    className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <select value={contract.documentStyle.bodySize} onChange={e => updateDocStyle({ bodySize: Number(e.target.value) })}
                    className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white outline-none">
                    {[8, 9, 10, 11, 12, 14].map(s => <option key={s} value={s}>{s}pt</option>)}
                  </select>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed pt-1">
              {isEn
                ? "These are the defaults for the whole document. Select any phrase inside a section to override its style individually."
                : "Detta är standardinställningarna för hela dokumentet. Markera valfri text i ett avsnitt för att åsidosätta stilen individuellt."}
            </p>
          </fieldset>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{isEn ? "Agreement Sections" : "Avtalsavsnitt"}</p>
                <span className="text-[10px] text-gray-400">{filledCount}/{CONTRACT_SECTION_ORDER.length}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: NAVY }} />
              </div>
            </div>
            <div className="max-h-[380px] overflow-y-auto mt-2">
              {CONTRACT_SECTION_ORDER.map(key => {
                const filled = isSectionFilled(contract.sections[key])
                const active = activeSection === key
                return (
                  <button key={key} onClick={() => setActiveSection(key)}
                    className={clsx("w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs font-medium transition-colors border-l-2",
                      active ? "border-blue-800 bg-blue-50/60 text-blue-900" : "border-transparent text-gray-600 hover:bg-gray-50")}>
                    <Icon icon={filled ? "tabler:circle-check-filled" : "tabler:circle"} className={clsx("w-3.5 h-3.5 flex-shrink-0", filled ? "text-green-500" : "text-gray-300")} />
                    <span className="truncate">{sectionLabel(key)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── CENTER: active section rich text editor ── */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-gray-800">{sectionLabel(activeSection)}</h2>
              <span className="text-xs text-gray-400">
                {CONTRACT_SECTION_ORDER.indexOf(activeSection) + 1} / {CONTRACT_SECTION_ORDER.length}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-3">{isEn ? meta.hintEn : meta.hintSv}</p>

            <div className={clsx(isLocked && "pointer-events-none opacity-70")} aria-disabled={isLocked}>
              <RichTextEditor
                key={`${contract.id || "new"}-${activeSection}-${contentVersion}`}
                value={contract.sections[activeSection]}
                onChange={runs => updateSectionRuns(activeSection, runs)}
                isEn={isEn}
                minHeightPx={Math.max(140, meta.rows * 32)}
                placeholder={isEn ? "Write this clause manually, or use Generate Contract above" : "Skriv detta avsnitt manuellt, eller använd Generera Kontrakt ovan"}
                defaultFontFamily={isTitleSection ? contract.documentStyle.headingFont : contract.documentStyle.bodyFont}
                defaultColor={isTitleSection ? contract.documentStyle.headingColor : contract.documentStyle.bodyColor}
                defaultFontSize={isTitleSection ? contract.documentStyle.headingSize : contract.documentStyle.bodySize}
              />
            </div>

            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => {
                  const idx = CONTRACT_SECTION_ORDER.indexOf(activeSection)
                  if (idx > 0) setActiveSection(CONTRACT_SECTION_ORDER[idx - 1]!)
                }}
                disabled={CONTRACT_SECTION_ORDER.indexOf(activeSection) === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                <Icon icon="tabler:chevron-left" className="w-3.5 h-3.5" /> {isEn ? "Previous" : "Föregående"}
              </button>
              <button
                onClick={() => {
                  const idx = CONTRACT_SECTION_ORDER.indexOf(activeSection)
                  if (idx < CONTRACT_SECTION_ORDER.length - 1) setActiveSection(CONTRACT_SECTION_ORDER[idx + 1]!)
                }}
                disabled={CONTRACT_SECTION_ORDER.indexOf(activeSection) === CONTRACT_SECTION_ORDER.length - 1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ backgroundColor: NAVY }}>
                {isEn ? "Next" : "Nästa"} <Icon icon="tabler:chevron-right" className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showGenerateDialog && (
        <GenerateContractDialog
          isEn={isEn}
          contract={contract}
          onClose={() => setShowGenerateDialog(false)}
          onGenerate={handleGenerateContract}
          onOpenPersonalInfo={() => { setShowGenerateDialog(false); setShowPersonalInfoDialog(true) }}
        />
      )}

      {showPersonalInfoDialog && (
        <PersonalInfoDialog
          isEn={isEn}
          initial={contract}
          highlightMissing={sendBlocked}
          onClose={() => setShowPersonalInfoDialog(false)}
          onSave={handlePersonalInfoSave}
        />
      )}

      {showLogoReminder && (
        <LogoReminderDialog
          isEn={isEn}
          busy={saving}
          onClose={() => setShowLogoReminder(false)}
          onUpload={handleReminderUpload}
          onSkip={handleReminderSkip}
        />
      )}

      {showSigningMethodDialog && (
        <SigningMethodDialog
          isEn={isEn}
          employeeName={contract.employeeName}
          hasLinkedEmployee={!!contract.employeeId}
          recipientEmail={contract.recipientEmail}
          busy={saving}
          error={sendError}
          onClose={() => { if (!saving) setShowSigningMethodDialog(false) }}
          onChoose={finalizeSendForSignature}
        />
      )}


      {/* Hidden print view for the temporary window.print() PDF export */}
      <div id="contract-print-view" className="hidden print:block">
        {contract.companyLogo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={contract.companyLogo} alt="" style={{ maxHeight: 40, maxWidth: 160, objectFit: "contain", marginBottom: 12 }} />
        )}
        <h1 style={{
          fontFamily: `'${contract.documentStyle.headingFont}'`,
          color: contract.documentStyle.headingColor,
          fontSize: `${contract.documentStyle.headingSize + 6}pt`,
          fontWeight: contract.documentStyle.headingBold ? 700 : 400,
          marginBottom: 4,
        }}>
          {runsToPlainText(contract.sections.agreementTitle) || (isEn ? "Employment Agreement" : "Anställningsavtal")}
        </h1>
        <p style={{ fontSize: "9pt", color: "#6b7280", marginBottom: 20 }}>
          {contract.employeeName} — {contract.positionTitle || runsToPlainText(contract.sections.position)}
        </p>
        {CONTRACT_SECTION_ORDER.filter(k => k !== "agreementTitle" && isSectionFilled(contract.sections[k])).map(key => (
          <div key={key} style={{ marginBottom: 14, breakInside: "avoid" }}>
            <h2 style={{
              fontFamily: `'${contract.documentStyle.headingFont}'`,
              color: contract.documentStyle.headingColor,
              fontSize: `${contract.documentStyle.headingSize}pt`,
              fontWeight: contract.documentStyle.headingBold ? 700 : 400,
              marginBottom: 4,
            }}>
              {sectionLabel(key)}
            </h2>
            <p style={{ lineHeight: 1.6 }}>
              {contract.sections[key].map(run => (
                <span key={run.id} style={effectiveRunStyle(run, {
                  fontFamily: contract.documentStyle.bodyFont,
                  color: contract.documentStyle.bodyColor,
                  fontSize: contract.documentStyle.bodySize,
                })}>
                  {run.text}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
