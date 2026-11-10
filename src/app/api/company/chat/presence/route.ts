// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/chat/presence/route.ts   (NEW)
// URL:            GET /api/chat/presence → { presence: MyPresence }
//                 PUT /api/chat/presence { status, message?, until? } → { presence }
// WHAT IT DOES:   Read / set your own chat status (Available, Busy, In a meeting,
//                 Away, Not at the office, Not available, Appear offline).
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireChatUser } from '@/utils/server/chat'
import {
  PresenceInputError,
  getMyPresence,
  parsePresenceInput,
  setMyPresence,
  touchPresence,
} from '@/utils/server/presence'

const noStore = { 'Cache-Control': 'private, no-store' }

export async function GET(req: NextRequest) {
  try {
    const me = await requireChatUser(req)
    if (!me) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })
    const payload = await getPayload({ config })
    await touchPresence(payload, me.id)
    return NextResponse.json(
      { presence: await getMyPresence(payload, me.id) },
      { status: 200, headers: noStore },
    )
  } catch (error) {
    console.error('❌ Failed to load presence:', error)
    return NextResponse.json({ message: 'Failed to load status' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const me = await requireChatUser(req)
    if (!me) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })
    let input
    try {
      input = parsePresenceInput(await req.json().catch(() => null))
    } catch (e) {
      if (e instanceof PresenceInputError)
        return NextResponse.json({ message: e.message }, { status: 400 })
      throw e
    }
    const payload = await getPayload({ config })
    return NextResponse.json(
      { presence: await setMyPresence(payload, me.id, input) },
      { status: 200, headers: noStore },
    )
  } catch (error) {
    console.error('❌ Failed to save presence:', error)
    return NextResponse.json({ message: 'Failed to save status' }, { status: 500 })
  }
}
