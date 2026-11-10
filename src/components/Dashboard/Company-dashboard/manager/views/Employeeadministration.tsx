"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import { useManagerTranslations } from "@/utils/Managertranslations"

/* ─── Types ─── */
type InvitationStatus = "pending" | "accepted" | "declined"

interface SentInvitation {
  id: string
  employeeEmail: string
  bossName: string
  companyName?: string
  status: InvitationStatus
  createdAt: string
  respondedAt: string | null
}

interface EmployeeSummary {
  employeeId: string
  employeeName: string
  employeeEmail: string
}

/* ─── Constants ─── */
const NAVY = "rgb(5,22,80)"

const statusStyles: Record<InvitationStatus, { bg: string; text: string; border: string }> = {
  pending: { bg: "rgb(255,251,235)", text: "rgb(146,64,14)", border: "rgb(253,230,138)" },
  accepted: { bg: "rgb(240,253,244)", text: "rgb(22,101,52)", border: "rgb(187,247,208)" },
  declined: { bg: "rgb(254,242,242)", text: "rgb(153,27,27)", border: "rgb(254,202,202)" },
}

const inputCls = (err?: boolean) =>
  `w-full px-4 py-3 rounded-xl border text-sm bg-white outline-none focus:ring-2 focus:border-transparent transition-all ${err ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-blue-200"}`

type TFunc = ReturnType<typeof useManagerTranslations>["t"]

/* ─────────────────────────────────────────────
   EMPLOYEE PROFILE DRAWER — same pattern as EmployeeAvailability's drawer
───────────────────────────────────────────── */
interface DrawerEmployee {
  employeeId: string
  employeeName: string
  employeeEmail: string
}

interface ProfileData {
  personalInformation: {
    firstName?: string; lastName?: string; title?: string
    phoneNumber?: string; workEmail?: string; homeAddress?: string
  } | null
  cv: {
    experience: Array<{ employer?: string; title?: string }>
    skills: Array<{ skillName?: string }>
  } | null
}

