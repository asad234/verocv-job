'use client'

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/adminContractsBridge.ts   (NEW — client only)
// WHAT IT DOES:   Lets the business admin use the manager's contract AND interview
//                 pages (ManagerContracts, ManagerContractEditor, ManagerContractTemplates,
//                 signing, PDFs, ManagerInterviews + booking + drawer + Google Calendar)
//                 WITHOUT changing them.
//
//   Inside the business-admin dashboard, every request those pages make to the
//   manager contract API is sent to the admin's own API instead:
//
//     /api/company/managers/employee-contracts/…  →  /api/company/admin/manager-contracts/…
//     /api/company/managers/contract-templates/…  →  /api/company/admin/contract-templates/…
//     /api/company/managers/company-logo          →  /api/company/admin/manager-contracts/company-logo
//     /api/company/managers/employees             →  /api/company/admin/manager-contracts/recipients
//                                                    (the person picker lists YOUR MANAGERS)
//     /api/company/managers/employees/:id/hr-info →  …/recipients/:id/hr-info   (pre-fill)
//     /api/company/managers/interviews/…          →  /api/company/admin/interviews/…
//     /api/company/managers/google                →  /api/company/admin/google   (status / disconnect;
//                                                    connect + callback stay shared)
//     /api/company/managers/delegations/team      →  empty (admins don't cover for anyone)
//     /api/company/managers/my-interviews         →  empty (admins aren't interviewed)
//
//   Same idea as installCoveredFetch() in coveredTeam.ts. Links (<a href> to a
//   signed PDF) are rewritten the moment they're clicked.
//   Outside /companies/company-dashboard/business-admin nothing changes.
// ══════════════════════════════════════════════════════════════════════

export const ADMIN_DASHBOARD_PATH = '/companies/company-dashboard/business-admin'

const ADMIN = '/api/company/admin/manager-contracts'
const RULES: [RegExp, string][] = [
  [/^\/api\/company\/managers\/interviews(?=$|[/?#])/, '/api/company/admin/interviews'],
  [/^\/api\/company\/managers\/google(?=$|[?#])/, '/api/company/admin/google'],
  [/^\/api\/company\/managers\/employee-contracts(?=$|[/?#])/, ADMIN],
  [
    /^\/api\/company\/managers\/contract-templates(?=$|[/?#])/,
    '/api/company/admin/contract-templates',
  ],
  [/^\/api\/company\/managers\/company-logo(?=$|[?#])/, `${ADMIN}/company-logo`],
  [
    /^\/api\/company\/managers\/employees\/([^/?#]+)\/hr-info(?=$|[?#])/,
    `${ADMIN}/recipients/$1/hr-info`,
  ],
  [/^\/api\/company\/managers\/employees(?=$|[?#])/, `${ADMIN}/recipients`],
]
// Manager-only lists the admin doesn't have: answered with an empty result.
const EMPTY: [RegExp, unknown][] = [
  [/^\/api\/company\/managers\/delegations\/team(?=$|[?#])/, { owners: [], employees: [] }],
  [/^\/api\/company\/managers\/my-interviews(?=$|[?#])/, { data: [] }],
]

const inAdminDashboard = () =>
  typeof window !== 'undefined' && window.location.pathname.startsWith(ADMIN_DASHBOARD_PATH)

/** Same-origin path of a URL (or null for other sites). */
function pathOf(url: string): string | null {
  if (url.startsWith('/')) return url
  try {
    const u = new URL(url)
    return u.origin === window.location.origin ? u.pathname + u.search + u.hash : null
  } catch {
    return null
  }
}

/** The admin URL for a manager-contract URL, or null when it isn't one. */
export function toAdminContractsUrl(url: string): string | null {
  const path = pathOf(url)
  if (!path) return null
  for (const [re, target] of RULES) if (re.test(path)) return path.replace(re, target)
  return null
}

let installed = false

/** Idempotent. Call once from the admin's contract page (module load is fine). */
export function installAdminContractsBridge() {
  if (installed || typeof window === 'undefined') return
  installed = true

  const original = window.fetch.bind(window)
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (!inAdminDashboard()) return original(input, init)
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const path = pathOf(url)
    const empty = path ? EMPTY.find(([re]) => re.test(path)) : undefined
    if (empty) {
      return Promise.resolve(
        new Response(JSON.stringify(empty[1]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }
    const target = toAdminContractsUrl(url)
    if (!target) return original(input, init)
    return input instanceof Request
      ? original(new Request(target, input), init)
      : original(target, init)
  }

  // <a href="/api/company/managers/employee-contracts/12/pdf"> → admin PDF route.
  // Rewritten on pointer-down / focus too, so middle-click and "open in new tab" work.
  const fixLink = (e: Event) => {
    if (!inAdminDashboard()) return
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
    if (!a) return
    const target = toAdminContractsUrl(a.getAttribute('href') ?? '')
    if (target) a.setAttribute('href', target)
  }
  for (const type of ['pointerdown', 'focusin', 'click'])
    document.addEventListener(type, fixLink, true)
}
