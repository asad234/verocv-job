// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/interviews/[id]/route.ts   (NEW)
// URL:            GET · PATCH · DELETE  /api/company/admin/interviews/:id
// WHAT IT DOES:   Open, reschedule / notes / evaluation, delete.
// ══════════════════════════════════════════════════════════════════════

import { interviewerItemHandlers } from '@/utils/server/interviewScopes'
import { ADMIN_INTERVIEWER } from '@/utils/server/admininterviewScopes'

export const { GET, PATCH, DELETE } = interviewerItemHandlers(ADMIN_INTERVIEWER)
