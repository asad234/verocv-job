'use client'

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/coveredTeam.ts   (NEW — client only)
// WHAT IT DOES:   While you cover for a colleague, their employees, contracts and
//                 interviews show up on YOUR pages next to your own — tagged with
//                 `coveringFor` so the page can mark them ("Lena's team").
//
//   loadManagedEmployees()            your employees + the covered team
//   loadWithCovered(loader, kind)     any list (contracts, interviews) + the
//                                     covered colleagues' lists
//
// How the server knows which manager a request is for:
//   every request to /api/company/managers/... that concerns a covered employee,
//   contract or interview automatically gets the header `x-verocv-acting-for:
//   <colleague id>`. The server only honours it while you're covering for them
//   (checked against the database on every request — managerDelegation.ts).
//   That's why drawers, the contract editor, signing etc. need no changes.
// ══════════════════════════════════════════════════════════════════════

export const ACTING_HEADER = 'x-verocv-acting-for'

export interface CoveringFor {
  id: string
  name: string
}

export interface CoveredOwner {
  id: string
  name: string
  email: string
  delegationId: string
  endsAt: string | null
  reason: string
}

interface TeamResponse {
  owners: CoveredOwner[]
  employees: {
    employeeId: string
    employeeName: string
    employeeEmail: string
    acceptedAt: string | null
    accessLevel: string
    coveringFor: CoveringFor
  }[]
}

type Kind = 'employee' | 'contract' | 'interview'

/* ─── Which ids belong to a covered colleague ─── */
const registry = new Map<string, string>() // "employee:12" → owner id
let forcedOwner: string | null = null
let installed = false

const register = (kind: Kind, id: string, ownerId: string) => registry.set(`${kind}:${id}`, ownerId)

const PATTERNS: [Kind, RegExp][] = [
  ['employee', /\/api\/company\/managers\/employees\/([^/?#]+)/],
  ['contract', /\/api\/company\/managers\/employee-contracts\/([^/?#]+)/],
  ['interview', /\/api\/company\/managers\/interviews\/([^/?#]+)/],
]

function ownerForUrl(url: string): string | null {
  for (const [kind, re] of PATTERNS) {
    const m = url.match(re)
    if (m?.[1]) {
      const owner = registry.get(`${kind}:${decodeURIComponent(m[1])}`)
      if (owner) return owner
    }
  }
  return null
}

/** Adds the "covering for" header to manager-API requests about covered items. Idempotent. */
export function installCoveredFetch() {
  if (installed || typeof window === 'undefined') return
  installed = true
  const original = window.fetch.bind(window)
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const sameOrigin = url.startsWith('/') || url.startsWith(window.location.origin)
    if (!sameOrigin || !url.includes('/api/company/managers/')) return original(input, init)

    const owner = forcedOwner ?? ownerForUrl(url)
    if (!owner) return original(input, init)

    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    )
    headers.set(ACTING_HEADER, owner)
    return original(input, { ...init, headers })
  }
}

/** Runs `fn` as if you were `ownerId` (the request(s) it starts right away carry the header). */
export function asOwner<T>(ownerId: string, fn: () => Promise<T>): Promise<T> {
  installCoveredFetch()
  forcedOwner = ownerId
  try {
    return fn() // fetch() is called synchronously inside, so it sees forcedOwner
  } finally {
    forcedOwner = null
  }
}

/* ─── Covered team ─── */
let teamCache: { at: number; data: TeamResponse } | null = null

export async function loadCoveredTeam(force = false): Promise<TeamResponse> {
  if (!force && teamCache && Date.now() - teamCache.at < 30_000) return teamCache.data
  try {
    const res = await fetch('/api/company/managers/delegations/team', {
      credentials: 'include',
      cache: 'no-store',
    })
    if (!res.ok)
      console.warn(
        `[covering] /api/company/managers/delegations/team answered ${res.status} — is delegations/team/route.ts in place?`,
      )
    const data: TeamResponse = res.ok ? await res.json() : { owners: [], employees: [] }
    teamCache = { at: Date.now(), data }
    return data
  } catch {
    return { owners: [], employees: [] }
  }
}

/** Colleagues you're covering for right now (for the page notice). */
export async function loadCoveredOwners() {
  return (await loadCoveredTeam()).owners
}

/**
 * Your employees + the employees of colleagues you're covering for.
 * Your own come first; someone on both teams is shown once, as yours.
 */
export async function loadManagedEmployees<T extends { employeeId: string }>(): Promise<
  (T & { coveringFor?: CoveringFor })[]
> {
  installCoveredFetch()
  const [ownRes, team] = await Promise.all([
    fetch('/api/company/managers/employees', { credentials: 'include', cache: 'no-store' }),
    loadCoveredTeam(true),
  ])
  if (!ownRes.ok) throw new Error('Failed to load employees')
  const own: T[] = ((await ownRes.json()).data ?? []).map((e: T) => ({
    ...e,
    employeeId: String(e.employeeId),
  }))
  const ownIds = new Set(own.map((e) => e.employeeId))

  const covered = team.employees
    .filter((e) => !ownIds.has(e.employeeId))
    .map((e) => {
      register('employee', e.employeeId, e.coveringFor.id)
      return e as unknown as T & { coveringFor: CoveringFor }
    })
  return [...own, ...covered]
}

/**
 * Loads a list for you AND for every colleague you cover (same loader, run
 * "as" each of them), tags theirs with `coveringFor` and remembers their ids,
 * so later requests about them (open, edit, sign…) go to the right manager.
 */
export async function loadWithCovered<T>(
  loader: () => Promise<T[]>,
  kind: 'contract' | 'interview',
  getId: (item: T) => string = (item: any) => String(item.id),
): Promise<(T & { coveringFor?: CoveringFor })[]> {
  installCoveredFetch()
  const [own, team] = await Promise.all([loader(), loadCoveredTeam()])
  const mine = own as (T & { coveringFor?: CoveringFor })[]
  if (!team.owners.length) return mine

  const ownIds = new Set(own.map(getId))
  const theirs = await Promise.all(
    team.owners.map(
      (o) =>
        asOwner(o.id, loader)
          .then((items) => items.map((it) => ({ it, owner: o })))
          .catch(() => [] as { it: T; owner: CoveredOwner }[]), // their list failing must not break yours
    ),
  )
  const covered: (T & { coveringFor: CoveringFor })[] = []
  for (const { it, owner } of theirs.flat()) {
    const id = getId(it)
    if (ownIds.has(id)) continue
    ownIds.add(id)
    register(kind, id, owner.id)
    covered.push({ ...it, coveringFor: { id: owner.id, name: owner.name } })
  }
  return [...mine, ...covered]
}

/** First name for compact badges ("Lena's team"). */
export const firstName = (name: string) => name.trim().split(/\s+/)[0] || name