function EmployeeDrawer({ employee, onClose, t }: { employee: DrawerEmployee | null; onClose: () => void; t: TFunc }) {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!employee) return
    setData(null)
    setError("")
    setLoading(true)
    fetch(`/api/company/managers/employees/${employee.employeeId}/hr-info`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load profile")
        return res.json()
      })
      .then((body) => setData({ personalInformation: body.personalInformation, cv: body.cv }))
      .catch(() => setError(t.loadProfileFailed))
      .finally(() => setLoading(false))
  }, [employee, t.loadProfileFailed])

  if (!employee) return null
  const pi = data?.personalInformation
  const cv = data?.cv

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>
              {employee.employeeName?.[0]?.toUpperCase() || employee.employeeEmail?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{employee.employeeName || employee.employeeEmail}</p>
              {pi?.title && <p className="text-xs text-gray-400 truncate">{pi.title}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 flex-shrink-0">
            <Icon icon="tabler:x" className="w-5 h-5" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            {t.loading}
          </div>
        )}
        {!loading && error && (
          <div className="p-6"><div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div></div>
        )}
        {!loading && !error && (
          <div className="p-6 space-y-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{t.contact}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Icon icon="tabler:mail" className="w-4 h-4 text-gray-400" /> {pi?.workEmail || employee.employeeEmail}
                </div>
                {pi?.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Icon icon="tabler:phone" className="w-4 h-4 text-gray-400" /> {pi.phoneNumber}
                  </div>
                )}
                {pi?.homeAddress && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Icon icon="tabler:map-pin" className="w-4 h-4 text-gray-400" /> {pi.homeAddress}
                  </div>
                )}
              </div>
            </div>
            {cv?.experience && cv.experience.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{t.currentRole}</p>
                <p className="text-sm font-medium text-gray-800">{cv.experience[0]?.title}</p>
                <p className="text-xs text-gray-500">{cv.experience[0]?.employer}</p>
              </div>
            )}
            {cv?.skills && cv.skills.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{t.skills}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cv.skills.slice(0, 10).map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">{s.skillName}</span>
                  ))}
                </div>
              </div>
            )}
            {!pi && !cv && <p className="text-sm text-gray-400">{t.noProfile}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function EmployeeAdministration() {
  const { t, language } = useManagerTranslations()
  const isEn = language === "en"

  const [invitations, setInvitations] = useState<SentInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | "">("")
  const [drawerEmployee, setDrawerEmployee] = useState<DrawerEmployee | null>(null)

  // Real employee records (with employeeId) — cross-referenced against
  // invitations by email so accepted invites can open the profile drawer,
  // since the invitations endpoint itself doesn't return an employeeId.
  const [employeesByEmail, setEmployeesByEmail] = useState<Record<string, EmployeeSummary>>({})

  const loadInvitations = () => {
    setLoading(true)
    setLoadError("")
    fetch("/api/company/managers/invitations")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load")
        const body = await res.json()
        setInvitations(body.data ?? [])
      })
      .catch(() => setLoadError(isEn ? "Failed to load invitations." : "Kunde inte ladda inbjudningar."))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadInvitations() }, [])

  useEffect(() => {
    let cancelled = false
    fetch("/api/company/managers/employees")
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const body = await res.json()
        if (cancelled) return
        const list: EmployeeSummary[] = body.data ?? []
        const map: Record<string, EmployeeSummary> = {}
        list.forEach((emp) => { if (emp.employeeEmail) map[emp.employeeEmail.toLowerCase()] = emp })
        setEmployeesByEmail(map)
      })
      .catch(() => { })
    return () => { cancelled = true }
  }, [])

  const filtered = invitations.filter((inv) => {
    const matchesSearch = !search || inv.employeeEmail.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-4 sm:p-6 m-2 sm:m-4">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}>
              <Icon icon="tabler:users-group" className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t.adminTitle}</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12 max-w-lg">{t.adminDesc}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Icon icon="tabler:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchLabel}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200 transition-all" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as InvitationStatus | "")}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-600 outline-none cursor-pointer">
          <option value="">{t.filterAll}</option>
          <option value="pending">{isEn ? "Pending" : "Väntande"}</option>
          <option value="accepted">{isEn ? "Accepted" : "Accepterad"}</option>
          <option value="declined">{isEn ? "Declined" : "Avböjd"}</option>
        </select>
        <div className="flex items-center px-4 py-2.5 rounded-xl border border-gray-100 bg-white text-sm text-gray-500 gap-2">
          <Icon icon="tabler:users" className="w-4 h-4 text-gray-400" />
          {t.totalLabel}: <span className="font-semibold ml-1" style={{ color: NAVY }}>{filtered.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        <div className="grid grid-cols-12 gap-3 px-6 py-3 text-xs font-semibold tracking-widest uppercase text-gray-400 bg-gray-50/70 border-b border-gray-100">
          <div className="col-span-6">{isEn ? "Email" : "E-post"}</div>
          <div className="col-span-3">{t.statusCol}</div>
          <div className="col-span-3">{isEn ? "Sent" : "Skickad"}</div>
        </div>

        {loading && (
          <div className="py-16 flex items-center justify-center gap-2 text-gray-400 text-sm">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            {isEn ? "Loading…" : "Laddar…"}
          </div>
        )}

        {!loading && loadError && (
          <div className="p-6 text-sm text-red-600">{loadError}</div>
        )}

        {!loading && !loadError && filtered.length === 0 && (
          <div className="py-16 text-center">
            <Icon icon="tabler:users-minus" className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">{t.noEmployeesFound}</p>
          </div>
        )}

        {!loading && !loadError && filtered.map((inv, i) => {
          const ss = statusStyles[inv.status]
          const matchedEmployee = employeesByEmail[inv.employeeEmail.toLowerCase()]
          const canOpenProfile = inv.status === "accepted" && !!matchedEmployee
          return (
            <div key={inv.id}
              className={clsx("grid grid-cols-12 gap-3 px-6 py-4 items-center hover:bg-blue-50/20 transition-colors", i < filtered.length - 1 && "border-b border-gray-50")}>
              {canOpenProfile ? (
                <button
                  onClick={() => setDrawerEmployee({ employeeId: matchedEmployee.employeeId, employeeName: matchedEmployee.employeeName || "", employeeEmail: inv.employeeEmail })}
                  className="col-span-6 flex items-center gap-3 min-w-0 text-left hover:opacity-70 transition-opacity"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>
                    {inv.employeeEmail[0]?.toUpperCase()}
                  </div>
                  <div className="text-sm font-medium truncate" style={{ color: NAVY }}>
                    {matchedEmployee.employeeName || inv.employeeEmail}
                  </div>
                </button>
              ) : (
                <div className="col-span-6 flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: NAVY }}>
                    {inv.employeeEmail[0]?.toUpperCase()}
                  </div>
                  <div className="text-sm font-medium text-gray-800 truncate">{inv.employeeEmail}</div>
                </div>
              )}
              <div className="col-span-3">
                <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold border"
                  style={{ color: ss.text, backgroundColor: ss.bg, borderColor: ss.border }}>
                  {inv.status === "pending" ? (isEn ? "Pending" : "Väntande")
                    : inv.status === "accepted" ? (isEn ? "Accepted" : "Accepterad")
                      : (isEn ? "Declined" : "Avböjd")}
                </span>
              </div>
              <div className="col-span-3 text-xs text-gray-400">
                {new Date(inv.createdAt).toLocaleDateString(isEn ? "en-US" : "sv-SE", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
          )
        })}

      </div>


      {/* Employee profile drawer */}
      <EmployeeDrawer employee={drawerEmployee} onClose={() => setDrawerEmployee(null)} t={t} />
    </div>
  )
}
