"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/admin/views/Managerslist.tsx
// WHAT IT DOES:   Business admin → Managers → Managers list.
//   • Overview numbers, search, status filter, sorting
//   • Table on desktop, cards on mobile
//   • Message → chat with the manager · Profile → profile page · Edit → edit page
//   • Delete → DeleteManagerDialog (reason + type-to-confirm, permanent)
//   Data: GET /api/company/admin/managers
// ══════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from "react"
import type React from "react"
import { Icon } from "@iconify/react"
import { useBusinessAdmin } from "../Businessadmincontext"
import { useBusinessAdminTranslations } from "@/utils/Businessadmintranslations"
import { managersApi, type ManagerRow, type ManagerStatus } from "@/utils/adminManagers"
import DeleteManagerDialog from "./DeleteManagerDialog"
import { NAVY, STATUS_STYLE, initials, relativeTime, txFor } from "./managersText"

type Sort = "name" | "newest" | "team"
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

export function StatusBadge({ status, label }: { status: ManagerStatus; label: string }) {
  const s = STATUS_STYLE[status]
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ backgroundColor: s.bg, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {label}
    </span>
  )
}

function IconAction({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick() }}
      title={label}
      aria-label={label}
      className={`p-2 rounded-lg transition-colors ${danger ? "text-gray-400 hover:text-red-600 hover:bg-red-50" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
    >
      <Icon icon={icon} className="w-[18px] h-[18px]" />
    </button>
  )
}

export default function ManagersList() {
  const { language } = useBusinessAdminTranslations()
  const tx = txFor(language)
  const { setView, openChat, openManagerProfile, openManagerEdit } = useBusinessAdmin()

  const [managers, setManagers] = useState<ManagerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<ManagerStatus | "">("")
  const [sort, setSort] = useState<Sort>("name")
  const [deleting, setDeleting] = useState<ManagerRow | null>(null)
  const [toast, setToast] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      setManagers(await managersApi.list())
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(""), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const counts = useMemo(() => ({
    all: managers.length,
    active: managers.filter((m) => m.status === "active").length,
    inactive: managers.filter((m) => m.status === "inactive").length,
    pending: managers.filter((m) => m.status === "pending").length,
    employees: managers.reduce((a, m) => a + m.employeeCount, 0),
    invites: managers.reduce((a, m) => a + m.pendingInvitations, 0),
  }), [managers])

  const shown = useMemo(() => {
    const q = fold(search.trim())
    const list = managers.filter((m) =>
      (!status || m.status === status) &&
      (!q || fold(`${m.name} ${m.email} ${m.department} ${m.jobTitle}`).includes(q)),
    )
    return [...list].sort((a, b) =>
      sort === "newest" ? String(b.createdAt).localeCompare(String(a.createdAt))
        : sort === "team" ? b.employeeCount - a.employeeCount || a.name.localeCompare(b.name, "sv")
          : a.name.localeCompare(b.name, "sv"),
    )
  }, [managers, search, status, sort])

  const stats: { label: string; value: number; icon: string }[] = [
    { label: tx.statTotal, value: counts.all, icon: "tabler:users" },
    { label: tx.statActive, value: counts.active, icon: "tabler:circle-check" },
    { label: tx.statEmployees, value: counts.employees, icon: "tabler:user-circle" },
    { label: tx.statPending, value: counts.invites, icon: "tabler:mail-forward" },
  ]
  const filters: { key: ManagerStatus | ""; label: string; n: number }[] = [
    { key: "", label: tx.all, n: counts.all },
    { key: "active", label: tx.status.active, n: counts.active },
    { key: "inactive", label: tx.status.inactive, n: counts.inactive },
    { key: "pending", label: tx.status.pending, n: counts.pending },
  ]

  const actions = (m: ManagerRow) => (
    <div className="flex items-center justify-end gap-0.5">
      <IconAction icon="tabler:message-circle" label={tx.chat} onClick={() => openChat(m.id)} />
      <IconAction icon="tabler:user-circle" label={tx.profile} onClick={() => openManagerProfile(m.id)} />
      <IconAction icon="tabler:edit" label={tx.edit} onClick={() => openManagerEdit(m.id)} />
      <IconAction icon="tabler:trash" label={tx.delete} onClick={() => setDeleting(m)} danger />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: NAVY }}>
            <Icon icon="tabler:users" className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{tx.title}</h1>
            <p className="text-sm text-gray-500">{tx.subtitle}</p>
          </div>
        </div>
        <button onClick={() => setView("create_manager")} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:shadow-md transition-all" style={{ backgroundColor: NAVY }}>
          <Icon icon="tabler:user-plus" className="w-4 h-4" />
          {tx.create}
        </button>
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

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
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
          <div className="flex items-center gap-1 overflow-x-auto" role="tablist">
            {filters.map((f) => (
              <button
                key={f.key || "all"}
                role="tab"
                aria-selected={status === f.key}
                onClick={() => setStatus(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${status === f.key ? "text-white" : "text-gray-600 hover:bg-gray-100"}`}
                style={status === f.key ? { backgroundColor: NAVY } : undefined}
              >
                {f.label}
                <span className={`text-[11px] px-1.5 rounded-full ${status === f.key ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>{f.n}</span>
              </button>
            ))}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort"
            className="lg:ml-auto px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white outline-none cursor-pointer">
            <option value="name">{tx.sortName}</option>
            <option value="newest">{tx.sortNewest}</option>
            <option value="team">{tx.sortTeam}</option>
          </select>
        </div>

        {/* Body */}
        {loading ? (
          <ul className="divide-y divide-gray-50" aria-busy>
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-56 bg-gray-100 rounded animate-pulse" />
                </div>
              </li>
            ))}
          </ul>
        ) : loadError ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-600">{tx.loadFailed}</p>
            <button onClick={load} className="mt-2 text-sm font-semibold underline" style={{ color: NAVY }}>{tx.retry}</button>
          </div>
        ) : shown.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: "rgb(239,246,255)" }}>
              <Icon icon="tabler:users" className="w-7 h-7" style={{ color: NAVY }} />
            </div>
            {managers.length === 0 ? (
              <>
                <p className="text-sm font-semibold text-gray-800">{tx.noManagers}</p>
                <p className="text-sm text-gray-500 mt-1">{tx.noManagersHint}</p>
                <button onClick={() => setView("create_manager")} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: NAVY }}>{tx.create}</button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500">{tx.noMatches}</p>
                <button onClick={() => { setSearch(""); setStatus("") }} className="mt-2 text-sm font-semibold underline" style={{ color: NAVY }}>{tx.clearFilters}</button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400">
                  <th className="font-semibold px-4 py-3">{tx.colManager}</th>
                  <th className="font-semibold px-4 py-3">{tx.colDepartment}</th>
                  <th className="font-semibold px-4 py-3">{tx.colStatus}</th>
                  <th className="font-semibold px-4 py-3">{tx.colTeam}</th>
                  <th className="font-semibold px-4 py-3 hidden lg:table-cell">{tx.colLastActive}</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shown.map((m) => (
                  <tr key={m.id} onClick={() => openManagerProfile(m.id)} className="group cursor-pointer hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: NAVY }}>{initials(m.name)}</div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate group-hover:underline underline-offset-2">{m.name}</p>
                          <p className="text-xs text-gray-500 truncate">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 truncate">{m.department || "—"}</p>
                      {m.jobTitle && <p className="text-xs text-gray-500 truncate">{m.jobTitle}</p>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={m.status} label={tx.status[m.status]} /></td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 whitespace-nowrap">{tx.employees(m.employeeCount)}</p>
                      {m.pendingInvitations > 0 && <p className="text-xs text-amber-600">{tx.pending(m.pendingInvitations)}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden lg:table-cell">{relativeTime(m.lastSeenAt, tx, language)}</td>
                    <td className="px-2 py-3">{actions(m)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <ul className="md:hidden divide-y divide-gray-100">
              {shown.map((m) => (
                <li key={m.id} className="p-4" onClick={() => openManagerProfile(m.id)}>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: NAVY }}>{initials(m.name)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 truncate">{m.name}</p>
                        <StatusBadge status={m.status} label={tx.status[m.status]} />
                      </div>
                      <p className="text-xs text-gray-500 truncate">{m.email}</p>
                      <p className="text-xs text-gray-500 mt-1">{[m.department, tx.employees(m.employeeCount)].filter(Boolean).join(" · ")}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2" onClick={(e) => e.stopPropagation()}>
                    {[
                      { icon: "tabler:message-circle", label: tx.chat, fn: () => openChat(m.id) },
                      { icon: "tabler:user-circle", label: tx.profile, fn: () => openManagerProfile(m.id) },
                      { icon: "tabler:edit", label: tx.edit, fn: () => openManagerEdit(m.id) },
                      { icon: "tabler:trash", label: tx.delete, fn: () => setDeleting(m), danger: true },
                    ].map((a) => (
                      <button key={a.label} onClick={a.fn} className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[11px] font-medium ${a.danger ? "border-red-100 text-red-600" : "border-gray-100 text-gray-600"}`}>
                        <Icon icon={a.icon} className="w-4 h-4" />{a.label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <DeleteManagerDialog
        manager={deleting}
        tx={tx}
        onClose={() => setDeleting(null)}
        onDeleted={(id) => {
          const name = deleting?.name ?? ""
          setManagers((ms) => ms.filter((m) => m.id !== id))
          setDeleting(null)
          setToast(tx.deleted(name))
        }}
      />

      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-900 text-white text-sm shadow-xl">
          <Icon icon="tabler:circle-check-filled" className="w-4 h-4 text-green-400" />{toast}
        </div>
      )}
    </div>
  )
}
