/* ═════════════════════════════════════════════════════════════
   SERVER ONLY — Google Calendar + Google Meet for interviews.

   Each manager connects their own Google account once (OAuth).
   Booking an interview then creates an event in THEIR Google Calendar
   with a Google Meet link, and (optionally) emails the candidate a
   calendar invitation. Rescheduling updates the event; cancelling
   deletes it (Google sends the cancellation to the candidate).

   Uses plain fetch against Google's REST APIs — no extra npm package.

   ENV (.env):
     GOOGLE_CLIENT_ID=...
     GOOGLE_CLIENT_SECRET=...
     GOOGLE_CALENDAR_REDIRECT_URI=https://your-domain/api/company/managers/google/callback   (optional;
       defaults to NEXTAUTH_URL + /api/company/managers/google/callback)
     PAYLOAD_SECRET / NEXTAUTH_SECRET — used to encrypt the stored tokens and sign the OAuth state.
═════════════════════════════════════════════════════════════ */

import crypto from 'node:crypto'

export const GOOGLE_SCOPES = ['openid', 'email', 'https://www.googleapis.com/auth/calendar.events']

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke'
const EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
const CALLBACK_PATH = '/api/company/managers/google/callback'

/* ─── Errors ─── */
export class GoogleCalendarError extends Error {
  /** not_configured | not_connected | reconnect_required | google_error */
  code: string
  status: number
  constructor(code: string, message: string, status = 502) {
    super(message)
    this.code = code
    this.status = status
  }
}

/* ─── Config ─── */
export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID || ''
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
  const base = (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
  const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || `${base}${CALLBACK_PATH}`
  return { clientId, clientSecret, redirectUri, configured: !!(clientId && clientSecret) }
}

/**
 * Crypto key derived from PAYLOAD_SECRET. Returned as a KeyObject (not a Buffer) and
 * every binary value below is a plain Uint8Array or a string — newer @types/node
 * (TS 5.7+) rejects Buffer where crypto expects Uint8Array<ArrayBuffer>.
 */
function secretKey(): crypto.KeyObject {
  const secret = process.env.PAYLOAD_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new GoogleCalendarError('not_configured', 'PAYLOAD_SECRET is not set.', 500)
  const raw = crypto.createHash('sha256').update(`google-calendar:${secret}`).digest()
  return crypto.createSecretKey(new Uint8Array(raw))
}

/** base64url string → Uint8Array */
const fromB64 = (v: string) => new Uint8Array(Buffer.from(v, 'base64url'))
/** Uint8Array → base64url string */
const toB64 = (v: Uint8Array) => Buffer.from(v).toString('base64url')

/* ─── Token encryption (AES-256-GCM) — format: iv.tag.ciphertext (base64url) ─── */
export function encrypt(plain: string): string {
  const iv = new Uint8Array(crypto.randomBytes(12))
  const cipher = crypto.createCipheriv('aes-256-gcm', secretKey(), iv)
  const enc = cipher.update(plain, 'utf8', 'base64url') + cipher.final('base64url')
  const tag = toB64(new Uint8Array(cipher.getAuthTag()))
  return `${toB64(iv)}.${tag}.${enc}`
}

export function decrypt(payload: string | null | undefined): string | null {
  if (!payload) return null
  try {
    const [iv, tag, enc] = payload.split('.')
    if (!iv || !tag || !enc) return null
    const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey(), fromB64(iv))
    decipher.setAuthTag(fromB64(tag))
    return decipher.update(enc, 'base64url', 'utf8') + decipher.final('utf8')
  } catch {
    return null
  }
}

/* ─── Signed OAuth state (who started the flow + where to go back) ─── */
const STATE_MAX_AGE_MS = 15 * 60_000

const hmac = (body: string) =>
  crypto.createHmac('sha256', secretKey()).update(body).digest('base64url')

export function signState(data: { uid: number; returnTo: string }): string {
  const body = Buffer.from(
    JSON.stringify({ ...data, ts: Date.now(), n: crypto.randomBytes(8).toString('hex') }),
  ).toString('base64url')
  return `${body}.${hmac(body)}`
}

