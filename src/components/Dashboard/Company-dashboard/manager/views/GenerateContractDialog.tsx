"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import type { EmployeeContract } from "@/utils/contractsStore"
import { loadTemplates, formatFileSize, type ContractTemplateFile } from "@/utils/contractsApi"
import { filledSectionKeys, type ContractLanguage, type GenerateOptions } from "@/utils/contractAiAssist"

const NAVY = "rgb(5,22,80)"
const LIGHT = "rgb(239,246,255)"
const PURPLE = "rgb(109,40,217)"
const PURPLE_LIGHT = "rgb(245,243,255)"

interface GenerateContractDialogProps {
  isEn: boolean
  contract: EmployeeContract
  onClose: () => void
  onGenerate: (options: GenerateOptions) => Promise<void>
  /** Closes this dialog and opens PersonalInfoDialog. */
  onOpenPersonalInfo: () => void
}

type Step = "choose" | "ai_scratch" | "from_template"

function fileIcon(mimeType: string) {
  if (mimeType.includes("pdf")) return { icon: "tabler:file-type-pdf", color: "#ef4444", bg: "#fee2e2" }
  if (mimeType.includes("word") || mimeType.includes("doc")) return { icon: "tabler:file-type-doc", color: "#2563eb", bg: "#dbeafe" }
  return { icon: "tabler:file-text", color: "#6b7280", bg: "#f3f4f6" }
}

/** Old binary .doc files can't be read on the server. */
const isReadableTemplate = (f: ContractTemplateFile) =>
  f.mimeType !== "application/msword" && !f.name.toLowerCase().endsWith(".doc")

const CONTRACT_TYPE_TEXT = {
  permanent: { en: "Permanent", sv: "Tillsvidare" },
  temporary: { en: "Fixed-term", sv: "Visstid" },
  on_call: { en: "On-call", sv: "Behovsanställning" },
  consultant: { en: "Consultant", sv: "Konsult" },
} as const

