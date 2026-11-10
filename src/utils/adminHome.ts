// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/adminHome.ts   (NEW — shared by the API and the admin home page)
// ══════════════════════════════════════════════════════════════════════

import type { AdminReport } from '@/utils/adminReports'
import type { TimeOffRequest } from '@/utils/managerAvailability'

export interface AdminHomeInterview {
  id: string
  name: string
  position: string
  startAt: string
  durationMinutes: number
  format: string
  meetingLink: string | null
  location: string
}

export interface AdminHomeData {
  /** This week's report — `managers[].employees` is left empty on the home page. */
  report: AdminReport
  /** Approved days off in the next 7 days */
  away: TimeOffRequest[]
  /** Your own interviews in the next 7 days */
  interviews: AdminHomeInterview[]
}
