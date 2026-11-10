// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/manager-contracts/generate/route.ts   (NEW)
// URL:            POST  /api/company/admin/manager-contracts/generate
// WHAT IT DOES:   AI draft / draft from the admin's reference files (same as the manager's generate).
// ══════════════════════════════════════════════════════════════════════

import { ownerGenerateHandler } from '@/utils/server/contractScopes'
import { ADMIN_OWNER } from '@/utils/server/managerContractScopes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export const POST = ownerGenerateHandler(ADMIN_OWNER)
