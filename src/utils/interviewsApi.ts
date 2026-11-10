'use client'

/* ═════════════════════════════════════════════════════════════
   Manager side of interviews — calls /api/company/managers/interviews/*
   and /api/company/managers/google (Google Calendar / Meet connection).
═════════════════════════════════════════════════════════════ */

export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'
export type InterviewFormat = 'video' | 'phone' | 'in_person'
export type Recommendation = 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no' | null

export interface Evaluation {
  technicalRating: number // 0 = not rated, 1–5
  communicationRating: number
  cultureFitRating: number
  overallRating: number
  strengths: string
  weaknesses: string
  recommendation: Recommendation
  additionalComments: string
  evaluatedAt?: string | null
}

export interface InterviewGoogleInfo {
  addToCalendar: boolean
  sendInvite: boolean
  /** true = the interview is in the manager's Google Calendar */
  synced: boolean
  htmlLink: string | null
  calendarEmail: string | null
  syncedAt: string | null
  syncError: string | null
}

export interface Interview {
  id: string
  status: InterviewStatus
  candidateName: string
  candidateEmail: string
  candidatePhone: string
  /** Set when the candidate is one of the manager's employees ("" otherwise). */
  employeeId: string
  position: string
  interviewerName: string
  /** ISO date-time of the start */
  startAt: string
  endAt: string | null
  durationMinutes: number
  timeZone: string
  format: InterviewFormat
  /** In-person address, or the number to call for phone interviews */
  location: string
  /** Google Meet link (or another video link) */
  meetingLink: string | null
  messageToCandidate: string
  cancelReason: string
  completedAt: string | null
  cancelledAt: string | null
  /** Set when the interview was moved to a new time */
  rescheduledAt: string | null
  previousStartAt: string | null
  notes: string
  notesUpdatedAt: string | null
  evaluation: Evaluation
  google: InterviewGoogleInfo
  createdAt: string
  updatedAt: string
}

export interface BookingInput {
  candidateName: string
  candidateEmail: string
  candidatePhone?: string
  /** One of the manager's employees, or null for a candidate typed by hand. */
  employeeId?: string | null
  position: string
  startAt: string
  durationMinutes: number
  timeZone: string
  format: InterviewFormat
  location?: string
  meetingLink?: string | null
  messageToCandidate?: string
  interviewerName?: string
  google: { addToCalendar: boolean; sendInvite: boolean }
}

export interface Conflict {
  id: string
  candidateName: string
  startAt: string
  endAt: string
}

export interface SaveResult {
  interview: Interview
  conflicts: Conflict[]
  /** Google Calendar problem — the interview itself was saved. */
  warning: { code: string; message: string } | null
  /** The candidate has a VeroCV account → they see it (and changes) in their dashboard + bell. */
  inApp?: boolean
}

export interface GoogleStatus {
  /** Server has GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET */
  configured: boolean
  connected: boolean
  email: string | null
  connectedAt: string | null
}

export const emptyEvaluation: Evaluation = {
  technicalRating: 0,
  communicationRating: 0,
  cultureFitRating: 0,
  overallRating: 0,
  strengths: '',
  weaknesses: '',
  recommendation: null,
  additionalComments: '',
}

const BASE = '/api/company/managers/interviews'
const GOOGLE = '/api/company/managers/google'

export class ApiError extends Error {
  status: number
  code?: string
  field?: string
  data?: any
  constructor(message: string, status: number, data?: any) {
    super(message)
    this.status = status
    this.code = data?.code
    this.field = data?.field
    this.data = data
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store', ...init })
  const json = await res.json().catch(() => ({}))
  if (!res.ok)
    throw new ApiError(json?.message || `Request failed (${res.status})`, res.status, json)
  return json as T
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

/* ─── Interviews ─── */
export async function listInterviews(
  params: { from?: string; to?: string; status?: InterviewStatus; q?: string } = {},
) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => !!v) as [string, string][],
  ).toString()
  const json = await request<{ data: Interview[] }>(qs ? `${BASE}?${qs}` : BASE)
  return json.data ?? []
}

export async function getInterview(id: string) {
  return (await request<{ interview: Interview }>(`${BASE}/${id}`)).interview
}

export async function bookInterview(input: BookingInput) {
  return request<SaveResult>(BASE, jsonInit('POST', input))
}

/** Reschedule / edit a scheduled interview. */
export async function updateInterview(id: string, input: Partial<BookingInput>) {
  return request<SaveResult>(`${BASE}/${id}`, jsonInit('PATCH', input))
}

export async function saveInterviewNotes(id: string, notes: string) {
  return (await request<SaveResult>(`${BASE}/${id}`, jsonInit('PATCH', { notes }))).interview
}

export async function saveInterviewEvaluation(id: string, evaluation: Evaluation) {
  return (await request<SaveResult>(`${BASE}/${id}`, jsonInit('PATCH', { evaluation }))).interview
}

export async function setInterviewStatus(
  id: string,
  status: 'completed' | 'cancelled' | 'no_show',
  opts: { reason?: string; notifyCandidate?: boolean } = {},
) {
  return request<{ interview: Interview; warning: SaveResult['warning']; inApp?: boolean }>(
    `${BASE}/${id}/status`,
    jsonInit('POST', { status, ...opts }),
  )
}

/** Add to Google Calendar / create the Google Meet link now. */
export async function syncInterviewCalendar(id: string) {
  return (await request<{ interview: Interview }>(`${BASE}/${id}/calendar`, { method: 'POST' }))
    .interview
}

export async function deleteInterview(id: string) {
  await request(`${BASE}/${id}`, { method: 'DELETE' })
}

/* ─── Google Calendar connection ─── */
export async function getGoogleStatus() {
  return request<GoogleStatus>(GOOGLE)
}

export async function disconnectGoogle() {
  return request<GoogleStatus>(GOOGLE, { method: 'DELETE' })
}

/** Full-page redirect to Google's consent screen; Google sends the manager back to `returnTo`. */
export function googleConnectUrl(returnTo: string) {
  return `${GOOGLE}/connect?returnTo=${encodeURIComponent(returnTo)}`
}
