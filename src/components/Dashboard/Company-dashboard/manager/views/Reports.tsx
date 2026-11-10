"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/views/Reports.tsx
// WHAT IT DOES:   Manager Reports — LIVE numbers, no mock data. Built from the same
//                 sources as the other manager pages:
//                   Profile / CVs / Portfolios → employees + their CVs, cover letters,
//                                                portfolio items, profile & HR info
//                   Interviews                  → booked / held / cancelled, evaluations
//                   Contracts                   → status, signatures, expiring contracts
//                   Invitations                 → sent / accepted / pending / declined
//                 Data loading: utils/reportsData.ts · Calculations: utils/reportsCompute.ts
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import { useManagerTranslations } from "@/utils/Managertranslations"
import { loadReportData, type ReportData } from "@/utils/reportsData"
import {
  activityBuckets, activityFeed, contractReport, employmentReport, interviewReport, invitationReport,
  kpis, teamCsv, teamRows, type ActivityType, type Kpi, type PeriodKey, type TeamRow,
} from "@/utils/reportsCompute"

/* ─── Constants ─── */
const NAVY = "rgb(5,22,80)"
const LIGHT = "rgb(239,246,255)"
const SERIES = {
  interviews: { color: NAVY, en: "Interviews", sv: "Intervjuer" },
  cvs: { color: "rgb(96,165,250)", en: "CV updates", sv: "CV-uppdateringar" },
  contracts: { color: "rgb(34,197,94)", en: "Contracts signed", sv: "Signerade kontrakt" },
} as const

const PERIODS: { key: PeriodKey; en: string; sv: string; prevEn: string; prevSv: string }[] = [
  { key: "7d", en: "7 days", sv: "7 dagar", prevEn: "vs previous 7 days", prevSv: "mot föregående 7 dagar" },
  { key: "30d", en: "30 days", sv: "30 dagar", prevEn: "vs previous 30 days", prevSv: "mot föregående 30 dagar" },
  { key: "90d", en: "90 days", sv: "90 dagar", prevEn: "vs previous 90 days", prevSv: "mot föregående 90 dagar" },
  { key: "12m", en: "12 months", sv: "12 månader", prevEn: "vs previous 12 months", prevSv: "mot föregående 12 månader" },
]

const CONTRACT_STATUS: Record<string, { en: string; sv: string; color: string }> = {
  draft: { en: "Draft", sv: "Utkast", color: "rgb(148,163,184)" },
  pending_signature: { en: "Waiting for employee", sv: "Väntar på medarbetare", color: "rgb(245,158,11)" },
  pending_manager_signature: { en: "Waiting for you", sv: "Väntar på dig", color: "rgb(99,102,241)" },
  active: { en: "Active", sv: "Aktiv", color: "rgb(34,197,94)" },
  expiring_soon: { en: "Expiring soon", sv: "Löper snart ut", color: "rgb(249,115,22)" },
  expired: { en: "Expired", sv: "Utgånget", color: "rgb(239,68,68)" },
  terminated: { en: "Terminated", sv: "Avslutat", color: "rgb(107,114,128)" },
}

const EMPLOYMENT_STATUS: Record<string, { en: string; sv: string; color: string }> = {
  active: { en: "Active", sv: "Aktiv", color: "rgb(34,197,94)" },
  "on-leave": { en: "On leave", sv: "Ledig", color: "rgb(245,158,11)" },
  terminated: { en: "Terminated", sv: "Avslutad", color: "rgb(239,68,68)" },
  unknown: { en: "Not set", sv: "Ej angivet", color: "rgb(203,213,225)" },
}

const RECOMMENDATION: Record<string, { en: string; sv: string; color: string }> = {
  strong_yes: { en: "Strong yes", sv: "Starkt ja", color: "rgb(21,128,61)" },
  yes: { en: "Yes", sv: "Ja", color: "rgb(74,222,128)" },
  maybe: { en: "Maybe", sv: "Kanske", color: "rgb(250,204,21)" },
  no: { en: "No", sv: "Nej", color: "rgb(248,113,113)" },
  strong_no: { en: "Strong no", sv: "Starkt nej", color: "rgb(185,28,28)" },
}

