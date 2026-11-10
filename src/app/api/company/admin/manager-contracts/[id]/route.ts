// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/manager-contracts/[id]/route.ts   (NEW)
// URL:            GET · PATCH · DELETE  /api/company/admin/manager-contracts/:id
// WHAT IT DOES:   Business admin: open (editor), save draft, delete draft.
// ══════════════════════════════════════════════════════════════════════

import { ownerItemHandlers } from '@/utils/server/contractScopes'
import { ADMIN_OWNER } from '@/utils/server/managerContractScopes'

export const { GET, PATCH, DELETE } = ownerItemHandlers(ADMIN_OWNER)
