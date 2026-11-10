// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/manager-contracts/[id]/send/route.ts   (NEW)
// URL:            POST  /api/company/admin/manager-contracts/:id/send
// WHAT IT DOES:   Send to the manager for signature (VeroCV signing).
// ══════════════════════════════════════════════════════════════════════

import { ownerSendHandler } from '@/utils/server/contractScopes'
import { ADMIN_OWNER } from '@/utils/server/managerContractScopes'

export const POST = ownerSendHandler(ADMIN_OWNER)
