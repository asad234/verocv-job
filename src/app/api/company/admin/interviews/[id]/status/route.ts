// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/interviews/[id]/status/route.ts   (NEW)
// URL:            POST  /api/company/admin/interviews/:id/status
// WHAT IT DOES:   Mark completed / cancelled / no-show.
// ══════════════════════════════════════════════════════════════════════

import { interviewerStatusHandler } from '@/utils/server/interviewScopes'
import { ADMIN_INTERVIEWER } from '@/utils/server/admininterviewScopes'

export const POST = interviewerStatusHandler(ADMIN_INTERVIEWER)
