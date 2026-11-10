// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/settings/password/route.ts
// URL:            GET  /api/company/managers/settings/password  → { authType, provider, canChange }
//                 POST /api/company/managers/settings/password  body { currentPassword, newPassword }
// WHAT IT DOES:   The logged-in manager changes their own password (never the
//                 colleague they're covering for). Logic: utils/server/changePassword.ts
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { changeOwnPassword, passwordStatus } from '@/utils/server/changePassword'

const MANAGER_ROLES = new Set(['client-manager', 'client-admin'])

async function requireManagerSelf(req: NextRequest): Promise<number | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  })
  const id = Number(token?.id)
  if (!token?.id || !MANAGER_ROLES.has(String(token.roles ?? '')) || !Number.isFinite(id))
    return null
  return id
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireManagerSelf(req)
    if (userId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    return await passwordStatus(userId)
  } catch (error) {
    console.error('❌ Failed to load password status:', error)
    return NextResponse.json({ message: 'Failed to load' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireManagerSelf(req)
    if (userId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    return await changeOwnPassword(userId, await req.json().catch(() => null))
  } catch (error) {
    console.error('❌ Failed to change password:', error)
    return NextResponse.json({ message: 'Failed to change password' }, { status: 500 })
  }
}
