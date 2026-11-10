// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/chat/unread/route.ts   (NEW)
// URL:            GET /api/chat/unread → { total, chats }   (for the sidebar / header badge)
//                 Also counts as "I'm online" for your chat status (utils/server/presence.ts).
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  hiddenForEmployee,
  otherMemberId,
  requireChatUser,
  rolesOf,
  unreadFor,
} from '@/utils/server/chat'
import { touchPresence } from '@/utils/server/presence'

export async function GET(req: NextRequest) {
  try {
    const me = await requireChatUser(req)
    if (!me) return NextResponse.json({ total: 0, chats: 0 }, { status: 200 })
    const payload = await getPayload({ config })
    // Every open VeroCV tab polls this → keeps "Available" from turning into "Offline".
    await touchPresence(payload, me.id).catch(() => null)
    const { docs } = await payload.find({
      collection: 'chat-conversations',
      where: { 'members.user': { equals: me.id } } as any,
      sort: '-lastMessageAt',
      limit: 200,
      depth: 0,
      overrideAccess: true,
    })
    const roles = await rolesOf(
      payload,
      (docs as any[]).map((c) => otherMemberId(c, me.id)).filter((x): x is number => x != null),
    )
    const hidden = await Promise.all(
      (docs as any[]).map((c) =>
        hiddenForEmployee(payload, me, c, roles.get(String(otherMemberId(c, me.id)))),
      ),
    )
    const visible = (docs as any[]).filter((_, i) => !hidden[i])
    const counts = await Promise.all(visible.map((c) => unreadFor(payload, c, me.id)))
    return NextResponse.json(
      { total: counts.reduce((a, b) => a + b, 0), chats: counts.filter((n) => n > 0).length },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to count unread chats:', error)
    return NextResponse.json({ total: 0, chats: 0 }, { status: 200 })
  }
}
