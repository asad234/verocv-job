"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Availability/AvailabilityViews.tsx   (NEW)
// WHAT IT DOES:   "My availability" with two views to switch between — used by BOTH
//                 the employee's Availability page and the manager's My availability:
//   • Ledighet & arbetsvecka / Time off & week → MyAvailabilityPanel
//   • Kalender / Calendar                      → AvailabilityCalendar
//   The chosen view is remembered in this browser (separately for managers / employees).
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react"
import { Icon } from "@iconify/react"
import clsx from "clsx"
import MyAvailabilityPanel, { myAvailabilityTexts, type Audience } from "./MyAvailabilityPanel"
import type { SelfAvailabilityApi } from "@/utils/myAvailabilityApi"
import AvailabilityCalendar from "./AvailabilityCalendar"

const NAVY = "rgb(5,22,80)"
type View = "plan" | "calendar"

export default function AvailabilityViews({ lang, audience, api }: { lang: "sv" | "en"; audience: Audience; api: SelfAvailabilityApi }) {
  const x = myAvailabilityTexts(lang, audience)
  const key = `${audience}AvailabilityView`
  const [view, setViewState] = useState<View>("plan")
  useEffect(() => {
    try { if (window.localStorage.getItem(key) === "calendar") setViewState("calendar") } catch { /* private mode */ }
  }, [key])
  const setView = (v: View) => {
    setViewState(v)
    try { window.localStorage.setItem(key, v) } catch { /* private mode */ }
  }
  const E = lang === "en"
  const tabs: { id: View; icon: string; label: string; hint: string }[] = [
    { id: "plan", icon: "tabler:calendar-user", label: E ? "Time off & week" : "Ledighet & arbetsvecka", hint: E ? "Status, working week and requests" : "Status, arbetsvecka och förfrågningar" },
    { id: "calendar", icon: "tabler:calendar-month", label: E ? "Calendar" : "Kalender", hint: E ? "Mark many days at once" : "Markera många dagar på en gång" },
  ]

  return (
    <div className="p-4 sm:p-6 m-0 sm:m-4">
      <div className="mb-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg" style={{ backgroundColor: NAVY }}><Icon icon="tabler:calendar-user" className="w-5 h-5 text-white" /></div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{x.title}</h1>
          </div>
          <p className="text-gray-500 text-sm sm:ml-12">{x.desc}</p>
        </div>
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-100 w-full lg:w-auto">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setView(t.id)} title={t.hint}
              className={clsx("flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all min-w-0",
                view === t.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}>
              <Icon icon={t.icon} className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      {view === "plan"
        ? <MyAvailabilityPanel api={api} lang={lang} audience={audience} />
        : <AvailabilityCalendar api={api} lang={lang} audience={audience} />}
    </div>
  )
}
