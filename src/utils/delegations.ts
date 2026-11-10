// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/delegations.ts   (NEW — shared by client + server)
// WHAT IT DOES:   Types, labels and the client API for substitute managers
//                 ("delegations"): a manager hands their work to a colleague
//                 while they're away.
// ══════════════════════════════════════════════════════════════════════

export type DelegationStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'ended'
/** What the UI shows — accepted delegations are "scheduled", "active" or "expired" by date. */
export type DelegationState =
  | 'pending'
  | 'scheduled'
  | 'active'
  | 'expired'
  | 'declined'
  | 'cancelled'
  | 'ended'
export type DelegationReason = 'sick' | 'vacation' | 'parental' | 'travel' | 'other'

export const DELEGATION_REASONS: DelegationReason[] = [
  'sick',
  'vacation',
  'parental',
  'travel',
  'other',
]

export interface DelegationPerson {
  id: string
  name: string
  email: string
  jobTitle?: string
}

export interface Delegation {
  id: string
  status: DelegationStatus
  state: DelegationState
  reason: DelegationReason
  message: string
  startsAt: string | null
  endsAt: string | null
  createdAt: string
  respondedAt: string | null
  endedAt: string | null
  endedBy: 'owner' | 'delegate' | null
  owner: DelegationPerson
  delegate: DelegationPerson
}

export interface DelegationOverview {
  /** The logged-in manager's user id. */
  me: string
  /** I'm away: the substitute I've asked (pending / accepted, not finished). */
  outgoing: Delegation | null
  /** Colleagues who asked me to cover — pending or accepted and not finished. */
  incoming: Delegation[]
  /** Finished ones (last 20), both directions. */
  history: Delegation[]
}

export interface ActingState {
  /** The manager whose workspace I'm in, or null when I'm in my own. */
  actingAs: DelegationPerson | null
  /** Workspaces I may switch into right now. */
  available: DelegationPerson[]
}

/** Computes the display state of a delegation at time `now`. */
export function delegationState(
  d: { status: string; startsAt?: string | null; endsAt?: string | null },
  now = Date.now(),
): DelegationState {
  const ended = !!d.endsAt && new Date(d.endsAt).getTime() <= now
  if (d.status === 'pending') return ended ? 'expired' : 'pending'
  if (d.status === 'accepted') {
    if (ended) return 'expired'
    if (d.startsAt && new Date(d.startsAt).getTime() > now) return 'scheduled'
    return 'active'
  }
  return d.status as DelegationState
}

export const isOpenState = (s: DelegationState) =>
  s === 'pending' || s === 'scheduled' || s === 'active'

/* ─── Labels ─── */
type L = { en: string; sv: string }
export const REASON_LABELS: Record<DelegationReason, L & { icon: string }> = {
  sick: { en: 'Sick leave', sv: 'Sjukskriven', icon: 'tabler:thermometer' },
  vacation: { en: 'Vacation', sv: 'Semester', icon: 'tabler:beach' },
  parental: { en: 'Parental leave', sv: 'Föräldraledig', icon: 'tabler:baby-carriage' },
  travel: { en: 'Business travel', sv: 'Tjänsteresa', icon: 'tabler:plane' },
  other: { en: 'Other', sv: 'Annat', icon: 'tabler:calendar-off' },
}
export const STATE_LABELS: Record<
  DelegationState,
  L & { tone: 'amber' | 'blue' | 'green' | 'gray' | 'red' }
> = {
  pending: { en: 'Waiting for answer', sv: 'Väntar på svar', tone: 'amber' },
  scheduled: { en: 'Accepted — starts later', sv: 'Accepterad — börjar senare', tone: 'blue' },
  active: { en: 'Active', sv: 'Aktiv', tone: 'green' },
  expired: { en: 'Period ended', sv: 'Perioden slut', tone: 'gray' },
  declined: { en: 'Declined', sv: 'Avböjd', tone: 'red' },
  cancelled: { en: 'Cancelled', sv: 'Avbruten', tone: 'gray' },
  ended: { en: 'Ended', sv: 'Avslutad', tone: 'gray' },
}

