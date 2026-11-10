/* ═════════════════════════════════════════════════════════════
   SERVER ONLY — shared helpers for the interview routes:
   input validation, the DTO sent to the app, overlap checks and
   syncing an interview to the manager's Google Calendar (Meet).
═════════════════════════════════════════════════════════════ */

import { isValidEmail, normalizeEmail, relId, requireAcceptedEmployee } from './Contractaccess'
import {
  GoogleCalendarError,
  cancelInterviewEvent,
  createInterviewEvent,
  updateInterviewEvent,
  type InterviewEventInput,
} from './googleCalendar'

export const FORMATS = ['video', 'phone', 'in_person'] as const
export const STATUSES = ['scheduled', 'completed', 'cancelled', 'no_show'] as const
export const RECOMMENDATIONS = ['strong_yes', 'yes', 'maybe', 'no', 'strong_no'] as const
export type Format = (typeof FORMATS)[number]

const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export class InterviewInputError extends Error {
  field: string
  constructor(field: string, message: string) {
    super(message)
    this.field = field
  }
}

function validTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/**
 * Booking fields from the request body. With `partial`, only the fields present
 * are validated and returned (used by PATCH).
 */
export function parseBooking(body: any, partial = false): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const has = (k: string) => body && Object.prototype.hasOwnProperty.call(body, k)
  const need = (k: string) => !partial || has(k)

  if (need('candidateName')) {
    const v = str(body?.candidateName, 120)
    if (!v) throw new InterviewInputError('candidateName', 'Candidate name is required.')
    out.candidateName = v
  }
  if (need('candidateEmail')) {
    const v = normalizeEmail(body?.candidateEmail)
    if (!isValidEmail(v))
      throw new InterviewInputError('candidateEmail', 'Enter a valid candidate email.')
    out.candidateEmail = v
  }
  if (need('position')) {
    const v = str(body?.position, 160)
    if (!v) throw new InterviewInputError('position', 'Position is required.')
    out.position = v
  }
  if (need('startAt')) {
    const d = new Date(body?.startAt)
    if (!body?.startAt || Number.isNaN(d.getTime()))
      throw new InterviewInputError('startAt', 'Choose a valid date and time.')
    out.startAt = d.toISOString()
  }
  if (need('durationMinutes')) {
    const n = Math.round(Number(body?.durationMinutes ?? 45))
    if (!Number.isFinite(n) || n < 5 || n > 480)
      throw new InterviewInputError('durationMinutes', 'Duration must be 5–480 minutes.')
    out.durationMinutes = n
  }
  if (need('format')) {
    const f = body?.format ?? 'video'
    if (!FORMATS.includes(f)) throw new InterviewInputError('format', 'Unknown interview format.')
    out.format = f
  }
  if (has('timeZone') || !partial) {
    const tz = str(body?.timeZone, 64) || 'Europe/Stockholm'
    out.timeZone = validTimeZone(tz) ? tz : 'Europe/Stockholm'
  }
  if (has('employeeId')) {
    const raw = body.employeeId
    if (raw === null || raw === '' || raw === undefined) out.employee = null
    else {
      const id = Number(raw)
      if (!Number.isFinite(id)) throw new InterviewInputError('employeeId', 'Unknown employee.')
      out.employee = id
    }
  }
  if (has('location')) out.location = str(body.location, 300) || null
  if (has('candidatePhone')) out.candidatePhone = str(body.candidatePhone, 40) || null
  if (has('messageToCandidate')) out.messageToCandidate = str(body.messageToCandidate, 4000) || null
  if (has('interviewerName')) out.interviewerName = str(body.interviewerName, 120) || null
  if (has('meetingLink')) {
    const v = str(body.meetingLink, 500)
    if (v && !/^https:\/\//i.test(v))
      throw new InterviewInputError('meetingLink', 'The meeting link must start with https://')
    out.meetingLink = v || null
  }

  if (body?.google && typeof body.google === 'object') {
    const g: Record<string, unknown> = {}
    if (typeof body.google.addToCalendar === 'boolean') g.addToCalendar = body.google.addToCalendar
    if (typeof body.google.sendInvite === 'boolean') g.sendInvite = body.google.sendInvite
    if (Object.keys(g).length) out.google = g
  }
  return out
}

/**
 * A linked employee must be one the manager actually manages (accepted invitation).
 * Throws InterviewInputError otherwise. No-op when no employee is linked.
 */
export async function checkLinkedEmployee(
  payload: any,
  managerId: number,
  data: Record<string, unknown>,
) {
  const id = data.employee
  if (id == null) return
  const ok = await requireAcceptedEmployee(payload, managerId, Number(id))
  if (!ok) throw new InterviewInputError('employeeId', 'You can only choose employees you manage.')
}

