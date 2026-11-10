// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/interviews/route.ts   (NEW)
// URL:            GET · POST  /api/company/admin/interviews
// WHAT IT DOES:   Business admin: list own interviews (GET), book an interview (POST).
// ══════════════════════════════════════════════════════════════════════

import { interviewerListHandlers } from '@/utils/server/interviewScopes'
import { ADMIN_INTERVIEWER } from '@/utils/server/admininterviewScopes'

export const { GET, POST } = interviewerListHandlers(ADMIN_INTERVIEWER)
