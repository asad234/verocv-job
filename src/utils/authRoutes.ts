// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/authRoutes.ts   (NEW)
// WHAT IT DOES:   Which dashboard belongs to which role. Used by:
//                   • src/middleware.ts — blocks dashboards when you're not logged in
//                     (or not allowed), BEFORE the page loads
//                   • the sign-in forms — where to go after logging in
//                 No imports → safe to use in middleware (Edge runtime) and in the browser.
// ══════════════════════════════════════════════════════════════════════

export type Role = 'admin' | 'client-admin' | 'client-manager' | 'client'

/** Where each role lands after logging in. */
export const ROLE_HOME: Record<Role, string> = {
  admin: '/admin',
  'client-admin': '/companies/company-dashboard/business-admin',
  'client-manager': '/companies/company-dashboard/admin-dashboard',
  client: '/dashboard',
}

/** The protected areas and who may open them. */
export const PROTECTED_AREAS: { prefix: string; roles: Role[]; login: string }[] = [
  {
    prefix: '/companies/company-dashboard/business-admin',
    roles: ['client-admin'],
    login: '/companies/auth/login',
  },
  {
    prefix: '/companies/company-dashboard/admin-dashboard',
    roles: ['client-manager'],
    login: '/companies/auth/login',
  },
  {
    prefix: '/companies/company-dashboard/manager',
    roles: ['client-manager'],
    login: '/companies/auth/login',
  },
  // Anything else under company-dashboard: any company account.
  {
    prefix: '/companies/company-dashboard',
    roles: ['client-admin', 'client-manager'],
    login: '/companies/auth/login',
  },
  { prefix: '/dashboard', roles: ['client'], login: '/login' },
]

const inPrefix = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`)

/** The area a path belongs to (the most specific one), or null if it's public. */
export function areaFor(path: string) {
  return PROTECTED_AREAS.find((a) => inPrefix(path, a.prefix)) ?? null
}

export function isRole(v: unknown): v is Role {
  return typeof v === 'string' && v in ROLE_HOME
}

/** The session stores `roles` as a string ("client-manager") — or as ["client"] when it was
 *  missing on login (see authOptions). This turns both into one role, or null. */
export function roleOf(roles: unknown): Role | null {
  const r = Array.isArray(roles) ? roles[0] : roles
  return isRole(r) ? r : null
}

export function homeFor(roles: unknown): string {
  const role = roleOf(roles)
  return role ? ROLE_HOME[role] : '/'
}

/**
 * Where to go after logging in. A `callbackUrl` is only used when it's a path on this
 * site (never another website) that this role may open — otherwise the role's home.
 */
export function afterLogin(roles: unknown, callbackUrl: string | null | undefined): string {
  const role = roleOf(roles)
  const home = homeFor(role)
  if (
    !callbackUrl ||
    !callbackUrl.startsWith('/') ||
    callbackUrl.startsWith('//') ||
    callbackUrl.includes('\\')
  )
    return home
  const path = callbackUrl.split(/[?#]/)[0] ?? callbackUrl
  const area = areaFor(path)
  if (area && !(role && area.roles.includes(role))) return home
  return callbackUrl
}
