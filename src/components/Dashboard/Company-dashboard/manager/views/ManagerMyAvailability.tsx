"use client"
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/manager/views/ManagerMyAvailability.tsx   (REPLACE)
// WHAT IT DOES:   The manager's own availability — two views to switch between, like the employees:
//   • Ledighet & arbetsvecka / Time off & week — status, working week, ask your business admin
//   • Kalender / Calendar — drag over many days: Available / Booked, or vacation, sick, VAB …
//     (time off opens the request form with the days filled in). Your business admin sees
//     your calendar marks in their Manager availability overview.
// ══════════════════════════════════════════════════════════════════════

import { useEffect } from "react"
import { useManagerTranslations } from "@/utils/Managertranslations"
import AvailabilityViews from "@/components/Dashboard/Availability/AvailabilityViews"
import { managerAvailabilityApi, markTimeOffSeen } from "@/utils/myAvailabilityApi"

export default function ManagerMyAvailability() {
  const { language } = useManagerTranslations()
  useEffect(() => { markTimeOffSeen() }, []) // clears the sidebar badge
  return <AvailabilityViews api={managerAvailabilityApi} lang={language === "en" ? "en" : "sv"} audience="manager" />
}
