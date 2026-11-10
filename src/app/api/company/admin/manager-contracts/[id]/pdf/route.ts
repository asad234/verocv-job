// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/manager-contracts/[id]/pdf/route.ts   (NEW)
// URL:            GET  /api/company/admin/manager-contracts/:id/pdf
// WHAT IT DOES:   Signed PDF (inline; ?download=1 to download).
// ══════════════════════════════════════════════════════════════════════

import { ownerPdfHandler } from '@/utils/server/contractScopes'
import { ADMIN_OWNER } from '@/utils/server/managerContractScopes'

export const GET = ownerPdfHandler(ADMIN_OWNER)
