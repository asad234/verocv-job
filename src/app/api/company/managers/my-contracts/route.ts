// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/managers/my-contracts/route.ts   (NEW)
// URL:            GET  /api/company/managers/my-contracts
// WHAT IT DOES:   Manager: contracts the business admin sent to ME (never drafts).
// ══════════════════════════════════════════════════════════════════════

import { recipientListHandler } from '@/utils/server/contractScopes'
import { MANAGER_RECIPIENT } from '@/utils/server/managerContractScopes'

export const GET = recipientListHandler(MANAGER_RECIPIENT)
