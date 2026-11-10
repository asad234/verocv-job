// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/manager-contracts/route.ts   (NEW)
// URL:            GET · POST  /api/company/admin/manager-contracts
// WHAT IT DOES:   Business admin: list own contracts to managers (GET), create a draft (POST).
// ══════════════════════════════════════════════════════════════════════

import { ownerListHandlers } from '@/utils/server/contractScopes'
import { ADMIN_OWNER } from '@/utils/server/managerContractScopes'

export const { GET, POST } = ownerListHandlers(ADMIN_OWNER)
