// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/api/company/managers/invitations/route.ts   (REPLACE)
// URL:            POST · GET  /api/company/managers/invitations
// WHAT IT DOES:   A manager invites an employee (role: 'client').
//
//   mode "existing" — unchanged: the person already has a VeroCV account → an invitation
//                     is created and shows up in their dashboard notifications.
//
//   mode "new"      — like the business admin creating a manager:
//     • creates the account (login email + password, 8+ characters, letters and numbers)
//     • creates the invitation (pending — the employee accepts it after logging in)
//     • emails the login details with Resend (utils/server/employeeWelcomeEmail.ts) to the
//       employee's private email — or to the login email if no private email is given.
//       If the email fails the account is still created and the response says so, so the
//       manager can pass the details on another way.
//
// POST body: { mode, email, firstName?, lastName?, accessLevel?, personalMessage?,
//              password? (new), sendLoginEmail? (new, default true),
//              privateEmail? (new), language? ('sv'|'en', new) }
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendEmployeeWelcomeEmail } from '@/utils/server/employeeWelcomeEmail'

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254
const relId = (v: any) => (v && typeof v === 'object' ? v.id : v)
const ACCESS = ['full', 'cv_only', 'portfolio_only'] as const
type Access = (typeof ACCESS)[number]

async function requireManagerId(req: NextRequest): Promise<number | null> {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  })
  const role = token?.roles as string | undefined
  if (!token?.id || role !== 'client-manager') return null
  const id = Number(token.id)
  return Number.isFinite(id) ? id : null
}

/** Same rule as when a business admin creates a manager. */
function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters'
  if (pw.length > 128) return 'Password is too long'
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password must contain letters and numbers'
  return null
}

function loginUrl(req: NextRequest) {
  const fixed = process.env.EMPLOYEE_LOGIN_URL || process.env.MANAGER_LOGIN_URL
  if (fixed) return fixed
  const base = process.env.NEXT_PUBLIC_SERVER_URL || req.nextUrl.origin
  return `${base.replace(/\/$/, '')}/login`
}

const fail = (message: string, status: number, fieldErrors?: Record<string, string>) =>
  NextResponse.json({ message, ...(fieldErrors ? { fieldErrors } : {}) }, { status })

