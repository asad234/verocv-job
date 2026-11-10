"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/admin/views/EmployeesView.tsx   (REPLACES the mock)
// WHAT IT DOES:   Business admin → Employees. Real data: every employee in your
//                 managers' teams.
//   • Overview numbers, search, manager filter, sorting
//   • Table on desktop, cards on mobile
//   • Click a row → employee profile page (view "employee_profile")
//   • Eye button → side panel with CVs (open as PDF) and portfolio
//   • Message → chat with the employee
//   Data: GET /api/company/admin/employees
// ══════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from "react"
import { Icon } from "@iconify/react"
import { useBusinessAdmin } from "../Businessadmincontext"
import { useBusinessAdminTranslations } from "@/utils/Businessadmintranslations"
import { employeesApi, type EmployeeRow } from "@/utils/adminEmployees"
import EmployeeDocsDrawer from "./EmployeeDocsDrawer"
import { employeesTx, initials, relativeTime, type EmployeesTx } from "./employeesText"

const NAVY = "rgb(5,22,80)"
type Sort = "name" | "newest" | "cvs"
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

export function AccessChip({ level, tx }: { level: EmployeeRow["managers"][number]["accessLevel"]; tx: EmployeesTx }) {
  const style =
    level === "full" ? "bg-emerald-50 text-emerald-700" : level === "cv_only" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${style}`}>{tx.access[level]}</span>
}

function IconAction({ icon, label, onClick, disabled }: { icon: string; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      title={label}
      aria-label={label}
      className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
    >
      <Icon icon={icon} className="w-[18px] h-[18px]" />
    </button>
  )
}

function Shared({ e, tx }: { e: EmployeeRow; tx: EmployeesTx }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
      <span className={`flex items-center gap-1 ${e.canSeeCvs ? "" : "text-gray-300"}`}>
        <Icon icon={e.canSeeCvs ? "tabler:files" : "tabler:lock"} className="w-3.5 h-3.5" />
        {e.canSeeCvs ? tx.cvs(e.cvCount) : "CV"}
      </span>
      <span className={`flex items-center gap-1 ${e.canSeePortfolio ? "" : "text-gray-300"}`}>
        <Icon icon={e.canSeePortfolio ? "tabler:briefcase" : "tabler:lock"} className="w-3.5 h-3.5" />
        {e.canSeePortfolio ? tx.items(e.portfolioCount) : "Portfolio"}
      </span>
    </div>
  )
}

export default function EmployeesView() {
  const { language } = useBusinessAdminTranslations()
  const tx = employeesTx(language)
  const { openChat, openEmployeeProfile } = useBusinessAdmin()

  const [rows, setRows] = useState<EmployeeRow[]>([])
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [search, setSearch] = useState("")
  const [managerId, setManagerId] = useState("")
  const [sort, setSort] = useState<Sort>("name")
  const [docsFor, setDocsFor] = useState<EmployeeRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const r = await employeesApi.list()
      setRows(r.data)
      setManagers(r.managers)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const stats = useMemo(() => [
    { label: tx.statEmployees, value: rows.length, icon: "tabler:user-circle" },
    { label: tx.statManagers, value: new Set(rows.flatMap((r) => r.managers.map((m) => m.id))).size, icon: "tabler:users" },
    { label: tx.statCvs, value: rows.reduce((a, r) => a + (r.canSeeCvs ? r.cvCount : 0), 0), icon: "tabler:files" },
    { label: tx.statPortfolio, value: rows.reduce((a, r) => a + (r.canSeePortfolio ? r.portfolioCount : 0), 0), icon: "tabler:briefcase" },
  ], [rows, tx])

  const shown = useMemo(() => {
    const q = fold(search.trim())
    const list = rows.filter((r) =>
      (!managerId || r.managers.some((m) => m.id === managerId)) &&
      (!q || fold(`${r.name} ${r.email} ${r.title}`).includes(q)),
    )
    return [...list].sort((a, b) =>
      sort === "newest" ? String(b.connectedAt ?? "").localeCompare(String(a.connectedAt ?? ""))
        : sort === "cvs" ? b.cvCount - a.cvCount || a.name.localeCompare(b.name, "sv")
          : a.name.localeCompare(b.name, "sv"),
    )
  }, [rows, search, managerId, sort])

  const filtered = Boolean(search || managerId)
  const canDocs = (e: EmployeeRow) => e.canSeeCvs || e.canSeePortfolio

  const actions = (e: EmployeeRow) => (
    <div className="flex items-center justify-end gap-0.5">
      <IconAction icon="tabler:eye" label={tx.docsBtn} onClick={() => setDocsFor(e)} disabled={!canDocs(e)} />
      <IconAction icon="tabler:message-circle" label={tx.message} onClick={() => openChat(e.id)} />
      <IconAction icon="tabler:chevron-right" label={tx.view} onClick={() => openEmployeeProfile(e.id)} />
    </div>
  )

  const managerChips = (e: EmployeeRow) => (
    <div className="flex flex-col gap-1">
      {e.managers.map((m) => (
        <span key={m.id} className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm text-gray-700 truncate">{m.name}</span>
          <AccessChip level={m.accessLevel} tx={tx} />
        </span>
      ))}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: NAVY }}>
          <Icon icon="tabler:user-circle" className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{tx.title}</h1>
          <p className="text-sm text-gray-500">{tx.subtitle}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgb(239,246,255)" }}>
              <Icon icon={s.icon} className="w-5 h-5" style={{ color: NAVY }} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-gray-900 leading-tight">{loading ? "–" : s.value}</p>
              <p className="text-xs text-gray-500 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1 lg:max-w-sm">
            <Icon icon="tabler:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tx.search}
              aria-label={tx.search}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-200"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600" aria-label={tx.clearFilters}>
                <Icon icon="tabler:x" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2 lg:ml-auto">
            <select value={managerId} onChange={(e) => setManagerId(e.target.value)} aria-label={tx.colManager}
              className="flex-1 lg:flex-none min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white outline-none cursor-pointer">
              <option value="">{tx.allManagers}</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort"
              className="flex-1 lg:flex-none min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white outline-none cursor-pointer">
              <option value="name">{tx.sortName}</option>
              <option value="newest">{tx.sortNewest}</option>
              <option value="cvs">{tx.sortCvs}</option>
            </select>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="divide-y divide-gray-50">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2"><div className="h-3.5 w-40 bg-gray-100 rounded" /><div className="h-3 w-56 bg-gray-100 rounded" /></div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="p-10 text-center">
            <Icon icon="tabler:alert-circle" className="w-10 h-10 mx-auto text-red-300" />
            <p className="mt-2 text-sm text-gray-600">{tx.loadFailed}</p>
            <button onClick={load} className="mt-2 text-sm font-semibold underline" style={{ color: NAVY }}>{tx.retry}</button>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center">
              <Icon icon="tabler:users" className="w-7 h-7 text-gray-300" />
            </div>
            <p className="mt-3 font-semibold text-gray-800">{tx.noEmployees}</p>
            <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">{tx.noEmployeesHint}</p>
          </div>
        ) : shown.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-600">{tx.noMatches}</p>
            {filtered && <button onClick={() => { setSearch(""); setManagerId("") }} className="mt-2 text-sm font-semibold underline" style={{ color: NAVY }}>{tx.clearFilters}</button>}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden md:table w-full text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400">
                  <th className="font-semibold px-4 py-3">{tx.colEmployee}</th>
                  <th className="font-semibold px-4 py-3">{tx.colManager}</th>
                  <th className="font-semibold px-4 py-3">{tx.colShared}</th>
                  <th className="font-semibold px-4 py-3 whitespace-nowrap">{tx.colLastActive}</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shown.map((e) => (
                  <tr key={e.id} onClick={() => openEmployeeProfile(e.id)} className="cursor-pointer hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: "rgb(204,251,241)", color: "rgb(15,118,110)" }}>
                          {initials(e.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{e.name}</p>
                          <p className="text-xs text-gray-500 truncate">{[e.title, e.email].filter(Boolean).join(" · ")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">{managerChips(e)}</td>
                    <td className="px-4 py-3"><Shared e={e} tx={tx} /></td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{relativeTime(e.lastSeenAt, tx, language)}</td>
                    <td className="px-4 py-3">{actions(e)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <ul className="md:hidden divide-y divide-gray-50">
              {shown.map((e) => (
                <li key={e.id} onClick={() => openEmployeeProfile(e.id)} className="p-4 cursor-pointer active:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: "rgb(204,251,241)", color: "rgb(15,118,110)" }}>
                      {initials(e.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{e.name}</p>
                      <p className="text-xs text-gray-500 truncate">{e.title || e.email}</p>
                      <div className="mt-2">{managerChips(e)}</div>
                      <div className="mt-2"><Shared e={e} tx={tx} /></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pl-[52px]">
                    <span className="text-xs text-gray-400">{tx.colLastActive}: {relativeTime(e.lastSeenAt, tx, language)}</span>
                    {actions(e)}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <EmployeeDocsDrawer employee={docsFor} tx={tx} language={language} onClose={() => setDocsFor(null)} />
    </div>
  )
}
