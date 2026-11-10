// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/create-manager/route.ts
// URL:            POST /api/company/create-manager
// WHAT IT DOES:   A business admin creates a manager account.
//   • workEmail      → the manager LOGS IN with this (users.email)
//   • personalEmail  → where the "Your VeroCV login details" email goes
//                      (saved as manager-info.privateEmail)
//   The email is sent with Resend (utils/server/managerWelcomeEmail.ts). If it
//   fails, the account is still created and the response says so, so the admin
//   can pass the details on another way.
//
// Body: { firstName, lastName, workEmail, personalEmail?, password, phone?, jobTitle?,
//         department?, accessLevel?, sendInvite?, note?, language? ('sv'|'en') }
//       (`email` is still accepted as the work email, for older clients)
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendManagerWelcomeEmail } from '@/utils/server/managerWelcomeEmails'

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254
const relId = (v: any) => (v && typeof v === 'object' ? v.id : v)

/** 8+ characters with a letter and a number (the form suggests stronger ones). */
function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters'
  if (pw.length > 128) return 'Password is too long'
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password must contain letters and numbers'
  return null
}

function loginUrl(req: NextRequest) {
  if (process.env.MANAGER_LOGIN_URL) return process.env.MANAGER_LOGIN_URL
  const base = process.env.NEXT_PUBLIC_SERVER_URL || req.nextUrl.origin
  return `${base.replace(/\/$/, '')}/login`
}

export async function POST(req: NextRequest) {
  try {
    // 1. Only a signed-in client-admin (or full admin) may create manager accounts.
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
    })
    const requesterRole = token?.roles as string | undefined
    if (!token?.id || (requesterRole !== 'client-admin' && requesterRole !== 'admin')) {
      return NextResponse.json(
        { message: 'Not authorized to create manager accounts' },
        { status: 403 },
      )
    }
    const adminId = Number(token.id)

    // 2. Validate
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })

    const firstName = str(body.firstName, 80)
    const lastName = str(body.lastName, 80)
    const workEmail = str(body.workEmail ?? body.email, 254).toLowerCase()
    const personalEmail = str(body.personalEmail, 254).toLowerCase()
    const password = typeof body.password === 'string' ? body.password : ''
    const phone = str(body.phone, 40)
    const jobTitle = str(body.jobTitle, 120)
    const department = str(body.department, 120)
    const accessLevel = str(body.accessLevel, 60)
    const note = str(body.note, 2000)
    const sendInvite = body.sendInvite !== false
    const language: 'sv' | 'en' = body.language === 'en' ? 'en' : 'sv'

    const fieldErrors: Record<string, string> = {}
    if (!firstName) fieldErrors.firstName = 'required'
    if (!lastName) fieldErrors.lastName = 'required'
    if (!workEmail) fieldErrors.workEmail = 'required'
    else if (!isEmail(workEmail)) fieldErrors.workEmail = 'invalid'
    if (sendInvite && !personalEmail) fieldErrors.personalEmail = 'required'
    else if (personalEmail && !isEmail(personalEmail)) fieldErrors.personalEmail = 'invalid'
    const pwProblem = passwordProblem(password)
    if (pwProblem) fieldErrors.password = 'weak'
    if (Object.keys(fieldErrors).length) {
      return NextResponse.json(
        {
          message:
            pwProblem && Object.keys(fieldErrors).length === 1
              ? pwProblem
              : 'Please check the highlighted fields',
          fieldErrors,
        },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })

    // 3. One account per login email
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: workEmail } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) {
      return NextResponse.json(
        {
          message: 'A user with this work email already exists',
          fieldErrors: { workEmail: 'taken' },
        },
        { status: 409 },
      )
    }

    // The admin's own details: name for the email, company for the manager's settings.
    const [adminUser, adminInfoRes] = await Promise.all([
      payload.findByID({
        collection: 'users',
        id: adminId,
        depth: 0,
        overrideAccess: true,
        disableErrors: true,
      }) as Promise<any>,
      payload
        .find({
          collection: 'business-admin-info',
          where: { user: { equals: adminId } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        .catch(() => ({ docs: [] as any[] })),
    ])
    const adminInfo: any = (adminInfoRes.docs as any[])[0]
    const companyName: string = adminInfo?.company?.companyName || ''
    const adminName: string =
      [adminInfo?.firstName, adminInfo?.lastName].filter(Boolean).join(' ').trim() ||
      adminUser?.name ||
      ''

    // 4. Create the account
    const newManager: any = await payload.create({
      collection: 'users',
      data: {
        name: `${firstName} ${lastName}`,
        email: workEmail,
        password,
        roles: 'client-manager',
        authType: 'credentials',
        hasPassword: true,
        onboardingCompleted: true,
        accessLevel,
        status: 'active',
        createdBy: adminId,
      } as any,
      overrideAccess: true,
    })

    // 5. Manager's own settings record (the Users afterChange hook may already have made one)
    try {
      const info = {
        firstName,
        lastName,
        email: workEmail,
        ...(personalEmail ? { privateEmail: personalEmail } : {}),
        phone,
        jobTitle,
        department: { department, ...(companyName ? { companyName } : {}) },
      }
      const existingInfo = await payload.find({
        collection: 'manager-info',
        where: { user: { equals: newManager.id } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      const doc: any = existingInfo.docs[0]
      if (doc) {
        await payload.update({
          collection: 'manager-info',
          id: doc.id,
          data: info as any,
          overrideAccess: true,
        })
      } else {
        await payload.create({
          collection: 'manager-info',
          data: { user: newManager.id, ...info } as any,
          overrideAccess: true,
        })
      }
    } catch (infoError) {
      console.error('⚠️ Failed to save manager-info on creation:', infoError)
    }

    // 6. Login details email → personal email
    let email: { sent: boolean; to?: string; error?: string } = { sent: false }
    if (sendInvite && personalEmail) {
      const res = await sendManagerWelcomeEmail({
        to: personalEmail,
        firstName,
        loginEmail: workEmail,
        password,
        loginUrl: loginUrl(req),
        adminName,
        companyName,
        department,
        note,
        replyTo:
          adminUser?.email && isEmail(String(adminUser.email))
            ? String(adminUser.email)
            : undefined,
        language,
      })
      email = { sent: res.ok, to: personalEmail, ...(res.error ? { error: res.error } : {}) }
    }

    return NextResponse.json(
      {
        id: String(newManager.id ?? relId(newManager)),
        email: workEmail,
        loginEmail: workEmail,
        personalEmail,
        emailStatus: email,
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error: any) {
    console.error('❌ Failed to create manager account:', error)
    return NextResponse.json({ message: 'Failed to create manager account' }, { status: 500 })
  }
}
