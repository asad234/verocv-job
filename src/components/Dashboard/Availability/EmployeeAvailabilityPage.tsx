"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  your employee Availability page (the file with CalendarFormPage) — REPLACE.
// WHAT IT DOES:   One page, two views the employee switches between:
//   • "Ledighet & arbetsvecka / Time off & week" — status, working week, ask for time off
//   • "Kalender / Calendar" — the year calendar: pick a tool and drag over many days at once
//   Only for employees connected to a manager with FULL access (the manager is the one who
//   sees it and answers requests). Anyone else — or anyone whose access ends while the page
//   is open — is sent back to /dashboard, like Contracts / Interviews / Chats.
// ══════════════════════════════════════════════════════════════════════

import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"
import { employeeAvailabilityApi } from "@/utils/myAvailabilityApi"
import AvailabilityViews from "@/components/Dashboard/Availability/AvailabilityViews"
import ManagerAccessGate from "@/components/shared/ManagerAccessGate"

export default function CalendarFormPage() {
  const { language } = useDashboardTranslations() as { language?: string }
  return (
    <ManagerAccessGate full>
      <AvailabilityViews api={employeeAvailabilityApi} lang={language === "en" ? "en" : "sv"} audience="employee" />
    </ManagerAccessGate>
  )
}