export function verifyState(state: string | null): { uid: number; returnTo: string } | null {
  if (!state) return null
  const [body, sig] = state.split('.')
  if (!body || !sig) return null
  const a = new TextEncoder().encode(sig)
  const b = new TextEncoder().encode(hmac(body))
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (typeof data.uid !== 'number' || Date.now() - Number(data.ts) > STATE_MAX_AGE_MS) return null
    return { uid: data.uid, returnTo: safeReturnTo(data.returnTo) }
  } catch {
    return null
  }
}

/** Only allow redirects back into this app (relative paths). */
export function safeReturnTo(v: unknown): string {
  return typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') ? v : '/dashboard'
}

export function buildAuthUrl(state: string): string {
  const { clientId, redirectUri } = googleConfig()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    access_type: 'offline', // → refresh token
    prompt: 'consent', // always return a refresh token, even on re-connect
    include_granted_scopes: 'true',
    state,
  })
  return `${AUTH_URL}?${params.toString()}`
}

/* ─── OAuth token exchange ─── */
interface TokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope?: string
  id_token?: string
  error?: string
  error_description?: string
}

async function postToken(params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  })
  const json = (await res.json().catch(() => ({}))) as TokenResponse
  if (!res.ok || !json.access_token) {
    if (json.error === 'invalid_grant') {
      throw new GoogleCalendarError(
        'reconnect_required',
        'Google access has expired or was revoked. Please reconnect Google Calendar.',
        409,
      )
    }
    throw new GoogleCalendarError(
      'google_error',
      json.error_description || json.error || `Google token request failed (${res.status})`,
    )
  }
  return json
}

/** The email inside Google's id_token (received directly from Google over TLS). */
function emailFromIdToken(idToken?: string): string | null {
  if (!idToken) return null
  try {
    const payload = JSON.parse(
      Buffer.from(idToken.split('.')[1] ?? '', 'base64url').toString('utf8'),
    )
    return typeof payload.email === 'string' ? payload.email : null
  } catch {
    return null
  }
}

