// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/google/route.ts
// URL:            GET     /api/company/managers/google   → { configured, connected, email, connectedAt }
//                 DELETE  /api/company/managers/google   → disconnect (revokes access at Google)
// WHAT IT DOES:   The manager's Google Calendar connection (used for Google Meet links).
//
// If your app folder has no "(frontend)" group, use the same path without it.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireManagerId } from '@/utils/server/Contractaccess'
import { connectionStatus, disconnect } from '@/utils/server/googleCalendar'

export async function GET(req: NextRequest) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const payload = await getPayload({ config })
    return NextResponse.json(await connectionStatus(payload, managerId), { status: 200 })
  } catch (error) {
    console.error('❌ Google status failed:', error)
    return NextResponse.json(
      { message: 'Could not load the Google Calendar connection.' },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })
    const payload = await getPayload({ config })
    await disconnect(payload, managerId)
    return NextResponse.json(await connectionStatus(payload, managerId), { status: 200 })
  } catch (error) {
    console.error('❌ Google disconnect failed:', error)
    return NextResponse.json({ message: 'Could not disconnect Google Calendar.' }, { status: 500 })
  }
}
