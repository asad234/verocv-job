// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/adminInterviewScopes.ts   (NEW — server only)
// WHAT IT DOES:   Who is who for interviews between a business admin and managers.
//   ADMIN_INTERVIEWER — the business admin books and evaluates. A linked candidate
//                       must be one of the admin's own managers (platform admin: any
//                       manager). Anyone else can be booked by name + email.
//   MANAGER_CANDIDATE — the logged-in manager sees interviews booked with them.
// ══════════════════════════════════════════════════════════════════════

import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { findOwnManager, requireCompanyAdmin, type Admin } from '@/utils/server/adminmanagers'
import type { CandidateScope, InterviewerScope } from '@/utils/server/interviewScopes'

export const ADMIN_INTERVIEWER: InterviewerScope = {
  notAllowedMessage: 'You can only choose managers in your company.',
  interviewer: async (req) => {
    const admin = await requireCompanyAdmin(req)
    return admin ? { id: admin.id, raw: admin } : null
  },
  canLinkCandidate: async (payload, who, userId) =>
    !!(await findOwnManager(payload, who.raw as Admin, userId)),
}

export const MANAGER_CANDIDATE: CandidateScope = {
  candidate: async (req: NextRequest) => {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
    })
    const id = Number(token?.id)
    if (!token?.id || !Number.isFinite(id) || token.roles !== 'client-manager') return null
    return { id, email: typeof token.email === 'string' ? token.email.trim().toLowerCase() : '' }
  },
}
