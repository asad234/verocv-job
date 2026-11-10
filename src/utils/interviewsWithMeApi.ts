'use client'

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/interviewsWithMeApi.ts   (NEW — client only)
// WHAT IT DOES:   Interviews someone (the business admin) booked WITH the logged-in
//                 manager — shown in the manager's own Interviews calendar, read-only.
//   GET /api/company/managers/my-interviews
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { emptyEvaluation, type Interview } from '@/utils/interviewsApi'

/** An interview where I am the candidate. */
export interface InterviewWithMe extends Interview {
  /** Marks the item as "booked with me" — read-only on the Interviews page. */
  withMe: { bookedBy: string; message: string; phone: string; cancelReason: string }
}

export const isWithMe = (iv: Interview): iv is InterviewWithMe => !!(iv as InterviewWithMe).withMe

/** Changes to these (new / moved / cancelled) refresh the sidebar badge. */
export const INTERVIEWS_WITH_ME_URL = '/api/company/managers/my-interviews'

export async function loadInterviewsWithMe(): Promise<InterviewWithMe[]> {
  try {
    const res = await fetch(INTERVIEWS_WITH_ME_URL, { credentials: 'include', cache: 'no-store' })
    if (!res.ok) return [] // e.g. not a manager — the page still shows your own interviews
    const body = await res.json()
    return ((body.data ?? []) as any[]).map(
      (d): InterviewWithMe => ({
        id: String(d.id),
        status: d.status,
        // The calendar shows the other person: who you meet.
        candidateName: d.interviewerName || '—',
        candidateEmail: '',
        candidatePhone: '',
        employeeId: '',
        position: d.position ?? '',
        interviewerName: d.interviewerName ?? '',
        startAt: d.startAt,
        endAt: d.endAt ?? null,
        durationMinutes: Number(d.durationMinutes ?? 45),
        timeZone: d.timeZone ?? 'Europe/Stockholm',
        format: d.format ?? 'video',
        location: d.location ?? '',
        meetingLink: d.meetingLink ?? null,
        messageToCandidate: d.message ?? '',
        cancelReason: d.cancelReason ?? '',
        completedAt: null,
        cancelledAt: d.cancelledAt ?? null,
        rescheduledAt: d.rescheduledAt ?? null,
        previousStartAt: d.previousStartAt ?? null,
        notes: '',
        notesUpdatedAt: null,
        evaluation: emptyEvaluation,
        google: {
          addToCalendar: false,
          sendInvite: false,
          synced: false,
          htmlLink: null,
          calendarEmail: null,
          syncedAt: null,
          syncError: null,
        },
        createdAt: d.createdAt ?? d.startAt,
        updatedAt: d.updatedAt ?? d.startAt,
        withMe: {
          bookedBy: d.interviewerName ?? '',
          message: d.message ?? '',
          phone: d.phone ?? '',
          cancelReason: d.cancelReason ?? '',
        },
      }),
    )
  } catch {
    return []
  }
}

/** Upcoming interviews booked with me — for the "Interviews" badge in the sidebar. */
export function useUpcomingInterviewsWithMe(): number {
  const [n, setN] = useState(0)
  useEffect(() => {
    let alive = true
    const load = () =>
      loadInterviewsWithMe().then((l) => {
        if (alive)
          setN(
            l.filter((i) => i.status === 'scheduled' && new Date(i.startAt).getTime() > Date.now())
              .length,
          )
      })
    load()
    const t = setInterval(load, 300_000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])
  return n
}
