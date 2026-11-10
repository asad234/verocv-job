"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/delegation/DelegationHandover.tsx  (NEW)
// WHAT IT DOES:   Full-screen handover briefing for a substitute: the absent
//                 manager's whole team with contact details, emergency contacts,
//                 employment details, contracts, interviews, CVs, portfolio and
//                 cover letters — plus a "Needs attention" list (contracts to
//                 sign, interviews this week, contracts ending soon).
//                 Opened from Settings → Substitute ("View handover").
// ══════════════════════════════════════════════════════════════════════

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import {
  REASON_LABELS, formatPeriod, getHandover, switchWorkspace, type Handover, type HandoverEmployee,
} from "@/utils/delegations"
import { STATUS_LABELS, TYPE_LABELS, formatAmount, label as optLabel } from "@/utils/employmentDetails"

const NAVY = "rgb(5,22,80)"
type Lang = "en" | "sv"
const DAY = 864e5

const fold = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
const initials = (name: string) => {
  const p = name.trim().split(/\s+/).filter(Boolean)
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1]?.[0] ?? "" : "")).toUpperCase() || "?"
}

const TX = {
  en: {
    handoverFrom: "Handover from", close: "Close", print: "Print",
    openWorkspace: (n: string) => `Open ${n}'s workspace to manage`,
    employees: "Employees", toSign: "Contracts to sign", activeContracts: "Active contracts", upcoming: "Upcoming interviews",
    attention: "Needs attention", nothing: "Nothing urgent right now.",
    aSign: (e: string, t: string) => `${e} signed “${t}” — waiting for the manager's signature`,
    aSent: (e: string, t: string) => `“${t}” sent to ${e} — not signed yet`,
    aInterview: (e: string, d: string) => `Interview with ${e} — ${d}`,
    aEnding: (e: string, d: string) => `${e}'s contract ends ${d}`,
    search: "Search employees…", noEmployees: "No employees have accepted an invitation from this manager.",
    noMatch: "No employees match your search.",
    contact: "Contact", emergency: "Emergency contact", employment: "Employment", contracts: "Contracts",
    interviews: "Interviews", cvs: "CVs", portfolio: "Portfolio", letters: "Cover letters",
    name: "Name", phone: "Phone", workPhone: "Work phone", email: "Email", workEmail: "Work email", address: "Address",
    none: "None", notShared: "Not shared with this manager", notAvailable: "Not available",
    status: "Status", employer: "Employer", jobTitle: "Job title", type: "Type", started: "Started",
    city: "Work city", salary: "Salary", notice: "Notice period", available: "Available from",
    access: { full: "Full access", cv_only: "CVs only", portfolio_only: "Portfolio only" },
    joined: "On the team since", candidates: "Other upcoming interviews (candidates)",
    signedBoth: "Signed", awaitingManager: "Awaiting manager", awaitingEmployee: "Awaiting employee", draft: "Draft",
    message: "Note from", loading: "Preparing the handover…", failed: "Couldn't load the handover.", retry: "Try again",
    upcomingTag: "Upcoming", toSignBadge: (n: number) => `${n} to sign`, expandAll: "Expand all", collapseAll: "Collapse all",
  },
  sv: {
    handoverFrom: "Överlämning från", close: "Stäng", print: "Skriv ut",
    openWorkspace: (n: string) => `Öppna ${n}s arbetsyta för att hantera`,
    employees: "Medarbetare", toSign: "Kontrakt att signera", activeContracts: "Aktiva kontrakt", upcoming: "Kommande intervjuer",
    attention: "Behöver åtgärd", nothing: "Inget brådskande just nu.",
    aSign: (e: string, t: string) => `${e} har signerat ”${t}” — väntar på chefens signatur`,
    aSent: (e: string, t: string) => `”${t}” skickat till ${e} — inte signerat ännu`,
    aInterview: (e: string, d: string) => `Intervju med ${e} — ${d}`,
    aEnding: (e: string, d: string) => `${e}s kontrakt löper ut ${d}`,
    search: "Sök medarbetare…", noEmployees: "Inga medarbetare har accepterat en inbjudan från den här chefen.",
    noMatch: "Inga medarbetare matchar sökningen.",
    contact: "Kontakt", emergency: "Nödkontakt", employment: "Anställning", contracts: "Kontrakt",
    interviews: "Intervjuer", cvs: "CV:n", portfolio: "Portfolio", letters: "Personliga brev",
    name: "Namn", phone: "Telefon", workPhone: "Jobbtelefon", email: "E-post", workEmail: "Jobbmail", address: "Adress",
    none: "Inga", notShared: "Delas inte med den här chefen", notAvailable: "Inte tillgängligt",
    status: "Status", employer: "Arbetsgivare", jobTitle: "Befattning", type: "Anställningsform", started: "Började",
    city: "Arbetsort", salary: "Lön", notice: "Uppsägningstid", available: "Tillgänglig från",
    access: { full: "Full åtkomst", cv_only: "Endast CV:n", portfolio_only: "Endast portfolio" },
    joined: "I teamet sedan", candidates: "Andra kommande intervjuer (kandidater)",
    signedBoth: "Signerat", awaitingManager: "Väntar på chef", awaitingEmployee: "Väntar på medarbetare", draft: "Utkast",
    message: "Meddelande från", loading: "Förbereder överlämningen…", failed: "Kunde inte ladda överlämningen.", retry: "Försök igen",
    upcomingTag: "Kommande", toSignBadge: (n: number) => `${n} att signera`, expandAll: "Visa alla", collapseAll: "Dölj alla",
  },
}
type T = (typeof TX)["en"]

