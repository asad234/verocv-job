"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/admin/views/ManagerProfile.tsx   (NEW)
// WHAT IT DOES:   Business admin → a manager's profile page (view "manager_profile").
//   Contact, role & department, about, team (employees), activity.
//   Buttons: Message (chat) · Edit (edit page) · Delete (dialog).
//   Data: GET /api/company/admin/managers/:id
// ══════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from "react"
import type React from "react"
import { Icon } from "@iconify/react"
import { useBusinessAdmin } from "../Businessadmincontext"
import { useBusinessAdminTranslations } from "@/utils/Businessadmintranslations"
import { managersApi, type ManagerProfile as Profile } from "@/utils/adminManagers"
import DeleteManagerDialog from "./DeleteManagerDialog"
import { StatusBadge } from "./Managerslist"
import { NAVY, formatDate, initials, relativeTime, txFor } from "./managersText"

function Card({ title, icon, children, action }: { title: string; icon: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-gray-50">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Icon icon={icon} className="w-4 h-4" style={{ color: NAVY }} />
          {title}
        </h2>
        {action}
      </div>
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
          href ? <a href={href} className="text-sm font-medium text-gray-900 hover:underline break-all">{value}</a>
            : <p className="text-sm font-medium text-gray-900 break-words">{value}</p>
        ) : <p className="text-sm text-gray-300">—</p>}
      </div>
    </div>
  )
}

