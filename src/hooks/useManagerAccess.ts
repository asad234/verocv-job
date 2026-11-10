// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/hooks/useManagerAccess.ts   (REPLACE — adds hasFullAccess)
// WHAT IT DOES:   Client: does the logged-in user have an ACCEPTED manager
//                 invitation right now? Drives the "Others" menu (Contracts +
//                 Interviews) and the guard on those pages.
//                 hasFullAccess: at least one accepted invitation with FULL access —
//                 drives Profile → Availability (managers only see availability
//                 of employees who share full access).
//
//                 Updates live — no page reload needed — when:
//                  • the user accepts an invitation (notification bell),
//                  • the user revokes a manager (Account settings),
//                  • a manager revokes their access (picked up by the bell's
//                    regular refresh, on window focus, and every 60 s).
// ══════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useState } from 'react'

const EVENT = 'veroCv:manager-access-changed'

type Access = { any: boolean; full: boolean }
type AccessState = { loading: boolean; hasAccess: boolean; hasFullAccess: boolean }
const NONE: Access = { any: false, full: false }

// Shared across every component using the hook (sidebar + page guard), so the
// invitations list is fetched once rather than per component.
let cached: Access | null = null
let inflight: Promise<Access> | null = null
const listeners = new Set<(v: Access) => void>()

function publish(v: Access) {
  cached = v
  listeners.forEach((fn) => fn(v))
}

async function fetchAccess(): Promise<Access> {
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const res = await fetch('/api/user/invitations', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) return cached ?? NONE
      const body = await res.json().catch(() => ({}))
      const list: { status?: string; accessLevel?: string }[] = body?.data ?? []
      const accepted = list.filter((inv) => inv.status === 'accepted')
      // No accessLevel on older invitations = full access.
      return {
        any: accepted.length > 0,
        full: accepted.some((inv) => !inv.accessLevel || inv.accessLevel === 'full'),
      }
    } catch {
      // Network blip: keep whatever we knew before.
      return cached ?? NONE
    } finally {
      inflight = null
    }
  })()
  const v = await inflight
  publish(v)
  return v
}

/**
 * Call after anything that may change the user's manager connections.
 * Pass the new value when you already know it (saves a request);
 * leave it out to re-check with the server.
 */
export function notifyManagerAccessChanged(hasAccess?: boolean) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(EVENT, { detail: typeof hasAccess === 'boolean' ? { hasAccess } : {} }),
  )
}

export function useManagerAccess(): AccessState {
  const [state, setState] = useState<AccessState>(() =>
    cached === null
      ? { loading: true, hasAccess: false, hasFullAccess: false }
      : { loading: false, hasAccess: cached.any, hasFullAccess: cached.full },
  )

  useEffect(() => {
    const onValue = (v: Access) =>
      setState({ loading: false, hasAccess: v.any, hasFullAccess: v.full })
    listeners.add(onValue)
    fetchAccess()

    const onChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ hasAccess?: boolean }>).detail
      // Accepting an invitation doesn't say which level → ask the server for the details.
      if (detail?.hasAccess === false) publish(NONE)
      else if (detail?.hasAccess === true) {
        publish({ any: true, full: cached?.full ?? false })
        fetchAccess()
      } else fetchAccess()
    }
    const onFocus = () => fetchAccess()
    window.addEventListener(EVENT, onChanged)
    window.addEventListener('focus', onFocus)
    const poll = setInterval(fetchAccess, 60_000)

    return () => {
      listeners.delete(onValue)
      window.removeEventListener(EVENT, onChanged)
      window.removeEventListener('focus', onFocus)
      clearInterval(poll)
    }
  }, [])

  return state
}
