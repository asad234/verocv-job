"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/admin/views/AdminManagerInterviews.tsx   (NEW)
// WHAT IT DOES:   Business admin → Others → Interviews (view "interviews").
//   The SAME interview page the managers use — calendar/list, booking page,
//   detail drawer with notes + evaluation, reschedule, cancel, Google Calendar + Meet —
//   but for interviewing MANAGERS you want to hire:
//     • the person picker lists YOUR MANAGERS (or type any candidate by hand)
//     • interviews are saved as YOURS, in YOUR Google Calendar
//   The manager sees the interview under Others → My interviews in their dashboard.
//
//   How: adminContractsBridge.ts points the page's requests to /api/company/admin/...
//   and the page follows the business admin language — no changes to ManagerInterviews.
// ══════════════════════════════════════════════════════════════════════

import { useEffect } from "react"
import { Icon } from "@iconify/react"
import { useBusinessAdminTranslations } from "@/utils/Businessadmintranslations"
import { useManagerTranslations } from "@/utils/Managertranslations"
import { installAdminContractsBridge } from "@/utils/adminContractsBridge"
// ⚠ Same import as in your manager dashboard page.tsx.
import ManagerInterviews from "@/components/Dashboard/Company-dashboard/manager/views/ManagerInterviews"

// Before the page mounts, so its first requests already go to the admin API.
installAdminContractsBridge()

export default function AdminManagerInterviews() {
  const { t, language, isInitialized } = useBusinessAdminTranslations()
  const { language: managerLanguage, setLanguage: setManagerLanguage } = useManagerTranslations()

  // ManagerInterviews reads its texts from useManagerTranslations — follow the admin language.
  useEffect(() => {
    if (isInitialized && managerLanguage !== language) setManagerLanguage(language)
  }, [isInitialized, language, managerLanguage, setManagerLanguage])

  return (
    <div>
      <div className="max-w-7xl mx-auto mb-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-950">
        <Icon icon="tabler:calendar-user" className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <p>
          <span className="font-semibold">{t.managerInterviewsTitle}</span> {t.managerInterviewsDesc}
        </p>
      </div>
      <ManagerInterviews />
    </div>
  )
}
