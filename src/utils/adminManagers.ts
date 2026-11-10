// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/adminManagers.ts   (NEW — shared by server + client)
// WHAT IT DOES:   Types + a tiny client for the business admin's manager API:
//   GET    /api/company/admin/managers          list
//   GET    /api/company/admin/managers/:id      profile
//   PATCH  /api/company/admin/managers/:id      edit
//   DELETE /api/company/admin/managers/:id      delete (reason + typed confirmation)
// ══════════════════════════════════════════════════════════════════════

export type ManagerStatus = 'active' | 'inactive' | 'pending'

export interface ManagerRow {
  id: string
  firstName: string
  lastName: string
  name: string
  email: string // login (work) email
  phone: string
  jobTitle: string
  department: string
  accessLevel: string
  status: ManagerStatus
  employeeCount: number
  pendingInvitations: number
  createdAt: string | null
  lastSeenAt: string | null
}

export interface ManagerProfile extends ManagerRow {
  privateEmail: string
  mobilePhone: string
  homeAddress: string
  professionalBio: string
  company: string
  deptSize: string
  deptFocus: string
  managedSince: string | null
  deptGoals: string
  employees: {
    id: string
    name: string
    email: string
    acceptedAt: string | null
    accessLevel: string
  }[]
  stats: { contracts: number; upcomingInterviews: number }
}

export interface ManagerEditInput {
  firstName: string
  lastName: string
  email: string
  privateEmail: string
  phone: string
  mobilePhone: string
  jobTitle: string
  department: string
  accessLevel: string
  status: ManagerStatus
}

export const DELETE_REASONS = [
  'fired',
  'left_job',
  'contract_ended',
  'created_by_mistake',
  'other',
] as const
export type DeleteReason = (typeof DELETE_REASONS)[number]

/** What the admin must type to delete — same rule on server and client. */
export const deletePhrase = (name: string) => `delete manager ${name.trim()}`
export const phraseMatches = (typed: string, name: string) =>
  typed.trim().replace(/\s+/g, ' ').toLowerCase() ===
  deletePhrase(name).replace(/\s+/g, ' ').toLowerCase()

/* ─── Client ─── */
async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(body?.message || 'Request failed') as Error & {
      fieldErrors?: Record<string, string>
      status?: number
    }
    err.fieldErrors = body?.fieldErrors
    err.status = res.status
    throw err
  }
  return body as T
}
const opts: RequestInit = { credentials: 'include', cache: 'no-store' }
const BASE = '/api/company/admin/managers'

export const managersApi = {
  list: () =>
    fetch(BASE, opts)
      .then((r) => json<{ data: ManagerRow[] }>(r))
      .then((b) => b.data),
  get: (id: string) =>
    fetch(`${BASE}/${id}`, opts)
      .then((r) => json<{ data: ManagerProfile }>(r))
      .then((b) => b.data),
  update: (id: string, input: Partial<ManagerEditInput>) =>
    fetch(`${BASE}/${id}`, {
      ...opts,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
      .then((r) => json<{ data: ManagerProfile }>(r))
      .then((b) => b.data),
  remove: (id: string, input: { reason: DeleteReason; note?: string; confirm: string }) =>
    fetch(`${BASE}/${id}`, {
      ...opts,
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }).then((r) => json<{ ok: true }>(r)),
}
