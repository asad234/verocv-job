// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/manager-contracts/[id]/sign/route.ts   (NEW)
// URL:            POST  /api/company/admin/manager-contracts/:id/sign
// WHAT IT DOES:   Admin counter-signs after the manager → contract complete + signed PDF.
// ══════════════════════════════════════════════════════════════════════

import { ownerSignHandler } from '@/utils/server/contractScopes'
import { ADMIN_OWNER } from '@/utils/server/managerContractScopes'

export const POST = ownerSignHandler(ADMIN_OWNER)