export function formatPeriod(d: Pick<Delegation, 'startsAt' | 'endsAt'>, lang: 'en' | 'sv') {
  const loc = lang === 'sv' ? 'sv-SE' : 'en-GB'
  const f = (v: string) =>
    new Date(v).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })
  if (d.startsAt && d.endsAt) return `${f(d.startsAt)} – ${f(d.endsAt)}`
  if (d.endsAt) return lang === 'sv' ? `Till ${f(d.endsAt)}` : `Until ${f(d.endsAt)}`
  if (d.startsAt)
    return lang === 'sv'
      ? `Från ${f(d.startsAt)}, tills vidare`
      : `From ${f(d.startsAt)}, until ended`
  return lang === 'sv' ? 'Från nu, tills vidare' : 'From now, until ended'
}

/* ─── Client API ─── */
/** Fired after any delegation change so the bell, settings and switcher refresh. */
export const DELEGATIONS_CHANGED_EVENT = 'verocv:delegations-changed'
export const notifyDelegationsChanged = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(DELEGATIONS_CHANGED_EVENT))
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`)
  return json as T
}

const BASE = '/api/company/managers/delegations'

export const getDelegations = () => request<DelegationOverview>(BASE)

export interface CandidateResult {
  data: DelegationPerson[]
  /** Managers in your company in total (before the search filter). */
  total: number
  /** Why the list is empty: your account isn't linked to a company / no other managers. */
  reason: 'no_company' | 'no_managers' | null
}

export const searchDelegateCandidates = (q: string) =>
  request<CandidateResult>(`${BASE}/candidates?q=${encodeURIComponent(q)}`)

export async function createDelegation(input: {
  delegateId: string
  reason: DelegationReason
  message?: string
  startsAt?: string | null
  endsAt?: string | null
}) {
  const r = await request<{ data: Delegation }>(BASE, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  notifyDelegationsChanged()
  return r.data
}

export async function respondDelegation(
  id: string,
  action: 'accept' | 'decline' | 'cancel' | 'end',
) {
  const r = await request<{ data: Delegation }>(`${BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  })
  notifyDelegationsChanged()
  return r.data
}

export const getActing = () => request<ActingState>(`${BASE}/acting`)

/** Switches workspace (ownerId) or back to your own (null), then reloads the dashboard. */
export async function switchWorkspace(ownerId: string | null, { reload = true } = {}) {
  await request<ActingState>(`${BASE}/acting`, {
    method: 'POST',
    body: JSON.stringify({ ownerId }),
  })
  notifyDelegationsChanged()
  if (reload && typeof window !== 'undefined') window.location.reload()
}

/* ─── Handover: everything the substitute takes over ─── */
export interface HandoverEmployee {
  id: string
  name: string
  email: string
  accessLevel: 'full' | 'cv_only' | 'portfolio_only'
  acceptedAt: string | null
  title: string
  contact: {
    phone: string
    workPhone: string
    privateEmail: string
    workEmail: string
    address: string
    linkedIn: string
  } | null
  emergencyContact: { name: string; relationship: string; phone: string; email: string } | null
  employment: import('./employmentDetails').EmploymentDetailsData | null
  contracts:
    | {
        id: string
        title: string
        status: string
        contractType: string
        startDate: string | null
        endDate: string | null
        signedAt: string | null
        managerSignedAt: string | null
      }[]
    | null
  interviews:
    | {
        id: string
        position: string
        startAt: string
        status: string
        format: string
        upcoming: boolean
      }[]
    | null
  cvs: { id: string; name: string; updatedAt: string }[] | null
  portfolio: { id: string; title: string; type: string }[] | null
  coverLetters: { id: string; jobTitle: string; companyName: string; createdAt: string }[] | null
}

export interface Handover {
  delegation: Delegation
  employees: HandoverEmployee[]
  otherInterviews: {
    id: string
    candidateName: string
    position: string
    startAt: string
    format: string
  }[]
  /** false = that kind of data isn't stored in a collection the handover could find. */
  sections: { cvs: boolean; portfolio: boolean; coverLetters: boolean }
  generatedAt: string
}

export const getHandover = (delegationId: string) =>
  request<Handover>(`${BASE}/${delegationId}/handover`)
