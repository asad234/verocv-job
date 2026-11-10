// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/middleware.ts   (REPLACE your current one)
// WHAT IT DOES:   Runs on the server before these pages load:
//   • /login, /register, /auth/…  → always open (as before)
//   • /dashboard/…                 → employees only. Not logged in → /login
//   • /companies/company-dashboard/… → business admins / managers only.
//       Not logged in → /companies/auth/login          ← NEW: this was open before
//   • Logged in with the wrong role (e.g. an employee opening the manager dashboard)
//     → sent to their own dashboard.
//   After logging in, the person comes back to the page they tried to open.
//   /admin is Payload's own admin panel — it has its own login and isn't touched here.
//   Which role owns which dashboard: src/utils/authRoutes.ts
// ══════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { areaFor, homeFor, roleOf } from '@/utils/authRoutes'

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // Auth pages are always reachable.
  if (pathname.startsWith('/auth') || pathname === '/login' || pathname === '/register') {
    return NextResponse.next()
  }

  const area = areaFor(pathname)
  if (!area) return NextResponse.next()

  // Same secret as authOptions (NEXTAUTH_SECRET, else PAYLOAD_SECRET).
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  }).catch(() => null)

  // Not logged in → the right login page, then back here.
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = area.login
    url.search = `?callbackUrl=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }

  // Logged in, but this dashboard isn't theirs → their own dashboard.
  const role = roleOf((token as any).roles)
  if (!role || !area.roles.includes(role)) {
    const url = req.nextUrl.clone()
    url.pathname = homeFor(role)
    url.search = ''
    return NextResponse.redirect(url)
  }

  const res = NextResponse.next()
  // Logged-in pages must never come from a shared cache (or the back button after logging out).
  res.headers.set('Cache-Control', 'private, no-store')
  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/companies/company-dashboard/:path*',
    '/auth/:path*',
    '/login',
    '/register',
  ],
}
