// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/managerWelcomeEmail.ts   (NEW — server only)
// WHAT IT DOES:   The "Your VeroCV login details" email a new manager gets when a
//                 business admin creates their account. Sent with Resend, the
//                 same way as /api/contact and /api/book-demo.
//
// ENV (.env):
//   RESEND_API_KEY=re_...                       (already set)
//   RESEND_FROM="VeroCV <noreply@verocv.se>"    (optional — same "from" as your other emails)
//   MANAGER_LOGIN_URL=https://verocv.se/login   (optional — where the "Log in" button goes;
//                                                defaults to <your site>/login)
// ══════════════════════════════════════════════════════════════════════

import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM || 'VeroCV <noreply@verocv.se>'
const NAVY = '#051650'

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
const nl2br = (s: string) => esc(s).replace(/\n/g, '<br/>')

export interface WelcomeEmailInput {
  to: string // the manager's personal email — where the details are sent
  firstName: string
  loginEmail: string // the work email they log in with
  password: string
  loginUrl: string
  adminName?: string
  companyName?: string
  department?: string
  note?: string
  replyTo?: string // the admin's email, so the manager can just reply
  language: 'sv' | 'en'
}

const TEXT = {
  sv: {
    subject: (company?: string) =>
      `Dina inloggningsuppgifter till VeroCV${company ? ` – ${company}` : ''}`,
    hi: (n: string) => `Hej ${n}!`,
    intro: (admin?: string, company?: string) =>
      `${admin ? esc(admin) : 'Din administratör'}${company ? ` på ${esc(company)}` : ''} har skapat ett chefskonto åt dig i VeroCV. Här är dina inloggningsuppgifter:`,
    email: 'E-post',
    password: 'Lösenord',
    department: 'Avdelning',
    login: 'Logga in på VeroCV',
    noteTitle: (admin?: string) => `Meddelande från ${admin ? esc(admin) : 'din administratör'}`,
    change: 'Byt lösenord när du har loggat in första gången: <b>Inställningar → Säkerhet</b>.',
    keep: 'Dela inte dina inloggningsuppgifter med någon. Om du inte förväntade dig det här mejlet kan du svara på det.',
    bye: 'Välkommen!<br/>VeroCV',
    linkHint: 'Fungerar inte knappen? Kopiera länken:',
  },
  en: {
    subject: (company?: string) => `Your VeroCV login details${company ? ` – ${company}` : ''}`,
    hi: (n: string) => `Hi ${n}!`,
    intro: (admin?: string, company?: string) =>
      `${admin ? esc(admin) : 'Your administrator'}${company ? ` at ${esc(company)}` : ''} has created a manager account for you in VeroCV. Here are your login details:`,
    email: 'Email',
    password: 'Password',
    department: 'Department',
    login: 'Log in to VeroCV',
    noteTitle: (admin?: string) => `Message from ${admin ? esc(admin) : 'your administrator'}`,
    change:
      'Please change your password after you log in for the first time: <b>Settings → Security</b>.',
    keep: "Don't share your login details with anyone. If you weren't expecting this email, just reply to it.",
    bye: 'Welcome aboard!<br/>VeroCV',
    linkHint: 'Button not working? Copy this link:',
  },
}

export function buildWelcomeEmail(i: WelcomeEmailInput) {
  const tx = TEXT[i.language]
  const row = (label: string, value: string, mono = false) => `
    <tr>
      <td style="padding:10px 14px;color:#64748b;font-size:13px;width:120px;border-bottom:1px solid #e2e8f0">${label}</td>
      <td style="padding:10px 14px;color:#0f172a;font-size:14px;font-weight:600;border-bottom:1px solid #e2e8f0;${mono ? "font-family:'SFMono-Regular',Consolas,monospace;letter-spacing:.5px" : ''}">${esc(value)}</td>
    </tr>`

  const html = `<!doctype html><html><body style="margin:0;background:#f1f5f9">
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;color:#0f172a;font-size:14px;line-height:1.6">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:${NAVY};padding:22px 28px;color:#ffffff;font-size:18px;font-weight:bold">VeroCV</div>
      <div style="padding:28px">
        <p style="margin:0 0 12px;font-size:16px;font-weight:bold">${tx.hi(esc(i.firstName))}</p>
        <p style="margin:0 0 18px">${tx.intro(i.adminName, i.companyName)}</p>
        <table role="presentation" style="width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
          ${row(tx.email, i.loginEmail)}
          ${row(tx.password, i.password, true)}
          ${i.department ? row(tx.department, i.department) : ''}
        </table>
        <p style="margin:22px 0 6px;text-align:center">
          <a href="${esc(i.loginUrl)}" style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 26px;border-radius:10px">${tx.login}</a>
        </p>
        <p style="margin:0 0 18px;text-align:center;font-size:12px;color:#94a3b8">${tx.linkHint} <a href="${esc(i.loginUrl)}" style="color:#64748b">${esc(i.loginUrl)}</a></p>
        ${
          i.note
            ? `<div style="margin:0 0 18px;padding:14px 16px;background:#eff6ff;border-left:3px solid ${NAVY};border-radius:8px">
            <div style="font-size:12px;font-weight:bold;color:${NAVY};margin-bottom:4px">${tx.noteTitle(i.adminName)}</div>
            <div>${nl2br(i.note)}</div></div>`
            : ''
        }
        <p style="margin:0 0 8px">${tx.change}</p>
        <p style="margin:0 0 18px;color:#64748b;font-size:13px">${tx.keep}</p>
        <p style="margin:0">${tx.bye}</p>
      </div>
    </div>
  </div></body></html>`

  const text = [
    tx.hi(i.firstName),
    '',
    tx.intro(i.adminName, i.companyName).replace(/<[^>]+>/g, ''),
    '',
    `${tx.email}: ${i.loginEmail}`,
    `${tx.password}: ${i.password}`,
    i.department ? `${tx.department}: ${i.department}` : '',
    '',
    `${tx.login}: ${i.loginUrl}`,
    i.note ? `\n${tx.noteTitle(i.adminName).replace(/<[^>]+>/g, '')}:\n${i.note}\n` : '',
    tx.change.replace(/<[^>]+>/g, ''),
  ]
    .filter((l) => l !== null)
    .join('\n')

  return { subject: tx.subject(i.companyName), html, text }
}

/** Sends it. Never throws — returns { ok, error } so the account creation isn't undone by a mail problem. */
export async function sendManagerWelcomeEmail(
  i: WelcomeEmailInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set — manager login email not sent')
    return { ok: false, error: 'Email is not configured on the server (RESEND_API_KEY missing).' }
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { subject, html, text } = buildWelcomeEmail(i)
    const res = await resend.emails.send({
      from: FROM,
      to: [i.to],
      ...(i.replyTo ? { replyTo: i.replyTo } : {}),
      subject,
      html,
      text,
    })
    if (res.error) {
      console.error('❌ Resend (manager login email) failed:', res.error)
      return { ok: false, error: res.error.message || 'The email could not be sent.' }
    }
    return { ok: true }
  } catch (e: any) {
    console.error('❌ Resend (manager login email) threw:', e)
    return { ok: false, error: e?.message || 'The email could not be sent.' }
  }
}
