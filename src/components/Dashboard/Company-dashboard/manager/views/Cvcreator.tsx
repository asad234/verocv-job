"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import { Icon } from "@iconify/react"
import CVPdfPreviewDialog from "./CVPdfPreviewDialog"
import { useManagerTranslations } from "@/utils/Managertranslations"
import { loadManagedEmployees, type CoveringFor } from "@/utils/coveredTeam"
import { CoveringBadge, CoveringNotice } from "@/components/Dashboard/Company-dashboard/manager/delegation/CoveringBadge"

const NAVY = "rgb(5,22,80)"

interface EmployeeSummary {
  employeeId: string
  employeeName: string
  employeeEmail: string
  acceptedAt: string | null
  /** Set when this employee belongs to a colleague you're covering for. */
  coveringFor?: CoveringFor
}

interface CV {
  id: string
  name: string
  isPublic?: boolean
  url?: string
  template?: string
  updatedAt: string
  createdAt: string
  personalInfo?: { firstName?: string; lastName?: string; title?: string }
  experience?: unknown[]
  education?: unknown[]
  skills?: unknown[]
}

interface CoverLetter {
  id: string
  jobTitle: string
  companyName?: string
  content: string
  tone?: string
  createdAt: string
  cv?: string | { id: string; name?: string } | null
}

type TFunc = ReturnType<typeof useManagerTranslations>["t"]

