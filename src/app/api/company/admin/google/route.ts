// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/google/route.ts   (NEW)
// URL:            GET · DELETE  /api/company/admin/google
// WHAT IT DOES:   The admin's own Google Calendar connection (status / disconnect). Connecting uses your existing /api/company/managers/google/connect + callback, which already accept a business admin (client-admin).
// ══════════════════════════════════════════════════════════════════════

import { interviewerGoogleHandlers } from '@/utils/server/interviewScopes'
import { ADMIN_INTERVIEWER } from '@/utils/server/admininterviewScopes'

export const { GET, DELETE } = interviewerGoogleHandlers(ADMIN_INTERVIEWER)
