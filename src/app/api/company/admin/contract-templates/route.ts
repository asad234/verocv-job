// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/contract-templates/route.ts   (NEW)
// URL:            GET · POST  /api/company/admin/contract-templates
// WHAT IT DOES:   Business admin's own contract reference files (list / upload).
// ══════════════════════════════════════════════════════════════════════

import { ownerTemplatesHandlers } from '@/utils/server/contractScopes'
import { ADMIN_OWNER } from '@/utils/server/managerContractScopes'

export const runtime = 'nodejs'
export const { GET, POST } = ownerTemplatesHandlers(ADMIN_OWNER)
