'use client'
// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/myAvailabilityApi.ts   (REPLACE — adds employees + team)
// WHAT IT DOES:   Browser calls for availability + days off:
//   • managerAvailabilityApi / employeeAvailabilityApi — my own week, status, days off
//   • teamAvailabilityApi    — a manager's employees (grid + requests to answer)
//   • adminAvailabilityApi   — the business admin's "Manager availability" page
//   • useMyTimeOffUpdates()  — sidebar badge: answers from the admin not seen yet
//   • timeOffDecisions()     — the manager bell's "request approved / declined" notices
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import type {
  DayCell,
  HalfDay,
  ManagerAvailabilityRow,
  ManualStatus,
  MyAvailability,
  TeamAvailabilityRow,
  TimeOffRequest,
  TimeOffType,
  WeekDay,
} from '@/utils/managerAvailability'
import { REPORTED_TYPES } from '@/utils/managerAvailability'

/** Fired after anything changes (save, request, cancel, decision) — badges and bells refresh. */
export const TIME_OFF_CHANGED_EVENT = 'verocv:time-off-changed'
const SEEN_KEY = 'mgrTimeOffSeenAt'
const WINDOW_MS = 14 * 24 * 60 * 60 * 1000

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public field?: string,
  ) {
    super(message)
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: 'no-store',
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(body?.message || 'Something went wrong', res.status, body?.field)
  return body as T
}

const changed = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(TIME_OFF_CHANGED_EVENT))
}

/* ─────────────── Manager ─────────────── */

export interface NewTimeOff {
  type: TimeOffType
  startDate: string
  endDate: string
  halfDay?: HalfDay
  note?: string
}

/** My own availability — the same API for managers and employees, only the base differs. */
export function makeSelfAvailabilityApi(base: string) {
  return {
    get: () => call<{ data: MyAvailability; days: DayCell[] }>(`${base}/availability`),
    save: async (
      patch: Partial<{
        weekly: WeekDay[]
        status: ManualStatus
        statusNote: string
        statusUntil: string
      }>,
    ) => {
      const r = await call<{ data: MyAvailability; days: DayCell[] }>(`${base}/availability`, {
        method: 'PUT',
        body: JSON.stringify(patch),
      })
      changed()
      return r
    },
    requests: () => call<{ data: TimeOffRequest[] }>(`${base}/time-off`).then((r) => r.data),
    request: async (input: NewTimeOff) => {
      const r = await call<{ data: TimeOffRequest }>(`${base}/time-off`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
      changed()
      return r.data
    },
    cancel: async (id: string) => {
      const r = await call<{ data: TimeOffRequest }>(`${base}/time-off/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'cancel' }),
      })
      changed()
      return r.data
    },
  }
}
export type SelfAvailabilityApi = ReturnType<typeof makeSelfAvailabilityApi>

export const managerAvailabilityApi = makeSelfAvailabilityApi('/api/company/managers')
/** Employees (role "client"): /api/user/availability · /api/user/time-off */
export const employeeAvailabilityApi = makeSelfAvailabilityApi('/api/user')

/* ─────────────── Manager → their employees ─────────────── */

export interface TeamGrid {
  data: TeamAvailabilityRow[]
  from: string
  to: string
  today: string
  pendingRequests: number
  /** Employees connected with CV-only / portfolio-only access (availability not shared) */
  hidden: number
}
export type TeamTimeOffRequest = TimeOffRequest & { coveringFor?: { id: string; name: string } }

export const teamAvailabilityApi = {
  grid: (from?: string, days = 7) =>
    call<TeamGrid>(
      `/api/company/managers/team-availability?days=${days}${from ? `&from=${from}` : ''}`,
    ),
  requests: (status: 'pending' | 'approved' | 'declined' | 'cancelled' | 'all' = 'all') =>
    call<{ data: TeamTimeOffRequest[] }>(
      `/api/company/managers/team-time-off?status=${status}`,
    ).then((r) => r.data),
  decide: async (id: string, action: 'approve' | 'decline', note = '') => {
    const r = await call<{ data: TimeOffRequest }>(`/api/company/managers/team-time-off/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, note }),
    })
    changed()
    return r.data
  },
}

/** Manager sidebar badge: employees' days-off requests waiting for an answer. */
export function usePendingTeamTimeOff(): number {
  const [n, setN] = useState(0)
  useEffect(() => {
    let alive = true
    const load = () =>
      teamAvailabilityApi
        .requests('pending')
        .then((l) => alive && setN(l.length))
        .catch(() => {})
    load()
    window.addEventListener(TIME_OFF_CHANGED_EVENT, load)
    window.addEventListener('focus', load)
    const t = setInterval(load, 60_000)
    return () => {
      alive = false
      window.removeEventListener(TIME_OFF_CHANGED_EVENT, load)
      window.removeEventListener('focus', load)
      clearInterval(t)
    }
  }, [])
  return n
}

/* ─────────────── Business admin ─────────────── */

export interface AvailabilityGrid {
  data: ManagerAvailabilityRow[]
  from: string
  to: string
  today: string
  pendingRequests: number
}

