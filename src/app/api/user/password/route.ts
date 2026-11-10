// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/user/password/route.ts   (NEW)
// URL:            GET  /api/user/password  → { authType, provider, canChange }
//                 POST /api/user/password  body { currentPassword, newPassword } → { ok: true }
// WHAT IT DOES:   Any logged-in user changes their OWN password (Account Settings → Security).
//
// If your app folder has no "(frontend)" group, use the same path without it.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { changeOwnPassword, passwordStatus } from '@/utils/server/changePassword'

async function requireUserId(req: NextRequest): Promise<number | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  })
  const id = Number(token?.id)
  return token?.id && Number.isFinite(id) ? id : null
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId(req)
    if (userId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })
    return await passwordStatus(userId)
  } catch (error) {
    console.error('❌ Failed to load password status:', error)
    return NextResponse.json({ message: 'Failed to load' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId(req)
    if (userId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })
    return await changeOwnPassword(userId, await req.json().catch(() => null))
  } catch (error) {
    console.error('❌ Failed to change password:', error)
    return NextResponse.json({ message: 'Failed to change password' }, { status: 500 })
  }
}
