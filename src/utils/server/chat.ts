// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/chat.ts   (NEW — server only)
// WHAT IT DOES:   Everything /api/chat/... needs:
//   • who is logged in                      requireChatUser
//   • who they may message                  chatContacts / canMessage
//       employee → their managers (accepted invitation); the company admin only
//                  after the admin has written to them first (hidden until then)
//       manager  → their employees, the managers in their company, their company
//                  admin, and the employees of a colleague they're covering for
//       admin    → the managers they created + those managers' employees
//   • names / roles / companies             loadChatPeople
//   • conversation + unread helpers         findMyConversation, unreadFor, toConversationDto
// ══════════════════════════════════════════════════════════════════════

import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { delegationState } from '@/utils/delegations'
import { companyManagerIds } from '@/utils/server/managerDelegation'
import { loadPresence } from '@/utils/server/presence'
import type {
  ChatConversation,
  ChatMessage,
  ChatPerson,
  ChatRelation,
  ChatRole,
} from '@/utils/chatTypes'

export const relId = (v: any) => (v == null || v === '' ? null : typeof v === 'object' ? v.id : v)
const num = (v: any) => Number(relId(v))

export function chatRole(roles: unknown): ChatRole | null {
  if (roles === 'client') return 'employee'
  if (roles === 'client-manager') return 'manager'
  if (roles === 'client-admin' || roles === 'admin') return 'admin'
  return null
}

export interface ChatUser {
  id: number
  role: ChatRole
}

/** The logged-in person (any role that can chat), or null. Always yourself — never a covered colleague. */
export async function requireChatUser(req: NextRequest): Promise<ChatUser | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  })
  const id = Number(token?.id)
  const role = chatRole(token?.roles)
  if (!token?.id || !Number.isFinite(id) || !role) return null
  return { id, role }
}

/* ─── Who may I message? ─────────────────────────────────────────────── */

type Contact = { relation: ChatRelation; via?: number }

// Short cache: the same person polls the chat every few seconds.
const contactCache = new Map<number, { at: number; data: Map<number, Contact> }>()
const CONTACT_TTL = 30_000

/** Clears the cache for these users (e.g. after an invitation is accepted/revoked). */
export function forgetChatContacts(...userIds: number[]) {
  for (const id of userIds) contactCache.delete(id)
}

