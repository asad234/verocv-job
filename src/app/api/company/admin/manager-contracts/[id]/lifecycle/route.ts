// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/manager-contracts/[id]/lifecycle/route.ts   (NEW)
// URL:            POST  /api/company/admin/manager-contracts/:id/lifecycle
// WHAT IT DOES:   Renew / extend / terminate.
// ══════════════════════════════════════════════════════════════════════

import { ownerLifecycleHandler } from '@/utils/server/contractScopes'
import { ADMIN_OWNER } from '@/utils/server/managerContractScopes'

export const POST = ownerLifecycleHandler(ADMIN_OWNER)
