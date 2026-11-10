"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"

const NAVY = "rgb(5,22,80)"

/** Same shape as GET /api/company/managers/employees → data[] */
export interface ManagedEmployee {
  employeeId: string
  employeeName: string
  employeeEmail: string
}

interface EmployeePickerProps {
  isEn: boolean
  /** The selected employee's user id ("" when none). */
  value: string
  /** Shown if the selected employee isn't in the list (e.g. invitation later revoked). */
  fallbackName?: string
  onSelect: (employee: ManagedEmployee | null) => void
  disabled?: boolean
  invalid?: boolean
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1
    ? `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

export default function EmployeePicker({
  isEn, value, fallbackName, onSelect, disabled, invalid,
}: EmployeePickerProps) {
  const [employees, setEmployees] = useState<ManagedEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [highlight, setHighlight] = useState(0)

  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  /* ── Load the manager's employees (accepted invitations only) ── */
  useEffect(() => {
    let cancelled = false
    fetch("/api/company/managers/employees", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const body = await res.json()
        const list: ManagedEmployee[] = (body.data ?? []).map((e: any) => ({
          employeeId: String(e.employeeId),
          employeeName: e.employeeName ?? "",
          employeeEmail: e.employeeEmail ?? "",
        }))
        list.sort((a, b) =>
          (a.employeeName || a.employeeEmail).localeCompare(b.employeeName || b.employeeEmail, "sv"),
        )
        if (!cancelled) setEmployees(list)
      })
      .catch(() => { if (!cancelled) setLoadError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  /* ── Close on outside click; focus search when opened ── */
  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onMouseDown)
    setTimeout(() => searchRef.current?.focus(), 0)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return employees
    return employees.filter(e =>
      e.employeeName.toLowerCase().includes(q) || e.employeeEmail.toLowerCase().includes(q),
    )
  }, [employees, query])

  useEffect(() => { setHighlight(0) }, [query, open])

  // Keep the highlighted row in view while using the arrow keys
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${highlight}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [highlight])

  const selected = employees.find(e => e.employeeId === value) ?? null
  const selectedLabel = selected
    ? selected.employeeName || selected.employeeEmail
    : value
      ? fallbackName || (isEn ? "Linked employee" : "Kopplad medarbetare")
      : ""

  const choose = (emp: ManagedEmployee | null) => {
    onSelect(emp)
    setOpen(false)
    setQuery("")
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); return }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight(h => Math.min(h + 1, filtered.length - 1)) }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)) }
    if (e.key === "Enter") {
      e.preventDefault()
      const emp = filtered[highlight]
      if (emp) choose(emp)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={clsx(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm bg-white text-left outline-none transition-all",
          "focus:ring-2 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed",
          invalid ? "border-red-300" : open ? "border-blue-300" : "border-gray-200 hover:border-gray-300",
        )}
      >
        {selectedLabel ? (
          <>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
              style={{ backgroundColor: NAVY }}>
              {initialsOf(selectedLabel)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-gray-800">{selectedLabel}</span>
              {selected?.employeeEmail && selected.employeeName && (
                <span className="block truncate text-[11px] text-gray-400">{selected.employeeEmail}</span>
              )}
            </span>
          </>
        ) : (
          <span className="flex-1 text-gray-400 flex items-center gap-2">
            <Icon icon="tabler:user-search" className="w-4 h-4" />
            {isEn ? "Choose one of your employees…" : "Välj en av dina medarbetare…"}
          </span>
        )}
        <Icon icon={open ? "tabler:chevron-up" : "tabler:chevron-down"} className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden"
          onKeyDown={onKeyDown}>
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Icon icon="tabler:search" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={isEn ? "Search by name or email…" : "Sök på namn eller e-post…"}
                className="w-full pl-8 pr-8 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <Icon icon="tabler:x" className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {!loading && !loadError && employees.length > 0 && (
              <p className="text-[10px] text-gray-400 mt-1.5 px-0.5">
                {isEn
                  ? `${filtered.length} of ${employees.length} employees`
                  : `${filtered.length} av ${employees.length} medarbetare`}
              </p>
            )}
          </div>

          <div ref={listRef} className="max-h-64 overflow-y-auto py-1">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                {isEn ? "Loading employees…" : "Laddar medarbetare…"}
              </div>
            )}

            {!loading && loadError && (
              <div className="px-4 py-6 text-center text-sm text-red-500">
                {isEn ? "Couldn't load your employees." : "Kunde inte ladda dina medarbetare."}
              </div>
            )}

            {!loading && !loadError && employees.length === 0 && (
              <div className="px-4 py-6 text-center">
                <Icon icon="tabler:users" className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
                <p className="text-sm text-gray-500">{isEn ? "No employees yet." : "Inga medarbetare ännu."}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isEn
                    ? "Employees appear here once they accept your invitation."
                    : "Medarbetare visas här när de har accepterat din inbjudan."}
                </p>
              </div>
            )}

            {!loading && !loadError && employees.length > 0 && filtered.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                {isEn ? "No employees match your search." : "Inga medarbetare matchar din sökning."}
              </div>
            )}

            {filtered.map((emp, i) => {
              const isSelected = emp.employeeId === value
              const name = emp.employeeName || emp.employeeEmail
              return (
                <button
                  key={emp.employeeId}
                  type="button"
                  data-index={i}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => choose(emp)}
                  className={clsx(
                    "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                    i === highlight ? "bg-blue-50/70" : "hover:bg-gray-50",
                  )}
                >
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ backgroundColor: NAVY }}>
                    {initialsOf(name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-800 truncate">{name}</span>
                    {emp.employeeName && (
                      <span className="block text-xs text-gray-400 truncate">{emp.employeeEmail}</span>
                    )}
                  </span>
                  {isSelected && <Icon icon="tabler:check" className="w-4 h-4 text-blue-700 flex-shrink-0" />}
                </button>
              )
            })}
          </div>

          {value && (
            <div className="border-t border-gray-100 p-1.5">
              <button type="button" onClick={() => choose(null)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50">
                <Icon icon="tabler:user-x" className="w-3.5 h-3.5" />
                {isEn ? "Remove selected employee" : "Ta bort vald medarbetare"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