const fmtDate = (v: string | null | undefined, lang: Lang, withTime = false) =>
  v ? new Date(v).toLocaleString(lang === "sv" ? "sv-SE" : "en-GB", withTime
    ? { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "short", year: "numeric" }) : ""

function contractTone(c: NonNullable<HandoverEmployee["contracts"]>[number], tx: T) {
  if (c.signedAt && c.managerSignedAt) return { text: tx.signedBoth, cls: "bg-green-50 text-green-700 border-green-200" }
  if (c.signedAt) return { text: tx.awaitingManager, cls: "bg-violet-50 text-violet-700 border-violet-200" }
  if (c.status === "draft") return { text: tx.draft, cls: "bg-gray-100 text-gray-600 border-gray-200" }
  if (c.status === "pending_signature" || c.status === "sent") return { text: tx.awaitingEmployee, cls: "bg-amber-50 text-amber-700 border-amber-200" }
  return { text: c.status.replace(/_/g, " "), cls: "bg-gray-100 text-gray-600 border-gray-200" }
}

/* ─── Building blocks ─── */
function Row({ label, value, href }: { label: string; value?: string; href?: string }) {
  if (!value) return null
  return (
    <div className="flex gap-3 text-sm py-0.5">
      <span className="w-28 flex-shrink-0 text-gray-400">{label}</span>
      {href ? <a href={href} className="text-blue-900 hover:underline break-all">{value}</a> : <span className="text-gray-800 break-words">{value}</span>}
    </div>
  )
}

function Block({ icon, title, count, children }: { icon: string; title: string; count?: number | null; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4 break-inside-avoid">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2.5">
        <Icon icon={icon} className="w-4 h-4" style={{ color: NAVY }} />{title}
        {count != null && <span className="ml-auto text-gray-400 font-semibold">{count}</span>}
      </p>
      {children}
    </div>
  )
}

const Empty = ({ text }: { text: string }) => <p className="text-sm text-gray-400">{text}</p>