/** Interview notes (any status). */
export function parseNotes(body: any): Record<string, unknown> | null {
  if (!body || typeof body.notes !== 'string') return null
  return { notes: body.notes.slice(0, 50_000), notesUpdatedAt: new Date().toISOString() }
}

/** Evaluation form (any status). */
export function parseEvaluation(body: any): Record<string, unknown> | null {
  const e = body?.evaluation
  if (!e || typeof e !== 'object') return null
  const rate = (v: unknown) => Math.min(5, Math.max(0, Math.round(Number(v) || 0)))
  return {
    evaluation: {
      technicalRating: rate(e.technicalRating),
      communicationRating: rate(e.communicationRating),
      cultureFitRating: rate(e.cultureFitRating),
      overallRating: rate(e.overallRating),
      strengths: str(e.strengths, 10_000),
      weaknesses: str(e.weaknesses, 10_000),
      recommendation: RECOMMENDATIONS.includes(e.recommendation) ? e.recommendation : null,
      additionalComments: str(e.additionalComments, 10_000),
      evaluatedAt: new Date().toISOString(),
    },
  }
}

/* ─── DTO (what the app receives) ─── */
export function toInterviewDto(d: any) {
  const ev = d?.evaluation ?? {}
  const g = d?.google ?? {}
  return {
    id: String(d.id),
    status: d.status ?? 'scheduled',
    candidateName: d.candidateName ?? '',
    candidateEmail: d.candidateEmail ?? '',
    candidatePhone: d.candidatePhone ?? '',
    employeeId: relId(d.employee) != null ? String(relId(d.employee)) : '',
    position: d.position ?? '',
    interviewerName: d.interviewerName ?? '',
    startAt: d.startAt,
    endAt: d.endAt ?? null,
    durationMinutes: Number(d.durationMinutes ?? 45),
    timeZone: d.timeZone ?? 'Europe/Stockholm',
    format: d.format ?? 'video',
    location: d.location ?? '',
    meetingLink: d.meetingLink ?? null,
    messageToCandidate: d.messageToCandidate ?? '',
    cancelReason: d.cancelReason ?? '',
    completedAt: d.completedAt ?? null,
    cancelledAt: d.cancelledAt ?? null,
    rescheduledAt: d.rescheduledAt ?? null,
    previousStartAt: d.previousStartAt ?? null,
    notes: d.notes ?? '',
    notesUpdatedAt: d.notesUpdatedAt ?? null,
    evaluation: {
      technicalRating: Number(ev.technicalRating ?? 0),
      communicationRating: Number(ev.communicationRating ?? 0),
      cultureFitRating: Number(ev.cultureFitRating ?? 0),
      overallRating: Number(ev.overallRating ?? 0),
      strengths: ev.strengths ?? '',
      weaknesses: ev.weaknesses ?? '',
      recommendation: ev.recommendation ?? null,
      additionalComments: ev.additionalComments ?? '',
      evaluatedAt: ev.evaluatedAt ?? null,
    },
    google: {
      addToCalendar: g.addToCalendar !== false,
      sendInvite: g.sendInvite !== false,
      synced: !!g.eventId,
      htmlLink: g.htmlLink ?? null,
      calendarEmail: g.calendarEmail ?? null,
      syncedAt: g.syncedAt ?? null,
      syncError: g.syncError ?? null,
    },
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }
}

/** Loads an interview and checks that it belongs to this manager. */
export async function findOwnInterview(payload: any, managerId: number, id: string) {
  const doc = await payload
    .findByID({ collection: 'interviews', id, depth: 0, overrideAccess: true })
    .catch(() => null)
  if (!doc || relId(doc.manager) !== managerId) return null
  return doc
}

/** Other scheduled interviews of this manager that overlap [startAt, endAt). */
export async function findConflicts(
  payload: any,
  managerId: number,
  startAt: string,
  endAt: string,
  excludeId?: string | number,
) {
  const { docs } = await payload.find({
    collection: 'interviews',
    where: {
      and: [
        { manager: { equals: managerId } },
        { status: { equals: 'scheduled' } },
        { startAt: { less_than: endAt } },
        { endAt: { greater_than: startAt } },
        ...(excludeId != null ? [{ id: { not_equals: excludeId } }] : []),
      ],
    },
    limit: 10,
    depth: 0,
    overrideAccess: true,
  })
  return (docs as any[]).map((d) => ({
    id: String(d.id),
    candidateName: d.candidateName,
    startAt: d.startAt,
    endAt: d.endAt,
  }))
}

/**
 * Does the candidate have a VeroCV account (linked employee, or a user with the
 * candidate's email)? Then they see the interview — and changes to it — in their
 * dashboard and notification bell.
 */
