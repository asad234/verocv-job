// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/chat/conversations/[id]/read/route.ts   (NEW)
// URL:            POST /api/chat/conversations/:id/read → { ok, lastReadAt }
// WHAT IT DOES:   "I've seen this chat" — clears your unread count and shows
//                 "Seen" to the other person.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { findMyConversation, markRead, requireChatUser } from '@/utils/server/chat'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const me = await requireChatUser(req)
    if (!me) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })
    const { id } = await params
    const payload = await getPayload({ config })
    const conv = await findMyConversation(payload, me, id)
    if (!conv) return NextResponse.json({ message: 'Chat not found' }, { status: 404 })

    const at = new Date().toISOString()
    await markRead(payload, conv, me.id, at)
    return NextResponse.json(
      { ok: true, lastReadAt: at },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to mark chat read:', error)
    return NextResponse.json({ message: 'Failed to update' }, { status: 500 })
  }
}
