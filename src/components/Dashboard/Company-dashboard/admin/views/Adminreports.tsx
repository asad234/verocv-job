"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/admin/views/AdminReports.tsx   (REPLACE the mock)
// WHAT IT DOES:   Business admin → Others → Reports. One page with what's going on:
//   • Needs your attention — contracts to sign, days-off requests, managers without a
//     contract, contracts ending soon, waiting contracts / invitations, inactive managers…
//     Every item opens the right page.
//   • Right now — managers, employees, active contracts, invitations, away today
//   • Key numbers for the period (with ↑ / ↓ vs. the period before)
//   • Activity over time — new employees, contracts signed, interviews held
//   • Managers table → click to see the team (employees, contract, CVs, portfolio)
//   • Employee contracts, interviews, manager days off
//   • Export CSV (managers table) / Export PDF (printable report)
// API:            GET /api/company/admin/reports?period=week|month|quarter|year
// ══════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState, type ReactNode } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import { useBusinessAdmin } from "../Businessadmincontext"
import { useBusinessAdminTranslations } from "@/utils/Businessadmintranslations"
import { DAY_KIND_STYLE, TYPE_LABELS, type TimeOffType } from "@/utils/managerAvailability"
import { REPORT_PERIODS, type AdminReport, type AttentionItem, type Kpi, type ManagerReportRow, type ReportPeriod } from "@/utils/adminReports"
import { CONTRACT_STATE_LABEL, MY_CONTRACT_LABEL, REPORTS_TEXT, attentionCopy, type ReportsText } from "./reportsTexts"

const NAVY = "rgb(5,22,80)"
const LIGHT = "rgb(239,246,255)"
const PERIOD_KEY = "adminReportsPeriod"
const LEVEL_STYLE = {
  high: { color: "rgb(185,28,28)", bg: "rgb(254,242,242)", ring: "rgb(254,202,202)" },
  medium: { color: "rgb(146,64,14)", bg: "rgb(255,251,235)", ring: "rgb(253,230,138)" },
  low: { color: "rgb(30,64,175)", bg: "rgb(239,246,255)", ring: "rgb(191,219,254)" },
} as const

type Lang = "en" | "sv"
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?"
const num = (n: number) => String(Math.round(n * 10) / 10).replace(".", ",")

function readPeriod(): ReportPeriod {
  try {
    const v = window.localStorage.getItem(PERIOD_KEY)
    return (REPORT_PERIODS as readonly string[]).includes(v ?? "") ? (v as ReportPeriod) : "month"
  } catch {
    return "month"
  }
}