export default function ManagerProfile() {
  const { language } = useBusinessAdminTranslations()
  const tx = txFor(language)
  const { selectedManagerId, setView, openChat, openManagerEdit } = useBusinessAdmin()
  const [p, setP] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!selectedManagerId) return
    setLoading(true)
    setError(false)
    try {
      setP(await managersApi.get(selectedManagerId))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [selectedManagerId])
  useEffect(() => { load() }, [load])

  const back = (
    <button onClick={() => setView("managers_list")} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 mb-4">
      <Icon icon="tabler:arrow-left" className="w-4 h-4" />{tx.back}
    </button>
  )

  if (!selectedManagerId || error) {
    return (
      <div className="max-w-6xl mx-auto">
        {back}
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-sm text-gray-600">{tx.loadProfileFailed}</p>
          {selectedManagerId && <button onClick={load} className="mt-2 text-sm font-semibold underline" style={{ color: NAVY }}>{tx.retry}</button>}
        </div>
      </div>
    )
  }

  if (loading || !p) {
    return (
      <div className="max-w-6xl mx-auto">
        {back}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gray-100" />
          <div className="space-y-2 flex-1"><div className="h-5 w-48 bg-gray-100 rounded" /><div className="h-3 w-64 bg-gray-100 rounded" /></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {back}

      {/* Hero */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="h-20 sm:h-24" style={{ background: `linear-gradient(120deg, ${NAVY} 0%, rgb(30,58,138) 100%)` }} />
        <div className="px-5 sm:px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="-mt-10 w-20 h-20 rounded-2xl ring-4 ring-white flex items-center justify-center text-2xl font-bold text-white flex-shrink-0" style={{ backgroundColor: NAVY }}>
              {initials(p.name)}
            </div>
            <div className="flex-1 min-w-0 sm:pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{p.name}</h1>
                <StatusBadge status={p.status} label={tx.status[p.status]} />
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{[p.jobTitle, p.department, p.company].filter(Boolean).join(" · ") || p.email}</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:pt-3">
              <button onClick={() => openChat(p.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:shadow-md" style={{ backgroundColor: NAVY }}>
                <Icon icon="tabler:message-circle" className="w-4 h-4" />{tx.chat}
              </button>
              <button onClick={() => openManagerEdit(p.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Icon icon="tabler:edit" className="w-4 h-4" />{tx.edit}
              </button>
              <button onClick={() => setDeleting(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50">
                <Icon icon="tabler:trash" className="w-4 h-4" />{tx.delete}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card title={tx.contact} icon="tabler:address-book">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 divide-y sm:divide-y-0 divide-gray-50">
              <Row icon="tabler:briefcase" label={tx.workEmail} value={p.email} href={`mailto:${p.email}`} />
              <Row icon="tabler:mail" label={tx.privateEmail} value={p.privateEmail} href={p.privateEmail ? `mailto:${p.privateEmail}` : undefined} />
              <Row icon="tabler:phone" label={tx.phone} value={p.phone} href={p.phone ? `tel:${p.phone.replace(/\s/g, "")}` : undefined} />
              <Row icon="tabler:device-mobile" label={tx.mobile} value={p.mobilePhone} href={p.mobilePhone ? `tel:${p.mobilePhone.replace(/\s/g, "")}` : undefined} />
            </div>
          </Card>

          <Card title={tx.work} icon="tabler:building-community">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <Row icon="tabler:id-badge-2" label={tx.jobTitle} value={p.jobTitle} />
              <Row icon="tabler:building" label={tx.department} value={p.department} />
              <Row icon="tabler:building-skyscraper" label={tx.company} value={p.company} />
              <Row icon="tabler:shield" label={tx.access} value={p.accessLevel} />
              <Row icon="tabler:calendar" label={tx.managingSince} value={p.managedSince ? formatDate(p.managedSince, language) : ""} />
              <Row icon="tabler:users-group" label={tx.teamSize} value={p.deptSize} />
              <Row icon="tabler:target-arrow" label={tx.focus} value={p.deptFocus} />
            </div>
            {p.deptGoals && (
              <div className="mt-3 p-4 rounded-xl bg-gray-50 text-sm text-gray-700 whitespace-pre-wrap">
                <p className="text-xs font-semibold text-gray-500 mb-1">{tx.goals}</p>{p.deptGoals}
              </div>
            )}
          </Card>

          {p.professionalBio && (
            <Card title={tx.bio} icon="tabler:file-text">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{p.professionalBio}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title={tx.activity} icon="tabler:activity">
            <dl className="grid grid-cols-2 gap-3">
              {[
                { label: tx.statEmployees, value: p.employeeCount },
                { label: tx.statPending, value: p.pendingInvitations },
                { label: tx.contracts, value: p.stats.contracts },
                { label: tx.upcomingInterviews, value: p.stats.upcomingInterviews },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-xl bg-gray-50">
                  <dd className="text-lg font-bold text-gray-900">{s.value}</dd>
                  <dt className="text-[11px] text-gray-500 leading-tight">{s.label}</dt>
                </div>
              ))}
            </dl>
            <div className="mt-4 space-y-1.5 text-sm">
              <p className="flex justify-between gap-2"><span className="text-gray-500">{tx.created}</span><span className="font-medium text-gray-800">{formatDate(p.createdAt, language)}</span></p>
              <p className="flex justify-between gap-2"><span className="text-gray-500">{tx.lastActive}</span><span className="font-medium text-gray-800">{relativeTime(p.lastSeenAt, tx, language)}</span></p>
            </div>
          </Card>

          <Card title={`${tx.team} (${p.employees.length})`} icon="tabler:users">
            {p.employees.length === 0 ? (
              <p className="text-sm text-gray-500">{tx.noTeam}</p>
            ) : (
              <ul className="space-y-1 -mx-2 max-h-80 overflow-y-auto">
                {p.employees.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ backgroundColor: "rgb(204,251,241)", color: "rgb(15,118,110)" }}>{initials(e.name)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{e.name}</p>
                      <p className="text-xs text-gray-500 truncate">{e.email}</p>
                    </div>
                    <button onClick={() => openChat(e.id)} title={tx.chat} aria-label={`${tx.chat}: ${e.name}`} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                      <Icon icon="tabler:message-circle" className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <DeleteManagerDialog
        manager={deleting ? { id: p.id, name: p.name, email: p.email } : null}
        tx={tx}
        onClose={() => setDeleting(false)}
        onDeleted={() => { setDeleting(false); setView("managers_list") }}
      />
    </div>
  )
}
