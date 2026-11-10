"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/admin/views/EmployeeProfile.tsx   (NEW)
// WHAT IT DOES:   Business admin → one employee's page (view "employee_profile").
//   Contact, employment, about, managers (with access level), contracts, activity.
//   Buttons: Message (chat) · CV & portfolio (side panel → CV as PDF).
//   Contracts: signed ones (employee + manager) open as PDF in a viewer.
//   Contact + employment are only shown when a manager has "Full access".
//   Data: GET /api/company/admin/employees/:id
// ══════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from "react"
import type React from "react"
import { Icon } from "@iconify/react"
import { useBusinessAdmin } from "../Businessadmincontext"
import { useBusinessAdminTranslations } from "@/utils/Businessadmintranslations"
import { employeesApi, type EmployeeProfile as Profile } from "@/utils/adminEmployees"
import { ARRANGEMENT_LABELS, NOTICE_LABELS, STATUS_LABELS, TYPE_LABELS, label } from "@/utils/employmentDetails"
import EmployeeDocsDrawer from "./EmployeeDocsDrawer"
import { AccessChip } from "./EmployeesView"
import { employeesTx, formatDate, initials, relativeTime, type EmployeesTx } from "./employeesText"

const NAVY = "rgb(5,22,80)"

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <h2 className="flex items-center gap-2 px-5 py-4 border-b border-gray-50 text-sm font-semibold text-gray-900">
        <Icon icon={icon} className="w-4 h-4" style={{ color: NAVY }} />{title}
      </h2>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Row({ label, value, href, icon }: { label: string; value?: string | null; href?: string; icon: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon icon={icon} className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        {value ? (
          href ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="text-sm font-medium text-gray-900 hover:underline break-all">{value}</a>
            : <p className="text-sm font-medium text-gray-900 break-words">{value}</p>
        ) : <p className="text-sm text-gray-300">—</p>}
      </div>
    </div>
  )
}

