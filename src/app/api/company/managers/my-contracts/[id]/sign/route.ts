// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/managers/my-contracts/[id]/sign/route.ts   (NEW)
// URL:            POST  /api/company/managers/my-contracts/:id/sign
// WHAT IT DOES:   Manager signs a contract from the business admin (VeroCV signing).
// ══════════════════════════════════════════════════════════════════════

import { recipientSignHandler } from '@/utils/server/contractScopes'
import { MANAGER_RECIPIENT } from '@/utils/server/managerContractScopes'

export const POST = recipientSignHandler(MANAGER_RECIPIENT)