async function acceptedInvites(payload: any, where: any) {
  const { docs } = await payload.find({
    collection: 'employee-invitations',
    where: { and: [where, { status: { equals: 'accepted' } }] },
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  return docs as any[]
}

/** True when `adminId` has sent at least one message in their chat with `employeeId`. */
export async function adminHasWrittenTo(
  payload: any,
  adminId: number,
  employeeId: number,
): Promise<boolean> {
  const { docs } = await payload.find({
    collection: 'chat-conversations',
    where: { key: { equals: pairKey(adminId, employeeId) } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const conv = (docs as any[])[0]
  if (!conv) return false
  const { totalDocs } = await payload.count({
    collection: 'chat-messages',
    where: { and: [{ conversation: { equals: conv.id } }, { sender: { equals: adminId } }] },
    overrideAccess: true,
  })
  return (totalDocs ?? 0) > 0
}

async function computeContacts(payload: any, me: ChatUser): Promise<Map<number, Contact>> {
  const out = new Map<number, Contact>()
  const add = (id: number, c: Contact) => {
    if (Number.isFinite(id) && id !== me.id && !out.has(id)) out.set(id, c)
  }

  if (me.role === 'employee') {
    // Employees chat with their managers. The company admin is hidden — until
    // the admin writes to this employee first; then they can reply.
    const managerIds = (await acceptedInvites(payload, { employee: { equals: me.id } })).map((i) =>
      num(i.manager),
    )
    managerIds.forEach((id) => add(id, { relation: 'manager' }))
    if (managerIds.length) {
      const { docs } = await payload.find({
        collection: 'users',
        where: { id: { in: managerIds } },
        pagination: false,
        depth: 0,
        overrideAccess: true,
      })
      const adminIds = [
        ...new Set(
          (docs as any[])
            .map((m) => relId(m.createdBy))
            .filter((v) => v != null)
            .map(Number),
        ),
      ]
      for (const adminId of adminIds) {
        if (await adminHasWrittenTo(payload, adminId, me.id)) add(adminId, { relation: 'admin' })
      }
    }
    return out
  }

  if (me.role === 'manager') {
    ;(await acceptedInvites(payload, { manager: { equals: me.id } })).forEach((i) =>
      add(num(i.employee), { relation: 'employee' }),
    )

    const self: any = await payload.findByID({
      collection: 'users',
      id: me.id,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    })
    if (relId(self?.createdBy) != null) add(num(self.createdBy), { relation: 'admin' })

    const { ids } = await companyManagerIds(payload, me.id).catch(() => ({ ids: [] as number[] }))
    ids.forEach((id) => add(id, { relation: 'colleague' }))

    // Covering for a colleague → their employees too.
    const { docs: delegations } = await payload.find({
      collection: 'manager-delegations',
      where: { and: [{ delegate: { equals: me.id } }, { status: { equals: 'accepted' } }] },
      limit: 50,
      depth: 0,
      overrideAccess: true,
    })
    const owners = (delegations as any[])
      .filter((d) => delegationState(d) === 'active')
      .map((d) => num(d.owner))
    if (owners.length) {
      for (const i of await acceptedInvites(payload, { manager: { in: owners } }))
        add(num(i.employee), { relation: 'covering', via: num(i.manager) })
    }
    return out
  }

  // admin: the managers they created + those managers' employees.
  const { docs: managers } = await payload.find({
    collection: 'users',
    where: { and: [{ roles: { equals: 'client-manager' } }, { createdBy: { equals: me.id } }] },
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  const managerIds = (managers as any[]).map((m) => Number(m.id))
  managerIds.forEach((id) => add(id, { relation: 'team_manager' }))
  if (managerIds.length) {
    for (const i of await acceptedInvites(payload, { manager: { in: managerIds } }))
      add(num(i.employee), { relation: 'team_employee', via: num(i.manager) })
  }
  return out
}

export async function chatContacts(
  payload: any,
  me: ChatUser,
  fresh = false,
): Promise<Map<number, Contact>> {
  const hit = contactCache.get(me.id)
  if (!fresh && hit && Date.now() - hit.at < CONTACT_TTL) return hit.data
  const data = await computeContacts(payload, me)
  contactCache.set(me.id, { at: Date.now(), data })
  return data
}

export async function canMessage(payload: any, me: ChatUser, otherId: number): Promise<boolean> {
  if ((await chatContacts(payload, me)).has(otherId)) return true
  // Maybe the connection is brand new — check once more without the cache.
  return (await chatContacts(payload, me, true)).has(otherId)
}

/**
 * An employee doesn't see a chat with the company admin until the admin has
 * written in it. (Employees can't write first, so any message there is the admin's
 * — but we check the sender anyway.)
 */
export async function hiddenForEmployee(
  payload: any,
  me: ChatUser,
  conv: any,
  otherRole: ChatRole | undefined,
) {
  if (me.role !== 'employee' || otherRole !== 'admin') return false
  const otherId = otherMemberId(conv, me.id)
  return otherId == null || !(await adminHasWrittenTo(payload, otherId, me.id))
}

/** Role of each user id (for filtering chat lists). */
export async function rolesOf(
  payload: any,
  ids: (number | string)[],
): Promise<Map<string, ChatRole>> {
  const unique = [...new Set(ids.map(String).filter(Boolean))]
  const out = new Map<string, ChatRole>()
  if (!unique.length) return out
  const { docs } = await payload.find({
    collection: 'users',
    where: { id: { in: unique } },
    limit: unique.length,
    depth: 0,
    overrideAccess: true,
  })
  for (const u of docs as any[]) {
    const r = chatRole(u.roles)
    if (r) out.set(String(u.id), r)
  }
  return out
}

/* ─── Names, roles, companies ────────────────────────────────────────── */

export async function loadChatPeople(
  payload: any,
  ids: (number | string)[],
): Promise<Map<string, ChatPerson>> {
  const unique = [...new Set(ids.map(String).filter((s) => s && s !== 'null'))]
  const out = new Map<string, ChatPerson>()
  if (!unique.length) return out

  const find = (collection: string, where: any) =>
    payload
      .find({ collection, where, limit: unique.length * 2, depth: 0, overrideAccess: true })
      .then((r: any) => r.docs as any[])
      .catch(() => [] as any[])

  const [users, managerInfo, personal, adminInfo, presence] = await Promise.all([
    find('users', { id: { in: unique } }),
    find('manager-info', { user: { in: unique } }),
    find('personal-information', { user: { in: unique } }),
    find('business-admin-info', { user: { in: unique } }),
    loadPresence(payload, unique).catch(() => new Map()),
  ])
  const byUser = (docs: any[]) => new Map(docs.map((d) => [String(relId(d.user)), d]))
  const mi = byUser(managerInfo)
  const pi = byUser(personal)
  const ai = byUser(adminInfo)

  for (const u of users) {
    const id = String(u.id)
    const role = chatRole(u.roles) ?? 'employee'
    const info = role === 'manager' ? mi.get(id) : role === 'admin' ? ai.get(id) : pi.get(id)
    const infoName = [info?.firstName, info?.lastName].filter(Boolean).join(' ').trim()
    out.set(id, {
      id,
      name: infoName || u.name || u.email || '—',
      email: u.email ?? '',
      role,
      jobTitle:
        (role === 'manager'
          ? info?.jobTitle
          : role === 'employee'
            ? info?.title
            : info?.jobTitle) || undefined,
      company:
        (role === 'manager'
          ? info?.department?.companyName
          : role === 'admin'
            ? info?.company?.companyName
            : undefined) || undefined,
      presence: presence.get(id) ?? { status: 'offline' },
    })
  }
  return out
}

/* ─── Conversations ──────────────────────────────────────────────────── */

export const pairKey = (a: number, b: number) => `dm:${Math.min(a, b)}:${Math.max(a, b)}`

export const isMember = (conv: any, userId: number) =>
  Array.isArray(conv?.members) && conv.members.some((m: any) => num(m.user) === userId)

/** The conversation, only if `me` is in it. */
export async function findMyConversation(payload: any, me: ChatUser, id: string) {
  const conv = await payload
    .findByID({
      collection: 'chat-conversations',
      id,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    })
    .catch(() => null)
  if (!conv || !isMember(conv, me.id)) return null
  const otherId = otherMemberId(conv, me.id)
  if (
    otherId != null &&
    (await hiddenForEmployee(
      payload,
      me,
      conv,
      (await rolesOf(payload, [otherId])).get(String(otherId)),
    ))
  )
    return null
  return conv
}

export const otherMemberId = (conv: any, meId: number): number | null => {
  const m = (conv?.members ?? []).find((x: any) => num(x.user) !== meId)
  return m ? num(m.user) : null
}

const lastReadOf = (conv: any, userId: number): string | null =>
  (conv?.members ?? []).find((m: any) => num(m.user) === userId)?.lastReadAt ?? null

/** Messages from the other person newer than my last read. Only queries when something can be unread. */
export async function unreadFor(payload: any, conv: any, meId: number): Promise<number> {
  const lastAt = conv.lastMessageAt
  if (!lastAt || !conv.lastMessage?.body) return 0
  // (Sending a message also marks the chat read for the sender.)
  const readAt = lastReadOf(conv, meId)
  if (readAt && new Date(readAt).getTime() >= new Date(lastAt).getTime()) return 0
  const where: any = {
    and: [{ conversation: { equals: conv.id } }, { sender: { not_equals: meId } }],
  }
  if (readAt) where.and.push({ createdAt: { greater_than: readAt } })
  const { totalDocs } = await payload.count({
    collection: 'chat-messages',
    where,
    overrideAccess: true,
  })
  return totalDocs ?? 0
}

export function toMessageDto(m: any): ChatMessage {
  return {
    id: String(m.id),
    conversationId: String(relId(m.conversation)),
    senderId: String(relId(m.sender)),
    body: String(m.body ?? ''),
    createdAt: m.createdAt,
  }
}

export function toConversationDto(
  conv: any,
  meId: number,
  people: Map<string, ChatPerson>,
  contacts: Map<number, Contact>,
  unread: number,
): ChatConversation {
  const otherId = otherMemberId(conv, meId)
  const contact = otherId != null ? contacts.get(otherId) : undefined
  const base = people.get(String(otherId)) ?? {
    id: String(otherId),
    name: '—',
    email: '',
    role: 'employee' as ChatRole,
  }
  return {
    id: String(conv.id),
    other: {
      ...base,
      relation: contact?.relation,
      via: contact?.via != null ? people.get(String(contact.via))?.name : undefined,
    },
    lastMessage: conv.lastMessage?.body
      ? {
          body: conv.lastMessage.body,
          senderId:
            relId(conv.lastMessage.sender) != null ? String(relId(conv.lastMessage.sender)) : null,
          at: conv.lastMessageAt,
        }
      : null,
    unread,
    otherLastReadAt: otherId != null ? lastReadOf(conv, otherId) : null,
    canSend: otherId != null && !!contact,
  }
}

/** Sets my lastReadAt to now (keeps the other member untouched). */
export async function markRead(
  payload: any,
  conv: any,
  meId: number,
  at = new Date().toISOString(),
) {
  const members = (conv.members ?? []).map((m: any) => ({
    ...(m.id ? { id: m.id } : {}),
    user: num(m.user),
    lastReadAt: num(m.user) === meId ? at : (m.lastReadAt ?? null),
  }))
  return payload.update({
    collection: 'chat-conversations',
    id: conv.id,
    data: { members } as any,
    overrideAccess: true,
  })
}
