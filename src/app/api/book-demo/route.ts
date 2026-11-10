// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/book-demo/route.ts
// URL:            POST /api/book-demo
// WHAT IT DOES:   "Book a demo" form (no time picker) on /companies/book-demo → emails the request to
//                 info@verocv.se with Resend (same setup as the support/contact form),
//                 and sends the person a short confirmation.
//
// ENV (.env):
//   RESEND_API_KEY=re_...                     (already used by /api/contact)
//   DEMO_REQUEST_TO=info@verocv.se            (optional, defaults to info@verocv.se)
//   RESEND_FROM="VeroCV <noreply@verocv.se>"  (optional — must be a domain verified in Resend;
//                                              use the same "from" as your /api/contact route)
//
// If your app folder has no "(frontend)" group, use the same path without it:
//   src/app/api/book-demo/route.ts
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const TO = process.env.DEMO_REQUEST_TO || 'info@verocv.se'
const FROM = process.env.RESEND_FROM || 'VeroCV <noreply@verocv.se>'

/* ─── Light spam protection: max 5 requests per IP per 10 minutes (per server instance) ─── */
const hits = new Map<string, number[]>()
function rateLimited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > 5
}

const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254
const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
const nl2br = (s: string) => esc(s).replace(/\n/g, '<br/>')

export async function POST(req: NextRequest) {
  try {
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'unknown'
    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429 },
      )
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object')
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

    // Honeypot: real visitors never fill this hidden field.
    if (str(body.website)) return NextResponse.json({ ok: true }, { status: 200 })

    const lang: 'sv' | 'en' = body.language === 'en' ? 'en' : 'sv'
    const f = {
      firstName: str(body.firstName, 80),
      lastName: str(body.lastName, 80),
      email: str(body.email, 254).toLowerCase(),
      phone: str(body.phone, 40),
      role: str(body.role, 120),
      companyName: str(body.companyName, 160),
      companySize: str(body.companySize, 40),
      industry: str(body.industry, 80),
      consultantCount: str(body.consultantCount, 40),
      interests: str(body.interests, 3000),
      challenge: str(body.challenge, 3000),
      timeline: str(body.timeline, 80),
      source: str(body.source, 80),
      sourceOther: str(body.sourceOther, 200),
    }

    // Server-side validation (mirrors the form).
    const missing = (
      [
        'firstName',
        'lastName',
        'email',
        'role',
        'companyName',
        'companySize',
        'industry',
        'consultantCount',
        'source',
      ] as const
    ).filter((k) => !f[k])
    if (missing.length)
      return NextResponse.json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 })
    if (!isEmail(f.email))
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })

    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is not set — demo request not sent')
      return NextResponse.json({ error: 'Email is not configured on the server.' }, { status: 500 })
    }
    const resend = new Resend(process.env.RESEND_API_KEY)

    const fullName = `${f.firstName} ${f.lastName}`.trim()
    const source = f.sourceOther ? `${f.source} — ${f.sourceOther}` : f.source

    /* ─── 1. Internal email to info@verocv.se ─── */
    const row = (label: string, value: string) =>
      value
        ? `<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:13px;vertical-align:top;white-space:nowrap">${esc(label)}</td><td style="padding:6px 0;color:#0f172a;font-size:14px">${nl2br(value)}</td></tr>`
        : ''
    const section = (title: string, rows: string) =>
      `<h3 style="margin:24px 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#051650">${esc(title)}</h3><table style="border-collapse:collapse;width:100%">${rows}</table>`

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#0f172a">
        <h2 style="margin:0 0 4px;color:#051650">Ny demoförfrågan</h2>
        <p style="margin:0 0 16px;color:#475569;font-size:14px">${esc(fullName)} från <strong>${esc(f.companyName)}</strong> vill boka en demo.</p>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px 16px;font-size:14px">
          Kontakta ${esc(f.firstName)} för att boka in en tid (30 min).
        </div>
        ${section('Kontaktuppgifter', row('Namn', fullName) + row('E-post', f.email) + row('Telefon', f.phone) + row('Roll', f.role))}
        ${section('Företag', row('Företag', f.companyName) + row('Anställda', f.companySize) + row('Bransch', f.industry) + row('Antal konsulter', f.consultantCount))}
        ${section('Frågor', row('Vill veta mer om', f.interests) + row('Största utmaning idag', f.challenge) + row('Vill komma igång', f.timeline) + row('Hörde om VeroCV via', source))}
        <p style="margin-top:28px;color:#94a3b8;font-size:12px">Svara direkt på detta mejl för att kontakta ${esc(fullName)}. Formulärets språk: ${lang === 'sv' ? 'svenska' : 'engelska'}.</p>
      </div>`

    const text = [
      `Ny demoförfrågan: ${fullName} (${f.companyName}) — kontakta för att boka in en tid (30 min)`,
      ' ',
      `E-post: ${f.email}`,
      f.phone && `Telefon: ${f.phone}`,
      `Roll: ${f.role}`,
      `Företag: ${f.companyName} · ${f.companySize} anställda · ${f.industry} · ${f.consultantCount} konsulter`,
      ' ',
      f.interests && `Vill veta mer om: ${f.interests}`,
      f.challenge && `Största utmaning: ${f.challenge}`,
      f.timeline && `Vill komma igång: ${f.timeline}`,
      `Hörde om VeroCV via: ${source}`,
    ]
      .filter((l): l is string => typeof l === 'string' && l !== '')
      .join('\n')

    const internal = await resend.emails.send({
      from: FROM,
      to: [TO],
      replyTo: f.email,
      subject: `Demoförfrågan: ${f.companyName} — ${fullName}`,
      html,
      text,
    })
    if (internal.error) {
      console.error('❌ Resend (demo request) failed:', internal.error)
      return NextResponse.json(
        { error: 'Could not send your request. Please try again.' },
        { status: 502 },
      )
    }

    /* ─── 2. Confirmation to the person who booked (best effort) ─── */
    const confirm =
      lang === 'sv'
        ? {
            subject: 'Vi har tagit emot din demoförfrågan — VeroCV',
            body: `<p>Hej ${esc(f.firstName)},</p>
            <p>Tack för att du vill träffa oss! Vi har tagit emot din förfrågan om en demo av VeroCV.</p>
            <p>Vi hör av oss inom en arbetsdag för att hitta en tid som passar dig (demon tar cirka 30 minuter). Har du frågor redan nu? Svara bara på detta mejl.</p>
            <p>Vänliga hälsningar,<br/>VeroCV</p>`,
          }
        : {
            subject: 'We received your demo request — VeroCV',
            body: `<p>Hi ${esc(f.firstName)},</p>
            <p>Thanks for your interest in VeroCV! We've received your demo request.</p>
            <p>We'll get back to you within one business day to find a time that suits you (the demo takes about 30 minutes). Any questions in the meantime? Just reply to this email.</p>
            <p>Best regards,<br/>VeroCV</p>`,
          }
    const confirmation = await resend.emails.send({
      from: FROM,
      to: [f.email],
      replyTo: TO,
      subject: confirm.subject,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;font-size:14px;line-height:1.6">${confirm.body}</div>`,
    })
    if (confirmation.error) console.warn('⚠️ Demo confirmation email failed:', confirmation.error)

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('❌ Book demo failed:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