const ACTIVITY: Record<ActivityType, { icon: string; bg: string; color: string; en: string; sv: string }> = {
  cv_created: { icon: "tabler:file-plus", bg: LIGHT, color: NAVY, en: "CV created", sv: "CV skapat" },
  cv_updated: { icon: "tabler:file-pencil", bg: "rgb(245,243,255)", color: "rgb(109,40,217)", en: "CV updated", sv: "CV uppdaterat" },
  cover_letter: { icon: "tabler:mail", bg: "rgb(240,253,244)", color: "rgb(22,163,74)", en: "Cover letter", sv: "Personligt brev" },
  portfolio: { icon: "tabler:briefcase", bg: "rgb(255,247,237)", color: "rgb(217,119,6)", en: "Portfolio item added", sv: "Portfolioobjekt tillagt" },
  interview_booked: { icon: "tabler:calendar-plus", bg: LIGHT, color: NAVY, en: "Interview booked", sv: "Intervju bokad" },
  interview_completed: { icon: "tabler:calendar-check", bg: "rgb(240,253,244)", color: "rgb(22,101,52)", en: "Interview held", sv: "Intervju genomförd" },
  interview_cancelled: { icon: "tabler:calendar-x", bg: "rgb(243,244,246)", color: "rgb(75,85,99)", en: "Interview cancelled", sv: "Intervju avbokad" },
  interview_no_show: { icon: "tabler:user-x", bg: "rgb(254,242,242)", color: "rgb(185,28,28)", en: "No-show", sv: "Uteblev" },
  contract_sent: { icon: "tabler:send", bg: "rgb(255,251,235)", color: "rgb(146,64,14)", en: "Contract sent", sv: "Kontrakt skickat" },
  contract_signed: { icon: "tabler:signature", bg: "rgb(238,242,255)", color: "rgb(79,70,229)", en: "Employee signed", sv: "Medarbetare signerade" },
  contract_completed: { icon: "tabler:rosette-discount-check", bg: "rgb(240,253,244)", color: "rgb(22,101,52)", en: "Contract fully signed", sv: "Kontrakt fullständigt signerat" },
  contract_terminated: { icon: "tabler:file-x", bg: "rgb(243,244,246)", color: "rgb(75,85,99)", en: "Contract terminated", sv: "Kontrakt avslutat" },
  invitation_sent: { icon: "tabler:mail-forward", bg: LIGHT, color: NAVY, en: "Invitation sent", sv: "Inbjudan skickad" },
  invitation_accepted: { icon: "tabler:user-check", bg: "rgb(240,253,244)", color: "rgb(22,101,52)", en: "Invitation accepted", sv: "Inbjudan accepterad" },
  invitation_declined: { icon: "tabler:user-minus", bg: "rgb(254,242,242)", color: "rgb(185,28,28)", en: "Invitation declined", sv: "Inbjudan nekad" },
}

/* ─── Helpers ─── */
const fmtDate = (d: string | null | undefined, isEn: boolean) =>
  d ? new Date(d).toLocaleDateString(isEn ? "en-GB" : "sv-SE", { day: "numeric", month: "short", year: "numeric" }) : "—"
const fmtShortDate = (d: string, isEn: boolean) =>
  new Date(d).toLocaleDateString(isEn ? "en-GB" : "sv-SE", { day: "numeric", month: "short" })

function relative(d: string, isEn: boolean) {
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60_000)
  if (mins < 1) return isEn ? "Just now" : "Nyss"
  if (mins < 60) return isEn ? `${mins} min ago` : `${mins} min sedan`
  const h = Math.round(mins / 60)
  if (h < 24) return isEn ? `${h}h ago` : `${h} h sedan`
  const days = Math.round(h / 24)
  if (days === 1) return isEn ? "Yesterday" : "Igår"
  if (days < 7) return isEn ? `${days} days ago` : `${days} dagar sedan`
  return fmtDate(d, isEn)
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts.length > 1 ? `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}` : name.slice(0, 2)).toUpperCase()
}

/* ─── Building blocks ─── */
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={clsx("bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden break-inside-avoid", className)}>{children}</div>
)

const CardHeader: React.FC<{ icon: string; title: string; subtitle?: string; action?: React.ReactNode }> = ({ icon, title, subtitle, action }) => (
  <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-gray-100">
    <div className="flex items-center gap-3 min-w-0">
      <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: NAVY }}>
        <Icon icon={icon} className="w-4 h-4 text-white" />
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-bold truncate" style={{ color: NAVY }}>{title}</h2>
        {subtitle && <p className="text-[11px] text-gray-400 truncate">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
)

