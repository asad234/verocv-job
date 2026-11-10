// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/managers/my-contracts/[id]/pdf/route.ts   (NEW)
// URL:            GET  /api/company/managers/my-contracts/:id/pdf
// WHAT IT DOES:   Manager: the fully signed PDF (?download=1 to download).
// ══════════════════════════════════════════════════════════════════════

import { recipientPdfHandler } from '@/utils/server/contractScopes'
import { MANAGER_RECIPIENT } from '@/utils/server/managerContractScopes'

export const runtime = 'nodejs'
export const GET = recipientPdfHandler(MANAGER_RECIPIENT)