export default function GenerateContractDialog({
  isEn, contract, onClose, onGenerate, onOpenPersonalInfo,
}: GenerateContractDialogProps) {
  const [step, setStep] = useState<Step>("choose")
  const [templates, setTemplates] = useState<ContractTemplateFile[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templatesError, setTemplatesError] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [prompt, setPrompt] = useState("")
  const [language, setLanguage] = useState<ContractLanguage>("sv")
  const [keepExisting, setKeepExisting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadTemplates()
      .then(list => { if (!cancelled) setTemplates(list) })
      .catch(() => { if (!cancelled) setTemplatesError(true) })
      .finally(() => { if (!cancelled) setTemplatesLoading(false) })
    return () => { cancelled = true }
  }, [])

  /* ── What the AI will use from PersonalInfoDialog ── */
  const facts = useMemo(() => {
    const t = (en: string, sv: string) => (isEn ? en : sv)
    const list: { label: string; value: string }[] = [
      { label: t("Form of employment", "Anställningsform"), value: isEn ? CONTRACT_TYPE_TEXT[contract.contractType].en : CONTRACT_TYPE_TEXT[contract.contractType].sv },
      { label: t("Position", "Befattning"), value: contract.positionTitle ?? "" },
      { label: t("Workplace", "Arbetsplats"), value: contract.workplace ?? "" },
      { label: t("Start date", "Tillträdesdatum"), value: contract.startDate ? contract.startDate.slice(0, 10) : "" },
      ...(contract.contractType !== "permanent"
        ? [{ label: t("End date", "Slutdatum"), value: contract.endDate ? contract.endDate.slice(0, 10) : "" }]
        : []),
      { label: t("Salary", "Lön"), value: contract.monthlySalaryAmount ? `${contract.monthlySalaryAmount} SEK` : "" },
      { label: t("Pay day", "Lönedag"), value: contract.payDay ?? "" },
      { label: t("Notice period", "Uppsägningstid"), value: contract.noticePeriod ?? "" },
      { label: t("Vacation days", "Semesterdagar"), value: contract.vacationDaysPerYear ?? "" },
      { label: t("Collective agreement", "Kollektivavtal"), value: contract.hasCollectiveAgreement ? (contract.hasCollectiveAgreement === "yes" ? t("Yes", "Ja") : t("No", "Nej")) : "" },
    ]
    return list
  }, [contract, isEn])

  const missingFacts = facts.filter(f => !f.value.trim())
  const filledSections = filledSectionKeys(contract)

  const canGenerate =
    step === "ai_scratch" ||
    (step === "from_template" && !!selectedTemplateId)

  const handleGenerate = async () => {
    if (step === "choose" || !canGenerate || loading) return
    setLoading(true)
    setError(null)
    try {
      await onGenerate({
        mode: step,
        prompt: prompt.trim(),
        templateIds: step === "from_template" ? [selectedTemplateId] : [],
        language,
        keepExisting,
      })
      onClose()
    } catch (e) {
      setError((e as Error).message || (isEn ? "Generation failed. Please try again." : "Genereringen misslyckades. Försök igen."))
    } finally {
      setLoading(false)
    }
  }

  /* ── Shared blocks ── */
  const FactsCard = (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {isEn ? "Information the AI will use" : "Information som AI:n använder"}
        </p>
        <button type="button" onClick={onOpenPersonalInfo} disabled={loading}
          className="flex items-center gap-1 text-[11px] font-semibold disabled:opacity-40" style={{ color: NAVY }}>
          <Icon icon="tabler:edit" className="w-3 h-3" />
          {isEn ? "Edit" : "Redigera"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {facts.map(f => (
          <div key={f.label} className="flex items-center gap-1.5 min-w-0 text-xs">
            <Icon icon={f.value.trim() ? "tabler:circle-check-filled" : "tabler:circle-dashed"}
              className={clsx("w-3.5 h-3.5 flex-shrink-0", f.value.trim() ? "text-green-500" : "text-amber-400")} />
            <span className={clsx("truncate", f.value.trim() ? "text-gray-600" : "text-gray-400")}>{f.label}</span>
          </div>
        ))}
      </div>
      {missingFacts.length > 0 && (
        <p className="mt-2.5 text-[11px] text-amber-700 leading-relaxed">
          {isEn
            ? `${missingFacts.length} item(s) missing — the draft will contain placeholders like [enter …] for these. You can fill them in first for a complete contract.`
            : `${missingFacts.length} uppgift(er) saknas — utkastet får platshållare som [ange …] för dessa. Fyll gärna i dem först för ett komplett avtal.`}
        </p>
      )}
      <p className="mt-2 flex items-start gap-1.5 text-[10px] text-gray-400 leading-relaxed">
        <Icon icon="tabler:lock" className="w-3 h-3 flex-shrink-0 mt-0.5" />
        {isEn
          ? "Personal data (name, personal number, addresses) is never sent to the AI."
          : "Personuppgifter (namn, personnummer, adresser) skickas aldrig till AI:n."}
      </p>
    </div>
  )

  const OptionsBlock = (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-gray-600">{isEn ? "Contract language" : "Avtalsspråk"}</p>
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          {(["sv", "en"] as const).map(l => (
            <button key={l} type="button" onClick={() => setLanguage(l)} disabled={loading}
              className={clsx("px-3 py-1 rounded-md text-xs font-medium transition-all",
                language === l ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700")}>
              {l === "sv" ? "Svenska" : "English"}
            </button>
          ))}
        </div>
      </div>

      {filledSections.length > 0 && (
        <div className="rounded-xl border border-gray-100 p-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" checked={keepExisting} onChange={e => setKeepExisting(e.target.checked)} disabled={loading}
              className="mt-0.5 w-4 h-4 rounded border-gray-300" />
            <span className="text-xs text-gray-600 leading-relaxed">
              <span className="font-medium text-gray-800">
                {isEn ? "Keep the sections I've already written" : "Behåll avsnitten jag redan har skrivit"}
              </span>
              <br />
              {keepExisting
                ? (isEn
                  ? `${filledSections.length} section(s) stay as they are; the AI fills in the rest to match.`
                  : `${filledSections.length} avsnitt behålls; AI:n fyller i resten så att det passar ihop.`)
                : (isEn
                  ? `All ${filledSections.length} written section(s) will be replaced by the new draft.`
                  : `Alla ${filledSections.length} skrivna avsnitt ersätts av det nya utkastet.`)}
            </span>
          </label>
        </div>
      )}
    </div>
  )

  const Disclaimer = (
    <div className="flex items-start gap-1.5 text-[10px] text-gray-400 leading-relaxed">
      <Icon icon="tabler:info-circle" className="w-3 h-3 flex-shrink-0 mt-0.5" />
      {isEn
        ? "AI-drafted text is a starting point only — always review each section for legal accuracy before sending to the employee."
        : "AI-genererad text är endast en utgångspunkt — granska alltid varje avsnitt för juridisk korrekthet innan det skickas till medarbetaren."}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-gray-100 rounded-t-2xl">
          <div className="flex items-center gap-2.5 min-w-0">
            {step !== "choose" && (
              <button onClick={() => { setStep("choose"); setError(null) }} disabled={loading}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 flex-shrink-0 disabled:opacity-40">
                <Icon icon="tabler:arrow-left" className="w-4 h-4" />
              </button>
            )}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: PURPLE_LIGHT }}>
              <Icon icon="tabler:wand" className="w-4 h-4" style={{ color: PURPLE }} />
            </div>
            <h2 className="font-semibold text-gray-800 text-base truncate">
              {step === "ai_scratch"
                ? (isEn ? "Generate with AI" : "Generera med AI")
                : step === "from_template"
                  ? (isEn ? "Generate from Template" : "Generera från Mall")
                  : (isEn ? "Generate Contract" : "Generera Kontrakt")}
            </h2>
          </div>
          <button onClick={onClose} disabled={loading} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 disabled:opacity-40 flex-shrink-0">
            <Icon icon="tabler:x" className="w-4 h-4" />
          </button>
        </div>

        {/* ── STEP: choose ── */}
        {step === "choose" && (
          <div className="p-5 space-y-3">
            <p className="text-xs text-gray-500 mb-1">
              {isEn ? "How do you want to generate this contract?" : "Hur vill du generera detta kontrakt?"}
            </p>

            <button onClick={() => setStep("ai_scratch")}
              className="w-full flex items-start gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-purple-200 hover:bg-purple-50/40 transition-all text-left">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: PURPLE_LIGHT }}>
                <Icon icon="tabler:sparkles" className="w-5 h-5" style={{ color: PURPLE }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">{isEn ? "Use AI to generate contract" : "Använd AI för att generera kontrakt"}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isEn
                    ? "AI drafts every section from the information you filled in, following Swedish employment law."
                    : "AI skriver alla avsnitt utifrån informationen du fyllt i, enligt svensk arbetsrätt."}
                </p>
              </div>
              <Icon icon="tabler:chevron-right" className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0 mt-1" />
            </button>

            <button onClick={() => setStep("from_template")}
              className="w-full flex items-start gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-left">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: LIGHT }}>
                <Icon icon="tabler:file-symlink" className="w-5 h-5" style={{ color: NAVY }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">{isEn ? "Generate from one of your templates" : "Generera utifrån en av dina mallar"}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isEn
                    ? "AI adapts your company's own contract template to this employee and fills every section."
                    : "AI anpassar företagets egen kontraktsmall till denna medarbetare och fyller alla avsnitt."}
                </p>
              </div>
              <Icon icon="tabler:chevron-right" className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0 mt-1" />
            </button>
          </div>
        )}

        {/* ── STEP: AI from scratch ── */}
        {step === "ai_scratch" && (
          <div className="p-5 space-y-4">
            {FactsCard}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">
                {isEn ? "Additional instructions (optional)" : "Ytterligare instruktioner (valfritt)"}
              </p>
              <textarea
                value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} disabled={loading}
                placeholder={isEn
                  ? "e.g. \"6 months probation, hybrid work 2 days/week from home, reports to the CTO, wellness allowance 5 000 kr/year.\""
                  : "t.ex. \"6 månaders provanställning, hybridarbete 2 dagar/vecka hemifrån, rapporterar till CTO, friskvårdsbidrag 5 000 kr/år.\""}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none outline-none focus:ring-2 focus:ring-purple-100 disabled:bg-gray-50"
              />
            </div>
            {OptionsBlock}
            {Disclaimer}
          </div>
        )}

        {/* ── STEP: from template ── */}
        {step === "from_template" && (
          <div className="p-5 space-y-4">
            {templatesLoading ? (
              <div className="py-10 flex items-center justify-center gap-2 text-sm text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                {isEn ? "Loading templates…" : "Laddar mallar…"}
              </div>
            ) : templatesError ? (
              <div className="py-10 text-center text-sm text-red-500">
                {isEn ? "Couldn't load your reference files." : "Kunde inte ladda dina referensfiler."}
              </div>
            ) : templates.length === 0 ? (
              <div className="py-10 text-center">
                <Icon icon="tabler:folder-off" className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">
                  {isEn ? "No reference files uploaded yet." : "Inga referensfiler uppladdade än."}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {isEn ? "Upload a company contract template first, from Reference Files." : "Ladda upp en kontraktsmall från Referensfiler först."}
                </p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs text-gray-500 mb-2">{isEn ? "Choose a template to base this contract on:" : "Välj en mall att basera kontraktet på:"}</p>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {templates.map(file => {
                      const cfg = fileIcon(file.mimeType)
                      const readable = isReadableTemplate(file)
                      const selected = selectedTemplateId === file.id
                      return (
                        <button key={file.id} type="button"
                          onClick={() => readable && setSelectedTemplateId(file.id)}
                          disabled={!readable || loading}
                          className={clsx("w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                            !readable ? "border-gray-100 opacity-50 cursor-not-allowed"
                              : selected ? "border-purple-300 bg-purple-50/60" : "border-gray-100 hover:border-gray-200")}>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                            <Icon icon={cfg.icon} className="w-5 h-5" style={{ color: cfg.color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                            <p className="text-xs text-gray-400">
                              {readable
                                ? formatFileSize(file.sizeBytes)
                                : (isEn ? "Old .doc format — save as .docx or PDF" : "Gammalt .doc-format — spara som .docx eller PDF")}
                            </p>
                          </div>
                          {readable && (
                            <Icon icon={selected ? "tabler:circle-check-filled" : "tabler:circle"}
                              className={clsx("w-4 h-4 flex-shrink-0", selected ? "text-purple-500" : "text-gray-300")} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {FactsCard}

                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1.5">{isEn ? "Additional notes (optional)" : "Ytterligare anteckningar (valfritt)"}</p>
                  <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} disabled={loading}
                    placeholder={isEn ? "Anything specific to adjust for this employee…" : "Något specifikt att justera för denna medarbetare…"}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none outline-none focus:ring-2 focus:ring-purple-100 disabled:bg-gray-50" />
                </div>

                {OptionsBlock}
                {Disclaimer}
              </>
            )}
          </div>
        )}

        {/* Error */}
        {error && step !== "choose" && (
          <div className="mx-5 mb-4 flex items-start gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
            <Icon icon="tabler:alert-circle" className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Footer */}
        {step !== "choose" && (
          <div className="flex items-center justify-between gap-3 px-5 py-4 bg-gray-50 border-t border-gray-100 sticky bottom-0">
            <span className="text-[11px] text-gray-400">
              {loading ? (isEn ? "This can take up to a minute…" : "Detta kan ta upp till en minut…") : ""}
            </span>
            <div className="flex items-center gap-3">
              <button onClick={onClose} disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-all">
                {isEn ? "Cancel" : "Avbryt"}
              </button>
              <button onClick={handleGenerate} disabled={loading || !canGenerate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50"
                style={{ backgroundColor: step === "from_template" ? NAVY : PURPLE }}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    {isEn ? "Generating…" : "Genererar…"}
                  </>
                ) : (
                  <>
                    <Icon icon="tabler:wand" className="w-4 h-4" />
                    {isEn ? "Generate Draft" : "Generera Utkast"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
