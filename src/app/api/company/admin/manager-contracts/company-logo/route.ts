// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/admin/manager-contracts/company-logo/route.ts   (NEW)
// URL:            GET  /api/company/admin/manager-contracts/company-logo
// WHAT IT DOES:   The admin's latest company logo (from earlier contracts) for new contracts.
// ══════════════════════════════════════════════════════════════════════

import { ownerLogoHandler } from '@/utils/server/contractScopes'
import { ADMIN_OWNER } from '@/utils/server/managerContractScopes'

export const GET = ownerLogoHandler(ADMIN_OWNER)
