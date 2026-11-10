// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/changePassword.ts   (NEW — server only)
// WHAT IT DOES:   The one place that changes a user's own password. Used by
//                   /api/user/password                        (everyone)
//                   /api/company/managers/settings/password   (managers)
//                 The current password is checked with Payload's own login,
//                 so wrong guesses count towards the 5-attempt / 10-minute lock.
// ══════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/** Same rules as the form: 8+ characters, a number and a symbol. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.'
  if (pw.length > 128) return 'Password is too long.'
  if (!/\d/.test(pw)) return 'Password must contain a number.'
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must contain a symbol.'
  return null
}

const SIGN_IN_NAMES: Record<string, string> = {
  google: 'Google',
  linkedin: 'LinkedIn',
  github: 'GitHub',
}

/** { authType, provider, canChange } — so the form can explain OAuth accounts up front. */
export async function passwordStatus(userId: number) {
  const payload = await getPayload({ config })
  const user: any = await payload.findByID({
    collection: 'users',
    id: userId,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!user) return NextResponse.json({ message: 'Account not found' }, { status: 404 })
  const authType = user.authType || 'credentials'
  return NextResponse.json(
    { authType, provider: SIGN_IN_NAMES[authType] ?? null, canChange: authType === 'credentials' },
    { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
  )
}

export async function changeOwnPassword(userId: number, body: unknown) {
  const b = (body ?? {}) as { currentPassword?: unknown; newPassword?: unknown }
  const currentPassword = typeof b.currentPassword === 'string' ? b.currentPassword : ''
  const newPassword = typeof b.newPassword === 'string' ? b.newPassword : ''
  if (!currentPassword)
    return NextResponse.json(
      { message: 'Enter your current password.', field: 'currentPassword', code: 'missing' },
      { status: 400 },
    )
  const problem = passwordProblem(newPassword)
  if (problem)
    return NextResponse.json(
      { message: problem, field: 'newPassword', code: 'weak' },
      { status: 400 },
    )
  if (newPassword === currentPassword)
    return NextResponse.json(
      {
        message: 'The new password must be different from the current one.',
        field: 'newPassword',
        code: 'same',
      },
      { status: 400 },
    )

  const payload = await getPayload({ config })
  const user: any = await payload.findByID({
    collection: 'users',
    id: userId,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!user) return NextResponse.json({ message: 'Account not found' }, { status: 404 })
  if (user.authType && user.authType !== 'credentials') {
    const name = SIGN_IN_NAMES[user.authType] ?? user.authType
    return NextResponse.json(
      {
        message: `You sign in with ${name}, so there is no VeroCV password to change.`,
        code: 'oauth',
      },
      { status: 409 },
    )
  }

  try {
    await payload.login({
      collection: 'users',
      data: { email: user.email, password: currentPassword },
    })
  } catch (e: any) {
    const locked = /lock/i.test(String(e?.name ?? '') + String(e?.message ?? ''))
    return NextResponse.json(
      locked
        ? {
            message: 'Too many wrong attempts. Your account is locked for 10 minutes.',
            code: 'locked',
          }
        : { message: 'Current password is incorrect.', field: 'currentPassword', code: 'wrong' },
      { status: locked ? 423 : 400 },
    )
  }

  // authType is sent along because the Users beforeValidate hook resets it to
  // 'credentials' when an update doesn't include it.
  await payload.update({
    collection: 'users',
    id: userId,
    data: { password: newPassword, authType: 'credentials' } as any,
    overrideAccess: true,
  })
  return NextResponse.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}