export async function POST(req: NextRequest) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) return fail('Not authorized', 403)

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return fail('Invalid request', 400)

    const mode: 'existing' | 'new' = body.mode === 'new' ? 'new' : 'existing'
    const email = str(body.email, 254).toLowerCase()
    if (!email) return fail('Email is required', 400, { email: 'required' })
    if (!isEmail(email)) return fail('Enter a valid email address', 400, { email: 'invalid' })

    const accessLevel: Access = (ACCESS as readonly string[]).includes(body.accessLevel as string)
      ? (body.accessLevel as Access)
      : 'full'
    const personalMessage = str(body.personalMessage, 2000)

    const payload = await getPayload({ config })

    const { docs } = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    let employee: any = docs[0]
    let accountCreated = false
    let newAccount: {
      firstName: string
      password: string
      sendLoginEmail: boolean
      privateEmail: string
      language: 'sv' | 'en'
    } | null = null

    if (mode === 'new') {
      if (employee) {
        return fail(
          'An account with this email already exists. Choose "Existing account" instead.',
          409,
          { email: 'taken' },
        )
      }
      const firstName = str(body.firstName, 80)
      const lastName = str(body.lastName, 80)
      const password = typeof body.password === 'string' ? body.password : ''
      const sendLoginEmail = body.sendLoginEmail !== false
      const privateEmail = str(body.privateEmail, 254).toLowerCase()
      const language: 'sv' | 'en' = body.language === 'en' ? 'en' : 'sv'

      const fieldErrors: Record<string, string> = {}
      if (!firstName) fieldErrors.firstName = 'required'
      if (!lastName) fieldErrors.lastName = 'required'
      const pwProblem = passwordProblem(password)
      if (pwProblem) fieldErrors.password = 'weak'
      if (privateEmail && !isEmail(privateEmail)) fieldErrors.privateEmail = 'invalid'
      if (Object.keys(fieldErrors).length) {
        return fail(
          pwProblem && Object.keys(fieldErrors).length === 1
            ? pwProblem
            : 'Please check the highlighted fields',
          400,
          fieldErrors,
        )
      }

      try {
        employee = await payload.create({
          collection: 'users',
          data: {
            name: `${firstName} ${lastName}`.trim(),
            email,
            password,
            roles: 'client',
            authType: 'credentials',
            hasPassword: true,
          } as any,
          overrideAccess: true,
        })
        accountCreated = true
        newAccount = { firstName, password, sendLoginEmail, privateEmail, language }
      } catch (createError) {
        console.error('❌ Failed to create employee account:', createError)
        return fail('Failed to create an account for this email', 500)
      }
    } else {
      if (!employee)
        return fail('No VeroCV account found with that email', 404, { email: 'not_found' })
      if (employee.roles !== 'client')
        return fail('This email does not belong to an employee account', 400, {
          email: 'not_employee',
        })
    }

    // No duplicate pending / accepted invitations from the same manager
    const existing = await payload.find({
      collection: 'employee-invitations',
      where: {
        and: [
          { manager: { equals: managerId } },
          { employee: { equals: employee.id } },
          { status: { in: ['pending', 'accepted'] } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) return fail('An invitation to this employee already exists', 409)

    // The manager's name + their business admin's company
    const managerDoc: any = await payload.findByID({
      collection: 'users',
      id: managerId,
      depth: 0,
      overrideAccess: true,
    })
    const managerInfo: any = (
      await payload
        .find({
          collection: 'manager-info',
          where: { user: { equals: managerId } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        .catch(() => ({ docs: [] as any[] }))
    ).docs[0]
    const bossName =
      [managerInfo?.firstName, managerInfo?.lastName].filter(Boolean).join(' ').trim() ||
      managerDoc?.name ||
      ''

    let companyName = ''
    const businessAdminId = relId(managerDoc?.createdBy)
    if (businessAdminId) {
      const infoResult = await payload
        .find({
          collection: 'business-admin-info',
          where: { user: { equals: businessAdminId } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        .catch(() => ({ docs: [] as any[] }))
      companyName = (infoResult.docs[0] as any)?.company?.companyName || ''
    }

    let invitation: any
    try {
      invitation = await payload.create({
        collection: 'employee-invitations',
        data: {
          manager: managerId,
          employee: employee.id,
          bossName,
          companyName,
          employeeEmail: employee.email,
          status: 'pending',
        } as any,
        overrideAccess: true,
      })
    } catch (inviteError) {
      // Don't leave an account behind that no one is connected to.
      if (accountCreated)
        await payload
          .delete({ collection: 'users', id: employee.id, overrideAccess: true })
          .catch(() => {})
      throw inviteError
    }

    // Login details email (new accounts only)
    let emailStatus: { sent: boolean; to?: string; error?: string } = { sent: false }
    if (newAccount && newAccount.sendLoginEmail) {
      const to = newAccount.privateEmail || email
      const res = await sendEmployeeWelcomeEmail({
        to,
        firstName: newAccount.firstName,
        loginEmail: email,
        password: newAccount.password,
        loginUrl: loginUrl(req),
        managerName: bossName,
        companyName,
        accessLevel,
        note: personalMessage,
        replyTo:
          managerDoc?.email && isEmail(String(managerDoc.email))
            ? String(managerDoc.email)
            : undefined,
        language: newAccount.language,
      })
      emailStatus = { sent: res.ok, to, ...(res.error ? { error: res.error } : {}) }
    }

    return NextResponse.json(
      {
        data: invitation,
        accountCreated,
        loginEmail: accountCreated ? email : undefined,
        emailStatus,
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('❌ Failed to send invitation:', error)
    return fail('Failed to send invitation', 500)
  }
}

// GET — invitations this manager has sent (unchanged)
export async function GET(req: NextRequest) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) return fail('Not authorized', 403)

    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'employee-invitations',
      where: { manager: { equals: managerId } },
      sort: '-createdAt',
      limit: 100,
      overrideAccess: true,
    })

    const data = result.docs.map((doc: any) => ({
      id: String(doc.id),
      employeeEmail: doc.employeeEmail,
      bossName: doc.bossName,
      companyName: doc.companyName,
      status: doc.status,
      createdAt: doc.createdAt,
      respondedAt: doc.respondedAt ?? null,
      revokedBy: doc.revokedBy ?? null,
    }))

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to list sent invitations:', error)
    return fail('Failed to load invitations', 500)
  }
}