const Empty: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div className="py-10 px-6 text-center">
    <Icon icon={icon} className="w-8 h-8 text-gray-300 mx-auto mb-2" />
    <p className="text-xs text-gray-400">{text}</p>
  </div>
)

/** Horizontal bar with label + value. */
const BarRow: React.FC<{ label: string; value: number; max: number; color: string; suffix?: string }> = ({ label, value, max, color, suffix }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <span className="text-xs font-bold text-gray-800 tabular-nums">{value}{suffix}</span>
    </div>
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${max ? Math.max(value ? 3 : 0, (value / max) * 100) : 0}%`, backgroundColor: color }} />
    </div>
  </div>
)

const Delta: React.FC<{ kpi: Kpi; isEn: boolean; prevLabel: string }> = ({ kpi, isEn, prevLabel }) => {
  if (kpi.previous == null) return null
  const diff = kpi.value - kpi.previous
  const flat = diff === 0
  return (
    <span title={`${isEn ? "Previous period" : "Föregående period"}: ${kpi.previous} (${prevLabel})`}
      className={clsx("inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md",
        flat ? "text-gray-500 bg-gray-50" : diff > 0 ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50")}>
      <Icon icon={flat ? "tabler:minus" : diff > 0 ? "tabler:trending-up" : "tabler:trending-down"} className="w-3 h-3" />
      {flat ? "0" : `${diff > 0 ? "+" : ""}${diff}`}
    </span>
  )
}

/* ═════════════════════════════════════════════════════════════
   MAIN
═════════════════════════════════════════════════════════════ */
export default function Reports() {
  const { language } = useManagerTranslations()
  const isEn = language === "en"
  const [period, setPeriod] = useState<PeriodKey>("30d")
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<"name" | "profile" | "activity">("activity")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await loadReportData((done, total) => setProgress({ done, total })))
    } catch (e) {
      setError((e as Error).message || (isEn ? "Couldn't load the report." : "Kunde inte ladda rapporten."))
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }, [isEn])

  useEffect(() => { load() }, [load])

  const periodCfg = PERIODS.find(p => p.key === period)!
  const prevLabel = isEn ? periodCfg.prevEn : periodCfg.prevSv

  const k = useMemo(() => (data ? kpis(data, period) : null), [data, period])
  const ivr = useMemo(() => (data ? interviewReport(data.interviews, period) : null), [data, period])
  const cr = useMemo(() => (data ? contractReport(data.contracts) : null), [data])
  const invr = useMemo(() => (data ? invitationReport(data.invitations, period) : null), [data, period])
  const er = useMemo(() => (data ? employmentReport(data) : null), [data])
  const buckets = useMemo(() => (data ? activityBuckets(data, period, isEn) : []), [data, period, isEn])
  const feed = useMemo(() => (data ? activityFeed(data, 12) : []), [data])
  const rows = useMemo(() => {
    if (!data) return [] as TeamRow[]
    const r = teamRows(data, isEn)
    return r.sort((a, b) =>
      sortKey === "name" ? (a.employee.employeeName || a.employee.employeeEmail).localeCompare(b.employee.employeeName || b.employee.employeeEmail, "sv")
        : sortKey === "profile" ? (a.completeness.percent ?? 101) - (b.completeness.percent ?? 101)
          : (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""))
  }, [data, isEn, sortKey])

  const avgCompleteness = useMemo(() => {
    const vals = rows.map(r => r.completeness.percent).filter((v): v is number => v != null)
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  }, [rows])

  const exportCsv = () => {
    const csv = teamCsv(rows, isEn)
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `verocv-team-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const chartMax = Math.max(1, ...buckets.map(b => Math.max(b.interviews, b.cvs, b.contracts)))

  return (
    <div className="p-4 sm:p-6 m-2 sm:m-4 min-h-screen">

      {/* ── Header ── */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}>
              <Icon icon="tabler:chart-bar" className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{isEn ? "Reports" : "Rapporter"}</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            {isEn ? "Live overview of your team, CVs, interviews, contracts and invitations." : "Liveöversikt över ditt team, CV:n, intervjuer, kontrakt och inbjudningar."}
            {data && <span className="text-gray-400"> · {isEn ? "Updated" : "Uppdaterad"} {new Date(data.loadedAt).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}</span>}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap print:hidden">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  period === p.key ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700")}
                style={period === p.key ? { backgroundColor: NAVY } : {}}>
                {isEn ? p.en : p.sv}
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading} title={isEn ? "Refresh" : "Uppdatera"}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50">
            <Icon icon="tabler:refresh" className={clsx("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button onClick={exportCsv} disabled={!rows.length}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
            <Icon icon="tabler:table-export" className="w-3.5 h-3.5" />{isEn ? "Export CSV" : "Exportera CSV"}
          </button>
          <button onClick={() => window.print()} disabled={!data}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
            <Icon icon="tabler:printer" className="w-3.5 h-3.5" />{isEn ? "Print / PDF" : "Skriv ut / PDF"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600 mb-4">
          <Icon icon="tabler:alert-circle" className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={load} className="font-semibold hover:underline">{isEn ? "Try again" : "Försök igen"}</button>
        </div>
      )}
      {data && data.failed.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800 mb-4">
          <Icon icon="tabler:alert-triangle" className="w-4 h-4 flex-shrink-0" />
          {isEn ? `Some data couldn't be loaded and is left out: ${data.failed.join(", ")}.` : `Viss data kunde inte laddas och är utelämnad: ${data.failed.join(", ")}.`}
        </div>
      )}

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-28 gap-3 text-sm text-gray-400">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-800 rounded-full animate-spin" />
          {progress && progress.total > 0
            ? (isEn ? `Collecting data for ${progress.done} of ${progress.total} employees…` : `Hämtar data för ${progress.done} av ${progress.total} medarbetare…`)
            : (isEn ? "Collecting data…" : "Hämtar data…")}
        </div>
      ) : data && k && ivr && cr && invr && er ? (
        <div className="space-y-6">

          {/* ── KPI cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: "tabler:users", color: NAVY, value: k.teamMembers, label: isEn ? "Team members" : "Teammedlemmar",
                sub: isEn ? `${k.pendingInvitations} invitation(s) pending` : `${k.pendingInvitations} inbjudan/-ar väntar`, kpi: null
              },
              {
                icon: "tabler:calendar-check", color: "rgb(5,150,105)", value: k.interviewsHeld.value, label: isEn ? "Interviews held" : "Genomförda intervjuer",
                sub: isEn ? `${k.upcomingInterviews} upcoming` : `${k.upcomingInterviews} kommande`, kpi: k.interviewsHeld
              },
              {
                icon: "tabler:file-certificate", color: "rgb(79,70,229)", value: k.contractsSigned.value, label: isEn ? "Contracts fully signed" : "Fullständigt signerade kontrakt",
                sub: k.awaitingMySignature
                  ? (isEn ? `${k.awaitingMySignature} waiting for your signature` : `${k.awaitingMySignature} väntar på din signatur`)
                  : (isEn ? `${k.awaitingSignature} awaiting signature` : `${k.awaitingSignature} väntar på signatur`), kpi: k.contractsSigned
              },
              {
                icon: "tabler:files", color: "rgb(217,119,6)", value: k.cvActivity.value, label: isEn ? "CVs created / updated" : "CV:n skapade / uppdaterade",
                sub: isEn ? `${k.totalCvs} CVs in total` : `${k.totalCvs} CV:n totalt`, kpi: k.cvActivity
              },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 break-inside-avoid">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: LIGHT }}>
                    <Icon icon={s.icon} className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  {s.kpi && <Delta kpi={s.kpi} isEn={isEn} prevLabel={prevLabel} />}
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-3 tabular-nums">{s.value}</div>
                <div className="text-xs font-medium text-gray-600 mt-0.5">{s.label}</div>
                <div className={clsx("text-[11px] mt-1", i === 2 && k.awaitingMySignature ? "text-indigo-600 font-semibold" : "text-gray-400")}>{s.sub}</div>
              </div>
            ))}
          </div>
          <p className="-mt-3 text-[11px] text-gray-400">
            {isEn ? `Changes are compared ${prevLabel}.` : `Förändringar jämförs ${prevLabel}.`}
          </p>

          {data.employees.length === 0 && data.interviews.length === 0 && data.contracts.length === 0 ? (
            <Card>
              <Empty icon="tabler:chart-dots" text={isEn
                ? "Nothing to report yet. Invite employees, book interviews or send contracts — the report fills in automatically."
                : "Inget att rapportera än. Bjud in medarbetare, boka intervjuer eller skicka kontrakt — rapporten fylls i automatiskt."} />
            </Card>
          ) : (
            <>
              {/* ── Activity chart + interviews ── */}
              <div className="flex flex-col xl:flex-row gap-6">
                <div className="xl:w-[62%]">
                  <Card className="h-full">
                    <CardHeader icon="tabler:chart-histogram" title={isEn ? "Activity over time" : "Aktivitet över tid"}
                      subtitle={isEn ? `Last ${periodCfg.en}` : `Senaste ${periodCfg.sv}`} />
                    <div className="px-5 sm:px-6 pt-4 pb-5">
                      <div className="flex items-center gap-4 flex-wrap mb-4">
                        {(Object.keys(SERIES) as (keyof typeof SERIES)[]).map(key => (
                          <span key={key} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SERIES[key].color }} />
                            {isEn ? SERIES[key].en : SERIES[key].sv}
                            <span className="text-gray-400 tabular-nums">({buckets.reduce((s, b) => s + b[key], 0)})</span>
                          </span>
                        ))}
                      </div>
                      <div className="flex items-end gap-1 sm:gap-2 h-56 xl:h-64">
                        {buckets.map((b, i) => (
                          <div key={i} className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-1"
                            title={`${b.label}: ${b.interviews} ${isEn ? "interviews" : "intervjuer"}, ${b.cvs} ${isEn ? "CV updates" : "CV-uppdateringar"}, ${b.contracts} ${isEn ? "contracts" : "kontrakt"}`}>
                            <div className="w-full flex-1 flex items-end justify-center gap-[2px]">
                              {(Object.keys(SERIES) as (keyof typeof SERIES)[]).map(key => (
                                <div key={key} className="flex-1 max-w-[14px] rounded-t-sm transition-all duration-500"
                                  style={{ height: `${(b[key] / chartMax) * 100}%`, minHeight: b[key] ? 3 : 0, backgroundColor: SERIES[key].color }} />
                              ))}
                            </div>
                            <span className="text-[9px] text-gray-400 truncate max-w-full">{b.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="xl:w-[38%]">
                  <Card className="h-full">
                    <CardHeader icon="tabler:calendar-event" title={isEn ? "Interviews" : "Intervjuer"}
                      subtitle={isEn ? `Scheduled in the last ${periodCfg.en}` : `Inplanerade senaste ${periodCfg.sv}`} />
                    {ivr.total === 0 ? (
                      <Empty icon="tabler:calendar-off" text={isEn ? "No interviews in this period." : "Inga intervjuer under perioden."} />
                    ) : (
                      <div className="p-5 sm:p-6 space-y-4">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {[
                            { v: ivr.total, l: isEn ? "Total" : "Totalt" },
                            { v: ivr.showRate == null ? "—" : `${ivr.showRate}%`, l: isEn ? "Took place" : "Genomförda" },
                            { v: ivr.avgRating == null ? "—" : `${ivr.avgRating}★`, l: isEn ? "Avg. rating" : "Snittbetyg" },
                          ].map((s, i) => (
                            <div key={i} className="rounded-xl bg-gray-50 py-2.5">
                              <div className="text-lg font-bold text-gray-900 tabular-nums">{s.v}</div>
                              <div className="text-[10px] text-gray-400">{s.l}</div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2.5">
                          <BarRow label={isEn ? "Completed" : "Genomförda"} value={ivr.completed} max={ivr.total} color="rgb(34,197,94)" />
                          <BarRow label={isEn ? "Scheduled" : "Bokade"} value={ivr.scheduled} max={ivr.total} color={NAVY} />
                          <BarRow label={isEn ? "Cancelled" : "Avbokade"} value={ivr.cancelled} max={ivr.total} color="rgb(156,163,175)" />
                          <BarRow label={isEn ? "No-show" : "Uteblev"} value={ivr.noShow} max={ivr.total} color="rgb(239,68,68)" />
                        </div>
                        {Object.values(ivr.recommendations).some(Boolean) && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">{isEn ? "Recommendations" : "Rekommendationer"}</p>
                            <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
                              {Object.entries(ivr.recommendations).filter(([, v]) => v).map(([key, v]) => (
                                <div key={key} style={{ width: `${(v / Object.values(ivr.recommendations).reduce((a, b) => a + b, 0)) * 100}%`, backgroundColor: RECOMMENDATION[key]!.color }}
                                  title={`${isEn ? RECOMMENDATION[key]!.en : RECOMMENDATION[key]!.sv}: ${v}`} />
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                              {Object.entries(ivr.recommendations).filter(([, v]) => v).map(([key, v]) => (
                                <span key={key} className="flex items-center gap-1 text-[10px] text-gray-500">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RECOMMENDATION[key]!.color }} />
                                  {isEn ? RECOMMENDATION[key]!.en : RECOMMENDATION[key]!.sv} {v}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {ivr.needsEvaluation > 0 && (
                      <div className="px-5 sm:px-6 py-3 border-t border-amber-100 bg-amber-50/60 text-xs text-amber-800 flex items-center gap-2">
                        <Icon icon="tabler:clipboard-list" className="w-4 h-4" />
                        {isEn ? `${ivr.needsEvaluation} completed interview(s) still need an evaluation.` : `${ivr.needsEvaluation} genomförd(a) intervju(er) saknar utvärdering.`}
                      </div>
                    )}
                  </Card>
                </div>
              </div>

              {/* ── Team overview ── */}
              <Card>
                <CardHeader icon="tabler:table" title={isEn ? "Team overview" : "Teamöversikt"}
                  subtitle={avgCompleteness != null
                    ? (isEn ? `${rows.length} employees · profiles ${avgCompleteness}% complete on average` : `${rows.length} medarbetare · profilerna är i snitt ${avgCompleteness}% kompletta`)
                    : (isEn ? `${rows.length} employees` : `${rows.length} medarbetare`)}
                  action={
                    <select value={sortKey} onChange={e => setSortKey(e.target.value as typeof sortKey)}
                      className="print:hidden text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 outline-none">
                      <option value="activity">{isEn ? "Latest activity" : "Senaste aktivitet"}</option>
                      <option value="profile">{isEn ? "Least complete first" : "Minst kompletta först"}</option>
                      <option value="name">{isEn ? "Name A–Z" : "Namn A–Ö"}</option>
                    </select>
                  } />
                {rows.length === 0 ? (
                  <Empty icon="tabler:users-off" text={isEn ? "No employees yet — invite someone from the Invitations page." : "Inga medarbetare än — bjud in någon från Inbjudningar."} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-sm">
                      <thead>
                        <tr className="text-[10px] font-semibold tracking-wider uppercase text-gray-400 bg-gray-50/60 border-b border-gray-100">
                          <th className="text-left px-5 sm:px-6 py-3">{isEn ? "Employee" : "Medarbetare"}</th>
                          <th className="text-center px-2 py-3">{isEn ? "CVs" : "CV:n"}</th>
                          <th className="text-left px-2 py-3">{isEn ? "Last CV update" : "Senaste CV-uppdatering"}</th>
                          <th className="text-center px-2 py-3">{isEn ? "Letters" : "Brev"}</th>
                          <th className="text-center px-2 py-3">{isEn ? "Portfolio" : "Portfolio"}</th>
                          <th className="text-left px-2 py-3 w-40">{isEn ? "Profile" : "Profil"}</th>
                          <th className="text-left px-2 py-3">{isEn ? "Interviews" : "Intervjuer"}</th>
                          <th className="text-left px-2 py-3">{isEn ? "Contract" : "Kontrakt"}</th>
                          <th className="text-left px-2 pr-5 sm:pr-6 py-3">{isEn ? "Status" : "Status"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {rows.map(r => {
                          const name = r.employee.employeeName || r.employee.employeeEmail
                          const pct = r.completeness.percent
                          const cs = r.contractStatus ? CONTRACT_STATUS[r.contractStatus] : null
                          const es = r.employmentStatus ? EMPLOYMENT_STATUS[r.employmentStatus] : null
                          return (
                            <tr key={r.employee.employeeId} className="hover:bg-blue-50/20 transition-colors">
                              <td className="px-5 sm:px-6 py-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>
                                    {initials(name)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-800 truncate">{name}</p>
                                    <p className="text-[11px] text-gray-400 truncate">{r.employee.employeeEmail}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="text-center px-2 py-3 font-semibold text-gray-700 tabular-nums">{r.cvs ?? "—"}</td>
                              <td className="px-2 py-3 text-xs text-gray-500 whitespace-nowrap">{r.lastCvUpdate ? relative(r.lastCvUpdate, isEn) : "—"}</td>
                              <td className="text-center px-2 py-3 text-gray-700 tabular-nums">{r.coverLetters ?? "—"}</td>
                              <td className="text-center px-2 py-3 text-gray-700 tabular-nums">{r.portfolio ?? "—"}</td>
                              <td className="px-2 py-3">
                                {pct == null ? <span className="text-xs text-gray-400" title={isEn ? "Not included in your access level" : "Ingår inte i din åtkomstnivå"}>—</span> : (
                                  <div title={r.completeness.missing.length ? `${isEn ? "Missing" : "Saknas"}: ${r.completeness.missing.join(", ")}` : (isEn ? "Complete" : "Komplett")}>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? "rgb(34,197,94)" : pct >= 50 ? "rgb(245,158,11)" : "rgb(239,68,68)" }} />
                                      </div>
                                      <span className="text-xs font-semibold text-gray-700 tabular-nums w-9 text-right">{pct}%</span>
                                    </div>
                                    {r.completeness.missing.length > 0 && (
                                      <p className="text-[10px] text-gray-400 truncate mt-0.5 max-w-[150px]">{isEn ? "Missing" : "Saknas"}: {r.completeness.missing.slice(0, 2).join(", ")}{r.completeness.missing.length > 2 ? ` +${r.completeness.missing.length - 2}` : ""}</p>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-2 py-3 text-xs">
                                <span className="font-semibold text-gray-700 tabular-nums">{r.interviews}</span>
                                {r.upcomingInterview && <span className="block text-[10px] text-blue-800">{isEn ? "Next" : "Nästa"}: {fmtShortDate(r.upcomingInterview, isEn)}</span>}
                              </td>
                              <td className="px-2 py-3">
                                {cs ? (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-700 whitespace-nowrap">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cs.color }} />{isEn ? cs.en : cs.sv}
                                  </span>
                                ) : <span className="text-xs text-gray-400">{isEn ? "None" : "Inget"}</span>}
                              </td>
                              <td className="px-2 pr-5 sm:pr-6 py-3">
                                {es ? (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-700 whitespace-nowrap">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: es.color }} />{isEn ? es.en : es.sv}
                                  </span>
                                ) : <span className="text-xs text-gray-400">—</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* ── Contracts · Invitations · Team status ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader icon="tabler:file-certificate" title={isEn ? "Contracts" : "Kontrakt"}
                    subtitle={isEn ? `${cr.total} in total` : `${cr.total} totalt`} />
                  {cr.total === 0 ? <Empty icon="tabler:file-off" text={isEn ? "No contracts yet." : "Inga kontrakt än."} /> : (
                    <div className="p-5 space-y-2.5">
                      {Object.keys(CONTRACT_STATUS).filter(s => cr.byStatus[s]).map(s => (
                        <BarRow key={s} label={isEn ? CONTRACT_STATUS[s]!.en : CONTRACT_STATUS[s]!.sv} value={cr.byStatus[s]!} max={cr.total} color={CONTRACT_STATUS[s]!.color} />
                      ))}
                      {cr.expiring.length > 0 && (
                        <div className="pt-3 mt-1 border-t border-gray-100">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600 mb-1.5">{isEn ? "Ending within 30 days" : "Slutar inom 30 dagar"}</p>
                          {cr.expiring.slice(0, 4).map(c => (
                            <div key={c.id} className="flex items-center justify-between text-xs py-1">
                              <span className="text-gray-700 truncate">{c.employeeName || c.title}</span>
                              <span className="text-gray-400 flex-shrink-0 ml-2">{fmtDate(c.endDate, isEn)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                <Card>
                  <CardHeader icon="tabler:send" title={isEn ? "Invitations" : "Inbjudningar"}
                    subtitle={isEn ? `${invr.sentInPeriod} sent in the last ${periodCfg.en}` : `${invr.sentInPeriod} skickade senaste ${periodCfg.sv}`} />
                  {invr.total === 0 ? <Empty icon="tabler:send-off" text={isEn ? "No invitations sent yet." : "Inga inbjudningar skickade än."} /> : (
                    <div className="p-5 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-xl bg-gray-50 py-2.5">
                          <div className="text-lg font-bold text-gray-900 tabular-nums">{invr.acceptanceRate == null ? "—" : `${invr.acceptanceRate}%`}</div>
                          <div className="text-[10px] text-gray-400">{isEn ? "Acceptance rate" : "Acceptansgrad"}</div>
                        </div>
                        <div className="rounded-xl bg-gray-50 py-2.5">
                          <div className="text-lg font-bold text-gray-900 tabular-nums">
                            {invr.avgResponseHours == null ? "—" : invr.avgResponseHours < 48 ? `${Math.round(invr.avgResponseHours)} h` : `${Math.round(invr.avgResponseHours / 24)} ${isEn ? "d" : "d"}`}
                          </div>
                          <div className="text-[10px] text-gray-400">{isEn ? "Avg. response time" : "Snittid för svar"}</div>
                        </div>
                      </div>
                      <BarRow label={isEn ? "Accepted" : "Accepterade"} value={invr.accepted} max={invr.total} color="rgb(34,197,94)" />
                      <BarRow label={isEn ? "Pending" : "Väntande"} value={invr.pending} max={invr.total} color="rgb(245,158,11)" />
                      <BarRow label={isEn ? "Declined / ended" : "Nekade / avslutade"} value={invr.declined} max={invr.total} color="rgb(239,68,68)" />
                    </div>
                  )}
                </Card>

                <Card>
                  <CardHeader icon="tabler:users-group" title={isEn ? "Team status" : "Teamstatus"}
                    subtitle={isEn ? "From the employee profiles" : "Från medarbetarprofilerna"} />
                  {data.employees.length === 0 ? <Empty icon="tabler:users-off" text={isEn ? "No employees yet." : "Inga medarbetare än."} /> : (
                    <div className="p-5 space-y-2.5">
                      {Object.keys(EMPLOYMENT_STATUS).filter(s => er.status[s]).map(s => (
                        <BarRow key={s} label={isEn ? EMPLOYMENT_STATUS[s]!.en : EMPLOYMENT_STATUS[s]!.sv} value={er.status[s]!} max={data.employees.length} color={EMPLOYMENT_STATUS[s]!.color} />
                      ))}
                      {er.withLeave > 0 && er.vacationTotal > 0 && (
                        <p className="text-[11px] text-gray-500 pt-1">
                          <Icon icon="tabler:beach" className="w-3.5 h-3.5 inline -mt-0.5 mr-1 text-gray-400" />
                          {isEn
                            ? `${er.vacationUsed} of ${er.vacationTotal} vacation days used (${Math.round((er.vacationUsed / er.vacationTotal) * 100)}%)`
                            : `${er.vacationUsed} av ${er.vacationTotal} semesterdagar använda (${Math.round((er.vacationUsed / er.vacationTotal) * 100)}%)`}
                        </p>
                      )}
                      <div className="pt-3 mt-1 border-t border-gray-100">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">{isEn ? "HR events, next 30 days" : "HR-händelser, kommande 30 dagar"}</p>
                        {er.events.length === 0 ? (
                          <p className="text-xs text-gray-400">{isEn ? "Nothing planned." : "Inget planerat."}</p>
                        ) : er.events.slice(0, 4).map((ev, i) => (
                          <div key={i} className="flex items-center justify-between text-xs py-1 gap-2">
                            <span className="text-gray-700 truncate">{ev.title} <span className="text-gray-400">· {ev.employeeName}</span></span>
                            <span className="text-gray-400 flex-shrink-0">{fmtShortDate(ev.date, isEn)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* ── Recent activity ── */}
              <Card>
                <CardHeader icon="tabler:activity" title={isEn ? "Recent activity" : "Senaste aktivitet"}
                  subtitle={isEn ? "Across CVs, portfolios, interviews, contracts and invitations" : "Över CV:n, portfolios, intervjuer, kontrakt och inbjudningar"} />
                {feed.length === 0 ? <Empty icon="tabler:activity" text={isEn ? "No activity yet." : "Ingen aktivitet än."} /> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 divide-gray-50">
                    {[feed.slice(0, Math.ceil(feed.length / 2)), feed.slice(Math.ceil(feed.length / 2))].map((col, ci) => (
                      <div key={ci} className={clsx("divide-y divide-gray-50", ci === 1 && "md:border-l md:border-gray-50")}>
                        {col.map(item => {
                          const a = ACTIVITY[item.type]
                          return (
                            <div key={item.id} className="flex items-start gap-3 px-5 sm:px-6 py-3.5">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: a.bg }}>
                                <Icon icon={a.icon} className="w-4 h-4" style={{ color: a.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider truncate">{isEn ? a.en : a.sv}</span>
                                  <span className="text-[10px] text-gray-400 flex-shrink-0">{relative(item.date, isEn)}</span>
                                </div>
                                <p className="text-sm font-medium text-gray-800 truncate">{item.who}</p>
                                {item.detail && <p className="text-xs text-gray-400 truncate">{item.detail}</p>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
