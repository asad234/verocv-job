'use client'

/* ═════════════════════════════════════════════════════════════
   Employee side of interviews — GET /api/user/interviews.
   Also the "seen" bookkeeping used by the notification bell:
   a notice shows when an interview is new, moved or cancelled,
   until the employee opens it (stored per browser).
═════════════════════════════════════════════════════════════ */

export type MyInterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'
export type MyInterviewFormat = 'video' | 'phone' | 'in_person'

export interface MyInterview {
  id: string
  status: MyInterviewStatus
  position: string
  startAt: string
  endAt: string | null
  durationMinutes: number
  timeZone: string
  format: MyInterviewFormat
  /** In-person address */
  location: string
  /** Phone interviews: the number the interviewer will call */
  phone: string
  /** Google Meet (or other) link — only while scheduled */
  meetingLink: string | null
  /** Message from the interviewer */
  message: string
  interviewerName: string
  companyName: string
  /** When the employer cancelled it (cancelled interviews only) */
  cancelledAt: string | null
  /** When the employer last moved it to a new time, and the time it had before */
  rescheduledAt: string | null
  previousStartAt: string | null
  createdAt: string
  updatedAt: string
}

export async function listMyInterviews(): Promise<MyInterview[]> {
  const res = await fetch('/api/user/interviews', { credentials: 'include', cache: 'no-store' })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`)
  return json.data ?? []
}

export function interviewEnd(iv: Pick<MyInterview, 'startAt' | 'endAt' | 'durationMinutes'>) {
  return iv.endAt
    ? new Date(iv.endAt)
    : new Date(new Date(iv.startAt).getTime() + iv.durationMinutes * 60_000)
}

/* ─── Notification bookkeeping ─── */
const SEEN_KEY = 'seenInterviewNotices'

/** What the employee last saw of each interview: "<status>|<startAt>". */
function readSeen(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(window.localStorage.getItem(SEEN_KEY) || '{}') ?? {}
  } catch {
    return {}
  }
}

function writeSeen(map: Record<string, string>) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(map))
  } catch {
    /* private browsing etc. */
  }
}

const signature = (iv: MyInterview) => `${iv.status}|${new Date(iv.startAt).toISOString()}`

export type InterviewNoticeKind = 'booked' | 'moved' | 'cancelled'
export interface InterviewNotice {
  kind: InterviewNoticeKind
  interview: MyInterview
}

const NOTICE_WINDOW_MS = 14 * 24 * 60 * 60_000

/**
 * Interviews worth a bell notice, until the employee has seen their current state:
 *   booked    — a new upcoming interview
 *   moved     — the employer changed the time (shows old → new)
 *   cancelled — the employer cancelled it (cancelled in the last 14 days)
 */
export function interviewNotices(list: MyInterview[]): InterviewNotice[] {
  const seen = readSeen()
  const now = Date.now()
  const out: InterviewNotice[] = []
  for (const iv of list) {
    if (seen[iv.id] === signature(iv)) continue
    const start = new Date(iv.startAt).getTime()
    if (iv.status === 'scheduled') {
      if (start < now - 60 * 60_000) continue // already over
      const moved = !!iv.rescheduledAt && !!iv.previousStartAt
      out.push({ kind: moved ? 'moved' : 'booked', interview: iv })
    } else if (iv.status === 'cancelled') {
      const cancelledAt = iv.cancelledAt ? new Date(iv.cancelledAt).getTime() : 0
      if (now - cancelledAt > NOTICE_WINDOW_MS) continue
      out.push({ kind: 'cancelled', interview: iv })
    }
  }
  return out.sort(
    (a, b) => new Date(a.interview.startAt).getTime() - new Date(b.interview.startAt).getTime(),
  )
}

/** Marks interviews as seen (the Interviews page does this for everything it shows). */
export function markInterviewsSeen(list: MyInterview[]) {
  if (typeof window === 'undefined') return
  const seen = readSeen()
  for (const iv of list) seen[iv.id] = signature(iv)
  writeSeen(seen)
  window.dispatchEvent(new Event('veroCv:interviews-seen'))
}