/* ─────────────────────────────────────────────
   CV DETAIL DIALOG — read-only summary
───────────────────────────────────────────── */
function CVDetailDialog({ cv, onClose, onViewPdf, t, locale }: { cv: CV; onClose: () => void; onViewPdf: () => void; t: TFunc; locale: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: NAVY }}>
              <Icon icon="tabler:file-text" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{cv.name}</h2>
              {cv.template && <p className="text-xs text-gray-400 capitalize mt-0.5">{cv.template} {t.templateSuffix}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <Icon icon="tabler:x" className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {cv.personalInfo?.firstName && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{t.nameLabel}</p>
              <p className="text-sm text-gray-800">{cv.personalInfo.firstName} {cv.personalInfo.lastName}</p>
              {cv.personalInfo.title && <p className="text-xs text-gray-500 mt-0.5">{cv.personalInfo.title}</p>}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: "tabler:briefcase", label: t.experienceStatLabel, count: cv.experience?.length ?? 0 },
              { icon: "tabler:school", label: t.educationStatLabel, count: cv.education?.length ?? 0 },
              { icon: "tabler:bulb", label: t.skills, count: cv.skills?.length ?? 0 },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-gray-50 p-3 text-center">
                <Icon icon={s.icon} className="w-5 h-5 mx-auto mb-1.5 text-gray-400" />
                <p className="text-lg font-bold text-gray-800">{s.count}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
          {cv.isPublic && cv.url && (
            <div className="rounded-xl bg-green-50 border border-green-100 px-3 py-2 flex items-center gap-2">
              <Icon icon="tabler:world" className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-xs text-green-700">{t.cvIsPublicText}</span>
            </div>
          )}
          <p className="text-xs text-gray-400">
            {t.lastUpdatedLabel} {new Date(cv.updatedAt).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50/60 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100">
            {t.closeBtn}
          </button>
          <button onClick={onViewPdf}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:shadow-lg transition-all"
            style={{ backgroundColor: NAVY }}>
            <Icon icon="tabler:eye" className="w-4 h-4" />
            {t.viewAsPdfBtn}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   COVER LETTER DETAIL DIALOG
───────────────────────────────────────────── */
function CoverLetterDetailDialog({ letter, onClose }: { letter: CoverLetter; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-900">{letter.jobTitle}</h2>
            {letter.companyName && <p className="text-xs text-gray-400 mt-0.5">{letter.companyName}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <Icon icon="tabler:x" className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{letter.content}</p>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   SEARCH HELPERS
   Case- and accent-insensitive ("ostlund" finds "Östlund"); every word
   typed must match the name or the email.
───────────────────────────────────────────── */
const fold = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

function matchesQuery(text: string, query: string) {
  const words = fold(query).split(/\s+/).filter(Boolean)
  const hay = fold(text)
  return words.every((w) => hay.includes(w))
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "")).toUpperCase() || "?"
}

/** Wraps the parts of `text` that match the query in <mark>. */
function Highlight({ text, query }: { text: string; query: string }) {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (!words.length) return <>{text}</>
  const folded = fold(text)
  if (folded.length !== text.length) return <>{text}</> // rare characters change length — skip highlighting
  const marks = new Array(text.length).fill(false)
  for (const w of words) {
    let i = folded.indexOf(w)
    while (i !== -1) { for (let k = i; k < i + w.length; k++) marks[k] = true; i = folded.indexOf(w, i + w.length) }
  }
  const out: React.ReactNode[] = []
  let start = 0
  for (let i = 1; i <= text.length; i++) {
    if (i === text.length || marks[i] !== marks[start]) {
      const piece = text.slice(start, i)
      out.push(marks[start] ? <mark key={start} className="bg-amber-100 text-gray-900 rounded-sm">{piece}</mark> : piece)
      start = i
    }
  }
  return <>{out}</>
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function EmployeeCVs() {
  const { t, language } = useManagerTranslations()
  const locale = language === "en" ? "en-US" : "sv-SE"
  const isEn = language === "en"

  const [employees, setEmployees] = useState<EmployeeSummary[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState("")

  const [selected, setSelected] = useState<EmployeeSummary | null>(null)

  // Employee search + sort
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "recent">("name")
  const [activeIndex, setActiveIndex] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Search inside the selected employee's CVs / cover letters
  const [itemQuery, setItemQuery] = useState("")
  const [tab, setTab] = useState<"cvs" | "letters">("cvs")

  const [cvs, setCVs] = useState<CV[]>([])
  const [letters, setLetters] = useState<CoverLetter[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [itemsError, setItemsError] = useState("")

  const [viewingCV, setViewingCV] = useState<CV | null>(null)
  const [pdfCV, setPdfCV] = useState<CV | null>(null)
  const [viewingLetter, setViewingLetter] = useState<CoverLetter | null>(null)

  useEffect(() => {
    let cancelled = false
    // Your employees + the team of any colleague you're covering for.
    loadManagedEmployees<EmployeeSummary>()
      .then((list) => { if (!cancelled) setEmployees(list) })
      .catch(() => { if (!cancelled) setListError(t.failedToLoadEmployees) })
      .finally(() => { if (!cancelled) setLoadingList(false) })
    return () => { cancelled = true }
  }, [t.failedToLoadEmployees])

  const displayName = (e: EmployeeSummary) => e.employeeName || e.employeeEmail

  const filteredEmployees = useMemo(() => {
    const list = employees.filter((e) => !query.trim() || matchesQuery(`${e.employeeName} ${e.employeeEmail}`, query))
    return [...list].sort((a, b) =>
      sortBy === "recent"
        ? new Date(b.acceptedAt ?? 0).getTime() - new Date(a.acceptedAt ?? 0).getTime()
        : displayName(a).localeCompare(displayName(b), locale, { sensitivity: "base" }),
    )
  }, [employees, query, sortBy, locale])

  useEffect(() => { setActiveIndex(0) }, [query, sortBy])

  // "/" focuses the search box (unless you're already typing somewhere).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (e.key === "/" && !(el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable))) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      const next = Math.max(0, Math.min(filteredEmployees.length - 1, activeIndex + (e.key === "ArrowDown" ? 1 : -1)))
      setActiveIndex(next)
      listRef.current?.querySelector<HTMLElement>(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" })
    } else if (e.key === "Enter") {
      const emp = filteredEmployees[activeIndex]
      if (emp) loadEmployeeData(emp)
    } else if (e.key === "Escape") {
      setQuery("")
    }
  }

  const visibleCVs = useMemo(
    () => cvs.filter((cv) => !itemQuery.trim() || matchesQuery(`${cv.name} ${cv.template ?? ""} ${cv.personalInfo?.title ?? ""}`, itemQuery)),
    [cvs, itemQuery],
  )
  const visibleLetters = useMemo(
    () => letters.filter((l) => !itemQuery.trim() || matchesQuery(`${l.jobTitle} ${l.companyName ?? ""}`, itemQuery)),
    [letters, itemQuery],
  )

  const loadEmployeeData = (emp: EmployeeSummary) => {
    setSelected(emp)
    setItemQuery("")
    // On phones the list sits above the content — jump down to it.
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      requestAnimationFrame(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
    }
    setCVs([])
    setLetters([])
    setItemsError("")
    setLoadingItems(true)

    Promise.all([
      fetch(`/api/company/managers/employees/${emp.employeeId}/cvs`).then((r) => r.json()),
      fetch(`/api/company/managers/employees/${emp.employeeId}/cover-letters`).then((r) => r.json()),
    ])
      .then(([cvBody, letterBody]) => {
        setCVs(cvBody.data ?? [])
        setLetters(letterBody.data ?? [])
      })
      .catch(() => setItemsError(t.failedToLoadCvsLetters))
      .finally(() => setLoadingItems(false))
  }

  return (
    <div className="p-4 sm:p-6 m-2 sm:m-4">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}>
            <Icon icon="tabler:files" className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t.cvsTitle}</h1>
        </div>
        <p className="text-gray-500 text-sm ml-12">
          {t.cvsSubtitle}
        </p>
      </div>

      <CoveringNotice language={language} />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Employee list + search */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden lg:sticky lg:top-4">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t.employeesListLabel}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-900">{employees.length}</span>
              </div>

              <div className="relative">
                <Icon icon="tabler:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onSearchKeyDown}
                  placeholder={isEn ? "Search by name or email…" : "Sök på namn eller e-post…"}
                  aria-label={isEn ? "Search employees" : "Sök medarbetare"}
                  className="w-full pl-9 pr-16 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/60 outline-none focus:bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all [&::-webkit-search-cancel-button]:hidden"
                />
                {query ? (
                  <button onClick={() => { setQuery(""); searchRef.current?.focus() }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    aria-label={isEn ? "Clear search" : "Rensa sökning"}>
                    <Icon icon="tabler:x" className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden lg:flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center px-1.5 h-5 rounded border border-gray-200 bg-white text-[10px] font-medium text-gray-400">/</kbd>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400">
                  {query.trim()
                    ? (isEn ? `${filteredEmployees.length} of ${employees.length}` : `${filteredEmployees.length} av ${employees.length}`)
                    : (isEn ? "Sorted by" : "Sorterat efter")}
                </span>
                <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
                  {([
                    { id: "name", label: isEn ? "A–Ö" : "A–Ö", icon: "tabler:sort-ascending-letters" },
                    { id: "recent", label: isEn ? "Newest" : "Senaste", icon: "tabler:clock" },
                  ] as const).map((o) => (
                    <button key={o.id} onClick={() => setSortBy(o.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${sortBy === o.id ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
                      <Icon icon={o.icon} className="w-3 h-3" />
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List */}
            <div ref={listRef} className="max-h-[50vh] lg:max-h-[calc(100vh-15rem)] overflow-y-auto" role="listbox" aria-label={t.employeesListLabel}>
              {loadingList && (
                <div className="p-6 flex justify-center text-gray-400 text-sm gap-2 items-center">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  {t.loading}
                </div>
              )}

              {!loadingList && listError && <div className="p-4 text-sm text-red-600">{listError}</div>}

              {!loadingList && !listError && employees.length === 0 && (
                <div className="p-6 text-center text-gray-400 text-sm">{t.noEmployees}</div>
              )}

              {!loadingList && !listError && employees.length > 0 && filteredEmployees.length === 0 && (
                <div className="px-6 py-10 text-center">
                  <Icon icon="tabler:user-search" className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    {isEn ? <>No employees match “{query.trim()}”</> : <>Inga medarbetare matchar ”{query.trim()}”</>}
                  </p>
                  <button onClick={() => setQuery("")} className="mt-2 text-xs font-semibold text-blue-800 hover:underline">
                    {isEn ? "Clear search" : "Rensa sökning"}
                  </button>
                </div>
              )}

              {!loadingList && filteredEmployees.map((emp, i) => {
                const isSelected = selected?.employeeId === emp.employeeId
                const isActive = !!query.trim() && i === activeIndex
                return (
                  <button
                    key={emp.employeeId}
                    data-index={i}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => loadEmployeeData(emp)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`relative w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors ${isSelected ? "bg-blue-50/70" : isActive ? "bg-gray-50" : "hover:bg-gray-50"}`}
                  >
                    {isSelected && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full" style={{ backgroundColor: NAVY }} />}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>
                      {initialsOf(displayName(emp))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-medium text-gray-800 truncate"><Highlight text={displayName(emp)} query={query} /></span>
                        <CoveringBadge coveringFor={emp.coveringFor} language={language} compact />
                      </div>
                      <div className="text-xs text-gray-400 truncate"><Highlight text={emp.employeeEmail} query={query} /></div>
                    </div>
                    {isSelected && <Icon icon="tabler:chevron-right" className="w-4 h-4 text-blue-900 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 min-w-0 scroll-mt-4">
          {!selected && (
            <div className="flex flex-col items-center justify-center py-24 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
              <Icon icon="tabler:folder-open" className="w-10 h-10 mb-3 text-gray-300" />
              <p className="text-sm">{t.selectEmployeeCvPrompt}</p>
            </div>
          )}

          {selected && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>
                  {initialsOf(displayName(selected))}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-lg font-bold text-gray-800 truncate">{displayName(selected)}</h2>
                    <CoveringBadge coveringFor={selected.coveringFor} language={language} />
                  </div>
                  {selected.employeeName && <p className="text-xs text-gray-400 truncate">{selected.employeeEmail}</p>}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                  <button onClick={() => setTab("cvs")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "cvs" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>
                    {t.cvsTab} ({cvs.length})
                  </button>
                  <button onClick={() => setTab("letters")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "letters" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>
                    {t.coverLettersTab} ({letters.length})
                  </button>
                </div>
                {(cvs.length + letters.length) > 3 && (
                  <div className="relative sm:w-64">
                    <Icon icon="tabler:filter" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="search"
                      value={itemQuery}
                      onChange={(e) => setItemQuery(e.target.value)}
                      placeholder={tab === "cvs" ? (isEn ? "Filter CVs…" : "Filtrera CV:n…") : (isEn ? "Filter cover letters…" : "Filtrera personliga brev…")}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
                    />
                  </div>
                )}
              </div>

              {loadingItems && (
                <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  {t.loading}
                </div>
              )}

              {!loadingItems && itemsError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{itemsError}</div>
              )}

              {!loadingItems && !itemsError && tab === "cvs" && (
                cvs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
                    <Icon icon="tabler:file-off" className="w-10 h-10 mb-3 text-gray-300" />
                    <p className="text-sm">{t.noCvsYet}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visibleCVs.length === 0 && (
                      <p className="col-span-full text-sm text-gray-400 py-8 text-center">{isEn ? "No CVs match your filter." : "Inga CV:n matchar filtret."}</p>
                    )}
                    {visibleCVs.map((cv) => (
                      <button key={cv.id} onClick={() => setViewingCV(cv)}
                        className="text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "rgb(239,246,255)" }}>
                          <Icon icon="tabler:file-text" className="w-5 h-5" style={{ color: NAVY }} />
                        </div>
                        <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">{cv.name}</h3>
                        {cv.personalInfo?.firstName && (
                          <p className="text-xs text-gray-400">{cv.personalInfo.firstName} {cv.personalInfo.lastName}</p>
                        )}
                        <p className="text-xs text-gray-300 mt-2">
                          {t.updatedLabel} {new Date(cv.updatedAt).toLocaleDateString(locale, { month: "short", day: "numeric" })}
                        </p>
                      </button>
                    ))}
                  </div>
                )
              )}

              {!loadingItems && !itemsError && tab === "letters" && (
                letters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
                    <Icon icon="tabler:mail-off" className="w-10 h-10 mb-3 text-gray-300" />
                    <p className="text-sm">{t.noCoverLettersYet}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visibleLetters.length === 0 && (
                      <p className="col-span-full text-sm text-gray-400 py-8 text-center">{isEn ? "No cover letters match your filter." : "Inga personliga brev matchar filtret."}</p>
                    )}
                    {visibleLetters.map((letter) => (
                      <button key={letter.id} onClick={() => setViewingLetter(letter)}
                        className="text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "rgb(240,253,244)" }}>
                          <Icon icon="tabler:mail" className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">{letter.jobTitle}</h3>
                        {letter.companyName && <p className="text-xs text-gray-400">{letter.companyName}</p>}
                        <p className="text-xs text-gray-300 mt-2">
                          {new Date(letter.createdAt).toLocaleDateString(locale, { month: "short", day: "numeric" })}
                        </p>
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {viewingCV && <CVDetailDialog cv={viewingCV} onClose={() => setViewingCV(null)} onViewPdf={() => { setPdfCV(viewingCV); setViewingCV(null) }} t={t} locale={locale} />}
      {pdfCV && <CVPdfPreviewDialog cv={pdfCV} onClose={() => setPdfCV(null)} />}
      {viewingLetter && <CoverLetterDetailDialog letter={viewingLetter} onClose={() => setViewingLetter(null)} />}

    </div>
  )
}
