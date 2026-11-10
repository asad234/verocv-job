// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/google/callback/route.ts
// URL:            GET /api/company/managers/google/callback   (Google redirects here)
// WHAT IT DOES:   Finishes "Connect Google Calendar": checks the signed state, exchanges
//                 the code for tokens, stores them encrypted, and sends the manager back
//                 to the page they came from with ?google=connected (or an error code).
//
// Register this exact URL in Google Cloud Console → Credentials → OAuth client →
// "Authorized redirect URIs", e.g. https://your-domain/api/company/managers/google/callback
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireManagerId } from '@/utils/server/Contractaccess'
import {
  GoogleCalendarError,
  saveConnectionFromCode,
  verifyState,
} from '@/utils/server/googleCalendar'

function back(req: NextRequest, returnTo: string, result: string) {
  const url = new URL(returnTo, req.nextUrl.origin)
  url.searchParams.set('google', result)
  return NextResponse.redirect(url)
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const state = verifyState(params.get('state'))
  if (!state) return back(req, '/dashboard', 'invalid_state')

  // The manager pressed "Cancel" on Google's consent screen.
  if (params.get('error'))
    return back(req, state.returnTo, params.get('error') === 'access_denied' ? 'denied' : 'error')

  // The person finishing the flow must be the manager who started it.
  const managerId = await requireManagerId(req)
  if (managerId === null || managerId !== state.uid)
    return back(req, state.returnTo, 'not_authorized')

  const code = params.get('code')
  if (!code) return back(req, state.returnTo, 'error')

  try {
    const payload = await getPayload({ config })
    await saveConnectionFromCode(payload, managerId, code)
    return back(req, state.returnTo, 'connected')
  } catch (error) {
    console.error('❌ Google callback failed:', error)
    return back(
      req,
      state.returnTo,
      error instanceof GoogleCalendarError && error.code === 'missing_scope'
        ? 'missing_scope'
        : 'error',
    )
  }
}
