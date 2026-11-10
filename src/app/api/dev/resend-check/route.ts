// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/dev/resend-check/route.ts   (TEMPORARY — delete when fixed)
// URL:            GET /api/dev/resend-check      (open it in the browser while logged in as admin)
// WHAT IT DOES:   Shows which RESEND_API_KEY the running server really has (masked)
//                 and asks Resend whether it accepts it — no email is sent.
//                 Only works in development, and only for client-admin / admin.
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production')
    return NextResponse.json({ message: 'Disabled in production' }, { status: 404 })
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  })
  if (!token || (token.roles !== 'client-admin' && token.roles !== 'admin'))
    return NextResponse.json({ message: 'Log in as an admin first' }, { status: 403 })

  const raw = process.env.RESEND_API_KEY
  const key = raw ?? ''
  const problems: string[] = []
  if (!raw) problems.push('RESEND_API_KEY is not set in the running server')
  if (key !== key.trim()) problems.push('The key has spaces or a line break at the start/end')
  if (/^["']|["']$/.test(key)) problems.push('The key still has quote characters around it')
  if (key && !key.startsWith('re_')) problems.push('The key does not start with "re_"')
  if (key.includes('…') || key.includes('...'))
    problems.push('The key contains "…" — it was copied from the shortened list in the dashboard')

  // Ask Resend about the key (lists domains, sends nothing).
  let resend: { status: number; answer: unknown } | null = null
  if (key) {
    try {
      const r = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${key.trim()}` },
      })
      const body: any = await r.json().catch(() => null)
      resend = {
        status: r.status,
        answer: r.ok
          ? { ok: true, domains: (body?.data ?? []).map((d: any) => `${d.name} (${d.status})`) }
          : body,
      }
    } catch (e: any) {
      resend = { status: 0, answer: `Could not reach Resend: ${e?.message}` }
    }
  }

  const from = process.env.RESEND_FROM || 'VeroCV <noreply@verocv.se>'
  return NextResponse.json(
    {
      key: key ? `${key.slice(0, 6)}…${key.slice(-4)}` : null,
      length: key.length,
      problems,
      resend,
      from,
      hint:
        (resend?.answer as any)?.name === 'restricted_api_key'
          ? 'This is a valid "sending access" key (it may send emails, not list domains). The key is fine.'
          : resend?.status === 200
            ? 'Resend accepts this key. If emails still fail, look at the domain list: the domain in "from" must be "verified".'
            : resend?.status === 401
              ? 'Resend rejects this exact value. Compare the first/last characters with the key you created — it is NOT the same one, or it is incomplete.'
              : undefined,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
