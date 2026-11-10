// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/presence.ts   (NEW — server only)
// WHAT IT DOES:   Chat status ("presence") rules, in one place:
//   • A chosen status with an end time ("until") goes back to Available after it.
//   • "Available" is only shown while the person actually has VeroCV open —
//     no sign of life for ONLINE_WINDOW → shown as Offline (+ "last seen").
//   • Busy / In a meeting / Away / Not at the office / Not available are shown
//     as chosen, open or not (that's the point: "I'm in a meeting").
//   • "Appear offline" is always shown as Offline, without a last-seen time.
// ══════════════════════════════════════════════════════════════════════

import {
  PRESENCE_MESSAGE_MAX,
  PRESENCE_STATUSES,
  type ChatPresence,
  type MyPresence,
  type PresenceStatus,
} from '@/utils/chatTypes'

export const ONLINE_WINDOW_MS = 3 * 60_000 // the chat pings every 20 s while open
const TOUCH_EVERY_MS = 60_000 // don't write lastSeenAt more often than this

const relId = (v: any) => (v == null || v === '' ? null : typeof v === 'object' ? v.id : v)

/** The status the person picked, after its end time is applied. */
export function chosenStatus(doc: any, now = Date.now()): PresenceStatus {
  const s: PresenceStatus = PRESENCE_STATUSES.includes(doc?.status) ? doc.status : 'available'
  if (s !== 'available' && doc?.until && new Date(doc.until).getTime() <= now) return 'available'
  return s
}

/** What other people see. */
export function visiblePresence(doc: any, now = Date.now()): ChatPresence {
  const chosen = chosenStatus(doc, now)
  const expired = chosen === 'available' && doc?.status && doc.status !== 'available'
  const lastSeen = doc?.lastSeenAt ? new Date(doc.lastSeenAt).getTime() : 0
  const active = lastSeen > 0 && now - lastSeen < ONLINE_WINDOW_MS

  if (chosen === 'offline')
    return { status: 'offline', message: null, until: null, lastSeenAt: null }
  if (chosen === 'available' && !active)
    return { status: 'offline', message: null, until: null, lastSeenAt: doc?.lastSeenAt ?? null }
  return {
    status: chosen,
    message: expired ? null : doc?.message || null,
    until: chosen === 'available' ? null : (doc?.until ?? null),
    lastSeenAt: null,
  }
}

export function myPresence(doc: any, now = Date.now()): MyPresence {
  const chosen = chosenStatus(doc, now)
  const expired = chosen === 'available' && doc?.status && doc.status !== 'available'
  return {
    ...visiblePresence(doc, now),
    chosen,
    message: expired ? null : doc?.message || null,
    until: chosen === 'available' ? null : (doc?.until ?? null),
  }
}

async function findDoc(payload: any, userId: number) {
  const { docs } = await payload.find({
    collection: 'user-presence',
    where: { user: { equals: userId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return (docs as any[])[0] ?? null
}

/** Presence for many people in one query (missing → never seen → Offline). */
export async function loadPresence(
  payload: any,
  ids: (number | string)[],
): Promise<Map<string, ChatPresence>> {
  const unique = [...new Set(ids.map(String).filter((s) => s && s !== 'null'))]
  const out = new Map<string, ChatPresence>()
  if (!unique.length) return out
  const docs: any[] = await payload
    .find({
      collection: 'user-presence',
      where: { user: { in: unique } },
      limit: unique.length,
      depth: 0,
      overrideAccess: true,
    })
    .then((r: any) => r.docs)
    .catch(() => [])
  const now = Date.now()
  const byUser = new Map(docs.map((d) => [String(relId(d.user)), d]))
  for (const id of unique) out.set(id, visiblePresence(byUser.get(id) ?? null, now))
  return out
}

export async function getMyPresence(payload: any, userId: number): Promise<MyPresence> {
  return myPresence(await findDoc(payload, userId))
}

/** "I'm here" — called by the chat's unread poll. Writes at most once a minute. */
export async function touchPresence(payload: any, userId: number) {
  const doc = await findDoc(payload, userId)
  const now = new Date()
  if (doc?.lastSeenAt && now.getTime() - new Date(doc.lastSeenAt).getTime() < TOUCH_EVERY_MS) return
  if (doc) {
    await payload.update({
      collection: 'user-presence',
      id: doc.id,
      data: { lastSeenAt: now.toISOString() } as any,
      overrideAccess: true,
    })
  } else {
    await payload
      .create({
        collection: 'user-presence',
        data: { user: userId, status: 'available', lastSeenAt: now.toISOString() } as any,
        overrideAccess: true,
      })
      .catch(() => null) // two tabs at once → unique user; fine
  }
}

export class PresenceInputError extends Error {}

/** Validates { status, message?, until? } from the picker. */
export function parsePresenceInput(body: any) {
  const status = body?.status
  if (!PRESENCE_STATUSES.includes(status)) throw new PresenceInputError('Choose a status')
  const message =
    typeof body?.message === 'string' ? body.message.trim().slice(0, PRESENCE_MESSAGE_MAX) : ''
  let until: string | null = null
  if (body?.until != null && body.until !== '') {
    const t = Date.parse(body.until)
    if (Number.isNaN(t)) throw new PresenceInputError('Invalid end time')
    if (t <= Date.now()) throw new PresenceInputError('The end time has already passed')
    if (t > Date.now() + 90 * 864e5)
      throw new PresenceInputError('The end time can be at most 90 days away')
    until = new Date(t).toISOString()
  }
  // "Available" / "Appear offline" don't end by themselves.
  if (status === 'available' || status === 'offline') until = null
  return { status: status as PresenceStatus, message: message || null, until }
}

export async function setMyPresence(
  payload: any,
  userId: number,
  input: ReturnType<typeof parsePresenceInput>,
) {
  const doc = await findDoc(payload, userId)
  const data = { ...input, lastSeenAt: new Date().toISOString() }
  const saved = doc
    ? await payload.update({
        collection: 'user-presence',
        id: doc.id,
        data: data as any,
        overrideAccess: true,
      })
    : await payload.create({
        collection: 'user-presence',
        data: { user: userId, ...data } as any,
        overrideAccess: true,
      })
  return myPresence(saved)
}
