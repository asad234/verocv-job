// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/employeeWelcomeEmail.ts   (NEW — server only)
// WHAT IT DOES:   The "Your VeroCV login details" email a new employee gets when their
//                 manager creates an account for them (Manager → Invitations → Create
//                 new account). Same look and same Resend setup as the manager email
//                 the business admin sends.
//
// ENV (.env) — the same ones the manager email already uses:
//   RESEND_API_KEY=re_...
//   RESEND_FROM="VeroCV <noreply@verocv.se>"     (optional)
//   EMPLOYEE_LOGIN_URL=https://verocv.se/login    (optional — falls back to MANAGER_LOGIN_URL,
//                                                  then <your site>/login)
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
const strip = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

export interface EmployeeWelcomeEmailInput {
  to: string // where the details are sent (private email, or the login email)
  firstName: string
  loginEmail: string // what they log in with
  password: string
  loginUrl: string
  managerName?: string
  companyName?: string
  accessLevel?: 'full' | 'cv_only' | 'portfolio_only'
  note?: string // the manager's personal message
  replyTo?: string // the manager's email, so the employee can just reply
  language: 'sv' | 'en'
}

const TEXT = {
  sv: {
    subject: (company?: string) =>
      `Dina inloggningsuppgifter till VeroCV${company ? ` – ${company}` : ''}`,
    hi: (n: string) => `Hej ${n}!`,
    intro: (m?: string, c?: string) =>
      `${m ? esc(m) : 'Din chef'}${c ? ` på ${esc(c)}` : ''} har skapat ett VeroCV-konto åt dig. Här är dina inloggningsuppgifter:`,
    email: 'E-post',
    password: 'Lösenord',
    login: 'Logga in på VeroCV',
    linkHint: 'Fungerar inte knappen? Kopiera länken:',
    next: (m?: string) =>
      `<b>När du har loggat in:</b> godkänn inbjudan från ${m ? esc(m) : 'din chef'} under notiserna på din dashboard. Du väljer själv vad du delar och kan ändra det när som helst.`,
    access: {
      full: 'CV:n, portfolio och personlig information',
      cv_only: 'dina CV:n',
      portfolio_only: 'din portfolio',
    },
    asks: (m: string | undefined, what: string) =>
      `${m ? esc(m) : 'Din chef'} ber om åtkomst till ${what}.`,
    noteTitle: (m?: string) => `Meddelande från ${m ? esc(m) : 'din chef'}`,
    change: 'Byt lösenord efter första inloggningen: <b>Inställningar → Säkerhet</b>.',
    keep: 'Dela inte dina inloggningsuppgifter med någon. Om du inte förväntade dig det här mejlet kan du svara på det.',
    bye: 'Välkommen!<br/>VeroCV',
  },
  en: {
    subject: (company?: string) => `Your VeroCV login details${company ? ` – ${company}` : ''}`,
    hi: (n: string) => `Hi ${n}!`,
    intro: (m?: string, c?: string) =>
      `${m ? esc(m) : 'Your manager'}${c ? ` at ${esc(c)}` : ''} has created a VeroCV account for you. Here are your login details:`,
    email: 'Email',
    password: 'Password',
    login: 'Log in to VeroCV',
    linkHint: 'Button not working? Copy this link:',
    next: (m?: string) =>
      `<b>After you log in:</b> accept the invitation from ${m ? esc(m) : 'your manager'} in the notifications on your dashboard. You decide what you share and can change it at any time.`,
    access: {
      full: 'your CVs, portfolio and personal information',
      cv_only: 'your CVs',
      portfolio_only: 'your portfolio',
    },
    asks: (m: string | undefined, what: string) =>
      `${m ? esc(m) : 'Your manager'} is asking for access to ${what}.`,
    noteTitle: (m?: string) => `Message from ${m ? esc(m) : 'your manager'}`,
    change:
      'Please change your password after you log in for the first time: <b>Settings → Security</b>.',
    keep: "Don't share your login details with anyone. If you weren't expecting this email, just reply to it.",
    bye: 'Welcome!<br/>VeroCV',
  },
}

