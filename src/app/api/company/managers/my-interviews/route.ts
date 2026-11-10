// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/managers/my-interviews/route.ts   (NEW)
// URL:            GET  /api/company/managers/my-interviews
// WHAT IT DOES:   Manager: interviews the business admin (or anyone) booked WITH me.
// ══════════════════════════════════════════════════════════════════════

import { candidateListHandler } from '@/utils/server/interviewScopes'
import { MANAGER_CANDIDATE } from '@/utils/server/admininterviewScopes'

export const GET = candidateListHandler(MANAGER_CANDIDATE)
