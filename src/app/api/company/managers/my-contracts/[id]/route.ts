// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/managers/my-contracts/[id]/route.ts   (NEW)
// URL:            GET  /api/company/managers/my-contracts/:id
// WHAT IT DOES:   Manager: one contract sent to me, with its full text and signatures.
// ══════════════════════════════════════════════════════════════════════

import { recipientItemHandler } from '@/utils/server/contractScopes'
import { MANAGER_RECIPIENT } from '@/utils/server/managerContractScopes'

export const GET = recipientItemHandler(MANAGER_RECIPIENT)