export default function AdminReports() {
  const { t, language } = useBusinessAdminTranslations()
  const lang: Lang = language === "en" ? "en" : "sv"
  const x = REPORTS_TEXT[lang]
  const locale = lang === "en" ? "en-GB" : "sv-SE"
  const nav = useBusinessAdmin()

  const [period, setPeriodState] = useState<ReportPeriod>("month")
  const [report, setReport] = useState<AdminReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => { setPeriodState(readPeriod()) }, [])
  const setPeriod = (p: ReportPeriod) => {
    setPeriodState(p)
    try { window.localStorage.setItem(PERIOD_KEY, p) } catch { /* private mode */ }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/company/admin/reports?period=${period}`, { cache: "no-store", credentials: "include" })
      if (!res.ok) throw new Error()
      setReport((await res.json()).data)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [period])
  useEffect(() => { load() }, [load])

  const fmtDate = useCallback((iso: string) => {
    const d = iso.length === 10 ? new Date(`${iso}T12:00:00Z`) : new Date(iso)
    return d.toLocaleDateString(locale, { day: "numeric", month: "short", timeZone: "Europe/Stockholm" })
  }, [locale])
  const typeLabel = (k: string) => TYPE_LABELS[k as TimeOffType]?.[lang] ?? k

  /* ── where each "needs attention" item goes ── */
  const openAttention = (a: AttentionItem) => {
    switch (a.kind) {
      case "contract_to_sign":
      case "manager_contract_waiting":
        if (a.contractId) nav.openManagerContract(a.contractId)
        return
      case "contract_expiring":
        if (a.forManager && a.contractId) nav.openManagerContract(a.contractId)
        else if (a.employeeId) nav.openEmployeeProfile(a.employeeId)
        return
      case "time_off_pending": {
        const url = new URL(window.location.href)
        url.searchParams.set("availability", "requests")
        window.history.pushState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
        nav.setView("availability")
        return
      }
      case "manager_no_contract":
        nav.setView("manager_contracts")
        return
      case "interviews_today":
        nav.setView("interviews")
        return
      default:
        if (a.managerId) nav.openManagerProfile(a.managerId)
    }
  }

  const exportCsv = () => report && downloadCsv(report, x, lang)
  const exportPdf = () => report && printReport(report, x, lang, t.reportsTitle, (t.periods as readonly string[])[REPORT_PERIODS.indexOf(report.period)] ?? "", fmtDate, typeLabel)

  const attention = report?.attention ?? []
  const shownAttention = showAll ? attention : attention.slice(0, 6)

  return (
    <div className="p-4 sm:p-6 m-0 sm:m-4 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}><Icon icon="tabler:chart-bar" className="w-5 h-5 text-white" /></div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t.reportsTitle}</h1>
          </div>
          <p className="text-gray-500 text-sm sm:ml-12">{t.reportsDesc}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 overflow-x-auto max-w-full">
            {(t.periods as readonly string[]).map((p, i) => (
              <button key={p} onClick={() => setPeriod(REPORT_PERIODS[i]!)}
                className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap", period === REPORT_PERIODS[i] ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700")}
                style={period === REPORT_PERIODS[i] ? { backgroundColor: NAVY } : {}}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={exportCsv} disabled={!report}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:border-blue-900 hover:text-blue-900 disabled:opacity-50">
            <Icon icon="tabler:table-export" className="w-3.5 h-3.5" />{t.exportCSV}
          </button>
          <button onClick={exportPdf} disabled={!report}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:border-blue-900 hover:text-blue-900 disabled:opacity-50">
            <Icon icon="tabler:file-type-pdf" className="w-3.5 h-3.5" />{t.exportPDF}
          </button>
          <button onClick={load} title={x.refresh} aria-label={x.refresh}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-800">
            <Icon icon="tabler:refresh" className={clsx("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {error && !report ? (
        <div className="bg-white rounded-2xl border border-red-100 p-10 text-center">
          <p className="text-sm text-gray-600 mb-3">{x.loadFailed}</p>
          <button onClick={load} className="px-4 py-2 rounded-lg text-sm text-white" style={{ backgroundColor: NAVY }}>{x.retry}</button>
        </div>
      ) : !report ? (
        <Skeleton />
      ) : (
        <div className={clsx("space-y-6 transition-opacity", loading && "opacity-60")}>
          {/* Attention + right now */}
          <div className="grid gap-6 xl:grid-cols-3">
            <section className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <SectionHead icon="tabler:bell-ringing" title={x.attention}
                right={attention.length > 0 && <span className="text-xs font-bold text-white bg-red-500 rounded-full px-2 py-0.5">{attention.length}</span>} />
              {attention.length === 0 ? (
                <div className="py-10 text-center text-gray-500">
                  <Icon icon="tabler:circle-check" className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">{x.allClear}</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {shownAttention.map((a) => {
                    const c = attentionCopy(a, lang, typeLabel, fmtDate)
                    const s = LEVEL_STYLE[a.level]
                    return (
                      <li key={a.key}>
                        <button onClick={() => openAttention(a)} className="w-full text-left px-4 sm:px-6 py-3 flex items-center gap-3 hover:bg-gray-50/80 group">
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.bg }}>
                            <Icon icon={c.icon} className="w-4 h-4" style={{ color: s.color }} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm text-gray-800">{c.text}</span>
                            <span className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: s.color }}>{x.levels[a.level]}</span>
                              {c.sub && <span className="text-xs text-gray-500 truncate">· {c.sub}</span>}
                            </span>
                          </span>
                          <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-blue-900">
                            {x.open}<Icon icon="tabler:arrow-right" className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
              {attention.length > 6 && (
                <button onClick={() => setShowAll((v) => !v)} className="w-full py-2.5 text-xs font-semibold border-t border-gray-100 hover:bg-gray-50" style={{ color: NAVY }}>
                  {showAll ? x.showLess : x.showAll(attention.length)}
                </button>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <SectionHead icon="tabler:radar" title={x.rightNow} right={<span className="text-[11px] text-gray-400">{x.updated} {new Date(report.generatedAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</span>} />
              <dl className="divide-y divide-gray-50">
                <Snap icon="tabler:users-group" label={x.managers} value={report.snapshot.managers} sub={x.activeManagers(report.snapshot.activeManagers)} onClick={() => nav.setView("managers_list")} />
                <Snap icon="tabler:users" label={x.employees} value={report.snapshot.employees} onClick={() => nav.setView("employees")} />
                <Snap icon="tabler:file-certificate" label={x.activeContracts} value={report.snapshot.activeContracts} />
                <Snap icon="tabler:mail" label={x.pendingInvitations} value={report.snapshot.pendingInvitations} />
                <Snap icon="tabler:beach" label={x.awayToday} value={report.snapshot.awayToday} onClick={() => nav.setView("availability")} />
              </dl>
            </section>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <KpiTile icon="tabler:user-plus" label={x.kpi.newEmployees} k={report.kpis.newEmployees} x={x} />
            <KpiTile icon="tabler:send" label={x.kpi.contractsSent} k={report.kpis.contractsSent} x={x} />
            <KpiTile icon="tabler:signature" label={x.kpi.contractsSigned} k={report.kpis.contractsSigned} x={x} />
            <KpiTile icon="tabler:calendar-user" label={x.kpi.interviewsHeld} k={report.kpis.interviewsHeld} x={x} />
            <KpiTile icon="tabler:files" label={x.kpi.cvsCreated} k={report.kpis.cvsCreated} x={x} />
            <KpiTile icon="tabler:beach" label={x.kpi.daysOff} k={report.kpis.daysOff} x={x} />
          </div>

          {/* Activity — three small charts on the same time axis */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <SectionHead icon="tabler:chart-histogram" title={x.activity} desc={x.activityDesc} />
            <div className="grid gap-6 md:grid-cols-3 px-4 sm:px-6 py-5">
              <MiniBars title={x.kpi.newEmployees} values={report.series.newEmployees} report={report} lang={lang} empty={x.noActivity} />
              <MiniBars title={x.kpi.contractsSigned} values={report.series.contractsSigned} report={report} lang={lang} empty={x.noActivity} />
              <MiniBars title={x.kpi.interviewsHeld} values={report.series.interviewsHeld} report={report} lang={lang} empty={x.noActivity} />
            </div>
          </section>

          {/* Managers */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <SectionHead icon="tabler:table" title={x.table} desc={x.tableDesc} />
            {report.managers.length === 0 ? (
              <div className="py-12 text-center">
                <Icon icon="tabler:users" className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500 mb-3">{x.noManagers}</p>
                <button onClick={() => nav.setView("create_manager")} className="px-4 py-2 rounded-lg text-sm text-white" style={{ backgroundColor: NAVY }}>{x.createManager}</button>
              </div>
            ) : (
              <>
                <div className="hidden lg:grid px-6 py-3 text-[11px] font-semibold tracking-wider uppercase text-gray-400 bg-gray-50/60 border-b border-gray-100 gap-3"
                  style={{ gridTemplateColumns: COLS }}>
                  <div>{x.col.manager}</div><div>{x.col.today}</div><div>{x.col.team}</div><div>{x.col.contracts}</div>
                  <div>{x.col.interviews}</div><div>{x.col.cvs}</div><div>{x.col.daysOff}</div><div>{x.col.yourContract}</div><div />
                </div>
                <ul className="divide-y divide-gray-100">
                  {report.managers.map((m) => (
                    <ManagerRow key={m.id} m={m} x={x} lang={lang} open={openId === m.id} onToggle={() => setOpenId(openId === m.id ? null : m.id)}
                      fmtDate={fmtDate} today={report.today} nav={nav} />
                  ))}
                </ul>
              </>
            )}
          </section>

          {/* Breakdown */}
          <div className="grid gap-6 lg:grid-cols-3">
            <ListCard icon="tabler:file-text" title={x.pipeline} desc={x.pipelineDesc}
              rows={[
                ["active", report.pipeline.active], ["awaiting_manager", report.pipeline.awaitingManager], ["awaiting_employee", report.pipeline.awaitingEmployee],
                ["draft", report.pipeline.draft], ["ended", report.pipeline.ended], ["terminated", report.pipeline.terminated],
              ].map(([k, v]) => ({ label: CONTRACT_STATE_LABEL[k as keyof typeof CONTRACT_STATE_LABEL][lang], value: v as number }))}
              foot={report.pipeline.expiringSoon ? (lang === "en" ? `${report.pipeline.expiringSoon} active end within 30 days` : `${report.pipeline.expiringSoon} aktiva slutar inom 30 dagar`) : undefined}
              none={x.none} />
            <ListCard icon="tabler:calendar-user" title={x.interviews} desc={x.interviewsDesc}
              rows={[
                { label: x.outcome.completed, value: report.interviewOutcomes.completed },
                { label: x.outcome.cancelled, value: report.interviewOutcomes.cancelled },
                { label: x.outcome.noShow, value: report.interviewOutcomes.noShow },
                { label: x.outcome.upcoming, value: report.interviewOutcomes.upcoming },
              ]} none={x.none} />
            <ListCard icon="tabler:beach" title={x.timeOff} desc={x.timeOffDesc}
              rows={report.timeOffByType.map((r) => ({ label: TYPE_LABELS[r.type][lang], value: r.days, icon: TYPE_LABELS[r.type].icon, iconColor: TYPE_LABELS[r.type].color }))}
              format={(n) => x.days(n)} none={x.none} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ═════════════════════════ Pieces ═════════════════════════ */

const COLS = "minmax(190px,1.6fr) 110px 0.8fr 1fr 1fr 0.7fr 0.6fr 120px 24px"

function SectionHead({ icon, title, desc, right }: { icon: string; title: string; desc?: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-100">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: LIGHT }}><Icon icon={icon} className="w-4 h-4" style={{ color: NAVY }} /></div>
        <div className="min-w-0">
          <h2 className="font-bold text-sm sm:text-base" style={{ color: NAVY }}>{title}</h2>
          {desc && <p className="text-xs text-gray-500 truncate">{desc}</p>}
        </div>
      </div>
      {right}
    </div>
  )
}

function Snap({ icon, label, value, sub, onClick }: { icon: string; label: string; value: number; sub?: string; onClick?: () => void }) {
  const Tag = onClick ? "button" : "div"
  return (
    <Tag onClick={onClick} className={clsx("w-full flex items-center gap-3 px-4 sm:px-6 py-3 text-left", onClick && "hover:bg-gray-50")}>
      <Icon icon={icon} className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <span className="flex-1 min-w-0">
        <dt className="text-sm text-gray-600">{label}</dt>
        {sub && <dd className="text-[11px] text-gray-400">{sub}</dd>}
      </span>
      <dd className="text-lg font-bold text-gray-900 tabular-nums">{value}</dd>
    </Tag>
  )
}

function KpiTile({ icon, label, k, x }: { icon: string; label: string; k: Kpi; x: ReportsText }) {
  const diff = Math.round((k.value - k.previous) * 10) / 10
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon icon={icon} className="w-4 h-4 flex-shrink-0" style={{ color: NAVY }} />
        <span className="text-xs text-gray-500 truncate">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 tabular-nums">{num(k.value)}</div>
      <div className="mt-1 text-[11px] text-gray-500 flex items-center gap-1" title={x.vsPrev}>
        {diff === 0 ? (
          <span>{x.same}</span>
        ) : (
          <>
            <Icon icon={diff > 0 ? "tabler:arrow-up-right" : "tabler:arrow-down-right"} className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-semibold text-gray-700">{diff > 0 ? "+" : "−"}{num(Math.abs(diff))}</span>
            <span className="truncate">{x.vsPrev}</span>
          </>
        )}
      </div>
    </div>
  )
}

/** One series, bars on the period's time axis, hover shows the bucket + value. */
function MiniBars({ title, values, report, lang, empty }: { title: string; values: number[]; report: AdminReport; lang: Lang; empty: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...values, 1)
  const total = values.reduce((a, b) => a + b, 0)
  const locale = lang === "en" ? "en-GB" : "sv-SE"
  const label = (i: number) => {
    const b = report.series.buckets[i]!
    const d = new Date(`${b.from}T12:00:00Z`)
    if (report.period === "year") return d.toLocaleDateString(locale, { month: "short" })
    if (report.period === "quarter") return `${d.toLocaleDateString(locale, { day: "numeric", month: "short" })}–`
    return d.toLocaleDateString(locale, { weekday: report.period === "week" ? "short" : undefined, day: "numeric", month: report.period === "week" ? undefined : "short" })
  }
  /** Short axis label: day number (week / month), d/m (3 months), month (year). */
  const tick = (i: number) => {
    const b = report.series.buckets[i]!
    if (report.period === "year") return new Date(`${b.from}T12:00:00Z`).toLocaleDateString(locale, { month: "narrow" })
    if (report.period === "quarter") return `${+b.from.slice(8, 10)}/${+b.from.slice(5, 7)}`
    if (report.period === "week") return new Date(`${b.from}T12:00:00Z`).toLocaleDateString(locale, { weekday: "narrow" })
    return String(+b.from.slice(8, 10))
  }
  const tickEvery = report.period === "year" || report.period === "week" ? 1 : Math.ceil(values.length / 7)
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-600">{title}</h3>
        <span className="text-lg font-bold text-gray-900 tabular-nums">{total}</span>
      </div>
      <div className="relative h-28 flex items-end gap-[2px] border-b border-gray-200" onMouseLeave={() => setHover(null)}>
        {total === 0 && <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">{empty}</span>}
        {values.map((v, i) => {
          const future = report.series.buckets[i]!.from > report.today
          return (
            <div key={i} className="relative flex-1 h-full flex items-end cursor-default" onMouseEnter={() => setHover(i)}>
              <div className={clsx("w-full rounded-t-[4px] transition-colors", future && "opacity-0")}
                style={{ height: v ? `${Math.max((v / max) * 100, 4)}%` : "0%", backgroundColor: hover === i ? "rgb(37,58,140)" : NAVY }} />
              {hover === i && !future && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-lg bg-gray-900 text-white text-[11px] px-2 py-1 shadow-lg pointer-events-none">
                  {label(i)} · <b>{v}</b>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex gap-[2px] mt-1">
        {values.map((_, i) => (
          <span key={i} className="flex-1 text-[10px] text-gray-400 text-center whitespace-nowrap overflow-visible">{i % tickEvery === 0 ? tick(i) : ""}</span>
        ))}
      </div>
    </div>
  )
}

function ListCard({ icon, title, desc, rows, foot, none, format = (n: number) => String(n) }: {
  icon: string; title: string; desc: string; none: string; foot?: string; format?: (n: number) => string
  rows: { label: string; value: number; icon?: string; iconColor?: string }[]
}) {
  const max = Math.max(...rows.map((r) => r.value), 1)
  const any = rows.some((r) => r.value > 0)
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <SectionHead icon={icon} title={title} desc={desc} />
      <div className="px-4 sm:px-6 py-4 space-y-3">
        {!any && <p className="text-sm text-gray-400 py-4 text-center">{none}</p>}
        {any && rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-gray-600">
                {r.icon && <Icon icon={r.icon} className="w-3.5 h-3.5" style={{ color: r.iconColor }} />}{r.label}
              </span>
              <span className="font-semibold text-gray-800 tabular-nums">{format(r.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, backgroundColor: NAVY }} />
            </div>
          </div>
        ))}
        {foot && <p className="text-[11px] text-amber-700 flex items-center gap-1 pt-1"><Icon icon="tabler:calendar-due" className="w-3.5 h-3.5" />{foot}</p>}
      </div>
    </section>
  )
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color, backgroundColor: bg }}>{label}</span>
}

function lastSeenText(iso: string | null, today: string, x: ReportsText, fmtDate: (s: string) => string) {
  if (!iso) return x.never
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date(iso))
  const diff = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) / 86_400_000)
  if (diff <= 0) return x.todayWord
  if (diff === 1) return x.yesterday
  if (diff < 14) return x.daysAgo(diff)
  return fmtDate(iso)
}

function ManagerRow({ m, x, lang, open, onToggle, fmtDate, today, nav }: {
  m: ManagerReportRow; x: ReportsText; lang: Lang; open: boolean; onToggle: () => void
  fmtDate: (s: string) => string; today: string; nav: ReturnType<typeof useBusinessAdmin>
}) {
  const type = m.today.timeOffType ? TYPE_LABELS[m.today.timeOffType] : null
  const ds = DAY_KIND_STYLE[m.today.kind]
  const todayChip = <Chip label={type ? type[lang] : ds[lang]} color={type ? type.color : ds.color} bg={type ? type.bg : ds.bg} />
  const mine = MY_CONTRACT_LABEL[m.myContract]
  const waiting = m.contracts.awaitingEmployee + m.contracts.awaitingManager
  const seen = lastSeenText(m.lastSeenAt, today, x, fmtDate)

  const who = (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>{initials(m.name)}</div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate">{m.name}</div>
        <div className="text-xs text-gray-400 truncate">{[m.jobTitle, m.department].filter(Boolean).join(" · ") || m.email}</div>
        <div className="text-[11px] text-gray-400 truncate">{x.lastSeen}: {seen}</div>
      </div>
    </div>
  )
  const teamCell = (
    <div>
      <div className="text-sm font-semibold text-gray-800 tabular-nums">{m.team}</div>
      <div className="text-[11px] text-gray-500">{[m.newInPeriod ? x.newN(m.newInPeriod) : "", m.leftInPeriod ? x.leftN(m.leftInPeriod) : ""].filter(Boolean).join(" · ")}</div>
    </div>
  )

  return (
    <li>
      <button onClick={onToggle} aria-expanded={open} className={clsx("w-full text-left transition-colors", open ? "bg-blue-50/50" : "hover:bg-blue-50/20")}>
        {/* desktop */}
        <div className="hidden lg:grid items-center gap-3 px-6 py-3.5" style={{ gridTemplateColumns: COLS }}>
          {who}
          <div>{todayChip}</div>
          {teamCell}
          <div className="text-xs text-gray-700">{x.activeWaiting(m.contracts.active, waiting)}</div>
          <div className="text-xs text-gray-700">{x.heldUpcoming(m.interviews.held, m.interviews.upcoming)}</div>
          <div><span className="text-sm font-semibold text-gray-800 tabular-nums">{m.cvs.total}</span>{m.cvs.newInPeriod > 0 && <span className="text-[11px] text-gray-500"> {x.newN(m.cvs.newInPeriod)}</span>}</div>
          <div className="text-sm text-gray-700 tabular-nums">{num(m.daysOff)}</div>
          <div><Chip label={mine[lang]} color={mine.color} bg={mine.bg} /></div>
          <Icon icon={open ? "tabler:chevron-up" : "tabler:chevron-down"} className="w-4 h-4 text-gray-400" />
        </div>
        {/* mobile */}
        <div className="lg:hidden px-4 py-3.5 space-y-3">
          <div className="flex items-start justify-between gap-2">{who}{todayChip}</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Mini label={x.col.team} value={String(m.team)} />
            <Mini label={x.col.contracts} value={`${m.contracts.active}${waiting ? ` (+${waiting})` : ""}`} />
            <Mini label={x.col.interviews} value={String(m.interviews.held)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500">{x.col.yourContract}</span>
            <Chip label={mine[lang]} color={mine.color} bg={mine.bg} />
          </div>
        </div>
      </button>

      {open && (
        <div className="px-4 lg:px-6 pb-5 pt-2 bg-blue-50/30 border-t border-blue-100/60">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button onClick={() => nav.openManagerProfile(m.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: NAVY }}>
              <Icon icon="tabler:user" className="w-3.5 h-3.5" />{x.profile}
            </button>
            <button onClick={() => nav.openChat(m.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-700">
              <Icon icon="tabler:message-circle" className="w-3.5 h-3.5" />{x.message}
            </button>
            <button onClick={() => nav.setView("manager_contracts")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-700">
              <Icon icon="tabler:file-text" className="w-3.5 h-3.5" />{x.contractsBtn}
            </button>
            {m.pendingInvites > 0 && <span className="text-[11px] text-gray-500">· {x.pendingInvites(m.pendingInvites)}</span>}
            {m.pendingTimeOff > 0 && <span className="text-[11px] text-amber-700">· {x.pendingTimeOff(m.pendingTimeOff)}</span>}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 text-xs font-semibold text-gray-600 border-b border-gray-100">{x.team} · {m.team}</div>
            {m.employees.length === 0 ? (
              <p className="px-4 py-5 text-sm text-gray-400">{x.noTeam}</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {m.employees.map((e) => {
                  const cs = e.contract ? CONTRACT_STATE_LABEL[e.contract] : null
                  return (
                    <li key={e.id}>
                      <button onClick={() => nav.openEmployeeProfile(e.id)} className="w-full text-left px-4 py-2.5 flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-1 hover:bg-gray-50">
                        <span className="flex items-center gap-2 min-w-0 sm:w-56">
                          <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>{initials(e.name)}</span>
                          <span className="text-sm font-medium text-gray-800 truncate">{e.name}</span>
                        </span>
                        <span className="text-xs text-gray-500 sm:w-28">{x.joined} {e.joinedAt ? fmtDate(e.joinedAt) : "—"}</span>
                        <span className="text-xs text-gray-500 sm:w-28">{x.accessLevels[e.accessLevel]}</span>
                        <span className="sm:w-44">{cs ? <Chip label={cs[lang]} color={cs.color} bg={cs.bg} /> : <span className="text-xs text-gray-400">—</span>}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-3 sm:ml-auto">
                          <span className="flex items-center gap-1"><Icon icon="tabler:file-cv" className="w-3.5 h-3.5" />{e.cvs}</span>
                          <span className="flex items-center gap-1"><Icon icon="tabler:briefcase" className="w-3.5 h-3.5" />{e.portfolio}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 py-1.5">
      <div className="text-sm font-semibold text-gray-800 tabular-nums">{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-6 xl:grid-cols-3"><div className="xl:col-span-2 h-64 rounded-2xl bg-white border border-gray-100" /><div className="h-64 rounded-2xl bg-white border border-gray-100" /></div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white border border-gray-100" />)}</div>
      <div className="h-56 rounded-2xl bg-white border border-gray-100" />
    </div>
  )
}

/* ═════════════════════════ Export ═════════════════════════ */

function managerTable(r: AdminReport, x: ReportsText, lang: Lang) {
  const head = [x.col.manager, "E-mail", lang === "en" ? "Department" : "Avdelning", x.col.team, lang === "en" ? "New in period" : "Nya under perioden", lang === "en" ? "Left in period" : "Lämnat under perioden",
  lang === "en" ? "Active contracts" : "Aktiva kontrakt", lang === "en" ? "Contracts waiting" : "Kontrakt som väntar", lang === "en" ? "Contracts signed" : "Signerade kontrakt",
  lang === "en" ? "Interviews held" : "Genomförda intervjuer", x.col.cvs, x.col.daysOff, x.col.yourContract, x.lastSeen]
  const rows = r.managers.map((m) => [
    m.name, m.email, m.department, m.team, m.newInPeriod, m.leftInPeriod, m.contracts.active, m.contracts.awaitingEmployee + m.contracts.awaitingManager,
    m.contracts.signedInPeriod, m.interviews.held, m.cvs.total, num(m.daysOff), MY_CONTRACT_LABEL[m.myContract][lang], m.lastSeenAt ? m.lastSeenAt.slice(0, 10) : "",
  ])
  return { head, rows }
}

function downloadCsv(r: AdminReport, x: ReportsText, lang: Lang) {
  // Swedish Excel expects ";" between columns; the BOM makes å/ä/ö show correctly.
  const sep = lang === "sv" ? ";" : ","
  const cell = (v: unknown) => {
    const s = String(v ?? "")
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const { head, rows } = managerTable(r, x, lang)
  const csv = "﻿" + [head, ...rows].map((row) => row.map(cell).join(sep)).join("\r\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = `${x.csvName}-${r.from}_${r.to}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Opens a clean, printable version of the report — "Save as PDF" in the print dialog. */
function printReport(r: AdminReport, x: ReportsText, lang: Lang, title: string, periodName: string, fmtDate: (s: string) => string, typeLabel: (t: string) => string) {
  const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)
  const { head, rows } = managerTable(r, x, lang)
  const kpis = Object.entries(r.kpis).map(([k, v]) => `<div class="k"><b>${num(v.value)}</b><span>${esc(x.kpi[k as keyof typeof x.kpi])}</span><i>${v.value === v.previous ? esc(x.same) : `${v.value > v.previous ? "+" : "−"}${num(Math.abs(v.value - v.previous))} ${esc(x.vsPrev)}`}</i></div>`).join("")
  const att = r.attention.map((a) => {
    const c = attentionCopy(a, lang, typeLabel, fmtDate)
    return `<li><span class="lv ${a.level}">${esc(x.levels[a.level])}</span> ${esc(c.text)}${c.sub ? ` <small>· ${esc(c.sub)}</small>` : ""}</li>`
  }).join("")
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(title)} · ${esc(periodName)}</title>
<style>
  *{box-sizing:border-box} body{font:12px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;color:#0f172a;margin:28px}
  h1{font-size:20px;margin:0;color:${NAVY}} h2{font-size:13px;margin:22px 0 8px;color:${NAVY};text-transform:uppercase;letter-spacing:.04em}
  .meta{color:#64748b;margin:2px 0 14px} .ks{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .k{border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px} .k b{display:block;font-size:18px} .k span{display:block;color:#475569} .k i{color:#64748b;font-style:normal;font-size:10px}
  ul{margin:0;padding-left:0;list-style:none} li{padding:4px 0;border-bottom:1px solid #f1f5f9} small{color:#64748b}
  .lv{display:inline-block;font-size:9px;font-weight:700;text-transform:uppercase;padding:1px 6px;border-radius:99px;margin-right:4px}
  .high{background:#fef2f2;color:#b91c1c} .medium{background:#fffbeb;color:#92400e} .low{background:#eff6ff;color:#1e40af}
  table{width:100%;border-collapse:collapse;font-size:10.5px} th{text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #cbd5e1;padding:5px 4px}
  td{border-bottom:1px solid #f1f5f9;padding:5px 4px} .snap{color:#334155}
  @media print{body{margin:12mm} @page{size:A4 landscape;margin:0}}
</style></head><body>
<h1>${esc(title)}</h1>
<div class="meta">${esc(periodName)} · ${esc(fmtDate(r.from))} – ${esc(fmtDate(r.to))} · ${esc(x.updated)} ${esc(new Date(r.generatedAt).toLocaleString(lang === "en" ? "en-GB" : "sv-SE"))}</div>
<div class="snap">${esc(x.managers)}: <b>${r.snapshot.managers}</b> · ${esc(x.employees)}: <b>${r.snapshot.employees}</b> · ${esc(x.activeContracts)}: <b>${r.snapshot.activeContracts}</b> · ${esc(x.pendingInvitations)}: <b>${r.snapshot.pendingInvitations}</b> · ${esc(x.awayToday)}: <b>${r.snapshot.awayToday}</b></div>
<h2>${esc(x.attention)}</h2>${att ? `<ul>${att}</ul>` : `<p>${esc(x.allClear)}</p>`}
<h2>${esc(lang === "en" ? "Key numbers" : "Nyckeltal")}</h2><div class="ks">${kpis}</div>
<h2>${esc(x.table)}</h2>
<table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>
<script>window.onload=function(){setTimeout(function(){window.print()},200)}</script>
</body></html>`
  const w = window.open("", "_blank")
  if (!w) return
  w.document.open()
  w.document.write(html)
  w.document.close()
}
