// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/interviews/[id]/calendar/route.ts   (NEW)
// URL:            POST  /api/company/admin/interviews/:id/calendar
// WHAT IT DOES:   Add to the admin's Google Calendar / create the Meet link now.
// ══════════════════════════════════════════════════════════════════════

import { interviewerCalendarHandler } from '@/utils/server/interviewScopes'
import { ADMIN_INTERVIEWER } from '@/utils/server/admininterviewScopes'

export const POST = interviewerCalendarHandler(ADMIN_INTERVIEWER)
