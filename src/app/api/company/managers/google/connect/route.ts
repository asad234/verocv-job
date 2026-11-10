// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/google/connect/route.ts
// URL:            GET /api/company/managers/google/connect?returnTo=/dashboard/...
// WHAT IT DOES:   Starts "Connect Google Calendar": redirects the manager to Google's
//                 consent screen. Google sends them back to …/google/callback.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { requireManagerId } from '@/utils/server/Contractaccess'
import { buildAuthUrl, googleConfig, safeReturnTo, signState } from '@/utils/server/googleCalendar'

function back(req: NextRequest, returnTo: string, result: string) {
  const url = new URL(returnTo, req.nextUrl.origin)
  url.searchParams.set('google', result)
  return NextResponse.redirect(url)
}

export async function GET(req: NextRequest) {
  const returnTo = safeReturnTo(req.nextUrl.searchParams.get('returnTo'))
  const managerId = await requireManagerId(req)
  if (managerId === null) return back(req, returnTo, 'not_authorized')
  if (!googleConfig().configured) return back(req, returnTo, 'not_configured')

  return NextResponse.redirect(buildAuthUrl(signState({ uid: managerId, returnTo })))
}
