// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/contract-templates/[id]/route.ts   (NEW)
// URL:            GET · DELETE  /api/company/admin/contract-templates/:id
// WHAT IT DOES:   Open (?download=1) or delete one of the admin's reference files.
// ══════════════════════════════════════════════════════════════════════

import { ownerTemplateItemHandlers } from '@/utils/server/contractScopes'
import { ADMIN_OWNER } from '@/utils/server/managerContractScopes'

export const runtime = 'nodejs'
export const { GET, DELETE } = ownerTemplateItemHandlers(ADMIN_OWNER)