export async function candidateHasAccount(payload: any, doc: any): Promise<boolean> {
  if (relId(doc?.employee) != null) return true
  const email = normalizeEmail(doc?.candidateEmail)
  if (!email) return false
  const { totalDocs } = await payload.count({
    collection: 'users',
    where: { email: { equals: email } },
    overrideAccess: true,
  })
  return totalDocs > 0
}

/** Best-effort display name of the manager (used as interviewer name). */
export async function managerDisplayName(payload: any, managerId: number): Promise<string> {
  const u: any = await payload
    .findByID({ collection: 'users', id: managerId, depth: 0, overrideAccess: true })
    .catch(() => null)
  const full = [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim()
  return (u?.name || full || u?.email || '') as string
}

/* ─── Google Calendar sync ─── */
export interface SyncOutcome {
  /** Fields to save on the interview. */
  data: Record<string, unknown>
  /** User-facing warning when Google failed (the interview itself is still saved). */
  warning: { code: string; message: string } | null
}

function eventInput(doc: any): InterviewEventInput {
  const endAt =
    doc.endAt ??
    new Date(
      new Date(doc.startAt).getTime() + Number(doc.durationMinutes ?? 45) * 60_000,
    ).toISOString()
  return {
    candidateName: doc.candidateName,
    candidateEmail: doc.candidateEmail,
    position: doc.position,
    startAt: new Date(doc.startAt).toISOString(),
    endAt: new Date(endAt).toISOString(),
    timeZone: doc.timeZone || 'Europe/Stockholm',
    format: doc.format,
    location: doc.format === 'phone' ? doc.location || doc.candidatePhone : doc.location,
    messageToCandidate: doc.messageToCandidate,
    interviewerName: doc.interviewerName,
    sendInvite: doc.google?.sendInvite !== false,
  }
}

/**
 * Brings the Google Calendar event in line with the saved interview:
 *   addToCalendar off  → removes an existing event
 *   no event yet       → creates one (with Google Meet for video interviews)
 *   event exists       → updates it (time, format, candidate…)
 * Never throws — a Google problem is returned as a warning and stored in google.syncError.
 */
export async function syncInterviewToCalendar(
  payload: any,
  managerId: number,
  doc: any,
): Promise<SyncOutcome> {
  const g = doc.google ?? {}
  const now = new Date().toISOString()
  const hadGoogleMeet =
    !!g.eventId && !!doc.meetingLink && /meet\.google\.com/i.test(doc.meetingLink)

  try {
    if (doc.status !== 'scheduled') return { data: {}, warning: null }

    if (g.addToCalendar === false) {
      if (!g.eventId) return { data: {}, warning: null }
      await cancelInterviewEvent(payload, managerId, g.eventId, g.sendInvite !== false)
      return {
        data: {
          meetingLink: hadGoogleMeet ? null : (doc.meetingLink ?? null),
          google: { ...g, eventId: null, htmlLink: null, syncedAt: now, syncError: null },
        },
        warning: null,
      }
    }

    const input = eventInput(doc)
    const result = g.eventId
      ? await updateInterviewEvent(payload, managerId, g.eventId, input, hadGoogleMeet)
      : await createInterviewEvent(payload, managerId, input)

    const meetingLink =
      doc.format === 'video'
        ? (result.meetLink ?? doc.meetingLink ?? null)
        : hadGoogleMeet
          ? null
          : (doc.meetingLink ?? null)

    return {
      data: {
        meetingLink,
        google: {
          ...g,
          eventId: result.eventId,
          htmlLink: result.htmlLink,
          calendarEmail: result.calendarEmail,
          syncedAt: now,
          syncError: null,
        },
      },
      warning: null,
    }
  } catch (error) {
    const known = error instanceof GoogleCalendarError
    const code = known ? error.code : 'google_error'
    const message = known ? error.message : 'Google Calendar could not be updated.'
    if (!known) console.error('❌ Google Calendar sync failed:', error)
    return { data: { google: { ...g, syncError: message } }, warning: { code, message } }
  }
}

/** Cancels the Google event of a cancelled / no-show interview. Never throws. */
export async function removeFromCalendar(
  payload: any,
  managerId: number,
  doc: any,
  notifyCandidate: boolean,
): Promise<SyncOutcome> {
  const g = doc.google ?? {}
  if (!g.eventId) return { data: {}, warning: null }
  try {
    await cancelInterviewEvent(payload, managerId, g.eventId, notifyCandidate)
    return {
      data: {
        google: { ...g, eventId: null, syncedAt: new Date().toISOString(), syncError: null },
      },
      warning: null,
    }
  } catch (error) {
    const message =
      error instanceof GoogleCalendarError
        ? error.message
        : 'The Google Calendar event could not be removed.'
    return {
      data: { google: { ...g, syncError: message } },
      warning: {
        code: error instanceof GoogleCalendarError ? error.code : 'google_error',
        message,
      },
    }
  }
}
