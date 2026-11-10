'use client'

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/chat.ts   (NEW — client only)
// WHAT IT DOES:   Small client for /api/chat/... + useChatUnread() for badges
//                 (sidebar "Chats", header icon). One shared poll for the whole
//                 page; pauses while the tab is hidden.
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import {
  CHAT_UNREAD_EVENT,
  PRESENCE_CHANGED_EVENT,
  type ChatConversation,
  type ChatMessage,
  type ChatPerson,
  type MyPresence,
  type PresenceStatus,
} from '@/utils/chatTypes'

export * from '@/utils/chatTypes'

async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(body?.message || 'Request failed') as Error & {
      status?: number
      code?: string
    }
    err.status = res.status
    err.code = body?.code
    throw err
  }
  return body as T
}

const opts: RequestInit = { credentials: 'include', cache: 'no-store' }

export const chatApi = {
  contacts: () =>
    fetch('/api/company/chat/contacts', opts)
      .then((r) => json<{ data: ChatPerson[] }>(r))
      .then((b) => b.data),
  conversations: () =>
    fetch('/api/company/chat/conversations', opts).then((r) =>
      json<{ me: string; data: ChatConversation[] }>(r),
    ),
  open: (userId: string) =>
    fetch('/api/company/chat/conversations', {
      ...opts,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
      .then((r) => json<{ conversation: ChatConversation }>(r))
      .then((b) => b.conversation),
  messages: (id: string, q: { after?: string; before?: string } = {}) => {
    const sp = new URLSearchParams()
    if (q.after) sp.set('after', q.after)
    if (q.before) sp.set('before', q.before)
    const qs = sp.toString()
    return fetch(`/api/company/chat/conversations/${id}/messages${qs ? `?${qs}` : ''}`, opts).then(
      (r) =>
        json<{
          me: string
          data: ChatMessage[]
          hasMore: boolean
          otherLastReadAt: string | null
          canSend: boolean
        }>(r),
    )
  },
  send: (id: string, body: string) =>
    fetch(`/api/company/chat/conversations/${id}/messages`, {
      ...opts,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
      .then((r) => json<{ message: ChatMessage }>(r))
      .then((b) => b.message),
  myPresence: () =>
    fetch('/api/company/chat/presence', opts)
      .then((r) => json<{ presence: MyPresence }>(r))
      .then((b) => b.presence),
  setPresence: (input: {
    status: PresenceStatus
    message?: string | null
    until?: string | null
  }) =>
    fetch('/api/company/chat/presence', {
      ...opts,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
      .then((r) => json<{ presence: MyPresence }>(r))
      .then((b) => {
        if (typeof window !== 'undefined')
          window.dispatchEvent(new CustomEvent(PRESENCE_CHANGED_EVENT, { detail: b.presence }))
        return b.presence
      }),
  read: (id: string) =>
    fetch(`/api/company/chat/conversations/${id}/read`, { ...opts, method: 'POST' }).then((r) =>
      json<{ lastReadAt: string }>(r),
    ),
}

/** Tell every badge on the page to refresh now (after reading / sending). */
export function notifyChatUnreadChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHAT_UNREAD_EVENT))
}

/* ─── Shared unread counter ─── */
let unreadTotal = 0
let started = false
const listeners = new Set<(n: number) => void>()

async function refreshUnread() {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
  try {
    const res = await fetch('/api/company/chat/unread', opts)
    if (!res.ok) return
    const { total } = await res.json()
    if (typeof total === 'number' && total !== unreadTotal) {
      unreadTotal = total
      listeners.forEach((l) => l(total))
    }
  } catch {
    /* offline — try again next tick */
  }
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true
  refreshUnread()
  window.setInterval(refreshUnread, 20_000)
  window.addEventListener(CHAT_UNREAD_EVENT, refreshUnread)
  window.addEventListener('focus', refreshUnread)
  document.addEventListener('visibilitychange', refreshUnread)
}

/** Total unread chat messages for the logged-in person (0 while loading). */
export function useChatUnread(): number {
  const [n, setN] = useState(unreadTotal)
  useEffect(() => {
    start()
    listeners.add(setN)
    setN(unreadTotal)
    return () => {
      listeners.delete(setN)
    }
  }, [])
  return n
}