/** Callback: code → tokens, saved (encrypted) on the manager's connection row. */
export async function saveConnectionFromCode(payload: any, userId: number, code: string) {
  const { clientId, clientSecret, redirectUri } = googleConfig()
  const tokens = await postToken({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const scopes = (tokens.scope ?? '').split(' ')
  if (!scopes.includes('https://www.googleapis.com/auth/calendar.events')) {
    throw new GoogleCalendarError(
      'missing_scope',
      'Calendar access was not granted. Please allow access to Google Calendar.',
      400,
    )
  }

  const existing = await findConnection(payload, userId)
  const refreshToken = tokens.refresh_token ?? decrypt(existing?.refreshTokenEnc)
  if (!refreshToken) {
    throw new GoogleCalendarError(
      'google_error',
      'Google did not return a refresh token. Remove VeroCV from your Google account permissions and connect again.',
      400,
    )
  }

  const data = {
    user: userId,
    googleEmail: emailFromIdToken(tokens.id_token) ?? existing?.googleEmail ?? null,
    scope: tokens.scope ?? '',
    connectedAt: new Date().toISOString(),
    refreshTokenEnc: encrypt(refreshToken),
    accessTokenEnc: encrypt(tokens.access_token),
    accessTokenExpiresAt: new Date(Date.now() + (tokens.expires_in - 60) * 1000).toISOString(),
  }

  return existing
    ? payload.update({
        collection: 'google-calendar-connections',
        id: existing.id,
        data,
        overrideAccess: true,
      })
    : payload.create({ collection: 'google-calendar-connections', data, overrideAccess: true })
}

export async function findConnection(payload: any, userId: number): Promise<any | null> {
  const { docs } = await payload.find({
    collection: 'google-calendar-connections',
    where: { user: { equals: userId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
  })
  return docs[0] ?? null
}

export async function connectionStatus(payload: any, userId: number) {
  const { configured } = googleConfig()
  const conn = configured ? await findConnection(payload, userId) : null
  return {
    configured,
    connected: !!conn?.refreshTokenEnc,
    email: (conn?.googleEmail as string | null) ?? null,
    connectedAt: (conn?.connectedAt as string | null) ?? null,
  }
}

export async function disconnect(payload: any, userId: number) {
  const conn = await findConnection(payload, userId)
  if (!conn) return
  const token = decrypt(conn.refreshTokenEnc)
  if (token) {
    await fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: 'POST' }).catch(
      () => {},
    )
  }
  await payload.delete({
    collection: 'google-calendar-connections',
    id: conn.id,
    overrideAccess: true,
  })
}

/** A valid access token for the manager (refreshed when needed). */
async function accessTokenFor(
  payload: any,
  userId: number,
): Promise<{ token: string; email: string | null }> {
  const { configured, clientId, clientSecret } = googleConfig()
  if (!configured)
    throw new GoogleCalendarError(
      'not_configured',
      'Google Calendar is not configured on the server (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).',
      503,
    )

  const conn = await findConnection(payload, userId)
  const refreshToken = decrypt(conn?.refreshTokenEnc)
  if (!conn || !refreshToken)
    throw new GoogleCalendarError(
      'not_connected',
      'Connect your Google Calendar to create Google Meet links.',
      409,
    )

  const cached = decrypt(conn.accessTokenEnc)
  if (
    cached &&
    conn.accessTokenExpiresAt &&
    new Date(conn.accessTokenExpiresAt).getTime() > Date.now()
  ) {
    return { token: cached, email: conn.googleEmail ?? null }
  }

  const tokens = await postToken({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })
  await payload.update({
    collection: 'google-calendar-connections',
    id: conn.id,
    data: {
      accessTokenEnc: encrypt(tokens.access_token),
      accessTokenExpiresAt: new Date(Date.now() + (tokens.expires_in - 60) * 1000).toISOString(),
      ...(tokens.refresh_token ? { refreshTokenEnc: encrypt(tokens.refresh_token) } : {}),
    },
    overrideAccess: true,
  })
  return { token: tokens.access_token, email: conn.googleEmail ?? null }
}

/* ─── Calendar events ─── */
export interface InterviewEventInput {
  candidateName: string
  candidateEmail: string
  position: string
  startAt: string
  endAt: string
  timeZone: string
  format: 'video' | 'phone' | 'in_person'
  location?: string | null
  messageToCandidate?: string | null
  companyName?: string | null
  interviewerName?: string | null
  /** Email the candidate a Google Calendar invitation (and updates / cancellation). */
  sendInvite: boolean
}

export interface CalendarEventResult {
  eventId: string
  htmlLink: string | null
  meetLink: string | null
  calendarEmail: string | null
}

const FORMAT_LABEL = {
  video: 'Google Meet video call',
  phone: 'Phone call',
  in_person: 'In person',
} as const

function eventBody(i: InterviewEventInput, withNewMeet: boolean) {
  const lines = [
    `Interview for the position: ${i.position}`,
    `Candidate: ${i.candidateName} (${i.candidateEmail})`,
    i.interviewerName ? `Interviewer: ${i.interviewerName}` : '',
    `Format: ${FORMAT_LABEL[i.format]}`,
    i.format === 'phone' && i.location ? `Phone: ${i.location}` : '',
    i.messageToCandidate ? `\n${i.messageToCandidate}` : '',
    '\nBooked with VeroCV.',
  ].filter(Boolean)

  return {
    summary: `Interview: ${i.candidateName} – ${i.position}${i.companyName ? ` (${i.companyName})` : ''}`,
    description: lines.join('\n'),
    start: { dateTime: i.startAt, timeZone: i.timeZone },
    end: { dateTime: i.endAt, timeZone: i.timeZone },
    location: i.format === 'in_person' ? i.location || undefined : undefined,
    attendees: [{ email: i.candidateEmail, displayName: i.candidateName }],
    guestsCanModify: false,
    reminders: { useDefault: true },
    ...(withNewMeet
      ? {
          conferenceData: {
            createRequest: {
              requestId: crypto.randomUUID(),
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        }
      : {}),
  }
}

function meetLinkOf(ev: any): string | null {
  if (typeof ev?.hangoutLink === 'string') return ev.hangoutLink
  const video = (ev?.conferenceData?.entryPoints ?? []).find(
    (e: any) => e?.entryPointType === 'video',
  )
  return typeof video?.uri === 'string' ? video.uri : null
}

async function googleFetch(token: string, url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (res.status === 204) return { res, json: null as any }
  const json: any = await res.json().catch(() => null)
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const msg = json?.error?.message || `Google Calendar request failed (${res.status})`
    if (res.status === 401)
      throw new GoogleCalendarError(
        'reconnect_required',
        'Google access has expired. Please reconnect Google Calendar.',
        409,
      )
    if (res.status === 403)
      throw new GoogleCalendarError(
        'google_error',
        `Google Calendar refused the request: ${msg}`,
        502,
      )
    throw new GoogleCalendarError('google_error', msg)
  }
  return { res, json }
}

/** The Meet link is usually ready at once; if Google says "pending", ask again briefly. */
async function waitForMeet(token: string, ev: any): Promise<any> {
  let current = ev
  for (
    let i = 0;
    i < 3 &&
    !meetLinkOf(current) &&
    current?.conferenceData?.createRequest?.status?.statusCode === 'pending';
    i++
  ) {
    await new Promise((r) => setTimeout(r, 800))
    const { json } = await googleFetch(
      token,
      `${EVENTS_URL}/${encodeURIComponent(current.id)}?conferenceDataVersion=1`,
    )
    if (json) current = json
  }
  return current
}

const toResult = (ev: any, email: string | null): CalendarEventResult => ({
  eventId: ev.id,
  htmlLink: ev.htmlLink ?? null,
  meetLink: meetLinkOf(ev),
  calendarEmail: email,
})

export async function createInterviewEvent(
  payload: any,
  userId: number,
  input: InterviewEventInput,
): Promise<CalendarEventResult> {
  const { token, email } = await accessTokenFor(payload, userId)
  const qs = `conferenceDataVersion=1&sendUpdates=${input.sendInvite ? 'all' : 'none'}`
  const { json } = await googleFetch(token, `${EVENTS_URL}?${qs}`, {
    method: 'POST',
    body: JSON.stringify(eventBody(input, input.format === 'video')),
  })
  if (!json?.id)
    throw new GoogleCalendarError('google_error', 'Google Calendar did not return an event.')
  return toResult(await waitForMeet(token, json), email)
}

/**
 * Updates an existing event (reschedule / edit). Adds a Meet link when the interview
 * became a video call, removes it when it no longer is. If the event was deleted in
 * Google Calendar, a new one is created.
 */
export async function updateInterviewEvent(
  payload: any,
  userId: number,
  eventId: string,
  input: InterviewEventInput,
  hadMeet: boolean,
): Promise<CalendarEventResult> {
  const { token, email } = await accessTokenFor(payload, userId)
  const wantsMeet = input.format === 'video'
  const body: any = eventBody(input, wantsMeet && !hadMeet)
  if (!wantsMeet && hadMeet) body.conferenceData = null

  const qs = `conferenceDataVersion=1&sendUpdates=${input.sendInvite ? 'all' : 'none'}`
  const { res, json } = await googleFetch(
    token,
    `${EVENTS_URL}/${encodeURIComponent(eventId)}?${qs}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  )
  if (res.status === 404 || res.status === 410 || json?.status === 'cancelled') {
    return createInterviewEvent(payload, userId, input)
  }
  return toResult(await waitForMeet(token, json), email)
}

/** Deletes the event; Google emails the cancellation when sendInvite is true. Missing events are fine. */
export async function cancelInterviewEvent(
  payload: any,
  userId: number,
  eventId: string,
  sendInvite: boolean,
) {
  const { token } = await accessTokenFor(payload, userId)
  await googleFetch(
    token,
    `${EVENTS_URL}/${encodeURIComponent(eventId)}?sendUpdates=${sendInvite ? 'all' : 'none'}`,
    {
      method: 'DELETE',
    },
  )
}
