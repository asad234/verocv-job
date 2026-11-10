// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/chat/conversations/route.ts   (NEW)
// URL:            GET  /api/chat/conversations           → { data: ChatConversation[] }  (newest first)
//                 POST /api/chat/conversations { userId } → { conversation }  (opens or creates the chat)
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  canMessage,
  chatContacts,
  hiddenForEmployee,
  loadChatPeople,
  otherMemberId,
  pairKey,
  requireChatUser,
  rolesOf,
  toConversationDto,
  unreadFor,
} from '@/utils/server/chat'

const noStore = { 'Cache-Control': 'private, no-store' }

export async function GET(req: NextRequest) {
  try {
    const me = await requireChatUser(req)
    if (!me) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })
    const payload = await getPayload({ config })

    const { docs } = await payload.find({
      collection: 'chat-conversations',
      where: {
        and: [{ 'members.user': { equals: me.id } }, { 'lastMessage.body': { exists: true } }],
      } as any,
      sort: '-lastMessageAt',
      limit: 200,
      depth: 0,
      overrideAccess: true,
    })
    const withMessages = (docs as any[]).filter((c) => c.lastMessage?.body)
    const roles = await rolesOf(
      payload,
      withMessages.map((c) => otherMemberId(c, me.id)).filter((x): x is number => x != null),
    )
    // Employees don't see an admin chat until the admin has written in it.
    const hidden = await Promise.all(
      withMessages.map((c) =>
        hiddenForEmployee(payload, me, c, roles.get(String(otherMemberId(c, me.id)))),
      ),
    )
    const convs = withMessages.filter((_, i) => !hidden[i])

    const contacts = await chatContacts(payload, me)
    const otherIds = convs.map((c) => otherMemberId(c, me.id)).filter((x): x is number => x != null)
    const vias = otherIds.map((id) => contacts.get(id)?.via).filter((v): v is number => v != null)
    const [people, unread] = await Promise.all([
      loadChatPeople(payload, [...otherIds, ...vias]),
      Promise.all(convs.map((c) => unreadFor(payload, c, me.id))),
    ])

    const data = convs.map((c, i) => toConversationDto(c, me.id, people, contacts, unread[i] ?? 0))
    return NextResponse.json({ me: String(me.id), data }, { status: 200, headers: noStore })
  } catch (error) {
    console.error('❌ Failed to list chats:', error)
    return NextResponse.json({ message: 'Failed to load chats' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await requireChatUser(req)
    if (!me) return NextResponse.json({ message: 'Not authorized' }, { status: 401 })
    const body = (await req.json().catch(() => null)) as { userId?: unknown } | null
    const otherId = Number(body?.userId)
    if (!Number.isFinite(otherId) || otherId === me.id)
      return NextResponse.json({ message: 'Choose someone to chat with' }, { status: 400 })

    const payload = await getPayload({ config })
    const key = pairKey(me.id, otherId)
    const { docs } = await payload.find({
      collection: 'chat-conversations',
      where: { key: { equals: key } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    let conv: any = docs[0]

    if (!conv) {
      if (!(await canMessage(payload, me, otherId)))
        return NextResponse.json({ message: "You can't message this person" }, { status: 403 })
      const now = new Date().toISOString()
      try {
        conv = await payload.create({
          collection: 'chat-conversations',
          data: {
            key,
            members: [
              { user: me.id, lastReadAt: now },
              { user: otherId, lastReadAt: null },
            ],
            createdBy: me.id,
            lastMessageAt: now,
          } as any,
          overrideAccess: true,
        })
      } catch (e) {
        // Both people opened the chat at the same moment → the unique key won; use that one.
        const again = await payload.find({
          collection: 'chat-conversations',
          where: { key: { equals: key } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        conv = again.docs[0]
        if (!conv) throw e
      }
    }

    const contacts = await chatContacts(payload, me)
    const via = contacts.get(otherId)?.via
    const people = await loadChatPeople(payload, via != null ? [otherId, via] : [otherId])
    const unread = await unreadFor(payload, conv, me.id)
    return NextResponse.json(
      { conversation: toConversationDto(conv, me.id, people, contacts, unread) },
      { status: 200, headers: noStore },
    )
  } catch (error) {
    console.error('❌ Failed to open chat:', error)
    return NextResponse.json({ message: 'Failed to open chat' }, { status: 500 })
  }
}