export function buildEmployeeWelcomeEmail(i: EmployeeWelcomeEmailInput) {
  const tx = TEXT[i.language]
  const row = (label: string, value: string, mono = false) => `
    <tr>
      <td style="padding:10px 14px;color:#64748b;font-size:13px;width:110px;border-bottom:1px solid #e2e8f0">${label}</td>
      <td style="padding:10px 14px;color:#0f172a;font-size:14px;font-weight:600;border-bottom:1px solid #e2e8f0;${mono ? "font-family:'SFMono-Regular',Consolas,monospace;letter-spacing:.5px" : ''}">${esc(value)}</td>
    </tr>`
  const asks = tx.asks(i.managerName, tx.access[i.accessLevel ?? 'full'])

  const html = `<!doctype html><html><body style="margin:0;background:#f1f5f9">
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;color:#0f172a;font-size:14px;line-height:1.6">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:${NAVY};padding:22px 28px;color:#ffffff;font-size:18px;font-weight:bold">VeroCV</div>
      <div style="padding:28px">
        <p style="margin:0 0 12px;font-size:16px;font-weight:bold">${tx.hi(esc(i.firstName))}</p>
        <p style="margin:0 0 18px">${tx.intro(i.managerName, i.companyName)}</p>
        <table role="presentation" style="width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
          ${row(tx.email, i.loginEmail)}
          ${row(tx.password, i.password, true)}
        </table>
        <p style="margin:22px 0 6px;text-align:center">
          <a href="${esc(i.loginUrl)}" style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 26px;border-radius:10px">${tx.login}</a>
        </p>
        <p style="margin:0 0 18px;text-align:center;font-size:12px;color:#94a3b8">${tx.linkHint} <a href="${esc(i.loginUrl)}" style="color:#64748b">${esc(i.loginUrl)}</a></p>
        <p style="margin:0 0 8px">${asks}</p>
        <p style="margin:0 0 18px">${tx.next(i.managerName)}</p>
        ${
          i.note
            ? `<div style="margin:0 0 18px;padding:14px 16px;background:#eff6ff;border-left:3px solid ${NAVY};border-radius:8px">
            <div style="font-size:12px;font-weight:bold;color:${NAVY};margin-bottom:4px">${tx.noteTitle(i.managerName)}</div>
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
    strip(tx.intro(i.managerName, i.companyName)),
    '',
    `${tx.email}: ${i.loginEmail}`,
    `${tx.password}: ${i.password}`,
    '',
    `${tx.login}: ${i.loginUrl}`,
    '',
    strip(asks),
    strip(tx.next(i.managerName)),
    i.note ? `\n${strip(tx.noteTitle(i.managerName))}:\n${i.note}\n` : '',
    strip(tx.change),
  ].join('\n')

  return { subject: tx.subject(i.companyName), html, text }
}

/** Sends it. Never throws — returns { ok, error } so a mail problem doesn't undo the account. */
export async function sendEmployeeWelcomeEmail(
  i: EmployeeWelcomeEmailInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set — employee login email not sent')
    return { ok: false, error: 'Email is not configured on the server (RESEND_API_KEY missing).' }
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { subject, html, text } = buildEmployeeWelcomeEmail(i)
    const res = await resend.emails.send({
      from: FROM,
      to: [i.to],
      ...(i.replyTo ? { replyTo: i.replyTo } : {}),
      subject,
      html,
      text,
    })
    if (res.error) {
      console.error('❌ Resend (employee login email) failed:', res.error)
      return { ok: false, error: res.error.message || 'The email could not be sent.' }
    }
    return { ok: true }
  } catch (e: any) {
    console.error('❌ Resend (employee login email) threw:', e)
    return { ok: false, error: e?.message || 'The email could not be sent.' }
  }
}