/* ─── Employee card ─── */
function EmployeeCard({ e, open, onToggle, tx, lang, sections }: {
  e: HandoverEmployee; open: boolean; onToggle: () => void; tx: T; lang: Lang; sections: Handover["sections"]
}) {
  const ed = e.employment
  const toSign = (e.contracts ?? []).filter((c) => c.signedAt && !c.managerSignedAt).length
  const nextIv = (e.interviews ?? []).find((i) => i.upcoming)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden break-inside-avoid">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-gray-50/70">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>
          {initials(e.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{e.name}</p>
          <p className="text-xs text-gray-400 truncate">{[ed?.presentTitle || e.title, e.email].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          {toSign > 0 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">{tx.toSignBadge(toSign)}</span>}
          {nextIv && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">{tx.upcomingTag}: {fmtDate(nextIv.startAt, lang)}</span>}
          {e.accessLevel !== "full" && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{tx.access[e.accessLevel]}</span>}
        </div>
        <Icon icon={open ? "tabler:chevron-up" : "tabler:chevron-down"} className="w-4 h-4 text-gray-400 flex-shrink-0 print:hidden" />
      </button>

      {open && (
        <div className="px-4 sm:px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Block icon="tabler:address-book" title={tx.contact}>
            {e.contact ? (
              <>
                <Row label={tx.phone} value={e.contact.phone} href={e.contact.phone ? `tel:${e.contact.phone}` : undefined} />
                <Row label={tx.workPhone} value={e.contact.workPhone} href={e.contact.workPhone ? `tel:${e.contact.workPhone}` : undefined} />
                <Row label={tx.email} value={e.email} href={`mailto:${e.email}`} />
                <Row label={tx.workEmail} value={e.contact.workEmail} href={e.contact.workEmail ? `mailto:${e.contact.workEmail}` : undefined} />
                <Row label={tx.address} value={e.contact.address} />
                <Row label="LinkedIn" value={e.contact.linkedIn} href={e.contact.linkedIn || undefined} />
              </>
            ) : <><Row label={tx.email} value={e.email} href={`mailto:${e.email}`} />{e.accessLevel !== "full" && <Empty text={tx.notShared} />}</>}
            {e.acceptedAt && <p className="text-xs text-gray-400 mt-2">{tx.joined} {fmtDate(e.acceptedAt, lang)}</p>}
          </Block>

          <Block icon="tabler:phone-call" title={tx.emergency}>
            {e.emergencyContact ? (
              <>
                <Row label={tx.name} value={[e.emergencyContact.name, e.emergencyContact.relationship && `(${e.emergencyContact.relationship})`].filter(Boolean).join(" ")} />
                <Row label={tx.phone} value={e.emergencyContact.phone} href={e.emergencyContact.phone ? `tel:${e.emergencyContact.phone}` : undefined} />
                <Row label={tx.email} value={e.emergencyContact.email} />
              </>
            ) : <Empty text={e.accessLevel === "full" ? tx.none : tx.notShared} />}
          </Block>

          <Block icon="tabler:briefcase" title={tx.employment}>
            {ed ? (
              <>
                <Row label={tx.status} value={optLabel(STATUS_LABELS, ed.employmentStatus, lang)} />
                <Row label={tx.employer} value={ed.employerName} />
                <Row label={tx.jobTitle} value={[ed.presentTitle, ed.workArea].filter(Boolean).join(" · ")} />
                <Row label={tx.type} value={[optLabel(TYPE_LABELS, ed.employmentType, lang), ed.employmentRate].filter(Boolean).join(" · ")} />
                <Row label={tx.started} value={fmtDate(ed.employmentDate, lang)} />
                <Row label={tx.city} value={ed.officeLocation} />
                <Row label={tx.salary} value={ed.salaryLevel ? `${formatAmount(ed.salaryLevel, lang)} ${ed.salaryCurrency}` : ""} />
                <Row label={tx.notice} value={ed.noticePeriod ? ed.noticePeriod.replace("_", " ") : ""} />
                <Row label={tx.available} value={fmtDate(ed.availableFrom, lang)} />
              </>
            ) : <Empty text={e.accessLevel === "full" ? tx.none : tx.notShared} />}
          </Block>

          <Block icon="tabler:file-certificate" title={tx.contracts} count={e.contracts?.length}>
            {e.contracts === null ? <Empty text={tx.notShared} /> : e.contracts.length === 0 ? <Empty text={tx.none} /> : (
              <ul className="space-y-1.5">
                {e.contracts.map((c) => {
                  const tone = contractTone(c, tx)
                  return (
                    <li key={c.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 min-w-0 truncate text-gray-800">{c.title || "—"}</span>
                      {c.endDate && <span className="text-xs text-gray-400 flex-shrink-0">→ {fmtDate(c.endDate, lang)}</span>}
                      <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0", tone.cls)}>{tone.text}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Block>

          <Block icon="tabler:calendar-event" title={tx.interviews} count={e.interviews?.length}>
            {e.interviews === null ? <Empty text={tx.notShared} /> : e.interviews.length === 0 ? <Empty text={tx.none} /> : (
              <ul className="space-y-1.5">
                {e.interviews.slice(0, 6).map((i) => (
                  <li key={i.id} className={clsx("flex items-center gap-2 text-sm", !i.upcoming && "text-gray-400")}>
                    <Icon icon={i.format === "phone" ? "tabler:phone" : i.format === "in_person" ? "tabler:map-pin" : "tabler:video"} className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="flex-1 truncate">{i.position}</span>
                    <span className="text-xs flex-shrink-0">{fmtDate(i.startAt, lang, true)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Block>

          <Block icon="tabler:files" title={`${tx.cvs} · ${tx.portfolio} · ${tx.letters}`}>
            <div className="space-y-2.5">
              {([
                [tx.cvs, sections.cvs, e.cvs?.map((c) => c.name)],
                [tx.portfolio, sections.portfolio, e.portfolio?.map((p) => p.title)],
                [tx.letters, sections.coverLetters, e.coverLetters?.map((l) => [l.jobTitle, l.companyName].filter(Boolean).join(" — "))],
              ] as const).map(([title, available, items]) => (
                <div key={title}>
                  <p className="text-xs font-semibold text-gray-500">{title} {items ? <span className="text-gray-400 font-normal">({items.length})</span> : null}</p>
                  {!available ? <Empty text={tx.notAvailable} /> : items == null ? <Empty text={tx.notShared} /> : items.length === 0 ? <Empty text={tx.none} /> : (
                    <p className="text-sm text-gray-700 leading-relaxed">{items.slice(0, 6).join(" · ")}{items.length > 6 ? ` +${items.length - 6}` : ""}</p>
                  )}
                </div>
              ))}
            </div>
          </Block>
        </div>
      )}
    </div>
  )
}

/* ─── Main ─── */
export default function DelegationHandover({ delegationId, language, canOpenWorkspace = true, onClose }: {
  delegationId: string
  language: Lang
  /** False for the absent manager previewing their own handover. */
  canOpenWorkspace?: boolean
  onClose: () => void
}) {
  const lang: Lang = language === "sv" ? "sv" : "en"
  const tx = TX[lang]
  const [data, setData] = useState<Handover | null>(null)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const load = () => {
    setError(false)
    getHandover(delegationId).then((d) => {
      setData(d)
      // Small teams: open everyone; big teams: start collapsed.
      if (d.employees.length <= 3) setOpen(Object.fromEntries(d.employees.map((e) => [e.id, true])))
    }).catch(() => setError(true))
  }
  useEffect(load, [delegationId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev }
  }, [onClose])

  const filtered = useMemo(() => {
    if (!data) return []
    const words = fold(query).split(/\s+/).filter(Boolean)
    return data.employees.filter((e) => words.every((w) => fold(`${e.name} ${e.email} ${e.employment?.presentTitle ?? ""}`).includes(w)))
  }, [data, query])

  const stats = useMemo(() => {
    if (!data) return null
    const now = Date.now()
    const items: { key: string; icon: string; tone: string; text: string; at: number }[] = []
    let toSign = 0, active = 0, upcoming = data.otherInterviews.length
    for (const e of data.employees) {
      for (const c of e.contracts ?? []) {
        if (c.signedAt && !c.managerSignedAt) { toSign++; items.push({ key: `s${c.id}`, icon: "tabler:signature", tone: "text-violet-600", text: tx.aSign(e.name, c.title), at: 0 }) }
        else if (!c.signedAt && (c.status === "pending_signature" || c.status === "sent")) items.push({ key: `p${c.id}`, icon: "tabler:send", tone: "text-amber-600", text: tx.aSent(e.name, c.title), at: 1 })
        if (c.signedAt && c.managerSignedAt) active++
        if (c.endDate) {
          const t = new Date(c.endDate).getTime()
          if (t > now && t - now < 30 * DAY) items.push({ key: `e${c.id}`, icon: "tabler:calendar-x", tone: "text-red-500", text: tx.aEnding(e.name, fmtDate(c.endDate, lang)), at: t })
        }
      }
      for (const i of e.interviews ?? []) {
        if (!i.upcoming) continue
        upcoming++
        const t = new Date(i.startAt).getTime()
        if (t - now < 7 * DAY) items.push({ key: `i${i.id}`, icon: "tabler:calendar-event", tone: "text-blue-700", text: tx.aInterview(e.name, fmtDate(i.startAt, lang, true)), at: t })
      }
    }
    for (const i of data.otherInterviews) {
      const t = new Date(i.startAt).getTime()
      if (t - now < 7 * DAY) items.push({ key: `o${i.id}`, icon: "tabler:calendar-event", tone: "text-blue-700", text: tx.aInterview(i.candidateName, fmtDate(i.startAt, lang, true)), at: t })
    }
    return { toSign, active, upcoming, attention: items.sort((a, b) => a.at - b.at) }
  }, [data, tx, lang])

  const owner = data?.delegation.owner
  const allOpen = filtered.length > 0 && filtered.every((e) => open[e.id])

  return (
    <div className="fixed inset-0 z-[80] bg-gray-50 overflow-y-auto print:static print:overflow-visible" role="dialog" aria-modal="true">
      {/* Header */}
      <div className="sticky top-0 z-10 text-white print:static" style={{ background: "linear-gradient(135deg, rgb(5,22,80) 0%, rgb(20,40,110) 100%)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4 flex-wrap">
          <div className="w-11 h-11 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {owner ? initials(owner.name) : ""}
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs text-white/60 uppercase tracking-wide font-semibold">{tx.handoverFrom}</p>
            <h2 className="text-lg font-bold">{owner?.name ?? "…"}</h2>
            {data && (
              <p className="text-xs text-white/70 mt-0.5">
                {REASON_LABELS[data.delegation.reason]?.[lang]} · {formatPeriod(data.delegation, lang)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 print:hidden">
            {data && canOpenWorkspace && data.delegation.state === "active" && (
              <button onClick={() => switchWorkspace(data.delegation.owner.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-sm font-semibold hover:bg-blue-50" style={{ color: NAVY }}>
                <Icon icon="tabler:arrows-exchange" className="w-4 h-4" />
                <span className="hidden sm:inline">{tx.openWorkspace(owner?.name.split(" ")[0] ?? "")}</span>
              </button>
            )}
            <button onClick={() => window.print()} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10" title={tx.print}>
              <Icon icon="tabler:printer" className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10" title={tx.close}>
              <Icon icon="tabler:x" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            {tx.failed}<button onClick={load} className="font-semibold underline">{tx.retry}</button>
          </div>
        )}
        {!data && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 text-sm gap-3">
            <span className="w-7 h-7 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />{tx.loading}
          </div>
        )}

        {data && stats && (
          <>
            {data.delegation.message && (
              <div className="rounded-2xl border border-blue-100 bg-white p-4 flex gap-3">
                <Icon icon="tabler:message-2" className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: NAVY }} />
                <div>
                  <p className="text-xs font-semibold text-gray-500">{tx.message} {owner?.name}</p>
                  <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap">{data.delegation.message}</p>
                </div>
              </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: tx.employees, value: data.employees.length, icon: "tabler:users" },
                { label: tx.toSign, value: stats.toSign, icon: "tabler:signature", warn: stats.toSign > 0 },
                { label: tx.activeContracts, value: stats.active, icon: "tabler:file-check" },
                { label: tx.upcoming, value: stats.upcoming, icon: "tabler:calendar-event" },
              ].map((k) => (
                <div key={k.label} className={clsx("rounded-2xl border bg-white p-4 flex items-center gap-3", k.warn ? "border-violet-200" : "border-gray-100")}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: k.warn ? "rgb(245,243,255)" : "rgb(239,246,255)" }}>
                    <Icon icon={k.icon} className="w-5 h-5" style={{ color: k.warn ? "rgb(109,40,217)" : NAVY }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 leading-none">{k.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{k.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Needs attention */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-2">
                <Icon icon="tabler:alert-circle" className="w-4 h-4 text-amber-500" />{tx.attention}
              </p>
              {stats.attention.length === 0 ? <Empty text={tx.nothing} /> : (
                <ul className="space-y-2">
                  {stats.attention.slice(0, 12).map((a) => (
                    <li key={a.key} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <Icon icon={a.icon} className={clsx("w-4 h-4 flex-shrink-0 mt-0.5", a.tone)} />{a.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Team */}
            <div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h3 className="text-base font-bold text-gray-900">{tx.employees} ({data.employees.length})</h3>
                <div className="relative flex-1 min-w-[200px] max-w-sm ml-auto print:hidden">
                  <Icon icon="tabler:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tx.search}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
                {filtered.length > 0 && (
                  <button onClick={() => setOpen(allOpen ? {} : Object.fromEntries(filtered.map((e) => [e.id, true])))}
                    className="text-xs font-semibold text-blue-900 hover:underline print:hidden">
                    {allOpen ? tx.collapseAll : tx.expandAll}
                  </button>
                )}
              </div>
              {data.employees.length === 0 ? <Empty text={tx.noEmployees} /> : filtered.length === 0 ? <Empty text={tx.noMatch} /> : (
                <div className="space-y-3">
                  {filtered.map((e) => (
                    <EmployeeCard key={e.id} e={e} tx={tx} lang={lang} sections={data.sections}
                      open={!!open[e.id]} onToggle={() => setOpen((o) => ({ ...o, [e.id]: !o[e.id] }))} />
                  ))}
                </div>
              )}
            </div>

            {/* Candidates */}
            {data.otherInterviews.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-3">{tx.candidates}</p>
                <ul className="divide-y divide-gray-50">
                  {data.otherInterviews.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 py-2 text-sm">
                      <Icon icon="tabler:calendar-event" className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-800">{i.candidateName}</span>
                      <span className="text-gray-400 truncate flex-1">{i.position}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">{fmtDate(i.startAt, lang, true)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