export const adminAvailabilityApi = {
  grid: (from?: string, days = 7) =>
    call<AvailabilityGrid>(
      `/api/company/admin/availability?days=${days}${from ? `&from=${from}` : ''}`,
    ),
  requests: (status: 'pending' | 'approved' | 'declined' | 'cancelled' | 'all' = 'all') =>
    call<{ data: TimeOffRequest[] }>(`/api/company/admin/time-off?status=${status}`).then(
      (r) => r.data,
    ),
  decide: async (id: string, action: 'approve' | 'decline', note = '') => {
    const r = await call<{ data: TimeOffRequest }>(`/api/company/admin/time-off/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, note }),
    })
    changed()
    return r.data
  },
}

/* ─────────────── "Answered by the admin" (badge + bell) ─────────────── */

/** Requests the admin approved / declined in the last 14 days (sick / VAB aren't answers). */
export function timeOffDecisions(list: TimeOffRequest[]): TimeOffRequest[] {
  const now = Date.now()
  return list
    .filter(
      (r) =>
        (r.status === 'approved' || r.status === 'declined') &&
        !REPORTED_TYPES.includes(r.type) &&
        !!r.decidedAt &&
        now - new Date(r.decidedAt).getTime() < WINDOW_MS,
    )
    .sort((a, b) => String(b.decidedAt).localeCompare(String(a.decidedAt)))
}

function seenAt(): string {
  try {
    return window.localStorage.getItem(SEEN_KEY) ?? ''
  } catch {
    return ''
  }
}
/** Called by My availability when it opens — the sidebar badge clears. */
export function markTimeOffSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, new Date().toISOString())
  } catch {
    /* private browsing */
  }
  changed()
}

/** Sidebar badge: answers the manager hasn't looked at yet. */
export function useMyTimeOffUpdates(): number {
  const [n, setN] = useState(0)
  useEffect(() => {
    let alive = true
    const load = () =>
      managerAvailabilityApi
        .requests()
        .then((l) => {
          const seen = seenAt()
          if (alive) setN(timeOffDecisions(l).filter((r) => String(r.decidedAt) > seen).length)
        })
        .catch(() => {})
    load()
    window.addEventListener(TIME_OFF_CHANGED_EVENT, load)
    const t = setInterval(load, 120_000)
    return () => {
      alive = false
      window.removeEventListener(TIME_OFF_CHANGED_EVENT, load)
      clearInterval(t)
    }
  }, [])
  return n
}

/** Business admin sidebar badge: days-off requests waiting for an answer. */
export function usePendingTimeOffRequests(): number {
  const [n, setN] = useState(0)
  useEffect(() => {
    let alive = true
    const load = () =>
      adminAvailabilityApi
        .requests('pending')
        .then((l) => alive && setN(l.length))
        .catch(() => {})
    load()
    window.addEventListener(TIME_OFF_CHANGED_EVENT, load)
    window.addEventListener('focus', load)
    const t = setInterval(load, 60_000)
    return () => {
      alive = false
      window.removeEventListener(TIME_OFF_CHANGED_EVENT, load)
      window.removeEventListener('focus', load)
      clearInterval(t)
    }
  }, [])
  return n
}

/* ─────────────── Employee: answers from the manager (for the employee's bell) ─────────────── */

const EMP_DISMISSED_KEY = 'empDismissedTimeOffAnswers'
const empDismissed = (): string[] => {
  try {
    return JSON.parse(window.localStorage.getItem(EMP_DISMISSED_KEY) ?? '[]')
  } catch {
    return []
  }
}

/**
 * The employee's days-off requests their manager approved / declined in the last 14 days
 * (sick / VAB aren't answers). `dismiss` hides one in this browser.
 * Refreshes every 2 minutes, on focus and right after a request changes.
 */
export function useEmployeeTimeOffAnswers() {
  const [answers, setAnswers] = useState<TimeOffRequest[]>([])
  useEffect(() => {
    let alive = true
    const load = () =>
      employeeAvailabilityApi
        .requests()
        .then((l) => {
          const hidden = empDismissed()
          if (alive)
            setAnswers(timeOffDecisions(l).filter((r) => !hidden.includes(`${r.id}:${r.status}`)))
        })
        .catch(() => {})
    load()
    window.addEventListener(TIME_OFF_CHANGED_EVENT, load)
    window.addEventListener('focus', load)
    const t = setInterval(load, 120_000)
    return () => {
      alive = false
      window.removeEventListener(TIME_OFF_CHANGED_EVENT, load)
      window.removeEventListener('focus', load)
      clearInterval(t)
    }
  }, [])
  const dismiss = (r: TimeOffRequest) => {
    try {
      window.localStorage.setItem(
        EMP_DISMISSED_KEY,
        JSON.stringify([...empDismissed(), `${r.id}:${r.status}`].slice(-200)),
      )
    } catch {
      /* private mode */
    }
    setAnswers((prev) => prev.filter((x) => x.id !== r.id))
  }
  return { answers, dismiss }
}