const CONTRACT_STYLE: Record<string, string> = {
  signed: "bg-emerald-50 text-emerald-700",
  active: "bg-emerald-50 text-emerald-700",
  sent: "bg-blue-50 text-blue-700",
  pending_signature: "bg-amber-50 text-amber-700",
  declined: "bg-red-50 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
  expired: "bg-gray-100 text-gray-500",
}
const tel = (n: string) => `tel:${n.replace(/\s/g, "")}`
const web = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`)

type Contract = Profile["contracts"][number]

/* ─── Signed contract PDF viewer ─── */
function ContractPdfViewer({ employeeId, contract, tx, language, onClose }: {
  employeeId: string; contract: Contract; tx: EmployeesTx; language: string; onClose: () => void
}) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading")
  const [url, setUrl] = useState("")
  const src = employeesApi.contractPdfUrl(employeeId, contract.id)

  // Fetch first (so errors show as a message, not a broken frame), then show the blob.
  useEffect(() => {
    let alive = true
    let made = ""
    fetch(src, { credentials: "include", cache: "no-store" })
      .then(async (r) => {
        if (!r.ok || !(r.headers.get("content-type") ?? "").includes("pdf")) throw new Error()
        made = URL.createObjectURL(await r.blob())
        if (alive) { setUrl(made); setState("ok") }
      })
      .catch(() => alive && setState("error"))
    return () => { alive = false; if (made) URL.revokeObjectURL(made) }
  }, [src])

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", k)
    return () => document.removeEventListener("keydown", k)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-gray-900/70" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={contract.title}
        className="relative w-full max-w-5xl h-[94vh] flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-gray-100">
          <Icon icon="tabler:file-type-pdf" className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 truncate">{contract.title}</p>
            <p className="text-xs text-gray-500 truncate">
              {[contract.managerName, contract.signedAt ? `${tx.signedOn} ${formatDate(contract.signedAt, language)}` : ""].filter(Boolean).join(" · ")}
            </p>
          </div>
          <a href={src} target="_blank" rel="noopener noreferrer" title={tx.openNewTab} aria-label={tx.openNewTab}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50">
            <Icon icon="tabler:external-link" className="w-3.5 h-3.5" /><span className="hidden sm:inline">{tx.openNewTab}</span>
          </a>
          <a href={employeesApi.contractPdfUrl(employeeId, contract.id, true)} title={tx.download} aria-label={tx.download}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: NAVY }}>
            <Icon icon="tabler:download" className="w-3.5 h-3.5" /><span className="hidden sm:inline">{tx.download}</span>
          </a>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label={tx.close}>
            <Icon icon="tabler:x" className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 bg-gray-100">
          {state === "ok" ? (
            <iframe src={url} title={contract.title} className="w-full h-full bg-white" />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-sm text-gray-500 p-6 text-center">
              <Icon icon={state === "error" ? "tabler:alert-circle" : "tabler:loader-2"} className={`w-8 h-8 ${state === "error" ? "text-red-300" : "animate-spin text-gray-300"}`} />
              {state === "error" ? tx.pdfFailed : tx.pdfLoading}
              {state === "error" && <a href={src} target="_blank" rel="noopener noreferrer" className="font-semibold underline" style={{ color: NAVY }}>{tx.openNewTab}</a>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EmployeeProfile() {
  const { language } = useBusinessAdminTranslations()
  const lang = language === "en" ? "en" : "sv"
  const tx = employeesTx(language)
  const { selectedEmployeeId, setView, openChat } = useBusinessAdmin()
  const [p, setP] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const [pdfContract, setPdfContract] = useState<Contract | null>(null)

  const load = useCallback(async () => {
    if (!selectedEmployeeId) return
    setLoading(true)
    setError(false)
    try {
      setP(await employeesApi.get(selectedEmployeeId))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [selectedEmployeeId])
  useEffect(() => { load() }, [load])

  const back = (
    <button onClick={() => setView("employees")} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 mb-4">
      <Icon icon="tabler:arrow-left" className="w-4 h-4" />{tx.back}
    </button>
  )

  if (!selectedEmployeeId || error) {
    return (
      <div className="max-w-6xl mx-auto">
        {back}
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-sm text-gray-600">{tx.loadProfileFailed}</p>
          {selectedEmployeeId && <button onClick={load} className="mt-2 text-sm font-semibold underline" style={{ color: NAVY }}>{tx.retry}</button>}
        </div>
      </div>
    )
  }

  if (loading || !p) {
    return (
      <div className="max-w-6xl mx-auto">
        {back}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-100" />
          <div className="space-y-2 flex-1"><div className="h-5 w-48 bg-gray-100 rounded" /><div className="h-3 w-64 bg-gray-100 rounded" /></div>
        </div>
      </div>
    )
  }

  const pi = p.personal
  const ed = p.employment
  // Best access over all managers (what the admin sees).
  const levels: ("full" | "cv_only" | "portfolio_only")[] = p.canSeeProfile
    ? ["full"]
    : [...(p.canSeeCvs ? ["cv_only" as const] : []), ...(p.canSeePortfolio ? ["portfolio_only" as const] : [])]
  const canDocs = p.canSeeCvs || p.canSeePortfolio
  const signedCount = p.contracts.filter((c) => c.signed).length

  return (
    <div className="max-w-6xl mx-auto">
      {back}

      {/* Hero */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="h-20 sm:h-24" style={{ background: "linear-gradient(120deg, rgb(15,118,110) 0%, rgb(5,22,80) 100%)" }} />
        <div className="px-5 sm:px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="-mt-10 w-20 h-20 rounded-full ring-4 ring-white flex items-center justify-center text-2xl font-bold flex-shrink-0" style={{ backgroundColor: "rgb(204,251,241)", color: "rgb(15,118,110)" }}>
              {initials(p.name)}
            </div>
            <div className="flex-1 min-w-0 sm:pt-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{p.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5 truncate">{[p.title || ed?.presentTitle, ed?.employerName].filter(Boolean).join(" · ") || p.email}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">{levels.map((l) => <AccessChip key={l} level={l} tx={tx} />)}</div>
            </div>
            <div className="flex flex-wrap gap-2 sm:pt-3">
              <button onClick={() => openChat(p.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:shadow-md" style={{ backgroundColor: NAVY }}>
                <Icon icon="tabler:message-circle" className="w-4 h-4" />{tx.message}
              </button>
              <button onClick={() => setDocsOpen(true)} disabled={!canDocs}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <Icon icon="tabler:eye" className="w-4 h-4" />{tx.docsBtn}
              </button>
            </div>
          </div>
        </div>
      </div>

      {!p.canSeeProfile && (
        <div className="flex items-start gap-2.5 p-4 mb-6 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
          <Icon icon="tabler:lock" className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {tx.limited(levels.map((l) => tx.access[l]).join(" + ") || "—")}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {p.canSeeProfile && (
            <Card title={tx.contact} icon="tabler:address-book">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <Row icon="tabler:mail" label={tx.email} value={p.email} href={`mailto:${p.email}`} />
                <Row icon="tabler:mail-opened" label={tx.privateEmail} value={pi?.privateEmail} href={pi?.privateEmail ? `mailto:${pi.privateEmail}` : undefined} />
                <Row icon="tabler:briefcase" label={tx.workEmail} value={pi?.workEmail} href={pi?.workEmail ? `mailto:${pi.workEmail}` : undefined} />
                <Row icon="tabler:phone" label={tx.phone} value={pi?.phone} href={pi?.phone ? tel(pi.phone) : undefined} />
                <Row icon="tabler:device-mobile" label={tx.workPhone} value={pi?.workPhone} href={pi?.workPhone ? tel(pi.workPhone) : undefined} />
                <Row icon="tabler:brand-linkedin" label={tx.linkedIn} value={pi?.linkedIn} href={pi?.linkedIn ? web(pi.linkedIn) : undefined} />
                <Row icon="tabler:map-pin" label={tx.address} value={pi?.homeAddress} />
              </div>
            </Card>
          )}

          {p.canSeeProfile && (
            <Card title={tx.employment} icon="tabler:building">
              {!ed ? (
                <p className="text-sm text-gray-500">{tx.noEmployment}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  <Row icon="tabler:id-badge-2" label={tx.presentTitle} value={ed.presentTitle} />
                  <Row icon="tabler:building-skyscraper" label={tx.employer} value={ed.employerName} />
                  <Row icon="tabler:circle-check" label={tx.status} value={label(STATUS_LABELS, ed.employmentStatus, lang)} />
                  <Row icon="tabler:file-certificate" label={tx.type} value={label(TYPE_LABELS, ed.employmentType, lang)} />
                  <Row icon="tabler:percentage" label={tx.rate} value={ed.employmentRate} />
                  <Row icon="tabler:home-2" label={tx.arrangement} value={label(ARRANGEMENT_LABELS, ed.workArrangement, lang)} />
                  <Row icon="tabler:map-pin" label={tx.city} value={ed.officeLocation} />
                  <Row icon="tabler:calendar" label={tx.start} value={ed.employmentDate ? formatDate(ed.employmentDate, language) : ""} />
                  {ed.employmentEndDate && <Row icon="tabler:calendar-off" label={tx.end} value={formatDate(ed.employmentEndDate, language)} />}
                  <Row icon="tabler:hourglass" label={tx.notice} value={label(NOTICE_LABELS, ed.noticePeriod, lang)} />
                  {ed.availableFrom && <Row icon="tabler:calendar-event" label={tx.availableFrom} value={formatDate(ed.availableFrom, language)} />}
                </div>
              )}
            </Card>
          )}

          {(pi?.professionalPresentation || pi?.personalPresentation) && (
            <Card title={tx.about} icon="tabler:file-text">
              <div className="space-y-4">
                {pi?.professionalPresentation && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">{tx.professional}</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{pi.professionalPresentation}</p>
                  </div>
                )}
                {pi?.personalPresentation && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">{tx.personal}</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{pi.personalPresentation}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card title={`${tx.contracts} (${p.contracts.length})${signedCount ? ` · ${tx.signedCount(signedCount)}` : ""}`} icon="tabler:file-signature">
            {p.contracts.length === 0 ? (
              <p className="text-sm text-gray-500">{tx.noContracts}</p>
            ) : (
              <ul className="divide-y divide-gray-50 -my-2">
                {p.contracts.map((c) => (
                  <li key={c.id}>
                    <div
                      role={c.signed ? "button" : undefined}
                      tabIndex={c.signed ? 0 : undefined}
                      onClick={c.signed ? () => setPdfContract(c) : undefined}
                      onKeyDown={c.signed ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPdfContract(c) } } : undefined}
                      title={c.signed ? undefined : tx.notSignedYet}
                      className={`flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg ${c.signed ? "cursor-pointer hover:bg-gray-50" : ""}`}
                    >
                      <Icon icon={c.signed ? "tabler:file-type-pdf" : "tabler:file-text"} className={`w-5 h-5 flex-shrink-0 ${c.signed ? "text-red-500" : "text-gray-300"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {[c.managerName, c.signed && c.signedAt ? `${tx.signedOn} ${formatDate(c.signedAt, language)}` : formatDate(c.startDate || c.createdAt, language)].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <span className={`hidden sm:inline text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${CONTRACT_STYLE[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {tx.contractStatus[c.status] ?? c.status}
                      </span>
                      {c.signed ? (
                        <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold whitespace-nowrap bg-white" style={{ color: NAVY }}>
                          <Icon icon="tabler:eye" className="w-3.5 h-3.5" />{tx.viewPdf}
                        </span>
                      ) : (
                        <span className={`sm:hidden text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${CONTRACT_STYLE[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {tx.contractStatus[c.status] ?? c.status}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={tx.colShared} icon="tabler:share">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: tx.tabCvs, value: p.canSeeCvs ? p.cvCount : null, icon: "tabler:files" },
                { label: tx.tabPortfolio, value: p.canSeePortfolio ? p.portfolioCount : null, icon: "tabler:briefcase" },
              ].map((s) => (
                <button key={s.label} onClick={() => setDocsOpen(true)} disabled={s.value === null}
                  className="p-3 rounded-xl bg-gray-50 text-left hover:bg-blue-50 transition-colors disabled:hover:bg-gray-50 disabled:cursor-not-allowed">
                  <p className="text-lg font-bold text-gray-900">{s.value ?? <Icon icon="tabler:lock" className="w-4 h-4 text-gray-300 inline" />}</p>
                  <p className="text-[11px] text-gray-500">{s.label}</p>
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 text-sm">
              <p className="flex justify-between gap-2"><span className="text-gray-500">{tx.connected}</span><span className="font-medium text-gray-800">{formatDate(p.connectedAt, language)}</span></p>
              <p className="flex justify-between gap-2"><span className="text-gray-500">{tx.lastActive}</span><span className="font-medium text-gray-800">{relativeTime(p.lastSeenAt, tx, language)}</span></p>
            </div>
          </Card>

          <Card title={`${tx.managers} (${p.managers.length})`} icon="tabler:users">
            <ul className="space-y-1 -mx-2">
              {p.managers.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0" style={{ backgroundColor: NAVY }}>{initials(m.name)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                    <AccessChip level={m.accessLevel} tx={tx} />
                  </div>
                  <button onClick={() => openChat(m.id)} title={tx.message} aria-label={`${tx.message}: ${m.name}`} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                    <Icon icon="tabler:message-circle" className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {pdfContract && (
        <ContractPdfViewer employeeId={p.id} contract={pdfContract} tx={tx} language={language} onClose={() => setPdfContract(null)} />
      )}
      <EmployeeDocsDrawer employee={docsOpen ? p : null} tx={tx} language={language} onClose={() => setDocsOpen(false)} />
    </div>
  )
}
