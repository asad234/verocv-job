// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/managerContractScopes.ts   (NEW — server only)
// WHAT IT DOES:   Who is who for contracts between a business admin and their managers.
//   ADMIN_OWNER  — the business admin writes, sends and counter-signs (employer side).
//                  Recipients: only managers the admin created (platform admin: any manager).
//   MANAGER_RECIPIENT — the logged-in manager reads and signs contracts sent TO them.
//                  Always the manager's own account (a substitute workspace never applies).
// ══════════════════════════════════════════════════════════════════════

import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { relId, requireCompanyAdmin, type Admin } from '@/utils/server/adminmanagers'
import type { OwnerScope, RecipientScope } from '@/utils/server/contractScopes'

export const ADMIN_CONTRACTS_URL = '/api/company/admin/manager-contracts'
export const ADMIN_TEMPLATES_URL = '/api/company/admin/contract-templates'

export const ADMIN_OWNER: OwnerScope = {
  label: 'admin',
  templatesUrl: ADMIN_TEMPLATES_URL,
  notAllowedMessage: 'You can only send contracts to managers in your company',
  owner: async (req) => {
    const admin = await requireCompanyAdmin(req)
    return admin ? { id: admin.id, raw: admin } : null
  },
  canSendTo: async (_payload, owner, recipient) => {
    const admin = owner.raw as Admin
    if (!recipient || recipient.roles !== 'client-manager') return false
    return admin.role === 'admin' || Number(relId(recipient.createdBy)) === admin.id
  },
}

export const MANAGER_RECIPIENT: RecipientScope = {
  recipient: async (req: NextRequest) => {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
    })
    const id = Number(token?.id)
    if (!token?.id || !Number.isFinite(id) || token.roles !== 'client-manager') return null
    return id
  },
}
