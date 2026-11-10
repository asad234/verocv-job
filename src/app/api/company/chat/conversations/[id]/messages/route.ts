// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/chat/conversations/[id]/messages/route.ts   (NEW)
// URL:            GET  …/messages                  → newest 50  { data, hasMore, otherLastReadAt, canSend }
//                 GET  …/messages?after=<ISO>      → new since (polling)
//                 GET  …/messages?before=<ISO>     → older page ("Load earlier")
//                 POST …/messages { body }         → { message }
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { CHAT_MAX_LENGTH } from '@/utils/chatTypes'
import {
  canMessage,
  findMyConversation,
  forgetChatContacts,
  otherMemberId,
  requireChatUser,
  toMessageDto,
} from '@/utils/server/chat'

type Ctx = { params: Promise<{ id: string }> }
const PAGE = 50
const noStore = { 'Cache-Control': 'private, no-store' }
const validIso = (s: string | null) =>
  s && !Number.isNaN(Date.parse(s)) ? new Date(s).toISOString() : null

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const me = await requireChatUser(req)
    if (!me) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })
    const { id } = await params
    const payload = await getPayload({ config })
    const conv = await findMyConversation(payload, me, id)
    if (!conv) return NextResponse.json({ message: 'Chat not found' }, { status: 404 })

    const sp = req.nextUrl.searchParams
    const after = validIso(sp.get('after'))
    const before = validIso(sp.get('before'))
    const and: any[] = [{ conversation: { equals: conv.id } }]
    // greater_than_equal + client-side dedupe by id: never misses two messages in the same millisecond.
    if (after) and.push({ createdAt: { greater_than_equal: after } })
    if (before) and.push({ createdAt: { less_than: before } })

    const { docs } = await payload.find({
      collection: 'chat-messages',
      where: { and },
      sort: after ? 'createdAt' : '-createdAt',
      limit: after ? 200 : PAGE + 1,
      depth: 0,
      overrideAccess: true,
    })
    let list = docs as any[]
    let hasMore = false
    if (!after) {
      hasMore = list.length > PAGE
      list = list.slice(0, PAGE).reverse()
    }

    const otherId = otherMemberId(conv, me.id)
    const otherLastReadAt =
      (conv.members ?? []).find(
        (m: any) => Number(typeof m.user === 'object' ? m.user?.id : m.user) === otherId,
      )?.lastReadAt ?? null

    return NextResponse.json(
      {
        me: String(me.id),
        data: list.map(toMessageDto),
        hasMore,
        otherLastReadAt,
        canSend: otherId != null && (await canMessage(payload, me, otherId)),
      },
      { status: 200, headers: noStore },
    )
  } catch (error) {
    console.error('❌ Failed to load messages:', error)
    return NextResponse.json({ message: 'Failed to load messages' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const me = await requireChatUser(req)
    if (!me) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })
    const { id } = await params
    const raw = (await req.json().catch(() => null)) as { body?: unknown } | null
    const text = typeof raw?.body === 'string' ? raw.body.replace(/\r\n/g, '\n').trim() : ''
    if (!text) return NextResponse.json({ message: 'Write a message first' }, { status: 400 })
    if (text.length > CHAT_MAX_LENGTH)
      return NextResponse.json(
        { message: `Messages can be at most ${CHAT_MAX_LENGTH} characters` },
        { status: 400 },
      )

    const payload = await getPayload({ config })
    const conv = await findMyConversation(payload, me, id)
    if (!conv) return NextResponse.json({ message: 'Chat not found' }, { status: 404 })
    const otherId = otherMemberId(conv, me.id)
    if (otherId == null || !(await canMessage(payload, me, otherId)))
      return NextResponse.json(
        { message: "You can't message this person anymore", code: 'not_connected' },
        { status: 403 },
      )

    const message = await payload.create({
      collection: 'chat-messages',
      data: { conversation: conv.id, sender: me.id, body: text } as any,
      overrideAccess: true,
    })

    // The receiver's contact list may change (an admin writing first lets the employee reply).
    forgetChatContacts(otherId)

    // Newest message on the chat + the sender has obviously read everything.
    const at = (message as any).createdAt ?? new Date().toISOString()
    await payload.update({
      collection: 'chat-conversations',
      id: conv.id,
      data: {
        lastMessageAt: at,
        lastMessage: { body: text.slice(0, 280), sender: me.id },
        members: (conv.members ?? []).map((m: any) => {
          const uid = Number(typeof m.user === 'object' ? m.user?.id : m.user)
          return {
            ...(m.id ? { id: m.id } : {}),
            user: uid,
            lastReadAt: uid === me.id ? at : (m.lastReadAt ?? null),
          }
        }),
      } as any,
      overrideAccess: true,
    })

    return NextResponse.json({ message: toMessageDto(message) }, { status: 201, headers: noStore })
  } catch (error) {
    console.error('❌ Failed to send message:', error)
    return NextResponse.json({ message: 'Failed to send message' }, { status: 500 })
  }
}
